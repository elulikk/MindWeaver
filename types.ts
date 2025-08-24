

import type { IconName as UIIconName } from './components/icons';
import { Language } from './components/locales/i18n';

export { Language };

export interface Point {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  name:string;
}

// Los nombres de los iconos ahora se gestionan en el registro de iconos.
export type IconName = UIIconName;
export type IconCategory = "Nodos y Flujo" | "General y UI" | "Formato" | "Desarrollo y Datos" | "Dibujo";


export interface Node {
  id: number;
  pos: Point;
  title: string;
  description: string;
  color: string;
  size: { width: number; height: number };
  inputs: Port[];
  outputs: Port[];
  isComplete: boolean;
  inputLogic: 'AND' | 'OR';
  difficulty: number;
  icon?: IconName;
  iconColor?: string;
  isPinned: boolean;
  synthesis?: string;
  orderIndex: number;
  time?: number; // Tiempo estimado en minutos
}

export type IconType = 'txt' | 'py' | 'js' | 'html' | 'css' | 'json' | 'bat' | 'ps1' | 'generic' | 'php' | 'cmd';

export interface Mininode {
  id: number;
  parentId: number;
  title: string;
  content: string;
  icon: IconType;
  pos: Point; // Position relative to parent node's bottom-center anchor
}


export interface Connection {
  fromNode: number;
  fromPortId: string;
  toNode: number;
  toPortId: string;
  isWireless?: boolean;
}

export type HelpTab = 'navigation' | 'nodes' | 'markdown' | 'projects' | 'shortcuts' | 'html';

export type ActiveModal =
  | { type: 'edit'; node: Node }
  | { type: 'editMininode'; mininode: Mininode }
  | { type: 'delete'; nodeId: number }
  | { type: 'deleteSelection' }
  | { type: 'settings' }
  | { type: 'confirmNew' }
  | { type: 'confirmMarkAllIncomplete' }
  | { type: 'deleteProject'; projectId: number }
  | { type: 'deleteMininode'; mininodeId: number }
  | { type: 'selectEndNode'; endNodes: Node[] }
  | { type: 'confirmImport'; fileContent: string; file: File; }
  | { type: 'help'; initialTab?: HelpTab }
  | { type: 'info' }
  | { type: 'projectIconPicker', projectId: number }
  | { type: 'editCanvasText'; objectId: string }
  | { type: 'deleteCanvasObjects' };


// For the clipboard
export interface ClipboardData {
    nodes: Node[];
    connections: Connection[];
}

export interface Project {
    id: number;
    title: string;
    modifiedAt: Date;
    icon?: IconName;
}

export interface UserTemplate {
    id?: number;
    title: string;
    state: MindMapCoreState;
}

export interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type DrawingTool = 'rect' | 'ellipse' | 'line' | 'text' | 'edit';

export interface CanvasObjectBase {
    id: string;
    type: DrawingTool;
}

export interface CanvasObjectText extends CanvasObjectBase {
    type: 'text';
    pos: Point;
    text: string; // Will store HTML content
    fontSize: number;
    color: string;
    width: number;
    height: number;
    textAlign?: 'left' | 'center' | 'right';
}

export interface CanvasObjectShape extends CanvasObjectBase {
    type: 'rect' | 'ellipse';
    pos: Point;
    size: { width: number; height: number };
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    isSwarm?: boolean;
}

export interface CanvasObjectLine extends CanvasObjectBase {
    type: 'line';
    start: Point;
    end: Point;
    strokeColor: string;
    strokeWidth: number;
    strokeOpacity?: number;
    startArrow?: boolean;
    endArrow?: boolean;
}

export type CanvasObject = CanvasObjectText | CanvasObjectShape | CanvasObjectLine;


// The core state of the mind map that we want to track for undo/redo
export interface MindMapCoreState {
  nodes: Node[];
  mininodes: Mininode[];
  connections: Connection[];
  canvasObjects: CanvasObject[];
  nodeColor: string;
  backgroundColor: string;
  gridColor: string;
  canvasTitle: string;
  showMininodePreviews: boolean;
  checkboxPosition: 'left' | 'right';
  contextMenuEnabled: boolean;
  defaultEditorMode: 'edit' | 'split' | 'preview';
  autosaveEnabled: boolean;
}

