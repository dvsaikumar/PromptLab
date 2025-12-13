import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Settings2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PromptNode = memo(({ id, data, isConnectable }: any) => {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'running': return 'border-indigo-500 ring-4 ring-indigo-500/10';
            case 'complete': return 'border-green-500';
            case 'error': return 'border-red-500';
            default: return 'border-transparent hover:border-indigo-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />;
            case 'complete': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
            case 'error': return <AlertCircle className="w-3 h-3 text-red-500" />;
            default: return <div className="w-2 h-2 bg-slate-300 rounded-full" />;
        }
    };

    return (
        <div
            className={`group relative bg-white rounded-2xl shadow-sm min-w-[200px] transition-all duration-200 cursor-pointer overflow-visible border-2 ${getStatusColor(data.status)}`}
            onClick={() => data.onNodeClick && data.onNodeClick(id)}
        >
            {/* Hover Actions (n8n style floating actions above node usually, but let's keep it simple for now) */}

            <div className="p-3 flex items-center gap-3">
                {/* Icon Box */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 ${data.status === 'running' ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-600'}`}>
                    <Bot size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-bold text-sm text-slate-800 truncate pr-2 max-w-[120px]" title={data.label}>
                            {data.label}
                        </h3>
                        {getStatusIcon(data.status)}
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide truncate">
                        {data.typ || 'Step'}
                    </p>
                </div>
            </div>

            {/* Config Overlay Hint */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings2 size={12} className="text-slate-400" />
            </div>

            {/* Connection Handles */}
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white transition-colors hover:!bg-indigo-500" />
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!w-3 !h-3 !bg-slate-300 !border-2 !border-white transition-colors hover:!bg-indigo-500" />
        </div>
    );
});
