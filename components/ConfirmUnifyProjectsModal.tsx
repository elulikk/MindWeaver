import React, { useState } from 'react';
import { useMindMapStore } from '../store';
import { DBProject } from '../db';
import { Icon } from './Icon';
import { formatBytes } from '../utils';

interface ConfirmUnifyProjectsModalProps {
  projectGroup: DBProject[];
}

const ConfirmUnifyProjectsModal: React.FC<ConfirmUnifyProjectsModalProps> = ({ projectGroup }) => {
    const { actions } = useMindMapStore();
    const [projectToKeepId, setProjectToKeepId] = useState<number | null>(null);

    const handleConfirm = () => {
        if (projectToKeepId) {
            actions.confirmUnifyProjects({ 
                projectToKeepId,
                projectGroupId: projectGroup.map(p => p.id!)
            });
        }
    };

    return (
        <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-full max-w-4xl rounded-lg shadow-2xl flex flex-col bg-zinc-800 text-zinc-200 pointer-events-auto"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-yellow-900/50">
                        <Icon icon="copy" className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100">Unificar Proyectos Similares</h2>
                        <p className="mt-2 text-zinc-300">
                            Hemos detectado que los siguientes proyectos son muy similares. Selecciona la versión que deseas conservar. Las otras versiones se eliminarán permanentemente.
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {projectGroup.map(project => (
                        <div key={project.id} className={`p-4 rounded-lg border-2 transition-all ${projectToKeepId === project.id ? 'bg-green-900/30 border-green-500 shadow-lg' : 'bg-zinc-700/50 border-zinc-600 hover:border-zinc-500'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                                        <Icon icon={project.icon || 'brain'} className="w-5 h-5"/>
                                        {project.title}
                                    </h3>
                                    <span className="text-xs text-zinc-500">#{project.uuid.substring(0,8)}</span>
                                </div>
                                <button
                                    onClick={() => setProjectToKeepId(project.id!)}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${projectToKeepId === project.id ? 'bg-green-600 text-white cursor-default' : 'bg-zinc-600 hover:bg-green-700'}`}
                                >
                                    {projectToKeepId === project.id ? '✓ Conservar' : 'Conservar esta versión'}
                                </button>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-x-4 text-sm border-t border-zinc-600/50 pt-3">
                                <div><span className="text-zinc-400">Modificado:</span> <span className="font-semibold">{project.modifiedAt.toLocaleDateString()}</span></div>
                                <div><span className="text-zinc-400">Tamaño:</span> <span className="font-semibold">{formatBytes(JSON.stringify(project.state).length)}</span></div>
                                <div><span className="text-zinc-400">Nodos:</span> <span className="font-semibold">{project.state.nodes.length}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
      
            <div className="flex justify-between items-center gap-3 p-4 border-t border-zinc-700 bg-zinc-900/50 rounded-b-lg">
                <button
                    onClick={() => actions.closeModal()}
                    className="px-4 py-2 font-semibold rounded-md transition text-zinc-300 bg-zinc-600 hover:bg-zinc-500"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={!projectToKeepId}
                    className="px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:bg-zinc-500 disabled:cursor-not-allowed"
                >
                    Confirmar Unificación
                </button>
            </div>
        </div>
    );
};

export default ConfirmUnifyProjectsModal;