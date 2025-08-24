import React from 'react';
import { CanvasObject, CanvasObjectShape, CanvasObjectLine, CanvasObjectText, DrawingTool, AppActions, CanvasObjectResizeHandle } from '../types';

interface CanvasObjectLayerProps {
    objects: CanvasObject[];
    tempObject: CanvasObject | null;
    selectedObjectIds: Set<string>;
    drawingMode: DrawingTool | null;
    actions: AppActions;
}

const CanvasObjectComponent: React.FC<{ object: CanvasObject; isSelected: boolean, drawingMode: DrawingTool | null, actions: AppActions }> = ({ object, isSelected, drawingMode, actions }) => {
    const isEditMode = drawingMode === 'edit';
    const objectCursor = isEditMode ? 'move' : 'default';

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditMode) {
            actions.handleMouseDown(e);
        }
    }

    switch (object.type) {
        case 'rect': {
            const shape = object as CanvasObjectShape;
            const isSwarm = !!shape.isSwarm;
            const titleBarHeight = isSwarm ? 12 : 0;
            const commonProps = {
                stroke: shape.strokeColor,
                strokeWidth: shape.strokeWidth,
                fill: shape.fillColor,
                fillOpacity: shape.fillOpacity,
                strokeOpacity: shape.strokeOpacity,
            };

            return (
                <g>
                    <rect
                        x={shape.pos.x} y={shape.pos.y}
                        width={shape.size.width} height={shape.size.height}
                        {...commonProps}
                        style={{ cursor: isSwarm ? 'default' : objectCursor }}
                        data-object-id={shape.id}
                        onMouseDown={!isSwarm ? handleMouseDown : undefined}
                    />
                    {isSwarm && (
                        <rect
                            x={shape.pos.x} y={shape.pos.y}
                            width={shape.size.width} height={titleBarHeight}
                            fill={shape.strokeColor}
                            fillOpacity={0.7}
                            stroke="none"
                            style={{ cursor: 'move' }}
                            data-object-id={shape.id}
                            onMouseDown={handleMouseDown}
                        />
                    )}
                </g>
            );
        }
        case 'ellipse': {
            const shape = object as CanvasObjectShape;
            const commonProps = {
                stroke: shape.strokeColor,
                strokeWidth: shape.strokeWidth,
                fill: shape.fillColor,
                fillOpacity: shape.fillOpacity,
                strokeOpacity: shape.strokeOpacity,
                'data-object-id': shape.id,
                onMouseDown: handleMouseDown,
                style: { cursor: objectCursor },
            };
            return <ellipse cx={shape.pos.x + shape.size.width / 2} cy={shape.pos.y + shape.size.height / 2} rx={shape.size.width / 2} ry={shape.size.height / 2} {...commonProps} />;
        }
        case 'line': {
            const line = object as CanvasObjectLine;
            return (
                <g data-object-id={line.id} onMouseDown={handleMouseDown} style={{ cursor: objectCursor }}>
                    {/* Wider transparent line for easier selection */}
                    <line x1={line.start.x} y1={line.start.y} x2={line.end.x} y2={line.end.y} stroke="transparent" strokeWidth="12" />
                    <line 
                        x1={line.start.x} y1={line.start.y} 
                        x2={line.end.x} y2={line.end.y} 
                        stroke={line.strokeColor} 
                        strokeWidth={line.strokeWidth} 
                        strokeLinecap="round" 
                        strokeOpacity={line.strokeOpacity}
                        markerStart={line.startArrow ? 'url(#arrowhead)' : ''}
                        markerEnd={line.endArrow ? 'url(#arrowhead)' : ''}
                    />
                </g>
            );
        }
        case 'text': {
            const text = object as CanvasObjectText;
            // foreignObject is needed for text wrapping.
            return (
                <foreignObject x={text.pos.x} y={text.pos.y} width={text.width} height={text.height} data-object-id={text.id} onMouseDown={handleMouseDown} style={{ cursor: objectCursor, overflow: 'visible' }}>
                    <div
                        style={{
                            fontSize: `${text.fontSize}px`,
                            color: text.color,
                            width: '100%',
                            height: '100%',
                            wordWrap: 'break-word',
                            pointerEvents: 'none', // Inner div should not capture events
                            textAlign: text.textAlign || 'left',
                        }}
                        dangerouslySetInnerHTML={{ __html: text.text }}
                    />
                </foreignObject>
            );
        }
        default:
            return null;
    }
};

