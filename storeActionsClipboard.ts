
import { MindMapState, ClipboardData, Node } from './types';
import { getNewNodeId } from './utils';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createClipboardActions = (set: SetState, get: GetState) => ({
    copySelection: () => {
        const { nodes, connections, selectedNodeIds } = get();
        if (selectedNodeIds.size === 0) return;

        const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id));
        const selectedConnections = connections.filter(c =>
            selectedNodeIds.has(c.fromNode) && selectedNodeIds.has(c.toNode)
        );

        const clipboardData: ClipboardData = {
            nodes: JSON.parse(JSON.stringify(selectedNodes)),
            connections: JSON.parse(JSON.stringify(selectedConnections)),
        };
        
        set({ clipboard: clipboardData });
        get().actions._addLog(`${selectedNodeIds.size} nodo(s) copiados al portapapeles.`, 'success');
    },
    pasteFromClipboard: () => {
        const { clipboard, nodes, connections, viewOffset, zoom, mininodes } = get();
        if (!clipboard) return;

        const newNodes: Node[] = [];
        const idMap = new Map<number, number>();
        let minX = Infinity, minY = Infinity;

        clipboard.nodes.forEach(node => {
            minX = Math.min(minX, node.pos.x);
            minY = Math.min(minY, node.pos.y);
        });
        
        const pastePos = { x: (200 - viewOffset.x) / zoom, y: (100 - viewOffset.y) / zoom };

        clipboard.nodes.forEach(node => {
            const newNodeId = getNewNodeId([...nodes, ...newNodes]);
            idMap.set(node.id, newNodeId);
            newNodes.push({
                ...node,
                id: newNodeId,
                pos: {
                    x: node.pos.x - minX + pastePos.x,
                    y: node.pos.y - minY + pastePos.y,
                },
                isComplete: false,
            });
        });

        const newConnections = clipboard.connections.map(c => ({
            ...c,
            fromNode: idMap.get(c.fromNode)!,
            toNode: idMap.get(c.toNode)!,
        }));

        get().actions.updateCoreState({
            nodes: [...nodes, ...newNodes],
            connections: [...connections, ...newConnections],
        });

        const newSelectedIds = new Set(newNodes.map(n => n.id));
        set({ selectedNodeIds: newSelectedIds });
        get().actions._addLog(`${newNodes.length} nodo(s) pegados desde el portapapeles.`, 'success');
    },
});
