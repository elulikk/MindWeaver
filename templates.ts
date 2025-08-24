import { MindMapCoreState, Node, Connection, Mininode, CanvasObject } from './types';
import { getEmptyCoreState } from './storeState';
import { ProjectTemplate } from './types';

const getBaseState = (): Omit<MindMapCoreState, 'nodes' | 'connections' | 'canvasTitle'> => ({
    mininodes: [],
    canvasObjects: [],
    nodeColor: '#475569',
    backgroundColor: '#202c3c',
    gridColor: '#3b4a60',
    showMininodePreviews: false,
    checkboxPosition: 'left',
    contextMenuEnabled: true,
    defaultEditorMode: 'split',
    autosaveEnabled: false,
});

const coffeeTemplate = (): MindMapCoreState => {
    const nodes: Node[] = [
        { id: 1, pos: { x: 50, y: 200 }, title: "1. Reunir Ingredientes", description: "- Granos de café\n- Molinillo\n- Agua\n- Tetera\n- Filtro\n- Taza", color: '#854d0e', size: { width: 220, height: 140 }, inputs: [], outputs: [{ id: '1-out', name: 'Listo' }], isComplete: false, inputLogic: 'AND', difficulty: 1, icon: 'template-coffee', isPinned: false, orderIndex: 1, time: 5 },
        { id: 2, pos: { x: 350, y: 80 }, title: "2. Moler los Granos", description: "Moler a un tamaño medio-fino.", color: '#475569', size: { width: 220, height: 120 }, inputs: [{ id: '2-in', name: '' }], outputs: [{ id: '2-out', name: '' }], isComplete: false, inputLogic: 'AND', difficulty: 2, isPinned: false, orderIndex: 2, time: 2 },
        { id: 3, pos: { x: 350, y: 280 }, title: "3. Calentar Agua", description: "Calentar a 90-96°C.", color: '#475569', size: { width: 220, height: 120 }, inputs: [{ id: '3-in', name: '' }], outputs: [{ id: '3-out', name: '' }], isComplete: false, inputLogic: 'AND', difficulty: 1, isPinned: false, orderIndex: 3, time: 3 },
        { id: 4, pos: { x: 650, y: 200 }, title: "4. Preparar Café", description: "Verter el agua sobre el café molido en el filtro.", color: '#475569', size: { width: 220, height: 140 }, inputs: [{ id: '4-in-a', name: '' }, { id: '4-in-b', name: '' }], outputs: [{ id: '4-out', name: '' }], isComplete: false, inputLogic: 'AND', difficulty: 3, isPinned: false, orderIndex: 4, time: 4 },
        { id: 5, pos: { x: 950, y: 200 }, title: "5. ¡A Disfrutar!", description: "Servir y disfrutar.", color: '#166534', size: { width: 220, height: 90 }, inputs: [{ id: '5-in', name: '' }], outputs: [], isComplete: false, inputLogic: 'OR', difficulty: 1, icon: 'check', isPinned: false, orderIndex: 5, time: 1 },
    ];
    const connections: Connection[] = [
        { fromNode: 1, fromPortId: '1-out', toNode: 2, toPortId: '2-in', isWireless: false }, { fromNode: 1, fromPortId: '1-out', toNode: 3, toPortId: '3-in', isWireless: false },
        { fromNode: 2, fromPortId: '2-out', toNode: 4, toPortId: '4-in-a', isWireless: false }, { fromNode: 3, fromPortId: '3-out', toNode: 4, toPortId: '4-in-b', isWireless: false },
        { fromNode: 4, fromPortId: '4-out', toNode: 5, toPortId: '5-in', isWireless: false },
    ];
    return { ...getEmptyCoreState(), canvasTitle: 'Cómo Hacer Café', nodes, connections, mininodes: [], canvasObjects: [] };
};

export const getTemplate = (template: ProjectTemplate): MindMapCoreState => {
    switch (template) {
        case 'empty':
            return getEmptyCoreState();
        case 'coffee':
            return coffeeTemplate();
        // The electron template is now removed as users can import their own JSON files.
        // This makes the app more flexible.
        case 'electron-compilation':
             return getEmptyCoreState();
        default:
            return getEmptyCoreState();
    }
}