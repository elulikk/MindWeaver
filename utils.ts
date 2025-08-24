import { Node, Connection, Mininode } from './types';

// --- UNIQUE ID GENERATION ---
export const getNewNodeId = (nodes: Node[]): number => {
    if (!nodes || nodes.length === 0) {
      return 1;
    }
    return Math.max(...nodes.map(n => n.id)) + 1;
};

export const getNewMininodeId = (mininodes: Mininode[]): number => {
    if (!mininodes || mininodes.length === 0) {
      return 1001; // Start from a higher range to avoid collision with nodes
    }
    return Math.max(...mininodes.map(m => m.id)) + 1;
};
  
export const getNewPortId = (prefix: string = 'port') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// --- COLOR UTILS ---
export const isColorDark = (hexColor: string): boolean => {
    if (!hexColor || hexColor.length < 4) return false;
    if (hexColor.startsWith('#')) hexColor = hexColor.slice(1);
    if (hexColor.length === 3) hexColor = hexColor.split('').map(char => char + char).join('');
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance < 140;
};

export const hexToRgba = (hex: string, alpha: number = 1): string => {
    if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return `rgba(0, 0, 0, ${alpha})`; // Return black with alpha on invalid hex
    }
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const numerical = parseInt(`0x${c.join('')}`);
    const r = (numerical >> 16) & 255;
    const g = (numerical >> 8) & 255;
    const b = numerical & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


// --- GRAPH UTILS ---
interface SortResult {
    sortedNodes: Node[];
    error: string | null;
    errorNodeIds?: number[];
}

export function topologicalSort(nodes: Node[], connections: Connection[]): SortResult {
    const adj = new Map<number, number[]>();
    const inDegree = new Map<number, number>();
    const nodesById = new Map<number, Node>(nodes.map(n => [n.id, n]));

    for (const node of nodes) {
        adj.set(node.id, []);
        inDegree.set(node.id, 0);
    }

    for (const conn of connections) {
        if (nodesById.has(conn.fromNode) && nodesById.has(conn.toNode)) {
            adj.get(conn.fromNode)!.push(conn.toNode);
            inDegree.set(conn.toNode, (inDegree.get(conn.toNode) || 0) + 1);
        }
    }

    const queue: number[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
        if (degree === 0) {
            queue.push(nodeId);
        }
    }
    
    queue.sort((a, b) => {
        const nodeA = nodesById.get(a)!;
        const nodeB = nodesById.get(b)!;
        return nodeA.pos.y - nodeB.pos.y || nodeA.pos.x - nodeB.pos.x;
    });

    const sortedNodeIds: number[] = [];
    while (queue.length > 0) {
        const u = queue.shift()!;
        sortedNodeIds.push(u);

        const neighbors = adj.get(u) || [];
        neighbors.sort((a, b) => {
             const nodeA = nodesById.get(a)!;
             const nodeB = nodesById.get(b)!;
             return nodeA.pos.y - nodeB.pos.y || nodeA.pos.x - nodeB.pos.x;
        });

        for (const v of neighbors) {
            inDegree.set(v, inDegree.get(v)! - 1);
            if (inDegree.get(v) === 0) {
                queue.push(v);
            }
        }
    }

    if (sortedNodeIds.length !== nodes.length) {
        const cycleNodeIds = nodes.map(n => n.id).filter(id => !sortedNodeIds.includes(id));
        return {
            sortedNodes: [],
            error: "A cycle was detected in the graph, which is not allowed for a linear tutorial. Please resolve the circular dependencies to export.",
            errorNodeIds: cycleNodeIds,
        };
    }

    return { sortedNodes: sortedNodeIds.map(id => nodesById.get(id)!), error: null };
}