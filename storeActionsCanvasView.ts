

import React from 'react';
import { MindMapState, Point, CanvasObject, CanvasObjectShape, CanvasObjectLine, CanvasObjectText, CanvasObjectResizeHandle } from './types';
import { getCoreState } from './storeUtils';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createCanvasViewActions = (set: SetState, get: GetState) => ({
    handleMouseMove: (e: React.MouseEvent<HTMLElement>, newMousePosition: Point) => {
        const { isPanning, panStart, viewOffset, zoom, dragInfo, resizeInfo, nodes, isSelecting, selectionStart, drawingObject, canvasObjectDragInfo, canvasObjects, selectedCanvasObjectIds } = get();
    
        if (canvasObjectDragInfo) {
            const dx = (newMousePosition.x - canvasObjectDragInfo.startMousePos.x) / zoom;
            const dy = (newMousePosition.y - canvasObjectDragInfo.startMousePos.y) / zoom;
    
            const newCanvasObjects = canvasObjects.map(obj => {
                if (!selectedCanvasObjectIds.has(obj.id)) return obj;
    
                const initial = canvasObjectDragInfo.initialObjectStates.get(obj.id);
                if (!initial) return obj;
    
                if (canvasObjectDragInfo.isDragging) {
                    let newPos: Point;
                    if (initial.type === 'line') {
                        const newStart = { x: initial.start.x + dx, y: initial.start.y + dy };
                        const newEnd = { x: initial.end.x + dx, y: initial.end.y + dy };
                        return { ...initial, start: newStart, end: newEnd };
                    } else {
                        newPos = { x: initial.pos.x + dx, y: initial.pos.y + dy };
                        return { ...initial, pos: newPos };
                    }
                } else if (canvasObjectDragInfo.isResizing && canvasObjectDragInfo.resizeHandle) {
                    const handle = canvasObjectDragInfo.resizeHandle;
                    
                    if (initial.type === 'line') {
                        let newStart = { ...initial.start };
                        let newEnd = { ...initial.end };
                        if (handle.includes('e')) newEnd.x += dx;
                        if (handle.includes('w')) newStart.x += dx;
                        if (handle.includes('s')) newEnd.y += dy;
                        if (handle.includes('n')) newStart.y += dy;
                        // For lines, handles are simplified to start/end
                        if (handle === 'sw' || handle === 'nw') { // start point handles
                           return { ...initial, start: { x: initial.start.x + dx, y: initial.start.y + dy }};
                        } else { // end point handles
                           return { ...initial, end: { x: initial.end.x + dx, y: initial.end.y + dy }};
                        }
                    } else if (initial.type === 'rect' || initial.type === 'ellipse' || initial.type === 'text') {
                        let { x, y } = initial.pos;
                        let width, height;

                        if (initial.type === 'text') {
                            width = initial.width;
                            height = initial.height;
                        } else {
                            width = initial.size.width;
                            height = initial.size.height;
                        }
                        
                        if (handle.includes('e')) width += dx;
                        if (handle.includes('w')) { x += dx; width -= dx; }
                        if (handle.includes('s')) height += dy;
                        if (handle.includes('n')) { y += dy; height -= dy; }

                        if (width < 10) { width = 10; }
                        if (height < 10) { height = 10; }
                        
                        if (initial.type === 'text') {
                            return { ...initial, pos: { x, y }, width, height };
                        } else {
                            return { ...initial, pos: { x, y }, size: { width, height } };
                        }
                    }
                }
                return obj;
            });
            
            if (canvasObjectDragInfo.isDragging && canvasObjectDragInfo.initialNodeStates) {
                 let newNodes = [...nodes];
                const draggedSwarms = newCanvasObjects.filter(
                    obj => obj.type === 'rect' && (obj as CanvasObjectShape).isSwarm && selectedCanvasObjectIds.has(obj.id)
                );

                if (draggedSwarms.length > 0) {
                    const initialNodePositions = new Map<number, Point>();
                    canvasObjectDragInfo.initialNodeStates.forEach(n => initialNodePositions.set(n.id, n.pos));

                    const initialSwarmStates = draggedSwarms.map(s => canvasObjectDragInfo.initialObjectStates.get(s.id) as CanvasObjectShape);
                    const nodesToMove = new Set<number>();

                    initialSwarmStates.forEach(initialSwarm => {
                        canvasObjectDragInfo.initialNodeStates!.forEach(node => {
                            if (
                                node.pos.x >= initialSwarm.pos.x &&
                                node.pos.y >= initialSwarm.pos.y &&
                                (node.pos.x + node.size.width) <= (initialSwarm.pos.x + initialSwarm.size.width) &&
                                (node.pos.y + node.size.height) <= (initialSwarm.pos.y + initialSwarm.size.height)
                            ) {
                                nodesToMove.add(node.id);
                            }
                        });
                    });

                    newNodes = newNodes.map(node => {
                        if (nodesToMove.has(node.id)) {
                            const initialPos = initialNodePositions.get(node.id);
                            if (initialPos) {
                                return { ...node, pos: { x: initialPos.x + dx, y: initialPos.y + dy } };
                            }
                        }
                        return node;
                    });
                }
                 set({
                    canvasObjects: newCanvasObjects,
                    canvasObjectsById: Object.fromEntries(newCanvasObjects.map(o => [o.id, o])),
                    nodes: newNodes,
                    nodesById: Object.fromEntries(newNodes.map(n => [n.id, n])),
                });
            } else {
                // Not dragging a swarm (e.g., resizing or dragging regular shapes), so only update canvas objects
                 set({
                    canvasObjects: newCanvasObjects,
                    canvasObjectsById: Object.fromEntries(newCanvasObjects.map(o => [o.id, o])),
                });
            }
            return;
        }

        if (drawingObject) {
            const currentPos = {
                x: (newMousePosition.x - viewOffset.x) / zoom,
                y: (newMousePosition.y - viewOffset.y) / zoom,
            };
    
            let updatedObject = { ...drawingObject };
            switch (updatedObject.type) {
                case 'rect':
                case 'ellipse': {
                    const startPos = (drawingObject as CanvasObjectShape).pos;
                    const newPos = { x: Math.min(currentPos.x, startPos.x), y: Math.min(currentPos.y, startPos.y) };
                    const newSize = { width: Math.abs(currentPos.x - startPos.x), height: Math.abs(currentPos.y - startPos.y) };
                    updatedObject = { ...updatedObject, pos: newPos, size: newSize };
                    break;
                }
                case 'line':
                    (updatedObject as CanvasObjectLine).end = currentPos;
                    break;
            }
            set({ drawingObject: updatedObject, mousePosition: newMousePosition });
            return;
        }

        if (isPanning) {
            const dx = newMousePosition.x - panStart.x;
            const dy = newMousePosition.y - panStart.y;
            set({
                mousePosition: newMousePosition,
                viewOffset: { x: viewOffset.x + dx, y: viewOffset.y + dy },
                panStart: newMousePosition,
            });
            return;
        }

        if (dragInfo.isDragging) {
            const dx = (newMousePosition.x - dragInfo.startPos.x) / zoom;
            const dy = (newMousePosition.y - dragInfo.startPos.y) / zoom;
            const newNodes = nodes.map(n => {
                if (get().selectedNodeIds.has(n.id)) {
                    const initialPos = dragInfo.initialNodePositions.get(n.id);
                    if (initialPos) {
                        return { ...n, pos: { x: initialPos.x + dx, y: initialPos.y + dy } };
                    }
                }
                return n;
            });
            // Lighter update, only nodes and nodesById
            set({
                mousePosition: newMousePosition,
                nodes: newNodes,
                nodesById: Object.fromEntries(newNodes.map(n => [n.id, n])),
            });
            return;
        }

        if (resizeInfo) {
            const GRID_SNAP = 10;
            const dx = (newMousePosition.x - resizeInfo.startPos.x) / zoom;
            const dy = (newMousePosition.y - resizeInfo.startPos.y) / zoom;
            const newNodes = nodes.map(n => {
                if (n.id === resizeInfo.nodeId) {
                    const newSize = { ...resizeInfo.startSize };
                    if (resizeInfo.handle.includes('r')) newSize.width = Math.max(100, Math.round((resizeInfo.startSize.width + dx) / GRID_SNAP) * GRID_SNAP);
                    if (resizeInfo.handle.includes('b')) newSize.height = Math.max(50, Math.round((resizeInfo.startSize.height + dy) / GRID_SNAP) * GRID_SNAP);
                    return { ...n, size: newSize };
                }
                return n;
            });
            // Lighter update, only nodes and nodesById
            set({
                mousePosition: newMousePosition,
                nodes: newNodes,
                nodesById: Object.fromEntries(newNodes.map(n => [n.id, n])),
            });
            return;
        }
        
        // For other cases like selection rectangle
        const stateUpdates: Partial<MindMapState> = { mousePosition: newMousePosition };
        if (isSelecting && selectionStart) {
            const x = Math.min(newMousePosition.x, selectionStart.x);
            const y = Math.min(newMousePosition.y, selectionStart.y);
            const width = Math.abs(newMousePosition.x - selectionStart.x);
            const height = Math.abs(newMousePosition.y - selectionStart.y);
            stateUpdates.selectionRect = { x, y, width, height };
        }
        
        set(stateUpdates); // Simple set, no heavy computation
    },
    
    handleMouseDown: (e: React.MouseEvent) => {
        const { drawingMode, mousePosition, zoom, viewOffset, actions, canvasObjects, selectedCanvasObjectIds, canvasObjectsById } = get();
        actions.closeContextMenu();
    
        if (drawingMode) {
            e.stopPropagation(); // Stop propagation for all drawing modes
    
            if (drawingMode === 'edit') {
                const target = e.target as Element;
                const objectElement = target.closest('[data-object-id]');
                const objectId = objectElement?.getAttribute('data-object-id');
                const handleType = target.getAttribute('data-handle-type') as CanvasObjectResizeHandle | null;
                
                if (handleType && objectId) { // RESIZE
                    const initialObjectStates = new Map<string, CanvasObject>();
                    initialObjectStates.set(objectId, canvasObjectsById[objectId]);
                    
                    set({
                        canvasObjectDragInfo: {
                            isDragging: false,
                            isResizing: true,
                            resizeHandle: handleType,
                            startMousePos: mousePosition,
                            initialObjectStates,
                        }
                    });
                } else if (objectId) { // DRAG OR SELECT
                    const isSelected = selectedCanvasObjectIds.has(objectId);
                    let newSelection = new Set(selectedCanvasObjectIds);
    
                    if (e.shiftKey) {
                        if (isSelected) newSelection.delete(objectId);
                        else newSelection.add(objectId);
                    } else if (!isSelected) {
                        newSelection = new Set([objectId]);
                    }
                    
                    set({ selectedCanvasObjectIds: newSelection, selectedNodeIds: new Set() });
    
                    // Start dragging all selected objects
                    const initialObjectStates = new Map<string, CanvasObject>();
                    newSelection.forEach(id => {
                        initialObjectStates.set(id, canvasObjectsById[id]);
                    });
    
                    const isDraggingSwarm = [...newSelection].some(id => (canvasObjectsById[id] as CanvasObjectShape).isSwarm);
    
                    set({
                        canvasObjectDragInfo: {
                            isDragging: true,
                            isResizing: false,
                            resizeHandle: null,
                            startMousePos: mousePosition,
                            initialObjectStates,
                            initialNodeStates: isDraggingSwarm ? get().nodes : undefined,
                        }
                    });
                } else { // CLICK ON CANVAS
                    set({ selectedCanvasObjectIds: new Set() });
                }
            } else { // Other drawing tools: rect, ellipse, line, text
                const startPos = {
                    x: (mousePosition.x - viewOffset.x) / zoom,
                    y: (mousePosition.y - viewOffset.y) / zoom,
                };
        
                let newObject: CanvasObject | null = null;
                const getNewCanvasObjectId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                switch (drawingMode) {
                    case 'rect':
                    case 'ellipse':
                        newObject = {
                            id: getNewCanvasObjectId(drawingMode),
                            type: drawingMode,
                            pos: startPos,
                            size: { width: 0, height: 0 },
                            fillColor: 'rgba(100, 100, 200, 0.2)',
                            strokeColor: '#a7b4c2',
                            strokeWidth: 2,
                        };
                        break;
                    case 'line':
                        newObject = {
                            id: getNewCanvasObjectId('line'),
                            type: 'line',
                            start: startPos,
                            end: startPos,
                            strokeColor: '#a7b4c2',
                            strokeWidth: 2,
                        };
                        break;
                    case 'text':
                        const textObject: CanvasObjectText = {
                            id: getNewCanvasObjectId('text'),
                            type: 'text',
                            pos: startPos,
                            text: 'Nuevo Texto',
                            fontSize: 16,
                            color: '#e4e4e7',
                            width: 150,
                            height: 20
                        };
                        actions.updateCoreState({ canvasObjects: [...canvasObjects, textObject] });
                        set({ drawingObject: null });
                        return; // Return early for text, which is created instantly
                }
                set({ drawingObject: newObject });
            }
            return; // Return after handling drawing mode logic
        }
    
        // Pan with middle mouse button or Ctrl+left-click
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            set({ isPanning: true, panStart: get().mousePosition });
            e.preventDefault();
        } 
        // Left-click on canvas background starts selection box
        else if (e.button === 0) {
            set({ 
                isSelecting: true, 
                selectionStart: get().mousePosition, 
                selectedNodeIds: new Set(),
                selectedCanvasObjectIds: new Set(),
            });
        }
    },
    
    handleMouseUp: (e: React.MouseEvent<HTMLElement>) => {
        const { isSelecting, selectionRect, zoom, viewOffset, nodes, connectingInfo, dragInfo, resizeInfo, pastStates, actions, drawingObject, canvasObjects, canvasObjectDragInfo } = get();

        if (canvasObjectDragInfo) {
            const initialCoreState = {
                ...getCoreState(get()),
                canvasObjects: Array.from(canvasObjectDragInfo.initialObjectStates.values()),
                nodes: canvasObjectDragInfo.initialNodeStates || get().nodes,
            };
            
            set({
                pastStates: [...pastStates, initialCoreState],
                futureStates: [],
                canvasObjectDragInfo: null,
            });
            if (get().editingMode === 'db' && get().currentProjectId) {
                actions.saveOrUpdateProject({ silent: true });
            }
            return;
        }

        if (drawingObject) {
            let isValidObject = true;
            if (drawingObject.type === 'line') {
                const line = drawingObject as CanvasObjectLine;
                if (line.start.x === line.end.x && line.start.y === line.end.y) isValidObject = false;
            } else if (drawingObject.type === 'rect' || drawingObject.type === 'ellipse') {
                const shape = drawingObject as CanvasObjectShape;
                if (shape.size.width < 1 || shape.size.height < 1) isValidObject = false;
            }
    
            if (isValidObject) {
                actions.updateCoreState({ canvasObjects: [...canvasObjects, drawingObject] });
                actions._addLog('Elemento de dibujo añadido.', 'success');
            }
    
            set({ drawingObject: null });
            return;
        }

        let historyStateToPush: MindMapState | null = null;
        
        if (dragInfo.isDragging && dragInfo.initialNodePositions.size > 0) {
            const currentState = get();
            const preDragNodes = currentState.nodes.map(n => {
                const initialPos = dragInfo.initialNodePositions.get(n.id);
                return initialPos ? { ...n, pos: initialPos } : n;
            });
            historyStateToPush = { ...currentState, nodes: preDragNodes };
        } else if (resizeInfo) {
            const preResizeNodes = get().nodes.map(n => {
                return n.id === resizeInfo.nodeId ? { ...n, size: resizeInfo.startSize } : n;
            });
            historyStateToPush = { ...get(), nodes: preResizeNodes };
        }

        const stateUpdates: Partial<MindMapState> = {
            isPanning: false,
            isSelecting: false,
            selectionStart: null,
            resizeInfo: null,
            dragInfo: { ...get().dragInfo, isDragging: false },
            selectionRect: null,
        };
        
        if (historyStateToPush) {
            stateUpdates.pastStates = [...pastStates, getCoreState(historyStateToPush)];
            stateUpdates.futureStates = [];
            
            if (get().editingMode === 'db' && get().currentProjectId) {
                actions.saveOrUpdateProject({ silent: true });
            } else if (get().editingMode === 'file') {
                stateUpdates.isFileDirty = true;
            }
        }

        if (isSelecting && selectionRect) {
            const selectedNodeIds = new Set<number>();
            const canvasRect = {
                x: (selectionRect.x - viewOffset.x) / zoom,
                y: (selectionRect.y - viewOffset.y) / zoom,
                width: selectionRect.width / zoom,
                height: selectionRect.height / zoom,
            };

            nodes.forEach(node => {
                const nodeRect = { x: node.pos.x, y: node.pos.y, width: node.size.width, height: node.size.height };
                if (
                    nodeRect.x < canvasRect.x + canvasRect.width &&
                    nodeRect.x + nodeRect.width > canvasRect.x &&
                    nodeRect.y < canvasRect.y + canvasRect.height &&
                    nodeRect.y + nodeRect.height > canvasRect.y
                ) {
                    selectedNodeIds.add(node.id);
                }
            });
            stateUpdates.selectedNodeIds = selectedNodeIds;
        }
        
        if (connectingInfo) {
            const isPort = !!(e.target as HTMLElement).closest('.connection-port');
            if (!isPort) {
                // Drop on canvas or other UI element, open context menu
                actions.openContextMenu({ type: 'canvas', x: e.clientX, y: e.clientY });
            }
        }
        
        set(stateUpdates);
    },
    handleWheel: (e: React.WheelEvent<HTMLElement>) => {
        const { zoom, viewOffset, mousePosition } = get();
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -1 : 1;
        const newZoom = Math.max(0.2, Math.min(2.5, zoom + delta * zoomSpeed));
        
        const mouseBeforeZoom = {
            x: (mousePosition.x - viewOffset.x) / zoom,
            y: (mousePosition.y - viewOffset.y) / zoom,
        };
        
        const newViewOffset = {
            x: mousePosition.x - mouseBeforeZoom.x * newZoom,
            y: mousePosition.y - mouseBeforeZoom.y * newZoom,
        };

        set({ zoom: newZoom, viewOffset: newViewOffset });
    },
    zoomIn: () => {
        const { zoom, mainSize, viewOffset } = get();
        const newZoom = Math.min(2.5, zoom * 1.2);
        const center = { x: mainSize.width / 2, y: mainSize.height / 2 };
        const newViewOffset = {
            x: center.x - (center.x - viewOffset.x) * (newZoom / zoom),
            y: center.y - (center.y - viewOffset.y) * (newZoom / zoom),
        };
        set({ zoom: newZoom, viewOffset: newViewOffset });
    },
    zoomOut: () => {
        const { zoom, mainSize, viewOffset } = get();
        const newZoom = Math.max(0.2, zoom / 1.2);
        const center = { x: mainSize.width / 2, y: mainSize.height / 2 };
        const newViewOffset = {
            x: center.x - (center.x - viewOffset.x) * (newZoom / zoom),
            y: center.y - (center.y - viewOffset.y) * (newZoom / zoom),
        };
        set({ zoom: newZoom, viewOffset: newViewOffset });
    },
    resetZoom: () => set({ zoom: 1 }),
    frameAllNodes: () => {
        const { nodes, mainSize } = get();
        if (nodes.length === 0 || mainSize.width === 0 || mainSize.height === 0) {
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            minX = Math.min(minX, node.pos.x);
            minY = Math.min(minY, node.pos.y);
            maxX = Math.max(maxX, node.pos.x + node.size.width);
            maxY = Math.max(maxY, node.pos.y + node.size.height);
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        if (contentWidth === 0 || contentHeight === 0) {
            set({ zoom: 1, viewOffset: { x: mainSize.width / 2 - minX, y: mainSize.height / 2 - minY } });
            return;
        }
        
        const padding = 100; // pixels
        const zoomX = mainSize.width / (contentWidth + padding * 2);
        const zoomY = mainSize.height / (contentHeight + padding * 2);
        const newZoom = Math.min(zoomX, zoomY, 1.5); // Cap zoom at 150%

        const newViewOffsetX = (mainSize.width - contentWidth * newZoom) / 2 - minX * newZoom;
        const newViewOffsetY = (mainSize.height - contentHeight * newZoom) / 2 - minY * newZoom;

        set({ zoom: newZoom, viewOffset: { x: newViewOffsetX, y: newViewOffsetY } });
        get().actions._addLog(`Vista encuadrada para mostrar todos los ${nodes.length} nodos.`);
    },
    frameNode: (nodeId: number) => {
        const { nodesById, mainSize, zoom } = get();
        const node = nodesById[nodeId];
        if (!node || mainSize.width === 0 || mainSize.height === 0) return;

        const newViewOffsetX = mainSize.width / 2 - (node.pos.x + node.size.width / 2) * zoom;
        const newViewOffsetY = mainSize.height / 2 - (node.pos.y + node.size.height / 2) * zoom;
        
        set({ viewOffset: { x: newViewOffsetX, y: newViewOffsetY } });
    },
    setMainSize: (size: { width: number, height: number }) => set({ mainSize: size }),
    nodeMouseDown: (nodeId: number, e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (get().drawingMode) return;
        const { nodes, selectedNodeIds, mininodes } = get();
        const node = nodes.find(n => n.id === nodeId);
        if (!node || node.isPinned) return;

        const isShift = e.shiftKey;
        const newSelectedIds = new Set(selectedNodeIds);
        
        if (isShift) {
            if (newSelectedIds.has(nodeId)) {
                newSelectedIds.delete(nodeId);
            } else {
                newSelectedIds.add(nodeId);
            }
        } else {
            if (!newSelectedIds.has(nodeId)) {
                newSelectedIds.clear();
                newSelectedIds.add(nodeId);
            }
        }

        const initialNodePositions = new Map<number, Point>();
        const initialMininodePositions = new Map<number, Point>();
        newSelectedIds.forEach(id => {
            const n = get().nodes.find(node => node.id === id);
            if (n) initialNodePositions.set(id, n.pos);
        });

        mininodes.forEach(mn => {
             if (newSelectedIds.has(mn.parentId)) {
                 initialMininodePositions.set(mn.id, mn.pos);
             }
        });
        
        set({
            selectedNodeIds: newSelectedIds,
            selectedCanvasObjectIds: new Set(),
            dragInfo: {
                isDragging: true,
                startPos: get().mousePosition,
                initialNodePositions,
                initialMininodePositions,
            }
        });
    },
    nodeResizeStart: (nodeId: number, handle: 'br' | 'r' | 'b', e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (get().drawingMode) return;
        const node = get().nodesById[nodeId];
        if (!node) return;
        set({
            resizeInfo: {
                nodeId,
                handle,
                startSize: node.size,
                startPos: get().mousePosition,
            }
        });
    },
});