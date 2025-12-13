import React, { useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    Connection,
    useNodesState,
    useEdgesState,
    MarkerType,
    Node
} from 'reactflow';
import 'reactflow/dist/style.css';

import { PageTemplate } from '@/components/ui/PageTemplate';
import { Button } from '@/components/ui/Button';
import { PromptNode } from '@/components/chain/PromptNode';
import { NodeConfigurationDrawer } from '@/components/chain/NodeConfigurationDrawer';
import { Workflow, Plus, Play, Save, Loader2, X, Copy, Sparkles, LayoutList, FileText, FileJson, AlignLeft, FileType, Printer, Upload, Link } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { usePrompt } from '@/contexts/PromptContext';
import { LLMService } from '@/services/llm';
import { LLMProviderId } from '@/types';
import { promptDB } from '@/services/database';
import { vectorDb } from '@/services/vectorDbService';
import { SavePromptModal } from '@/components/SavePromptModal';
import { processFile } from '@/utils/fileProcessor';

const nodeTypes = {
    promptNode: PromptNode,
};

interface PromptNodeData {
    label: string;
    typ: string;
    prompt: string;
    status: 'idle' | 'running' | 'complete' | 'error';
    output: string;
    providerId?: LLMProviderId | '';
    personaId?: string;
    complexity?: string;
    tone?: string;
    files?: { name: string, size: string, content: string }[];
    onNodeClick?: (id: string) => void;
}

