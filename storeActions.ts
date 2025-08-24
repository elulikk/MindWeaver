
import { MindMapState, AppActions } from './types';

import { createStateActions } from './storeActionsState';
import { createProjectActions } from './storeActionsProject';
import { createNodeActions } from './storeActionsNode';
import { createConnectionActions } from './storeActionsConnection';
import { createMininodeActions } from './storeActionsMininode';
import { createClipboardActions } from './storeActionsClipboard';
import { createHistoryActions } from './storeActionsHistory';
import { createUIActions } from './storeActionsUI';
import { createIOActions } from './storeActionsIO';
import { createAIActions } from './storeActionsAI';
import { createCanvasViewActions } from './storeActionsCanvasView';
import { createDrawingActions } from './storeActionsDrawing';

type SetState = (partial: Partial<MindMapState> | ((state: MindMapState) => Partial<MindMapState>)) => void;
type GetState = () => MindMapState;

export const createActions = (set: SetState, get: GetState): AppActions => {
    return {
        // Each function returns a slice of the total actions object
        ...createStateActions(set, get),
        ...createProjectActions(set, get),
        ...createNodeActions(set, get),
        ...createConnectionActions(set, get),
        ...createMininodeActions(set, get),
        ...createClipboardActions(set, get),
        ...createHistoryActions(set, get),
        ...createUIActions(set, get),
        ...createIOActions(set, get),
        ...createAIActions(set, get),
        ...createCanvasViewActions(set, get),
        ...createDrawingActions(set, get),
    };
};
