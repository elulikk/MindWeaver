import { create } from 'zustand';
import { MindMapState } from './types';
import { getInitialState } from './storeState';
import { computeDerivedState } from './storeUtils';
import { createActions } from './storeActions';
import { Language } from './components/locales/i18n';

export const useMindMapStore = create<MindMapState>()((set, get) => {
    
    const coreInitialState = getInitialState();
    
    // Initialize language from localStorage, separate from core state
    let initialLanguage: Language = 'es';
    try {
        const savedLang = localStorage.getItem('mindweaver-lang') as Language | null;
        if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
            initialLanguage = savedLang;
        }
    } catch (e) {
        console.warn("Could not read language from localStorage", e);
    }

    const derivedState = computeDerivedState(coreInitialState.nodes, coreInitialState.mininodes, coreInitialState.connections, coreInitialState.canvasObjects);

    return {
        ...coreInitialState,
        language: initialLanguage,
        viewOffset: { x: 0, y: 0 },
        zoom: 1,
        mainSize: { width: 0, height: 0 },
        connectingInfo: null,
        mousePosition: { x: 0, y: 0 },
        isPanning: false,
        panStart: { x: 0, y: 0 },
        isLoading: false,
        selectedNodeIds: new Set(),
        selectedCanvasObjectIds: new Set(),
        isSelecting: false,
        selectionStart: null,
        selectionRect: null,
        activeModals: [],
        contextMenu: null,
        dragInfo: { isDragging: false, startPos: {x:0, y:0}, initialNodePositions: new Map(), initialMininodePositions: new Map() },
        resizeInfo: null,
        clipboard: null,
        pastStates: [],
        futureStates: [],
        
        // Project Explorer State
        isExplorerOpen: true, // Legacy, kept for compatibility but managed by panelStates
        projects: [],
        userTemplates: [],
        currentProjectId: null,
        panelStates: {
            explorer: { collapsed: true, pinned: true },
        },

        // Log Panel State
        isLogPanelOpen: false,
        logHistory: [],

        // File editing state
        currentFileHandle: null,
        editingMode: 'db',
        isFileDirty: false,

        // Drawing state
        drawingMode: null,
        drawingObject: null,
        canvasObjectDragInfo: null,
        draggedMininodeInfo: null,
        
        // UI State
        focusModeEnabled: false,

        ...derivedState,

        actions: createActions(set, get),
    };
});