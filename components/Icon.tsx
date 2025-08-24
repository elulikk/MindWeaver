

import React from 'react';
import { IconType as FileIconType } from '../types';
import { iconRegistry, IconName, nonOutlineIcons, multiColorIcons, customViewBoxIcons, categorizedIcons } from './icons';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: IconName;
}

export const Icon = React.memo<IconProps>(({ icon, className, ...props }) => {
  const path = iconRegistry[icon];
  if (!path) {
      // Return a default "warning" icon if the requested icon doesn't exist.
      const warningPath = iconRegistry['warning'];
      return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className={`h-5 w-5 ${className}`}
            {...props}
          >
              {warningPath}
          </svg>
      );
  }

  if (multiColorIcons.has(icon)) {
      let viewBox = customViewBoxIcons[icon] || "0 0 24 24";
    return (
      <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          className={`h-5 w-5 ${className}`}
          {...props}
      >
          {path}
      </svg>
    );
  }
  
  const viewBox = customViewBoxIcons[icon] || '0 0 24 24';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      fill={nonOutlineIcons.has(icon) ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={icon === 'import' || icon === 'paste' || icon === 'help' ? 1.1 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${className}`}
      {...props}
    >
      {path}
    </svg>
  );
});

// --- DEFINICIÓN DE ICONOS DE ARCHIVO (NUEVO SISTEMA MÁS ROBUSTO) ---

export const iconTypes: FileIconType[] = ['py', 'js', 'html', 'css', 'json', 'bat', 'ps1', 'php', 'cmd', 'txt', 'generic'];

interface FileIconProps extends React.SVGProps<SVGSVGElement> {
  icon: FileIconType;
}

const fileIconData: Record<FileIconType, { label: string; color: string; }> = {
    py: { label: 'PY', color: '#3776AB' },
    js: { label: 'JS', color: '#F7DF1E' },
    html: { label: 'H5', color: '#E34F26' },
    css: { label: 'C3', color: '#1572B6' },
    json: { label: '{}', color: '#F2A83B' },
    bat: { label: 'BAT', color: '#4D4D4D' },
    cmd: { label: 'CMD', color: '#4D4D4D' },
    ps1: { label: 'PS', color: '#012456' },
    php: { label: 'PHP', color: '#777BB4' },
    txt: { label: 'TXT', color: '#888888' },
    generic: { label: '...', color: '#6b7280' }
};

const getTextColorForBg = (hex: string): string => {
    if (!hex) return '#000000';
    // Simple luminance check to decide between black and white text
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 128 ? '#000000' : '#FFFFFF';
};

export const FileIcon = React.memo<FileIconProps>(({ icon, className = "w-6 h-6", ...props }) => {
    const { label, color } = fileIconData[icon] || fileIconData.generic;
    const textColor = getTextColorForBg(color);

    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            {...props}
        >
            {/* Base document shape */}
            <path
                d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                fill={color}
            />
            {/* Folded corner */}
            <path d="M14 2V8H20" fill={color} stroke={textColor} strokeWidth={0.5} opacity="0.6" />
            
            {/* Text Label */}
            <text
                x="50%"
                y="65%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill={textColor}
                fontSize="8"
                fontWeight="bold"
                fontFamily="system-ui, sans-serif"
            >
                {label}
            </text>
        </svg>
    );
});

export { categorizedIcons };