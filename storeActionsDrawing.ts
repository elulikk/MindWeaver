

import { MindMapState, DrawingTool, CanvasObject, CanvasObjectShape } from './types';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createDrawingActions = (set: SetState, get: GetState) => ({
    setDrawingMode: (mode: DrawingTool | null) => {
        const currentMode = get().drawingMode;
        if (currentMode === mode) {
            set({ drawingMode: null, selectedCanvasObjectIds: new Set() }); // Toggle off and clear selection
        } else {
            set({
                drawingMode: mode,
                connectingInfo: null,
                selectedNodeIds: new Set(),
                selectedCanvasObjectIds: mode === 'edit' ? get().selectedCanvasObjectIds : new Set(),
            });
            if (mode) {
                get().actions._addLog(`Modo '${mode}' activado.`);
            }
        }
    },
    updateCanvasObject: (updatedObject: CanvasObject) => {
        const { canvasObjects, actions } = get();
        const newObjects = canvasObjects.map(obj => obj.id === updatedObject.id ? updatedObject : obj);
        actions.updateCoreState({ canvasObjects: newObjects });
        actions._addLog('Objeto de dibujo actualizado.', 'success');
    },
    requestDeleteSelectedCanvasObjects: () => {
        const { actions, selectedCanvasObjectIds } = get();
        if (selectedCanvasObjectIds.size > 0) {
            actions.openModal({ type: 'deleteCanvasObjects' });
        }
    },
    confirmDeleteSelectedCanvasObjects: () => {
        const { canvasObjects, selectedCanvasObjectIds, actions } = get();
        const newObjects = canvasObjects.filter(obj => !selectedCanvasObjectIds.has(obj.id));
        actions.updateCoreState({ canvasObjects: newObjects });
        set({ selectedCanvasObjectIds: new Set() });
        actions.closeModal();
        actions._addLog(`${selectedCanvasObjectIds.size} objeto(s) de dibujo eliminado(s).`, 'warning');
    },
    updateSelectedCanvasObjects: (updates: Partial<CanvasObject>) => {
        const { canvasObjects, selectedCanvasObjectIds, actions } = get();
        const newObjects: CanvasObject[] = canvasObjects.map(obj => {
            if (selectedCanvasObjectIds.has(obj.id)) {
                const newObj = { ...obj };
                if ((newObj.type === 'rect' || newObj.type === 'ellipse')) {
                    if ('fillColor' in updates && typeof updates.fillColor === 'string') newObj.fillColor = updates.fillColor;
                    if ('strokeColor' in updates && typeof updates.strokeColor === 'string') newObj.strokeColor = updates.strokeColor;
                    if ('strokeWidth' in updates && typeof updates.strokeWidth === 'number') newObj.strokeWidth = updates.strokeWidth;
                    if ('fillOpacity' in updates && typeof updates.fillOpacity === 'number') newObj.fillOpacity = updates.fillOpacity;
                    if ('strokeOpacity' in updates && typeof updates.strokeOpacity === 'number') newObj.strokeOpacity = updates.strokeOpacity;
                }
                if (newObj.type === 'line') {
                    if ('strokeColor' in updates && typeof updates.strokeColor === 'string') newObj.strokeColor = updates.strokeColor;
                    if ('strokeWidth' in updates && typeof updates.strokeWidth === 'number') newObj.strokeWidth = updates.strokeWidth;
                }
                return newObj;
            }
            return obj;
        });
        actions.updateCoreState({ canvasObjects: newObjects });
    },
    toggleSwarm: (objectId: string) => {
        const { canvasObjects, actions } = get();
        const newObjects = canvasObjects.map(obj => {
            if (obj.id === objectId && obj.type === 'rect') {
                return { ...obj, isSwarm: !obj.isSwarm };
            }
            return obj;
        });
        actions.updateCoreState({ canvasObjects: newObjects });
        const isNowSwarm = (newObjects.find(o => o.id === objectId) as CanvasObjectShape)?.isSwarm;
        actions._addLog(`Objeto convertido en ${isNowSwarm ? 'Enjambre' : 'Figura'}.`, 'success');
    },
});