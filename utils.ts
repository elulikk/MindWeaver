import { Node, Connection, Mininode } from './types';
import { DBProject } from './db';

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

// --- FORMATTING UTILS ---
export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- SIMILARITY ALGORITHM ---
const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export const calculateProjectSimilarity = (projectA: DBProject, projectB: DBProject): number => {
    const weights = {
        title: 0.4,
        size: 0.2,
        date: 0.1,
        icon: 0.1,
        nodeCount: 0.2,
    };

    // 1. Title similarity (Levenshtein distance)
    const titleA = projectA.title.toLowerCase();
    const titleB = projectB.title.toLowerCase();
    const maxTitleLength = Math.max(titleA.length, titleB.length);
    if (maxTitleLength === 0) return 0; // Avoid division by zero
    const titleDistance = levenshteinDistance(titleA, titleB);
    const titleScore = 1 - (titleDistance / maxTitleLength);

    // 2. Content size similarity
    const sizeA = JSON.stringify(projectA.state).length;
    const sizeB = JSON.stringify(projectB.state).length;
    const maxSize = Math.max(sizeA, sizeB);
    if (maxSize === 0) return 0;
    const sizeScore = Math.min(sizeA, sizeB) / maxSize;

    // 3. Date proximity (score decreases over 7 days)
    const dateDiff = Math.abs(projectA.modifiedAt.getTime() - projectB.modifiedAt.getTime());
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
    const dateScore = Math.max(0, 1 - (dateDiff / oneWeekInMs));

    // 4. Icon similarity
    const iconScore = projectA.icon === projectB.icon ? 1 : 0;

    // 5. Node count similarity
    const nodeCountA = projectA.state.nodes.length;
    const nodeCountB = projectB.state.nodes.length;
    const maxNodeCount = Math.max(nodeCountA, nodeCountB);
    if (maxNodeCount === 0 && nodeCountA === 0 && nodeCountB === 0) {
        // both are empty, high similarity
        return 1;
    }
    if (maxNodeCount === 0) return 0;
    const nodeCountScore = Math.min(nodeCountA, nodeCountB) / maxNodeCount;
    
    // Weighted average
    const totalScore = 
        titleScore * weights.title +
        sizeScore * weights.size +
        dateScore * weights.date +
        iconScore * weights.icon +
        nodeCountScore * weights.nodeCount;
        
    return totalScore;
};