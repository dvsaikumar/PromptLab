import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure PDF worker
// We are serving the worker locally from /public to avoid CDN version mismatch
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

export interface FileContent {
    name: string;
    type: string;
    content: string;
}

export const processFile = async (file: File): Promise<string> => {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
        // 1. Text / Markdown / CSV / JSON
        if (
            fileType === 'text/plain' ||
            fileType === 'text/markdown' ||
            fileType === 'text/csv' ||
            fileType === 'application/json' ||
            fileName.endsWith('.txt') ||
            fileName.endsWith('.md') ||
            fileName.endsWith('.csv') ||
            fileName.endsWith('.json')
        ) {
            return await file.text();
        }

        // 2. Word Documents (.docx)
        if (
            fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            fileName.endsWith('.docx')
        ) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        }

        // 3. PDF Documents
        if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map((item: any) => item.str);
                text += strings.join(' ') + '\n';
            }
            return text;
        }

        // 4. Images (OCR)
        if (fileType.startsWith('image/')) {
            const { data: { text } } = await Tesseract.recognize(
                file,
                'eng'
                // { logger: m => console.log(m) } // Optional progress logging
            );
            return text;
        }

        throw new Error(`Unsupported file type: ${fileType}`);

    } catch (error) {
        console.error("File processing error:", error);
        throw new Error(`Failed to process ${file.name}`);
    }
};
