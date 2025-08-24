
import { MindMapState } from './types';
import { getCoreState } from './storeUtils';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createHistoryActions = (set: SetState, get: GetState) => ({
    undo: () => {
        const { pastStates, futureStates, actions } = get();
        if (pastStates.length === 0) return;
        const previousState = pastStates[pastStates.length - 1];
        const newPast = pastStates.slice(0, pastStates.length - 1);
        const currentCore = getCoreState(get());
        
        actions._updateState({
            ...previousState,
            pastStates: newPast,
            futureStates: [currentCore, ...futureStates],
        });
        actions._addLog('Acción deshecha.');
    },
    redo: () => {
        const { pastStates, futureStates, actions } = get();
        if (futureStates.length === 0) return;
        const nextState = futureStates[0];
        const newFuture = futureStates.slice(1);
        const currentCore = getCoreState(get());
        
        actions._updateState({
            ...nextState,
            pastStates: [...pastStates, currentCore],
            futureStates: newFuture,
        });
        actions._addLog('Acción rehecha.');
    },
    clearHistory: () => set({ pastStates: [], futureStates: [] }),
});
