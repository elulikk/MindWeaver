

import { MindMapState, MindMapCoreState, Node } from './types';
import { SaveData, SCHEMA_VERSION } from './storeState';
import { marked } from './markdown';
import JSZip from 'jszip';
import { db } from './db';
import { sanitizeAndMigrateState } from './storeMigrations';
import { getCoreState } from './storeUtils';
import { jsPDF } from 'jspdf';


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
        
        if (!sanitizedState.uuid) {
            sanitizedState.uuid = crypto.randomUUID();
        }
        
        const newProject = {
            title: getFileName(file.name),
            state: sanitizedState,
            modifiedAt: new Date(),
            icon: data.icon || 'brain',
            uuid: sanitizedState.uuid,
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
    // Generate Index HTML
    const indexHtml = `
        <div class="index-card">
            <h2 id="index">Índice</h2>
            <ol class="index-nav">
                ${nodesToExport.map(node => `
                    <li><a href="#node-${node.id}">${node.orderIndex}. ${node.title}</a></li>
                `).join('')}
            </ol>
        </div>
    `;

    // Generate Main Content HTML
    let mainContentHtml = '';
    for (const node of nodesToExport) {
        const descriptionHtml = marked.parse(node.description || '');
        const mininodes = mininodesByParentId[node.id] || [];
        
        mainContentHtml += `
            <details class="node" open>
                <summary class="node-header" id="node-${node.id}">
                    <h2>${node.orderIndex}. ${node.title}</h2>
                </summary>
                <div class="node-content" style="border-left: 5px solid ${node.color};">
                    <div class="markdown-content">${descriptionHtml}</div>
                    ${mininodes.length > 0 ? `
                    <div class="mininodes-section">
                        ${mininodes.map(mn => `
                        <details class="mininode">
                            <summary class="mininode-header">${mn.title}</summary>
                            <div class="markdown-content"><pre><code>${mn.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></div>
                        </details>
                        `).join('')}
                    </div>` : ''}
                    <div class="back-to-top-container">
                        <a href="#index" class="back-to-top">▲ Volver al Índice</a>
                    </div>
                </div>
            </details>
        `;
    }

    // Combine all parts into the final HTML
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${canvasTitle}</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                line-height: 1.6; 
                color: #e4e4e7; 
                background-color: #18181b; 
                margin: 0; 
                padding: 2rem; 
                scroll-behavior: smooth;
            }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { font-size: 2.5em; text-align: center; margin-bottom: 2rem; color: #22d3ee; border: none; }
            h2 { font-size: 1.8em; color: #22d3ee; margin-top: 0; margin-bottom: 0.5rem; }
            
            /* Node styles */
            .node { margin-bottom: 1rem; }
            .node-header {
                padding: 1rem;
                background-color: #27272a;
                border: 1px solid #3f3f46;
                border-radius: 8px;
                cursor: pointer;
                list-style: none; /* Hide default arrow */
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: background-color 0.2s;
            }
            .node-header::-webkit-details-marker { display: none; }
            .node-header:hover { background-color: #3f3f46; }
            .node-header::before {
                content: '►';
                font-size: 0.8em;
                margin-right: 0.75rem;
                transition: transform 0.2s;
                color: #a1a1aa;
            }
            .node[open] > .node-header::before {
                transform: rotate(90deg);
            }
            .node[open] > .node-header {
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
                border-bottom-color: transparent;
            }
            .node-content {
                border: 1px solid #3f3f46;
                border-top: none;
                border-radius: 0 0 8px 8px;
                padding: 1.5rem;
                background-color: #27272a;
            }
            
            /* Markdown content inside nodes */
            .markdown-content h2 { border-bottom: 1px solid #3f3f46; padding-bottom: 0.5rem; }
            code { background-color: #3f3f46; color: #a1a1aa; padding: 0.2em 0.4em; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
            pre { background-color: #3f3f46; padding: 1em; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
            pre code { background-color: transparent; padding: 0; }
            blockquote { border-left: 4px solid #71717a; padding-left: 1em; color: #a1a1aa; }
            a { color: #67e8f9; text-decoration: none; }
            a:hover { text-decoration: underline; }
            hr { border-color: #52525b; margin: 1.5em 0; }
            
            /* Mininode styles */
            .mininodes-section { margin-top: 1.5rem; }
            .mininode { border: 1px dashed #52525b; border-radius: 6px; margin-top: 1rem; }
            .mininode[open] { border-style: solid; }
            .mininode-header { 
                background-color: #3f3f46; 
                padding: 0.5rem 1rem; 
                font-family: monospace; 
                font-weight: bold; 
                border-top-left-radius: 5px; 
                border-top-right-radius: 5px;
                cursor: pointer;
                list-style: none; /* Hide default arrow */
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: background-color 0.2s;
            }
            .mininode-header:hover { background-color: #52525b; }
            .mininode-header::-webkit-details-marker { display: none; }
            .mininode-header::before {
                content: '►';
                font-size: 0.8em;
                transition: transform 0.2s;
            }
            .mininode[open] > .mininode-header::before {
                transform: rotate(90deg);
            }
            .mininode > .markdown-content { padding: 1rem; }
            
            /* Index styles */
            .index-card { background-color: #27272a; border: 1px solid #3f3f46; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 3rem; }
            .index-nav { padding-left: 1.5rem; }
            .index-nav li { margin-bottom: 0.5rem; }
            
            /* Back to top styles */
            .back-to-top-container { text-align: right; margin-top: 1.5rem; }
            .back-to-top { font-size: 0.9em; color: #a1a1aa; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${canvasTitle}</h1>
            ${indexHtml}
            ${mainContentHtml}
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


// FIX: Corrected the type for the 'set' parameter from GetState to SetState.
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
            actions.openModal({ type: 'selectEndNode', endNodes, exportType: 'html' });
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
    exportToPdf: async (endNodeId?: number | null) => {
        const { nodes, connections, canvasTitle, mininodesByParentId, actions } = get();

        const outgoingConnections = new Map<number, number>();
        for (const conn of connections) {
            outgoingConnections.set(conn.fromNode, (outgoingConnections.get(conn.fromNode) || 0) + 1);
        }
        const endNodes = nodes.filter(node => (outgoingConnections.get(node.id) || 0) === 0);

        if (endNodeId === undefined && endNodes.length > 1) {
            actions.openModal({ type: 'selectEndNode', endNodes, exportType: 'pdf' });
            return;
        }

        if (endNodeId === null) {
            endNodeId = undefined;
        }

        set({ isLoading: 'Generando PDF...' });

        try {
            let nodesToProcess = nodes;
            let exportTitle = canvasTitle;

            if (endNodeId) {
                const getAncestors = (startNodeId: number): Set<number> => {
                    const ancestors = new Set<number>([startNodeId]);
                    const queue: number[] = [startNodeId];
                    while (queue.length > 0) {
                        const curr = queue.shift()!;
                        connections.forEach(c => {
                            if (c.toNode === curr && !ancestors.has(c.fromNode)) {
                                ancestors.add(c.fromNode);
                                queue.push(c.fromNode);
                            }
                        });
                    }
                    return ancestors;
                };
                const ancestorIds = getAncestors(endNodeId);
                nodesToProcess = nodes.filter(n => ancestorIds.has(n.id));
                const endNodeTitle = nodes.find(n => n.id === endNodeId)?.title || '';
                exportTitle = `${canvasTitle} (Flujo: ${endNodeTitle})`;
            }
            
            const sortedNodes = [...nodesToProcess].sort((a, b) => a.orderIndex - b.orderIndex);
            const nodesToExport = sortedNodes.map((node, index) => ({ ...node, orderIndex: index + 1 }));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 15;
            const maxLineWidth = pageWidth - margin * 2;
            let y = margin;

            const addPageNumbers = () => {
                const pageCount = pdf.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(10);
                    pdf.setTextColor(150);
                    pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                }
            };

            const checkPageBreak = (neededHeight: number) => {
                if (y + neededHeight > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
            };

            // Title Page
            pdf.setFontSize(24);
            pdf.setTextColor(40);
            pdf.text(exportTitle, pageWidth / 2, pageHeight / 2, { align: 'center' });
            
            pdf.addPage();
            y = margin;

            for (const node of nodesToExport) {
                // Node Title
                checkPageBreak(12);
                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0);
                const titleLines = pdf.splitTextToSize(`${node.orderIndex}. ${node.title}`, maxLineWidth);
                pdf.text(titleLines, margin, y);
                y += titleLines.length * 7;

                y += 4; // Spacing

                // Node Description
                if (node.description) {
                    checkPageBreak(10);
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(50);
                    const plainTextDescription = marked.parse(node.description)
                        .replace(/<[^>]*>/g, '') // strip html tags
                        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");

                    const descriptionLines = pdf.splitTextToSize(plainTextDescription, maxLineWidth);
                    
                    for(const line of descriptionLines) {
                        checkPageBreak(6);
                        pdf.text(line, margin, y);
                        y += 6;
                    }
                }

                // Mininodes
                const mininodes = mininodesByParentId[node.id] || [];
                if (mininodes.length > 0) {
                    y += 6;
                    checkPageBreak(10);

                    for (const mn of mininodes) {
                        checkPageBreak(12);
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(30);
                        pdf.text(`Diente: ${mn.title}`, margin, y);
                        y += 7;

                        if (mn.content) {
                            checkPageBreak(10);
                            pdf.setFontSize(9);
                            pdf.setFont('courier', 'normal');
                            pdf.setTextColor(80);
                            pdf.setFillColor(240, 240, 240);
                            
                            const codeLines = pdf.splitTextToSize(mn.content, maxLineWidth - 10);
                            
                            const rectHeight = codeLines.length * 4 + 4;
                            checkPageBreak(rectHeight);
                            pdf.rect(margin, y - 4, maxLineWidth, rectHeight, 'F');
                            
                            pdf.text(codeLines, margin + 2, y);
                            y += codeLines.length * 4 + 4;
                        }
                    }
                }
                y += 15; // Space between nodes
            }

            addPageNumbers();

            const filename = `${getFileName(canvasTitle)}.pdf`;
            pdf.save(filename);

            actions._addLog(`Proyecto exportado como ${filename}.`, 'success');
            actions.closeModal();

        } catch (error) {
            console.error("PDF Export failed", error);
            actions._addLog('Error al exportar a PDF.', 'error');
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
            const data = JSON.parse(fileContent) as Partial<SaveData>;
            
            // Sanitize first to get a guaranteed UUID and consistent state object
            const sanitizedState = sanitizeAndMigrateState(data);

            let existingProject;
            // If the original file had a UUID, use it for conflict detection.
            if (data.uuid) {
                existingProject = await db.projects.where('uuid').equals(data.uuid).first();
            } else {
                // For legacy files without a UUID, fall back to checking by title.
                // This is not foolproof but is the best effort for backward compatibility.
                const potentialMatches = await db.projects.where('title').equals(sanitizedState.canvasTitle).toArray();
                if (potentialMatches.length > 0) {
                    // If multiple matches exist, pick the most recently modified one.
                    existingProject = potentialMatches.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())[0];
                }
            }
            
            if (existingProject) {
                const existingProjectSize = new Blob([JSON.stringify(existingProject.state)]).size;
                
                actions.openModal({
                    type: 'projectConflict',
                    existingProject: {
                        id: existingProject.id!,
                        uuid: existingProject.uuid,
                        title: existingProject.title,
                        modifiedAt: existingProject.modifiedAt,
                        size: existingProjectSize,
                    },
                    importedState: sanitizedState,
                    importedFile: file,
                });
                return; // Stop processing, wait for user decision
            }

            // If no conflict, but it's an old version, ask for confirmation to migrate.
            if (data.schemaVersion !== SCHEMA_VERSION) {
                actions.openModal({ type: 'confirmImport', fileContent, file });
            } else {
                // No conflict and up-to-date, process directly.
                await processAndLoadFile(set, get, fileContent, file);
            }
        } catch (e) {
            // If JSON parsing fails or any other error, assume it's an old/invalid format.
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
    confirmProjectConflict: async (choice: 'overwrite' | 'keepLocal') => {
        const { activeModals, actions } = get();
        const modal = activeModals[activeModals.length - 1];
        if (modal?.type !== 'projectConflict') return;

        actions.closeModal();

        if (choice === 'overwrite') {
            const { existingProject, importedState } = modal;
            await db.projects.update(existingProject.id, {
                state: importedState,
                title: importedState.canvasTitle,
                modifiedAt: new Date(),
                uuid: importedState.uuid, // Ensure UUID is updated
            });
            await actions.loadProjects();
            await actions.loadProject(existingProject.id);
            actions._addLog(`Proyecto '${existingProject.title}' sobrescrito con la versión importada.`, 'success');
        } else { // 'keepLocal' or 'cancel'
            actions._addLog('Importación cancelada. Se conservó la versión existente.', 'info');
        }
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