export type ContextMenu = {
  x: number;
  y: number;
} & (
  | { type: 'canvas'; }
  | { type: 'node'; targetId: number; }
  | { type: 'connection'; targetId: Connection; }
  | { type: 'mininode'; targetId: number; }
  | { type: 'port'; nodeId: number; portId: string; portType: 'input' | 'output'; }
  | { type: 'canvas-object'; objectId: string; }
);

export interface PanelState {
    collapsed: boolean;
    pinned: boolean;
}

export type CanvasObjectResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface CanvasObjectDragInfo {
    isDragging: boolean;
    isResizing: boolean;
    resizeHandle: CanvasObjectResizeHandle | null;
    startMousePos: Point;
    initialObjectStates: Map<string, CanvasObject>;
    initialNodeStates?: Node[];
}

// The complete state including transient UI state
export interface MindMapState extends MindMapCoreState {
  viewOffset: Point;
  zoom: number;
  mainSize: { width: number; height: number }; // For frameAllNodes
  connectingInfo: { nodeId: number; portId: string } | null;
  mousePosition: Point;
  isPanning: boolean;
  panStart: Point;
  isLoading: string | false;
  selectedNodeIds: Set<number>;
  selectedCanvasObjectIds: Set<string>;
  isSelecting: boolean;
  selectionStart: Point | null;
  selectionRect: { x: number, y: number, width: number, height: number } | null;
  activeModals: ActiveModal[];
  contextMenu: ContextMenu | null;
  dragInfo: {
    startPos: Point;
    initialNodePositions: Map<number, Point>;
    initialMininodePositions: Map<number, Point>; // This will be unused now
    isDragging: boolean;
  };
  resizeInfo: {
    nodeId: number;
    startSize: { width: number; height: number };
    startPos: Point;
    handle: 'br' | 'r' | 'b';
  } | null;
  
  clipboard: ClipboardData | null;
  
  // Undo/Redo states
  pastStates: MindMapCoreState[];
  futureStates: MindMapCoreState[];
  
  // Project Explorer State
  isExplorerOpen: boolean;
  projects: Project[];
  userTemplates: UserTemplate[];
  currentProjectId: number | null;
  panelStates: Record<string, PanelState>;

  // Log Panel State
  isLogPanelOpen: boolean;
  logHistory: LogEntry[];

  // File editing state
  currentFileHandle: any | null; // FileSystemFileHandle
  editingMode: 'db' | 'file';
  isFileDirty: boolean;

  // Drawing state
  drawingMode: DrawingTool | null;
  drawingObject: CanvasObject | null;
  canvasObjectDragInfo: CanvasObjectDragInfo | null;
  draggedMininodeInfo: { id: number; parentId: number } | null;

  // UI State
  focusModeEnabled: boolean;
  language: Language;

  // Computed properties
  isDarkTheme: boolean;
  nodesById: { [key: number]: Node };
  mininodesById: { [key: number]: Mininode };
  mininodesByParentId: { [key: number]: Mininode[] };
  canvasObjectsById: { [key: string]: CanvasObject };
  nodeStatus: Map<number, { activeInputs: Set<string>, isConditionMet: boolean }>;

  actions: AppActions;
}

export type ProjectTemplate = 'empty' | 'coffee' | 'electron-compilation';

export interface Settings {
    showMininodePreviews: boolean;
    checkboxPosition: 'left' | 'right';
    backgroundColor: string;
    gridColor: string;
    nodeColor: string;
    contextMenuEnabled: boolean;
    defaultEditorMode: 'edit' | 'split' | 'preview';
    autosaveEnabled: boolean;
}

