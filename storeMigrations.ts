

import { MindMapCoreState } from './types';
import { SaveData } from './storeState';

export const sanitizeAndMigrateState = (data: Partial<SaveData>): MindMapCoreState => {
    const nodes = (data.nodes || [])
        .filter(n => n && typeof n.id === 'number')
        .map((n: any, index: number) => ({
        id: n.id,
        pos: n.pos || { x: 0, y: 0 },
        title: n.title || 'Untitled Node',
        description: n.description || '',
        color: n.color || '#475569',
        size: n.size || { width: 180, height: 80 },
        inputs: Array.isArray(n.inputs) ? n.inputs : [],
        outputs: Array.isArray(n.outputs) ? n.outputs : [],
        isComplete: n.isComplete ?? false,
        inputLogic: n.inputLogic || 'AND',
        difficulty: n.difficulty ?? 1,
        icon: n.icon,
        iconColor: n.iconColor,
        isPinned: n.isPinned ?? false,
        synthesis: n.synthesis, // Keep synthesis if present
        orderIndex: n.orderIndex ?? (n.id || index + 1), // Assign order index for backwards compatibility
        time: n.time ?? 0, // Add time property for backwards compatibility
    }));

    const mininodes = (data.mininodes || []).map((m: any) => ({
        id: m.id,
        parentId: m.parentId,
        title: m.title || 'untitled.txt',
        content: m.content || '',
        icon: m.icon || 'txt',
        pos: m.pos || { x: 0, y: 0 },
    }));
    
    const validNodeIds = new Set(nodes.map(n => n.id));
    const connections = (data.connections || [])
        .filter(c => c && validNodeIds.has(c.fromNode) && validNodeIds.has(c.toNode) && c.fromPortId && c.toPortId)
        .map((c: any) => ({
            fromNode: c.fromNode,
            fromPortId: c.fromPortId,
            toNode: c.toNode,
            toPortId: c.toPortId,
            isWireless: c.isWireless ?? false,
        }));

    const canvasObjects = (data.canvasObjects || []).filter(o => o && o.id && o.type);

    return {
        nodes,
        mininodes,
        connections,
        canvasObjects,
        canvasTitle: data.canvasTitle || 'Untitled',
        backgroundColor: data.backgroundColor || '#202c3c',
        gridColor: data.gridColor || '#3b4a60',
        nodeColor: data.nodeColor || '#475569',
        showMininodePreviews: data.showMininodePreviews ?? false,
        checkboxPosition: data.checkboxPosition || 'left',
        contextMenuEnabled: data.contextMenuEnabled ?? true,
        defaultEditorMode: data.defaultEditorMode || 'split',
        autosaveEnabled: data.autosaveEnabled ?? false,
    };
};