/**
 * Application Header & Status Bar
 */
import React from 'react';
import {
  Sparkles,
  FileJson,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Layers,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ExtractedGlyph, LinguisticCategory } from '../types/conlang';

interface HeaderProps {
  glyphs: ExtractedGlyph[];
  mappedKeysCount: number;
  totalSlots: number;
  onOpenExportImport: () => void;
  onReset: () => void;
  onLoadDemoFont: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  glyphs,
  mappedKeysCount,
  totalSlots,
  onOpenExportImport,
  onReset,
  onLoadDemoFont,
}) => {
  // Counts by category
  const silentArticulators = glyphs.filter(
    (g) => g.category === LinguisticCategory.NON_CONTINUOUS_CONSONANT
  ).length;
  const vowels = glyphs.filter((g) => g.category === LinguisticCategory.VOWEL).length;
  const continuousConsonants = glyphs.filter(
    (g) => g.category === LinguisticCategory.CONTINUOUS_CONSONANT
  ).length;
  const modifiers = glyphs.filter(
    (g) =>
      g.category === LinguisticCategory.DURATION_INDICATOR ||
      g.category === LinguisticCategory.PITCH_INDICATOR
  ).length;

  return (
    <header id="app-header" className="h-16 border-b border-[#2A2A2E] flex items-center justify-between px-4 sm:px-6 bg-[#111114] sticky top-0 z-30">
      {/* Brand & Phase Title */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-base shadow-sm">
          U
        </div>
        <div>
          <div className="flex items-center">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#E0E0E0]">
              UniGlyph Studio
            </h1>
            <span className="text-xs font-mono text-indigo-400 ml-2 uppercase hidden sm:inline">
              v1.0.0-phase1
            </span>
          </div>
          <p className="text-[11px] text-[#888] font-sans truncate hidden md:block">
            OTF Vector Extraction & Linguistic Keyboard Mapping Chassis
          </p>
        </div>
      </div>

      {/* Center / Inventory Status Badges */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex gap-2 items-center bg-[#1C1C21] px-3 py-1 rounded-full border border-[#2A2A2E]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Phase 1: Active
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1C1C21] border border-[#2A2A2E] text-xs text-[#E0E0E0]">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-xs">{glyphs.length} Glyphs</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1C1C21] border border-[#2A2A2E] text-xs text-amber-400" title="Non-Continuous Consonants (Silent Articulators)">
          <VolumeX className="w-3.5 h-3.5" />
          <span className="font-mono text-xs">{silentArticulators} Stops</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1C1C21] border border-[#2A2A2E] text-xs text-emerald-400" title="Vowels">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-mono text-xs">{vowels} Vowels</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1C1C21] border border-[#2A2A2E] text-xs text-cyan-400" title="Continuous Consonants">
          <Volume2 className="w-3.5 h-3.5" />
          <span className="font-mono text-xs">{continuousConsonants} Cont.</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1C1C21] border border-[#2A2A2E] text-xs text-purple-400" title="Pitch & Duration Modifiers">
          <Sliders className="w-3.5 h-3.5" />
          <span className="font-mono text-xs">{modifiers} Mods</span>
        </div>
      </div>

      {/* Global Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          id="btn-open-schema-modal"
          type="button"
          onClick={onOpenExportImport}
          className="bg-white text-black hover:bg-slate-200 px-4 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm"
        >
          <FileJson className="w-4 h-4 text-indigo-700" />
          <span>Export Schema</span>
        </button>

        <button
          id="btn-reset-layout"
          type="button"
          onClick={onReset}
          className="p-1.5 rounded bg-[#1C1C21] border border-[#2A2A2E] text-[#888] hover:text-[#E0E0E0] hover:border-[#3A3A3E] transition-colors"
          title="Reset to default canonical dataset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
