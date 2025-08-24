
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { Settings } from '../types';
import { getEmptyCoreState } from '../storeState';

interface SettingsModalProps {
  onClose: () => void;
  onSave: (settings: Settings) => void;
  initialSettings: Settings;
}

const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between no-drag">
        <label className="text-sm font-medium text-zinc-200">{label}</label>
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
    </div>
);

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-600 pb-2">{title}</h3>
        <div className="pl-2 space-y-4">{children}</div>
    </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 280 });
  const [size, setSize] = useState({ width: 700, height: 560 });
  const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 });

  const onDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button, input, select, textarea, .no-drag')) return;
      const info = dragInfo.current;
      info.isDragging = true;
      info.startX = e.clientX;
      info.startY = e.clientY;
      info.startLeft = position.x;
      info.startTop = position.y;
      e.preventDefault();
  };

  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const info = dragInfo.current;
      info.isResizing = true;
      info.startX = e.clientX;
      info.startY = e.clientY;
      info.startWidth = size.width;
      info.startHeight = size.height;
      e.preventDefault();
  };
  
  useEffect(() => {
      const onMouseMove = (e: MouseEvent) => {
          const info = dragInfo.current;
          if (info.isDragging) {
              const dx = e.clientX - info.startX;
              const dy = e.clientY - info.startY;
              const newX = Math.max(0, Math.min(info.startLeft + dx, window.innerWidth - size.width));
              const newY = Math.max(0, Math.min(info.startTop + dy, window.innerHeight - size.height));
              setPosition({ x: newX, y: newY });
          }
          if (info.isResizing) {
              const dw = e.clientX - info.startX;
              const dh = e.clientY - info.startY;
              const newWidth = Math.max(550, info.startWidth + dw);
              const newHeight = Math.max(450, info.startHeight + dh);
              const maxWidth = window.innerWidth - position.x;
              const maxHeight = window.innerHeight - position.y;
              setSize({
                  width: Math.min(newWidth, maxWidth),
                  height: Math.min(newHeight, maxHeight)
              });
          }
      };
      const onMouseUp = () => {
          dragInfo.current.isDragging = false;
          dragInfo.current.isResizing = false;
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      return () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
      };
  }, [size.width, size.height, position.x, position.y]);

  useEffect(() => setSettings(initialSettings), [initialSettings]);
  
  const handleSave = () => {
      onSave(settings);
      onClose();
  };

  const restoreDefaultColors = () => {
    const defaultState = getEmptyCoreState();
    setSettings(s => ({
        ...s,
        backgroundColor: defaultState.backgroundColor,
        gridColor: defaultState.gridColor,
        nodeColor: defaultState.nodeColor,
    }));
  };
  
  return (
    <>
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className="fixed z-[55] rounded-lg shadow-2xl flex flex-col bg-zinc-800 text-zinc-200 border border-zinc-700 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="flex-shrink-0 flex justify-between items-center py-2 px-4 border-b border-zinc-700 cursor-move bg-zinc-900/50 rounded-t-lg"
          onMouseDown={onDragMouseDown}
        >
          <h2 className="text-xl font-bold text-zinc-100">Configuración</h2>
          <button onClick={onClose} className="p-1 rounded-full transition-colors hover:bg-zinc-700">
              <Icon icon="close" className="w-6 h-6" />
          </button>
        </div>
        
        <main className="flex-grow p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                    <Section title="Lienzo">
                         <ColorInput label="Color de Fondo" value={settings.backgroundColor} onChange={v => setSettings(s => ({...s, backgroundColor: v}))} />
                         <ColorInput label="Color de Cuadrícula" value={settings.gridColor} onChange={v => setSettings(s => ({...s, gridColor: v}))} />
                         <ColorInput label="Color de Nodo por Defecto" value={settings.nodeColor} onChange={v => setSettings(s => ({...s, nodeColor: v}))} />
                         <div className="pt-2">
                            <button 
                                onClick={restoreDefaultColors}
                                className="w-full no-drag px-3 py-1.5 text-sm font-semibold rounded-md transition flex items-center justify-center gap-2 text-zinc-300 bg-zinc-600 hover:bg-zinc-500"
                            >
                                Restaurar Colores por Defecto
                            </button>
                         </div>
                    </Section>
                </div>
                <div className="space-y-6">
                    <Section title="Comportamiento">
                        <div className="flex items-center justify-between no-drag">
                            <label htmlFor="show-previews-switch" className="text-sm font-medium text-zinc-200 cursor-pointer">
                                Mostrar vista previa de pestañas
                            </label>
                            <div className="switch-toggle-wrapper">
                                <input 
                                    type="checkbox" 
                                    id="show-previews-switch" 
                                    className="switch-toggle-checkbox"
                                    checked={settings.showMininodePreviews} 
                                    onChange={(e) => setSettings(p => ({ ...p, showMininodePreviews: e.target.checked }))}
                                />
                                <label htmlFor="show-previews-switch" className="switch-toggle-label">
                                    <span className="switch-toggle-switch"></span>
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between no-drag">
                            <label htmlFor="context-menu-switch" className="text-sm font-medium text-zinc-200 cursor-pointer">
                                Habilitar menú contextual (clic derecho)
                            </label>
                            <div className="switch-toggle-wrapper">
                                <input 
                                    type="checkbox" 
                                    id="context-menu-switch" 
                                    className="switch-toggle-checkbox"
                                    checked={settings.contextMenuEnabled} 
                                    onChange={(e) => setSettings(p => ({ ...p, contextMenuEnabled: e.target.checked }))}
                                />
                                <label htmlFor="context-menu-switch" className="switch-toggle-label">
                                    <span className="switch-toggle-switch"></span>
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between no-drag">
                            <label htmlFor="autosave-switch" className="text-sm font-medium text-zinc-200 cursor-pointer">
                                Autoguardado (cada 5 min)
                            </label>
                            <div className="switch-toggle-wrapper">
                                <input 
                                    type="checkbox" 
                                    id="autosave-switch" 
                                    className="switch-toggle-checkbox"
                                    checked={settings.autosaveEnabled} 
                                    onChange={(e) => setSettings(p => ({ ...p, autosaveEnabled: e.target.checked }))}
                                />
                                <label htmlFor="autosave-switch" className="switch-toggle-label">
                                    <span className="switch-toggle-switch"></span>
                                </label>
                            </div>
                        </div>
                        <div className="h-px bg-zinc-600"></div>
                         <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-200">Posición de la casilla</label>
                            <div className="flex rounded-md p-1 max-w-xs bg-zinc-900 no-drag">
                              <button onClick={() => setSettings(p => ({...p, checkboxPosition: 'left'}))} className={`flex-1 text-sm py-1 rounded-md transition ${settings.checkboxPosition === 'left' ? 'bg-zinc-700 text-zinc-100 shadow' : 'text-zinc-400'}`}>Izquierda</button>
                              <button onClick={() => setSettings(p => ({...p, checkboxPosition: 'right'}))} className={`flex-1 text-sm py-1 rounded-md transition ${settings.checkboxPosition === 'right' ? 'bg-zinc-700 text-zinc-100 shadow' : 'text-zinc-400'}`}>Derecha</button>
                            </div>
                          </div>
                    </Section>
                    <Section title="Editor de Nodos">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-zinc-200">Modo de vista por defecto</label>
                            <div className="flex rounded-md p-1 max-w-xs bg-zinc-900 no-drag">
                              <button onClick={() => setSettings(p => ({...p, defaultEditorMode: 'edit'}))} className={`flex-1 text-sm py-1 rounded-md transition ${settings.defaultEditorMode === 'edit' ? 'bg-zinc-700 text-zinc-100 shadow' : 'text-zinc-400'}`}>Editar</button>
                              <button onClick={() => setSettings(p => ({...p, defaultEditorMode: 'split'}))} className={`flex-1 text-sm py-1 rounded-md transition ${settings.defaultEditorMode === 'split' ? 'bg-zinc-700 text-zinc-100 shadow' : 'text-zinc-400'}`}>Dividir</button>
                              <button onClick={() => setSettings(p => ({...p, defaultEditorMode: 'preview'}))} className={`flex-1 text-sm py-1 rounded-md transition ${settings.defaultEditorMode === 'preview' ? 'bg-zinc-700 text-zinc-100 shadow' : 'text-zinc-400'}`}>Vista Previa</button>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </main>
        <div className="flex-shrink-0 flex justify-end items-center gap-3 p-4 border-t border-zinc-700">
            <button onClick={onClose} className="px-3 py-1.5 text-sm font-semibold rounded-md transition bg-zinc-600 hover:bg-zinc-500 text-zinc-300 no-drag">Cancelar</button>
            <button onClick={handleSave} className="px-3 py-1.5 text-sm font-semibold text-white rounded-md transition bg-green-600 hover:bg-green-700 no-drag">Guardar y Cerrar</button>
        </div>
        <div 
          onMouseDown={onResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 no-drag bg-zinc-500/50 hover:bg-cyan-500 rounded-tl-lg"
          title="Redimensionar"
        />
      </div>
    </>
  );
};

export default SettingsModal;
