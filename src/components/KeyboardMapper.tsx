/**
 * Interactive Visual Keyboard Layout & Mapping Interface
 */
import React, { useState } from 'react';
import { KeyboardKeySlot, ExtractedGlyph, CATEGORY_DEFINITIONS, LinguisticCategory } from '../types/conlang';
import { GlyphSvg } from './GlyphSvg';
import { Keyboard, HelpCircle, Shuffle, Trash2, CheckCircle2 } from 'lucide-react';

interface KeyboardMapperProps {
  slots: KeyboardKeySlot[];
  glyphs: ExtractedGlyph[];
  activeSlotId: string | null;
  onSelectSlot: (slot: KeyboardKeySlot) => void;
  onAssignGlyphToSlot: (slotCode: string, glyphId: string | null) => void;
  onClearAllMappings: () => void;
  activePressedKey: string | null;
}

export const KeyboardMapper: React.FC<KeyboardMapperProps> = ({
  slots,
  glyphs,
  activeSlotId,
  onSelectSlot,
  onAssignGlyphToSlot,
  onClearAllMappings,
  activePressedKey,
}) => {
  const [dragOverSlotCode, setDragOverSlotCode] = useState<string | null>(null);

  // Group slots by row
  const rows = [0, 1, 2, 3, 4].map((r) => slots.filter((s) => s.row === r).sort((a, b) => a.col - b.col));

  const glyphMap = new Map<string, ExtractedGlyph>();
  glyphs.forEach((g) => glyphMap.set(g.id, g));

  const handleDragOver = (e: React.DragEvent, slotCode: string) => {
    e.preventDefault();
    setDragOverSlotCode(slotCode);
  };

  const handleDragLeave = () => {
    setDragOverSlotCode(null);
  };

  const handleDrop = (e: React.DragEvent, slotCode: string) => {
    e.preventDefault();
    setDragOverSlotCode(null);
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const { glyphId } = JSON.parse(dataStr);
        if (glyphId) {
          onAssignGlyphToSlot(slotCode, glyphId);
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const mappedCount = slots.filter((s) => s.mappedGlyphId !== null).length;

  return (
    <div id="keyboard-mapper-section" className="bg-[#111114] rounded-xl border border-[#2A2A2E] p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2A2E] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-600 text-white text-[11px] font-bold">3</span>
            <h2 className="text-sm sm:text-base font-semibold text-[#E0E0E0] tracking-tight">Virtual Keyboard Mapping Matrix</h2>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/30">
              {mappedCount} / {slots.length} Assigned
            </span>
          </div>
          <p className="text-xs text-[#888] mt-0.5">
            Interactive hardware key mapping chassis. Drag glyph cards onto keys or click a key to inspect.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-clear-mappings"
            type="button"
            onClick={onClearAllMappings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded border border-rose-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            Clear All Key Mappings
          </button>
        </div>
      </div>

      {/* Category Legend Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-4 text-[11px]">
        <span className="text-[#888] font-mono mr-1">LEGEND:</span>
        {Object.values(CATEGORY_DEFINITIONS).map((cat) => (
          <div
            key={cat.id}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${cat.colorClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            <span>{cat.shortLabel}</span>
          </div>
        ))}
      </div>

      {/* Keyboard Matrix Chassis */}
      <div
        id="keyboard-chassis"
        className="bg-[#0A0A0C] p-4 sm:p-6 rounded-2xl border border-[#2A2A2E] shadow-inner flex flex-col gap-2 select-none overflow-x-auto"
      >
        {rows.map((rowSlots, rowIdx) => (
          <div key={rowIdx} className="flex gap-1.5 sm:gap-2 justify-center min-w-[700px]">
            {rowSlots.map((slot) => {
              const mappedGlyph = slot.mappedGlyphId ? glyphMap.get(slot.mappedGlyphId) : null;
              const isDragOver = dragOverSlotCode === slot.code;
              const isActiveSlot = activeSlotId === slot.id;
              const isPhysicallyPressed =
                activePressedKey &&
                (activePressedKey.toLowerCase() === slot.key.toLowerCase() ||
                  activePressedKey === slot.code);

              const categoryDef = mappedGlyph?.category ? CATEGORY_DEFINITIONS[mappedGlyph.category] : null;

              // Key width multiplier styling
              const widthClass =
                slot.width && slot.width > 7
                  ? 'flex-1 max-w-xl'
                  : slot.width && slot.width > 2
                  ? 'w-24 sm:w-28'
                  : slot.width && slot.width > 1.4
                  ? 'w-16 sm:w-20'
                  : slot.width && slot.width > 1.1
                  ? 'w-14 sm:w-16'
                  : 'w-10 sm:w-12';

              return (
                <div
                  key={slot.id}
                  id={`key-slot-${slot.code}`}
                  onDragOver={(e) => handleDragOver(e, slot.code)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, slot.code)}
                  onClick={() => onSelectSlot(slot)}
                  className={`relative h-14 sm:h-16 ${widthClass} rounded-xl flex flex-col justify-between p-1.5 cursor-pointer transition-all duration-100 ${
                    isPhysicallyPressed
                      ? 'bg-amber-400 text-black scale-95 ring-4 ring-amber-400/50 shadow-lg'
                      : isDragOver
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-400/70 scale-105 z-20'
                      : isActiveSlot
                      ? 'bg-indigo-600 text-white ring-2 ring-white shadow-md z-10'
                      : mappedGlyph
                      ? 'bg-[#1C1C21] hover:bg-[#25252B] text-[#E0E0E0] border border-[#2A2A2E] hover:border-indigo-500/60'
                      : 'bg-[#141418] hover:bg-[#1C1C21] text-[#666] border border-[#222226] hover:border-[#2A2A2E]'
                  }`}
                >
                  {/* Top Key Label */}
                  <div className="flex items-center justify-between w-full text-[10px] font-mono leading-none">
                    <span
                      className={`font-bold ${
                        isPhysicallyPressed
                          ? 'text-black'
                          : isActiveSlot
                          ? 'text-white'
                          : mappedGlyph
                          ? 'text-[#E0E0E0]'
                          : 'text-[#666]'
                      }`}
                    >
                      {slot.displayLabel}
                    </span>

                    {mappedGlyph?.category && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          mappedGlyph.category === LinguisticCategory.NON_CONTINUOUS_CONSONANT
                            ? 'bg-amber-400'
                            : mappedGlyph.category === LinguisticCategory.VOWEL
                            ? 'bg-emerald-400'
                            : mappedGlyph.category === LinguisticCategory.CONTINUOUS_CONSONANT
                            ? 'bg-cyan-400'
                            : mappedGlyph.category === LinguisticCategory.DURATION_INDICATOR
                            ? 'bg-purple-400'
                            : mappedGlyph.category === LinguisticCategory.PITCH_INDICATOR
                            ? 'bg-rose-400'
                            : 'bg-slate-400'
                        }`}
                        title={CATEGORY_DEFINITIONS[mappedGlyph.category].name}
                      />
                    )}
                  </div>

                  {/* Center Glyph Vector Rendering */}
                  <div className="flex-1 flex items-center justify-center p-0.5 overflow-hidden">
                    {mappedGlyph ? (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                        <GlyphSvg
                          glyph={mappedGlyph}
                          className={`w-full h-full ${
                            isPhysicallyPressed
                              ? 'text-black'
                              : isActiveSlot
                              ? 'text-white'
                              : 'text-[#E0E0E0]'
                          }`}
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#444] font-mono italic">
                        {slot.key.trim() ? '—' : ''}
                      </span>
                    )}
                  </div>

                  {/* Bottom Category / Subtype Pill */}
                  <div className="w-full text-center leading-none truncate">
                    {mappedGlyph ? (
                      <span
                        className={`text-[8px] font-mono truncate px-1 py-0.5 rounded ${
                          categoryDef ? categoryDef.badgeBg + ' ' + categoryDef.badgeText : 'text-[#888]'
                        }`}
                      >
                        {mappedGlyph.ipaSymbol || (categoryDef ? categoryDef.shortLabel : 'Glyph')}
                        {mappedGlyph.pitchLevel && ` L${mappedGlyph.pitchLevel.slice(0, 3)}`}
                      </span>
                    ) : (
                      <span className="text-[8px] text-[#444]">empty</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-[#888]">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#666]" />
          <span>Press physical keys on your keyboard to highlight mapped keys in real-time.</span>
        </div>
        <span className="text-[#666] font-mono text-[10px]">UniGlyph Matrix Runtime Engine</span>
      </div>
    </div>
  );
};
