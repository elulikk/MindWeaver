import React from 'react';
import { MindMapCoreState, ProjectConflictInfo } from '../types';
import { Icon } from './Icon';
import { formatBytes } from '../utils';

interface ConfirmProjectConflictModalProps {
  onClose: () => void;
  onConfirm: (choice: 'overwrite' | 'keepLocal') => void;
  existingProjectInfo: ProjectConflictInfo;
  importedState: MindMapCoreState;
  importedFile: File;
}

const InfoCard: React.FC<{ title: string; projectTitle: string; modifiedAt: Date; size: number; isImport?: boolean }> = 
({ title, projectTitle, modifiedAt, size, isImport = false }) => (
    <div className={`p-4 rounded-lg border-2 ${isImport ? 'bg-cyan-900/20 border-cyan-700' : 'bg-zinc-700/50 border-zinc-600'}`}>
        <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
        <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-zinc-400">Título:</span>
                <span className="font-semibold text-right truncate">{projectTitle}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-zinc-400">Última Modificación:</span>
                <span className="font-semibold">{modifiedAt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-zinc-400">Tamaño:</span>
                <span className="font-semibold">{formatBytes(size)}</span>
            </div>
        </div>
    </div>
);

const ConfirmProjectConflictModal: React.FC<ConfirmProjectConflictModalProps> = ({ onClose, onConfirm, existingProjectInfo, importedState, importedFile }) => {
    
  return (
    <div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-full max-w-2xl rounded-lg shadow-2xl flex flex-col bg-zinc-800 text-zinc-200 pointer-events-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-yellow-900/50">
                <Icon icon="warning" className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-zinc-100">Conflicto de Proyecto Detectado</h2>
                <p className="mt-2 text-zinc-300">
                    El proyecto que estás importando ya existe en tu base de datos local. Por favor, elige qué versión deseas conservar.
                </p>
            </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard 
                title="Versión Existente"
                projectTitle={existingProjectInfo.title}
                modifiedAt={existingProjectInfo.modifiedAt}
                size={existingProjectInfo.size}
            />
             <InfoCard 
                title="Versión Importada"
                projectTitle={importedState.canvasTitle}
                modifiedAt={new Date(importedFile.lastModified)}
                size={importedFile.size}
                isImport
            />
        </div>
      </div>
      
      <div className="flex justify-between items-center gap-3 p-4 border-t border-zinc-700 bg-zinc-900/50 rounded-b-lg">
        <button
          onClick={onClose}
          className="px-4 py-2 font-semibold rounded-md transition text-zinc-300 bg-zinc-600 hover:bg-zinc-500"
        >
          Cancelar
        </button>
        <div className="flex items-center gap-3">
            <button
                onClick={() => onConfirm('keepLocal')}
                className="px-4 py-2 font-semibold rounded-md transition text-white bg-blue-600 hover:bg-blue-700"
            >
                Conservar Versión Existente
            </button>
            <button
                onClick={() => onConfirm('overwrite')}
                className="px-4 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
            >
                Sobrescribir con la Versión Importada
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmProjectConflictModal;