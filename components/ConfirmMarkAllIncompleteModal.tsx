
import React, { useEffect, useRef, useState } from 'react';

interface ConfirmMarkAllIncompleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmMarkAllIncompleteModal: React.FC<ConfirmMarkAllIncompleteModalProps> = ({ onClose, onConfirm }) => {
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 224, y: window.innerHeight / 2 - 120 });
  const [size, setSize] = useState({ width: 448, height: 240 });
  const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 });

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
              const newWidth = Math.max(400, info.startWidth + dw);
              const newHeight = Math.max(200, info.startHeight + dh);
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
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter') {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onConfirm]);

  return (
    <>
      <div
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
        className="fixed z-[80] rounded-lg shadow-2xl flex flex-col bg-zinc-800 text-zinc-200 pointer-events-auto cursor-move"
        onClick={e => e.stopPropagation()}
        onMouseDown={onDragMouseDown}
      >
        <div className="flex-grow p-6 flex flex-col space-y-4">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-yellow-900/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-100">
                      Confirmar Acción
                    </h2>
                    <p className="mt-2 text-zinc-300">
                      ¿Estás seguro de que quieres marcar todos los nodos como incompletos? Esta acción se puede deshacer.
                    </p>
                </div>
            </div>
        </div>
        
        <div className="flex-shrink-0 flex justify-end items-center gap-3 p-4 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold rounded-md transition text-zinc-300 bg-zinc-600 hover:bg-zinc-500 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 font-semibold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition cursor-pointer"
          >
            Reiniciar Todos
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

export default ConfirmMarkAllIncompleteModal;
