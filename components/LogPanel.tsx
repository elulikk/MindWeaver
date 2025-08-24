

import React, { useRef, useEffect } from 'react';
import { useMindMapStore } from '../store';
import { LogEntry } from '../types';
import { Icon } from './Icon';
import { useTranslations } from './locales/i18n';

const LogPanel: React.FC = () => {
    const t = useTranslations();
    const { logHistory, actions } = useMindMapStore(state => ({
        logHistory: state.logHistory,
        actions: state.actions
    }));
    const panelRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to top on new message
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [logHistory]);

    const getTypeStyles = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return { icon: '✅', color: 'text-green-400' };
            case 'warning':
                return { icon: '⚠️', color: 'text-yellow-400' };
            case 'error':
                return { icon: '❌', color: 'text-red-400' };
            case 'info':
            default:
                return { icon: 'ℹ️', color: 'text-cyan-400' };
        }
    };

    return (
        <div
            ref={panelRef}
            className="fixed bottom-0 left-0 right-0 h-48 flex flex-col z-40 border-t transition-colors bg-zinc-900/90 border-zinc-700 backdrop-blur-md"
        >
            <header className="flex items-center justify-between p-2 border-b border-zinc-700">
                <h3 className="font-semibold text-sm">{t('logPanel.title')}</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={actions.clearLogHistory}
                        title={t('logPanel.clear')}
                        className="p-1.5 rounded-md hover:bg-zinc-700"
                    >
                        <Icon icon="clear" className="h-4 w-4" />
                    </button>
                    <button
                        onClick={actions.toggleLogPanel}
                        title={t('logPanel.hide')}
                        className="p-1.5 rounded-md hover:bg-zinc-700"
                    >
                        <Icon icon="hide" className="h-4 w-4" />
                    </button>
                </div>
            </header>
            <div ref={contentRef} className="flex-grow overflow-y-auto p-2 font-mono text-xs">
                {logHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                        <p>{t('logPanel.empty')}</p>
                    </div>
                ) : (
                    logHistory.map(log => {
                        const { icon, color } = getTypeStyles(log.type);
                        return (
                            <div key={log.id} className="flex items-start gap-2 mb-1 last:mb-0">
                                <span className="flex-shrink-0 mt-0.5">{icon}</span>
                                <span className="flex-shrink-0 text-zinc-500">
                                    [{log.timestamp.toLocaleTimeString()}]
                                </span>
                                <p className={`flex-grow ${color}`}>{log.message}</p>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default LogPanel;