import { Node, Connection, MindMapCoreState, Mininode, IconName, CanvasObject, Language } from './types';

export const SCHEMA_VERSION = 6;

export interface SaveData {
  nodes: Node[];
  mininodes: Mininode[];
  connections: Connection[];
  canvasObjects?: CanvasObject[];
  canvasTitle: string;
  backgroundColor: string;
  gridColor: string;
  nodeColor: string;
  showMininodePreviews: boolean;
  checkboxPosition: 'left' | 'right';
  contextMenuEnabled: boolean;
  defaultEditorMode?: 'edit' | 'split' | 'preview';
  uiPrimaryColor?: string;
  uiBackgroundColor?: string;
  schemaVersion: number;
  icon?: IconName;
  autosaveEnabled?: boolean;
}

export const getEmptyCoreState = (): MindMapCoreState => {
    return {
        nodes: [],
        mininodes: [],
        connections: [],
        canvasObjects: [],
        nodeColor: '#52525b', // zinc-600
        backgroundColor: '#27272a', // zinc-800
        gridColor: '#3f3f46', // zinc-700
        canvasTitle: 'Mapa sin Título',
        showMininodePreviews: false,
        checkboxPosition: 'left',
        contextMenuEnabled: true,
        defaultEditorMode: 'split',
        autosaveEnabled: false,
    }
}

