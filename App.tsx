


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMindMapStore } from './store';
import NodeComponent from './components/NodeComponent';
import EditNodeModal from './components/EditNodeModal';
import EditMininodeModal from './components/EditMininodeModal';
import ConnectionLine from './components/ConnectionLine';
import SettingsModal from './components/SettingsModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ConfirmNewCanvasModal from './components/ConfirmNewCanvasModal';
import ConfirmMarkAllIncompleteModal from './components/ConfirmMarkAllIncompleteModal';
import ConfirmImportModal from './components/ConfirmImportModal';
import SelectEndNodeModal from './components/SelectEndNodeModal';
import ProjectExplorer from './components/ProjectExplorer';
import LogPanel from './components/LogPanel';
import RibbonToolbar from './components/RibbonToolbar';
import HelpModal from './components/HelpModal';
import InfoModal from './components/ChangelogModal';
import ProjectIconPickerModal from './components/ProjectIconPickerModal';
import DockablePanel from './components/DockablePanel';
import CanvasObjectLayer from './components/CanvasObjectLayer';
import EditCanvasTextModal from './components/EditCanvasTextModal';
import { Icon } from './components/Icon';
import { Connection, IconName, ActiveModal, CanvasObjectShape } from './types';
import { isColorDark } from './utils';
import { SCHEMA_VERSION } from './storeState';
import { useTranslations } from './components/locales/i18n';

const VIRTUAL_CANVAS_SIZE = 10000;
const PORT_OFFSET = 8;
const APP_VERSION = '1.15.5';

