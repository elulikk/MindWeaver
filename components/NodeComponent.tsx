import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Node, Mininode, DrawingTool } from '../types';
import { useMindMapStore } from '../store';
import { marked } from '../markdown';
import { Icon, FileIcon } from './Icon';

interface NodeComponentProps {
  node: Node;
  mininodes: Mininode[];
  drawingMode: DrawingTool | null;
  onDoubleClick: () => void;
  onMininodeDoubleClick: (mininode: Mininode) => void;
  onConnectStart: (id: number, portId: string) => void;
  onConnectEnd: (id: number, portId: string) => void;
  onToggleComplete: (id: number) => void;
  onTogglePin: (id: number) => void;
  onDelete: (id: number) => void;
  onNodeMouseDown: (id: number, e: React.MouseEvent<HTMLDivElement>) => void;
  onNodeResizeStart: (id: number, handle: 'br' | 'r' | 'b', e: React.MouseEvent<HTMLDivElement>) => void;
  onAddPort: (nodeId: number, portType: 'input' | 'output') => void;
  onAddMininode: (nodeId: number) => void;
  onDeleteMininode: (mininodeId: number) => void;
  onExportMininode: (mininodeId: number) => void;
  isConnecting: boolean;
  isSelected: boolean;
  activeInputs: Set<string>;
  isInputConditionMet: boolean;
}

const getTextColorForBackground = (hexColor: string): string => {
    if (!hexColor || hexColor.length < 4) return '#f8fafc';
    if (hexColor.startsWith('#')) hexColor = hexColor.slice(1);
    if (hexColor.length === 3) hexColor = hexColor.split('').map(char => char + char).join('');
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 140 ? '#0f172a' : '#f8fafc';
};

const getPortY = (index: number, total: number, height: number): number => {
    if (total <= 1) return height / 2;
    return (height / (total + 1)) * (index + 1);
};

const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 3) return 'text-green-400';
    if (difficulty <= 6) return 'text-yellow-400';
    if (difficulty <= 8) return 'text-orange-400';
    return 'text-red-500';
};

const StartFlag = () => (
    <div className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 drop-shadow-lg pointer-events-none" title="Nodo de Inicio">
        <svg width="40" height="40" viewBox="0 0 40 40">
            <path d="M8 8v24" stroke="#6D4C41" strokeWidth="3" strokeLinecap="round" />
            <path d="M8 8h22v12H8z" fill="#4CAF50" />
        </svg>
    </div>
);

const EndFlag = () => (
    <div className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 drop-shadow-lg pointer-events-none" title="Nodo Final">
        <svg width="40" height="40" viewBox="0 0 40 40">
            <defs>
                <pattern id="checkers" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="5" height="5" fill="black" />
                    <rect x="5" y="0" width="5" height="5" fill="white" />
                    <rect x="0" y="5" width="5" height="5" fill="white" />
                    <rect x="5" y="5" width="5" height="5" fill="black" />
                </pattern>
            </defs>
            <path d="M8 8v24" stroke="#6D4C41" strokeWidth="3" strokeLinecap="round" />
            <rect x="8" y="8" width="24" height="16" fill="url(#checkers)" stroke="black" strokeWidth="0.5" className="animate-flag-wave" />
        </svg>
    </div>
);

