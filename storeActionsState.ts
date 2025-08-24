
import { MindMapState, MindMapCoreState, IconName } from './types';
import { getCoreState, computeDerivedState } from './storeUtils';
import { db } from './db';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

let saveTimeout: number;
const debouncedSave = (state: MindMapCoreState, projectId: number) => {
    clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(() => {
        const projectUpdate: { title: string; state: MindMapCoreState; modifiedAt: Date } = {
            title: state.canvasTitle,
            state: state,
            modifiedAt: new Date(),
        };
        db.projects.update(projectId, projectUpdate).catch(err => console.error("Failed to save project:", err));
    }, 1000); // 1-second debounce
};


export const createStateActions = (set: SetState, get: GetState) => ({
    _updateState: (newState: Partial<Omit<MindMapState, 'actions'>>) => {
        const oldState = get();
        
        const nodes = newState.nodes ?? oldState.nodes;
        const mininodes = newState.mininodes ?? oldState.mininodes;
        const connections = newState.connections ?? oldState.connections;
        const canvasObjects = newState.canvasObjects ?? oldState.canvasObjects;
        const derived = computeDerivedState(nodes, mininodes, connections, canvasObjects);
        set({ ...newState, ...derived });
    },

    updateCoreState: (newState: Partial<MindMapCoreState>) => {
        const state = get();
        const { actions, ...currentState } = state;
        const currentCoreState = getCoreState(currentState);

        const updates: Partial<MindMapState> = {
            ...newState,
            pastStates: [...state.pastStates, currentCoreState],
            futureStates: [],
            isFileDirty: state.editingMode === 'file', // Mark as dirty on any core state change in file mode
        };
        
        const newCoreState = { ...currentCoreState, ...newState };

        if (state.editingMode === 'db' && state.currentProjectId && state.autosaveEnabled) {
            debouncedSave(newCoreState, state.currentProjectId);
        }

        get().actions._updateState(updates);
    },
    
    saveOrUpdateProject: async (options?: { silent?: boolean }) => {
        const state = get();
        const { actions } = state;
        const coreState = getCoreState(state);

        if (state.currentProjectId) {
            // Update existing project
            clearTimeout(saveTimeout); // Clear any pending debounced save
            try {
                const projectUpdate = {
                    title: coreState.canvasTitle,
                    state: coreState,
                    modifiedAt: new Date(),
                };

                await db.projects.update(state.currentProjectId, projectUpdate);
                await actions.loadProjects(); // Refresh project list to update modified time
                if (!options?.silent) {
                    actions._addLog(`Proyecto '${coreState.canvasTitle}' guardado.`, 'success');
                }
                set({ isFileDirty: false }); // Reset dirty state on manual save
            } catch (err: any) {
                console.error("Failed to update project:", err);
                actions._addLog(`Error al guardar el proyecto: ${err.message}`, 'error');
            }
        } else {
            // Create new project (from a file or a new canvas)
            try {
                const newProject = {
                    title: coreState.canvasTitle || 'Nuevo Proyecto',
                    state: coreState,
                    modifiedAt: new Date(),
                    icon: 'brain' as IconName,
                };
                const newId = await db.projects.add(newProject);
                set({
                    currentProjectId: newId,
                    editingMode: 'db',
                    currentFileHandle: null,
                    isFileDirty: false,
                });
                await actions.loadProjects();
                if (!options?.silent) {
                    actions._addLog(`Proyecto '${newProject.title}' guardado.`, 'success');
                }
            } catch (err: any) {
                console.error("Failed to create new project:", err);
                actions._addLog(`Error al crear el nuevo proyecto: ${err.message}`, 'error');
            }
        }
    },
});
