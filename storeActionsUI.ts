

import { MindMapState, ActiveModal, ContextMenu, PanelState, LogEntry } from './types';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

let logIdCounter = 0;
const MAX_LOG_ENTRIES = 200;

export const createUIActions = (set: SetState, get: GetState) => ({
    openModal: (modal: ActiveModal) => set(state => ({ activeModals: [...state.activeModals, modal] })),
    closeModal: () => set(state => ({ activeModals: state.activeModals.slice(0, -1) })),
    replaceActiveModal: (modal: ActiveModal) => {
        set(state => {
            const newActiveModals = [...state.activeModals];
            if (newActiveModals.length > 0) {
                newActiveModals[newActiveModals.length - 1] = modal;
                return { activeModals: newActiveModals };
            }
            return {}; // No change if no modals are active
        });
    },
    openContextMenu: (menu: ContextMenu) => set({ contextMenu: menu }),
    closeContextMenu: () => set({ contextMenu: null, connectingInfo: null }),
    
    toggleExplorer: () => get().actions.setPanelState('explorer', { collapsed: !get().panelStates.explorer.collapsed }),
    
    setPanelState: (panelId: string, newState: Partial<PanelState>) => {
        set(state => ({
            panelStates: {
                ...state.panelStates,
                [panelId]: { ...state.panelStates[panelId], ...newState },
            },
        }));
    },
    
    toggleLogPanel: () => set(state => ({ isLogPanelOpen: !state.isLogPanelOpen })),
    clearLogHistory: () => set({ logHistory: [] }),
    _addLog: (message: string, type: LogEntry['type'] = 'info') => {
        const newLog: LogEntry = {
            id: logIdCounter++,
            timestamp: new Date(),
            message,
            type,
        };
        set(state => ({
            logHistory: [newLog, ...state.logHistory].slice(0, MAX_LOG_ENTRIES),
        }));
    },
    toggleFocusMode: () => {
        const wasEnabled = get().focusModeEnabled;
        set({ focusModeEnabled: !wasEnabled });
        get().actions._addLog(`Modo enfoque ${!wasEnabled ? 'activado' : 'desactivado'}.`);
    },
});