const getBoundingBox = (object: CanvasObject): { x: number; y: number; width: number; height: number } => {
    switch (object.type) {
        case 'rect':
        case 'ellipse':
        case 'text':
            return { x: object.pos.x, y: object.pos.y, width: (object as any).size?.width || (object as any).width, height: (object as any).size?.height || (object as any).height };
        case 'line':
            const line = object as CanvasObjectLine;
            const x = Math.min(line.start.x, line.end.x);
            const y = Math.min(line.start.y, line.end.y);
            const width = Math.abs(line.start.x - line.end.x);
            const height = Math.abs(line.start.y - line.end.y);
            return { x, y, width, height };
        default:
            return { x: 0, y: 0, width: 0, height: 0 };
    }
};

const ResizeHandle: React.FC<{ x: number, y: number, cursor: string, handleType: CanvasObjectResizeHandle, onMouseDown: (e: React.MouseEvent) => void }> = ({ x, y, cursor, handleType, onMouseDown }) => (
    <rect 
        x={x - 4} y={y - 4} 
        width="8" height="8" 
        fill="#22d3ee" stroke="white" strokeWidth="1" 
        style={{ cursor }}
        data-handle-type={handleType}
        onMouseDown={onMouseDown}
    />
);

const SelectionHandles: React.FC<{ object: CanvasObject, onMouseDown: (e: React.MouseEvent) => void }> = ({ object, onMouseDown }) => {
    const box = getBoundingBox(object);
    const { x, y, width, height } = box;
    
    if (object.type === 'line') {
        return <>
            <ResizeHandle x={object.start.x} y={object.start.y} cursor="nwse-resize" handleType="sw" onMouseDown={onMouseDown} />
            <ResizeHandle x={object.end.x} y={object.end.y} cursor="nwse-resize" handleType="ne" onMouseDown={onMouseDown} />
        </>
    }

    return <>
        <ResizeHandle x={x} y={y} cursor="nwse-resize" handleType="nw" onMouseDown={onMouseDown}/>
        <ResizeHandle x={x + width / 2} y={y} cursor="ns-resize" handleType="n" onMouseDown={onMouseDown}/>
        <ResizeHandle x={x + width} y={y} cursor="nesw-resize" handleType="ne" onMouseDown={onMouseDown}/>
        <ResizeHandle x={x + width} y={y + height / 2} cursor="ew-resize" handleType="e" onMouseDown={onMouseDown}/>
        <ResizeHandle x={x + width} y={y + height} cursor="nwse-resize" handleType="se" onMouseDown={onMouseDown}/>
        <ResizeHandle x={x + width / 2} y={y + height} cursor="ns-resize" handleType="s" onMouseDown={onMouseDown}/>
        <ResizeHandle x={x} y={y + height} cursor="nesw-resize" handleType="sw" onMouseDown={onMouseDown}/>
        <ResizeHandle x={x} y={y + height / 2} cursor="ew-resize" handleType="w" onMouseDown={onMouseDown}/>
    </>
};

const CanvasObjectLayer: React.FC<CanvasObjectLayerProps> = ({ objects, tempObject, selectedObjectIds, drawingMode, actions }) => {
    return (
        <g>
            <defs>
                <marker
                    id="arrowhead"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                    fill="currentColor"
                >
                    <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
            </defs>
            <g className="canvas-objects" style={{ pointerEvents: drawingMode === 'edit' || drawingMode === null ? 'auto' : 'none' }}>
                {objects.map(obj => <CanvasObjectComponent key={obj.id} object={obj} isSelected={selectedObjectIds.has(obj.id)} drawingMode={drawingMode} actions={actions} />)}
            </g>
            {tempObject && (
                <g className="canvas-temp-object" style={{ pointerEvents: 'none' }}>
                    <CanvasObjectComponent object={tempObject} isSelected={false} drawingMode={drawingMode} actions={actions}/>
                </g>
            )}
            {drawingMode === 'edit' && selectedObjectIds.size > 0 && (
                <g className="canvas-object-selections" style={{ pointerEvents: 'auto' }}>
                    {objects.filter(o => selectedObjectIds.has(o.id)).map(obj => {
                        const box = getBoundingBox(obj);
                        return (
                            <g key={`sel-${obj.id}`} data-object-id={obj.id}>
                                <rect {...box} fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" style={{ pointerEvents: 'none' }} />
                                <SelectionHandles object={obj} onMouseDown={(e) => actions.handleMouseDown(e)} />
                            </g>
                        );
                    })}
                </g>
            )}
        </g>
    );
};

export default React.memo(CanvasObjectLayer);