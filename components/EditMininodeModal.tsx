
import React, { useState, useEffect, useRef } from 'react';
import { Mininode } from '../types';
import { iconTypes, Icon } from './Icon';

interface EditMininodeModalProps {
  mininode: Mininode;
  onSave: (mininode: Mininode) => void;
  onClose: () => void;
}

const EditMininodeModal: React.FC<EditMininodeModalProps> = ({ mininode, onSave, onClose }) => {
    const [editedMininode, setEditedMininode] = useState<Mininode>(mininode);
    
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 });
    const [size, setSize] = useState({ width: 800, height: 600 });
    const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 });

    const onDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest('button, input, select, textarea')) return;
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
                const newHeight = Math.max(300, info.startHeight + dh);
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

    const handleSave = () => {
        const finalMininode = {
            ...editedMininode,
            title: editedMininode.title.trim() || 'untitled.txt',
            icon: editedMininode.icon || 'txt',
        };
        onSave(finalMininode);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSave();
        }
    };
    
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        const extension = newTitle.split('.').pop()?.toLowerCase();
        let newIcon = editedMininode.icon;
        if (extension && iconTypes.includes(extension as any)) {
            newIcon = extension as any;
        } else {
            newIcon = 'generic';
        }
        setEditedMininode(p => ({...p, title: newTitle, icon: newIcon}));
    };

    return (
        <>
            <div
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                }}
                className="fixed z-[55] rounded-lg shadow-2xl flex flex-col bg-zinc-800 text-zinc-200 pointer-events-auto"
                onKeyDown={handleKeyDown}
                onClick={e => e.stopPropagation()}
            >
                <div
                    className="flex-shrink-0 flex justify-between items-center py-2 px-4 border-b cursor-move border-zinc-700 bg-zinc-900/50 rounded-t-lg"
                    onMouseDown={onDragMouseDown}
                >
                    <h2 className="text-xl font-bold">Editar Diente</h2>
                    <button onClick={onClose} className="p-1 rounded-full transition-colors hover:bg-zinc-700">
                        <Icon icon="close" className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">Nombre de archivo (la extensión determina el icono)</label>
                        <input
                            id="title"
                            type="text"
                            value={editedMininode.title}
                            onChange={handleTitleChange}
                            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-500 font-mono"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col flex-grow min-h-0">
                        <label htmlFor="content" className="block text-sm font-medium text-zinc-300 mb-2">Contenido</label>
                        <textarea
                            id="content"
                            value={editedMininode.content}
                            onChange={e => setEditedMininode(p => ({ ...p, content: e.target.value }))}
                            placeholder="Escribe tu código o nota aquí..."
                            className="w-full h-full p-3 resize-none focus:outline-none transition text-sm leading-normal font-mono bg-zinc-900 text-zinc-100 placeholder-zinc-500 border border-zinc-600 rounded-md"
                        />
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end items-center gap-3 p-4 border-t border-zinc-700">
                    <span className="text-xs text-zinc-400 mr-auto">
                        Consejo: Usa Ctrl+Enter para guardar
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm font-semibold rounded-md transition text-zinc-300 bg-zinc-600 hover:bg-zinc-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
                    >
                        Guardar
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

export default EditMininodeModal;
