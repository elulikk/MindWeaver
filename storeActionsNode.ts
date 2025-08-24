

import { MindMapState, Node, Connection } from './types';
import { getNewNodeId, getNewPortId } from './utils';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createNodeActions = (set: SetState, get: GetState) => ({
    addNode: (template: 'normal' | 'starter' | 'finish' | 'and' | 'or' | 'empty' = 'normal') => {
        set({ drawingMode: null });
        const { viewOffset, zoom, nodeColor, nodes, actions } = get();
        const newNodeId = getNewNodeId(nodes);
        const newOrderIndex = nodes.length > 0 ? Math.max(...nodes.map(n => n.orderIndex)) + 1 : 1;
        
        let baseNode: Node = {
            id: newNodeId,
            pos: { x: (200 - viewOffset.x) / zoom, y: (100 - viewOffset.y) / zoom },
            description: '',
            color: nodeColor,
            size: { width: 180, height: 80 },
            isComplete: false,
            difficulty: 1,
            title: 'Nodo Nuevo',
            inputs: [{ id: getNewPortId('in'), name: 'Input' }],
            outputs: [{ id: getNewPortId('out'), name: 'Output' }],
            inputLogic: 'AND',
            isPinned: false,
            orderIndex: newOrderIndex,
            time: 0,
        };

        switch (template) {
            case 'starter':
                baseNode.title = 'Nodo de Inicio';
                baseNode.inputs = [];
                break;
            case 'finish':
                baseNode.title = 'Nodo Final';
                baseNode.outputs = [];
                break;
            case 'and':
                baseNode.title = 'Nodo Y (AND)';
                baseNode.icon = 'node-and';
                baseNode.inputs = [
                    { id: getNewPortId('in'), name: 'Input A' },
                    { id: getNewPortId('in'), name: 'Input B' },
                ];
                baseNode.inputLogic = 'AND';
                break;
            case 'or':
                baseNode.title = 'Nodo O (OR)';
                baseNode.icon = 'node-or';
                baseNode.inputs = [
                    { id: getNewPortId('in'), name: 'Input A' },
                    { id: getNewPortId('in'), name: 'Input B' },
                ];
                baseNode.inputLogic = 'OR';
                break;
            case 'empty':
                baseNode.title = 'Nodo Vacío';
                baseNode.inputs = [];
                baseNode.outputs = [];
                break;
        }

        actions.updateCoreState({ nodes: [...nodes, baseNode] });
        actions._addLog(`Nodo '${baseNode.title}' creado.`, 'success');
    },

    addNodeAndConnect: (template: 'normal' | 'starter' | 'finish' | 'and' | 'or' | 'empty' = 'normal') => {
        const { viewOffset, zoom, nodeColor, nodes, connectingInfo, connections, contextMenu, actions } = get();
        if (!connectingInfo || !contextMenu) return;
    
        const newNodePos = { x: (contextMenu.x - viewOffset.x) / zoom, y: (contextMenu.y - viewOffset.y) / zoom };
        const newNodeId = getNewNodeId(nodes);
        const newOrderIndex = nodes.length > 0 ? Math.max(...nodes.map(n => n.orderIndex)) + 1 : 1;
    
        let baseNode: Node = {
            id: newNodeId,
            pos: { x: 0, y: 0 }, // Will be set below
            description: '',
            color: nodeColor,
            size: { width: 180, height: 80 },
            isComplete: false,
            difficulty: 1,
            title: 'Nodo Nuevo',
            inputs: [{ id: getNewPortId('in'), name: 'Input' }],
            outputs: [{ id: getNewPortId('out'), name: 'Output' }],
            inputLogic: 'AND',
            isPinned: false,
            orderIndex: newOrderIndex,
            time: 0,
        };
    
        switch (template) {
            case 'starter':
                baseNode.title = 'Nodo de Inicio';
                baseNode.inputs = [];
                break;
            case 'finish':
                baseNode.title = 'Nodo Final';
                baseNode.outputs = [];
                break;
            case 'and':
                baseNode.title = 'Nodo Y (AND)';
                baseNode.icon = 'node-and';
                baseNode.inputs = [{ id: getNewPortId('in'), name: 'Input A' }, { id: getNewPortId('in'), name: 'Input B' }];
                baseNode.inputLogic = 'AND';
                break;
            case 'or':
                baseNode.title = 'Nodo O (OR)';
                baseNode.icon = 'node-or';
                baseNode.inputs = [{ id: getNewPortId('in'), name: 'Input A' }, { id: getNewPortId('in'), name: 'Input B' }];
                baseNode.inputLogic = 'OR';
                break;
            case 'empty':
                baseNode.title = 'Nodo Vacío';
                baseNode.inputs = [];
                baseNode.outputs = [];
                break;
        }

        baseNode.pos = { x: newNodePos.x - baseNode.size.width / 2, y: newNodePos.y - baseNode.size.height / 2 };
    
        if (baseNode.inputs.length === 0) {
            actions._addLog(`No se puede conectar a un nodo sin puertos de entrada.`, 'warning');
            set({ connectingInfo: null });
            return;
        }
    
        const newConnection: Connection = {
            fromNode: connectingInfo.nodeId,
            fromPortId: connectingInfo.portId,
            toNode: newNodeId,
            toPortId: baseNode.inputs[0].id,
            isWireless: false,
        };
    
        actions.updateCoreState({
            nodes: [...nodes, baseNode],
            connections: [...connections, newConnection],
        });
    
        set({ connectingInfo: null }); // Connection is done
        const fromNode = get().nodesById[connectingInfo.nodeId];
        actions._addLog(`Nodo '${baseNode.title}' creado y conectado desde '${fromNode?.title}'.`, 'success');
    },

    saveNode: (updatedNode: Node) => {
        const { actions } = get();
        actions.saveNodeState(updatedNode);
        actions.closeModal();
    },

    saveNodeState: (updatedNode: Node) => {
        const { actions, nodes, connections, activeModals } = get();
        const cleanedNode: Node = {
            ...updatedNode,
            title: updatedNode.title.trim(),
            description: updatedNode.description.trim(),
            inputs: updatedNode.inputs.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name),
            outputs: updatedNode.outputs.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name),
            size: {
                width: Math.round(updatedNode.size.width),
                height: Math.round(updatedNode.size.height),
            }
        };
        
        const newNodes = nodes.map(node => (node.id === cleanedNode.id ? cleanedNode : node));
        const newNodesByIdMap = Object.fromEntries(newNodes.map(n => [n.id, n]));
        
        const newConnections = connections.filter(c => {
            const fromNode = newNodesByIdMap[c.fromNode];
            const toNode = newNodesByIdMap[c.toNode];
            if (!fromNode || !toNode) return false;
            return fromNode.outputs.some(p => p.id === c.fromPortId) && toNode.inputs.some(p => p.id === c.toPortId);
        });
        
        const newActiveModals = activeModals.map(modal => {
            if (modal.type === 'edit' && modal.node.id === cleanedNode.id) {
                return { ...modal, node: cleanedNode };
            }
            return modal;
        });
        
        actions.updateCoreState({ nodes: newNodes, connections: newConnections });
        set({ activeModals: newActiveModals });
        actions._addLog(`Nodo '${cleanedNode.title}' (ID: ${cleanedNode.id}) actualizado.`);
    },
    
    toggleNodeComplete: (nodeId: number) => {
        const { actions } = get();
        const node = get().nodes.find(n => n.id === nodeId);
        const newNodes = get().nodes.map(node =>
          node.id === nodeId ? { ...node, isComplete: !node.isComplete } : node
        );
        actions.updateCoreState({ nodes: newNodes });
        if(node) {
            actions._addLog(`Nodo '${node.title}' marcado como ${!node.isComplete ? 'completo' : 'incompleto'}.`);
        }
    },

    toggleNodePin: (nodeId: number) => {
        const { actions } = get();
        const node = get().nodesById[nodeId];
        const newNodes = get().nodes.map(node =>
            node.id === nodeId ? { ...node, isPinned: !node.isPinned } : node
        );
        actions.updateCoreState({ nodes: newNodes });
        if(node) {
             actions._addLog(`Nodo '${node.title}' ${!node.isPinned ? 'anclado' : 'desanclado'}.`);
        }
    },

    requestMarkAllIncomplete: () => set({ activeModals: [...get().activeModals, { type: 'confirmMarkAllIncomplete' }] }),

    confirmMarkAllIncomplete: () => {
        const { nodes, actions } = get();
        if (nodes.every(n => !n.isComplete)) {
            actions.closeModal();
            return;
        }
        const newNodes = nodes.map(node =>
            node.isComplete ? { ...node, isComplete: false } : node
        );
        actions.updateCoreState({ nodes: newNodes });
        actions.closeModal();
        actions._addLog('Todos los nodos han sido reiniciados a "incompleto".', 'warning');
    },
    
    requestDeleteNode: (nodeId: number) => {
        const { actions } = get();
        actions.selectOnlyNode(nodeId);
        actions.requestDeleteSelection();
    },

    confirmDeleteNode: () => { // Kept for legacy or specific uses, but selection is preferred.
        const { connections, nodes, mininodes, activeModals, actions } = get();
        const activeModal = activeModals.length > 0 ? activeModals[activeModals.length - 1] : null;
        if (activeModal?.type !== 'delete') return;
        const nodeIdToDelete = activeModal.nodeId;
        const nodeToDelete = nodes.find(n => n.id === nodeIdToDelete);
        const newNodes = nodes.filter(n => n.id !== nodeIdToDelete);
        const newConnections = connections.filter(c => c.fromNode !== nodeIdToDelete && c.toNode !== nodeIdToDelete);
        const newMininodes = mininodes.filter(m => m.parentId !== nodeIdToDelete);
        actions.updateCoreState({
            nodes: newNodes,
            connections: newConnections,
            mininodes: newMininodes
        });
        actions.closeModal();
        if (nodeToDelete) {
            actions._addLog(`Nodo '${nodeToDelete.title}' eliminado.`, 'warning');
        }
    },

    requestDeleteSelection: () => {
        const { selectedNodeIds, actions } = get();
        if (selectedNodeIds.size > 0) {
            actions.openModal({ type: 'deleteSelection' });
        }
    },

    confirmDeleteSelection: () => {
        const { nodes, connections, mininodes, selectedNodeIds, actions } = get();
        if (selectedNodeIds.size === 0) {
            actions.closeModal();
            return;
        }

        const newNodes = nodes.filter(n => !selectedNodeIds.has(n.id));
        const newConnections = connections.filter(c => !selectedNodeIds.has(c.fromNode) && !selectedNodeIds.has(c.toNode));
        const newMininodes = mininodes.filter(m => !selectedNodeIds.has(m.parentId));
        
        actions.updateCoreState({
            nodes: newNodes,
            connections: newConnections,
            mininodes: newMininodes,
        });
        set({ selectedNodeIds: new Set() });
        actions.closeModal();
        actions._addLog(`${selectedNodeIds.size} nodo(s) eliminados.`, 'warning');
    },

    addPort: (nodeId: number, portType: 'input' | 'output') => {
        const { nodes, actions } = get();
        const newNodes = nodes.map(n => {
            if (n.id === nodeId) {
                const newPort = { id: getNewPortId(portType), name: 'Nuevo' };
                if (portType === 'input') {
                    return { ...n, inputs: [...n.inputs, newPort] };
                } else {
                    return { ...n, outputs: [...n.outputs, newPort] };
                }
            }
            return n;
        });
        actions.updateCoreState({ nodes: newNodes });
        actions._addLog(`Puerto de ${portType === 'input' ? 'entrada' : 'salida'} añadido al nodo.`, 'success');
    },

    deletePort: (nodeId: number, portType: 'input' | 'output', portId: string) => {
        const { nodes, connections, actions } = get();
        const newNodes = nodes.map(n => {
            if (n.id === nodeId) {
                if (portType === 'input') {
                    return { ...n, inputs: n.inputs.filter(p => p.id !== portId) };
                } else {
                    return { ...n, outputs: n.outputs.filter(p => p.id !== portId) };
                }
            }
            return n;
        });

        const newConnections = connections.filter(c => 
            !(c.fromNode === nodeId && c.fromPortId === portId) && 
            !(c.toNode === nodeId && c.toPortId === portId)
        );

        actions.updateCoreState({ nodes: newNodes, connections: newConnections });
        actions._addLog(`Puerto eliminado.`, 'warning');
    },

    reorganizeOrderIndex: () => {
        const { nodes, connections, actions } = get();
        const nodesById = new Map(nodes.map(n => [n.id, n]));
        const adj = new Map<number, number[]>();
        const inDegree = new Map<number, number>();

        for (const node of nodes) {
            adj.set(node.id, []);
            inDegree.set(node.id, 0);
        }

        for (const conn of connections) {
            if (nodesById.has(conn.fromNode) && nodesById.has(conn.toNode)) {
                adj.get(conn.fromNode)!.push(conn.toNode);
                inDegree.set(conn.toNode, (inDegree.get(conn.toNode) || 0) + 1);
            }
        }

        const queue: number[] = [];
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }
        
        queue.sort((a, b) => {
            const nodeA = nodesById.get(a)!;
            const nodeB = nodesById.get(b)!;
            return nodeA.pos.y - nodeB.pos.y || nodeA.pos.x - nodeB.pos.x;
        });

        const sortedNodeIds: number[] = [];
        while (queue.length > 0) {
            const u = queue.shift()!;
            sortedNodeIds.push(u);

            const neighbors = adj.get(u) || [];
            neighbors.sort((a, b) => {
                 const nodeA = nodesById.get(a)!;
                 const nodeB = nodesById.get(b)!;
                 return nodeA.pos.y - nodeB.pos.y || nodeA.pos.x - nodeB.pos.x;
            });

            for (const v of neighbors) {
                inDegree.set(v, inDegree.get(v)! - 1);
                if (inDegree.get(v) === 0) {
                    queue.push(v);
                }
            }
        }

        if (sortedNodeIds.length !== nodes.length) {
            actions._addLog("No se pudo reorganizar el orden: se detectó un ciclo en el grafo.", 'error');
            return;
        }
        
        const newNodes = nodes.map(node => {
            const orderIndex = sortedNodeIds.indexOf(node.id) + 1;
            return { ...node, orderIndex };
        });

        actions.updateCoreState({ nodes: newNodes });
        actions._addLog('El índice de orden de todos los nodos ha sido reorganizado.', 'success');
    },

    reorganizeOrderIndexForSelection: () => {
        const { nodes, selectedNodeIds, actions } = get();
        if (selectedNodeIds.size === 0) return;
        
        const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id));
        
        const sortedSelectedNodes = [...selectedNodes].sort((a, b) => {
            if (a.pos.y !== b.pos.y) {
                return a.pos.y - b.pos.y;
            }
            return a.pos.x - b.pos.x;
        });

        const minOrderIndex = Math.min(...selectedNodes.map(n => n.orderIndex));

        const updatedOrderIndices = new Map<number, number>();
        sortedSelectedNodes.forEach((node, index) => {
            updatedOrderIndices.set(node.id, minOrderIndex + index);
        });

        const newNodes = nodes.map(node => {
            if (updatedOrderIndices.has(node.id)) {
                return { ...node, orderIndex: updatedOrderIndices.get(node.id)! };
            }
            return node;
        });

        actions.updateCoreState({ nodes: newNodes });
        actions._addLog(`Reorganizado el índice de orden para ${selectedNodeIds.size} nodos seleccionados.`, 'success');
    },

    selectOnlyNode: (nodeId: number) => {
        set({ selectedNodeIds: new Set([nodeId]), selectedCanvasObjectIds: new Set() });
    },
});