import React, { useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { workflowDB, SavedWorkflow } from '@/services/database';
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
import { Workflow, Plus, Play, Save, Loader2, X, Copy, Sparkles, FileText, AlignLeft, FileType, Printer, Upload, Link, FolderOpen, BookOpen, ChevronRight, ArrowRight, Zap, Target, Layers } from 'lucide-react';
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

const TUTORIAL_MODULES = [
    {
        id: 'concept',
        title: 'Chain Reaction Logic',
        icon: Workflow,
        content: (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100">
                    <h2 className="text-2xl font-bold text-indigo-900 mb-4">Prompt Chaining & Automation</h2>
                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                        Complex tasks are rarely solved by a single prompt. <b>Chain Reaction</b> allows you to break down big goals (like writing a book or coding an app) into manageable, sequential steps.
                        The output of one node becomes the input of the next.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-4 text-slate-500 uppercase tracking-widest font-bold text-xs">
                                <Zap size={16} /> Linear Prompting
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">The Old Way</h3>
                            <p className="text-slate-600 text-sm mb-4">You manually copy the result of prompt 1 and paste it into prompt 2.</p>
                            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">
                                Ctrl+C -&gt; Ctrl+V -&gt; Repeat
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-200 ring-1 ring-indigo-100">
                            <div className="flex items-center gap-3 mb-4 text-indigo-600 uppercase tracking-widest font-bold text-xs">
                                <Workflow size={16} /> The Chain Way
                            </div>
                            <h3 className="text-xl font-bold text-indigo-900 mb-2">Automated Flow</h3>
                            <p className="text-indigo-700 text-sm mb-4">Variables pass data automatically.</p>
                            <div className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-mono">
                                {"{{input}} variable handles the data flow"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'nodes',
        title: 'Nodes & Edges',
        icon: Target,
        content: (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">The Building Blocks</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Each <b>Node</b> represents a thinking step (e.g., "Draft Outline").<br />
                            Each <b>Edge</b> (line) represents the flow of information.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Inputs</div>
                        <div className="text-sm font-mono text-slate-700">User prompts, Uploaded Files, Previous Node Outputs</div>
                    </div>
                    <div className="flex items-center justify-center text-slate-300">
                        <ArrowRight size={24} />
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Process</div>
                        <div className="text-sm font-mono text-slate-700">LLM Execution (OpenAI, Anthropic, Gemini)</div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'magichandler',
        title: 'The Magic Variable',
        icon: Sparkles,
        content: (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="p-3 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-amber-900 mb-2">{"{{input}}"}</h3>
                        <p className="text-amber-800 leading-relaxed">
                            To use the output from the previous step, simply type <code>{'{{input}}'}</code> anywhere in your prompt.
                            When the chain runs, this variable is replaced with the combined text from all incoming connections.
                        </p>
                    </div>
                </div>
                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl p-6">
                    <div className="font-mono text-sm text-slate-300">
                        <span className="text-purple-400">Step 2 Prompt:</span><br /><br />
                        "Take the following outline and expand it into a full blog post:<br /><br />
                        <span className="text-yellow-400">{'{{input}}'}</span>"<br /><br />
                        <span className="text-slate-500"># The system auto-fills this with Step 1's result.</span>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'stitching',
        title: 'Stitching Strategies',
        icon: Link,
        content: (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-bold text-slate-800">Two Ways to Run</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                            <Play size={16} /> Run Chain
                        </h4>
                        <p className="text-sm text-emerald-800 mb-2">Executes each node sequentially using the LLM.</p>
                        <ul className="text-xs text-emerald-700 list-disc list-inside">
                            <li>Costs tokens for every step</li>
                            <li>Real-time generation</li>
                            <li>Use for actual content creation</li>
                        </ul>
                    </div>
                    <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <Link size={16} /> Stitch Prompts
                        </h4>
                        <p className="text-sm text-blue-800 mb-2">Compiles the entire chain into one MEGA-PROMPT document.</p>
                        <ul className="text-xs text-blue-700 list-disc list-inside">
                            <li>No LLM costs (just text processing)</li>
                            <li>Creates a "Prompt Strategy" you can save</li>
                            <li>Use for planning and templates</li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    }
];

interface ChainReactionPageProps {
    isSidebarOpen: boolean;
}

export const ChainReactionPage: React.FC<ChainReactionPageProps> = ({ isSidebarOpen }) => {
    const { llmConfig } = usePrompt();
    const [activeTab, setActiveTab] = useState<'tool' | 'tutorial'>('tool');
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [finalResult, setFinalResult] = useState<{ isOpen: boolean, steps: { id: string, label: string, output: string, prompt: string }[], isCompiled: boolean } | null>(null);
    const [resultTab, setResultTab] = useState<'steps' | 'compiled' | 'document' | 'prompt'>('steps');

    const [viewFormat, setViewFormat] = useState<'markdown' | 'text' | 'json'>('markdown');

    const [isWorkflowSaveModalOpen, setIsWorkflowSaveModalOpen] = useState(false);
    const [isLoadWorkflowModalOpen, setIsLoadWorkflowModalOpen] = useState(false);
    const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);

    const fetchWorkflows = async () => {
        const flows = await workflowDB.getAllWorkflows();
        setSavedWorkflows(flows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    };

    const handleSaveWorkflowGraph = async (title: string) => {
        try {
            await workflowDB.saveWorkflow({
                title,
                nodes: nodes,
                edges: edges,
                globalFiles: globalFiles,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            toast.success("Workflow saved!");
            setIsWorkflowSaveModalOpen(false);
        } catch (e) {
            toast.error("Failed to save workflow");
        }
    };

    const handleLoadWorkflow = (flow: SavedWorkflow) => {
        if (!confirm("Load this workflow? Unsaved changes will be lost.")) return;
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setGlobalFiles(flow.globalFiles || []);
        setIsLoadWorkflowModalOpen(false);
        toast.success(`Workflow "${flow.title}" loaded`);
        // Re-hydrate handlers just in case, though useEffect depends on setNodes
    };

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
                updatedAt: new Date().toISOString(),
                source: 'chain' as const
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
                        const allConfigs = await llmConfigDB.getAllConfigs();
                        const saved = allConfigs.find(c => c.providerId === stepProviderId);
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
                        let sysPrompt = undefined;

                        const GOLDEN_RULES = `
***GOLDEN RULES OF PROMPTING (MUST FOLLOW)***
1. **Tone**: Use a friendly, clear, and firm tone for better results.
2. **Action-Oriented**: State requests as clear commands with necessary details.
3. **Use Templates**: "Fill-in-the-box" structures produce more creative results than empty fields.
4. **Plan First**: For complex tasks, generate an outline or rough version first.
5. **Structured Output**: Demand specific formats (JSON, Markdown, Lists) beyond simple prose.
6. **Explain Why**: Provide the "why" behind instructions to clarify intent.
7. **Control Verbosity**: Explicitly define if the output should be verbose or concise.
8. **Guide with Examples**: Provide templates or examples to guide structure and style.
9. **Advanced Terminology**: Use precise prompting terms to trigger sophisticated behaviors.
10. **Modular Synthesis**: For complex contexts, handle parts separately and then synthesize.
`;
                        // Basic system prompt for chain steps
                        sysPrompt = `You are a helpful AI assistant executing a step in a larger workflow.
                         
${GOLDEN_RULES}`;

                        result = await LLMService.getInstance().getProvider(stepProviderId).generateCompletion({
                            userPrompt: finalPrompt,
                            systemPrompt: sysPrompt,
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

    const InteractiveTutorial = () => {
        const [activeStep, setActiveStep] = useState(0);

        return (
            <div className="flex w-full h-full bg-slate-50 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shrink-0 lg:block hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen size={20} className="text-indigo-600" />
                            Chain Masterclass
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Interactive guide to prompt chaining.</p>
                    </div>
                    <div className="p-4 space-y-2 flex-1">
                        {TUTORIAL_MODULES.map((module, index) => {
                            const Icon = module.icon;
                            const isActive = activeStep === index;
                            return (
                                <button
                                    key={module.id}
                                    onClick={() => setActiveStep(index)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    <div className={`p-2 rounded-md ${isActive ? 'bg-white shadow-sm ring-1 ring-indigo-100' : 'bg-slate-100'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <span className="text-sm">{module.title}</span>
                                    {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-4xl mx-auto p-4 md:p-12 w-full">
                        {/* Header */}
                        <div className="mb-8 border-b border-slate-200 pb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{TUTORIAL_MODULES[activeStep].title}</h1>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>Module {activeStep + 1} of {TUTORIAL_MODULES.length}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span>Quick Guide</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={activeStep === 0}
                                    onClick={() => setActiveStep(prev => prev - 1)}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>
                                <button
                                    disabled={activeStep === TUTORIAL_MODULES.length - 1}
                                    onClick={() => setActiveStep(prev => prev + 1)}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="min-h-[400px]">
                            {TUTORIAL_MODULES[activeStep].content}
                        </div>

                        {/* Footer Navigation */}
                        <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between">
                            {activeStep > 0 && (
                                <Button variant="ghost" onClick={() => setActiveStep(prev => prev - 1)}>
                                    Previous Module
                                </Button>
                            )}
                            {activeStep < TUTORIAL_MODULES.length - 1 ? (
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white ml-auto"
                                    onClick={() => setActiveStep(prev => prev + 1)}
                                    rightIcon={<ArrowRight size={16} />}
                                >
                                    Next: {TUTORIAL_MODULES[activeStep + 1].title}
                                </Button>
                            ) : (
                                <Button
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white ml-auto"
                                    onClick={() => setActiveTab('tool')}
                                    rightIcon={<Workflow size={16} />}
                                >
                                    Start Building Chains
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
            rightContent={
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('tool')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'tool' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Workflow size={16} /> Builder
                    </button>
                    <button
                        onClick={() => setActiveTab('tutorial')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'tutorial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BookOpen size={16} /> Tutorial
                    </button>
                </div>
            }
        >
            {activeTab === 'tool' ? (
                <div className="h-full flex flex-col relative">
                    {/* Visual Toolbar */}
                    <div className="bg-white border-b border-slate-200 p-3 flex justify-between items-center z-10 overflow-x-auto no-scrollbar shrink-0 gap-4">
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
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 mr-2"
                                onClick={() => {
                                    fetchWorkflows();
                                    setIsLoadWorkflowModalOpen(true);
                                }}
                            >
                                <FolderOpen className="w-4 h-4" /> Load
                            </Button>
                            <Button
                                onClick={() => setIsWorkflowSaveModalOpen(true)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
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
            ) : (
                <InteractiveTutorial />
            )}

            <SavePromptModal
                isOpen={isWorkflowSaveModalOpen}
                onClose={() => setIsWorkflowSaveModalOpen(false)}
                onSave={handleSaveWorkflowGraph}
                title="Save Workflow"
                placeholder="Enter workflow name..."
            />

            {/* Load Workflow Modal */}
            {isLoadWorkflowModalOpen && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Load Workflow</h3>
                            <button onClick={() => setIsLoadWorkflowModalOpen(false)} className="text-slate-400 hover:text-indigo-600"><X size={20} /></button>
                        </div>
                        <div className="overflow-y-auto p-2 bg-slate-50/50">
                            {savedWorkflows.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No saved workflows found.</div>
                            ) : (
                                <div className="space-y-2">
                                    {savedWorkflows.map(flow => (
                                        <button
                                            key={flow.id}
                                            onClick={() => handleLoadWorkflow(flow)}
                                            className="w-full text-left p-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 shadow-sm transition-all flex justify-between items-center group"
                                        >
                                            <div className="overflow-hidden">
                                                <div className="font-semibold text-slate-800 truncate">{flow.title}</div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400"></div>
                                                    {new Date(flow.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <FolderOpen size={18} className="text-slate-300 group-hover:text-indigo-500 flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

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
                                onClick={() => setFinalResult({ ...finalResult, isOpen: false })}
                                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 px-4 pt-4 border-b border-slate-100 bg-white">
                            <button
                                onClick={() => setResultTab('steps')}
                                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${resultTab === 'steps' ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 border-transparent hover:text-indigo-600 hover:bg-slate-50'}`}
                            >
                                Step-by-Step
                            </button>
                            {finalResult.isCompiled && (
                                <button
                                    onClick={() => setResultTab('compiled')}
                                    className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${resultTab === 'compiled' ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 border-transparent hover:text-indigo-600 hover:bg-slate-50'}`}
                                >
                                    Compiled Strategy
                                </button>
                            )}
                            <button
                                onClick={() => setResultTab('document')}
                                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${resultTab === 'document' ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 border-transparent hover:text-indigo-600 hover:bg-slate-50'}`}
                            >
                                Document View
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">

                            {resultTab === 'compiled' && (
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Link size={16} className="text-indigo-500" />
                                            Stitched Prompt Strategy
                                        </h4>
                                        <div className="prose prose-sm max-w-none text-slate-600 font-mono bg-slate-50 p-4 rounded-lg border border-slate-200">
                                            {finalResult.steps.map((step, i) => (
                                                <div key={i} className="mb-8 last:mb-0">
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">
                                                        Step {i + 1}: {step.label}
                                                    </div>
                                                    <div className="whitespace-pre-wrap">{step.output}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {resultTab === 'steps' && (
                                <div className="space-y-6">
                                    {finalResult.steps.map((step, index) => (
                                        <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                                <div className="font-semibold text-slate-700 text-sm">Step {index + 1}: {step.label}</div>
                                                <div className="text-xs text-slate-400 font-mono">{step.id}</div>
                                            </div>
                                            <div className="p-4">
                                                <div className="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-500 mb-3 border border-slate-100 max-h-24 overflow-y-auto">
                                                    <strong className="text-slate-400 block mb-1 uppercase tracking-wider text-[10px]">Input Prompt Used:</strong>
                                                    {step.prompt}
                                                </div>
                                                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {step.output}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {resultTab === 'document' && (
                                <div className="bg-white shadow-lg p-8 min-h-[600px] max-w-3xl mx-auto border border-slate-200" id="document-preview-content">
                                    {finalResult.steps.map((step, index) => (
                                        <div key={index} className="mb-8">
                                            <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">{step.label}</h2>
                                            <div className="prose prose-slate max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.output}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center z-10">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setViewFormat(viewFormat === 'markdown' ? 'text' : 'markdown')}>
                                    {viewFormat === 'markdown' ? <AlignLeft size={16} /> : <FileText size={16} />}
                                    <span className="ml-2 hidden sm:inline">{viewFormat === 'markdown' ? 'Raw Text' : 'Markdown'}</span>
                                </Button>
                                {resultTab === 'document' && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={handleExportWord} className="gap-2">
                                            <FileType size={16} className="text-blue-600" /> Word
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                            <Printer size={16} className="text-slate-600" /> Print
                                        </Button>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const allText = finalResult.steps.map(s => `### ${s.label}\n${s.output}`).join('\n\n');
                                        navigator.clipboard.writeText(allText);
                                        toast.success("Copied to clipboard");
                                    }}
                                >
                                    <Copy size={16} className="mr-2" /> Copy All
                                </Button>
                                <Button
                                    onClick={() => handleSavePrompt(finalResult.isCompiled ? 'Chain Strategy' : 'Chain Results')}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                                >
                                    <Save size={16} className="mr-2" /> Save to Library
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </PageTemplate>
    );
};
