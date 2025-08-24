
import React, { useRef, useState, useEffect } from 'react';
import { Icon } from './Icon';
import { IconName, HelpTab } from '../types';

interface HelpModalProps {
  onClose: () => void;
  isDarkTheme: boolean;
  initialTab?: HelpTab;
}

const markdownHelpData = [
    { syntax: '# Título 1', example: '<h1 class="text-xl font-bold">Título 1</h1>' },
    { syntax: '## Título 2', example: '<h2 class="text-lg font-bold">Título 2</h2>' },
    { syntax: '**Texto en Negrita**', example: '<strong>Texto en Negrita</strong>' },
    { syntax: '*Texto en Cursiva*', example: '<em>Texto en Cursiva</em>' },
    { syntax: '~~Texto Tachado~~', example: '<del>Texto Tachado</del>' },
    { syntax: '> Cita en Bloque', example: '<blockquote class="border-l-4 pl-2 italic">Cita en Bloque</blockquote>' },
    { syntax: '- Elemento de Lista', example: '<ul><li class="list-disc list-inside">Elemento de Lista</li></ul>' },
    { syntax: '1. Elemento Numerado', example: '<ol><li class="list-decimal list-inside">Elemento Numerado</li></ol>' },
    { syntax: '`Código en Línea`', example: '<code>Código en Línea</code>' },
    { syntax: '```\nBloque de Código\n```', example: '<pre class="p-2 rounded"><code>Bloque de Código</code></pre>' },
    { syntax: '[Enlace](url)', example: '<a href="#" class="text-cyan-500 underline">Enlace</a>' },
    { syntax: '---', example: '<hr />' },
];

const htmlHelpData = [
    { syntax: '<pre>...</pre>', description: 'Bloque de código preformateado, preserva espacios y saltos de línea.' },
    { syntax: '<u>...</u>', description: 'Subraya el texto.' },
    { syntax: '<b>...</b>', description: 'Pone el texto en negrita (similar a **...**).' },
    { syntax: '<i>...</i>', description: 'Pone el texto en cursiva (similar a *...*).' },
    { syntax: '<s>...</s>', description: 'Tacha el texto (similar a ~~...~~).' },
];

const shortcutsData = [
    { keys: 'Ctrl + S', description: 'Guardar el proyecto actual.' },
    { keys: 'Ctrl + N', description: 'Crear un nuevo proyecto.' },
    { keys: 'Ctrl + Z / Y', description: 'Deshacer / Rehacer la última acción.' },
    { keys: 'Ctrl + C / V', description: 'Copiar / Pegar los nodos seleccionados.' },
    { keys: 'Ctrl + F', description: 'Encuadrar la vista para mostrar todos los nodos.' },
    { keys: 'Ctrl + B', description: 'Mostrar / Ocultar el explorador de proyectos.' },
    { keys: 'Supr', description: 'Eliminar los nodos seleccionados.' },
    { keys: 'Rueda del Ratón', description: 'Hacer zoom para acercar o alejar.' },
    { keys: 'Ctrl + Clic Izq. / Clic Central', description: 'Arrastrar para mover el lienzo.' },
];

