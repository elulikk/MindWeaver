

import React, { useState, useMemo } from 'react';
import { Node, Connection, Point, DrawingTool } from '../types';
import { Icon } from './Icon';
import { useMindMapStore } from '../store';

interface ConnectionLineProps {
  fromNode: Node;
  toNode: Node;
  connection: Connection;
  drawingMode: DrawingTool | null;
}

const getPortY = (index: number, total: number, height: number): number => {
    if (total <= 1) return height / 2;
    return (height / (total + 1)) * (index + 1);
};

const PORT_OFFSET = 8; // The port is visually centered 8px outside the node

const WirelessSignalIcon: React.FC<{ color: string }> = ({ color }) => (
    <g stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M 0 -16 A 24 24 0 0 1 0 16" />
        <path d="M 0 -10 A 15 15 0 0 1 0 10" />
        <path d="M 0 -4 A 6 6 0 0 1 0 4" />
    </g>
);


const ConnectionLine: React.FC<ConnectionLineProps> = ({ fromNode, toNode, connection, drawingMode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { actions, contextMenuEnabled } = useMindMapStore(state => ({ 
    actions: state.actions,
    contextMenuEnabled: state.contextMenuEnabled,
  }));
  
  const fromPortIndex = fromNode.outputs.findIndex(p => p.id === connection.fromPortId);
  const toPortIndex = toNode.inputs.findIndex(p => p.id === connection.toPortId);

  // Fallback for cases where a port might have been deleted but connection persists temporarily
  if (fromPortIndex === -1 || toPortIndex === -1) {
      return null;
  }

  const p0 = useMemo(() => ({
    x: fromNode.pos.x + fromNode.size.width + PORT_OFFSET,
    y: fromNode.pos.y + getPortY(fromPortIndex, fromNode.outputs.length, fromNode.size.height),
  }), [fromNode.pos.x, fromNode.pos.y, fromNode.size.width, fromNode.size.height, fromPortIndex, fromNode.outputs.length]);

  const p3 = useMemo(() => ({
    x: toNode.pos.x - PORT_OFFSET,
    y: toNode.pos.y + getPortY(toPortIndex, toNode.inputs.length, toNode.size.height),
  }), [toNode.pos.x, toNode.pos.y, toNode.size.height, toPortIndex, toNode.inputs.length]);
  
  const pathData = useMemo(() => {
    const p1 = { x: p0.x + 60, y: p0.y };
    const p2 = { x: p3.x - 60, y: p3.y };
    return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
  }, [p0, p3]);

  const midPoint = useMemo(() => {
      const t = 0.5;
      const p1 = { x: p0.x + 60, y: p0.y };
      const p2 = { x: p3.x - 60, y: p3.y };
      const px = Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x;
      const py = Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y;
      return { x: px, y: py };
  }, [p0, p3]);
  
  let strokeColor = fromNode.isComplete ? "#22d3ee" : "#fb7185"; // cyan-400 for complete, rose-400 for incomplete
  const highlightColor = "#facc15"; // yellow-400

  const handleContextMenu = (e: React.MouseEvent) => {
      if (!contextMenuEnabled || drawingMode) return;
      e.preventDefault();
      e.stopPropagation();
      actions.openContextMenu({ type: 'connection', targetId: connection, x: e.clientX, y: e.clientY });
  };

  const uniqueMarkerId = `arrowhead-${connection.fromNode}-${connection.fromPortId}-${connection.toNode}-${connection.toPortId}`;

  if (connection.isWireless) {
    const iconColor = isHovered ? highlightColor : strokeColor;
    const commonStyle: React.CSSProperties = {
        transition: 'all 0.2s',
        filter: isHovered ? `drop-shadow(0 0 5px ${iconColor}) drop-shadow(0 0 2px ${iconColor})` : 'none',
    };

    const dx = p3.x - p0.x;
    const dy = p3.y - p0.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return (
        <g 
            className="pointer-events-auto cursor-pointer" 
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)} 
            onContextMenu={handleContextMenu}
        >
            <title>{`Conexión Inalámbrica\nDe: ${fromNode.title}\nA: ${toNode.title}`}</title>
            {/* Emitter */}
            <g transform={`translate(${p0.x}, ${p0.y}) rotate(${angle})`} style={commonStyle}>
                <g transform="translate(12, 0)">
                    <WirelessSignalIcon color={iconColor} />
                </g>
            </g>
            {/* Receiver */}
            <g transform={`translate(${p3.x}, ${p3.y}) rotate(${angle})`} style={commonStyle}>
                 <g transform="translate(-12, 0) rotate(180)">
                    <WirelessSignalIcon color={iconColor} />
                </g>
            </g>
        </g>
    );
  }

  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onContextMenu={handleContextMenu}>
      <path
        d={pathData}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        className="pointer-events-auto cursor-pointer"
      />
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth="2"
        fill="none"
        markerEnd={`url(#${uniqueMarkerId})`}
        style={{ pointerEvents: 'none', transition: 'stroke 0.3s ease' }}
      />
      <defs>
        <marker
            id={uniqueMarkerId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
        >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} style={{ transition: 'fill 0.3s ease' }} />
        </marker>
      </defs>

      <g 
        transform={`translate(${midPoint.x}, ${midPoint.y})`} 
        className="transition-opacity duration-200"
        style={{
            opacity: isHovered && contextMenuEnabled && !drawingMode ? 1 : 0,
            pointerEvents: isHovered && contextMenuEnabled && !drawingMode ? 'auto' : 'none'
        }}
      >
            {/* Insert Node button (+) */}
            <g 
                transform="translate(-16, 0)"
                className="cursor-pointer group" 
                onClick={(e) => { e.stopPropagation(); if (!drawingMode) actions.insertNodeInConnection(connection); }}
            >
                <title>Insertar nodo</title>
                <circle cx="0" cy="0" r="12" fill="#52525b" className="transition-all group-hover:fill-zinc-700" />
                <path d="M -5 0 L 5 0 M 0 -5 L 0 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </g>
            
            {/* Delete connection button (X) */}
            <g 
                transform="translate(16, 0)"
                className="cursor-pointer group" 
                onClick={(e) => { e.stopPropagation(); if (!drawingMode) actions.deleteConnection(connection); }}
            >
                <title>Eliminar conexión</title>
                <circle cx="0" cy="0" r="12" fill="white" className="transition-all group-hover:fill-red-100"/>
                <path d="M -5 -5 L 5 5 M -5 5 L 5 -5" className="stroke-zinc-500 group-hover:stroke-red-600 transition-colors" strokeWidth="2" strokeLinecap="round" />
            </g>
       </g>
    </g>
  );
};

export default React.memo(ConnectionLine);