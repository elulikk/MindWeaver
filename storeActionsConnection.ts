

import { MindMapState, Connection, Node } from './types';
import { getNewNodeId, getNewPortId } from './utils';
import { getPortY } from './storeUtils';


type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createConnectionActions = (set: SetState, get: GetState) => ({
    connectStart: (nodeId: number, portId: string) => {
        if (get().drawingMode) return;
        set({ connectingInfo: { nodeId, portId } });
        const node = get().nodesById[nodeId];
        if (node) {
            get().actions._addLog(`Iniciando conexión desde '${node.title}'...`);
        }
    },

    connectEnd: (nodeId: number, portId: string) => {
        if (get().drawingMode) return;
        const { connectingInfo, connections, nodesById, actions } = get();
        if (connectingInfo) {
            if (connectingInfo.nodeId !== nodeId) {
                const newConnection: Connection = { fromNode: connectingInfo.nodeId, fromPortId: connectingInfo.portId, toNode: nodeId, toPortId: portId, isWireless: false };
                
                const inputPortOccupied = connections.some(c => c.toNode === newConnection.toNode && c.toPortId === newConnection.toPortId);
                const outputPortOccupied = connections.some(c => c.fromNode === newConnection.fromNode && c.fromPortId === newConnection.fromPortId);

                if (inputPortOccupied) {
                    actions._addLog('El puerto de entrada ya está ocupado. No se puede crear la conexión.', 'warning');
                } else if (outputPortOccupied) {
                    actions._addLog('El puerto de salida ya está ocupado. No se puede crear la conexión.', 'warning');
                } else {
                   actions.updateCoreState({ connections: [...connections, newConnection] });
                   const fromNode = nodesById[newConnection.fromNode];
                   const toNode = nodesById[newConnection.toNode];
                   if (fromNode && toNode) {
                       actions._addLog(`Conexión establecida: '${fromNode.title}' -> '${toNode.title}'.`, 'success');
                   }
                }
            }
        }
        set({ connectingInfo: null });
    },

    deleteConnection: (connToDelete: Connection) => {
        const { nodesById } = get();
        const fromNode = nodesById[connToDelete.fromNode];
        const toNode = nodesById[connToDelete.toNode];
        const newConnections = get().connections.filter(c =>
            !(c.fromNode === connToDelete.fromNode && c.fromPortId === connToDelete.fromPortId && c.toNode === connToDelete.toNode && c.toPortId === connToDelete.toPortId)
        );
        get().actions.updateCoreState({ connections: newConnections });
         if (fromNode && toNode) {
            get().actions._addLog(`Conexión eliminada: '${fromNode.title}' -> '${toNode.title}'.`, 'warning');
        }
    },

    insertNodeInConnection: (connectionToSplit: Connection) => {
        const { nodesById, nodeColor, nodes, connections } = get();
        const fromNode = nodesById[connectionToSplit.fromNode];
        const toNode = nodesById[connectionToSplit.toNode];
        if (!fromNode || !toNode) return;

        const fromPortIndex = fromNode.outputs.findIndex(p => p.id === connectionToSplit.fromPortId);
        const toPortIndex = toNode.inputs.findIndex(p => p.id === connectionToSplit.toPortId);
        if (fromPortIndex === -1 || toPortIndex === -1) return;

        const fromY = fromNode.pos.y + getPortY(fromPortIndex, fromNode.outputs.length, fromNode.size.height);
        const toY = toNode.pos.y + getPortY(toPortIndex, toNode.inputs.length, toNode.size.height);
        
        const newNodeId = getNewNodeId(nodes);
        const newNodeX = (fromNode.pos.x + fromNode.size.width + toNode.pos.x) / 2;
        const newNodeY = (fromY + toY) / 2;
        
        const inPortId = getNewPortId('in');
        const outPortId = getNewPortId('out');
        
        const newNode: Node = {
            id: newNodeId,
            pos: { x: newNodeX - 90, y: newNodeY - 40 }, // Center node on line
            title: 'Nodo Intermedio',
            description: '',
            color: nodeColor,
            size: { width: 180, height: 80 },
            inputs: [{ id: inPortId, name: 'I' }],
            outputs: [{ id: outPortId, name: 'O' }],
            isComplete: false,
            inputLogic: 'AND',
            difficulty: 1,
            isPinned: false,
            orderIndex: (Math.max(...nodes.map(n => n.orderIndex)) || 0) + 1,
        };

        const newNodes = [...nodes, newNode];
        
        const newConnections = connections
            .filter(c => c !== connectionToSplit)
            .concat([
                { fromNode: fromNode.id, fromPortId: connectionToSplit.fromPortId, toNode: newNodeId, toPortId: inPortId, isWireless: connectionToSplit.isWireless },
                { fromNode: newNodeId, fromPortId: outPortId, toNode: toNode.id, toPortId: connectionToSplit.toPortId, isWireless: connectionToSplit.isWireless },
            ]);

        get().actions.updateCoreState({ nodes: newNodes, connections: newConnections });
        get().actions._addLog(`Nodo '${newNode.title}' insertado en una conexión.`, 'success');
    },

    toggleConnectionWirelessMode: (connToToggle: Connection) => {
        const { connections, nodesById } = get();
        const newConnections = connections.map(c => {
            if (
                c.fromNode === connToToggle.fromNode &&
                c.fromPortId === connToToggle.fromPortId &&
                c.toNode === connToToggle.toNode &&
                c.toPortId === connToToggle.toPortId
            ) {
                return { ...c, isWireless: !c.isWireless };
            }
            return c;
        });
        get().actions.updateCoreState({ connections: newConnections });

        const fromNode = nodesById[connToToggle.fromNode];
        const toNode = nodesById[connToToggle.toNode];
        const newMode = !(connToToggle.isWireless ?? false) ? 'inalámbrico' : 'cableado';
        if(fromNode && toNode) {
            get().actions._addLog(`Modo de conexión entre '${fromNode.title}' y '${toNode.title}' cambiado a ${newMode}.`);
        }
    },
});