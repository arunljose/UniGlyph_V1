/**
 * Linguistic Categorization Interface & Buckets
 */
import React, { useState } from 'react';
import {
  LinguisticCategory,
  CATEGORY_DEFINITIONS,
  ExtractedGlyph,
  DurationSubtype,
  PitchLevel,
  PITCH_LEVEL_DEFINITIONS,
} from '../types/conlang';
import { GlyphSvg } from './GlyphSvg';
import { Info, Sparkles, VolumeX, Volume2, MicOff, Sliders, Hash } from 'lucide-react';

interface CategoryManagerProps {
  glyphs: ExtractedGlyph[];
  onSelectGlyph: (glyph: ExtractedGlyph) => void;
  onUpdateGlyphCategory: (
    glyphId: string,
    category: LinguisticCategory | null,
    durationSubtype?: DurationSubtype,
    pitchLevel?: PitchLevel
  ) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  glyphs,
  onSelectGlyph,
  onUpdateGlyphCategory,
}) => {
  const [dragOverCategory, setDragOverCategory] = useState<LinguisticCategory | null>(null);

  // Group glyphs by category
  const categorizedMap = new Map<LinguisticCategory, ExtractedGlyph[]>();
  Object.values(LinguisticCategory).forEach((cat) => categorizedMap.set(cat, []));

  const uncategorized: ExtractedGlyph[] = [];

  glyphs.forEach((g) => {
    if (g.category && categorizedMap.has(g.category)) {
      categorizedMap.get(g.category)!.push(g);
    } else {
      uncategorized.push(g);
    }
  });

  const handleDragOver = (e: React.DragEvent, category: LinguisticCategory) => {
    e.preventDefault();
    setDragOverCategory(category);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  const handleDrop = (e: React.DragEvent, category: LinguisticCategory) => {
    e.preventDefault();
    setDragOverCategory(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const { glyphId } = JSON.parse(dataStr);
        if (glyphId) {
          // Default sensible subtypes when dragging into category
          let durationSubtype: DurationSubtype | undefined;
          let pitchLevel: PitchLevel | undefined;

          if (category === LinguisticCategory.DURATION_INDICATOR) {
            durationSubtype = 'longer';
          } else if (category === LinguisticCategory.PITCH_INDICATOR) {
            pitchLevel = 'high';
          }

          onUpdateGlyphCategory(glyphId, category, durationSubtype, pitchLevel);
        }
      }
    } catch (err) {
      console.error('Drop error in category:', err);
    }
  };

  const getCategoryIcon = (category: LinguisticCategory) => {
    switch (category) {
      case LinguisticCategory.CONTINUOUS_CONSONANT:
        return <Volume2 className="w-4 h-4 text-cyan-400" />;
      case LinguisticCategory.NON_CONTINUOUS_CONSONANT:
        return <VolumeX className="w-4 h-4 text-amber-400" />;
      case LinguisticCategory.VOWEL:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case LinguisticCategory.DURATION_INDICATOR:
        return <Sliders className="w-4 h-4 text-purple-400" />;
      case LinguisticCategory.PITCH_INDICATOR:
        return <Sliders className="w-4 h-4 text-rose-400" />;
      case LinguisticCategory.NUMBERS_PUNCTUATION:
        return <Hash className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div id="category-manager-section" className="bg-[#111114] rounded-xl border border-[#2A2A2E] p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2A2E] mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-600 text-white text-[11px] font-bold">4</span>
            <h2 className="text-sm sm:text-base font-semibold text-[#E0E0E0] tracking-tight">Linguistic Category Configuration</h2>
          </div>
          <p className="text-xs text-[#888] mt-0.5">
            UniGlyph language categorizes symbols into 6 operational phonological classes. Drag glyph cards into any bucket below.
          </p>
        </div>

        {uncategorized.length > 0 && (
          <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono">
            {uncategorized.length} glyphs pending classification
          </span>
        )}
      </div>

      {/* Grid of 6 Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.values(CATEGORY_DEFINITIONS).map((def) => {
          const categoryGlyphs = categorizedMap.get(def.id) || [];
          const isDragOver = dragOverCategory === def.id;

          return (
            <div
              key={def.id}
              id={`category-bucket-${def.id}`}
              onDragOver={(e) => handleDragOver(e, def.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, def.id)}
              className={`rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-400 shadow-md'
                  : 'border-[#2A2A2E] bg-[#0A0A0C] hover:border-[#3A3A3E]'
              }`}
            >
              {/* Category Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-[#1C1C21] border border-[#2A2A2E]`}>
                      {getCategoryIcon(def.id)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-[#E0E0E0] leading-snug">{def.name}</h3>
                      <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${def.badgeBg} ${def.badgeText}`}>
                        {def.shortLabel}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-[#1C1C21] border border-[#2A2A2E] text-indigo-400 font-mono text-xs font-bold">
                    {categoryGlyphs.length}
                  </span>
                </div>

                <p className="text-xs text-[#888] mb-3 min-h-[32px] leading-relaxed">
                  {def.description}
                </p>
              </div>

              {/* Dropped Glyphs Gallery */}
              <div
                className={`min-h-[100px] max-h-[140px] overflow-y-auto rounded-lg border border-dashed p-2 flex flex-wrap gap-2 items-start content-start transition-colors ${
                  isDragOver
                    ? 'border-indigo-400 bg-indigo-950/20'
                    : 'border-[#2A2A2E] bg-[#111114]'
                }`}
              >
                {categoryGlyphs.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center py-4 text-[#666]">
                    <span className="text-xs italic">Drop glyphs here to classify</span>
                  </div>
                ) : (
                  categoryGlyphs.map((glyph) => (
                    <div
                      key={glyph.id}
                      onClick={() => onSelectGlyph(glyph)}
                      className={`group relative px-2 py-1.5 rounded-lg border bg-[#1C1C21] hover:border-indigo-500 hover:bg-[#25252B] cursor-pointer flex items-center gap-2 transition-all ${
                        def.borderClass
                      }`}
                      title={`Click to inspect ${glyph.name}`}
                    >
                      <div className="w-6 h-6 text-[#E0E0E0]">
                        <GlyphSvg glyph={glyph} fill="currentColor" />
                      </div>
                      <div className="text-[11px] font-mono leading-tight">
                        <div className="font-bold text-[#E0E0E0]">{glyph.mappedKey?.toUpperCase() || glyph.name}</div>
                        {glyph.ipaSymbol && <div className="text-indigo-400 text-[10px]">{glyph.ipaSymbol}</div>}
                      </div>

                      {/* Subtype Badge for Pitch & Duration */}
                      {def.id === LinguisticCategory.PITCH_INDICATOR && glyph.pitchLevel && (
                        <span className="text-[9px] font-bold px-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {PITCH_LEVEL_DEFINITIONS[glyph.pitchLevel]?.symbol || 'L' + PITCH_LEVEL_DEFINITIONS[glyph.pitchLevel]?.levelNumber}
                        </span>
                      )}
                      {def.id === LinguisticCategory.DURATION_INDICATOR && (
                        <span className="text-[9px] font-bold px-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {glyph.durationSubtype === 'shorter' ? '▼ 0.5x' : '▲ 2.0x'}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
