import { MindMapCoreState, Node, Connection, Mininode, CanvasObject } from './types';
import { getEmptyCoreState } from './storeState';
import { ProjectTemplate } from './types';

const getBaseState = (): Omit<MindMapCoreState, 'nodes' | 'connections' | 'canvasTitle'> => ({
    // FIX: Added missing uuid property to conform to Omit<MindMapCoreState, ...>
    uuid: crypto.randomUUID(),
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
    return {
        // FIX: Added missing uuid property to conform to MindMapCoreState
        uuid: "coffee-template-a1b2c3d4e5f6",
        nodes: [
            {
                "id": 1,
                "pos": { "x": 50, "y": 300 },
                "title": "1. Seleccionar Ingredientes",
                "description": "Elige granos de alta calidad y agua filtrada para el mejor sabor.",
                "color": "#854d0e",
                "size": { "width": 220, "height": 110 },
                "inputs": [],
                "outputs": [{ "id": "1-out-main", "name": "Listo" }, { "id": "1-out-optional", "name": "Opcional" }],
                "isComplete": false, "inputLogic": "AND", "difficulty": 1, "icon": "template-coffee",
                "isPinned": true, "orderIndex": 1, "time": 5
            },
            {
                "id": 2, "pos": { "x": 350, "y": 80 }, "title": "2. Moler Granos",
                "description": "Muele los granos justo antes de prepararlos. Busca una consistencia media-fina, como la sal de mesa.",
                "color": "#52525b", "size": { "width": 220, "height": 120 }, "inputs": [{ "id": "2-in", "name": "" }],
                "outputs": [{ "id": "2-out", "name": "Molido" }], "isComplete": false, "inputLogic": "AND",
                "difficulty": 2, "isPinned": false, "orderIndex": 2, "time": 2
            },
            {
                "id": 3, "pos": { "x": 356, "y": 256 }, "title": "3. Calentar Agua",
                "description": "Calienta el agua a 90-96°C (195-205°F). Una buena estimación es hervirla y dejarla reposar 30 segundos.",
                "color": "#52525b", "size": { "width": 220, "height": 120 }, "inputs": [{ "id": "3-in", "name": "" }],
                "outputs": [{ "id": "3-out", "name": "Agua Caliente" }], "isComplete": false, "inputLogic": "AND",
                "difficulty": 2, "isPinned": false, "orderIndex": 3, "time": 3
            },
            {
                "id": 4, "pos": { "x": 350, "y": 450 }, "title": "4. Elegir Complementos (Opcional)",
                "description": "Selecciona leche, crema, azúcar o siropes para personalizar tu café más adelante.",
                "color": "#4f46e5", "size": { "width": 220, "height": 110 }, "inputs": [{ "id": "4-in", "name": "Desde Inicio" }],
                "outputs": [{ "id": "4-out-drip", "name": "Para Goteo" }, { "id": "4-out-press", "name": "Para Prensa" }, { "id": "4-out-espresso", "name": "Para Espresso" }],
                "isComplete": false, "inputLogic": "AND", "difficulty": 1, "isPinned": false, "orderIndex": 4, "time": 1
            },
            {
                "id": 5, "pos": { "x": 650, "y": 150 }, "title": "5. Combinar y Preparar",
                "description": "Este es el paso crucial donde se extrae el café. Elige uno de los siguientes métodos.",
                "color": "#52525b", "size": { "width": 220, "height": 120 }, "inputs": [{ "id": "5-in-grounds", "name": "Molido" }, { "id": "5-in-water", "name": "Agua" }],
                "outputs": [{ "id": "5-out", "name": "Preparado" }], "isComplete": false, "inputLogic": "AND", "difficulty": 4, "isPinned": false, "orderIndex": 5, "time": 0
            },
            {
                "id": 6, "pos": { "x": 950, "y": 50 }, "title": "6a. Método de Goteo",
                "description": "Vierte agua caliente sobre el café molido en un filtro. El clásico, una taza limpia.",
                "color": "#52525b", "size": { "width": 220, "height": 110 }, "inputs": [{ "id": "6-in", "name": "Preparar" }, { "id": "6-in-add", "name": "Complementos" }],
                "outputs": [{ "id": "6-out", "name": "Café" }], "isComplete": false, "inputLogic": "AND", "difficulty": 3, "isPinned": false, "orderIndex": 6, "time": 4
            },
            {
                "id": 7, "pos": { "x": 950, "y": 200 }, "title": "6b. Prensa Francesa",
                "description": "Infusiona el molido directamente en agua caliente antes de presionar un émbolo para separarlos. Sabor con cuerpo.",
                "color": "#52525b", "size": { "width": 220, "height": 110 }, "inputs": [{ "id": "7-in", "name": "Preparar" }, { "id": "7-in-add", "name": "Complementos" }],
                "outputs": [{ "id": "7-out", "name": "Café" }], "isComplete": false, "inputLogic": "AND", "difficulty": 4, "isPinned": false, "orderIndex": 7, "time": 5
            },
            {
                "id": 8, "pos": { "x": 950, "y": 350 }, "title": "6c. Espresso",
                "description": "Fuerza agua caliente a presión a través de café finamente molido. Concentrado e intenso.",
                "color": "#52525b", "size": { "width": 220, "height": 110 }, "inputs": [{ "id": "8-in", "name": "Preparar" }, { "id": "8-in-add", "name": "Complementos" }],
                "outputs": [{ "id": "8-out", "name": "Café" }], "isComplete": false, "inputLogic": "AND", "difficulty": 5, "isPinned": false, "orderIndex": 8, "time": 1
            },
            {
                "id": 9, "pos": { "x": 1250, "y": 200 }, "title": "7. ¡A Disfrutar!",
                "description": "Tu taza de café perfecta está lista. ¡Disfrútala!",
                "color": "#166534", "size": { "width": 220, "height": 90 }, "inputs": [{ "id": "9-in-drip", "name": "Goteo" }, { "id": "9-in-press", "name": "Prensa" }, { "id": "9-in-espresso", "name": "Espresso" }],
                "outputs": [{ "id": "9-out-feedback", "name": "Opinión" }], "isComplete": false, "inputLogic": "OR", "difficulty": 1, "isPinned": false, "orderIndex": 9, "time": 1
            },
            {
                "id": 10, "pos": { "x": 1616.3636363636365, "y": 175.45454545454544 }, "title": "Solución de Problemas",
                "description": "Prueba tu café. ¿Está bien?\n- **¿Amargo?** Tu molido puede ser demasiado fino o lo preparaste por mucho tiempo.\n- **¿Ácido?** Tu molido puede ser demasiado grueso o el agua no estaba lo suficientemente caliente.",
                "color": "#be123c", "size": { "width": 220, "height": 140 }, "inputs": [{ "id": "10-in", "name": "Desde Bebida" }],
                "outputs": [], "isComplete": false, "inputLogic": "AND", "difficulty": 0, "icon": "warning", "isPinned": false, "orderIndex": 10, "time": 0
            }
        ],
        mininodes: [],
        connections: [
            { "fromNode": 1, "fromPortId": "1-out-main", "toNode": 2, "toPortId": "2-in" },
            { "fromNode": 1, "fromPortId": "1-out-main", "toNode": 3, "toPortId": "3-in" },
            { "fromNode": 2, "fromPortId": "2-out", "toNode": 5, "toPortId": "5-in-grounds" },
            { "fromNode": 3, "fromPortId": "3-out", "toNode": 5, "toPortId": "5-in-water" },
            { "fromNode": 5, "fromPortId": "5-out", "toNode": 6, "toPortId": "6-in" },
            { "fromNode": 5, "fromPortId": "5-out", "toNode": 7, "toPortId": "7-in" },
            { "fromNode": 5, "fromPortId": "5-out", "toNode": 8, "toPortId": "8-in" },
            { "fromNode": 6, "fromPortId": "6-out", "toNode": 9, "toPortId": "9-in-drip" },
            { "fromNode": 7, "fromPortId": "7-out", "toNode": 9, "toPortId": "9-in-press" },
            { "fromNode": 8, "fromPortId": "8-out", "toNode": 9, "toPortId": "9-in-espresso" },
            { "fromNode": 1, "fromPortId": "1-out-optional", "toNode": 4, "toPortId": "4-in", "isWireless": true },
            { "fromNode": 4, "fromPortId": "4-out-drip", "toNode": 6, "toPortId": "6-in-add", "isWireless": true },
            { "fromNode": 4, "fromPortId": "4-out-press", "toNode": 7, "toPortId": "7-in-add", "isWireless": true },
            { "fromNode": 4, "fromPortId": "4-out-espresso", "toNode": 8, "toPortId": "8-in-add", "isWireless": false },
            { "fromNode": 9, "fromPortId": "9-out-feedback", "toNode": 10, "toPortId": "10-in", "isWireless": true }
        ],
        canvasObjects: [
            { "id": "line_1756654335198_pxv30t1", "type": "line", "start": { "x": 200.9316239316241, "y": 538.8867521367521 }, "end": { "x": 280.1623931623933, "y": 414.27136752136744 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654342625_777daie", "type": "line", "start": { "x": 201.70085470085488, "y": 538.8867521367521 }, "end": { "x": 308.62393162393175, "y": 496.57905982905976 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654343780_jp7h7mu", "type": "line", "start": { "x": 302.4700854700856, "y": 494.27136752136744 }, "end": { "x": 310.9316239316241, "y": 495.809829059829 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654344446_68m6fy1", "type": "line", "start": { "x": 310.9316239316241, "y": 495.809829059829 }, "end": { "x": 303.2393162393164, "y": 507.34829059829053 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654345688_ey0x7dx", "type": "line", "start": { "x": 272.4700854700856, "y": 418.1175213675213 }, "end": { "x": 280.1623931623933, "y": 414.27136752136744 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654347195_61q4xw9", "type": "line", "start": { "x": 280.1623931623933, "y": 414.27136752136744 }, "end": { "x": 280.1623931623933, "y": 428.1175213675213 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "text_1756654351179_7d34kr4", "type": "text", "pos": { "x": 87.77777777777797, "y": 526.7329059829058 }, "text": "conexiones inhalambricas\n(solo estetico)", "fontSize": 16, "color": "#e4e4e7", "width": 120, "height": 83, "textAlign": "center" },
            { "id": "rect_1756654447256_5lvveg2", "type": "rect", "pos": { "x": 882.2742812742814, "y": -12.13364413364409 }, "size": { "width": 411.81818181818187, "height": 556.3636363636364 }, "fillColor": "rgba(100, 100, 200, 0.2)", "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654454526_ozfqzmj", "type": "line", "start": { "x": 1252.2742812742813, "y": 298.77544677544677 }, "end": { "x": 1451.3651903651905, "y": 464.22999222999226 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654457898_bpqd7my", "type": "line", "start": { "x": 1252.2742812742813, "y": 300.59362859362864 }, "end": { "x": 1256.8197358197358, "y": 319.6845376845377 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654458791_q84c47i", "type": "line", "start": { "x": 1252.2742812742813, "y": 299.6845376845377 }, "end": { "x": 1269.5470085470085, "y": 302.41181041181045 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "text_1756654461434_itfewfr", "type": "text", "pos": { "x": 1455.0015540015543, "y": 450.59362859362864 }, "text": "solo 1 opcion es necesaria", "fontSize": 16, "color": "#e4e4e7", "width": 150, "height": 60.909090909091, "textAlign": "center" },
            { "id": "text_1756654508674_0de8ttt", "type": "text", "pos": { "x": 858.0502553002553, "y": -135.8089688089688 }, "text": "<u><b>TUTORIAL</b></u>", "fontSize": 16, "color": "#e4e4e7", "width": 150, "height": 40, "textAlign": "center" },
            { "id": "ellipse_1756654611831_u8jatit", "type": "ellipse", "pos": { "x": 433.2255799755801, "y": 48.15531690531691 }, "size": { "width": 341, "height": 339 }, "fillColor": "rgba(100, 100, 200, 0.2)", "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654629923_4giu77r", "type": "line", "start": { "x": 632.2255799755801, "y": 163.1553169053169 }, "end": { "x": 547.2255799755801, "y": -11.844683094683091 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654636023_5ie3ky1", "type": "line", "start": { "x": 633.2255799755801, "y": 161.1553169053169 }, "end": { "x": 635.2255799755801, "y": 137.1553169053169 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654637285_72qw6gl", "type": "line", "start": { "x": 632.2255799755801, "y": 162.1553169053169 }, "end": { "x": 613.2255799755801, "y": 151.1553169053169 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "text_1756654640092_agsxnq2", "type": "text", "pos": { "x": 421.2255799755801, "y": -67.84468309468309 }, "text": "los dos pasos previos son necesarios", "fontSize": 16, "color": "#e4e4e7", "width": 150, "height": 40, "textAlign": "center" },
            { "id": "line_1756654660655_x4cdljb", "type": "line", "start": { "x": 96.55891330891345, "y": 247.0719835719835 }, "end": { "x": 123.2255799755801, "y": 262.48865023865017 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654662064_xpjfq65", "type": "line", "start": { "x": 123.2255799755801, "y": 262.48865023865017 }, "end": { "x": 127.39224664224676, "y": 230.8219835719835 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654663182_a14bwuj", "type": "line", "start": { "x": 123.2255799755801, "y": 259.15531690531685 }, "end": { "x": 24.892246642246786, "y": 74.15531688 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "text_1756654666982_7iflf85", "type": "text", "pos": { "x": -173.38156288156273, "y": -6.916111666111682 }, "text": "<u><b>EMPEZAR ACA(bandera verde)</b></u>\nlos nodos con brillo celeste son los que corresponden hacer", "fontSize": 16, "color": "#e4e4e7", "width": 238.57142857142856, "height": 77.14285714285714, "textAlign": "center" },
            { "id": "line_1756654777669_5oykgsu", "type": "line", "start": { "x": 42.2930402930404, "y": 323.5600788100788 }, "end": { "x": -93.81807081807072, "y": 358.00452325452324 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654779819_gyde2s9", "type": "line", "start": { "x": 25.62637362637373, "y": 313.5600788100788 }, "end": { "x": 42.2930402930404, "y": 325.782301032301 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "line_1756654780957_za88gn3", "type": "line", "start": { "x": 42.2930402930404, "y": 325.782301032301 }, "end": { "x": 26.73748473748484, "y": 333.5600788100788 }, "strokeColor": "#a7b4c2", "strokeWidth": 2 },
            { "id": "text_1756654784326_ymt0s6f", "type": "text", "pos": { "x": -239.37362637362628, "y": 347.44896769896764 }, "text": "CHECK una vez completado", "fontSize": 16, "color": "#e4e4e7", "width": 150, "height": 40, "textAlign": "center" }
        ],
        nodeColor: "#52525b",
        backgroundColor: "#27272a",
        gridColor: "#3f3f46",
        canvasTitle: "Ejemplo Simple: Hacer Cafe",
        showMininodePreviews: false,
        checkboxPosition: "left",
        contextMenuEnabled: true,
        defaultEditorMode: "split",
        autosaveEnabled: false,
    };
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
            // FIX: Corrected typo from getEmptyCorecState to getEmptyCoreState
             return getEmptyCoreState();
        default:
            return getEmptyCoreState();
    }
}