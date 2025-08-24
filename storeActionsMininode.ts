import { MindMapState, Mininode } from './types';
import { getNewMininodeId } from './utils';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createMininodeActions = (set: SetState, get: GetState) => ({
    addMininode: (parentId: number) => {
        const { mininodes, actions } = get();
        const newMininode: Mininode = {
            id: getNewMininodeId(mininodes),
            parentId,
            title: 'nuevo_diente.txt',
            content: '',
            icon: 'txt',
            pos: { x: 0, y: 0 },
        };
        actions.updateCoreState({ mininodes: [...mininodes, newMininode] });
        actions.openModal({ type: 'editMininode', mininode: newMininode });
    },
    saveMininode: (updatedMininode: Mininode) => {
        const { actions } = get();
        const newMininodes = get().mininodes.map(m =>
            m.id === updatedMininode.id ? updatedMininode : m
        );
        actions.updateCoreState({ mininodes: newMininodes });
        actions.closeModal();
        actions._addLog(`Diente '${updatedMininode.title}' guardado.`);
    },
    requestDeleteMininode: (mininodeId: number) => get().actions.openModal({ type: 'deleteMininode', mininodeId }),
    confirmDeleteMininode: () => {
        const { mininodes, actions } = get();
        const activeModal = actions.openModal ? get().activeModals[get().activeModals.length-1] : null;

        if (activeModal?.type !== 'deleteMininode') return;

        const mininode = mininodes.find(m => m.id === activeModal.mininodeId);
        const newMininodes = mininodes.filter(m => m.id !== activeModal.mininodeId);
        actions.updateCoreState({ mininodes: newMininodes });
        actions.closeModal();
        if (mininode) {
            actions._addLog(`Diente '${mininode.title}' eliminado.`, 'warning');
        }
    },
    setDraggedMininodeInfo: (info: { id: number; parentId: number } | null) => {
        if (info === null) {
            // When drag ends (either by dropping or cancelling),
            // ensure any selection state from the initial mousedown is cleared.
            set({
                draggedMininodeInfo: null,
                isSelecting: false,
                selectionRect: null,
                selectionStart: null,
            });
        } else {
            set({ draggedMininodeInfo: info });
        }
    },
    moveMininode: (mininodeId: number, newParentId: number) => {
        const { mininodes, actions, nodesById } = get();
        const mininode = mininodes.find(m => m.id === mininodeId);

        if (!mininode || mininode.parentId === newParentId) return;

        const newMininodes = mininodes.map(m =>
            m.id === mininodeId ? { ...m, parentId: newParentId } : m
        );
        actions.updateCoreState({ mininodes: newMininodes });
        
        const oldParentNode = nodesById[mininode.parentId];
        const newParentNode = nodesById[newParentId];
        if(oldParentNode && newParentNode) {
            actions._addLog(`Diente '${mininode.title}' movido de '${oldParentNode.title}' a '${newParentNode.title}'.`, 'success');
        }
    },
});