export const getInitialState = (): MindMapCoreState => {
    const initialNodeColor = '#52525b'; // zinc-600

    const initialNodes: Node[] = [
        {
            id: 1, pos: { x: 50, y: 300 }, title: "1. Seleccionar Ingredientes",
            description: "Elige granos de alta calidad y agua filtrada para el mejor sabor.",
            color: '#854d0e', size: { width: 220, height: 110 }, inputs: [],
            outputs: [{ id: '1-out-main', name: 'Listo' }, { id: '1-out-optional', name: 'Opcional' }], isComplete: false, inputLogic: 'AND', difficulty: 1, icon: 'template-coffee', isPinned: false, orderIndex: 1, time: 5,
        },
        {
            id: 2, pos: { x: 350, y: 80 }, title: "2. Moler Granos",
            description: "Muele los granos justo antes de prepararlos. Busca una consistencia media-fina, como la sal de mesa.",
            color: initialNodeColor, size: { width: 220, height: 120 }, inputs: [{ id: '2-in', name: '' }],
            outputs: [{ id: '2-out', name: 'Molido' }], isComplete: false, inputLogic: 'AND', difficulty: 2, isPinned: false, orderIndex: 2, time: 2,
        },
        {
            id: 3, pos: { x: 350, y: 230 }, title: "3. Calentar Agua",
            description: "Calienta el agua a 90-96°C (195-205°F). Una buena estimación es hervirla y dejarla reposar 30 segundos.",
            color: initialNodeColor, size: { width: 220, height: 120 }, inputs: [{ id: '3-in', name: '' }],
            outputs: [{ id: '3-out', name: 'Agua Caliente' }], isComplete: false, inputLogic: 'AND', difficulty: 2, isPinned: false, orderIndex: 3, time: 3,
        },
        {
            id: 4, pos: { x: 350, y: 450 }, title: "4. Elegir Complementos (Opcional)",
            description: "Selecciona leche, crema, azúcar o siropes para personalizar tu café más adelante.",
            color: '#4f46e5', size: { width: 220, height: 110 }, inputs: [{ id: '4-in', name: 'Desde Inicio' }],
            outputs: [
                { id: '4-out-drip', name: 'Para Goteo' },
                { id: '4-out-press', name: 'Para Prensa' },
                { id: '4-out-espresso', name: 'Para Espresso' }
            ], isComplete: false, inputLogic: 'AND', difficulty: 1, isPinned: false, orderIndex: 4, time: 1,
        },
        {
            id: 5, pos: { x: 650, y: 150 }, title: "5. Combinar y Preparar",
            description: "Este es el paso crucial donde se extrae el café. Elige uno de los siguientes métodos.",
            color: initialNodeColor, size: { width: 220, height: 120 }, inputs: [{ id: '5-in-grounds', name: 'Molido' }, { id: '5-in-water', name: 'Agua' }],
            outputs: [{ id: '5-out', name: 'Preparado' }], isComplete: false, inputLogic: 'AND', difficulty: 4, isPinned: false, orderIndex: 5, time: 0,
        },
        {
            id: 6, pos: { x: 950, y: 50 }, title: "6a. Método de Goteo",
            description: "Vierte agua caliente sobre el café molido en un filtro. El clásico, una taza limpia.",
            color: initialNodeColor, size: { width: 220, height: 110 }, inputs: [{ id: '6-in', name: 'Preparar' }, { id: '6-in-add', name: 'Complementos' }],
            outputs: [{ id: '6-out', name: 'Café' }], isComplete: false, inputLogic: 'AND', difficulty: 3, isPinned: false, orderIndex: 6, time: 4,
        },
        {
            id: 7, pos: { x: 950, y: 200 }, title: "6b. Prensa Francesa",
            description: "Infusiona el molido directamente en agua caliente antes de presionar un émbolo para separarlos. Sabor con cuerpo.",
            color: initialNodeColor, size: { width: 220, height: 110 }, inputs: [{ id: '7-in', name: 'Preparar' }, { id: '7-in-add', name: 'Complementos' }],
            outputs: [{ id: '7-out', name: 'Café' }], isComplete: false, inputLogic: 'AND', difficulty: 4, isPinned: false, orderIndex: 7, time: 5,
        },
        {
            id: 8, pos: { x: 950, y: 350 }, title: "6c. Espresso",
            description: "Fuerza agua caliente a presión a través de café finamente molido. Concentrado e intenso.",
            color: initialNodeColor, size: { width: 220, height: 110 }, inputs: [{ id: '8-in', name: 'Preparar' }, { id: '8-in-add', name: 'Complementos' }],
            outputs: [{ id: '8-out', name: 'Café' }], isComplete: false, inputLogic: 'AND', difficulty: 5, isPinned: false, orderIndex: 8, time: 1,
        },
        {
            id: 9, pos: { x: 1250, y: 200 }, title: "7. ¡A Disfrutar!",
            description: "Tu taza de café perfecta está lista. ¡Disfrútala!",
            color: '#166534', size: { width: 220, height: 90 }, inputs: [{ id: '9-in-drip', name: 'Goteo' }, { id: '9-in-press', name: 'Prensa' }, { id: '9-in-espresso', name: 'Espresso' }],
            outputs: [{ id: '9-out-feedback', name: 'Opinión' }], isComplete: false, inputLogic: 'OR', difficulty: 1, isPinned: false, orderIndex: 9, time: 1,
        },
        {
            id: 10, pos: { x: 1250, y: 450 }, title: "Solución de Problemas",
            description: "Prueba tu café. ¿Está bien?\n- **¿Amargo?** Tu molido puede ser demasiado fino o lo preparaste por mucho tiempo.\n- **¿Ácido?** Tu molido puede ser demasiado grueso o el agua no estaba lo suficientemente caliente.",
            color: '#be123c', size: { width: 220, height: 140 }, inputs: [{ id: '10-in', name: 'Desde Bebida' }],
            outputs: [], isComplete: false, inputLogic: 'AND', difficulty: 0, icon: 'warning', isPinned: false, orderIndex: 10, time: 0,
        },
    ];

    const initialConnections: Connection[] = [
        // Main path
        { fromNode: 1, fromPortId: '1-out-main', toNode: 2, toPortId: '2-in' },
        { fromNode: 1, fromPortId: '1-out-main', toNode: 3, toPortId: '3-in' },
        { fromNode: 2, fromPortId: '2-out', toNode: 5, toPortId: '5-in-grounds' },
        { fromNode: 3, fromPortId: '3-out', toNode: 5, toPortId: '5-in-water' },
        // Brew methods
        { fromNode: 5, fromPortId: '5-out', toNode: 6, toPortId: '6-in' },
        { fromNode: 5, fromPortId: '5-out', toNode: 7, toPortId: '7-in' },
        { fromNode: 5, fromPortId: '5-out', toNode: 8, toPortId: '8-in' },
        // To final node
        { fromNode: 6, fromPortId: '6-out', toNode: 9, toPortId: '9-in-drip' },
        { fromNode: 7, fromPortId: '7-out', toNode: 9, toPortId: '9-in-press' },
        { fromNode: 8, fromPortId: '8-out', toNode: 9, toPortId: '9-in-espresso' },
        // Wireless connections
        { fromNode: 1, fromPortId: '1-out-optional', toNode: 4, toPortId: '4-in', isWireless: true },
        { fromNode: 4, fromPortId: '4-out-drip', toNode: 6, toPortId: '6-in-add', isWireless: true },
        { fromNode: 4, fromPortId: '4-out-press', toNode: 7, toPortId: '7-in-add', isWireless: true },
        { fromNode: 4, fromPortId: '4-out-espresso', toNode: 8, toPortId: '8-in-add', isWireless: true },
        { fromNode: 9, fromPortId: '9-out-feedback', toNode: 10, toPortId: '10-in', isWireless: true },
    ];
    
    return {
        ...getEmptyCoreState(),
        nodes: initialNodes,
        connections: initialConnections,
        canvasTitle: 'Cómo Hacer Café (Avanzado)',
    }
}