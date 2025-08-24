

import React, { useRef, useState, useEffect } from 'react';
import { Icon } from './Icon';

interface InfoModalProps {
  onClose: () => void;
  isDarkTheme: boolean;
  version: string;
  schemaVersion: number;
}

type ActiveTab = 'changelog' | 'about';

const changelogData = [
    {
        version: '1.15.3',
        date: new Date('2024-09-09T10:00:00'),
        changes: [
            { type: 'feat', text: "Añadida la capacidad de arrastrar y soltar 'dientes' (mininodos) entre nodos para una reorganización rápida." },
            { type: 'style', text: "Restaurado el recuadro de selección amarillo y punteado al seleccionar nodos para una mejor claridad visual." },
        ],
    },
    {
        version: '1.15.2',
        date: new Date('2024-09-08T10:00:00'),
        changes: [
            { type: 'refactor', text: 'Reconstruido el algoritmo de exportación a HTML. Ahora se basa 100% en el flujo (orden de puertos y `orderIndex`), eliminando por completo la dependencia de la posición en el lienzo.' },
            { type: 'fix', text: 'Corregido un error que hacía invisible el borde animado de los nodos seleccionados.' },
            { type: 'style', text: 'Actualizado el icono del botón "Enfoque" a un nuevo diseño más claro.' },
            { type: 'fix', text: 'Corregido el diseño del menú contextual para que el texto de los botones nunca se divida en varias líneas.' },
            { type: 'fix', text: 'Solucionado un problema en el editor de Markdown que añadía espacios extra al aplicar formatos como negrita o cursiva.' },
        ],
    },
    {
        version: '1.15.1',
        date: new Date('2024-09-07T12:00:00'),
        changes: [
            { type: 'feat', text: 'Mejorada la exportación a HTML para que el orden de los nodos siga el flujo visual del grafo (de arriba abajo, de izquierda a derecha), priorizando la lógica de dependencias sobre el `orderIndex`.' },
            { type: 'ux', text: 'Eliminado el recuadro de selección punteado del lienzo para una interfaz más limpia; la selección ahora se indica únicamente por el borde animado del nodo.' },
            { type: 'refactor', text: 'Simplificadas las opciones de exportación, eliminando los formatos XML y CSV.' },
            { type: 'ux', text: 'Eliminado el botón "Log" del lienzo. El panel de registro ahora es accesible mediante el atajo de teclado Ctrl+L.' },
            { type: 'ux', text: 'Renombrado el botón "Reiniciar" de la cinta de opciones a "Limpiar" y actualizado su icono a uno más representativo.' },
            { type: 'style', text: 'Actualizado el icono del botón "Abrir Local" para una mejor identificación.' },
        ],
    },
     {
        version: '1.15.0',
        date: new Date('2024-09-06T10:00:00'),
        changes: [
            { type: 'feat', text: "Añadida la propiedad 'Tiempo' (en minutos) a los nodos, editable en la ventana de edición." },
            { type: 'feat', text: 'Añadida la opción de menú contextual "Reorganizar orden de la selección" para reordenar solo los nodos seleccionados.' },
            { type: 'ux', text: 'Movido el botón "Modo Enfoque" a un overlay en el lienzo para un acceso más rápido.' },
            { type: 'ux', text: 'Reorganizada la cinta de opciones: "Exportar" a la derecha, "Reorganizar Orden" a la pestaña Inicio.' },
            { type: 'style', text: 'Los botones de deshacer y rehacer ahora son de color azul para una mejor identificación.' },
            { type: 'style', text: 'Mejorada la visualización de la selección de nodos con un borde animado para evitar confusiones con el resaltado de nodos activos.' },
            { type: 'fix', text: 'La exportación a HTML ahora prioriza el flujo del grafo, asegurando que los nodos de lógica (Y/O) aparezcan después de sus entradas, independientemente del `orderIndex`.' },
            { type: 'ux', text: 'Movido el selector de dificultad en la ventana de edición de nodos para estar junto al selector de color.' },
        ],
    },
    {
        version: '1.14.0',
        date: new Date('2024-09-05T10:00:00'),
        changes: [
            { type: 'feat', text: 'Añadido el botón "Reorganizar Orden" en la pestaña Herramientas para reasignar automáticamente el "Índice de Orden" de los nodos según el flujo lógico del mapa.' },
            { type: 'refactor', text: 'Eliminada la opción de exportación "HTML (Pro)" para simplificar la interfaz. La exportación HTML estándar ahora utiliza el "Índice de Orden" de los nodos.' },
        ],
    },
    {
        version: '1.13.0',
        date: new Date('2024-09-04T10:00:00'),
        changes: [
            { type: 'feat', text: 'Mejorado el "Modo de Dibujo": ahora bloquea todas las interacciones del mapa mental (puertos, conexiones, anclaje, completado) para un enfoque total en el dibujo.' },
            { type: 'feat', text: 'Añadida la opción "Exportar selección a HTML" al menú contextual del nodo.' },
            { type: 'feat', text: 'Introducido un "Índice de Orden" único para los nodos, editable en los Ajustes Avanzados.' },
            { type: 'feat', text: 'La exportación a HTML ahora utiliza el "Índice de Orden" para una secuencia de nodos personalizada, reemplazando el ordenamiento topológico.' },
            { type: 'ux', text: 'Implementada la navegación entre nodos con Tab / Shift+Tab, siguiendo el "Índice de Orden" personalizado.' },
        ],
    },
    {
        version: '1.12.6',
        date: new Date('2024-09-03T10:00:00'),
        changes: [
            { type: 'feat', text: 'El modo de dibujo ahora bloquea la edición de nodos para prevenir interacciones accidentales.' },
            { type: 'fix', text: 'Corregido un error que causaba la deselección de objetos de dibujo al intentar redimensionarlos.' },
            { type: 'fix', text: 'El botón de copiar en los bloques de código del editor de nodos ya no incluye la palabra "Copiar" en el texto copiado.' },
            { type: 'fix', text: 'Corregido un error visual que hacía que los interruptores de los nodos se renderizaran como casillas de verificación nativas.' },
            { type: 'feat', text: 'Añadidos nuevos iconos para "código", "python" y "script" a la biblioteca de iconos.' },
        ],
    },
    {
        version: '1.12.5',
        date: new Date('2024-09-02T10:00:00'),
        changes: [
            { type: 'feat', text: 'Añadido "Modo Enfoque" a la pestaña Inicio para atenuar nodos completados/no disponibles y resaltar los nodos activos.' },
            { type: 'ux', text: 'La navegación entre nodos en el editor ahora guarda automáticamente los cambios para prevenir la pérdida de datos.' },
            { type: 'style', text: 'Las flechas de navegación de nodos en el editor ahora están coloreadas según su tipo (entrada/salida) y estado.' },
            { type: 'style', text: 'Actualizado el icono de "Guardar Proyecto" con un nuevo diseño más detallado.' },
        ],
    },
    {
        version: '1.12.4',
        date: new Date('2024-09-01T10:00:00'),
        changes: [
            { type: 'fix', text: 'Corregidos errores de compilación de TypeScript causados por el uso de sintaxis JSX en archivos .ts para la definición de iconos.' },
            { type: 'refactor', text: 'Reemplazada la sintaxis JSX por llamadas a `React.createElement` en los archivos de definición de iconos para garantizar la compatibilidad con el compilador.' },
            { type: 'fix', text: 'Solucionados errores de tipo derivados en los modales de selección de iconos, que eran un efecto secundario de los errores de compilación.' },
        ],
    },
     {
        version: '1.12.3',
        date: new Date('2024-08-31T10:00:00'),
        changes: [
            { type: 'feat', text: 'Introducidos los "Enjambres": convierte rectángulos en contenedores que arrastran los nodos que contienen.' },
            { type: 'feat', text: 'Paginado el historial de cambios para una mejor navegación.' },
            { type: 'fix', text: 'Corregida la selección y arrastre de objetos de dibujo; ya no activa el cuadro de selección del lienzo.' },
        ],
    },
    {
        version: '1.12.2',
        date: new Date('2024-08-30T10:00:00'),
        changes: [
            { type: 'feat', text: '¡Manipulación de Objetos! Ahora se pueden mover y redimensionar todas las formas, líneas y textos en el modo "Draw Mode".' },
            { type: 'feat', text: 'Añadida la sección de "Propiedades" en la pestaña de Dibujo para editar los objetos seleccionados.' },
            { type: 'feat', text: 'Implementadas opciones para cambiar el color de relleno, color de borde y grosor del borde de los objetos.' },
            { type: 'ux', text: 'El cursor del ratón ahora cambia contextualmente para indicar las acciones de mover y redimensionar sobre los objetos de dibujo.' },
        ],
    },
    {
        version: '1.12.0',
        date: new Date('2024-08-29T10:00:00'),
        changes: [
            { type: 'feat', text: '¡Herramientas de Dibujo! Ahora se pueden añadir formas (rectángulos, elipses), líneas y cuadros de texto directamente en el lienzo desde la pestaña "Insertar".' },
            { type: 'ux', text: 'El cursor del ratón ahora cambia a crosshair cuando un modo de dibujo está activo.' },
            { type: 'style', text: 'Añadidos nuevos iconos para las herramientas de dibujo en la cinta de opciones.' },
        ],
    },
    {
        version: '1.11.0',
        date: new Date('2024-08-28T10:00:00'),
        changes: [
            { type: 'style', text: 'Mejorados los iconos de conexión inalámbrica: ahora son más grandes, convexos y rotan para apuntar entre nodos.' },
            { type: 'fix', text: 'Corregida la forma de los iconos inalámbricos para que sean convexos, en lugar de cóncavos.' },
        ],
    },
    {
        version: '1.10.1',
        date: new Date('2024-08-27T12:00:00'),
        changes: [
            { type: 'feat', text: 'Añadido un modo "Wi-Fi" por conexión, accesible desde el menú contextual de la conexión.' },
            { type: 'refactor', text: 'Eliminada la opción global de modo inalámbrico de los Ajustes.' },
            { type: 'style', text: 'Ajustado el tamaño y la posición de los iconos Wi-Fi para un aspecto más limpio.' },
            { type: 'fix', text: 'Restaurada la pestaña "Sintaxis HTML" que faltaba en la ventana de Ayuda.' },
        ],
    },
    {
        version: '1.9.7',
        date: new Date('2024-08-26T10:00:00'),
        changes: [
            { type: 'style', text: 'Mejorado el resaltado visual de los nodos activos con un brillo de color cian más intenso y un borde más visible.' },
            { type: 'chore', text: 'Actualizado el historial de cambios con las últimas mejoras y correcciones.' },
        ],
    },
    {
        version: '1.9.6',
        date: new Date('2024-08-25T10:00:00'),
        changes: [
            { type: 'fix', text: 'Corregido un error visual donde todas las puntas de flecha de las conexiones adoptaban el mismo color al activarse una de ellas.' },
        ],
    },
    {
        version: '1.9.5',
        date: new Date('2024-08-24T10:00:00'),
        changes: [
            { type: 'fix', text: 'Solucionado un problema en el editor de Markdown que provocaba la pérdida de foco y selección de texto al usar los botones de formato.' },
        ],
    },
    {
        version: '1.9.4',
        date: new Date('2024-08-23T10:00:00'),
        changes: [
            { type: 'feat', text: 'Añadido un botón de bloque preformateado (`<pre>`) a la barra de herramientas de Markdown.' },
            { type: 'refactor', text: 'Simplificado el renderizador de Markdown eliminando el soporte para bloques de código con título.' },
            { type: 'fix', text: 'La vista previa del editor de Markdown ahora se actualiza correctamente en tiempo real al aplicar formatos.' },
            { type: 'style', text: 'Reemplazado el icono de PostgreSQL por una versión de texto "pSQL" más ligera y legible.' },
        ],
    },
    {
        version: '1.9.3',
        date: new Date('2024-08-22T12:00:00'),
        changes: [
            { type: 'style', text: 'Los nodos de inicio (con lógica AND y sin conexiones entrantes) ahora se resaltan con un brillo para identificarlos fácilmente.' },
            { type: 'style', text: 'Se oculta el icono de lógica (ej. AND/OR) en la cabecera del nodo para evitar redundancia visual.' },
            { type: 'fix', text: 'Corregida la visibilidad de los iconos de "añadir nodo" y "eliminar" en las líneas de conexión.' },
        ],
    },
    {
        version: '1.9.2',
        date: new Date('2024-08-22T10:00:00'),
        changes: [
            { type: 'feat', text: 'Al arrastrar una conexión al lienzo vacío, ahora aparece un menú para crear y conectar un nuevo nodo.' },
            { type: 'feat', text: 'La longitud de la síntesis de nodos generada por IA ahora se adapta a la longitud de la descripción del nodo (1-4 líneas).' },
            { type: 'feat', text: 'Añadida una opción de autoguardado cada 5 minutos en los Ajustes.' },
            { type: 'style', text: 'Cambiado el color de los botones de "Guardar" de cian a verde para una mejor indicación visual.' },
            { type: 'ux', text: 'Ahora se puede cancelar una operación de conexión haciendo clic derecho en el lienzo para cerrar el menú.' },
        ],
    },
    {
        version: '1.9.1',
        date: new Date('2024-08-21T10:00:00'),
        changes: [
            { type: 'fix', text: 'El icono del proyecto ahora se guarda correctamente en la exportación JSON y se carga en la importación.' },
            { type: 'fix', text: 'Los iconos de control de las conexiones (ej. eliminar) ahora son visibles. Se reemplazó el icono por una "X" para mayor claridad.' },
        ],
    },
    {
        version: '1.9.0',
        date: new Date('2024-08-20T10:00:00'),
        changes: [
            { type: 'feat', text: 'Reemplazada la paleta de colores de nodo fija por un selector de color completo en los ajustes avanzados.' },
            { type: 'feat', text: 'Añadida la capacidad de personalizar el color de los iconos de los nodos.' },
            { type: 'style', text: 'Actualizado el icono de "Guardar Proyecto" a un diseño de disquete.' },
            { type: 'style', text: 'Actualizado el icono de "Proyectos" en la cinta de opciones a un icono de átomo.' },
            { type: 'ux', text: 'Añadido crédito de desarrollo en el lienzo.' },
        ],
    },
    {
        version: '1.8.6',
        date: new Date('2024-08-19T14:00:00'),
        changes: [
            { type: 'fix', text: 'Corregido el selector de iconos de proyecto, que siempre modificaba el proyecto actualmente abierto en lugar del seleccionado.' },
            { type: 'fix', text: 'Solucionado un problema que impedía que apareciera el modal de confirmación al eliminar un proyecto.' },
            { type: 'style', text: 'Reducido el tamaño de las casillas de verificación de los nodos y mejorada su consistencia visual entre navegador y Electron.' },
            { type: 'ux', text: 'Ajustada el área de clic en la lista de proyectos para evitar cargas accidentales al intentar mover el ratón.' },
        ],
    },
    {
        version: '1.8.5',
        date: new Date('2024-08-18T10:00:00'),
        changes: [
            { type: 'feat', text: 'Unificados todos los iconos de la aplicación (nodos, proyectos, UI) en una única lista seleccionable.' },
            { type: 'feat', text: 'Organizada la lista de iconos unificada en categorías para facilitar la navegación en los selectores.' },
            { type: 'feat', text: 'Añadida la capacidad de eliminar el icono de un proyecto seleccionando la opción "Ninguno".' },
            { type: 'refactor', text: 'Centralizadas las definiciones de iconos para mejorar el mantenimiento del código y la consistencia.' },
        ],
    },
    {
        version: '1.8.4',
        date: new Date('2024-08-17T12:00:00'),
        changes: [
            { type: 'feat', text: 'Añadida una opción en los Ajustes del proyecto para establecer el modo de vista por defecto del editor de nodos (Editar, Dividir, Vista Previa).' },
            { type: 'fix', text: 'Corregido un problema que impedía arrastrar el modal de edición de nodos desde su área de título.' },
            { type: 'style', text: 'Actualizados los iconos de "Anclar", "Nodo Final", "Nodo Y" y "Nodo O" para mejorar la claridad visual.' },
        ],
    },
    {
        version: '1.8.3',
        date: new Date('2024-08-16T11:00:00'),
        changes: [
            { type: 'feat', text: 'Mejorada la experiencia de usuario añadiendo cursores de ratón contextuales para diversas acciones como arrastrar modales (move), interactuar con botones (pointer) y editar texto (text).' },
            { type: 'fix', text: 'Corregido el cursor de la cabecera del nodo para que muestre "grabbing" durante las operaciones de arrastre.' },
            { type: 'fix', text: 'Prevenida la acción de arrastre accidental del modal editor de nodos al hacer clic en el título para editarlo.' },
        ],
    },
    {
        version: '1.8.2',
        date: new Date('2024-08-15T10:00:00'),
        changes: [
            { type: 'feat', text: 'Mejorado el editor de nodos: el título ahora requiere un doble clic para editarse, facilitando el arrastre del modal.' },
            { type: 'fix', text: 'Eliminado el enfoque automático del campo de título al abrir el editor de nodos para prevenir la edición accidental.' },
        ],
    },
    {
        version: '1.8.1',
        date: new Date('2024-08-14T09:00:00'),
        changes: [
            { type: 'feat', text: 'Añadidos iconos de proyecto al explorador para una mejor identificación visual.' },
            { type: 'feat', text: 'Añadida la opción para restaurar los colores del lienzo a sus valores por defecto en los Ajustes.' },
            { type: 'fix', text: 'Corregido el cierre accidental de modales arrastrables al soltar el clic fuera de ellos.' },
            { type: 'fix', text: 'El modal de selección de iconos ya no se cierra al hacer clic dentro de él.' },
            { type: 'chore', text: 'Eliminada la plantilla "Guía de Electron" para simplificar la creación de proyectos.' },
        ],
    },
    {
        version: '1.8.0',
        date: new Date('2024-08-13T12:00:00'),
        changes: [
            { type: 'feat', text: 'Unificadas las guías de "Uso" y "Markdown" en un único modal de Ayuda con navegación por categorías.' },
            { type: 'refactor', text: 'Eliminados los componentes de modales de ayuda separados para simplificar la interfaz.' },
            { type: 'chore', text: 'Actualizados todos los puntos de acceso a la ayuda para utilizar el nuevo sistema unificado.' },
        ],
    },
    {
        version: '1.7.2',
        date: new Date('2024-08-12T10:30:00'),
        changes: [
            { type: 'feat', text: 'Implementada la funcionalidad "Descargar ZIP" para exportar un nodo y sus dientes.' },
            { type: 'feat', text: 'Mejorada la navegación entre nodos en el editor: ahora se puede cambiar de nodo sin cerrar el modal y las conexiones múltiples se muestran como flechas apiladas.' },
            { type: 'refactor', text: 'Unificados los modales de "Acerca de" e "Historial de Cambios" en un único panel con pestañas.' },
            { type: 'style', text: 'Actualizado el formato del historial de cambios para incluir fecha y hora.' },
        ],
    },
    {
        version: '1.7.1',
        date: new Date('2024-08-11T18:00:00'),
        changes: [
            { type: 'refactor', text: 'Fusionado "Acerca de" e "Historial de Cambios" en un nuevo menú desplegable "Información" en la pestaña Herramientas.' },
            { type: 'refactor', text: 'Fusionadas las pestañas "Archivo" y "Editar" en una única pestaña "Inicio" para una interfaz más limpia.' },
            { type: 'style', text: 'Actualizados los iconos de "Nodo Inicio" y "Nodo Final" en la pestaña Insertar por banderas más representativas.' },
            { type: 'feat', text: 'Añadidos contadores a las flechas de navegación en la ventana de edición de nodos para indicar múltiples conexiones previas/siguientes.' },
            { type: 'fix', text: 'Aclarado el tooltip del botón "Descargar ZIP" para indicar que es una funcionalidad futura y está deshabilitado.' },
        ],
    },
    {
        version: '1.7.0',
        date: new Date('2024-08-10T15:00:00'),
        changes: [
            { type: 'feat', text: 'Añadido un botón "Generar Síntesis" en los nodos que utiliza IA (Gemini) para crear un resumen de 4 líneas de la descripción.' },
        ],
    },
    {
        version: '1.6.0',
        date: new Date('2024-07-28T11:00:00'),
        changes: [
            { type: 'feat', text: 'Añadidos paneles laterales acoplables para el Explorador de Proyectos y el Chatbot.' },
            { type: 'feat', text: 'Los paneles ahora se pueden contraer para ahorrar espacio en la pantalla.' },
            { type: 'refactor', text: 'Refactorización importante de la gestión de estado para los paneles de la interfaz.' },
            { type: 'style', text: 'Mejorada la distinción visual para los nodos anclados.' },
        ],
    },
    {
        version: '1.5.0',
        date: new Date('2024-07-15T16:30:00'),
        changes: [
            { type: 'feat', text: 'Introducidos los "Dientes" (Mininodos) para adjuntar fragmentos de código o notas a los nodos principales.' },
            { type: 'feat', text: 'Añadido un editor modal para Dientes con resaltado de sintaxis basado en la extensión del archivo.' },
            { type: 'feat', text: 'Implementada la funcionalidad de exportación para el contenido individual de los Dientes.' },
            { type: 'fix', text: 'Solucionado un problema donde los títulos de nodo largos se desbordaban.' },
        ],
    },
    {
        version: '1.4.0',
        date: new Date('2024-07-02T09:00:00'),
        changes: [
            { type: 'feat', text: 'Integrado Dexie.js para un almacenamiento robusto en el lado del cliente usando IndexedDB.' },
            { type: 'feat', text: 'Implementado un Explorador de Proyectos para gestionar múltiples mapas mentales.' },
            { type: 'feat', text: 'Los proyectos ahora se guardan automáticamente.' },
            { type: 'refactor', text: 'Reemplazada la persistencia en localStorage con el nuevo sistema IndexedDB.' },
        ],
    },
    {
        version: '1.3.0',
        date: new Date('2024-06-20T14:00:00'),
        changes: [
            { type: 'feat', text: 'Implementado un menú contextual (clic derecho) en nodos, conexiones y el lienzo para acciones rápidas.' },
            { type: 'feat', text: 'Añadida la capacidad de insertar un nuevo nodo directamente en una conexión existente.' },
            { type: 'feat', text: 'Añadida la funcionalidad de deshacer/rehacer (Ctrl+Z / Ctrl+Y).' },
            { type: 'style', text: 'Rediseñadas las líneas de conexión a curvas de Bézier para un aspecto más suave.' },
        ],
    },
    {
        version: '1.2.0',
        date: new Date('2024-06-11T19:00:00'),
        changes: [
            { type: 'feat', text: 'Implementada la selección de múltiples nodos mediante Shift+clic y un cuadro de selección arrastrable.' },
            { type: 'feat', text: 'Añadidas las funcionalidades de copiar, pegar y eliminar para selecciones de múltiples nodos.' },
            { type: 'style', text: 'Introducida una interfaz de cinta de opciones (Ribbon) para una navegación más organizada.' },
            { type: 'ux', text: 'Mejorada la gestión de la posición del lienzo y el zoom para una experiencia más fluida.' },
        ],
    },
];

