import React from 'react';
import { generalIcons, uiIcons } from './general';
import { formattingIcons } from './formatting';
import { devIcons } from './dev';
import { drawingIcons } from './drawing';
import { nodeIcons } from './nodesAndFlow';
import { brandIcons } from './brandsAndTemplates';

// 1. Combina todos los diccionarios de iconos en un único registro.
export const iconRegistry = {
    ...generalIcons,
    ...uiIcons,
    ...formattingIcons,
    ...devIcons,
    ...drawingIcons,
    ...nodeIcons,
    ...brandIcons,
};

// 2. Define el tipo IconName a partir de las claves del registro.
//    Esto asegura que solo los iconos válidos puedan ser utilizados.
export type IconName = keyof typeof iconRegistry;

// 3. Define conjuntos y mapas para iconos con reglas de renderizado especiales.
export const nonOutlineIcons = new Set<IconName>(['pin-on', 'pin-off', 'new-canvas', 'copy', 'chatbot', 'postgresql', 'whatsapp', 'facebook', 'instagram', 'template-electron', 'node-and', 'node-or', 'pointer-edit', 'code', 'focus-mode']);
export const multiColorIcons = new Set<IconName>(['cuda', 'microsoft', 'nodejs', 'save', 'python', 'script', 'limpiar', 'abrir-local', 'spain-flag', 'uk-flag']);
export const customViewBoxIcons: Partial<Record<IconName, string>> = {
    'save': '0 0 100 100',
    'end-flag': '0 0 32 32',
    'node-and': '0 0 512 512',
    'node-or': '0 0 512 512',
    'cuda': '0 0 32 32',
    'microsoft': '0 0 16 16',
    'nodejs': '0 0 32 32',
    'python': '0 0 32 32',
    'script': '0 0 48 48',
    'limpiar': '0 0 1024 1024',
    'abrir-local': '0 0 512 512',
    'focus-mode': '0 0 512 512',
    'language': '0 0 24 24',
    'spain-flag': '0 0 512 512',
    'uk-flag': '0 0 512 512',
};

// 4. Define la estructura de categorías para los selectores de iconos.
export const categorizedIcons: Record<string, IconName[]> = {
  "Nodos y Flujo": [ 'brain', 'workflow', 'general', 'node-normal', 'node-start', 'node-finish', 'node-and', 'node-or', 'node-empty', 'start-flag', 'end-flag' ],
  "General y UI": [ 'add', 'minus', 'delete', 'close', 'check', 'settings', 'warning', 'help', 'markdown-help', 'changelog', 'undo', 'redo', 'copy', 'paste', 'import', 'export', 'download', 'new-canvas', 'send', 'hide', 'clear', 'drag-handle', 'frame', 'theme', 'save', 'explorer', 'log', 'pin-on', 'pin-off', 'chevron-left', 'chevron-right', 'chatbot', 'mark-all-incomplete', 'wifi', 'filter', 'focus-mode', 'time', 'limpiar', 'abrir-local', 'language', 'spain-flag', 'uk-flag'],
  "Formato": [ 'bold', 'italic', 'underline', 'strikethrough', 'code-block', 'link', 'blockquote', 'list-ul', 'list-ol', 'hr', 'table', 'text', 'align-left', 'align-center', 'align-right' ],
  "Desarrollo y Datos": [ 'terminal', 'code', 'script', 'python', 'postgresql', 'json', 'html', 'xml', 'csv', 'excel', 'cuda', 'microsoft', 'nodejs' ],
  "Dibujo": [ 'pointer-edit', 'shape-square', 'shape-circle', 'shape-line', 'arrow-start', 'arrow-end' ],
};