
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
        className={`absolute w-3 h-3 bg-white border-2 border-cyan-500 rounded-sm z-20 hover:bg-cyan-200 transition-colors ${className}`}
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
  const [isGenerating, setIsGenerating] = useState(false);


  const handleGenerateSynthesis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.description?.trim()) {
        actions._addLog('No hay descripción para generar una síntesis.', 'warning');
        return;
    }
    setIsGenerating(true);
    await actions.generateNodeSynthesis(node.id);
    setIsGenerating(false);
  };


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

  const SynthesisContent = (
    <div className="w-full h-full relative flex items-center justify-center p-1">
      {isGenerating && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md z-10">
          <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div>
        </div>
      )}
      {node.synthesis && (
        <p className="text-xs text-center italic" style={{ color: textColor, opacity: 0.8 }}>
          {node.synthesis.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
        </p>
      )}
      {!node.synthesis && node.description?.trim() && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handleGenerateSynthesis}
            disabled={isGenerating}
            title="Generar un resumen con IA de la descripción del nodo"
            className="opacity-0 group-hover:opacity-100 disabled:opacity-50 transition-all bg-cyan-600/80 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2"
          >
            <Icon icon="brain" className="w-4 h-4" />
            Generar Síntesis
          </button>
        </div>
      )}
    </div>
  );

  const isFaded = focusModeEnabled && (!isInputConditionMet || node.isComplete);

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
            className={`relative flex flex-col transition-all duration-200 ${hasMininodes ? 'border-b-0' : ''}`}
            style={{ 
                backgroundColor: node.color, 
                borderColor: borderColor, 
                boxShadow: boxShadow, 
                borderWidth: borderWidth,
                borderStyle: borderStyle,
                ...shapeStyles, 
                height: `${node.size.height}px`, 
                width: `${node.size.width}px`,
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
                className={`relative w-full p-2 text-center transition-colors bg-white/5 border-b border-white/10 ${node.isPinned ? '' : 'active:cursor-grabbing'}`}
                style={{ color: textColor, cursor: node.isPinned ? 'default' : 'grab' }}
                onMouseDown={(e) => { onNodeMouseDown(node.id, e); }}
            >
                <div className="flex items-center justify-center gap-2">
                    {node.icon && <Icon icon={node.icon} className="w-4 h-4 flex-shrink-0" style={{ color: node.iconColor }} />}
                    <h3 className="font-bold text-base break-words select-none" title={node.title}>{node.title}</h3>
                </div>
            </div>
             <div className="flex-grow flex flex-col p-2 justify-between min-h-0">
                <div className="flex-grow flex flex-row items-stretch justify-center relative min-h-0">
                  {isLogicInput ? (
                      <>
                        {!node.icon && (
                          <div className="w-1/3 flex items-center justify-center p-1 border-r border-white/20">
                              <span className="font-bold text-2xl" style={{ color: textColor, opacity: 0.8 }}>{node.inputLogic}</span>
                          </div>
                        )}
                        <div className={!node.icon ? "w-2/3" : "w-full"}>
                            {SynthesisContent}
                        </div>
                      </>
                  ) : (
                      <div className="w-full">
                          {SynthesisContent}
                      </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center justify-center gap-2 pt-2">
                    {node.difficulty > 0 && (
                        <div className="flex items-center gap-0.5" title={`Dificultad: ${node.difficulty} de 10`}>
                            {[...Array(10)].map((_, i) => (
                                <svg key={i + 1} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`star-difficulty w-3 h-3 transition-colors ${(i + 1) <= node.difficulty ? getDifficultyColor(node.difficulty) : (isDarkNode ? 'text-zinc-500' : 'text-zinc-300')}`}>
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2" strokeLinejoin="round" />
                                </svg>
                            ))}
                        </div>
                    )}
                    {(node.difficulty > 0 && node.time > 0) && <div className="w-px h-3 bg-white/20" />}
                    {node.time > 0 && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: textColor, opacity: 0.8 }} title={`Tiempo estimado: ${node.time} min`}>
                            <Icon icon="time" className="w-3 h-3" />
                            <span>{node.time} min</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div 
                aria-label={node.isComplete ? 'Marcar como incompleto' : 'Marcar como completo'} 
                title={node.isComplete ? 'Marcar como incompleto' : 'Marcar como completo'}
                className={`absolute bottom-2 z-20 ${checkboxPosition === 'left' ? 'left-2' : 'right-2'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="switch-toggle-wrapper">
                    <input 
                        type="checkbox" 
                        id={`switch-${node.id}`} 
                        className="switch-toggle-checkbox"
                        checked={node.isComplete}
                        onChange={() => onToggleComplete(node.id)}
                        disabled={!!drawingMode}
                    />
                    <label htmlFor={`switch-${node.id}`} className="switch-toggle-label">
                        <span className="switch-toggle-switch"></span>
                    </label>
                </div>
            </div>

        </div>

        {/* Ports */}
        {node.inputs.map((port, index) => (
            <div 
                key={port.id} 
                className="connection-port group absolute -left-1.5 -translate-y-1/2 flex items-center z-10" 
                style={{ top: getPortY(index, node.inputs.length, node.size.height) }} 
                onMouseUp={(e) => { e.stopPropagation(); onConnectEnd(node.id, port.id); }}
                onContextMenu={(e) => {
                    if (!contextMenuEnabled || drawingMode) return;
                    e.preventDefault();
                    e.stopPropagation();
                    actions.openContextMenu({ type: 'port', nodeId: node.id, portId: port.id, portType: 'input', x: e.clientX, y: e.clientY });
                }}
            >
                <div className={`w-3 h-3 rounded-full border-2 border-white cursor-crosshair transition-all duration-200 ${isConnecting ? 'hover:bg-green-500 scale-125' : ''} ${activeInputs.has(port.id) ? 'bg-green-500' : 'bg-zinc-400'}`} />
                <span className="port-label hidden group-hover:block absolute left-full ml-2 px-2 py-0.5 bg-zinc-800 text-white text-[10px] rounded-md whitespace-nowrap z-50">{port.name.length > 2 ? `${port.name.substring(0, 2)}..` : port.name}</span>
            </div>
        ))}
        {node.outputs.map((port, index) => (
            <div 
                key={port.id} 
                className="connection-port group absolute -right-1.5 -translate-y-1/2 flex items-center z-10" 
                style={{ top: getPortY(index, node.outputs.length, node.size.height) }} 
                onMouseDown={(e) => { e.stopPropagation(); onConnectStart(node.id, port.id); }}
                onContextMenu={(e) => {
                    if (!contextMenuEnabled || drawingMode) return;
                    e.preventDefault();
                    e.stopPropagation();
                    actions.openContextMenu({ type: 'port', nodeId: node.id, portId: port.id, portType: 'output', x: e.clientX, y: e.clientY });
                }}
            >
                <span className="port-label hidden group-hover:block absolute right-full mr-2 px-2 py-0.5 bg-zinc-800 text-white text-[10px] rounded-md whitespace-nowrap z-50">{port.name.length > 2 ? `${port.name.substring(0, 2)}..` : port.name}</span>
                <div className={`w-3 h-3 rounded-full border-2 border-white cursor-crosshair transition-all duration-200 ${node.isComplete ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`} />
            </div>
        ))}
        
        {/* Mininode Tabs & Content */}
        {hasMininodes && (
            <div className={`w-full border-l-2 border-r-2 border-b-2 rounded-b-md -mt-px bg-zinc-800 ${node.isPinned ? 'border-dashed' : ''}`} style={{borderColor}}>
                {/* Tab Bar container provides the full-width bottom line */}
                <div className={`border-b-2 ${node.isPinned ? 'border-dashed' : ''}`} style={{borderColor}}>
                    {mininodes.map(mn => {
                        const isActive = activeMininodeId === mn.id;
                        const contentBg = 'bg-zinc-800';
                        return (
                            <button
                                key={mn.id}
                                draggable={!drawingMode}
                                onDragStart={(e) => {
                                    if (drawingMode) return;
                                    e.dataTransfer.effectAllowed = 'move';
                                    actions.setDraggedMininodeInfo({ id: mn.id, parentId: node.id });
                                }}
                                onDragEnd={() => {
                                    if (drawingMode) return;
                                    actions.setDraggedMininodeInfo(null);
                                }}
                                onClick={() => setActiveMininodeId(prev => prev === mn.id ? null : mn.id)}
                                onDoubleClick={(e) => { e.stopPropagation(); onMininodeDoubleClick(mn); }}
                                onContextMenu={(e) => {
                                    if (!contextMenuEnabled || drawingMode) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    actions.openContextMenu({ type: 'mininode', targetId: mn.id, x: e.clientX, y: e.clientY });
                                }}
                                title={mn.title}
                                className={`inline-flex items-center justify-center p-2 text-sm transition-colors border-b-2
                                    ${isActive
                                        ? `border-cyan-500 ${contentBg} -mb-[2px]`
                                        : `border-transparent text-zinc-400 opacity-70 hover:opacity-100 hover:bg-zinc-700`
                                    }
                                    ${draggedMininodeInfo?.id === mn.id ? 'opacity-40' : ''}`}
                            >
                                <FileIcon icon={mn.icon} className="w-5 h-5" />
                            </button>
                        );
                    })}
                </div>
                
                {/* Content Panel */}
                {activeMininode && showMininodePreviews && (
                    <div
                        className="p-3 overflow-y-auto max-h-48 relative bg-zinc-800"
                    >
                        <div
                            className="markdown-content text-sm dark-theme"
                            dangerouslySetInnerHTML={{ __html: renderedMininodeContent }}
                        />
                    </div>
                )}
            </div>
        )}
        
        {/* Selection Highlight */}
        {isSelected && (
          <div
            className="absolute inset-0 border-2 border-dashed border-yellow-400 pointer-events-none"
            style={{ 
                borderRadius: `${topLeftRadius} ${topRightRadius} ${hasMininodes ? '6px' : bottomRightRadius} ${hasMininodes ? '6px' : bottomLeftRadius}`,
            }}
          />
        )}


        {/* Resize Handles */}
        {isSelected && !node.isPinned && (
            <>
                 <ResizeHandle 
                    onMouseDown={(e) => { e.stopPropagation(); onNodeResizeStart(node.id, 'br', e); }}
                    className="bottom-[-6px] right-[-6px] cursor-nwse-resize"
                    title="Redimensionar"
                />
                 <ResizeHandle 
                    onMouseDown={(e) => { e.stopPropagation(); onNodeResizeStart(node.id, 'r', e); }}
                    className="top-1/2 right-[-6px] -translate-y-1/2 cursor-ew-resize"
                    title="Redimensionar Ancho"
                />
                <ResizeHandle 
                    onMouseDown={(e) => { e.stopPropagation(); onNodeResizeStart(node.id, 'b', e); }}
                    className={ `left-1/2 bottom-[-6px] -translate-x-1/2 cursor-ns-resize ${hasMininodes ? 'bottom-[-6px]' : 'bottom-[-6px]' }`}
                    title="Redimensionar Alto"
                />
            </>
        )}
      </div>
    </div>
  );
};

export default React.memo(NodeComponent);
