import React, { useRef } from 'react';
import { useMindMapStore } from '../store';
import { Icon } from './Icon';

interface DockablePanelProps {
    panelId: string;
    title: string;
    side: 'left' | 'right';
    children: React.ReactNode;
}

const DockablePanel: React.FC<DockablePanelProps> = ({ panelId, title, side, children }) => {
    const { panelState, setPanelState } = useMindMapStore(state => ({
        panelState: state.panelStates[panelId] || { collapsed: false, pinned: true },
        setPanelState: state.actions.setPanelState,
    }));
    const panelRef = useRef<HTMLElement>(null);

    const toggleCollapse = () => {
        setPanelState(panelId, { collapsed: !panelState.collapsed });
    };

    return (
        <aside
            ref={panelRef}
            className={`relative flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-r bg-zinc-800/70 border-zinc-700/50 ${panelState.collapsed ? 'w-10' : 'w-64'}`}
        >
            <header className={`flex items-center justify-between p-2 h-11 border-b border-zinc-700`}>
                {!panelState.collapsed && (
                    <h2 className="text-sm font-semibold uppercase tracking-wider truncate text-zinc-400 px-2">
                        {title}
                    </h2>
                )}
                 <div className={`flex items-center gap-1 ${panelState.collapsed ? 'flex-col-reverse items-center justify-center w-full' : 'flex-row'}`}>
                    <button
                        onClick={toggleCollapse}
                        className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-700"
                        title={panelState.collapsed ? 'Expandir' : 'Contraer'}
                    >
                        <Icon icon={panelState.collapsed ? 'chevron-right' : 'chevron-left'} className="w-4 h-4" />
                    </button>
                 </div>
            </header>

            <div className={`flex-grow overflow-y-auto overflow-x-hidden transition-opacity duration-200 ${panelState.collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {!panelState.collapsed && children}
            </div>
        </aside>
    );
};

export default DockablePanel;