const ResizeHandle: React.FC<{
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    className: string;
    title: string;
}> = ({ onMouseDown, className, title }) => (
    <div
        className={`absolute w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm z-20 hover:bg-cyan-200 transition-colors pointer-events-auto ${className}`}
        onMouseDown={onMouseDown}
        title={title}
    />
);

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  mininodes,
  drawingMode,
  onDoubleClick,
  onMininodeDoubleClick,
  onConnectStart,
  onConnectEnd,
  onToggleComplete,
  onTogglePin,
  onDelete,
  onNodeMouseDown,
  onNodeResizeStart,
  onAddPort,
  onAddMininode,
  onDeleteMininode,
  onExportMininode,
  isConnecting,
  isSelected,
  activeInputs,
  isInputConditionMet,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const { showMininodePreviews, checkboxPosition, contextMenuEnabled, actions, focusModeEnabled, draggedMininodeInfo } = useMindMapStore(state => ({
    showMininodePreviews: state.showMininodePreviews,
    checkboxPosition: state.checkboxPosition || 'left',
    contextMenuEnabled: state.contextMenuEnabled,
    actions: state.actions,
    focusModeEnabled: state.focusModeEnabled,
    draggedMininodeInfo: state.draggedMininodeInfo,
  }));
  const [activeMininodeId, setActiveMininodeId] = useState<number | null>(null);

  const isCompactView = node.size.width < 215 || node.size.height < 105;

  useEffect(() => {
    if (activeMininodeId && !mininodes.some(mn => mn.id === activeMininodeId)) {
        setActiveMininodeId(null);
    }
  }, [mininodes, activeMininodeId]);

  const activeMininode = useMemo(() => 
    mininodes.find(mn => mn.id === activeMininodeId),
    [mininodes, activeMininodeId]
  );
  
  const renderedMininodeContent = useMemo(() => {
    if (activeMininode?.content) {
        try {
            return marked.parse(activeMininode.content);
        } catch (e) {
            console.error("Markdown parsing error:", e);
            return '<p class="text-red-500">Error al procesar el markdown.</p>';
        }
    }
    return '';
  }, [activeMininode]);


  const textColor = getTextColorForBackground(node.color);
  const isDarkNode = textColor !== '#0f172a';
  
  const isDropTarget = draggedMininodeInfo && node.id !== draggedMininodeInfo.parentId;

  let borderColor = node.color;
  let boxShadow = '';
  let borderWidth = '2px';
  let borderStyle: 'solid' | 'dashed' = node.isPinned ? 'dashed' : 'solid';

  if (isDropTarget) {
      borderColor = '#facc15'; // yellow-400
      boxShadow = '0 0 15px 4px rgba(250, 204, 21, 0.7)';
      borderWidth = '3px';
      borderStyle = 'dashed';
  } else if (node.isComplete) {
      borderColor = '#22c55e'; // green-500
  } else if (isInputConditionMet) {
      borderColor = '#22d3ee'; // cyan-400
      boxShadow = '0 0 15px 2px rgba(34, 211, 238, 0.7)';
  } else if (node.isPinned) {
      borderColor = '#22d3ee'; // Cyan for pinned
  }
  
  const NORMAL_RADIUS = '8px';
  const LOGIC_RADIUS = '24px';
  const ENDCAP_RADIUS = '20px';

  let topLeftRadius = NORMAL_RADIUS;
  let bottomLeftRadius = NORMAL_RADIUS;
  let topRightRadius = NORMAL_RADIUS;
  let bottomRightRadius = NORMAL_RADIUS;
  
  const hasMininodes = mininodes.length > 0;
  const hasInputs = node.inputs.length > 0;
  const hasOutputs = node.outputs.length > 0;
  const isLogicInput = node.inputs.length > 1;

  if (!hasInputs) {
      topLeftRadius = ENDCAP_RADIUS;
      bottomLeftRadius = ENDCAP_RADIUS;
  } else if (isLogicInput) {
      topLeftRadius = LOGIC_RADIUS;
      bottomLeftRadius = LOGIC_RADIUS;
  }

  if (!hasOutputs) {
      topRightRadius = ENDCAP_RADIUS;
      bottomRightRadius = ENDCAP_RADIUS;
  }
  
  if (!hasInputs && !hasOutputs) {
      topLeftRadius = LOGIC_RADIUS;
      bottomLeftRadius = LOGIC_RADIUS;
      topRightRadius = LOGIC_RADIUS;
      bottomRightRadius = LOGIC_RADIUS;
  }
  
  const finalBottomLeftRadius = hasMininodes ? '0px' : bottomLeftRadius;
  const finalBottomRightRadius = hasMininodes ? '0px' : bottomRightRadius;

  const shapeStyles: React.CSSProperties = {
      borderRadius: `${topLeftRadius} ${topRightRadius} ${finalBottomRightRadius} ${finalBottomLeftRadius}`,
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!contextMenuEnabled || drawingMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isSelected) {
        actions.selectOnlyNode(node.id);
    }
    actions.openContextMenu({ type: 'node', targetId: node.id, x: e.clientX, y: e.clientY });
  };

  const isFaded = focusModeEnabled && (!isInputConditionMet || node.isComplete);

  const Checkbox = (
    <div className="flex-shrink-0 flex items-center justify-center p-1 cursor-pointer">
      <input
        type="checkbox"
        checked={node.isComplete}
        onChange={(e) => { e.stopPropagation(); onToggleComplete(node.id); }}
        className="w-4 h-4 rounded-sm"
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );

  return (
    <div
      ref={nodeRef}
      className={`absolute group ${isFaded ? 'opacity-20 hover:opacity-100 transition-opacity duration-300' : ''}`}
      style={{ transform: `translate(${node.pos.x}px, ${node.pos.y}px)` }}
      onDoubleClick={onDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative" style={{ width: `${node.size.width}px`, ...shapeStyles }}>
        {!hasInputs && <StartFlag />}
        {!hasOutputs && <EndFlag />}
        
        {/* Node Body */}
        <div 
            className={`relative flex flex-col justify-between transition-all duration-200 ${hasMininodes ? 'border-b-0' : ''} ${node.isPinned ? '' : 'active:cursor-grabbing'}`}
            style={{ 
                backgroundColor: node.color, 
                borderColor: borderColor, 
                boxShadow: boxShadow, 
                borderWidth: borderWidth,
                borderStyle: borderStyle,
                ...shapeStyles, 
                height: `${node.size.height}px`, 
                width: `${node.size.width}px`,
                cursor: node.isPinned ? 'default' : 'grab',
            }}
            onDragOver={(e) => {
                if (isDropTarget) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                }
            }}
            onDrop={(e) => {
                if (isDropTarget && draggedMininodeInfo) {
                    e.preventDefault();
                    actions.moveMininode(draggedMininodeInfo.id, node.id);
                    actions.setDraggedMininodeInfo(null);
                }
            }}
            onMouseDown={(e) => {
                if ((e.target as HTMLElement).closest('button, input, .connection-port')) {
                    return;
                }
                onNodeMouseDown(node.id, e);
            }}
        >
             {/* Action Buttons (moved inside) */}
            <button disabled={!!drawingMode} onClick={(e) => { e.stopPropagation(); onAddPort(node.id, 'input'); }} title="Añadir puerto de entrada" className="absolute left-[-8px] bottom-[-8px] w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!scale-110 transition-all duration-200 shadow-md z-20 disabled:opacity-0" ><Icon icon="add" className="w-3 h-3" /></button>
            <button disabled={!!drawingMode} onClick={(e) => { e.stopPropagation(); onAddPort(node.id, 'output'); }} title="Añadir puerto de salida" className="absolute right-[-8px] bottom-[-8px] w-4 h-4 bg-green-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!scale-110 transition-all duration-200 shadow-md z-20 disabled:opacity-0" ><Icon icon="add" className="w-3 h-3" /></button>
            <button disabled={!!drawingMode} onClick={(e) => { e.stopPropagation(); onAddMininode(node.id); }} title="Añadir Diente" className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-4 h-4 bg-sky-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!scale-110 transition-all duration-200 shadow-md z-20 disabled:opacity-0" >
                <Icon icon="add" className="w-3 h-3" />
            </button>
            <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                <button 
                    disabled={!!drawingMode}
                    onClick={(e) => { e.stopPropagation(); onTogglePin(node.id); }} 
                    aria-label={node.isPinned ? 'Desanclar nodo' : 'Anclar nodo'} 
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-white transition-all duration-200 focus:outline-none disabled:opacity-0
                        ${node.isPinned 
                            ? 'opacity-100 bg-cyan-500/80 hover:bg-cyan-600' 
                            : 'opacity-0 group-hover:opacity-100 bg-zinc-600/50 hover:!opacity-100 hover:bg-cyan-500'}`}
                >
                    <Icon icon={node.isPinned ? 'pin-off' : 'pin-on'} className="w-3 h-3" />
                </button>
                <button disabled={!!drawingMode} onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} aria-label="Eliminar nodo" className="delete-button w-5 h-5 rounded-full flex items-center justify-center bg-zinc-600/50 text-white opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-red-500 transition-all duration-200 focus:outline-none disabled:opacity-0" ><Icon icon="delete" className="w-3 h-3" /></button>
            </div>
            <div 
                className="relative w-full p-2 flex items-center justify-between gap-2 transition-colors bg-white/5 border-b border-white/10"
                style={{ color: textColor }}
            >
                {checkboxPosition === 'left' ? Checkbox : <div className="w-5 flex-shrink-0"/>}
                
                <div className="flex-grow flex items-center justify-center gap-2 min-w-0">
                    {node.icon && <Icon icon={node.icon} className="w-4 h-4 flex-shrink-0" style={{ color: node.iconColor }} />}
                    <h2 className="text-sm font-bold truncate" style={{ color: textColor }}>{node.title}</h2>
                    {isLogicInput && !(node.icon === 'node-and' || node.icon === 'node-or') && (
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded-full bg-black/20 flex-shrink-0" style={{ color: textColor }}>{node.inputLogic}</span>
                    )}
                </div>

                {checkboxPosition === 'right' ? Checkbox : <div className="w-5 flex-shrink-0"/>}
            </div>
            
            <div className="flex-grow flex flex-col justify-end px-2 pb-2 text-xs" style={{ color: textColor }}>
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1">
                        {isInputConditionMet && !node.isComplete && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>}
                    </div>
                    {!isCompactView && (
                        <div className={`flex items-center gap-0.5 star-difficulty`}>
                            {[...Array(10)].map((_, i) => (
                                <Icon
                                    key={i}
                                    icon="star"
                                    className={`w-2.5 h-2.5 transition-colors ${i < node.difficulty ? getDifficultyColor(node.difficulty) : 'text-zinc-600'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {!isCompactView && node.time ? (
                    <div className="self-end opacity-70 whitespace-nowrap mt-1">
                        ({node.time} min)
                    </div>
                ) : null}
            </div>


             {/* Ports */}
            <div>
                {node.inputs.map((port, index) => (
                    <div key={port.id} className="connection-port absolute -left-[8px]" style={{ top: `${getPortY(index, node.inputs.length, node.size.height)}px`, transform: 'translateY(-50%)' }} onMouseDown={(e) => e.stopPropagation()} onMouseUp={(e) => { e.stopPropagation(); onConnectEnd(node.id, port.id); }}>
                       <div className={`w-4 h-4 rounded-full border-2 bg-zinc-900 transition-all ${activeInputs.has(port.id) ? 'border-cyan-400' : isConnecting ? 'border-zinc-200 hover:border-cyan-400 hover:bg-cyan-900' : 'border-zinc-500'}`} />
                    </div>
                ))}
                {node.outputs.map((port, index) => (
                    <div key={port.id} className="connection-port absolute -right-[8px]" style={{ top: `${getPortY(index, node.outputs.length, node.size.height)}px`, transform: 'translateY(-50%)' }} onMouseDown={(e) => { e.stopPropagation(); onConnectStart(node.id, port.id); }}>
                       <div className={`w-4 h-4 rounded-full border-2 bg-zinc-900 transition-all ${node.isComplete ? 'border-cyan-400' : 'border-rose-400'} ${isConnecting ? 'hover:border-green-400 hover:bg-green-900' : ''}`} />
                    </div>
                ))}
            </div>
        </div>

        {/* Mininodes Container */}
        {hasMininodes && (
            <div className={`flex flex-col border-x-2 border-b-2 rounded-b-md transition-colors duration-200 ${borderColor === '#facc15' ? 'border-yellow-400' : 'border-zinc-700'}`}>
                {showMininodePreviews && (
                    <div className="relative w-full h-32 bg-zinc-900/80 p-2 overflow-y-auto">
                        <div className="prose prose-sm prose-invert text-xs" dangerouslySetInnerHTML={{ __html: renderedMininodeContent }} />
                    </div>
                )}
                <div className={`flex flex-wrap items-center p-1 gap-1 transition-colors ${borderColor === '#facc15' ? 'bg-yellow-400/10' : 'bg-zinc-800/50'}`}>
                    {mininodes.map(mn => (
                        <button
                            key={mn.id}
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); actions.setDraggedMininodeInfo({ id: mn.id, parentId: mn.parentId }); }}
                            onDragEnd={(e) => { e.stopPropagation(); actions.setDraggedMininodeInfo(null); }}
                            onDoubleClick={(e) => { e.stopPropagation(); onMininodeDoubleClick(mn); }}
                            onClick={() => setActiveMininodeId(mn.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors border ${activeMininodeId === mn.id ? 'bg-cyan-800/50 border-cyan-600' : 'bg-zinc-700/60 border-transparent hover:bg-zinc-600/80'}`}
                            title={mn.title}
                        >
                            <FileIcon icon={mn.icon} className="w-4 h-4 flex-shrink-0"/>
                            <span className="truncate max-w-24">{mn.title}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      {isSelected && (
        <div 
          className="absolute inset-0 border-2 border-dashed border-yellow-400 rounded-lg pointer-events-none" 
          style={{
            borderRadius: shapeStyles.borderRadius,
            width: `${node.size.width}px`,
            height: `${node.size.height}px`,
          }}
        >
          <ResizeHandle className="-right-1.5 -bottom-1.5 cursor-se-resize" onMouseDown={(e) => onNodeResizeStart(node.id, 'br', e)} title="Redimensionar" />
          <ResizeHandle className="-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" onMouseDown={(e) => onNodeResizeStart(node.id, 'r', e)} title="Redimensionar Ancho" />
          <ResizeHandle className="left-1/2 -translate-x-1/2 -bottom-1.5 cursor-ns-resize" onMouseDown={(e) => onNodeResizeStart(node.id, 'b', e)} title="Redimensionar Alto" />
        </div>
      )}
    </div>
  );
};

export default React.memo(NodeComponent);