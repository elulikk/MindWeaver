import React from 'react';
import { Node } from '../types';
import { useMindMapStore } from '../store';
import { Icon } from './Icon';

const SelectEndNodeModal: React.FC = () => {
    const { activeModals, actions } = useMindMapStore(state => ({
        activeModals: state.activeModals,
        actions: state.actions,
    }));
    
    const activeModal = activeModals.length > 0 ? activeModals[activeModals.length - 1] : null;

    if (activeModal?.type !== 'selectEndNode') return null;

    const { endNodes } = activeModal;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm" onClick={actions.closeModal}></div>
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[80] rounded-lg shadow-2xl flex flex-col bg-slate-800 text-slate-200"
            >
                <div className="p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold">Seleccionar Flujo para Exportar</h2>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-slate-300">
                        Se han detectado múltiples finales en tu proyecto. Por favor, selecciona el flujo que deseas exportar o elige exportar el proyecto completo.
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 -mr-2">
                        {endNodes.map(node => (
                            <button
                                key={node.id}
                                onClick={() => actions.exportToHtml(node.id)}
                                className="w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700"
                            >
                                <Icon icon="node-finish" className="w-6 h-6 flex-shrink-0 text-red-500" />
                                <span className="font-semibold">{node.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-between items-center gap-3 p-4 border-t border-slate-700">
                     <button
                        onClick={() => actions.exportToHtml(null)}
                        className="px-4 py-2 font-semibold rounded-md transition text-slate-300 bg-slate-700 hover:bg-slate-600"
                    >
                        Exportar Proyecto Completo
                    </button>
                    <button
                        onClick={actions.closeModal}
                        className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </>
    );
};

export default SelectEndNodeModal;
