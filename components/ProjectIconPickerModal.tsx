
import React from 'react';
import { useMindMapStore } from '../store';
import { Icon } from './Icon';
import { categorizedIcons } from './icons';
import { IconName } from '../types';

const ProjectIconPickerModal: React.FC = () => {
    const { actions, projects, activeModals } = useMindMapStore(state => ({
        actions: state.actions,
        projects: state.projects,
        activeModals: state.activeModals,
    }));

    const activeModal = activeModals.find(m => m.type === 'projectIconPicker');

    if (activeModal?.type !== 'projectIconPicker') {
        return null;
    }

    const { projectId } = activeModal;
    const projectIcon = projects.find(p => p.id === projectId)?.icon;

    const handleIconSelect = (icon: IconName | undefined) => {
        if (projectId) {
            actions.updateProjectIcon(projectId, icon);
        }
        actions.closeModal();
    };

    return (
        <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[55] w-full max-w-lg rounded-lg shadow-2xl flex flex-col bg-zinc-900 text-zinc-200 pointer-events-auto"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex justify-between items-center py-2 px-4 border-b border-zinc-800">
                <h2 className="text-xl font-bold">Seleccionar Icono del Proyecto</h2>
                <button onClick={actions.closeModal} className="p-1 rounded-full transition-colors hover:bg-zinc-800">
                    <Icon icon="close" className="w-6 h-6" />
                </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                 <button
                    onClick={() => handleIconSelect(undefined)}
                    className={`w-full h-12 flex items-center justify-center text-sm font-semibold p-2 rounded-md border-2 transition-colors bg-zinc-800/50 hover:bg-zinc-800 ${!projectIcon ? 'border-cyan-500' : 'border-transparent'}`}
                >
                    Ninguno
                </button>
                {Object.entries(categorizedIcons).map(([category, icons]) => (
                    <div key={category}>
                        <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 px-1">{category}</h4>
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-zinc-950/50 border-zinc-800 justify-start">
                            {icons.map(icon => (
                                <button
                                    key={icon}
                                    onClick={() => handleIconSelect(icon)}
                                    title={icon}
                                    className={`p-2 rounded-md border-2 transition-colors ${projectIcon === icon ? 'border-cyan-500 bg-zinc-800' : 'border-transparent'} hover:bg-zinc-800 hover:border-cyan-500`}
                                >
                                    <Icon icon={icon} className="w-8 h-8" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex-shrink-0 flex justify-end items-center gap-3 p-4 border-t border-zinc-800">
                <button
                    onClick={actions.closeModal}
                    className="px-3 py-1.5 text-sm font-semibold rounded-md transition text-zinc-300 bg-zinc-700 hover:bg-zinc-600"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};

export default ProjectIconPickerModal;
