

import { MindMapState, MindMapCoreState, Node } from './types';
import { SaveData, SCHEMA_VERSION } from './storeState';
import { marked } from './markdown';
import JSZip from 'jszip';
import { db } from './db';
import { sanitizeAndMigrateState } from './storeMigrations';
import { getCoreState } from './storeUtils';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

// Helper function to extract file name without extension
const getFileName = (name: string) => name.replace(/\.[^.]+$/, "");

const processAndLoadFile = async (set: SetState, get: GetState, fileContent: string, file: File) => {
    const state = get();
    const actions = state.actions;

    // Force-save the current project before importing a new one
    await actions.saveOrUpdateProject({ silent: true });

    try {
        const data = JSON.parse(fileContent) as Partial<SaveData>;
        const sanitizedState = sanitizeAndMigrateState(data);
        
        const newProject = {
            title: getFileName(file.name),
            state: sanitizedState,
            modifiedAt: new Date(),
            icon: data.icon || 'brain',
        };
        const newId = await db.projects.add(newProject);

        actions.loadState(sanitizedState);
        set({
            currentProjectId: newId,
            editingMode: 'db',
            currentFileHandle: null,
            isFileDirty: false,
        });
        await actions.loadProjects();
        actions._addLog(`Archivo '${file.name}' importado y guardado como nuevo proyecto.`, 'success');

    } catch (error: any) {
        console.error("Failed to process file:", error);
        actions._addLog(`Error al procesar el archivo: ${error.message}`, 'error');
    }
};

