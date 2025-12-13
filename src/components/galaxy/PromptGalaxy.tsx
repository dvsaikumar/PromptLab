import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { promptDB } from '@/services/database';
import { PromptData } from '@/types';
import { useResizeObserver } from '@/hooks/useResizeObserver'; // Assuming usage or simple ref
import { Loader2 } from 'lucide-react';
import * as THREE from 'three'; // Import Three.js

interface GalaxyNode {
    id: string;
    group: 'prompt' | 'framework' | 'role' | 'industry';
    label: string;
    val: number; // Size
    color: string;
    desc?: string;
    raw?: any;
}

interface GalaxyLink {
    source: string;
    target: string;
    color?: string;
}

interface PromptGalaxyProps {
    onNodeClick?: (nodeId: string) => void;
}

export const PromptGalaxy: React.FC<PromptGalaxyProps> = ({ onNodeClick }) => {
    const [graphData, setGraphData] = useState<{ nodes: GalaxyNode[], links: GalaxyLink[] }>({ nodes: [], links: [] });
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-resize logic (simplified)
    const [dimensions, setDimensions] = useState({ w: 800, h: 600 });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const prompts = await promptDB.getAllPrompts();

                // Build Graph
                const nodes: GalaxyNode[] = [];
                const links: GalaxyLink[] = [];
                const nodeIds = new Set<string>();

                // Helper to add node
                const addNode = (id: string, group: GalaxyNode['group'], label: string, color: string, val: number, raw?: any) => {
                    if (!nodeIds.has(id)) {
                        nodes.push({ id, group, label, color, val, raw, desc: label });
                        nodeIds.add(id);
                    }
                };

                prompts.forEach(p => {
                    // 1. Prompt Node
                    const promptId = `prompt-${p.id}`;
                    addNode(promptId, 'prompt', p.title, '#22d3ee', 5, p); // Cyan

                    // 2. Framework Hub
                    if (p.framework) {
                        const fwId = `fw-${p.framework}`;
                        addNode(fwId, 'framework', p.framework, '#a855f7', 15); // Purple
                        links.push({ source: fwId, target: promptId, color: 'rgba(168, 85, 247, 0.3)' });
                    }

                    // 3. Role/Persona Hub
                    // Assuming 'role' or 'personaId' exists in saved data, or extract from fields
                    // Backwards compatibility check
                    const role = (p as any).role || (p as any).personaId;
                    if (role) {
                        const rId = `role-${role}`;
                        addNode(rId, 'role', role, '#f59e0b', 12); // Amber
                        links.push({ source: rId, target: promptId, color: 'rgba(245, 158, 11, 0.3)' });
                    }

                    // 4. Industry Hub
                    const industry = (p as any).industry;
                    if (industry) {
                        const indId = `ind-${industry}`;
                        addNode(indId, 'industry', industry, '#10b981', 12); // Emerald
                        links.push({ source: indId, target: promptId, color: 'rgba(16, 185, 129, 0.3)' });
                    }
                });

                setGraphData({ nodes, links });
            } catch (e) {
                console.error("Failed to load galaxy", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({ w: entry.contentRect.width, h: entry.contentRect.height });
            }
        });
        resizeObs.observe(containerRef.current);
        return () => resizeObs.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative bg-black overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 text-white">
                    <Loader2 className="animate-spin w-8 h-8" />
                </div>
            )}

            {/* Legend */}
            <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10">
                <div className="text-xs font-bold text-white mb-2 uppercase tracking-widest opacity-70">Knowledge Graph</div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500 box-shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                        <span className="text-[10px] text-white/80">Framework</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-[10px] text-white/80">Role</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <span className="text-[10px] text-white/80">Prompt</span>
                    </div>
                </div>
            </div>

            {!isLoading && (
                <ForceGraph3D
                    width={dimensions.w}
                    height={dimensions.h}
                    graphData={graphData}
                    nodeLabel="label"
                    nodeColor="color"
                    nodeVal="val"
                    backgroundColor="#020617" // Slate 950
                    linkColor="color"
                    linkOpacity={0.2}
                    linkWidth={1}
                    onNodeClick={(node: any) => {
                        if (node.group === 'prompt' && node.raw) {
                            // Pass just the ID or Raw Object
                            if (onNodeClick) onNodeClick(node.raw.id);
                        } else {
                            // Fly to logic usually builtin, or custom
                        }
                    }}
                    nodeResolution={16}
                    // Particles
                    enableNodeDrag={false}
                />
            )}
        </div>
    );
};
