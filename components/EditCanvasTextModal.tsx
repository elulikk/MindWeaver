
import React, { useState, useEffect, useRef } from 'react';
import { CanvasObjectText } from '../types';
import { useMindMapStore } from '../store';
import { Icon } from './Icon';

interface EditCanvasTextModalProps {
  objectId: string;
}

const EditCanvasTextModal: React.FC<EditCanvasTextModalProps> = ({ objectId }) => {
  const { actions, canvasObjectsById } = useMindMapStore(state => ({
    actions: state.actions,
    canvasObjectsById: state.canvasObjectsById
  }));

  const object = canvasObjectsById[objectId] as CanvasObjectText | undefined;
  
  const [text, setText] = useState(object?.text || '');
  const [textAlign, setTextAlign] = useState(object?.textAlign || 'left');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (object) {
      setText(object.text);
      setTextAlign(object.textAlign || 'left');
    }
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, [object]);

  if (!object) {
    return null; // Should not happen if opened correctly
  }

  const handleSave = () => {
    const updatedObject: CanvasObjectText = {
        ...object,
        text: text,
        textAlign: textAlign,
        // crude auto-sizing, can be improved
        height: Math.max(20, Math.ceil(text.length / (object.width/8)) * 20),
    };
    actions.updateCanvasObject(updatedObject);
    actions.closeModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        handleSave();
    }
    if (e.key === 'Escape') {
      actions.closeModal();
    }
  };

  const applyFormat = (tag: 'b' | 'i' | 'u') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);

    const newText = 
        text.substring(0, start) +
        `<${tag}>` +
        selectedText +
        `</${tag}>` +
        text.substring(end);
    
    setText(newText);
  }

  return (
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[80] rounded-lg shadow-2xl flex flex-col bg-zinc-800 text-zinc-200"
      onKeyDown={handleKeyDown}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-4 border-b border-zinc-700">
        <h2 className="text-lg font-semibold">Editar Texto</h2>
        <button onClick={actions.closeModal} className="p-1.5 rounded-full hover:bg-zinc-700">
          <Icon icon="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 space-y-2">
         <div className="flex items-center gap-1 p-1 rounded-md bg-zinc-900 border border-zinc-700">
            <button onClick={() => applyFormat('b')} title="Negrita" className="p-2 rounded hover:bg-zinc-700"><Icon icon="bold" className="w-4 h-4" /></button>
            <button onClick={() => applyFormat('i')} title="Cursiva" className="p-2 rounded hover:bg-zinc-700"><Icon icon="italic" className="w-4 h-4" /></button>
            <button onClick={() => applyFormat('u')} title="Subrayado" className="p-2 rounded hover:bg-zinc-700"><Icon icon="underline" className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-zinc-600 mx-1" />
            <button onClick={() => setTextAlign('left')} title="Alinear Izquierda" className={`p-2 rounded ${textAlign === 'left' ? 'bg-zinc-700' : 'hover:bg-zinc-700'}`}><Icon icon="align-left" className="w-4 h-4" /></button>
            <button onClick={() => setTextAlign('center')} title="Alinear Centro" className={`p-2 rounded ${textAlign === 'center' ? 'bg-zinc-700' : 'hover:bg-zinc-700'}`}><Icon icon="align-center" className="w-4 h-4" /></button>
            <button onClick={() => setTextAlign('right')} title="Alinear Derecha" className={`p-2 rounded ${textAlign === 'right' ? 'bg-zinc-700' : 'hover:bg-zinc-700'}`}><Icon icon="align-right" className="w-4 h-4" /></button>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-24 p-2 border rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-500"
          placeholder="Escribe aquí... puedes usar <b>, <i>, <u> tags."
        />
      </div>
      <div className="flex justify-end items-center gap-3 p-4 border-t border-zinc-700">
        <button
          onClick={actions.closeModal}
          className="px-4 py-2 font-semibold rounded-md transition text-zinc-300 bg-zinc-600 hover:bg-zinc-500"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default EditCanvasTextModal;