const generateHtmlForNodes = (nodesToExport: Node[], canvasTitle: string, mininodesByParentId: MindMapState['mininodesByParentId']): string => {
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${canvasTitle}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #e4e4e7; background-color: #18181b; margin: 0; padding: 2rem; }
            .container { max-width: 800px; margin: 0 auto; }
            .node { border: 1px solid #3f3f46; border-radius: 8px; margin-bottom: 2rem; padding: 1.5rem; background-color: #27272a; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1, h2 { color: #22d3ee; border-bottom: 1px solid #3f3f46; padding-bottom: 0.5rem; }
            h1 { font-size: 2.5em; text-align: center; margin-bottom: 2rem; border: none; }
            h2 { font-size: 1.8em; }
            code { background-color: #3f3f46; color: #a1a1aa; padding: 0.2em 0.4em; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
            pre { background-color: #3f3f46; padding: 1em; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
            pre code { background-color: transparent; padding: 0; }
            blockquote { border-left: 4px solid #71717a; padding-left: 1em; color: #a1a1aa; }
            a { color: #67e8f9; }
            hr { border-color: #52525b; margin: 1.5em 0; }
            .mininodes-section { margin-top: 1.5rem; }
            .mininode { border: 1px dashed #52525b; border-radius: 6px; margin-top: 1rem; }
            .mininode-header { background-color: #3f3f46; padding: 0.5rem 1rem; font-family: monospace; font-weight: bold; border-top-left-radius: 5px; border-top-right-radius: 5px;}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${canvasTitle}</h1>
    `;
    
    for (const node of nodesToExport) {
        const descriptionHtml = marked.parse(node.description || '');
        const mininodes = mininodesByParentId[node.id] || [];
        
        htmlContent += `
            <div class="node" style="border-left: 5px solid ${node.color};">
                <h2>${node.orderIndex}. ${node.title}</h2>
                <div class="markdown-content">${descriptionHtml}</div>
                ${mininodes.length > 0 ? `
                <div class="mininodes-section">
                    ${mininodes.map(mn => `
                    <div class="mininode">
                        <div class="mininode-header">${mn.title}</div>
                        <div class="markdown-content"><pre><code>${mn.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></div>
                    </div>
                    `).join('')}
                </div>` : ''}
            </div>
    `;
    }
    
    htmlContent += `
        </div>
    </body>
    </html>
    `;

    return htmlContent;
};

const triggerDownload = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};


export const createIOActions = (set: SetState, get: GetState) => ({
    saveSettings: (newSettings: any) => {
        const { actions } = get();
        actions.updateCoreState({ ...newSettings });
        actions._addLog('Configuración guardada.', 'success');
        actions.closeModal();
    },
    exportToFile: async (format: 'json') => {
        const state = get();
        const { projects, currentProjectId, actions } = state;
        const coreState = getCoreState(state);
        const currentProject = projects.find(p => p.id === currentProjectId);
        const data: SaveData = { ...coreState, schemaVersion: SCHEMA_VERSION, icon: currentProject?.icon };
        let blob: Blob;
        let filename: string;

        switch (format) {
            case 'json':
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                filename = `${state.canvasTitle}.json`;
                break;
            default:
                actions._addLog(`Formato de exportación '${format}' no soportado.`, 'error');
                return;
        }

        triggerDownload(blob, filename);
        actions._addLog(`Proyecto exportado como ${filename}.`, 'success');
    },
    exportToHtml: async (endNodeId?: number | null) => {
        const { nodes, connections, canvasTitle, mininodesByParentId, actions } = get();

        // 1. Find all end nodes (out-degree 0)
        const outgoingConnections = new Map<number, number>();
        for (const conn of connections) {
            outgoingConnections.set(conn.fromNode, (outgoingConnections.get(conn.fromNode) || 0) + 1);
        }
        const endNodes = nodes.filter(node => (outgoingConnections.get(node.id) || 0) === 0);

        // 2. If no endNodeId is provided and there are multiple end nodes, open modal
        if (endNodeId === undefined && endNodes.length > 1) {
            actions.openModal({ type: 'selectEndNode', endNodes });
            return; // Stop execution, wait for user choice
        }

        // Handle "export all" from modal
        if (endNodeId === null) {
            endNodeId = undefined;
        }

        set({ isLoading: 'Generando HTML...' });
    
        try {
            let nodesToProcess = nodes;
            let effectiveConnections = connections;
            let exportTitle = canvasTitle;

            // 3. If a specific end node is chosen, filter nodes and connections
            if (endNodeId) {
                const getAncestors = (startNodeId: number): Set<number> => {
                    const ancestors = new Set<number>();
                    const queue: number[] = [startNodeId];
                    const visited = new Set<number>();

                    while (queue.length > 0) {
                        const currentNodeId = queue.shift()!;
                        if (visited.has(currentNodeId)) continue;
                        visited.add(currentNodeId);
                        ancestors.add(currentNodeId);

                        const incoming = connections.filter(c => c.toNode === currentNodeId);
                        for (const conn of incoming) {
                            if (!visited.has(conn.fromNode)) {
                                queue.push(conn.fromNode);
                            }
                        }
                    }
                    return ancestors;
                };

                const ancestorIds = getAncestors(endNodeId);
                nodesToProcess = nodes.filter(n => ancestorIds.has(n.id));
                effectiveConnections = connections.filter(c => ancestorIds.has(c.fromNode) && ancestorIds.has(c.toNode));
                const endNodeTitle = nodes.find(n => n.id === endNodeId)?.title || '';
                exportTitle = `${canvasTitle} (Flujo: ${endNodeTitle})`;
            }

            const nodesById = new Map(nodesToProcess.map(n => [n.id, n]));
            const adj = new Map<number, { toNode: number, fromPortId: string }[]>();
            const inDegree = new Map<number, number>();

            // 4. Build Graph from processed nodes
            for (const node of nodesToProcess) {
                adj.set(node.id, []);
                inDegree.set(node.id, 0);
            }

            for (const conn of effectiveConnections) {
                if (nodesById.has(conn.fromNode) && nodesById.has(conn.toNode)) {
                    adj.get(conn.fromNode)!.push({ toNode: conn.toNode, fromPortId: conn.fromPortId });
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
                return nodeA.orderIndex - nodeB.orderIndex;
            });

            const sortedNodeIds: number[] = [];
            while (queue.length > 0) {
                const u_id = queue.shift()!;
                sortedNodeIds.push(u_id);
                const u_node = nodesById.get(u_id)!;

                const neighbors = adj.get(u_id) || [];
                const portOrderMap = new Map(u_node.outputs.map((port, index) => [port.id, index]));
                
                neighbors.sort((a, b) => {
                    const portIndexA = portOrderMap.get(a.fromPortId) ?? Infinity;
                    const portIndexB = portOrderMap.get(b.fromPortId) ?? Infinity;
                    return portIndexA - portIndexB;
                });

                for (const neighbor of neighbors) {
                    const v_id = neighbor.toNode;
                    inDegree.set(v_id, inDegree.get(v_id)! - 1);
                    if (inDegree.get(v_id) === 0) {
                        queue.push(v_id);
                    }
                }
            }
            
            let sortedNodes: Node[] = [];
            if (sortedNodeIds.length !== nodesToProcess.length) {
                 actions._addLog("Error de exportación: se detectó un ciclo en el grafo. Usando ordenamiento de respaldo por `orderIndex`.", 'error');
                 sortedNodes = [...nodesToProcess].sort((a, b) => a.orderIndex - b.orderIndex);
            } else {
                 sortedNodes = sortedNodeIds.map(id => nodesById.get(id)!);
            }

            const nodesToExport = sortedNodes.map((node, index) => ({...node, orderIndex: index + 1}));
            
            const htmlContent = generateHtmlForNodes(nodesToExport, exportTitle, mininodesByParentId);
    
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const filename = `${getFileName(canvasTitle)}.html`;
            triggerDownload(blob, filename);
            actions._addLog(`Proyecto exportado como ${filename}.`, 'success');
            actions.closeModal(); // Close the selection modal if it was open
    
        } catch (error) {
            console.error("HTML Export failed", error);
            actions._addLog('Error al exportar a HTML.', 'error');
        } finally {
            set({ isLoading: false });
        }
    },
    exportSelectionToHtml: async () => {
        set({ isLoading: 'Exportando selección...' });
        const { nodes, selectedNodeIds, canvasTitle, mininodesByParentId, actions } = get();
        
        if (selectedNodeIds.size === 0) {
            actions._addLog('No hay nodos seleccionados para exportar.', 'warning');
            set({ isLoading: false });
            return;
        }

        try {
            const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id));
            const sortedSelectedNodes = selectedNodes.sort((a, b) => a.orderIndex - b.orderIndex);
            const exportTitle = `${canvasTitle} (Selección)`;

            const htmlContent = generateHtmlForNodes(sortedSelectedNodes, exportTitle, mininodesByParentId);
    
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const filename = `${getFileName(canvasTitle)}-seleccion.html`;
            triggerDownload(blob, filename);
            actions._addLog(`${selectedNodeIds.size} nodos exportados como ${filename}.`, 'success');

        } catch (error) {
            console.error("Selection HTML Export failed", error);
            actions._addLog('Error al exportar la selección a HTML.', 'error');
        } finally {
            set({ isLoading: false });
        }
    },
    importFromFile: async (file: File) => {
        const { actions } = get();
        const fileContent = await file.text();
        try {
            const data = JSON.parse(fileContent);
            if (data.schemaVersion !== SCHEMA_VERSION) {
                actions.openModal({ type: 'confirmImport', fileContent, file });
            } else {
                await processAndLoadFile(set, get, fileContent, file);
            }
        } catch (e) {
            actions.openModal({ type: 'confirmImport', fileContent, file });
        }
    },
    confirmImport: async () => {
        const { activeModals, actions } = get();
        const activeModal = activeModals.length > 0 ? activeModals[activeModals.length-1] : null;

        if (activeModal?.type !== 'confirmImport') return;
        const { fileContent, file } = activeModal;
        await processAndLoadFile(set, get, fileContent, file);
        actions.closeModal();
    },
    loadState: (stateToLoad: Partial<MindMapCoreState>) => {
        get().actions._updateState({
            ...stateToLoad,
            pastStates: [],
            futureStates: [],
            selectedNodeIds: new Set(),
        });
        get().actions.frameAllNodes();
    },
    downloadNodeAsZip: async (nodeId: number) => {
        const { nodesById, mininodesByParentId, actions } = get();
        const node = nodesById[nodeId];
        if (!node) {
            actions._addLog(`No se pudo encontrar el nodo con ID ${nodeId} para exportar.`, 'error');
            return;
        }

        const mininodes = mininodesByParentId[nodeId] || [];
        const zip = new JSZip();

        // Sanitize title for filename
        const sanitizedTitle = node.title.replace(/[^a-z0-9_ -]/gi, '_').replace(/ /g, '_');
        const filename = `${sanitizedTitle}.zip`;

        // Add node details as a markdown file
        let nodeDetailsContent = `# ${node.title}\n\n`;
        nodeDetailsContent += `**ID:** ${node.id}\n`;
        nodeDetailsContent += `**Dificultad:** ${node.difficulty}/10\n`;
        nodeDetailsContent += `**Completo:** ${node.isComplete ? 'Sí' : 'No'}\n\n`;
        nodeDetailsContent += `---\n\n`;
        nodeDetailsContent += `${node.description}`;
        
        zip.file('node_details.md', nodeDetailsContent);

        // Add mininodes as files
        if (mininodes.length > 0) {
            const teethFolder = zip.folder('dientes');
            if (teethFolder) {
                mininodes.forEach(mn => {
                    teethFolder.file(mn.title, mn.content);
                });
            }
        }

        try {
            set({ isLoading: 'Generando ZIP...' });
            const content = await zip.generateAsync({ type: 'blob' });
            
            triggerDownload(content, filename);
            actions._addLog(`Nodo '${node.title}' y sus dientes exportados como ${filename}.`, 'success');
        } catch (err: any) {
            console.error('Error generating ZIP:', err);
            actions._addLog(`Error al generar el archivo ZIP: ${err.message}`, 'error');
        } finally {
            set({ isLoading: false });
        }
    },
    exportMininodeContent: (mininodeId: number) => {
        const { mininodesById, actions } = get();
        const mininode = mininodesById[mininodeId];
        if (!mininode) return;
        const blob = new Blob([mininode.content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = mininode.title;
        link.click();
        URL.revokeObjectURL(link.href);
        actions._addLog(`Contenido del diente '${mininode.title}' exportado.`);
    },
});
