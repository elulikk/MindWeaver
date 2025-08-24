

import { Node, Connection, MindMapState, MindMapCoreState, Mininode, CanvasObject } from './types';
import { isColorDark } from './utils';

export const computeDerivedState = (nodes: Node[], mininodes: Mininode[], connections: Connection[], canvasObjects: CanvasObject[]) => {
    const nodesById = Object.fromEntries(nodes.map(n => [n.id, n]));
    const mininodesById = Object.fromEntries(mininodes.map(m => [m.id, m]));
    const canvasObjectsById = Object.fromEntries(canvasObjects.map(o => [o.id, o]));
    const mininodesByParentId: { [key: number]: Mininode[] } = {};
    for (const mininode of mininodes) {
        if (!mininodesByParentId[mininode.parentId]) {
            mininodesByParentId[mininode.parentId] = [];
        }
        mininodesByParentId[mininode.parentId].push(mininode);
    }

    const completedNodeIds = new Set(nodes.filter(n => n.isComplete).map(n => n.id));
    const incomingConnectionsMap = new Map<number, Connection[]>();
    connections.forEach(conn => {
        if (!incomingConnectionsMap.has(conn.toNode)) {
            incomingConnectionsMap.set(conn.toNode, []);
        }
        incomingConnectionsMap.get(conn.toNode)!.push(conn);
    });

    const statusMap = new Map<number, { activeInputs: Set<string>, isConditionMet: boolean }>();
    for (const node of nodes) {
        const incoming = incomingConnectionsMap.get(node.id) || [];
        const connectedInputIds = new Set(incoming.map(c => c.toPortId));
        const activeInputIds = new Set(incoming.filter(c => completedNodeIds.has(c.fromNode)).map(c => c.toPortId));
        let isConditionMet = false;

        if (node.inputs.length === 0) {
            isConditionMet = true;
        } else if (node.inputLogic === 'AND') {
            // Vacuously true if no inputs are connected, otherwise all connected inputs must be active.
            isConditionMet = connectedInputIds.size === activeInputIds.size;
        } else { // OR
            isConditionMet = activeInputIds.size > 0;
        }
        statusMap.set(node.id, { activeInputs: activeInputIds, isConditionMet });
    }
    
    return { nodesById, mininodesById, mininodesByParentId, canvasObjectsById, nodeStatus: statusMap, isDarkTheme: true };
};
    
const coreStateKeys: (keyof MindMapCoreState)[] = ['nodes', 'mininodes', 'connections', 'canvasObjects', 'nodeColor', 'backgroundColor', 'gridColor', 'canvasTitle', 'showMininodePreviews', 'checkboxPosition', 'contextMenuEnabled', 'defaultEditorMode', 'autosaveEnabled'];
export const getCoreState = (state: Omit<MindMapState, 'actions'>): MindMapCoreState => {
    return coreStateKeys.reduce((acc, key) => {
        acc[key] = state[key];
        return acc;
    }, {} as any);
};

export const getPortY = (index: number, total: number, height: number): number => {
    if (total <= 1) return height / 2;
    return (height / (total + 1)) * (index + 1);
};
