/**
 * Vector SVG Glyph Renderer
 */
import React from 'react';
import { ExtractedGlyph } from '../types/conlang';

interface GlyphSvgProps {
  glyph: ExtractedGlyph | null | undefined;
  className?: string;
  fill?: string;
  stroke?: string;
  size?: number | string;
  showBoundingBox?: boolean;
}

export const GlyphSvg: React.FC<GlyphSvgProps> = ({
  glyph,
  className = 'w-full h-full',
  fill = 'currentColor',
  stroke,
  size,
  showBoundingBox = false,
}) => {
  if (!glyph) {
    return (
      <div className={`flex items-center justify-center text-slate-300 font-mono text-xs ${className}`}>
        ∅
      </div>
    );
  }

  const viewBox = glyph.svgViewBox || '0 0 1000 1000';

  return (
    <svg
      viewBox={viewBox}
      className={`inline-block select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      {showBoundingBox && glyph.bbox && (
        <rect
          x={glyph.bbox.x1}
          y={glyph.bbox.y1}
          width={Math.max(10, glyph.bbox.x2 - glyph.bbox.x1)}
          height={Math.max(10, glyph.bbox.y2 - glyph.bbox.y1)}
          fill="none"
          stroke="rgba(148, 163, 184, 0.4)"
          strokeWidth="4"
          strokeDasharray="8 8"
        />
      )}
      <path
        d={glyph.svgPathData}
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? 2 : 0}
        fillRule="evenodd"
      />
    </svg>
  );
};
