
export default {
    app: {
        projectName: 'Proyectos',
        focusMode: 'Modo Enfoque (resalta nodos activos)',
        focus: 'Enfoque',
        devBy: 'desarrollado por ulik',
        untitled: 'Mapa sin Título',
    },
    ribbon: {
        // Tabs
        tabs: {
            home: 'Inicio',
            nodes: 'Nodos',
            drawing: 'Dibujo',
            tools: 'Herramientas'
        },
        // Home Tab
        home: {
            newProject: 'Nuevo Proyecto',
            newProjectTooltip: 'Crear un nuevo proyecto (Ctrl+N)',
            openLocal: 'Abrir Local',
            openLocalTooltip: 'Abrir un archivo .json local',
            saveProject: 'Guardar Proyecto',
            saveProjectTooltip: 'Guardar el lienzo actual como un proyecto (Ctrl+S)',
            undo: 'Deshacer',
            undoTooltip: 'Deshacer (Ctrl+Z)',
            redo: 'Rehacer',
            redoTooltip: 'Rehacer (Ctrl+Y)',
            copy: 'Copiar',
            copyTooltip: 'Copiar selección (Ctrl+C)',
            paste: 'Pegar',
            pasteTooltip: 'Pegar (Ctrl+V)',
            delete: 'Eliminar',
            deleteTooltip: 'Eliminar selección (Supr)',
        },
        // Insert Tab
        insert: {
            nodeNormal: 'Nodo Normal',
            nodeNormalTooltip: 'Añadir un nodo estándar',
            nodeStart: 'Nodo Inicio',
            nodeStartTooltip: 'Añadir un nodo de inicio de flujo',
            nodeFinish: 'Nodo Final',
            nodeFinishTooltip: 'Añadir un nodo de fin de flujo',
            nodeAnd: 'Nodo Y',
            nodeAndTooltip: 'Añadir un nodo con lógica Y (AND)',
            nodeOr: 'Nodo O',
            nodeOrTooltip: 'Añadir un nodo con lógica O (OR)',
            nodeEmpty: 'Nodo Vacío',
            nodeEmptyTooltip: 'Añadir un nodo vacío sin puertos',
        },
        // Drawing Tab
        drawing: {
            drawMode: 'Draw Mode',
            drawModeTooltip: 'Activar/desactivar modo de edición de dibujos',
            text: 'Texto',
            textTooltip: 'Añadir cuadro de texto',
            rect: 'Cuadrado',
            rectTooltip: 'Dibujar un rectángulo',
            circle: 'Círculo',
            circleTooltip: 'Dibujar un círculo/elipse',
            line: 'Línea',
            lineTooltip: 'Dibujar una línea',
            properties: 'Propiedades',
            fillColor: 'Color de Relleno',
            strokeColor: 'Color de Borde',
            strokeWidth: 'Grosor de Borde',
        },
        // Tools Tab
        tools: {
            projects: 'Proyectos',
            projectsTooltip: 'Mostrar/Ocultar explorador (Ctrl+B)',
            reorganize: 'Reorganizar Orden',
            reorganizeTooltip: 'Reorganizar el índice de orden de los nodos según el flujo',
            settings: 'Ajustes',
            settingsTooltip: 'Ajustes de apariencia',
            clean: 'Limpiar',
            cleanTooltip: 'Marcar todo como incompleto',
            help: 'Ayuda',
            helpTooltip: 'Ayuda (Guía, Markdown, Atajos)',
            info: 'Información',
            infoTooltip: 'Información de la aplicación',
        },
        // Export
        export: 'Exportar como...',
        exportTooltip: 'Guardar una copia del proyecto',
        exportAsJson: 'a JSON',
        exportAsHtml: 'como HTML',
        // Language
        language: 'Idioma',
        languageTooltip: 'Cambiar idioma',
    },
    contextMenu: {
        // Canvas
        nodeNormal: 'Nodo Normal',
        nodeStart: 'Nodo Inicio',
        nodeFinish: 'Nodo Final',
        nodeAnd: 'Nodo Y (AND)',
        nodeOr: 'Nodo O (OR)',
        nodeEmpty: 'Nodo Vacío',
        paste: 'Pegar',
        frameAll: 'Encuadrar Todo',
        // Node
        openNode: 'Abrir Nodo',
        addMininode: 'Añadir Diente',
        pinNode: 'Anclar Nodo',
        unpinNode: 'Desanclar Nodo',
        reorganizeSelection: 'Reorganizar orden de la selección',
        copy: 'Copiar',
        exportSelectionHtml: 'Exportar selección a HTML',
        delete: 'Eliminar',
        // Mininode
        editMininode: 'Editar Diente',
        downloadMininode: 'Descargar archivo ({{title}})',
        deleteMininode: 'Eliminar Diente',
        // Connection
        insertNode: 'Insertar Nodo',
        makeWired: 'Hacer Cableado',
        makeWireless: 'Hacer Inalámbrico',
        deleteConnection: 'Eliminar Conexión',
        // Port
        deletePort: 'Eliminar Puerto',
        // Canvas Object
        editText: 'Editar Texto',
        convertToShape: 'Convertir en Figura',
        convertToSwarm: 'Convertir en Enjambre',
    },
    modals: {
        // Delete Confirmation
        deleteConfirm: {
            title: 'Confirmar Eliminación',
            nodeBody: '¿Estás seguro de que quieres eliminar el nodo "{{title}}"?',
            mininodeBody: '¿Estás seguro de que quieres eliminar el diente "{{title}}"?',
            selectionBody: '¿Estás seguro de que quieres eliminar {{count}} nodo(s) y sus dientes?',
            canvasObjectBody: '¿Estás seguro de que quieres eliminar {{count}} objeto(s) del lienzo?',
            projectBody: '¿Estás seguro de que quieres eliminar permanentemente el proyecto "{{title}}"? Esta acción no se puede deshacer.',
            confirmDeleteNode: 'Eliminar Nodo',
            confirmDeleteMininode: 'Eliminar Diente',
            confirmDeleteSelection: 'Eliminar {{count}} Nodo(s)',
            confirmDeleteCanvasObjects: 'Eliminar {{count}} Objeto(s)',
            confirmDeleteProject: 'Eliminar Proyecto',
            cancel: 'Cancelar',
        },
        // Add other modals...
    },
    projectExplorer: {
        ago: {
            years: 'hace {{count}} años',
            months: 'hace {{count}} meses',
            days: 'hace {{count}} días',
            hours: 'hace {{count}} horas',
            minutes: 'hace {{count}} minutos',
            seconds: 'hace unos segundos',
        },
        changeIcon: 'Cambiar icono',
        deleteProject: 'Eliminar proyecto',
    },
    logPanel: {
        title: 'Registro de Actividad',
        clear: 'Limpiar Registro',
        hide: 'Ocultar Panel',
        empty: 'No hay actividad para mostrar.',
    }
};