const ContextMenu = () => {
    const t = useTranslations();
    const { contextMenu, actions, selectedNodeIds, connectingInfo, canvasObjectsById } = useMindMapStore();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as globalThis.Node)) {
                actions.closeContextMenu();
            }
        };
        if (contextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenu, actions]);

    if (!contextMenu) return null;

    const { x, y, type } = contextMenu;

    const MenuItem: React.FC<{ onClick: () => void; icon: IconName; label: string; disabled?: boolean; destructive?: boolean }> = ({ onClick, icon, label, disabled, destructive }) => (
        <button
            onClick={() => {
                if (!disabled) {
                    onClick();
                    actions.closeContextMenu();
                }
            }}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm rounded transition-colors ${
                destructive 
                    ? 'text-red-500 hover:bg-red-500/10'
                    : 'text-zinc-200 hover:bg-zinc-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Icon icon={icon} className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
        </button>
    );

    const Separator = () => <div className="h-px my-1 border-t border-zinc-600" />;

    const renderMenuContent = () => {
        switch (type) {
            case 'canvas':
                if (connectingInfo) {
                    return (
                        <>
                            <MenuItem onClick={() => actions.addNodeAndConnect('normal')} icon="node-normal" label={t('contextMenu.nodeNormal')} />
                            <MenuItem onClick={() => actions.addNodeAndConnect('starter')} icon="node-start" label={t('contextMenu.nodeStart')} />
                            <MenuItem onClick={() => actions.addNodeAndConnect('finish')} icon="node-finish" label={t('contextMenu.nodeFinish')} />
                            <MenuItem onClick={() => actions.addNodeAndConnect('and')} icon="node-and" label={t('contextMenu.nodeAnd')} />
                            <MenuItem onClick={() => actions.addNodeAndConnect('or')} icon="node-or" label={t('contextMenu.nodeOr')} />
                            <MenuItem onClick={() => actions.addNodeAndConnect('empty')} icon="node-empty" label={t('contextMenu.nodeEmpty')} />
                        </>
                    );
                }
                return (
                    <>
                        <MenuItem onClick={() => actions.addNode('normal')} icon="node-normal" label={t('contextMenu.nodeNormal')} />
                        <MenuItem onClick={() => actions.addNode('starter')} icon="node-start" label={t('contextMenu.nodeStart')} />
                        <MenuItem onClick={() => actions.addNode('finish')} icon="node-finish" label={t('contextMenu.nodeFinish')} />
                        <MenuItem onClick={() => actions.addNode('and')} icon="node-and" label={t('contextMenu.nodeAnd')} />
                        <MenuItem onClick={() => actions.addNode('or')} icon="node-or" label={t('contextMenu.nodeOr')} />
                        <MenuItem onClick={() => actions.addNode('empty')} icon="node-empty" label={t('contextMenu.nodeEmpty')} />
                        <Separator />
                        <MenuItem onClick={actions.pasteFromClipboard} icon="paste" label={t('contextMenu.paste')} disabled={!useMindMapStore.getState().clipboard} />
                        <MenuItem onClick={actions.frameAllNodes} icon="frame" label={t('contextMenu.frameAll')} />
                    </>
                );
            case 'node':
                const targetId = (contextMenu as { targetId: number }).targetId;
                const node = useMindMapStore.getState().nodesById[targetId];
                const isMultiSelect = selectedNodeIds.size > 1;
                return (
                    <>
                       {!isMultiSelect && <MenuItem onClick={() => actions.openModal({ type: 'edit', node })} icon="settings" label={t('contextMenu.editNode')} />}
                       {!isMultiSelect && <MenuItem onClick={() => actions.addMininode(targetId)} icon="add" label={t('contextMenu.addMininode')} />}
                       {!isMultiSelect && <MenuItem 
                            onClick={() => actions.toggleNodePin(targetId)} 
                            icon={node.isPinned ? 'pin-off' : 'pin-on'} 
                            label={node.isPinned ? t('contextMenu.unpinNode') : t('contextMenu.pinNode')} 
                        />}
                        {isMultiSelect && <MenuItem onClick={actions.reorganizeOrderIndexForSelection} icon="workflow" label={t('contextMenu.reorganizeSelection')}/>}
                        <Separator />
                        <MenuItem onClick={actions.copySelection} icon="copy" label={t('contextMenu.copy')} disabled={selectedNodeIds.size === 0} />
                        <MenuItem onClick={actions.exportSelectionToHtml} icon="html" label={t('contextMenu.exportSelectionHtml')} disabled={selectedNodeIds.size === 0} />
                        <Separator />
                        <MenuItem onClick={() => actions.requestDeleteSelection()} icon="delete" label={t('contextMenu.delete')} destructive />
                    </>
                );
            case 'mininode':
                const mininodeId = (contextMenu as { targetId: number }).targetId;
                const mininode = useMindMapStore.getState().mininodesById[mininodeId];
                if (!mininode) return null;
                return (
                    <>
                        <MenuItem onClick={() => actions.openModal({ type: 'editMininode', mininode })} icon="settings" label={t('contextMenu.editMininode')} />
                        <MenuItem onClick={() => actions.exportMininodeContent(mininodeId)} icon="download" label={t('contextMenu.downloadMininode', { title: mininode.title })} />
                        <Separator />
                        <MenuItem onClick={() => actions.requestDeleteMininode(mininodeId)} icon="delete" label={t('contextMenu.deleteMininode')} destructive />
                    </>
                );
            case 'connection':
                const conn = (contextMenu as { targetId: Connection }).targetId;
                const isWireless = conn.isWireless ?? false;
                return (
                    <>
                        <MenuItem onClick={() => actions.insertNodeInConnection(conn)} icon="add" label={t('contextMenu.insertNode')} />
                        <MenuItem onClick={() => actions.toggleConnectionWirelessMode(conn)} icon="wifi" label={isWireless ? t('contextMenu.makeWired') : t('contextMenu.makeWireless')} />
                        <Separator />
                        <MenuItem onClick={() => actions.deleteConnection(conn)} icon="delete" label={t('contextMenu.deleteConnection')} destructive />
                    </>
                );
            case 'port': {
                const { nodeId, portId, portType } = contextMenu as { nodeId: number, portId: string, portType: 'input' | 'output' };
                return (
                    <MenuItem onClick={() => actions.deletePort(nodeId, portType, portId)} icon="delete" label={t('contextMenu.deletePort')} destructive />
                );
            }
            case 'canvas-object': {
                const { objectId } = contextMenu as { objectId: string };
                const object = canvasObjectsById[objectId];
                if (!object) return null;

                return (
                    <>
                        {object.type === 'text' && (
                           <MenuItem onClick={() => actions.openModal({ type: 'editCanvasText', objectId })} icon="settings" label={t('contextMenu.editText')} />
                        )}
                        {object.type === 'rect' && (
                            <MenuItem 
                                onClick={() => actions.toggleSwarm(objectId)}
                                icon="brain"
                                label={(object as CanvasObjectShape).isSwarm ? t('contextMenu.convertToShape') : t('contextMenu.convertToSwarm')}
                            />
                        )}
                        <MenuItem onClick={actions.requestDeleteSelectedCanvasObjects} icon="delete" label={t('contextMenu.delete')} destructive />
                    </>
                );
            }
            default:
                return null;
        }
    };
    
    return (
        <div
            ref={menuRef}
            style={{ top: `${y}px`, left: `${x}px` }}
            className="fixed z-[100] min-w-max bg-zinc-800 border border-zinc-600 text-zinc-200 rounded-lg shadow-2xl p-2 animate-fade-in-fast"
            onContextMenu={(e) => e.preventDefault()}
        >
            {renderMenuContent()}
        </div>
    );
};

