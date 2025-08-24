
export default {
    app: {
        projectName: 'Projects',
        focusMode: 'Focus Mode (highlights active nodes)',
        focus: 'Focus',
        devBy: 'developed by ulik',
        untitled: 'Untitled Map',
    },
    ribbon: {
        // Tabs
        tabs: {
            home: 'Home',
            nodes: 'Nodes',
            drawing: 'Drawing',
            tools: 'Tools'
        },
        // Home Tab
        home: {
            newProject: 'New Project',
            newProjectTooltip: 'Create a new project (Ctrl+N)',
            openLocal: 'Open Local',
            openLocalTooltip: 'Open a local .json file',
            saveProject: 'Save Project',
            saveProjectTooltip: 'Save the current canvas as a project (Ctrl+S)',
            undo: 'Undo',
            undoTooltip: 'Undo (Ctrl+Z)',
            redo: 'Redo',
            redoTooltip: 'Redo (Ctrl+Y)',
            copy: 'Copy',
            copyTooltip: 'Copy selection (Ctrl+C)',
            paste: 'Paste',
            pasteTooltip: 'Paste (Ctrl+V)',
            delete: 'Delete',
            deleteTooltip: 'Delete selection (Del)',
        },
        // Insert Tab
        insert: {
            nodeNormal: 'Normal Node',
            nodeNormalTooltip: 'Add a standard node',
            nodeStart: 'Start Node',
            nodeStartTooltip: 'Add a flow start node',
            nodeFinish: 'Finish Node',
            nodeFinishTooltip: 'Add a flow finish node',
            nodeAnd: 'AND Node',
            nodeAndTooltip: 'Add a node with AND logic',
            nodeOr: 'OR Node',
            nodeOrTooltip: 'Add a node with OR logic',
            nodeEmpty: 'Empty Node',
            nodeEmptyTooltip: 'Add an empty node with no ports',
        },
        // Drawing Tab
        drawing: {
            drawMode: 'Draw Mode',
            drawModeTooltip: 'Toggle drawing edit mode',
            text: 'Text',
            textTooltip: 'Add a text box',
            rect: 'Square',
            rectTooltip: 'Draw a rectangle',
            circle: 'Circle',
            circleTooltip: 'Draw a circle/ellipse',
            line: 'Line',
            lineTooltip: 'Draw a line',
            properties: 'Properties',
            fillColor: 'Fill Color',
            strokeColor: 'Stroke Color',
            strokeWidth: 'Stroke Width',
        },
        // Tools Tab
        tools: {
            projects: 'Projects',
            projectsTooltip: 'Show/Hide explorer (Ctrl+B)',
            reorganize: 'Reorganize Order',
            reorganizeTooltip: 'Reorganize the order index of nodes based on flow',
            settings: 'Settings',
            settingsTooltip: 'Appearance settings',
            clean: 'Clean',
            cleanTooltip: 'Mark all as incomplete',
            help: 'Help',
            helpTooltip: 'Help (Guide, Markdown, Shortcuts)',
            info: 'Information',
            infoTooltip: 'Application information',
        },
        // Export
        export: 'Export As...',
        exportTooltip: 'Save a copy of the project',
        exportAsJson: 'to JSON',
        exportAsHtml: 'as HTML',
        // Language
        language: 'Language',
        languageTooltip: 'Change language',
    },
    contextMenu: {
        // Canvas
        nodeNormal: 'Normal Node',
        nodeStart: 'Start Node',
        nodeFinish: 'Finish Node',
        nodeAnd: 'AND Node',
        nodeOr: 'OR Node',
        nodeEmpty: 'Empty Node',
        paste: 'Paste',
        frameAll: 'Frame All',
        // Node
        editNode: 'Edit Node',
        addMininode: 'Add Mininode',
        pinNode: 'Pin Node',
        unpinNode: 'Unpin Node',
        reorganizeSelection: 'Reorganize selection order',
        copy: 'Copy',
        exportSelectionHtml: 'Export selection to HTML',
        delete: 'Delete',
        // Mininode
        editMininode: 'Edit Mininode',
        downloadMininode: 'Download file ({{title}})',
        deleteMininode: 'Delete Mininode',
        // Connection
        insertNode: 'Insert Node',
        makeWired: 'Make Wired',
        makeWireless: 'Make Wireless',
        deleteConnection: 'Delete Connection',
        // Port
        deletePort: 'Delete Port',
        // Canvas Object
        editText: 'Edit Text',
        convertToShape: 'Convert to Shape',
        convertToSwarm: 'Convert to Swarm',
    },
    modals: {
        // Delete Confirmation
        deleteConfirm: {
            title: 'Confirm Deletion',
            nodeBody: 'Are you sure you want to delete the node "{{title}}"?',
            mininodeBody: 'Are you sure you want to delete the mininode "{{title}}"?',
            selectionBody: 'Are you sure you want to delete {{count}} node(s) and their mininodes?',
            canvasObjectBody: 'Are you sure you want to delete {{count}} canvas object(s)?',
            projectBody: 'Are you sure you want to permanently delete the project "{{title}}"? This action cannot be undone.',
            confirmDeleteNode: 'Delete Node',
            confirmDeleteMininode: 'Delete Mininode',
            confirmDeleteSelection: 'Delete {{count}} Node(s)',
            confirmDeleteCanvasObjects: 'Delete {{count}} Object(s)',
            confirmDeleteProject: 'Delete Project',
            cancel: 'Cancel',
        },
        // Add other modals...
    },
    projectExplorer: {
        ago: {
            years: '{{count}} years ago',
            months: '{{count}} months ago',
            days: '{{count}} days ago',
            hours: '{{count}} hours ago',
            minutes: '{{count}} minutes ago',
            seconds: 'a few seconds ago',
        },
        changeIcon: 'Change icon',
        deleteProject: 'Delete project',
    },
    logPanel: {
        title: 'Activity Log',
        clear: 'Clear Log',
        hide: 'Hide Panel',
        empty: 'No activity to show.',
    }
};
