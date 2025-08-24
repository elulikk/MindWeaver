
import { MindMapState, ProjectTemplate, MindMapCoreState, IconName } from './types';
import { SaveData } from './storeState';
import { getTemplate } from './templates';
import { db } from './db';
import { sanitizeAndMigrateState } from './storeMigrations';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

// Helper function to extract file name without extension
const getFileName = (name: string) => name.replace(/\.[^.]+$/, "");

export const createProjectActions = (set: SetState, get: GetState) => ({
    loadProjects: async () => {
        const projectsFromDb = await db.projects.orderBy('modifiedAt').reverse().toArray();
        set({
            projects: projectsFromDb.map(p => ({
                id: p.id!,
                title: p.title,
                modifiedAt: p.modifiedAt,
                icon: p.icon,
            })),
        });
    },
    loadProject: async (projectId: number) => {
        const { actions } = get();
        const project = await db.projects.get(projectId);
        if (project) {
            actions.loadState(project.state);
            set({ currentProjectId: projectId, editingMode: 'db', currentFileHandle: null, isFileDirty: false });
            actions._addLog(`Proyecto '${project.title}' cargado.`, 'success');
        } else {
            actions._addLog(`No se pudo encontrar el proyecto con ID ${projectId}.`, 'error');
        }
    },
    addNewProject: async (type: ProjectTemplate | MindMapCoreState) => {
        const { actions } = get();
        
        const isProjectTemplate = typeof type === 'string';
        const newState = isProjectTemplate ? getTemplate(type) : type;
        
        let icon: IconName = 'brain';
        if (isProjectTemplate) {
            if (type === 'coffee') icon = 'template-coffee';
            if (type === 'electron-compilation') icon = 'template-electron';
        }

        const newProject = { title: newState.canvasTitle, state: newState, modifiedAt: new Date(), icon };
        const newId = await db.projects.add(newProject);
        await actions.loadProjects();
        await actions.loadProject(newId);
        actions.closeModal();
    },
    deleteProject: async (projectId: number) => get().actions.openModal({ type: 'deleteProject', projectId }),
    confirmDeleteProject: async () => {
        const { currentProjectId, actions } = get();
        const activeModal = get().activeModals[get().activeModals.length - 1];
        if (activeModal?.type !== 'deleteProject') return;

        const { projectId } = activeModal;
        await db.projects.delete(projectId);
        await actions.loadProjects();
        if (currentProjectId === projectId) {
            const projects = await db.projects.orderBy('modifiedAt').reverse().toArray();
            if (projects.length > 0) {
                await actions.loadProject(projects[0].id!);
            } else {
                await actions.addNewProject('empty');
            }
        }
        actions.closeModal();
        actions._addLog('Proyecto eliminado permanentemente.', 'warning');
    },
    updateProjectIcon: async (projectId: number, icon: IconName | undefined) => {
        const { actions } = get();
        await db.projects.update(projectId, { icon });
        await actions.loadProjects();
        actions._addLog('Icono del proyecto actualizado.', 'success');
    },
    loadUserTemplates: async () => {
        const { actions } = get();
        try {
            const templates = await db.userTemplates.toArray();
            set({ userTemplates: templates });
        } catch (error) {
            console.error("Failed to load user templates:", error);
            actions._addLog('Error al cargar las plantillas de usuario.', 'error');
        }
    },
    importAsTemplate: async (file: File) => {
        const { actions } = get();
        try {
            const fileContent = await file.text();
            const data = JSON.parse(fileContent) as Partial<SaveData>;
            const sanitizedState = sanitizeAndMigrateState(data);

            const newTemplate = {
                title: getFileName(file.name),
                state: sanitizedState,
            };
            await db.userTemplates.add(newTemplate);
            await actions.loadUserTemplates();
            actions._addLog(`Plantilla '${file.name}' importada correctamente.`, 'success');
        } catch (error: any) {
            console.error("Failed to import template:", error);
            actions._addLog(`Error al importar la plantilla: ${error.message}`, 'error');
        }
    },
    deleteUserTemplate: async (templateId: number) => {
        const { actions } = get();
        try {
            await db.userTemplates.delete(templateId);
            await actions.loadUserTemplates();
            actions._addLog('Plantilla de usuario eliminada.', 'warning');
        } catch (error: any) {
            console.error("Failed to delete user template:", error);
            actions._addLog(`Error al eliminar la plantilla: ${error.message}`, 'error');
        }
    },
    updateCanvasTitle: (title: string) => {
        get().actions.updateCoreState({ canvasTitle: title });
    },
});