const App: React.FC = () => {
  const mainRef = useRef<HTMLElement>(null);
  const backdropMouseDownTarget = useRef<EventTarget | null>(null);
  const t = useTranslations();
  
  const {
    nodes,
    connections,
    viewOffset,
    zoom,
    connectingInfo,
    mousePosition,
    isLoading,
    activeModals,
    selectedNodeIds,
    selectedCanvasObjectIds,
    nodeStatus,
    nodesById,
    mininodesByParentId,
    canvasObjectsById,
    isLogPanelOpen,
    backgroundColor,
    gridColor,
    isDarkTheme,
    contextMenuEnabled,
    actions,
    mininodesById,
    nodeColor,
    autosaveEnabled,
    editingMode,
    currentProjectId,
    isPanning,
    drawingMode,
    drawingObject,
    canvasObjectDragInfo,
    canvasObjects,
    focusModeEnabled,
    isSelecting,
    selectionRect,
  } = useMindMapStore();

  // --- AUTOSAVE ---
  useEffect(() => {
    if (autosaveEnabled && editingMode === 'db' && currentProjectId) {
        const intervalId = setInterval(() => {
            actions.saveOrUpdateProject({ silent: true });
            actions._addLog('Proyecto autoguardado.', 'info');
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(intervalId);
    }
  }, [autosaveEnabled, editingMode, currentProjectId, actions]);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    actions.loadProjects();
    actions.loadUserTemplates();
  }, [actions]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (useMindMapStore.getState().activeModals.length > 0 || (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            const { nodes, selectedNodeIds, actions } = useMindMapStore.getState();
            if (nodes.length === 0) return;

            const sortedNodes = [...nodes].sort((a, b) => a.orderIndex - b.orderIndex);
            const selectedId = selectedNodeIds.size > 0 ? [...selectedNodeIds][0] : null;

            let currentIndex = -1;
            if (selectedId !== null) {
                currentIndex = sortedNodes.findIndex(n => n.id === selectedId);
            }

            const offset = e.shiftKey ? -1 : 1;
            const nextIndex = (currentIndex + offset + sortedNodes.length) % sortedNodes.length;
            const nextNode = sortedNodes[nextIndex];

            if (nextNode) {
                actions.selectOnlyNode(nextNode.id);
                actions.frameNode(nextNode.id);
            }
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            const state = useMindMapStore.getState();
            if (state.selectedNodeIds.size > 0) {
                actions.requestDeleteSelection();
            } else if (state.selectedCanvasObjectIds.size > 0) {
                actions.requestDeleteSelectedCanvasObjects();
            }
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z': e.preventDefault(); actions.undo(); break;
                case 'y': e.preventDefault(); actions.redo(); break;
                case 'c': e.preventDefault(); actions.copySelection(); break;
                case 'v': e.preventDefault(); actions.pasteFromClipboard(); break;
                case 's':
                    e.preventDefault();
                    actions.saveOrUpdateProject();
                    break;
                case 'n': e.preventDefault(); actions.openModal({ type: 'confirmNew' }); break;
                case 'b': e.preventDefault(); actions.toggleExplorer(); break;
                case 'f': e.preventDefault(); actions.frameAllNodes(); break;
                case 'l': e.preventDefault(); actions.toggleLogPanel(); break;
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  // --- RENDERING OPTIMIZATION & CANVAS SIZE ---
  useEffect(() => {
    if (!mainRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        actions.setMainSize({ width, height });
      }
    });
    resizeObserver.observe(mainRef.current);
    return () => resizeObserver.disconnect();
  }, [actions]);

  const visibleNodes = useMemo(() => {
      const mainSize = useMindMapStore.getState().mainSize;
      if (!mainSize.width || !mainSize.height) return nodes; // Render all if size not determined yet

      const viewRect = {
          x: -viewOffset.x / zoom,
          y: -viewOffset.y / zoom,
          width: mainSize.width / zoom,
          height: mainSize.height / zoom
      };

      const buffer = 400;

      return nodes.filter(node => {
          const nodeRect = { x: node.pos.x, y: node.pos.y, width: node.size.width, height: node.size.height };
          return nodeRect.x < viewRect.x + viewRect.width + buffer &&
                 nodeRect.x + nodeRect.width > viewRect.x - buffer &&
                 nodeRect.y < viewRect.y + viewRect.height + buffer &&
                 nodeRect.y + nodeRect.height > viewRect.y - buffer;
      });
  }, [nodes, viewOffset, zoom, useMindMapStore.getState().mainSize]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const fadedNodeIds = useMemo(() => {
      if (!focusModeEnabled) return new Set<number>();
      return new Set(nodes.filter(n => !nodeStatus.get(n.id)?.isConditionMet || n.isComplete).map(n => n.id));
  }, [focusModeEnabled, nodes, nodeStatus]);

  const visibleConnections = useMemo(() => {
      return connections.filter(conn => {
          if (focusModeEnabled && (fadedNodeIds.has(conn.fromNode) || fadedNodeIds.has(conn.toNode))) {
              return false;
          }
          return visibleNodeIds.has(conn.fromNode) || visibleNodeIds.has(conn.toNode);
      });
  }, [connections, visibleNodeIds, focusModeEnabled, fadedNodeIds]);

  const getPortY = (index: number, total: number, height: number): number => {
    if (total <= 1) return height / 2;
    return (height / (total + 1)) * (index + 1);
  };

  const connectingFromNode = connectingInfo ? nodesById[connectingInfo.nodeId] : null;
  let lineStartPos: {x: number, y: number} | null = null;
  if (connectingFromNode && connectingInfo) {
    const portIndex = connectingFromNode.outputs.findIndex(p => p.id === connectingInfo.portId);
    if (portIndex !== -1) {
      lineStartPos = {
        x: connectingFromNode.pos.x + connectingFromNode.size.width + PORT_OFFSET,
        y: connectingFromNode.pos.y + getPortY(portIndex, connectingFromNode.outputs.length, connectingFromNode.size.height)
      };
    }
  }

  // --- MODAL RENDERING ---
  const renderActiveModal = () => {
    if (activeModals.length === 0) return null;
    const activeModal = activeModals[activeModals.length - 1];
    
    switch (activeModal.type) {
      case 'edit': return <EditNodeModal node={activeModal.node} onSave={actions.saveNode} onClose={actions.closeModal} />;
      case 'editMininode': return <EditMininodeModal mininode={activeModal.mininode} onSave={actions.saveMininode} onClose={actions.closeModal} />;
      case 'delete': return <ConfirmDeleteModal nodeTitle={nodesById[activeModal.nodeId]?.title} onConfirm={actions.confirmDeleteNode} onClose={actions.closeModal} bodyText={t('modals.deleteConfirm.nodeBody', { title: nodesById[activeModal.nodeId]?.title || '' })} confirmText={t('modals.deleteConfirm.confirmDeleteNode')} />;
      case 'deleteMininode': return <ConfirmDeleteModal nodeTitle={mininodesById[activeModal.mininodeId]?.title} onConfirm={actions.confirmDeleteMininode} onClose={actions.closeModal} bodyText={t('modals.deleteConfirm.mininodeBody', { title: mininodesById[activeModal.mininodeId]?.title || '' })} confirmText={t('modals.deleteConfirm.confirmDeleteMininode')} />;
      case 'deleteSelection': return <ConfirmDeleteModal onConfirm={actions.confirmDeleteSelection} onClose={actions.closeModal} bodyText={t('modals.deleteConfirm.selectionBody', { count: selectedNodeIds.size })} confirmText={t('modals.deleteConfirm.confirmDeleteSelection', { count: selectedNodeIds.size })} />;
      case 'deleteCanvasObjects': return <ConfirmDeleteModal onConfirm={actions.confirmDeleteSelectedCanvasObjects} onClose={actions.closeModal} bodyText={t('modals.deleteConfirm.canvasObjectBody', { count: selectedCanvasObjectIds.size })} confirmText={t('modals.deleteConfirm.confirmDeleteCanvasObjects', { count: selectedCanvasObjectIds.size })} />;
      case 'settings': return <SettingsModal initialSettings={{ showMininodePreviews: useMindMapStore.getState().showMininodePreviews, checkboxPosition: useMindMapStore.getState().checkboxPosition, backgroundColor, gridColor, nodeColor: nodeColor, contextMenuEnabled, defaultEditorMode: useMindMapStore.getState().defaultEditorMode, autosaveEnabled: useMindMapStore.getState().autosaveEnabled }} onSave={actions.saveSettings} onClose={actions.closeModal} />;
      case 'confirmNew': return <ConfirmNewCanvasModal onConfirm={actions.addNewProject} onClose={actions.closeModal} />;
      case 'confirmMarkAllIncomplete': return <ConfirmMarkAllIncompleteModal onConfirm={actions.confirmMarkAllIncomplete} onClose={actions.closeModal} />;
      case 'confirmImport': return <ConfirmImportModal onConfirm={actions.confirmImport} onClose={actions.closeModal} />;
      case 'selectEndNode': return <SelectEndNodeModal />;
      case 'help': return <HelpModal onClose={actions.closeModal} isDarkTheme={isDarkTheme} initialTab={activeModal.initialTab} />;
      case 'info': return <InfoModal onClose={actions.closeModal} isDarkTheme={isDarkTheme} version={APP_VERSION} schemaVersion={SCHEMA_VERSION} />;
      case 'projectIconPicker': return <ProjectIconPickerModal />;
      case 'editCanvasText': return <EditCanvasTextModal objectId={activeModal.objectId} />;
      case 'deleteProject': {
        const projectToDelete = useMindMapStore.getState().projects.find(p => p.id === activeModal.projectId);
        return <ConfirmDeleteModal 
            onConfirm={actions.confirmDeleteProject} 
            onClose={actions.closeModal} 
            nodeTitle={projectToDelete?.title} 
            bodyText={t('modals.deleteConfirm.projectBody', { title: projectToDelete?.title || '' })} 
            confirmText={t('modals.deleteConfirm.confirmDeleteProject')} 
        />;
      }
      default: return null;
    }
  };

  const cursorStyle = useMemo(() => {
    const target = (mousePosition as any).target as HTMLElement; // A bit of a hack, assuming mousemove updates it
    if (drawingMode === 'edit') {
        const handle = target?.getAttribute('data-handle-type');
        if (handle) {
            if (handle.includes('n') && handle.includes('s')) return 'ns-resize';
            if (handle.includes('e') && handle.includes('w')) return 'ew-resize';
            if ((handle.includes('n') && handle.includes('w')) || (handle.includes('s') && handle.includes('e'))) return 'nwse-resize';
            if ((handle.includes('n') && handle.includes('e')) || (handle.includes('s') && handle.includes('w'))) return 'nesw-resize';
        }
        if (canvasObjectDragInfo?.isDragging) return 'move';
        if (target?.closest('[data-object-id]')) return 'move';
        return 'default';
    }
    if (drawingMode) return 'crosshair';
    if (isPanning) return 'grabbing';
    return 'grab';
  }, [drawingMode, isPanning, canvasObjectDragInfo, mousePosition]);


  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans select-none ${isDarkTheme ? 'dark bg-zinc-900 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
      <DockablePanel panelId="explorer" title={t('app.projectName')} side="left">
        <ProjectExplorer />
      </DockablePanel>

      <div className="flex flex-col flex-grow">
        <RibbonToolbar />

        <main
          ref={mainRef}
          className="flex-grow relative overflow-hidden"
          style={{ 
            backgroundColor,
            cursor: cursorStyle
          }}
          onMouseMove={(e) => {
            if (!mainRef.current) return;
            const rect = mainRef.current.getBoundingClientRect();
            const newMousePosition = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            (newMousePosition as any).target = e.target;
            actions.handleMouseMove(e, newMousePosition);
          }}
          onMouseDown={(e) => {
             if (!mainRef.current) return;
             actions.handleMouseDown(e)
          }}
          onMouseUp={actions.handleMouseUp}
          onWheel={actions.handleWheel}
          onContextMenu={(e) => {
              if (!contextMenuEnabled) return;
              e.preventDefault();
              const target = e.target as HTMLElement;
              const objectElement = target.closest('[data-object-id]');
              const objectId = objectElement?.getAttribute('data-object-id');

              if (objectId) {
                  actions.openContextMenu({ type: 'canvas-object', objectId, x: e.clientX, y: e.clientY });
              } else {
                  actions.openContextMenu({ type: 'canvas', x: e.clientX, y: e.clientY });
              }
          }}
          onDoubleClick={(e) => {
            if (drawingMode) return;
            
            if (drawingMode === 'edit') {
                const target = e.target as HTMLElement;
                const objectElement = target.closest('[data-object-id]');
                const objectId = objectElement?.getAttribute('data-object-id');
                if (objectId && canvasObjectsById[objectId]?.type === 'text') {
                    actions.openModal({ type: 'editCanvasText', objectId });
                }
            }
          }}
        >
          {/* Grid background */}
          <div className="absolute inset-0 pointer-events-none" style={{
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
              backgroundPosition: `${viewOffset.x}px ${viewOffset.y}px`,
              opacity: 0.5,
          }} />

          {/* Selection Rectangle */}
          {isSelecting && selectionRect && (
            <div
              className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/20 pointer-events-none z-20"
              style={{
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            />
          )}
          
          <button
              onClick={actions.toggleFocusMode}
              title={t('app.focusMode')}
              className={`absolute top-2 left-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
                  ${focusModeEnabled 
                      ? 'bg-yellow-500/80 text-black shadow-lg' 
                      : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/80'
                  }`}
          >
              <Icon icon="focus-mode" className="w-5 h-5" />
              <span className="text-sm font-semibold">{t('app.focus')}</span>
          </button>


          {/* Canvas content */}
          <div className="absolute" style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`, transformOrigin: 'top left' }}>
            <div className="relative" style={{ width: `${VIRTUAL_CANVAS_SIZE}px`, height: `${VIRTUAL_CANVAS_SIZE}px` }}>
              {/* Connections & Drawings */}
              <svg className="absolute w-full h-full pointer-events-none overflow-visible">
                 <CanvasObjectLayer 
                    objects={canvasObjects} 
                    tempObject={drawingObject}
                    selectedObjectIds={selectedCanvasObjectIds}
                    drawingMode={drawingMode}
                    actions={actions}
                />
                {visibleConnections.map((conn) => {
                    const fromNode = nodesById[conn.fromNode];
                    const toNode = nodesById[conn.toNode];
                    if (!fromNode || !toNode) return null;
                    return <ConnectionLine key={`${conn.fromNode}-${conn.fromPortId}-${conn.toNode}-${conn.toPortId}`} fromNode={fromNode} toNode={toNode} connection={conn} drawingMode={drawingMode} />;
                })}
                {connectingInfo && lineStartPos && mousePosition && (
                  <path d={`M ${lineStartPos.x} ${lineStartPos.y} L ${(mousePosition.x - viewOffset.x) / zoom} ${(mousePosition.y - viewOffset.y) / zoom}`} stroke="#22d3ee" strokeWidth="2" fill="none" />
                )}
              </svg>

              {/* Nodes */}
              {visibleNodes.map(node => (
                <NodeComponent
                  key={node.id}
                  node={node}
                  mininodes={mininodesByParentId[node.id] || []}
                  drawingMode={drawingMode}
                  onDoubleClick={() => !drawingMode && actions.openModal({ type: 'edit', node })}
                  onMininodeDoubleClick={(mininode) => actions.openModal({ type: 'editMininode', mininode })}
                  onConnectStart={actions.connectStart}
                  onConnectEnd={actions.connectEnd}
                  onToggleComplete={actions.toggleNodeComplete}
                  onTogglePin={actions.toggleNodePin}
                  onDelete={actions.requestDeleteNode}
                  onNodeMouseDown={actions.nodeMouseDown}
                  onNodeResizeStart={actions.nodeResizeStart}
                  onAddPort={actions.addPort}
                  onAddMininode={actions.addMininode}
                  onDeleteMininode={actions.requestDeleteMininode}
                  onExportMininode={actions.exportMininodeContent}
                  isConnecting={!!connectingInfo}
                  isSelected={selectedNodeIds.has(node.id)}
                  activeInputs={nodeStatus.get(node.id)?.activeInputs || new Set()}
                  isInputConditionMet={nodeStatus.get(node.id)?.isConditionMet || false}
                />
              ))}
            </div>
          </div>
          
            <div className="absolute bottom-2 right-2 flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="opacity-50 pointer-events-none">{t('app.devBy')}</span>
            </div>

          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
                    <p className="text-lg font-semibold text-white">{isLoading}</p>
                </div>
            </div>
          )}
        </main>
      </div>

      {isLogPanelOpen && <LogPanel />}
      
      {/* Modal Layer */}
      {activeModals.length > 0 && (
          <div
            className="absolute inset-0 bg-black/60 z-50 backdrop-blur-sm pointer-events-auto"
            onMouseDown={(e) => { backdropMouseDownTarget.current = e.target; }}
            onClick={(e) => {
                if (backdropMouseDownTarget.current === e.currentTarget && e.target === e.currentTarget) {
                    actions.closeModal();
                }
            }}
          >
              {renderActiveModal()}
          </div>
      )}
      
      <ContextMenu />
    </div>
  );
};

export default App;