/**
 * Detailed Glyph & Linguistic Properties Inspector Modal
 */
import React, { useState, useEffect } from 'react';
import {
  ExtractedGlyph,
  LinguisticCategory,
  CATEGORY_DEFINITIONS,
  DurationSubtype,
  PitchLevel,
  PITCH_LEVEL_DEFINITIONS,
  KeyboardKeySlot,
} from '../types/conlang';
import { GlyphSvg } from './GlyphSvg';
import { X, Check, VolumeX, Volume2, Sliders, Hash, Info, Layers, Tag } from 'lucide-react';

interface GlyphInspectorModalProps {
  glyph: ExtractedGlyph | null;
  slots: KeyboardKeySlot[];
  isOpen: boolean;
  onClose: () => void;
  onSaveGlyph: (updatedGlyph: ExtractedGlyph) => void;
}

export const GlyphInspectorModal: React.FC<GlyphInspectorModalProps> = ({
  glyph,
  slots,
  isOpen,
  onClose,
  onSaveGlyph,
}) => {
  if (!isOpen || !glyph) return null;

  const [category, setCategory] = useState<LinguisticCategory | null>(glyph.category);
  const [durationSubtype, setDurationSubtype] = useState<DurationSubtype | undefined>(glyph.durationSubtype);
  const [pitchLevel, setPitchLevel] = useState<PitchLevel | undefined>(glyph.pitchLevel || 'high');
  const [mappedKey, setMappedKey] = useState<string>(glyph.mappedKey || '');
  const [ipaSymbol, setIpaSymbol] = useState<string>(glyph.ipaSymbol || '');
  const [articulatorNote, setArticulatorNote] = useState<string>(glyph.articulatorNote || '');
  const [description, setDescription] = useState<string>(glyph.description || '');

  useEffect(() => {
    setCategory(glyph.category);
    setDurationSubtype(glyph.durationSubtype);
    setPitchLevel(glyph.pitchLevel || 'high');
    setMappedKey(glyph.mappedKey || '');
    setIpaSymbol(glyph.ipaSymbol || '');
    setArticulatorNote(glyph.articulatorNote || '');
    setDescription(glyph.description || '');
  }, [glyph]);

  const handleSave = () => {
    onSaveGlyph({
      ...glyph,
      category,
      durationSubtype: category === LinguisticCategory.DURATION_INDICATOR ? (durationSubtype || 'shorter') : undefined,
      pitchLevel: category === LinguisticCategory.PITCH_INDICATOR ? (pitchLevel || 'high') : undefined,
      mappedKey: mappedKey.trim() ? mappedKey.trim().toLowerCase() : null,
      ipaSymbol: ipaSymbol.trim() || undefined,
      articulatorNote: articulatorNote.trim() || undefined,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const categoryDef = category ? CATEGORY_DEFINITIONS[category] : null;

  return (
    <div
      id="glyph-inspector-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="glyph-inspector-modal"
        className="bg-[#111114] rounded-2xl border border-[#2A2A2E] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#E0E0E0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E] bg-[#1C1C21]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono">
              #{glyph.index}
            </div>
            <div>
              <h3 className="font-semibold text-[#E0E0E0] text-sm sm:text-base flex items-center gap-2">
                {glyph.name}
                {glyph.character && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0A0A0C] border border-[#2A2A2E] text-indigo-400">
                    '{glyph.character}' (U+{glyph.unicode?.toString(16).toUpperCase()})
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#888] font-mono">ID: {glyph.id}</p>
            </div>
          </div>

          <button
            id="btn-close-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888] hover:text-[#E0E0E0] hover:bg-[#2A2A2E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Large Vector Display & Metrics */}
          <div className="md:col-span-5 flex flex-col items-center gap-4 bg-[#0A0A0C] p-4 rounded-xl border border-[#2A2A2E]">
            <div className="w-40 h-40 bg-[#111114] rounded-xl border border-[#2A2A2E] p-4 flex items-center justify-center relative text-[#E0E0E0]">
              <GlyphSvg glyph={glyph} className="w-full h-full" fill="currentColor" showBoundingBox={true} />
              <span className="absolute bottom-1 right-2 text-[10px] text-[#666] font-mono">Vector Box</span>
            </div>

            {/* Metrics List */}
            <div className="w-full text-xs space-y-1.5 font-mono text-[#888] bg-[#111114] p-3 rounded-lg border border-[#2A2A2E]">
              <div className="flex justify-between">
                <span className="text-[#666]">Advance Width:</span>
                <span className="font-semibold text-[#E0E0E0]">{glyph.advanceWidth}</span>
              </div>
              {glyph.bbox && (
                <div className="flex justify-between">
                  <span className="text-[#666]">BBox:</span>
                  <span className="font-semibold text-[#E0E0E0]">
                    [{glyph.bbox.x1}, {glyph.bbox.y1}] → [{glyph.bbox.x2}, {glyph.bbox.y2}]
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#666]">Glyph Index:</span>
                <span className="font-semibold text-[#E0E0E0]">{glyph.index}</span>
              </div>
            </div>

            {/* Phase 2 Audio Ingestion Preview Rule */}
            <div className="w-full p-2.5 rounded-lg border border-[#2A2A2E] bg-[#111114] text-xs">
              <span className="font-semibold block mb-1 text-[#888]">Phase 2 Audio Rule:</span>
              {categoryDef?.acceptsAudio ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio upload enabled (Acoustic carrier)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Audio upload blocked (Inherently silent stop)</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Linguistic Properties & Configuration */}
          <div className="md:col-span-7 flex flex-col gap-4 text-xs">
            {/* Category Selector */}
            <div>
              <label className="block font-medium text-[#888] mb-1">Linguistic Classification</label>
              <select
                id="select-glyph-category"
                value={category || ''}
                onChange={(e) => setCategory((e.target.value as LinguisticCategory) || null)}
                className="w-full px-3 py-2 rounded-lg border border-[#2A2A2E] bg-[#0A0A0C] text-[#E0E0E0] font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">-- Uncategorized --</option>
                {Object.values(CATEGORY_DEFINITIONS).map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subtype for Duration */}
            {category === LinguisticCategory.DURATION_INDICATOR && (
              <div className="p-3 rounded-lg bg-[#0A0A0C] border border-purple-500/30">
                <label className="block font-medium text-purple-400 mb-1.5">Duration Modifier Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationSubtype('shorter')}
                    className={`py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                      durationSubtype === 'shorter'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-[#1C1C21] text-purple-300 border-[#2A2A2E] hover:bg-[#25252B]'
                    }`}
                  >
                    <span>▼ Shorter Duration</span>
                    <span className="font-mono text-[10px]">(0.5x)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationSubtype('longer')}
                    className={`py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                      durationSubtype === 'longer'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-[#1C1C21] text-purple-300 border-[#2A2A2E] hover:bg-[#25252B]'
                    }`}
                  >
                    <span>▲ Longer Duration</span>
                    <span className="font-mono text-[10px]">(2.0x)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Subtype for Pitch (6 distinct levels) */}
            {category === LinguisticCategory.PITCH_INDICATOR && (
              <div className="p-3 rounded-lg bg-[#0A0A0C] border border-rose-500/30">
                <label className="block font-medium text-rose-400 mb-1.5">
                  Pitch Level Specification (6 Distinct Levels)
                </label>
                <select
                  value={pitchLevel}
                  onChange={(e) => setPitchLevel(e.target.value as PitchLevel)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#1C1C21] text-rose-300 font-medium"
                >
                  {Object.entries(PITCH_LEVEL_DEFINITIONS).map(([key, val]) => (
                    <option key={key} value={key}>
                      Level {val.levelNumber}: {val.name} ({val.defaultSemitone > 0 ? `+${val.defaultSemitone}` : val.defaultSemitone} semitones) [{val.symbol}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Key Mapping */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#888] mb-1">Mapped Keyboard Key</label>
                <input
                  id="input-mapped-key"
                  type="text"
                  maxLength={1}
                  placeholder="e.g. q, a, 1, -"
                  value={mappedKey}
                  onChange={(e) => setMappedKey(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#0A0A0C] font-mono text-center uppercase font-bold text-[#E0E0E0] focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-[#888] mb-1">IPA Phoneme Representation</label>
                <input
                  id="input-ipa-symbol"
                  type="text"
                  placeholder="e.g. /a/, [k], /m/"
                  value={ipaSymbol}
                  onChange={(e) => setIpaSymbol(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#0A0A0C] font-mono text-[#E0E0E0] focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Articulator Notes */}
            <div>
              <label className="block font-medium text-[#888] mb-1">
                Linguistic / Articulatory Notes
              </label>
              <input
                id="input-articulator-notes"
                type="text"
                placeholder="e.g. Bilabial stop closure; releases into following vowel"
                value={articulatorNote}
                onChange={(e) => setArticulatorNote(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#0A0A0C] text-[#E0E0E0] focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block font-medium text-[#888] mb-1">Phonological Description</label>
              <textarea
                id="textarea-description"
                rows={2}
                placeholder="Describe how this glyph behaves in the UniGlyph syntax..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-[#2A2A2E] bg-[#0A0A0C] text-[#E0E0E0] focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#2A2A2E] bg-[#1C1C21]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-[#888] hover:text-[#E0E0E0] hover:bg-[#2A2A2E] text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-save-glyph-changes"
            type="button"
            onClick={handleSave}
            className="bg-white text-black hover:bg-slate-200 px-4 py-2 rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
