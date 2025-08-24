

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMindMapStore } from '../store';
import { Icon } from './Icon';
import { CanvasObject, CanvasObjectShape, CanvasObjectLine, CanvasObjectText } from '../types';
import { useTranslations } from './locales/i18n';

type ActiveTab = 'home' | 'nodes' | 'drawing' | 'tools';

const RibbonToolbar: React.FC = () => {
    const t = useTranslations();
    const {
        canvasTitle,
        currentProjectId,
        editingMode,
        isFileDirty,
        pastStates,
        futureStates,
        selectedNodeIds,
        clipboard,
        projects,
        drawingMode,
        selectedCanvasObjectIds,
        canvasObjectsById,
        actions,
    } = useMindMapStore();

    const [activeTab, setActiveTab] = useState<ActiveTab>('home');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const languageMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentProject = useMemo(() => {
        return projects.find(p => p.id === currentProjectId);
    }, [projects, currentProjectId]);

    const firstSelectedObject = useMemo(() => {
        if (selectedCanvasObjectIds.size === 0) return null;
        const firstId = [...selectedCanvasObjectIds][0];
        return canvasObjectsById[firstId] || null;
    }, [selectedCanvasObjectIds, canvasObjectsById]);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isExportMenuOpen && exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
            if (isLanguageMenuOpen && languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
                setIsLanguageMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExportMenuOpen, isLanguageMenuOpen]);

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            actions.importFromFile(file);
        }
        if (e.target) e.target.value = ''; // Reset input
    };
    
    const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (editingMode === 'file' && value.endsWith('*')) {
            value = value.slice(0, -1);
        }
        actions.updateCanvasTitle(value);
    };

    const colors = {
      tabInactive: 'text-zinc-400 hover:bg-zinc-700 hover:text-white',
      button: 'hover:bg-zinc-700/50',
      buttonDisabled: 'text-zinc-600 cursor-not-allowed',
      buttonActive: 'bg-zinc-700',
      buttonText: 'text-zinc-300',
      separator: 'bg-zinc-600',
      background: 'bg-zinc-800 border-zinc-700'
    };

    const TabButton: React.FC<{ tab: ActiveTab, label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1 text-sm font-semibold transition-colors rounded-t-md border-b-2 ${
                activeTab === tab ? 'border-cyan-500 text-cyan-500' : `border-transparent ${colors.tabInactive}`
            }`}
        >
            {label}
        </button>
    );

    const ActionButton: React.FC<{
        onClick?: () => void,
        disabled?: boolean,
        tooltip: string,
        icon: React.ComponentProps<typeof Icon>['icon'],
        children: React.ReactNode,
        isDropdown?: boolean,
        iconColorClass?: string,
        isActive?: boolean,
    }> = ({ onClick, disabled = false, tooltip, icon, children, isDropdown = false, iconColorClass = '', isActive = false }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={tooltip}
            className={`relative flex flex-col items-center justify-center text-center p-2 rounded-md w-20 h-20 transition-colors ${
                disabled ? colors.buttonDisabled : `${colors.button} ${colors.buttonText}`
            } ${isActive ? colors.buttonActive : ''}`}
        >
            <Icon icon={icon} className={`w-8 h-8 mb-1 ${disabled ? '' : iconColorClass}`} />
            <span className="text-xs leading-tight">{children}</span>
             {isDropdown && <span className="absolute bottom-1 right-1 text-xs">▼</span>}
        </button>
    );
    
    const DropdownMenuItem: React.FC<{ onClick: () => void, icon: React.ComponentProps<typeof Icon>['icon'], children: React.ReactNode }> = ({ onClick, icon, children }) => (
        <button
            onClick={onClick}
            className="w-full text-left px-3 py-2 text-sm flex items-center gap-3 rounded-md transition-colors text-zinc-300 hover:bg-zinc-600"
        >
            <Icon icon={icon} className="w-5 h-5"/>
            <span>{children}</span>
        </button>
    );
    
    const Separator = () => <div className={`w-px h-16 ${colors.separator}`}></div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <>
                        <ActionButton onClick={() => actions.openModal({ type: 'confirmNew' })} tooltip={t('ribbon.home.newProjectTooltip')} icon="brain" iconColorClass="text-pink-400">{t('ribbon.home.newProject')}</ActionButton>
                        <ActionButton onClick={() => fileInputRef.current?.click()} tooltip={t('ribbon.home.openLocalTooltip')} icon="abrir-local" iconColorClass="text-sky-500">{t('ribbon.home.openLocal')}</ActionButton>
                        <ActionButton onClick={() => actions.saveOrUpdateProject()} tooltip={t('ribbon.home.saveProjectTooltip')} icon="save">{t('ribbon.home.saveProject')}</ActionButton>
                        <Separator />
                        <ActionButton onClick={actions.undo} disabled={pastStates.length === 0} tooltip={t('ribbon.home.undoTooltip')} icon="undo" iconColorClass="text-blue-400">{t('ribbon.home.undo')}</ActionButton>
                        <ActionButton onClick={actions.redo} disabled={futureStates.length === 0} tooltip={t('ribbon.home.redoTooltip')} icon="redo" iconColorClass="text-blue-400">{t('ribbon.home.redo')}</ActionButton>
                        <Separator />
                        <ActionButton onClick={actions.reorganizeOrderIndex} tooltip={t('ribbon.home.reorganizeTooltip')} icon="workflow" iconColorClass="text-green-400">{t('ribbon.home.reorganize')}</ActionButton>
                    </>
                );
            case 'nodes':
                return (
                    <>
                        <ActionButton onClick={() => actions.addNode('normal')} tooltip={t('ribbon.insert.nodeNormalTooltip')} icon="node-normal" iconColorClass="text-green-500">{t('ribbon.insert.nodeNormal')}</ActionButton>
                        <ActionButton onClick={() => actions.addNode('starter')} tooltip={t('ribbon.insert.nodeStartTooltip')} icon="start-flag" iconColorClass="text-green-500">{t('ribbon.insert.nodeStart')}</ActionButton>
                        <ActionButton onClick={() => actions.addNode('finish')} tooltip={t('ribbon.insert.nodeFinishTooltip')} icon="end-flag" iconColorClass="text-red-500">{t('ribbon.insert.nodeFinish')}</ActionButton>
                        <Separator />
                        <ActionButton onClick={() => actions.addNode('and')} tooltip={t('ribbon.insert.nodeAndTooltip')} icon="node-and" iconColorClass="text-sky-500">{t('ribbon.insert.nodeAnd')}</ActionButton>
                        <ActionButton onClick={() => actions.addNode('or')} tooltip={t('ribbon.insert.nodeOrTooltip')} icon="node-or" iconColorClass="text-sky-500">{t('ribbon.insert.nodeOr')}</ActionButton>
                         <ActionButton onClick={() => actions.addNode('empty')} tooltip={t('ribbon.insert.nodeEmptyTooltip')} icon="node-empty">{t('ribbon.insert.nodeEmpty')}</ActionButton>
                        <Separator />
                        <ActionButton onClick={actions.copySelection} disabled={selectedNodeIds.size === 0} tooltip={t('ribbon.home.copyTooltip')} icon="copy">{t('ribbon.home.copy')}</ActionButton>
                        <ActionButton onClick={actions.pasteFromClipboard} disabled={!clipboard} tooltip={t('ribbon.home.pasteTooltip')} icon="paste">{t('ribbon.home.paste')}</ActionButton>
                        <ActionButton onClick={actions.requestDeleteSelection} disabled={selectedNodeIds.size === 0} tooltip={t('ribbon.home.deleteTooltip')} icon="delete" iconColorClass="text-red-500">{t('ribbon.home.delete')}</ActionButton>
                    </>
                );
            case 'drawing':
                return (
                    <>
                        <ActionButton onClick={() => actions.setDrawingMode('edit')} isActive={drawingMode === 'edit'} tooltip={t('ribbon.drawing.drawModeTooltip')} icon="pointer-edit" iconColorClass="text-yellow-400">{t('ribbon.drawing.drawMode')}</ActionButton>
                        <Separator />
                        <ActionButton onClick={() => actions.setDrawingMode('text')} isActive={drawingMode === 'text'} tooltip={t('ribbon.drawing.textTooltip')} icon="text">{t('ribbon.drawing.text')}</ActionButton>
                        <ActionButton onClick={() => actions.setDrawingMode('rect')} isActive={drawingMode === 'rect'} tooltip={t('ribbon.drawing.rectTooltip')} icon="shape-square">{t('ribbon.drawing.rect')}</ActionButton>
                        <ActionButton onClick={() => actions.setDrawingMode('ellipse')} isActive={drawingMode === 'ellipse'} tooltip={t('ribbon.drawing.circleTooltip')} icon="shape-circle">{t('ribbon.drawing.circle')}</ActionButton>
                        <ActionButton onClick={() => actions.setDrawingMode('line')} isActive={drawingMode === 'line'} tooltip={t('ribbon.drawing.lineTooltip')} icon="shape-line">{t('ribbon.drawing.line')}</ActionButton>
                        <Separator />
                        <div className={`p-2 flex flex-col items-start gap-1 ${selectedCanvasObjectIds.size === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                            <span className="text-xs font-semibold text-zinc-400 mb-1">{t('ribbon.drawing.properties')}</span>
                            <div className="flex items-center gap-2">
                                <label title={t('ribbon.drawing.fillColor')} className="relative w-7 h-7">
                                    <input type="color" value={(firstSelectedObject as CanvasObjectShape)?.fillColor || '#000000'} onChange={e => actions.updateSelectedCanvasObjects({ fillColor: e.target.value })} className="absolute inset-0 w-full h-full p-0 border-none rounded-md cursor-pointer opacity-0" />
                                    <div className="w-full h-full rounded-md border-2 border-zinc-600 hover:border-cyan-500 transition-colors" style={{ backgroundColor: (firstSelectedObject as CanvasObjectShape)?.fillColor }} />
                                </label>
                                <label title={t('ribbon.drawing.strokeColor')} className="relative w-7 h-7">
                                    <input type="color" value={(firstSelectedObject as CanvasObjectShape)?.strokeColor || '#000000'} onChange={e => actions.updateSelectedCanvasObjects({ strokeColor: e.target.value })} className="absolute inset-0 w-full h-full p-0 border-none rounded-md cursor-pointer opacity-0" />
                                    <div className="w-full h-full rounded-md border-2 border-zinc-600 hover:border-cyan-500 transition-colors" style={{ backgroundColor: (firstSelectedObject as CanvasObjectShape)?.strokeColor }} />
                                </label>
                                <input type="number" min="1" max="20" value={(firstSelectedObject as CanvasObjectShape)?.strokeWidth || 1} onChange={e => actions.updateSelectedCanvasObjects({ strokeWidth: parseInt(e.target.value, 10) || 1 })} className="w-16 p-1 text-sm text-center rounded-md bg-zinc-700 text-zinc-200" title={t('ribbon.drawing.strokeWidth')}/>
                            </div>
                        </div>

                    </>
                );
            case 'tools':
                 return (
                    <>
                        <ActionButton onClick={actions.toggleExplorer} tooltip={t('ribbon.tools.projectsTooltip')} icon="template-electron">{t('ribbon.tools.projects')}</ActionButton>
                        <Separator />
                        <ActionButton onClick={() => actions.openModal({ type: 'settings' })} tooltip={t('ribbon.tools.settingsTooltip')} icon="settings" iconColorClass="text-purple-400">{t('ribbon.tools.settings')}</ActionButton>
                        <ActionButton onClick={actions.requestMarkAllIncomplete} tooltip={t('ribbon.tools.cleanTooltip')} icon="limpiar" iconColorClass="text-amber-500">{t('ribbon.tools.clean')}</ActionButton>
                        <Separator />
                        <ActionButton onClick={() => actions.openModal({ type: 'help' })} tooltip={t('ribbon.tools.helpTooltip')} icon="help" iconColorClass="text-green-400">{t('ribbon.tools.help')}</ActionButton>
                        <ActionButton onClick={() => actions.openModal({ type: 'info' })} tooltip={t('ribbon.tools.infoTooltip')} icon="changelog" iconColorClass="text-purple-400">{t('ribbon.tools.info')}</ActionButton>
                    </>
                );
            default: return null;
        }
    }
    
    return (
        <header className="flex-shrink-0 shadow z-30 bg-zinc-900/80 backdrop-blur-sm transition-colors">
            {/* Hidden file input */}
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />

            {/* Top row with Project Title and Tabs */}
            <div className="flex items-end justify-between border-b px-4 border-zinc-700">
                <div className="flex items-center gap-1">
                    <TabButton tab="home" label={t('ribbon.tabs.home')} />
                    <TabButton tab="nodes" label={t('ribbon.tabs.nodes')} />
                    <TabButton tab="drawing" label={t('ribbon.tabs.drawing')} />
                    <TabButton tab="tools" label={t('ribbon.tabs.tools')} />
                </div>
                <div className="flex items-center pb-1 gap-2">
                     <input
                        key={`${currentProjectId}-${canvasTitle}-${editingMode}-${isFileDirty}`}
                        defaultValue={editingMode === 'file' ? `${canvasTitle}${isFileDirty ? '*' : ''}` : canvasTitle}
                        onBlur={handleTitleBlur}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        className="w-full max-w-xs text-lg font-bold bg-transparent focus:outline-none focus:ring-0 border-none p-0 text-zinc-100 placeholder-zinc-500 text-right"
                        placeholder={t('app.untitled')}
                    />
                    {currentProject && (
                        <button
                            onClick={() => actions.openModal({ type: 'projectIconPicker', projectId: currentProject.id })}
                            title="Cambiar icono del proyecto"
                            className="p-1 rounded-md transition-colors hover:bg-zinc-700"
                        >
                            <Icon icon={currentProject.icon || 'brain'} className="h-6 w-6 text-zinc-300" />
                        </button>
                    )}
                </div>
            </div>

            {/* Ribbon content */}
            <div className="flex items-center gap-1 px-2 py-1">
                {renderContent()}
                <div className="ml-auto flex items-center gap-2">
                    <div ref={languageMenuRef} className="relative">
                        <ActionButton onClick={() => setIsLanguageMenuOpen(p => !p)} tooltip={t('ribbon.languageTooltip')} icon="language" isDropdown>
                            {t('ribbon.language')}
                        </ActionButton>
                        {isLanguageMenuOpen && (
                            <div className={`absolute right-0 top-full mt-1 w-40 rounded-lg shadow-xl border p-2 space-y-1 z-10 ${colors.background}`}>
                                <DropdownMenuItem onClick={() => { actions.setLanguage('es'); setIsLanguageMenuOpen(false); }} icon="spain-flag">Español</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { actions.setLanguage('en'); setIsLanguageMenuOpen(false); }} icon="uk-flag">English</DropdownMenuItem>
                            </div>
                        )}
                    </div>
                    <div ref={exportMenuRef} className="relative">
                        <ActionButton onClick={() => setIsExportMenuOpen(p => !p)} tooltip={t('ribbon.exportTooltip')} icon="download" isDropdown iconColorClass="text-purple-500">{t('ribbon.export')}</ActionButton>
                        {isExportMenuOpen && (
                            <div className={`absolute right-0 top-full mt-1 w-52 rounded-lg shadow-xl border p-2 space-y-1 z-10 ${colors.background}`}>
                                <DropdownMenuItem onClick={() => { actions.exportToFile('json'); setIsExportMenuOpen(false); }} icon="json">{t('ribbon.exportAsJson')}</DropdownMenuItem>
                                <div className={`my-1 h-px ${colors.separator}`}></div>
                                <DropdownMenuItem onClick={() => { actions.exportToHtml(); setIsExportMenuOpen(false); }} icon="html">{t('ribbon.exportAsHtml')}</DropdownMenuItem>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default RibbonToolbar;