const initialNodes: Node<PromptNodeData>[] = [
    {
        id: '1',
        type: 'promptNode',
        position: { x: 50, y: 150 },
        data: {
            label: '1. Topic & Strategy',
            typ: 'Strategy',
            prompt: 'Identify 3 high-impact, trending topics related to "Enterprise AI Agents" that would appeal to CTOs. For the best one, define a content strategy and target audience.',
            status: 'idle',
            output: '',
            providerId: '',
            personaId: 'product-manager',
            complexity: 'high',
            tone: 'strategic'
        }
    },
    {
        id: '2',
        type: 'promptNode',
        position: { x: 400, y: 50 },
        data: {
            label: '2. Detailed Outline',
            typ: 'Structure',
            prompt: 'Based on the selected strategy below, create a comprehensive, section-by-section outline. Include key takeaways for each section.\n\nStrategy:\n{{input}}',
            status: 'idle',
            output: '',
            providerId: '',
            personaId: 'prompt-engineer',
            complexity: 'medium',
            tone: 'structured'
        }
    },
    {
        id: '3',
        type: 'promptNode',
        position: { x: 750, y: 150 },
        data: {
            label: '3. First Draft',
            typ: 'Writing',
            prompt: 'Write a full-length, authoritative article based on the outline. Use industry-standard terminology and focus on actionable insights.\n\nOutline:\n{{input}}',
            status: 'idle',
            output: '',
            providerId: '',
            personaId: 'technical-writer',
            complexity: 'high',
            tone: 'professional'
        }
    },
    {
        id: '4',
        type: 'promptNode',
        position: { x: 1100, y: 50 },
        data: {
            label: '4. Refinement & Polish',
            typ: 'Editing',
            prompt: 'Act as a Senior Editor. Review the draft for clarity, flow, and impact. Improve the hook, strengthen the conclusion, and fix any weak sentence structures. Output the FINAL polished version.\n\nDraft:\n{{input}}',
            status: 'idle',
            output: '',
            providerId: '',
            personaId: 'expert',
            complexity: 'high',
            tone: 'inspirational'
        }
    }
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' } },
    { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' } },
    { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' } }
];

interface ChainReactionPageProps {
    isSidebarOpen: boolean;
}

export const ChainReactionPage: React.FC<ChainReactionPageProps> = ({ isSidebarOpen }) => {
    const { llmConfig } = usePrompt();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [finalResult, setFinalResult] = useState<{ isOpen: boolean, steps: { id: string, label: string, output: string, prompt: string }[], isCompiled: boolean } | null>(null);
    const [resultTab, setResultTab] = useState<'steps' | 'compiled' | 'document' | 'prompt'>('steps');
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [viewFormat, setViewFormat] = useState<'markdown' | 'text' | 'json'>('markdown');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    // Global Context Files
    const [globalFiles, setGlobalFiles] = useState<{ name: string, content: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGlobalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const toastId = toast.loading("Processing global context...");
            try {
                const content = await processFile(file);
                setGlobalFiles(prev => [...prev, { name: file.name, content }]);
                toast.success("Context file added", { id: toastId });
            } catch (error: any) {
                console.error(error);
                toast.error("Failed to process file", { id: toastId });
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeGlobalFile = (index: number) => {
        setGlobalFiles(prev => prev.filter((_, i) => i !== index));
        toast.success("Context file removed");
    };

    const handleExportWord = () => {
        const content = document.getElementById('document-preview-content')?.innerHTML || '';
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
        const postHtml = "</body></html>";
        const html = preHtml + content + postHtml;

        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        });

        const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);

        // Create download link
        const downloadLink = document.createElement("a");
        document.body.appendChild(downloadLink);

        if ((navigator as any).msSaveOrOpenBlob) {
            (navigator as any).msSaveOrOpenBlob(blob, 'chain-reaction-output.doc');
        } else {
            downloadLink.href = url;
            downloadLink.download = 'chain-reaction-output.doc';
            downloadLink.click();
        }

        document.body.removeChild(downloadLink);
        toast.success("Exported to Word");
    };

    const handlePrint = () => {
        const content = document.getElementById('document-preview-content')?.innerHTML || '';
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Chain Reaction Output</title>');
            printWindow.document.write('<style>body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; line-height: 1.6; color: #334155; } img { max-width: 100%; } h1, h2, h3 { color: #1e293b; } pre { background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; } blockquote { border-left: 4px solid #cbd5e1; padding-left: 15px; color: #64748b; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(content);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const handleSavePrompt = async (title: string) => {
        if (!finalResult) return;

        try {
            const promptContent = finalResult.steps.map(s => `### ${s.label} ###\n${s.output}`).join('\n\n');
            const dataToSave = {
                title,
                framework: 'Chain Reaction',
                prompt: promptContent,
                fields: JSON.stringify(finalResult.steps),
                tones: '[]',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await promptDB.savePrompt(dataToSave);


            toast.success("Chain reaction output saved to library!");

            // Save to Vector DB
            if (vectorDb.isAvailable()) {
                const vector = vectorDb.generateDummyEmbedding(promptContent);
                await vectorDb.addDocuments('prompts', [{
                    title,
                    text: promptContent,
                    category: 'chain-reaction',
                    vector,
                    timestamp: new Date().toISOString()
                }]);
            }

            setIsSaveModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save prompt");
        }
    };

    // Keep refs to current state for async execution
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);

    // Update refs when state changes
    React.useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
    }, [nodes, edges]);

    const handleNodeClick = useCallback((id: string) => {
        setSelectedNodeId(id);
    }, []);

    // Hydrate initial nodes with handlers
    React.useEffect(() => {
        setNodes((nds) => nds.map((node) => {
            if (node.data.onNodeClick) return node; // Already hydrated
            return {
                ...node,
                data: {
                    ...node.data,
                    onNodeClick: handleNodeClick
                }
            };
        }));
    }, [setNodes, handleNodeClick]);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

    const addNode = () => {
        const id = `${nodes.length + 1}`;
        const newNode: Node<PromptNodeData> = {
            id,
            type: 'promptNode',
            position: { x: 50 + (nodes.length * 50), y: 50 + (nodes.length * 50) },
            data: {
                label: `Step ${id}`,
                prompt: '',
                typ: 'Custom Step',
                status: 'idle',
                output: '',
                providerId: '',
                personaId: 'prompt-engineer',
                complexity: 'medium',
                onNodeClick: handleNodeClick
            },
        };
        setNodes((nds) => nds.concat(newNode));
        setSelectedNodeId(id); // Auto-select new node
    };

    const updateNodeData = (id: string, partialData: Partial<PromptNodeData>) => {
        setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...partialData } } : n));
    };

    const handleDrawerSave = () => {
        setSelectedNodeId(null);
        toast.success("Node configuration saved");
    };

    const handleDrawerUpdate = (updatedData: any) => {
        if (selectedNodeId) {
            updateNodeData(selectedNodeId, updatedData);
        }
    };

    const compileChain = async () => {
        setIsRunning(true);
        toast.loading("Compiling Chain Strategy...", { id: "chain-compile" });

        const currentNodes = [...nodesRef.current];
        const currentEdges = [...edgesRef.current];

        // Map to store simulated outputs (placeholders)
        const outputs = new Map<string, string>();

        // Build adjacency list (Reuse logic)
        const adj = new Map<string, string[]>();
        const inDegree = new Map<string, number>();

        currentNodes.forEach(n => {
            adj.set(n.id, []);
            inDegree.set(n.id, 0);
        });

        currentEdges.forEach(e => {
            if (adj.has(e.source) && inDegree.has(e.target)) {
                adj.get(e.source)?.push(e.target);
                inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
            }
        });

        // Topological Sort
        const queue: string[] = [];
        currentNodes.forEach(n => {
            if ((inDegree.get(n.id) || 0) === 0) {
                queue.push(n.id);
            }
        });

        const executionSteps: { id: string, label: string, output: string, prompt: string }[] = [];

        try {
            while (queue.length > 0) {
                const nodeId = queue.shift()!;
                const node = nodesRef.current.find(n => n.id === nodeId) || currentNodes.find(n => n.id === nodeId)!;

                // 1. Prepare Input (Simulated)
                const incomingEdges = currentEdges.filter(e => e.target === nodeId);
                const parentOutputs = incomingEdges.map(e => outputs.get(e.source) || '').filter(Boolean);
                const combinedInput = parentOutputs.join('\n\n---\n\n');

                // 2. Prepare Prompt
                let finalPrompt = node.data.prompt;
                if (combinedInput) {
                    finalPrompt = finalPrompt.replace(/{{input}}/g, combinedInput);
                }

                // Append Node-Specific Files Content
                if (node.data.files && node.data.files.length > 0) {
                    const filesContext = node.data.files.map(f => `\n\n--- FILE: ${f.name} ---\n${f.content || '(No content read)'}`).join('');
                    finalPrompt += `\n\n=== ATTACHED CONTEXT ===${filesContext}`;
                }

                // Append Global Files Content
                if (globalFiles.length > 0) {
                    const globalFilesContext = globalFiles.map(f => `\n\n--- GLOBAL CONTEXT FILE: ${f.name} ---\n${f.content}`).join('');
                    finalPrompt += `\n\n=== GLOBAL PROJECT CONTEXT ===${globalFilesContext}`;
                }

                // 3. "Execute" (Just pass the prompt as the output for stitching)
                // For the purpose of the chain stitching, the 'output' IS the prompt.
                // However, for the next nodes, we need to register a Placeholder.

                outputs.set(nodeId, `{{OUTPUT_FROM_STEP: "${node.data.label}"}}`);

                // Track Step
                executionSteps.push({
                    id: nodeId,
                    label: node.data.label,
                    output: finalPrompt, // user wants "prompts stitched together", so we display PROMPT in the output field
                    prompt: finalPrompt
                });

                // 4. Update Neighbors
                const neighbors = adj.get(nodeId) || [];
                neighbors.forEach(neighborId => {
                    const currentIn = inDegree.get(neighborId) || 0;
                    inDegree.set(neighborId, currentIn - 1);
                    if (inDegree.get(neighborId) === 0) {
                        queue.push(neighborId);
                    }
                });
            }

            // Show Final Result
            if (executionSteps.length > 0) {
                setFinalResult({
                    isOpen: true,
                    steps: executionSteps,
                    isCompiled: true
                });
                setResultTab('compiled'); // Default to compiled view for "Stitching"
                setShowFullHistory(true); // Force show full history for stitched view
            }

            toast.success("Chain Compiled Successfully!", { id: "chain-compile" });
        } catch (error: any) {
            console.error(error);
            toast.error(`Compilation Failed: ${error.message}`, { id: "chain-compile" });
        } finally {
            setIsRunning(false);
        }
    };

    const runChain = async () => {
        setIsRunning(true);
        toast.loading("Initializing Workflow Engine...", { id: "chain-run" });

        const currentNodes = [...nodesRef.current];
        const currentEdges = [...edgesRef.current];
        const outputs = new Map<string, string>(); // nodeId -> output

        // Reset all statuses
        currentNodes.forEach(n => updateNodeData(n.id, { status: 'idle', output: '' }));

        // Build adjacency list
        const adj = new Map<string, string[]>();
        const inDegree = new Map<string, number>();

        currentNodes.forEach(n => {
            adj.set(n.id, []);
            inDegree.set(n.id, 0);
        });

        currentEdges.forEach(e => {
            if (adj.has(e.source) && inDegree.has(e.target)) {
                adj.get(e.source)?.push(e.target);
                inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
            }
        });

        // Topological Sort / Level-based execution
        const queue: string[] = [];
        currentNodes.forEach(n => {
            if ((inDegree.get(n.id) || 0) === 0) {
                queue.push(n.id);
            }
        });

        const executionSteps: { id: string, label: string, output: string, prompt: string }[] = [];

        try {
            while (queue.length > 0) {
                const nodeId = queue.shift()!;
                const node = nodesRef.current.find(n => n.id === nodeId) || currentNodes.find(n => n.id === nodeId)!;

                // 1. Prepare Input
                const incomingEdges = currentEdges.filter(e => e.target === nodeId);
                const parentOutputs = incomingEdges.map(e => outputs.get(e.source) || '').filter(Boolean);
                const combinedInput = parentOutputs.join('\n\n---\n\n');

                // 2. Prepare Prompt
                let finalPrompt = node.data.prompt;
                if (combinedInput) {
                    finalPrompt = finalPrompt.replace(/{{input}}/g, combinedInput);
                }

                // Append Node-Specific Files Content
                if (node.data.files && node.data.files.length > 0) {
                    const filesContext = node.data.files.map(f => `\n\n--- FILE: ${f.name} ---\n${f.content || '(No content read)'}`).join('');
                    finalPrompt += `\n\n=== ATTACHED CONTEXT ===${filesContext}`;
                }

                // Append Global Files Content
                if (globalFiles.length > 0) {
                    const globalFilesContext = globalFiles.map(f => `\n\n--- GLOBAL CONTEXT FILE: ${f.name} ---\n${f.content}`).join('');
                    finalPrompt += `\n\n=== GLOBAL PROJECT CONTEXT ===${globalFilesContext}`;
                }

                // 3. Execute
                updateNodeData(nodeId, { status: 'running' });

                // Determine Provider and Config
                const stepProviderId = (node.data.providerId || llmConfig.providerId) as LLMProviderId;
                let effectiveConfig = llmConfig;

                // If step uses a different provider than global, try to fetch its config
                if (stepProviderId !== llmConfig.providerId) {
                    try {
                        const { llmConfigDB } = await import('@/services/llmConfigDB');
                        const saved = await llmConfigDB.getConfig(stepProviderId);
                        if (saved) {
                            effectiveConfig = saved;
                        }
                    } catch (e) {
                        // console.error("Config fetch failed", e);
                    }
                }

                let result = '';
                if (finalPrompt.trim()) {
                    try {
                        result = await LLMService.getInstance().getProvider(stepProviderId).generateCompletion({
                            userPrompt: finalPrompt,
                            config: effectiveConfig,
                            temperature: 0.7
                        });

                        outputs.set(nodeId, result);
                        updateNodeData(nodeId, { status: 'complete', output: result });
                    } catch (err: any) {
                        updateNodeData(nodeId, { status: 'error', output: `Error: ${err.message}` });
                        throw err;
                    }
                } else {
                    result = combinedInput;
                    outputs.set(nodeId, combinedInput);
                    updateNodeData(nodeId, { status: 'complete', output: combinedInput });
                }

                // Track Step
                executionSteps.push({
                    id: nodeId,
                    label: node.data.label,
                    output: result,
                    prompt: finalPrompt // Store the actual full prompt used
                });

                // 4. Update Neighbors
                const neighbors = adj.get(nodeId) || [];
                neighbors.forEach(neighborId => {
                    const currentIn = inDegree.get(neighborId) || 0;
                    inDegree.set(neighborId, currentIn - 1);
                    if (inDegree.get(neighborId) === 0) {
                        queue.push(neighborId);
                    }
                });
            }

            // Show Final Result
            if (executionSteps.length > 0) {
                setFinalResult({
                    isOpen: true,
                    steps: executionSteps,
                    isCompiled: false
                });
                setResultTab('steps');
            }

            toast.success("Workflow Execution Successful!", { id: "chain-run" });
        } catch (error: any) {
            console.error(error);
            toast.error(`Execution Failed: ${error.message}`, { id: "chain-run" });
        } finally {
            setIsRunning(false);
        }
    };

    const selectedNodeData = selectedNodeId ? nodes.find(n => n.id === selectedNodeId)?.data : null;

    return (
        <PageTemplate
            title="Chain Reaction"
            subtitle="Automated multi-step prompt chaining workflows"
            icon={Workflow}
            iconGradient="from-yellow-400 to-orange-500"
            shadowColor="shadow-yellow-500/30"
            isSidebarOpen={isSidebarOpen}
            className="!p-0 !overflow-hidden flex flex-col h-[calc(100vh-144px)]"
            headerClassName="!px-4 !py-4 border-b border-slate-200"
            titleClassName="text-lg"
            subtitleClassName="text-xs"
            iconSize={20}
        >
            <div className="h-full flex flex-col relative">
                {/* Visual Toolbar */}
                <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <Button onClick={addNode} variant="outline" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" /> Add Step
                        </Button>
                        <div className="w-px h-6 bg-slate-200 mx-1" />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            size="sm"
                            className="gap-2 text-slate-600 border-dashed border-slate-300 hover:border-indigo-400 hover:text-indigo-600"
                        >
                            <Upload className="w-4 h-4" /> Add Context
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleGlobalFileUpload}
                            className="hidden"
                            accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.docx,.pdf"
                        />
                        {globalFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs border border-indigo-100 animate-in fade-in zoom-in">
                                <span className="max-w-[100px] truncate" title={file.name}>{file.name}</span>
                                <button
                                    onClick={() => removeGlobalFile(idx)}
                                    className="p-0.5 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-indigo-600"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 mr-2"
                            onClick={() => {
                                setNodes(initialNodes);
                                setEdges(initialEdges);
                                setGlobalFiles([]);
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            onClick={compileChain}
                            disabled={isRunning}
                            className="gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200 mr-2"
                        >
                            <Link className="w-4 h-4" />
                            Stitch Prompts
                        </Button>
                        <Button
                            onClick={runChain}
                            disabled={isRunning}
                            className={`gap-2 ${isRunning ? 'bg-slate-100 text-slate-400' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            {isRunning ? 'Processing...' : 'Run Chain'}
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Save className="w-4 h-4" /> Save Workflow
                        </Button>
                    </div>
                </div>

                {/* ReactFlow Canvas */}
                <div className="flex-1 bg-slate-50 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-right"
                    >
                        <Background color="#cbd5e1" gap={16} />
                        <Controls />
                    </ReactFlow>
                </div>

                {/* Properties Drawer */}
                <NodeConfigurationDrawer
                    isOpen={!!selectedNodeId}
                    onClose={() => setSelectedNodeId(null)}
                    nodeData={selectedNodeData ? { ...selectedNodeData, id: selectedNodeId } : null}
                    onUpdate={handleDrawerUpdate}
                    onSave={handleDrawerSave}
                />
            </div>

            {/* Final Result Modal */}
            {finalResult && finalResult.isOpen && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {finalResult.isCompiled ? 'Chain Strategy Compiled' : 'Workflow Complete'}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {finalResult.isCompiled ? 'Ready for export or manual execution' : `Generated ${finalResult.steps.length} variables across the chain`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setFinalResult(null)}
                                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100">
                            <button
                                onClick={() => setResultTab('steps')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${resultTab === 'steps' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <LayoutList size={16} />
                                {finalResult.isCompiled ? 'Step-by-Step Prompts' : 'Step-by-Step Variables'}
                            </button>
                            <button
                                onClick={() => setResultTab('compiled')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${resultTab === 'compiled' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                            >
                                <FileText size={16} />
                                {finalResult.isCompiled ? 'Stitched Prompt Chain' : 'Master Prompt Format'}
                            </button>
                            {/* Hide Document and Prompt Preview for Stitched Mode */}
                            {!finalResult.isCompiled && (
                                <>
                                    <button
                                        onClick={() => setResultTab('document')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${resultTab === 'document' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                                    >
                                        <FileType size={16} />
                                        Document Preview
                                    </button>
                                    <button
                                        onClick={() => setResultTab('prompt')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${resultTab === 'prompt' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                                    >
                                        <Sparkles size={16} />
                                        Prompt Preview
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Options Bar for Compiled View */}
                        {resultTab === 'compiled' && (
                            <div className="px-6 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
                                {/* Conditional Toolbar: Simple for Stitched, Full for Executed */}
                                {finalResult.isCompiled ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-indigo-700 px-2">Raw Text View</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <button
                                            onClick={() => setViewFormat('markdown')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewFormat === 'markdown' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <FileType size={14} />
                                            Markdown
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 mx-1" />
                                        <button
                                            onClick={() => setViewFormat('text')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewFormat === 'text' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <AlignLeft size={14} />
                                            Text
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 mx-1" />
                                        <button
                                            onClick={() => setViewFormat('json')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewFormat === 'json' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <FileJson size={14} />
                                            JSON
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            const content = (showFullHistory ? finalResult.steps : [finalResult.steps[finalResult.steps.length - 1]]).map((step, idx) => {
                                                const header = `### ${showFullHistory ? `STEP ${idx + 1}: ` : 'FINAL RESULT: '}${step.label.toUpperCase()} ###`;
                                                return `\n\n${header}\n${step.output}\n\n`;
                                            }).join('\n==================================================\n');

                                            navigator.clipboard.writeText(content);
                                            toast.success("Copied to clipboard");
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                                    >
                                        <Copy size={14} />
                                        Copy Content
                                    </button>

                                    {!finalResult.isCompiled && (
                                        <label className="flex items-center gap-2 text-xs font-medium text-indigo-700 cursor-pointer select-none hover:text-indigo-900">
                                            <input
                                                type="checkbox"
                                                checked={showFullHistory}
                                                onChange={(e) => setShowFullHistory(e.target.checked)}
                                                className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            Include History
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Options Bar for Document View */}
                        {resultTab === 'document' && (
                            <div className="px-6 py-2 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportWord}
                                        className="h-8 text-xs gap-2 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    >
                                        <FileText size={14} /> Save as Word
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrint}
                                        className="h-8 text-xs gap-2 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    >
                                        <Printer size={14} /> Print / Save as PDF
                                    </Button>
                                </div>

                                <label className="flex items-center gap-2 text-xs font-medium text-indigo-700 cursor-pointer select-none hover:text-indigo-900">
                                    <input
                                        type="checkbox"
                                        checked={showFullHistory}
                                        onChange={(e) => setShowFullHistory(e.target.checked)}
                                        className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    Include History
                                </label>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-0 bg-slate-50/50">
                            {resultTab === 'steps' && (
                                <div className="p-6 space-y-6">
                                    {finalResult.steps.map((step, idx) => (
                                        <div key={step.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold border border-indigo-200">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-semibold text-slate-700">{step.label}</span>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                                    {`{{Output_${idx + 1}}}`}
                                                </span>
                                            </div>
                                            <div className="p-4 bg-white font-mono text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                {step.output}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {resultTab === 'compiled' && (
                                <div className="p-8 min-h-full">
                                    <div className={`mx-auto max-w-5xl rounded-xl border shadow-sm overflow-hidden ${finalResult.isCompiled ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                                        <div className={`p-8 font-mono text-sm whitespace-pre-wrap leading-relaxed select-text ${finalResult.isCompiled ? 'text-slate-800' : 'text-indigo-100'}`}>
                                            {finalResult.isCompiled ? (
                                                /* Stitched Mode - ALWAYS show full history (ignore toggle) */
                                                finalResult.steps.map((step, idx) => {
                                                    const header = `### STEP ${idx + 1}: ${step.label.toUpperCase()} ###`;
                                                    return `\n\n${header}\n${step.output}\n\n`;
                                                }).join('\n==================================================\n')
                                            ) : (
                                                /* Executed Mode - respect viewFormat */
                                                viewFormat === 'json' ? (
                                                    JSON.stringify(showFullHistory ? finalResult.steps : finalResult.steps[finalResult.steps.length - 1], null, 2)
                                                ) : (
                                                    (showFullHistory ? finalResult.steps : [finalResult.steps[finalResult.steps.length - 1]]).map((step, idx) => {
                                                        const header = viewFormat === 'markdown' ? `### ${showFullHistory ? `STEP ${idx + 1}: ` : 'FINAL RESULT: '}${step.label.toUpperCase()} ###` : `${showFullHistory ? `STEP ${idx + 1}: ` : 'FINAL RESULT: '}${step.label.toUpperCase()}`;
                                                        return `\n\n${header}\n${step.output}\n\n`;
                                                    }).join(viewFormat === 'markdown' ? '--------------------------------------------------\n' : '\n==================================================\n')
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {resultTab === 'document' && (
                                <div className="p-8 bg-slate-200/50 h-full overflow-y-auto">
                                    <div id="document-preview-content" className="max-w-[21cm] mx-auto bg-white shadow-xl rounded-sm p-[1.5cm] min-h-[29.7cm] text-slate-800 prose prose-slate">
                                        {(showFullHistory ? finalResult.steps : [finalResult.steps[finalResult.steps.length - 1]]).map((step, idx) => (
                                            <div key={step.id} className="mb-8">
                                                {showFullHistory && (
                                                    <div className="border-b-2 border-slate-100 pb-2 mb-4">
                                                        <h2 className="text-xl font-bold text-slate-900 m-0">{step.label}</h2>
                                                        <span className="text-xs font-mono text-slate-400">Section {idx + 1}</span>
                                                    </div>
                                                )}
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.output}</ReactMarkdown>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resultTab === 'prompt' && (
                                <div className="p-6 space-y-6">
                                    {finalResult.steps.map((step, idx) => (
                                        <div key={step.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-200 text-indigo-700 text-xs font-bold border border-indigo-300">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-semibold text-indigo-900">{step.label}</span>
                                                    <span className="text-[10px] font-mono text-indigo-500 bg-indigo-100/50 px-2 py-1 rounded border border-indigo-200">
                                                        COMPILED PROMPT
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(step.prompt);
                                                        toast.success("Prompt copied!");
                                                    }}
                                                    className="h-6 text-xs text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    <Copy size={12} className="mr-1" /> Copy
                                                </Button>
                                            </div>
                                            <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 border-b border-indigo-100 italic">
                                                Includes template instructions + injected context from previous steps
                                            </div>
                                            <div className="p-4 bg-slate-50 font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border-b border-slate-100">
                                                {step.prompt}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
                            <div className="text-xs text-slate-400">
                                {resultTab === 'steps' ? 'Variables are passed sequentially efficiently.' :
                                    resultTab === 'document' ? 'Use the toolbar above to export.' :
                                        resultTab === 'prompt' ? 'These are the actual prompts sent to the LLM.' :
                                            'Full context compiled for export.'}
                            </div>
                            <div className="flex gap-3">
                                {resultTab !== 'document' && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const content = finalResult.steps.map(s => `### ${s.label} ###\n${s.output}`).join('\n\n');
                                            navigator.clipboard.writeText(content);
                                            toast.success("Copied to clipboard");
                                        }}
                                        leftIcon={<Copy size={16} />}
                                    >
                                        Copy All
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setIsSaveModalOpen(true)}
                                    leftIcon={<Save size={16} />}
                                >
                                    Save to Library
                                </Button>
                                <Button
                                    onClick={() => setFinalResult(null)}
                                    className="bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <SavePromptModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSavePrompt}
            />
        </PageTemplate>
    );
};
