
import React from 'react';
import { useMindMapStore } from '../store';
import { Project } from '../types';
import { Icon } from './Icon';

const ProjectExplorer: React.FC = () => {
    const {
        projects,
        currentProjectId,
        actions,
    } = useMindMapStore(state => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        actions: state.actions,
    }));

    const timeAgo = (date: Date): string => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `hace ${Math.floor(interval)} años`;
        interval = seconds / 2592000;
        if (interval > 1) return `hace ${Math.floor(interval)} meses`;
        interval = seconds / 86400;
        if (interval > 1) return `hace ${Math.floor(interval)} días`;
        interval = seconds / 3600;
        if (interval > 1) return `hace ${Math.floor(interval)} horas`;
        interval = seconds / 60;
        if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
        return `hace unos segundos`;
    };

    const ProjectItem: React.FC<{ project: Project }> = ({ project }) => (
        <div
            className={`group flex items-center justify-between p-2 rounded-md transition-colors ${
                currentProjectId === project.id
                    ? 'bg-cyan-900/50'
                    : 'hover:bg-zinc-700/50'
            }`}
        >
            <div className="flex items-center gap-3 flex-grow overflow-hidden mr-2">
                <Icon icon={project.icon || 'brain'} className="w-5 h-5 flex-shrink-0 text-zinc-400" />
                <div 
                    onClick={() => actions.loadProject(project.id)}
                    className="flex-grow overflow-hidden cursor-pointer"
                >
                    <p className="text-sm font-medium truncate text-zinc-200">{project.title} <span className="text-xs text-zinc-500">#{project.id}</span></p>
                    <p className="text-xs text-zinc-400">{timeAgo(project.modifiedAt)}</p>
                </div>
            </div>
            <div className="flex-shrink-0 flex items-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        actions.openModal({ type: 'projectIconPicker', projectId: project.id });
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-md transition-colors text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-zinc-600"
                    title="Cambiar icono"
                >
                    <Icon icon="frame" className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        actions.deleteProject(project.id);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-md transition-colors text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-red-900/50 hover:text-red-400"
                    title="Eliminar proyecto"
                >
                    <Icon icon="delete" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-2 space-y-1">
             {projects.map(p => <ProjectItem key={p.id} project={p} />)}
        </div>
    );
};

export default ProjectExplorer;
