


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Node } from '../types';
import AdvancedNodeSettingsPanel from './AdvancedNodeSettingsModal';
import { marked } from '../markdown';
import { useMindMapStore } from '../store';
import { Icon, FileIcon } from './Icon';

interface EditNodeModalProps {
  node: Node;
  onSave: (node: Node) => void;
  onClose: () => void;
}

const ColorPicker: React.FC<{ value: string; onChange: (value: string) => void; }> = ({ value, onChange }) => (
    <div className="relative w-7 h-7">
        <input 
            type="color" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className="absolute inset-0 w-full h-full p-0 border-none rounded-md cursor-pointer opacity-0"
            title="Cambiar color del nodo"
        />
        <div 
            className="w-full h-full rounded-md border-2 border-zinc-600 hover:border-cyan-500 transition-colors" 
            style={{ backgroundColor: value }}
        />
    </div>
);


const EditNodeModal: React.FC<EditNodeModalProps> = ({ node, onSave, onClose }) => {
  const { mininodesByParentId, actions, connections, nodesById, defaultEditorMode } = useMindMapStore(state => ({
    mininodesByParentId: state.mininodesByParentId,
    actions: state.actions,
    connections: state.connections,
    nodesById: state.nodesById,
    defaultEditorMode: state.defaultEditorMode,
  }));
  const [editedNode, setEditedNode] = useState<Node>(node);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [editorView, setEditorView] = useState<'split' | 'edit' | 'preview'>(defaultEditorMode || 'split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionToSet = useRef<{start: number, end: number} | null>(null);
  const mininodes = mininodesByParentId[node.id] || [];

  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 600, y: window.innerHeight * 0.05 });
  const [size, setSize] = useState({ width: Math.min(1200, window.innerWidth * 0.9), height: window.innerHeight * 0.9 });
  const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const timeInputRef = useRef<HTMLInputElement>(null);
  
  const [advancedPanelKey, setAdvancedPanelKey] = useState(Date.now());
  const [initialAdvancedTab, setInitialAdvancedTab] = useState<'ports' | 'general' | 'icon'>('general');

  useEffect(() => {
    setEditedNode(node);
    setIsEditingTitle(false);
    setIsEditingTime(false);
  }, [node]);
  
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);
  
  useEffect(() => {
    if (isEditingTime) {
      timeInputRef.current?.focus();
      timeInputRef.current?.select();
    }
  }, [isEditingTime]);

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
              const newWidth = Math.max(500, info.startWidth + dw);
              const newHeight = Math.max(400, info.startHeight + dh);
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
      if (selectionToSet.current && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(
              selectionToSet.current.start,
              selectionToSet.current.end
          );
          selectionToSet.current = null;
      }
  }, [editedNode.description]);
  
  const handleSave = () => {
    if (editedNode.title.trim()) {
        onSave(editedNode);
    }
  };

  const handleTitleSave = () => {
    if (editedNode.title.trim() === '') {
        handleChange('title', node.title); 
    }
    setIsEditingTitle(false);
  };
  
  const handleTimeSave = () => {
    setIsEditingTime(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
    }
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedNode(prev => ({ ...prev, description: e.target.value }));
  };

  const handleChange = (field: keyof Node, value: any) => {
    setEditedNode(prev => ({...prev, [field]: value}));
  }
  
  const handleAdvancedSave = (updatedNode: Node) => {
    setEditedNode(updatedNode);
    setIsAdvancedSettingsOpen(false);
  };
  
  const renderedHtml = useMemo(() => {
      try {
          return marked.parse(editedNode.description || '') as string;
      } catch (e) {
          console.error("Markdown parsing error:", e);
          return '<p class="text-red-500">Error al procesar el markdown. Por favor, revisa la sintaxis.</p>';
      }
  }, [editedNode.description]);

  const iframeSrcDoc = useMemo(() => {
    const styles = `
      /* Base styles for iframe body */
      body {
        margin: 0;
        padding: 0.75rem; /* Equivalent to p-3 */
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
        line-height: 1.5;
        background-color: #18181b; /* zinc-900 */
        color: #e4e4e7; /* zinc-200 */
        transition: background-color 0.2s, color 0.2s;
      }
      .markdown-content h1, .markdown-content h2, .markdown-content h3 { font-weight: bold; margin-bottom: 0.5em; margin-top: 1em; }
      .markdown-content h1 { font-size: 1.5em; border-bottom: 1px solid #52525b; padding-bottom: 0.3em;}
      .markdown-content h2 { font-size: 1.25em; border-bottom: 1px solid #52525b; padding-bottom: 0.3em;}
      .markdown-content h3 { font-size: 1.1em; }
      .markdown-content p { margin-bottom: 1em; line-height: 1.6; }
      .markdown-content ul, .markdown-content ol { margin-left: 1.5em; margin-bottom: 1em; list-style-position: outside; }
      .markdown-content li { margin-bottom: 0.5em; }
      .markdown-content hr { border-top: 1px solid #52525b; margin: 1.5em 0; }
      .markdown-content code {
        background-color: #3f3f46;
        color: #a1a1aa;
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      }
      .markdown-content pre {
        background-color: #3f3f46;
        padding: 1em;
        border-radius: 6px;
        overflow-x: auto;
        position: relative;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .markdown-content pre code {
        background-color: transparent;
        padding: 0;
        color: inherit;
      }
      .markdown-content blockquote {
        border-left: 4px solid #71717a;
        padding-left: 1em;
        margin-left: 0;
        color: #a1a1aa;
        position: relative;
      }
      .markdown-content a {
        color: #67e8f9;
        text-decoration: underline;
      }
      .markdown-content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1em;
      }
      .markdown-content th, .markdown-content td {
        border: 1px solid #71717a;
        padding: 0.5em 0.75em;
      }
      .markdown-content th {
        font-weight: bold;
        background-color: #3f3f46;
      }
      .markdown-content img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1em 0;
      }
      .copy-button {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 0.375rem;
        border: 1px solid transparent;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease-in-out, background-color 0.2s, color 0.2s, border-color 0.2s;
        z-index: 10;
        background-color: #52525b; 
        color: #d4d4d8; 
        border-color: #71717a;
      }
      .markdown-content pre:hover .copy-button,
      .markdown-content blockquote:hover .copy-button {
        opacity: 1;
      }
      .copy-button svg { width: 1rem; height: 1rem; }
      .copy-button:hover { background-color: #71717a; }
      .copy-button.copied { background-color: #22c5e5; color: white; border-color: #16a34a; }

      .inline-code-wrapper {
        position: relative;
        display: inline-block;
      }
      .copy-button-inline {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 1px solid transparent;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease-in-out, background-color 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
        z-index: 10;
        transform: scale(0.8);
        background-color: #52525b; color: #d4d4d8; border-color: #71717a;
      }
      .inline-code-wrapper:hover .copy-button-inline {
        opacity: 1;
        transform: scale(1);
      }
      .copy-button-inline svg { width: 10px; height: 10px; }
      .copy-button-inline:hover { background-color: #71717a; }
      .copy-button-inline.copied { background-color: #22c5e5; color: white; border-color: #16a34a; }
      
      .code-block-wrapper {
        position: relative;
        margin-bottom: 1em;
        border-radius: 6px;
        overflow: hidden;
      }
      .code-block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5em 0.5em 0.5em 1em;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.8em;
        background-color: #52525b; color: #d4d4d8;
      }
      .code-block-header .copy-button {
        position: static;
        opacity: 1;
        background-color: transparent;
        border: none;
        color: #d4d4d8;
      }
       .code-block-header .copy-button:hover { background-color: #71717a; }
      .code-block-wrapper pre {
        margin: 0;
        border-radius: 0 0 6px 6px;
        border-top: 1px solid #71717a;
      }
    `;

    const script = `
      (() => {
        const copyIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3z"/></svg>';
        const checkIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/></svg>';
        
        const addCopyButtonToBlock = (element) => {
            const button = document.createElement('button');
            button.className = 'copy-button';
            button.innerHTML = \`\${copyIcon}<span>Copiar</span>\`;

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const codeEl = element.querySelector('code');
                let contentToCopy;
                if (codeEl) {
                    contentToCopy = codeEl.innerText;
                } else {
                    // For blockquote, clone and remove button to get clean text
                    const clone = element.cloneNode(true);
                    clone.querySelector('.copy-button')?.remove();
                    contentToCopy = clone.innerText;
                }
                navigator.clipboard.writeText(contentToCopy).then(() => {
                    button.innerHTML = \`\${checkIcon}<span>¡Copiado!</span>\`;
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.innerHTML = \`\${copyIcon}<span>Copiar</span>\`;
                        button.classList.remove('copied');
                    }, 2000);
                });
            });

            if (element.tagName === 'PRE' && element.parentElement?.classList.contains('code-block-wrapper')) {
                const header = element.parentElement.querySelector('.code-block-header');
                if (header && !header.querySelector('.copy-button')) {
                    header.appendChild(button);
                }
            } else {
                 if (!element.querySelector('.copy-button')) {
                    element.appendChild(button);
                 }
            }
        };

        document.querySelectorAll('pre, blockquote').forEach(el => addCopyButtonToBlock(el));

        const addCopyButtonToInline = (codeEl) => {
            if (codeEl.dataset.copyButtonAdded || codeEl.closest('pre')) return;
            const parent = codeEl.parentNode;
            if (!parent) return;

            const wrapper = document.createElement('span');
            wrapper.className = 'inline-code-wrapper';
            
            parent.replaceChild(wrapper, codeEl);
            wrapper.appendChild(codeEl);

            const button = document.createElement('button');
            button.className = 'copy-button-inline';
            button.title = 'Copiar código';

            const inlineCopyIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3z"/></svg>';
            const inlineCheckIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/></svg>';
            button.innerHTML = inlineCopyIcon;
            
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(codeEl.innerText).then(() => {
                    button.innerHTML = inlineCheckIcon;
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.innerHTML = inlineCopyIcon;
                        button.classList.remove('copied');
                    }, 2000);
                });
            });

            wrapper.appendChild(button);
            codeEl.dataset.copyButtonAdded = 'true';
        };

        document.querySelectorAll('code').forEach(el => addCopyButtonToInline(el));
      })();
    `;

    return `
      <!DOCTYPE html>
      <html class="dark">
      <head>
        <meta charset="UTF-8">
        <style>${styles}</style>
      </head>
      <body>
        <div class="markdown-content dark-theme">${renderedHtml}</div>
        <script>${script}</script>
      </body>
      </html>
    `;
  }, [renderedHtml]);

  const EditorViewButton: React.FC<{view: 'split' | 'edit' | 'preview', label: string}> = ({ view, label }) => (
    <button
      type="button"
      onClick={() => setEditorView(view)}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${editorView === view ? 'bg-zinc-600 text-white' : 'hover:bg-zinc-700'}`}
    >
      {label}
    </button>
  );
  
  const FormattingToolbarButton: React.FC<{onClick: () => void, title: string, children: React.ReactNode}> = ({ onClick, title, children }) => (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="p-2 rounded-md transition-colors hover:bg-zinc-700 text-zinc-400"
    >
      {children}
    </button>
  );
  
  const applyFormat = (prefix: string, suffix: string = '', placeholder: string = 'texto') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const leadingSpace = textToInsert.match(/^\s*/)?.[0] || '';
      const trailingSpace = textToInsert.match(/\s*$/)?.[0] || '';
      const trimmedText = textToInsert.substring(leadingSpace.length, textToInsert.length - trailingSpace.length);
      
      if (!trimmedText && !selectedText) { // No selection, insert placeholder
          const newText = 
              textarea.value.substring(0, start) +
              prefix + placeholder + suffix +
              textarea.value.substring(end);
          setEditedNode(prev => ({ ...prev, description: newText }));
          const newCursorStart = start + prefix.length;
          const newCursorEnd = newCursorStart + placeholder.length;
          selectionToSet.current = { start: newCursorStart, end: newCursorEnd };
          return;
      }
      
      const newText = 
          textarea.value.substring(0, start) +
          leadingSpace +
          prefix +
          trimmedText +
          suffix +
          trailingSpace +
          textarea.value.substring(end);

      setEditedNode(prev => ({ ...prev, description: newText }));

      const newCursorStart = start + leadingSpace.length + prefix.length;
      const newCursorEnd = newCursorStart + trimmedText.length;
      selectionToSet.current = { start: newCursorStart, end: newCursorEnd };
  };

  const applyListFormat = (marker: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    // Find the start and end of the lines that are selected
    let lineStart = text.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = text.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = text.length;

    const selectedLinesText = text.substring(lineStart, lineEnd);
    const lines = selectedLinesText.split('\n');

    const transformedLines = lines.map((line, index) => {
        if (line.trim() === '') return line;
        if (marker === '1. ') {
            return `${index + 1}. ${line.replace(/^\d+\.\s*/, '')}`;
        }
        return `${marker}${line.replace(/^[\*\-]\s*/, '')}`;
    });
    
    const newText = text.substring(0, lineStart) + transformedLines.join('\n') + text.substring(lineEnd);
    setEditedNode(prev => ({ ...prev, description: newText }));
  };

  const insertTable = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const tableMarkdown = `\n| Cabecera 1 | Cabecera 2 |\n| :--- | :--- |\n| Celda 1.1  | Celda 1.2  |\n| Celda 2.1  | Celda 2.2  |\n`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
        textarea.value.substring(0, start) +
        tableMarkdown +
        textarea.value.substring(end);

    setEditedNode(prev => ({ ...prev, description: newText }));

    const newCursorPos = start + tableMarkdown.length;
    selectionToSet.current = { start: newCursorPos, end: newCursorPos };
  };


  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
          switch (e.key) {
              case 'b':
                  e.preventDefault();
                  applyFormat('**', '**', 'negrita');
                  break;
              case 'i':
                  e.preventDefault();
                  applyFormat('_', '_', 'cursiva');
                  break;
              case 'u':
                   e.preventDefault();
                   applyFormat('<u>', '</u>', 'subrayado');
                   break;
          }
      }
  };

  const [previousNodes, nextNodes] = useMemo(() => {
    const prev: Node[] = [];
    const next: Node[] = [];
    for (const conn of connections) {
        if (conn.toNode === node.id) {
            const fromNode = nodesById[conn.fromNode];
            if (fromNode) prev.push(fromNode);
        }
        if (conn.fromNode === node.id) {
            const toNode = nodesById[conn.toNode];
            if (toNode) next.push(toNode);
        }
    }
    const uniquePrev = Array.from(new Map(prev.map(item => [item.id, item])).values());
    const uniqueNext = Array.from(new Map(next.map(item => [item.id, item])).values());
    return [uniquePrev, uniqueNext];
  }, [node.id, connections, nodesById]);

  const navigateToNode = (targetNode: Node) => {
      actions.saveNodeState(editedNode);
      actions.replaceActiveModal({ type: 'edit', node: targetNode });
  };
  
  const handleOpenHelp = () => {
    actions.saveNodeState(editedNode);
    actions.openModal({ type: 'help', initialTab: 'markdown' });
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
        <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-10 flex flex-col-reverse gap-2">
          {previousNodes.map(prevNode => (
            <button 
              key={prevNode.id}
              onClick={() => navigateToNode(prevNode)} 
              title={`Navegar a: ${prevNode.title}`}
              className="p-2 rounded-full bg-zinc-700/80 backdrop-blur-sm transition-all text-zinc-300 hover:bg-zinc-600 hover:scale-110"
            >
                <Icon icon="chevron-left" className="w-6 h-6 text-cyan-400" />
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 z-10 flex flex-col-reverse gap-2">
            {nextNodes.map(nextNode => (
                <button 
                    key={nextNode.id}
                    onClick={() => navigateToNode(nextNode)}
                    title={`Navegar a: ${nextNode.title}`}
                    className="p-2 rounded-full bg-zinc-700/80 backdrop-blur-sm transition-all text-zinc-300 hover:bg-zinc-600 hover:scale-110"
                >
                    <Icon icon="chevron-right" className={`w-6 h-6 ${editedNode.isComplete ? 'text-green-500' : 'text-red-500'}`} />
                </button>
            ))}
        </div>

          <div 
            className="flex-shrink-0 flex justify-between items-center py-2 pl-4 pr-2 border-b cursor-move border-zinc-700 bg-zinc-900/50 rounded-t-lg"
            onMouseDown={onDragMouseDown}
          >
             <div className="flex items-center gap-3 flex-grow min-w-0">
                 {editedNode.icon && (
                    <div
                      onDoubleClick={() => { setInitialAdvancedTab('icon'); setAdvancedPanelKey(Date.now()); setIsAdvancedSettingsOpen(true); }}
                      className="p-1 rounded-md hover:bg-zinc-700 cursor-pointer"
                      title="Doble clic para cambiar icono"
                    >
                      <Icon icon={editedNode.icon} className="w-6 h-6 flex-shrink-0" style={{ color: editedNode.iconColor }} />
                    </div>
                  )}
                {isEditingTitle ? (
                  <input
                      ref={titleInputRef}
                      id="title"
                      type="text"
                      value={editedNode.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleSave();
                          if (e.key === 'Escape') setIsEditingTitle(false);
                      }}
                      className="flex-grow p-1 border rounded-md ring-2 ring-cyan-500 border-cyan-500 transition text-lg font-bold bg-zinc-900 border-zinc-600 text-zinc-100 placeholder-zinc-500"
                      placeholder="Título del Nodo"
                  />
                ) : (
                    <h2
                        onDoubleClick={() => setIsEditingTitle(true)}
                        className="flex-grow p-1 text-lg font-bold text-zinc-100 truncate cursor-text"
                        title="Doble clic para editar"
                    >
                        {editedNode.title}
                    </h2>
                )}
            </div>
             <div className="flex items-center gap-2">
                {isEditingTime ? (
                    <div className="flex items-center gap-1">
                        <input
                            ref={timeInputRef}
                            type="number"
                            value={editedNode.time || 0}
                            onChange={(e) => handleChange('time', parseInt(e.target.value, 10) || 0)}
                            onBlur={handleTimeSave}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleTimeSave(); if (e.key === 'Escape') setIsEditingTime(false); }}
                            className="w-20 p-1 text-right border rounded-md ring-2 ring-green-500 border-green-500 transition font-semibold bg-zinc-900 border-zinc-600 text-green-400"
                        />
                         <span className="text-sm text-green-400">min</span>
                    </div>
                ) : (
                    <div 
                        onDoubleClick={() => setIsEditingTime(true)} 
                        className="p-1 cursor-text text-green-400 flex items-center gap-1"
                        title="Tiempo estimado (doble clic para editar)"
                    >
                        <Icon icon="time" className="w-5 h-5"/>
                        <span className="font-semibold">{editedNode.time || 0} min</span>
                    </div>
                )}
                <button onClick={onClose} className="p-1 rounded-full transition-colors hover:bg-zinc-700 ml-2">
                    <Icon icon="close" className="w-6 h-6" />
                </button>
             </div>
          </div>

          <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
              {/* Markdown Description Editor */}
              <div className="flex flex-col flex-grow min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-300">Descripción</label>
                    <button
                      type="button"
                      onClick={handleOpenHelp}
                      className="p-1 rounded-full transition-colors text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                      aria-label="Ayuda de Markdown"
                      title="Ayuda de Markdown"
                    >
                      <Icon icon="markdown-help" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                        <ColorPicker value={editedNode.color} onChange={v => handleChange('color', v)} />
                         <div className="flex items-center gap-0.5" title={`Dificultad: ${editedNode.difficulty} de 10`}>
                            {[...Array(10)].map((_, i) => {
                                const difficultyValue = i + 1;
                                return (
                                    <button
                                        key={difficultyValue}
                                        onClick={() => handleChange('difficulty', difficultyValue)}
                                        className={`p-0.5 rounded-full transition-colors text-zinc-600 hover:text-amber-400 ${difficultyValue <= (editedNode.difficulty || 0) ? '!text-amber-400' : ''}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900/50">
                          <EditorViewButton view="edit" label="Editar" />
                          <EditorViewButton view="split" label="Dividir" />
                          <EditorViewButton view="preview" label="Vista Previa" />
                        </div>
                  </div>
                </div>
                
                {/* Formatting Toolbar */}
                <div className="flex items-center flex-wrap gap-1 p-1 rounded-t-md border-b-0 border bg-zinc-900/50 border-zinc-600">
                  <FormattingToolbarButton onClick={() => applyFormat('**', '**', 'negrita')} title="Negrita (Ctrl+B)">
                     <Icon icon="bold" className="w-4 h-4" />
                  </FormattingToolbarButton>
                  <FormattingToolbarButton onClick={() => applyFormat('_', '_', 'cursiva')} title="Cursiva (Ctrl+I)">
                    <Icon icon="italic" className="w-4 h-4" />
                  </FormattingToolbarButton>
                  <FormattingToolbarButton onClick={() => applyFormat('~~', '~~', 'tachado')} title="Tachado">
                    <Icon icon="strikethrough" className="w-4 h-4" />
                  </FormattingToolbarButton>
                  <FormattingToolbarButton onClick={() => applyFormat('<u>', '</u>', 'subrayado')} title="Subrayado (Ctrl+U)">
                    <Icon icon="underline" className="w-4 h-4" />
                  </FormattingToolbarButton>
                  <div className="w-px h-5 mx-1 bg-zinc-600"></div>
                   <FormattingToolbarButton onClick={() => applyFormat('> ', '', 'cita')} title="Cita">
                    <Icon icon="blockquote" className="w-4 h-4" />
                  </FormattingToolbarButton>
                   <FormattingToolbarButton onClick={() => applyFormat('[', '](https://)', 'enlace')} title="Enlace">
                    <Icon icon="link" className="w-4 h-4" />
                  </FormattingToolbarButton>
                  <div className="w-px h-5 mx-1 bg-zinc-600"></div>
                  <FormattingToolbarButton onClick={() => applyListFormat('* ')} title="Lista">
                    <Icon icon="list-ul" className="w-4 h-4" />
                  </FormattingToolbarButton>
                   <FormattingToolbarButton onClick={() => applyListFormat('1. ')} title="Lista Numerada">
                    <Icon icon="list-ol" className="w-4 h-4" />
                  </FormattingToolbarButton>
                   <FormattingToolbarButton onClick={insertTable} title="Insertar Tabla">
                    <Icon icon="table" className="w-4 h-4" />
                  </FormattingToolbarButton>
                  <div className="w-px h-5 mx-1 bg-zinc-600"></div>
                  <FormattingToolbarButton onClick={() => applyFormat('`', '`', 'código')} title="Código en línea">
                    <Icon icon="code-block" className="w-4 h-4" />
                  </FormattingToolbarButton>
                   <FormattingToolbarButton onClick={() => applyFormat('\n---\n', '')} title="Línea Horizontal">
                    <Icon icon="hr" className="w-4 h-4" />
                  </FormattingToolbarButton>
                  <FormattingToolbarButton onClick={() => applyFormat('<pre>\n', '\n</pre>', 'código de bloque')} title="Bloque de Código Preformateado">
                    <Icon icon="terminal" className="w-4 h-4" />
                  </FormattingToolbarButton>
                </div>

                <div className="flex flex-grow min-h-0 border-x border-b rounded-b-md overflow-hidden border-zinc-600">
                  {(editorView === 'edit' || editorView === 'split') && (
                      <textarea
                          id="description"
                          ref={textareaRef}
                          value={editedNode.description}
                          onChange={handleDescriptionChange}
                          onKeyDown={handleTextareaKeyDown}
                          placeholder="Añade detalles... # para títulos, * para listas, ``` para bloques de código."
                          className={`w-full h-full p-3 resize-none focus:outline-none transition text-sm leading-normal font-mono ${editorView === 'split' ? 'w-1/2' : 'w-full'} bg-zinc-900 text-zinc-100 placeholder-zinc-500`}
                      />
                  )}
                  {(editorView === 'preview' || editorView === 'split') && (
                    <div
                      className={`
                        w-full h-full
                        ${editorView === 'split' ? 'w-1/2' : 'w-full'}
                        ${editorView === 'split' && 'border-l border-zinc-600'}
                        bg-zinc-900/50
                      `}
                    >
                      <iframe
                          key={editedNode.description}
                          srcDoc={iframeSrcDoc}
                          title="Vista Previa de Markdown"
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  )}
                </div>
              </div>
          </div>

          <div className="flex-shrink-0 flex justify-between items-center gap-3 p-4 border-t border-zinc-700">
              <div className="flex items-center gap-2 overflow-x-auto min-w-0">
                <button
                    type="button"
                    onClick={() => { setInitialAdvancedTab('general'); setAdvancedPanelKey(Date.now()); setIsAdvancedSettingsOpen(true); }}
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold rounded-md transition flex items-center gap-2 text-zinc-300 bg-zinc-600 hover:bg-zinc-500"
                >
                    <Icon icon="settings" className="h-4 w-4" />
                    Ajustes
                </button>
                <button
                    type="button"
                    onClick={() => actions.downloadNodeAsZip(editedNode.id)}
                    title="Descargar el nodo y sus 'dientes' como un archivo ZIP."
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold rounded-md transition flex items-center gap-2 text-zinc-300 bg-zinc-600 hover:bg-zinc-500"
                >
                    <Icon icon="download" className="h-4 w-4" />
                    Descargar ZIP
                </button>
                {mininodes.length > 0 && <div className="w-px h-6 bg-zinc-600 flex-shrink-0" />}
                {mininodes.map(mn => (
                    <div key={mn.id} className="flex-shrink-0 flex items-center gap-1 p-1 rounded-md bg-zinc-700/60" title={mn.title}>
                        <FileIcon icon={mn.icon} className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate text-xs flex-grow text-zinc-300 max-w-24">{mn.title}</span>
                        <button onClick={() => actions.openModal({ type: 'editMininode', mininode: mn })} title="Editar" className="p-1.5 rounded hover:bg-zinc-600 text-zinc-300"><Icon icon="settings" className="w-4 h-4" /></button>
                        <button onClick={() => actions.exportMininodeContent(mn.id)} title="Descargar" className="p-1.5 rounded hover:bg-zinc-600 text-zinc-300"><Icon icon="download" className="w-4 h-4" /></button>
                        <button onClick={() => actions.requestDeleteMininode(mn.id)} title="Eliminar" className="p-1.5 rounded hover:bg-red-500/20 text-red-400"><Icon icon="delete" className="w-4 h-4" /></button>
                    </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-zinc-400">
                      Consejo: Usa Ctrl+Enter para guardar y cerrar
                  </span>
                  <button
                      type="button"
                      onClick={() => actions.saveNodeState(editedNode)}
                      className="px-3 py-1.5 text-sm font-semibold rounded-md transition text-zinc-100 bg-cyan-700 hover:bg-cyan-600"
                  >
                      Guardar
                  </button>
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
                      Guardar y Cerrar
                  </button>
              </div>
          </div>

          {isAdvancedSettingsOpen && (
            <AdvancedNodeSettingsPanel
              key={advancedPanelKey}
              initialTab={initialAdvancedTab}
              node={editedNode}
              onSave={handleAdvancedSave}
              onClose={() => setIsAdvancedSettingsOpen(false)}
            />
          )}

          <div 
            onMouseDown={onResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 bg-zinc-500/50 hover:bg-cyan-500 rounded-tl-lg"
            title="Redimensionar"
          />
        </div>
    </>
  );
};

export default EditNodeModal;