const ITEMS_PER_PAGE = 5;

const InfoModal: React.FC<InfoModalProps> = ({ onClose, isDarkTheme, version, schemaVersion }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('changelog');
  const [changelogPage, setChangelogPage] = useState(0);
  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 280 });
  const [size, setSize] = useState({ width: 700, height: 560 });
  const dragInfo = useRef({ isDragging: false, isResizing: false, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0 });

  const totalPages = Math.ceil(changelogData.length / ITEMS_PER_PAGE);
  const paginatedChangelogData = changelogData.slice(
      changelogPage * ITEMS_PER_PAGE,
      (changelogPage + 1) * ITEMS_PER_PAGE
  );

  const onDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button, .no-drag, a')) return;
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

  const getTypeStyles = (type: string) => {
      switch (type) {
          case 'feat': return { label: 'Nuevo', color: 'bg-green-600/80' };
          case 'fix': return { label: 'Corregido', color: 'bg-red-600/80' };
          case 'style': return { label: 'Estilo', color: 'bg-purple-600/80' };
          case 'refactor': return { label: 'Refactor', color: 'bg-blue-600/80' };
          case 'ux': return { label: 'UX', color: 'bg-yellow-600/80' };
          case 'chore': return { label: 'Admin', color: 'bg-zinc-600/80' };
          default: return { label: 'Cambio', color: 'bg-zinc-600/80' };
      }
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
      className={`fixed z-[55] rounded-lg shadow-2xl flex flex-col pointer-events-auto ${isDarkTheme ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-zinc-900'}`}
      onClick={e => e.stopPropagation()}
    >
      <div 
        className={`flex-shrink-0 flex justify-between items-center py-2 px-4 border-b cursor-move ${isDarkTheme ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-200'}`}
        onMouseDown={onDragMouseDown}
      >
        <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('changelog')} className={`px-3 py-1 text-sm rounded-md transition-colors no-drag ${activeTab === 'changelog' ? 'bg-zinc-700' : 'hover:bg-zinc-700/50'}`}>Historial de Cambios</button>
            <button onClick={() => setActiveTab('about')} className={`px-3 py-1 text-sm rounded-md transition-colors no-drag ${activeTab === 'about' ? 'bg-zinc-700' : 'hover:bg-zinc-700/50'}`}>Acerca de</button>
        </div>
         <button onClick={onClose} className={`p-1 rounded-full transition-colors no-drag ${isDarkTheme ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100/10'}`}>
            <Icon icon="close" className="w-6 h-6" />
        </button>
      </div>

      <main className="flex-grow p-6 overflow-y-auto">
        {activeTab === 'changelog' ? (
          <>
            <div className="space-y-6">
              {paginatedChangelogData.map((entry, entryIdx) => (
                <div key={entry.version}>
                  <h3 className={`text-xl font-bold ${entryIdx === 0 && changelogPage === 0 ? 'text-yellow-400 font-black' : 'text-cyan-400'}`}>
                    v{entry.version} <span className="text-sm font-normal text-zinc-400">- {entry.date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </h3>
                  <ul className="mt-2 ml-2 space-y-1">
                    {entry.changes.map((change, index) => {
                        const { label, color } = getTypeStyles(change.type);
                        return (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                <span className={`flex-shrink-0 mt-1 px-2 py-0.5 text-xs font-semibold text-white rounded-full ${color}`}>{label}</span>
                                <p className="text-zinc-300">{change.text}</p>
                            </li>
                        );
                    })}
                  </ul>
                </div>
              ))}
            </div>
             <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-zinc-700">
                <button
                    onClick={() => setChangelogPage(p => Math.max(0, p - 1))}
                    disabled={changelogPage === 0}
                    className="px-3 py-1.5 text-sm font-semibold rounded-md transition flex items-center gap-2 text-zinc-300 bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed no-drag"
                >
                    <Icon icon="chevron-left" className="h-4 w-4" /> Anterior
                </button>
                <span className="text-sm text-zinc-400">Página {changelogPage + 1} de {totalPages}</span>
                <button
                    onClick={() => setChangelogPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={changelogPage >= totalPages - 1}
                     className="px-3 py-1.5 text-sm font-semibold rounded-md transition flex items-center gap-2 text-zinc-300 bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed no-drag"
                >
                    Siguiente <Icon icon="chevron-right" className="h-4 w-4" />
                </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 prose prose-invert max-w-none prose-sm">
              <h2 className="text-2xl font-bold text-cyan-400">MindWeaver</h2>
              <p>
                  Una herramienta de mapas mentales diseñada para la planificación de proyectos, la organización de ideas y el desarrollo de tutoriales.
              </p>
              <p className="text-xs text-zinc-400">Versión de la Aplicación: {version} | Versión del Esquema: {schemaVersion}</p>

              <h3 className="text-xl font-semibold text-cyan-400 pt-4">Tecnologías Utilizadas</h3>
              <p className="mt-4 text-sm text-zinc-400">
                  <strong>MindWeaver</strong> está construido con <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">React</a>, <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">TypeScript</a>, <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">Tailwind CSS</a>, <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">Vite</a> y compilado con <a href="https://www.electronjs.org/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">Electron</a>. Usa <a href="https://zustand-demo.pmnd.rs/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">Zustand</a> para la gestión del estado y <a href="https://dexie.org/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">Dexie.js</a> (IndexedDB) para el almacenamiento persistente. Las funciones de IA son impulsadas por la API de Google Gemini.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                  Desarrollado con 🤘 por ulik.
              </p>
              {/*
              
              */}
          </div>
        )}
      </main>

      <div className={`flex-shrink-0 flex justify-end items-center gap-3 p-4 border-t ${isDarkTheme ? 'border-zinc-700' : 'border-zinc-200'}`}>
        <button onClick={onClose} className={`px-4 py-2 font-semibold rounded-md transition no-drag ${isDarkTheme ? 'text-white bg-cyan-600 hover:bg-cyan-700' : 'text-white bg-cyan-600 hover:bg-cyan-700'}`}>
          Cerrar
        </button>
      </div>
       <div 
          onMouseDown={onResizeMouseDown}
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 no-drag ${isDarkTheme ? 'bg-zinc-500/50' : 'bg-zinc-300/50'} hover:bg-cyan-500 rounded-tl-lg`}
          title="Redimensionar"
        />
    </div>
  );
};

export default InfoModal;