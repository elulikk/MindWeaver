


import React, { useState, useEffect } from 'react';
import { Node, Port, IconName } from '../types';
import { Icon } from './Icon';
import { categorizedIcons } from './icons';

interface PortManagerProps {
  ports: Port[];
  onPortsChange: (newPorts: Port[]) => void;
}

const PortManager: React.FC<PortManagerProps> = ({ ports, onPortsChange }) => {
    const [draggedPortId, setDraggedPortId] = useState<string | null>(null);
    const draggedOverPort = React.useRef<string | null>(null);

    const handlePortChange = (id: string, newName: string) => {
        onPortsChange(ports.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const handleAddPort = () => {
        const newPortName = `Puerto Nuevo`;
        const newPort: Port = { id: `port_${Date.now()}_${Math.random()}`, name: newPortName };
        onPortsChange([...ports, newPort]);
    };

    const handleRemovePort = (id: string) => {
        onPortsChange(ports.filter(p => p.id !== id));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedPortId(id);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        draggedOverPort.current = id;
    };

    const handleDrop = () => {
        if (!draggedPortId || !draggedOverPort.current || draggedPortId === draggedOverPort.current) return;
        
        const newPorts = [...ports];
        const draggedIndex = ports.findIndex(p => p.id === draggedPortId);
        const targetIndex = ports.findIndex(p => p.id === draggedOverPort.current);

        const [draggedItem] = newPorts.splice(draggedIndex, 1);
        newPorts.splice(targetIndex, 0, draggedItem);
        
        onPortsChange(newPorts);
        setDraggedPortId(null);
        draggedOverPort.current = null;
    };
    
    const handleDragEnd = () => {
        setDraggedPortId(null);
        draggedOverPort.current = null;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2" onDrop={handleDrop} onDragEnd={handleDragEnd}>
                {ports.map((port) => (
                    <div 
                        key={port.id} 
                        className={`flex items-center gap-2 p-1 rounded-md transition-all duration-150 ${draggedPortId === port.id ? 'opacity-30' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, port.id)}
                        onDragOver={(e) => handleDragOver(e, port.id)}
                    >
                        <Icon icon="drag-handle" className="flex-shrink-0 cursor-grab text-zinc-500" />
                        <input
                            type="text"
                            value={port.name}
                            onChange={(e) => handlePortChange(port.id, e.target.value)}
                            className="w-full p-1.5 border rounded-md text-sm bg-zinc-900 border-zinc-600 text-zinc-100"
                            placeholder="Nombre del puerto"
                        />
                        <button
                            onClick={() => handleRemovePort(port.id)}
                            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors text-zinc-400 hover:bg-zinc-700 hover:text-red-400"
                            aria-label="Eliminar puerto"
                        >
                            <Icon icon="close" className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
            <button onClick={handleAddPort} className="w-full mt-2 px-3 py-1.5 text-sm font-semibold rounded-md transition flex items-center justify-center gap-2 text-zinc-300 bg-zinc-600 hover:bg-zinc-500">
                + Añadir Puerto
            </button>
        </div>
    );
};

interface AdvancedNodeSettingsPanelProps {
  node: Node;
  onSave: (node: Node) => void;
  onClose: () => void;
  initialTab?: 'ports' | 'general' | 'icon';
}

const logicTypes: Array<'AND' | 'OR'> = ['AND', 'OR'];

const ColorInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
}> = ({ label, value, onChange, onClear }) => (
    <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 p-1 border rounded-md border-zinc-600 bg-zinc-900">
                <input 
                    type="color" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-inherit"
                    style={{'WebkitAppearance': 'none', 'MozAppearance': 'none', 'appearance': 'none'}}
                />
                <input 
                    type="text" 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-20 p-1 text-sm font-mono text-center rounded-sm bg-zinc-700 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
            </div>
             {onClear && (
                <button onClick={onClear} title="Restaurar por defecto" className="p-2 rounded-md transition-colors text-zinc-400 hover:bg-zinc-700">
                    <Icon icon="clear" className="w-4 h-4"/>
                </button>
            )}
        </div>
    </div>
);

const AdvancedNodeSettingsPanel: React.FC<AdvancedNodeSettingsPanelProps> = ({ node, onSave, onClose, initialTab }) => {
  const [editedNode, setEditedNode] = useState<Node>(node);
  const [activeTab, setActiveTab] = useState<'ports' | 'general' | 'icon'>(initialTab || 'general');

  useEffect(() => {
    setEditedNode(node);
  }, [node]);
  
  const handleSave = () => {
    onSave({
        ...editedNode,
        inputs: editedNode.inputs.filter(p => p.name.trim()),
        outputs: editedNode.outputs.filter(p => p.name.trim()),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
    } else if (e.key === 'Escape') {
        onClose();
    }
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = Math.round(parseInt(value, 10));
    if (!isNaN(numValue) && numValue >= 50) {
        setEditedNode(prev => ({ ...prev, size: { ...prev.size, [dimension]: numValue }}));
    }
  };
  
  const handleChange = (field: keyof Node, value: any) => {
    setEditedNode(prev => ({...prev, [field]: value}));
  }

  return (
    <div 
        className="absolute inset-0 rounded-lg shadow-2xl w-full h-full flex flex-col z-10 bg-zinc-800 text-zinc-200 border border-zinc-700"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
    >
      <h3 className="text-lg font-bold p-3 border-b border-zinc-700 text-zinc-100 bg-zinc-900/50 rounded-t-lg">
          Ajustes Avanzados del Nodo
      </h3>
      
      <div className="flex flex-grow min-h-0">
          <aside className="flex-shrink-0 w-48 p-4 border-r border-zinc-700">
              <nav className="space-y-2">
                  <button onClick={() => setActiveTab('general')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-3 transition-colors ${activeTab === 'general' ? 'bg-zinc-700' : 'hover:bg-zinc-700/50'}`}>
                      <Icon icon="settings" className="w-5 h-5"/> General
                  </button>
                  <button onClick={() => setActiveTab('ports')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-3 transition-colors ${activeTab === 'ports' ? 'bg-zinc-700' : 'hover:bg-zinc-700/50'}`}>
                      <Icon icon="workflow" className="w-5 h-5"/> Puertos
                  </button>
                  <button onClick={() => setActiveTab('icon')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-3 transition-colors ${activeTab === 'icon' ? 'bg-zinc-700' : 'hover:bg-zinc-700/50'}`}>
                      <Icon icon="frame" className="w-5 h-5"/> Icono
                  </button>
              </nav>
          </aside>
          
          <main className="flex-grow p-6 overflow-y-auto">
              {activeTab === 'ports' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                      <div className="flex flex-col">
                          <label className="block text-sm font-medium mb-2 text-zinc-300">Puertos de Entrada</label>
                          <PortManager ports={editedNode.inputs} onPortsChange={(newPorts) => setEditedNode(p => ({...p, inputs: newPorts}))} />
                      </div>
                      <div className="flex flex-col">
                          <label className="block text-sm font-medium mb-2 text-zinc-300">Puertos de Salida</label>
                          <PortManager ports={editedNode.outputs} onPortsChange={(newPorts) => setEditedNode(p => ({...p, outputs: newPorts}))} />
                      </div>
                  </div>
              )}

              {activeTab === 'general' && (
                  <div className="space-y-6">
                      {editedNode.inputs.filter(p => p.name.trim()).length > 1 && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Lógica de Entrada</label>
                            <div className="flex rounded-md p-1 max-w-xs bg-zinc-700">
                                {logicTypes.map(l => <button key={l} onClick={() => setEditedNode(prev => ({...prev, inputLogic: l}))} className={`flex-1 text-sm py-1 rounded-md transition ${editedNode.inputLogic === l ? 'bg-zinc-900 text-zinc-100 shadow' : 'text-zinc-400'}`}>{l}</button>)}
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                                {editedNode.inputLogic === 'AND' ? 'Todas las entradas deben estar activas.' : 'Al menos una entrada debe estar activa.'}
                            </p>
                        </div>
                      )}

                      <div>
                        <label htmlFor="width" className="block text-sm font-medium text-zinc-300 mb-1">Tamaño (An x Al)</label>
                        <div className="flex items-center gap-2 max-w-xs">
                            <input id="width" type="number" value={Math.round(editedNode.size.width)} onChange={(e) => handleSizeChange('width', e.target.value)} className="w-full p-2 border rounded-md text-center text-sm bg-zinc-900 border-zinc-600" min="50" />
                            <span className="text-zinc-500">x</span>
                            <input id="height" type="number" value={Math.round(editedNode.size.height)} onChange={(e) => handleSizeChange('height', e.target.value)} className="w-full p-2 border rounded-md text-center text-sm bg-zinc-900 border-zinc-600" min="50" />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="orderIndex" className="block text-sm font-medium text-zinc-300 mb-1">Orden de Exportación / Tab</label>
                        <input id="orderIndex" type="number" value={editedNode.orderIndex} onChange={(e) => handleChange('orderIndex', parseInt(e.target.value, 10) || 0)} className="w-full p-2 border rounded-md text-sm bg-zinc-900 border-zinc-600 max-w-xs" min="0" />
                        <p className="text-xs text-zinc-400 mt-1">
                            Controla el orden en la exportación HTML y la navegación con Tab.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Dificultad</label>
                        <div className="flex flex-wrap items-center gap-1">
                          {[...Array(10)].map((_, i) => {
                              const difficultyValue = i + 1;
                              return (
                                <button
                                    key={difficultyValue}
                                    onClick={() => setEditedNode(prev => ({...prev, difficulty: difficultyValue}))}
                                    className={`p-1 rounded-full transition-colors text-zinc-500 hover:text-amber-400 ${difficultyValue <= (editedNode.difficulty || 0) ? '!text-amber-400' : ''}`}
                                    aria-label={`Establecer dificultad a ${difficultyValue}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" /></svg>
                                </button>
                              );
                          })}
                        </div>
                      </div>
                  </div>
              )}
               {activeTab === 'icon' && (
                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">Icono del Nodo (Opcional)</label>
                           {editedNode.icon && (
                                <div className="mb-4">
                                    <ColorInput
                                        label="Color del Icono"
                                        value={editedNode.iconColor || '#ffffff'}
                                        onChange={v => handleChange('iconColor', v)}
                                        onClear={() => handleChange('iconColor', undefined)}
                                    />
                                </div>
                            )}
                          <div className="p-3 rounded-lg border bg-zinc-900/50 border-zinc-700 space-y-4">
                              <button
                                  onClick={() => handleChange('icon', undefined)}
                                  className={`h-12 w-full flex items-center justify-center text-sm font-semibold p-2 rounded-md border-2 transition-colors ${!editedNode.icon ? 'border-cyan-500' : 'border-transparent'} bg-zinc-700/50 hover:bg-zinc-700`}
                              >
                                  Ninguno
                              </button>
                              {Object.entries(categorizedIcons).map(([category, icons]) => (
                                  <div key={category}>
                                      <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2">{category}</h4>
                                      <div className="flex flex-wrap items-center gap-2">
                                          {icons.map(icon => (
                                              <button
                                                  key={icon}
                                                  onClick={() => handleChange('icon', icon)}
                                                  title={icon}
                                                  className={`p-2 rounded-md border-2 transition-colors ${editedNode.icon === icon ? 'border-cyan-500' : 'border-transparent'} hover:bg-zinc-700`}
                                              >
                                                  <Icon icon={icon} className="w-8 h-8" style={{ color: editedNode.icon === icon ? editedNode.iconColor : undefined }} />
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </main>
      </div>

      <div className="flex-shrink-0 flex justify-end items-center gap-3 p-4 border-t border-zinc-700">
           <span className="text-xs text-zinc-400 mr-auto">Consejo: Usa Ctrl+Enter para guardar</span>
          <button onClick={onClose} className="px-3 py-1.5 text-sm font-semibold rounded-md transition text-zinc-300 bg-zinc-600 hover:bg-zinc-500">Cancelar</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition">Aplicar</button>
      </div>
    </div>
  );
};

export default AdvancedNodeSettingsPanel;