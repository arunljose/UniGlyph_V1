/**
 * Extracted Glyphs Pool & Unmapped Explorer
 */
import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Layers,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import {
  ExtractedGlyph,
  LinguisticCategory,
  CATEGORY_DEFINITIONS,
  DurationSubtype,
  PitchLevel,
  PITCH_LEVEL_DEFINITIONS,
} from '../types/conlang';
import { GlyphSvg } from './GlyphSvg';

interface GlyphPoolProps {
  glyphs: ExtractedGlyph[];
  selectedGlyphId: string | null;
  onSelectGlyph: (glyph: ExtractedGlyph) => void;
  onUpdateGlyphCategory: (
    glyphId: string,
    category: LinguisticCategory | null,
    durationSubtype?: DurationSubtype,
    pitchLevel?: PitchLevel
  ) => void;
  onBatchCategorize: (
    glyphIds: string[],
    category: LinguisticCategory,
    durationSubtype?: DurationSubtype,
    pitchLevel?: PitchLevel
  ) => void;
  onAutoMapSequential: () => void;
}

export const GlyphPool: React.FC<GlyphPoolProps> = ({
  glyphs,
  selectedGlyphId,
  onSelectGlyph,
  onUpdateGlyphCategory,
  onBatchCategorize,
  onAutoMapSequential,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [mappingFilter, setMappingFilter] = useState<'all' | 'unmapped' | 'mapped'>('all');
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());
  const [batchCategory, setBatchCategory] = useState<LinguisticCategory>(LinguisticCategory.CONTINUOUS_CONSONANT);
  const [batchDuration, setBatchDuration] = useState<DurationSubtype>('shorter');
  const [batchPitch, setBatchPitch] = useState<PitchLevel>('high');

  // Filter logic
  const filteredGlyphs = glyphs.filter((g) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchChar = g.character?.toLowerCase().includes(q);
      const matchKey = g.mappedKey?.toLowerCase().includes(q);
      const matchIpa = g.ipaSymbol?.toLowerCase().includes(q);
      const matchIndex = g.index.toString() === q;
      if (!matchName && !matchChar && !matchKey && !matchIpa && !matchIndex) return false;
    }

    // Mapping filter
    if (mappingFilter === 'unmapped' && g.mappedKey !== null) return false;
    if (mappingFilter === 'mapped' && g.mappedKey === null) return false;

    // Category filter
    if (categoryFilter === 'uncategorized' && g.category !== null) return false;
    if (categoryFilter !== 'all' && categoryFilter !== 'uncategorized' && g.category !== categoryFilter) return false;

    return true;
  });

  const handleToggleSelectAll = () => {
    if (selectedForBatch.size === filteredGlyphs.length) {
      setSelectedForBatch(new Set());
    } else {
      setSelectedForBatch(new Set(filteredGlyphs.map((g) => g.id)));
    }
  };

  const handleToggleSingle = (glyphId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedForBatch);
    if (next.has(glyphId)) {
      next.delete(glyphId);
    } else {
      next.add(glyphId);
    }
    setSelectedForBatch(next);
  };

  const handleApplyBatchCategorize = () => {
    if (selectedForBatch.size === 0) return;
    onBatchCategorize(
      Array.from(selectedForBatch),
      batchCategory,
      batchCategory === LinguisticCategory.DURATION_INDICATOR ? batchDuration : undefined,
      batchCategory === LinguisticCategory.PITCH_INDICATOR ? batchPitch : undefined
    );
    setSelectedForBatch(new Set());
  };

  const handleDragStart = (e: React.DragEvent, glyph: ExtractedGlyph) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ glyphId: glyph.id, name: glyph.name }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const unmappedCount = glyphs.filter((g) => !g.mappedKey).length;
  const uncategorizedCount = glyphs.filter((g) => !g.category).length;

  return (
    <div id="glyph-pool-section" className="bg-[#111114] rounded-xl border border-[#2A2A2E] p-5 sm:p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2A2E]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-600 text-white text-[11px] font-bold">2</span>
            <h2 className="text-sm sm:text-base font-semibold text-[#E0E0E0] tracking-tight">Extracted Glyphs Pool</h2>
            <span className="text-[10px] font-mono bg-[#1C1C21] border border-[#2A2A2E] text-indigo-400 px-2 py-0.5 rounded">
              {glyphs.length} Found
            </span>
          </div>
          <p className="text-xs text-[#888] mt-0.5">
            Interactive glyph pool. Drag glyphs onto virtual keyboard slots or categorize them into phonetic classes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-auto-map-sequential"
            type="button"
            onClick={onAutoMapSequential}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#E0E0E0] bg-[#1C1C21] hover:bg-[#2A2A2E] border border-[#2A2A2E] rounded transition-colors"
            title="Automatically map unassigned glyphs to empty standard keyboard keys"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            Auto-Map to Keys
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#666] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-glyphs"
              type="text"
              placeholder="Search by name, key, index, or IPA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#2A2A2E] focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs bg-[#0A0A0C] text-[#E0E0E0] placeholder-[#666]"
            />
          </div>

          {/* Mapping status filter */}
          <select
            id="select-mapping-filter"
            value={mappingFilter}
            onChange={(e) => setMappingFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#0A0A0C] text-[#E0E0E0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Keys ({glyphs.length})</option>
            <option value="unmapped">Unmapped ({unmappedCount})</option>
            <option value="mapped">Mapped ({glyphs.length - unmappedCount})</option>
          </select>

          {/* Category filter */}
          <select
            id="select-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#0A0A0C] text-[#E0E0E0] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="uncategorized">Uncategorized ({uncategorizedCount})</option>
            {Object.values(CATEGORY_DEFINITIONS).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Batch action toolbar */}
        {selectedForBatch.size > 0 && (
          <div id="batch-categorization-bar" className="flex items-center gap-2 bg-[#1C1C21] border border-indigo-500/40 px-3 py-1.5 rounded-lg">
            <span className="text-xs font-semibold text-indigo-300">
              {selectedForBatch.size} selected
            </span>
            <span className="text-[#666]">→</span>
            <select
              id="batch-category-select"
              value={batchCategory}
              onChange={(e) => setBatchCategory(e.target.value as LinguisticCategory)}
              className="px-2 py-1 rounded border border-[#2A2A2E] bg-[#0A0A0C] text-[#E0E0E0] text-xs"
            >
              {Object.values(CATEGORY_DEFINITIONS).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {batchCategory === LinguisticCategory.DURATION_INDICATOR && (
              <select
                value={batchDuration}
                onChange={(e) => setBatchDuration(e.target.value as DurationSubtype)}
                className="px-2 py-1 rounded border border-[#2A2A2E] bg-[#0A0A0C] text-xs text-[#E0E0E0]"
              >
                <option value="shorter">Shorter Duration</option>
                <option value="longer">Longer Duration</option>
              </select>
            )}

            {batchCategory === LinguisticCategory.PITCH_INDICATOR && (
              <select
                value={batchPitch}
                onChange={(e) => setBatchPitch(e.target.value as PitchLevel)}
                className="px-2 py-1 rounded border border-[#2A2A2E] bg-[#0A0A0C] text-xs text-[#E0E0E0]"
              >
                {Object.entries(PITCH_LEVEL_DEFINITIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    Level {v.levelNumber}: {v.name} ({v.defaultSemitone > 0 ? `+${v.defaultSemitone}` : v.defaultSemitone}st)
                  </option>
                ))}
              </select>
            )}

            <button
              id="btn-apply-batch-category"
              type="button"
              onClick={handleApplyBatchCategorize}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-xs transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setSelectedForBatch(new Set())}
              className="text-[#888] hover:text-[#E0E0E0] text-xs ml-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Select All Checkbox bar */}
      <div className="flex items-center justify-between py-1.5 px-1 text-xs text-[#888] border-b border-[#2A2A2E]">
        <button
          type="button"
          onClick={handleToggleSelectAll}
          className="inline-flex items-center gap-1.5 hover:text-[#E0E0E0] transition-colors"
        >
          {selectedForBatch.size === filteredGlyphs.length && filteredGlyphs.length > 0 ? (
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Square className="w-3.5 h-3.5 text-[#666]" />
          )}
          <span>Select all in view ({filteredGlyphs.length})</span>
        </button>

        <span className="text-[11px] text-[#666] font-mono">
          Click card to inspect • Drag card to keyboard key slot
        </span>
      </div>

      {/* Glyphs Grid */}
      <div
        id="glyphs-grid-container"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 py-3 overflow-y-auto max-h-[380px] pr-1"
      >
        {filteredGlyphs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-[#888] flex flex-col items-center justify-center">
            <Layers className="w-8 h-8 text-[#666] mb-2" />
            <p className="text-sm font-medium text-[#E0E0E0]">No glyphs match the current filter</p>
            <p className="text-xs text-[#666] mt-1">Try clearing your search query or category filters</p>
          </div>
        ) : (
          filteredGlyphs.map((glyph) => {
            const isSelected = selectedGlyphId === glyph.id;
            const isBatchSelected = selectedForBatch.has(glyph.id);
            const categoryDef = glyph.category ? CATEGORY_DEFINITIONS[glyph.category] : null;

            return (
              <div
                key={glyph.id}
                id={`glyph-card-${glyph.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, glyph)}
                onClick={() => onSelectGlyph(glyph)}
                className={`group relative rounded-xl border p-2.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-150 select-none ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/50 shadow-sm'
                    : isBatchSelected
                    ? 'border-indigo-400/80 bg-[#1C1C21]'
                    : 'border-[#2A2A2E] bg-[#1C1C21] hover:border-indigo-500/70 hover:bg-[#222228]'
                }`}
              >
                {/* Checkbox for batch */}
                <button
                  type="button"
                  onClick={(e) => handleToggleSingle(glyph.id, e)}
                  className="absolute top-1.5 left-1.5 p-0.5 text-[#666] hover:text-indigo-400 z-10"
                >
                  {isBatchSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>

                {/* Mapped Key Badge (Top Right) */}
                <div className="absolute top-1.5 right-1.5">
                  {glyph.mappedKey ? (
                    <span className="px-1.5 py-0.5 rounded bg-[#0A0A0C] border border-[#2A2A2E] text-indigo-300 font-mono text-[10px] font-bold">
                      {glyph.mappedKey.toUpperCase()}
                    </span>
                  ) : (
                    <span className="px-1 py-0.5 rounded bg-[#0A0A0C] text-[#666] font-mono text-[9px]">
                      —
                    </span>
                  )}
                </div>

                {/* Glyph SVG Display */}
                <div className="w-16 h-16 flex items-center justify-center p-1 my-1 text-[#E0E0E0] group-hover:scale-105 group-hover:text-white transition-all">
                  <GlyphSvg glyph={glyph} className="w-full h-full" fill="currentColor" />
                </div>

                {/* Glyph Info & Category Dropdown */}
                <div className="w-full mt-1 pt-1.5 border-t border-[#2A2A2E] text-left">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#888] truncate">
                    <span className="font-semibold text-[#E0E0E0] truncate" title={glyph.name}>
                      {glyph.character || glyph.name}
                    </span>
                    {glyph.ipaSymbol && (
                      <span className="text-indigo-400 font-semibold">{glyph.ipaSymbol}</span>
                    )}
                  </div>

                  {/* Category Pill */}
                  <div className="mt-1.5">
                    {categoryDef ? (
                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center justify-between ${categoryDef.badgeBg} ${categoryDef.badgeText}`}
                        title={`${categoryDef.name}: ${categoryDef.description}`}
                      >
                        <span className="truncate">{categoryDef.shortLabel}</span>
                        {glyph.durationSubtype === 'shorter' && <span>▼</span>}
                        {glyph.durationSubtype === 'longer' && <span>▲</span>}
                        {glyph.pitchLevel && (
                          <span className="text-[9px] font-bold">
                            L{PITCH_LEVEL_DEFINITIONS[glyph.pitchLevel]?.levelNumber}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#0A0A0C] text-[#888] border border-[#2A2A2E] truncate text-center">
                        Uncategorized
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
