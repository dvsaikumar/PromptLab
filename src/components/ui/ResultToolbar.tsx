import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { VerticalDivider } from '@/components/ui/VerticalDivider';
import { FileText, FileJson, AlignLeft, Save, Copy, Check, FilePlus } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface ResultToolbarProps {
    onExport: (format: 'md' | 'txt' | 'json') => void;
    onSave?: () => void;
    onSaveAs?: () => void;
    contentToCopy: string;
    className?: string;
}

export const ResultToolbar: React.FC<ResultToolbarProps> = ({ onExport, onSave, onSaveAs, contentToCopy, className }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!contentToCopy) return;
        await navigator.clipboard.writeText(contentToCopy);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={clsx("flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/60 shadow-sm", className)}>
            <Button
                size="sm"
                variant="ghost"
                onClick={() => onExport('md')}
                leftIcon={<FileText size={16} />}
                className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            >
                Markdown
            </Button>

            <VerticalDivider height="h-3" />

            <Button
                size="sm"
                variant="ghost"
                onClick={() => onExport('txt')}
                leftIcon={<AlignLeft size={16} />}
                className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
            >
                Text
            </Button>

            <VerticalDivider height="h-3" />

            <Button
                size="sm"
                variant="ghost"
                onClick={() => onExport('json')}
                leftIcon={<FileJson size={16} />}
                className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
            >
                JSON
            </Button>

            <VerticalDivider height="h-3" />

            <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 min-w-[80px]"
            >
                {copied ? 'Copied' : 'Copy'}
            </Button>

            {onSave && (
                <>
                    <VerticalDivider height="h-3" />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onSave}
                        leftIcon={<Save size={16} />}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                        Save
                    </Button>
                </>
            )}

            {onSaveAs && (
                <>
                    <VerticalDivider height="h-3" />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onSaveAs}
                        leftIcon={<FilePlus size={16} />}
                        className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                    >
                        Save As
                    </Button>
                </>
            )}
        </div>
    );
};