const HelpModal: React.FC<HelpModalProps> = ({ onClose, isDarkTheme, initialTab = 'navigation' }) => {
  const [activeTab, setActiveTab] = useState<HelpTab>(initialTab);
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 325 });
  const [size, setSize] = useState({ width: 800, height: 650 });
  const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 });

  const onDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button, input, select, textarea, .no-drag, a, table')) return;
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
  
  const TabButton: React.FC<{ tab: HelpTab, icon: IconName, label: string }> = ({ tab, icon, label }) => (
      <button
          onClick={() => setActiveTab(tab)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-3 no-drag transition-colors border-l-4 ${
              activeTab === tab ? 'bg-zinc-700 text-zinc-100 border-cyan-500' : 'border-transparent text-zinc-400 hover:bg-zinc-700/50'
          }`}
      >
          <Icon icon={icon} className="w-5 h-5"/>
          {label}
      </button>
  );

  const HelpSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-cyan-400 border-b border-zinc-600 pb-2 mb-3">
            {title}
        </h3>
        <div className="space-y-3 text-sm text-zinc-300 prose prose-sm prose-invert max-w-none">
            {children}
        </div>
    </div>
  );

  const Kbd: React.FC<{children:React.ReactNode}> = ({children}) => (
      <kbd className="px-2 py-1 text-xs font-semibold text-zinc-200 bg-zinc-600 border border-zinc-500 rounded-md">{children}</kbd>
  )

  const renderContent = () => {
      switch(activeTab) {
          case 'navigation': return (
              <HelpSection title="Navegación por el Lienzo">
                  <p>• <b>Mover el lienzo (Pan):</b> Haz clic con el botón central del ratón (rueda) o mantén pulsada la tecla <Kbd>Ctrl</Kbd> y arrastra con el botón izquierdo.</p>
                  <p>• <b>Zoom:</b> Usa la rueda del ratón para acercar o alejar. También puedes usar los botones <Icon icon="plus" className="inline w-4 h-4" /> / <Icon icon="minus" className="inline w-4 h-4" /> en la esquina inferior derecha.</p>
                  <p>• <b>Encuadrar todo:</b> Haz clic en el botón de encuadre (<Icon icon="frame" className="inline w-4 h-4" />) o pulsa <Kbd>Ctrl+F</Kbd> para ajustar la vista y ver todos los nodos.</p>
              </HelpSection>
          );
          case 'nodes': return (
              <HelpSection title="Gestión de Nodos">
                  <p>• <b>Crear:</b> Usa las opciones de la pestaña "Insertar" en la cinta de opciones o haz clic derecho en el lienzo.</p>
                  <p>• <b>Editar:</b> Haz doble clic en un nodo para abrir el editor de contenido. Aquí puedes cambiar el título y la descripción (que soporta Markdown).</p>
                  <p>• <b>Mover:</b> Haz clic y arrastra el encabezado de un nodo. Selecciona varios con <Kbd>Shift+clic</Kbd> o arrastrando un área para moverlos juntos.</p>
                  <p>• <b>Redimensionar:</b> Selecciona un nodo y arrastra los anclajes de redimensionamiento que aparecen.</p>
                  <p>• <b>Conectar:</b> Arrastra desde un puerto de salida (derecha) de un nodo a un puerto de entrada (izquierda) de otro.</p>
                  <p>• <b>Añadir Dientes:</b> Pasa el ratón sobre un nodo y haz clic en el botón <Icon icon="add" className="inline w-4 h-4 text-sky-500" /> que aparece en la parte inferior para adjuntar código o notas.</p>
              </HelpSection>
          );
          case 'projects': return (
              <HelpSection title="Proyectos y Archivos">
                  <p>• <b>Explorador:</b> El panel izquierdo (<Kbd>Ctrl+B</Kbd>) muestra tus proyectos guardados en la base de datos del navegador. Haz clic en uno para cargarlo.</p>
                  <p>• <b>Crear:</b> Ve a "Inicio" &gt; "Nuevo Proyecto" (<Kbd>Ctrl+N</Kbd>) y elige una plantilla o un lienzo vacío.</p>
                  <p>• <b>Guardar:</b> Usa "Inicio" &gt; "Guardar Proyecto" (<Kbd>Ctrl+S</Kbd>) para guardar los cambios en la base de datos local.</p>
                  <p>• <b>Importar/Exportar:</b> Usa las opciones de la pestaña "Inicio" para trabajar con archivos <code>.json</code> locales, lo que te permite compartir tus mapas mentales o guardarlos fuera del navegador.</p>
              </HelpSection>
          );
          case 'markdown': return (
              <HelpSection title="Sintaxis Markdown">
                  <p>Usa Markdown para dar formato a las descripciones de tus nodos. Aquí tienes algunos ejemplos comunes:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse markdown-content dark-theme">
                        <thead className="sticky top-0 bg-zinc-800">
                            <tr className="border-b border-zinc-600">
                                <th className="p-2 font-semibold w-1/2">Sintaxis</th>
                                <th className="p-2 font-semibold w-1/2">Ejemplo</th>
                            </tr>
                        </thead>
                        <tbody>
                        {markdownHelpData.map(({ syntax, example }) => (
                            <tr key={syntax} className="align-top border-b border-zinc-700">
                                <td className="p-2 font-mono text-xs whitespace-pre-wrap">{syntax}</td>
                                <td className="p-2" dangerouslySetInnerHTML={{ __html: example }} />
                            </tr>
                        ))}
                        </tbody>
                    </table>
                  </div>
              </HelpSection>
          );
           case 'html': return (
              <HelpSection title="Sintaxis HTML Soportada">
                  <p>Además de Markdown, puedes usar algunas etiquetas HTML básicas en las descripciones de los nodos para un formato más específico.</p>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse markdown-content dark-theme">
                          <thead className="sticky top-0 bg-zinc-800">
                              <tr className="border-b border-zinc-600">
                                  <th className="p-2 font-semibold w-1/3">Etiqueta HTML</th>
                                  <th className="p-2 font-semibold w-2/3">Descripción</th>
                              </tr>
                          </thead>
                          <tbody>
                          {htmlHelpData.map(({ syntax, description }) => (
                              <tr key={syntax} className="align-top border-b border-zinc-700">
                                  <td className="p-2 font-mono text-xs whitespace-pre-wrap">{syntax}</td>
                                  <td className="p-2">{description}</td>
                              </tr>
                          ))}
                          </tbody>
                      </table>
                  </div>
                  <p className="mt-4 text-sm text-yellow-400 bg-yellow-900/50 p-3 rounded-md">
                      <Icon icon="warning" className="inline w-5 h-5 mr-2" />
                      <strong>Nota:</strong> El uso de HTML está limitado a estas etiquetas por seguridad y consistencia. Las etiquetas no soportadas serán ignoradas o eliminadas.
                  </p>
              </HelpSection>
          );
           case 'shortcuts': return (
              <HelpSection title="Atajos de Teclado">
                  <p>Acelera tu flujo de trabajo con estos atajos:</p>
                  <table className="w-full">
                      <tbody>
                          {shortcutsData.map(shortcut => (
                              <tr key={shortcut.keys} className="border-b border-zinc-700">
                                  <td className="p-2 font-semibold"><Kbd>{shortcut.keys}</Kbd></td>
                                  <td className="p-2">{shortcut.description}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </HelpSection>
          );
      }
  }

  return (
    <>
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
        className={`fixed z-[55] rounded-lg shadow-2xl flex flex-col pointer-events-auto ${isDarkTheme ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-zinc-900'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex-shrink-0 flex justify-between items-center py-2 px-4 border-b cursor-move ${isDarkTheme ? 'border-zinc-700' : 'border-zinc-200'}`} onMouseDown={onDragMouseDown}>
          <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-zinc-800'}`}>Centro de Ayuda</h2>
           <button onClick={onClose} className={`p-1 rounded-full transition-colors no-drag ${isDarkTheme ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100/10'}`}>
              <Icon icon="close" className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-grow flex min-h-0">
            <aside className="flex-shrink-0 w-56 p-4 border-r border-zinc-700">
                <nav className="space-y-1">
                    <TabButton tab="navigation" icon="frame" label="Navegación" />
                    <TabButton tab="nodes" icon="node-normal" label="Nodos y Dientes" />
                    <TabButton tab="projects" icon="explorer" label="Proyectos" />
                    <div className="h-px my-2 bg-zinc-700"></div>
                    <TabButton tab="markdown" icon="markdown-help" label="Sintaxis Markdown" />
                    <TabButton tab="html" icon="html" label="Sintaxis HTML" />
                    <TabButton tab="shortcuts" icon="settings" label="Atajos de Teclado" />
                </nav>
            </aside>
            <main className="flex-grow p-6 overflow-y-auto">
               {renderContent()}
            </main>
        </div>

        <div className={`flex-shrink-0 flex justify-end items-center gap-3 p-4 border-t ${isDarkTheme ? 'border-zinc-700' : 'border-zinc-200'}`}>
          <button onClick={onClose} className={`px-4 py-2 font-semibold rounded-md transition no-drag ${isDarkTheme ? 'text-white bg-cyan-600 hover:bg-cyan-700' : 'text-white bg-cyan-600 hover:bg-cyan-700'}`}>
            Entendido
          </button>
        </div>
        <div 
          onMouseDown={onResizeMouseDown}
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 no-drag ${isDarkTheme ? 'bg-zinc-500/50' : 'bg-zinc-300/50'} hover:bg-cyan-500 rounded-tl-lg`}
          title="Redimensionar"
        />
      </div>
    </>
  );
};

export default HelpModal;