// Define actions separately for clarity
export interface AppActions {
    _updateState: (newState: Partial<Omit<MindMapState, 'actions'>>) => void;
    updateCoreState: (newState: Partial<MindMapCoreState>) => void;
    addNode: (template?: 'normal' | 'starter' | 'finish' | 'and' | 'or' | 'empty') => void;
    addNodeAndConnect: (template?: 'normal' | 'starter' | 'finish' | 'and' | 'or' | 'empty') => void;
    saveNode: (updatedNode: Node) => void;
    saveNodeState: (updatedNode: Node) => void;
    toggleNodeComplete: (nodeId: number) => void;
    toggleNodePin: (nodeId: number) => void;
    requestMarkAllIncomplete: () => void;
    confirmMarkAllIncomplete: () => void;
    requestDeleteNode: (nodeId: number) => void;
    confirmDeleteNode: () => void;
    requestDeleteSelection: () => void;
    confirmDeleteSelection: () => void;
    addPort: (nodeId: number, portType: 'input' | 'output') => void;
    deletePort: (nodeId: number, portType: 'input' | 'output', portId: string) => void;
    reorganizeOrderIndex: () => void;
    reorganizeOrderIndexForSelection: () => void;
    connectStart: (nodeId: number, portId: string) => void;
    connectEnd: (id: number, portId: string) => void;
    deleteConnection: (conn: Connection) => void;
    insertNodeInConnection: (conn: Connection) => void;
    toggleConnectionWirelessMode: (conn: Connection) => void;
    handleMouseMove: (e: React.MouseEvent<HTMLElement>, newMousePosition: Point) => void;
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseUp: (e: React.MouseEvent<HTMLElement>) => void;
    handleWheel: (e: React.WheelEvent<HTMLElement>) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    frameAllNodes: () => void;
    frameNode: (nodeId: number) => void;
    setMainSize: (size: { width: number, height: number }) => void;
    nodeMouseDown: (nodeId: number, e: React.MouseEvent<HTMLDivElement>) => void;
    nodeResizeStart: (nodeId: number, handle: 'br' | 'r' | 'b', e: React.MouseEvent<HTMLDivElement>) => void;
    updateCanvasTitle: (title: string) => void;
    saveSettings: (newSettings: Settings) => void;
    exportToFile: (format: 'json') => void;
    exportToHtml: (endNodeId?: number | null) => Promise<void>;
    exportSelectionToHtml: () => Promise<void>;
    importFromFile: (file: File) => void;
    confirmImport: () => Promise<void>;
    loadState: (state: Partial<MindMapCoreState>) => void;
    copySelection: () => void;
    pasteFromClipboard: () => void;
    openModal: (modal: ActiveModal) => void;
    closeModal: () => void;
    replaceActiveModal: (modal: ActiveModal) => void;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;
    generateNodeSynthesis: (nodeId: number) => Promise<void>;
    downloadNodeAsZip: (nodeId: number) => Promise<void>;

    // Context Menu Actions
    openContextMenu: (menu: ContextMenu) => void;
    closeContextMenu: () => void;

    // Mininode Actions
    addMininode: (parentId: number) => void;
    saveMininode: (updatedMininode: Mininode) => void;
    requestDeleteMininode: (mininodeId: number) => void;
    confirmDeleteMininode: () => void;
    exportMininodeContent: (mininodeId: number) => void;
    selectOnlyNode: (nodeId: number) => void;
    setDraggedMininodeInfo: (info: { id: number; parentId: number } | null) => void;
    moveMininode: (mininodeId: number, newParentId: number) => void;

    // Project Actions
    toggleExplorer: () => void;
    loadProjects: () => Promise<void>;
    loadProject: (projectId: number) => Promise<void>;
    addNewProject: (type: ProjectTemplate | MindMapCoreState) => Promise<void>;
    deleteProject: (projectId: number) => Promise<void>;
    confirmDeleteProject: () => Promise<void>;
    setPanelState: (panelId: string, newState: Partial<PanelState>) => void;
    updateProjectIcon: (projectId: number, icon: IconName | undefined) => Promise<void>;
    // Template Actions
    loadUserTemplates: () => Promise<void>;
    importAsTemplate: (file: File) => Promise<void>;
    deleteUserTemplate: (templateId: number) => Promise<void>;

    // Log Panel Actions
    toggleLogPanel: () => void;
    clearLogHistory: () => void;
    _addLog: (message: string, type?: LogEntry['type']) => void;

    // UI Actions
    toggleFocusMode: () => void;
    setLanguage: (lang: Language) => void;

    // File/DB Actions
    saveOrUpdateProject: (options?: { silent?: boolean }) => Promise<void>;
    
    // Drawing Actions
    setDrawingMode: (mode: DrawingTool | null) => void;
    updateCanvasObject: (updatedObject: CanvasObject) => void;
    requestDeleteSelectedCanvasObjects: () => void;
    confirmDeleteSelectedCanvasObjects: () => void;
    updateSelectedCanvasObjects: (updates: Partial<CanvasObject>) => void;
    toggleSwarm: (objectId: string) => void;
}