
import React, { useEffect, useRef, useState } from 'react';
import { ProjectTemplate, MindMapCoreState, IconName } from '../types';
import { Icon } from './Icon';
import { useMindMapStore } from '../store';

interface ConfirmNewCanvasModalProps {
  onClose: () => void;
  onConfirm: (type: ProjectTemplate | MindMapCoreState) => void;
}

const builtInTemplates: { key: ProjectTemplate; title: string; description: string; icon: React.ComponentProps<typeof Icon>['icon'] }[] = [
    { key: 'empty', title: 'Proyecto Vacío', description: 'Empieza desde cero con un lienzo en blanco.', icon: 'new-canvas' },
    { key: 'coffee', title: 'Cómo Hacer Café', description: 'Una plantilla de ejemplo para un tutorial simple.', icon: 'template-coffee' },
    { key: 'electron-compilation', title: 'Compilar App con Electron', description: 'Guía detallada para compilar y empaquetar una app de escritorio.', icon: 'template-electron' },
];

const ConfirmNewCanvasModal: React.FC<ConfirmNewCanvasModalProps> = ({ onClose, onConfirm }) => {
  const { userTemplates, actions } = useMindMapStore(state => ({
    userTemplates: state.userTemplates,
    actions: state.actions,
  }));
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 280 });
  const [size, setSize] = useState({ width: 700, height: 560 });
  const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        await actions.importAsTemplate(file);
    }
    if (e.target) e.target.value = ''; // Reset input
  };

  const TemplateCard: React.FC<{title: string, description: string, icon: IconName, onClick: () => void, onDelete?: (e: React.MouseEvent) => void}> = ({ title, description, icon, onClick, onDelete }) => (
    <div className="group relative">
        <button
            onClick={onClick}
            className="w-full h-full text-left p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-[1.03] focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-zinc-700/50 border-zinc-600 hover:border-cyan-500"
        >
            <Icon icon={icon} className="w-8 h-8 mb-2 text-cyan-500" />
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm mt-1 text-zinc-400">{description}</p>
        </button>
        {onDelete && (
            <button 
                onClick={onDelete} 
                className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-800/50 text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/80 hover:text-white transition-all"
                title="Eliminar plantilla"
            >
                <Icon icon="delete" className="w-4 h-4" />
            </button>
        )}
    </div>
  );

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className="fixed z-[80] rounded-lg shadow-2xl flex flex-col bg-zinc-800 text-zinc-200 pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="cursor-move bg-zinc-900/50 rounded-t-lg" onMouseDown={onDragMouseDown}>
            <div className="py-3 px-6 text-center">
                <h2 className="text-2xl font-bold mb-2 text-zinc-100">
                    Crear Nuevo Proyecto
                </h2>
                <p className="text-zinc-300">
                    Elige una plantilla para empezar o importa la tuya.
                </p>
            </div>
        </div>
        
        <div className="p-6 border-y border-zinc-700 flex-grow overflow-y-auto space-y-6">
            <div>
                <h3 className="text-sm font-bold uppercase text-zinc-500 tracking-wider mb-3">Mis Plantillas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-center p-4 rounded-lg border-2 border-dashed transition-all duration-200 transform hover:scale-[1.03] focus:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-zinc-700/20 border-zinc-600 hover:border-cyan-500 hover:bg-zinc-700/50 flex flex-col items-center justify-center min-h-[140px]"
                    >
                        <Icon icon="import" className="w-8 h-8 mb-2 text-cyan-500" />
                        <h3 className="font-semibold">Importar Plantilla</h3>
                        <p className="text-sm mt-1 text-zinc-400">Carga un archivo .json</p>
                    </button>
                    {userTemplates.map(template => (
                         <TemplateCard
                            key={`user-${template.id}`}
                            onClick={() => onConfirm(template.state)}
                            title={template.title}
                            description="Plantilla personalizada"
                            icon="brain"
                            onDelete={(e) => {
                                e.stopPropagation();
                                actions.deleteUserTemplate(template.id);
                            }}
                        />
                    ))}
                </div>
            </div>
             <div>
                <h3 className="text-sm font-bold uppercase text-zinc-500 tracking-wider mb-3">Plantillas Incorporadas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {builtInTemplates.map(template => (
                        <TemplateCard
                            key={template.key}
                            onClick={() => onConfirm(template.key)}
                            title={template.title}
                            description={template.description}
                            icon={template.icon}
                        />
                    ))}
                </div>
            </div>
        </div>
        
        <div className="flex-shrink-0 flex justify-end p-4 bg-zinc-800 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold rounded-md transition text-zinc-300 bg-zinc-600 hover:bg-zinc-500"
          >
            Cancelar
          </button>
        </div>
         <div 
          onMouseDown={onResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 bg-zinc-500/50 hover:bg-cyan-500 rounded-tl-lg"
          title="Redimensionar"
        />
      </div>
    </>
  );
};

export default ConfirmNewCanvasModal;
