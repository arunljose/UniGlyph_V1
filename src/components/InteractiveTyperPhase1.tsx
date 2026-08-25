/**
 * Live UniGlyph Interactive Typing Sandbox & Syntax Inspector
 */
import React, { useState } from 'react';
import {
  ExtractedGlyph,
  LinguisticCategory,
  CATEGORY_DEFINITIONS,
  PITCH_LEVEL_DEFINITIONS,
} from '../types/conlang';
import { GlyphSvg } from './GlyphSvg';
import { Type, Sparkles, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface InteractiveTyperProps {
  glyphs: ExtractedGlyph[];
  typedSequence: string;
  onTypedSequenceChange: (seq: string) => void;
  onClearSequence: () => void;
}

export const InteractiveTyperPhase1: React.FC<InteractiveTyperProps> = ({
  glyphs,
  typedSequence,
  onTypedSequenceChange,
  onClearSequence,
}) => {
  // Build lookup map key -> glyph
  const keyToGlyphMap = new Map<string, ExtractedGlyph>();
  glyphs.forEach((g) => {
    if (g.mappedKey) {
      keyToGlyphMap.set(g.mappedKey.toLowerCase(), g);
    }
  });

  // Parse typed characters into glyph objects
  const parsedGlyphs: Array<{ char: string; glyph: ExtractedGlyph | null }> = [];
  for (const char of typedSequence) {
    const glyph = keyToGlyphMap.get(char.toLowerCase()) || null;
    parsedGlyphs.push({ char, glyph });
  }

  // Linguistic word analysis
  const words = typedSequence.split(' ');

  return (
    <div id="interactive-typer-sandbox" className="bg-[#111114] rounded-xl border border-[#2A2A2E] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2A2E] mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-600 text-white text-[11px] font-bold">5</span>
            <h2 className="text-sm sm:text-base font-semibold text-[#E0E0E0] tracking-tight">Live UniGlyph Script Test Sandbox</h2>
          </div>
          <p className="text-xs text-[#888] mt-0.5">
            Type using your keyboard or click virtual keys to see glyph rendering and phonological sequence parsing.
          </p>
        </div>

        {typedSequence.length > 0 && (
          <button
            type="button"
            onClick={onClearSequence}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#888] hover:text-[#E0E0E0] bg-[#1C1C21] hover:bg-[#25252B] border border-[#2A2A2E] rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Text
          </button>
        )}
      </div>

      {/* Input box for raw typing */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-[#888] mb-1.5">
          Type mapped characters (e.g., <code className="font-mono text-indigo-400 bg-[#1C1C21] border border-[#2A2A2E] px-1.5 py-0.5 rounded">p a 4 +</code> or <code className="font-mono text-indigo-400 bg-[#1C1C21] border border-[#2A2A2E] px-1.5 py-0.5 rounded">k e 1 -</code>):
        </label>
        <input
          id="sandbox-typing-input"
          type="text"
          placeholder="Start typing mapped keys here..."
          value={typedSequence}
          onChange={(e) => onTypedSequenceChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#2A2A2E] font-mono text-sm sm:text-base text-[#E0E0E0] focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-[#0A0A0C] placeholder-[#666]"
        />
      </div>

      {/* Script Rendering Screen (Large Vector UniGlyph Display) */}
      <div className="bg-[#0A0A0C] rounded-2xl p-6 border border-[#2A2A2E] shadow-inner mb-4 min-h-[140px] flex flex-col justify-center">
        {parsedGlyphs.length === 0 ? (
          <div className="text-center text-[#666] py-6 font-mono text-xs">
            <p className="text-[#888]">UniGlyph Script Visualizer Screen</p>
            <p className="text-[11px] text-[#666] mt-1">
              Characters typed above will render in extracted native vector glyphs below
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {parsedGlyphs.map((item, idx) => {
              if (item.char === ' ') {
                return (
                  <div
                    key={idx}
                    className="w-8 h-12 flex items-center justify-center border-b-2 border-[#2A2A2E] mx-1"
                    title="Word Boundary Space"
                  >
                    <span className="text-[#666] text-xs font-mono">␣</span>
                  </div>
                );
              }

              const categoryDef = item.glyph?.category ? CATEGORY_DEFINITIONS[item.glyph.category] : null;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center bg-[#1C1C21] border border-[#2A2A2E] rounded-xl p-2 min-w-[50px] group relative hover:border-indigo-500 transition-colors"
                >
                  <div className="w-10 h-10 flex items-center justify-center text-[#E0E0E0]">
                    <GlyphSvg glyph={item.glyph} className="w-full h-full" fill="currentColor" />
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#888]">
                    <span className="font-bold text-[#E0E0E0]">{item.char.toUpperCase()}</span>
                    {item.glyph?.ipaSymbol && (
                      <span className="text-indigo-400">{item.glyph.ipaSymbol}</span>
                    )}
                  </div>

                  {/* Tiny Category Pip */}
                  {categoryDef && (
                    <div
                      className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#0A0A0C] ${
                        item.glyph?.category === LinguisticCategory.NON_CONTINUOUS_CONSONANT
                          ? 'bg-amber-400'
                          : item.glyph?.category === LinguisticCategory.VOWEL
                          ? 'bg-emerald-400'
                          : item.glyph?.category === LinguisticCategory.CONTINUOUS_CONSONANT
                          ? 'bg-cyan-400'
                          : item.glyph?.category === LinguisticCategory.DURATION_INDICATOR
                          ? 'bg-purple-400'
                          : item.glyph?.category === LinguisticCategory.PITCH_INDICATOR
                          ? 'bg-rose-400'
                          : 'bg-slate-400'
                      }`}
                      title={categoryDef.name}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Phonological Rule Parse Breakdown */}
      {parsedGlyphs.length > 0 && (
        <div className="bg-[#0A0A0C] rounded-xl border border-[#2A2A2E] p-4">
          <h4 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Linguistic Structural Breakdown (UniGlyph Rule Verification)
          </h4>

          <div className="space-y-2">
            {words.map((word, wIdx) => {
              const wordChars = word.split('');
              const wordGlyphs = wordChars.map((c) => keyToGlyphMap.get(c.toLowerCase()) || null);

              // Check if starts with non-continuous consonant followed by vowel
              const hasSilentStop = wordGlyphs[0]?.category === LinguisticCategory.NON_CONTINUOUS_CONSONANT;
              const nextIsVowel = wordGlyphs[1]?.category === LinguisticCategory.VOWEL;

              return (
                <div
                  key={wIdx}
                  className="p-3 bg-[#111114] rounded-lg border border-[#2A2A2E] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-1.5 font-mono">
                    <span className="font-bold text-[#E0E0E0] bg-[#1C1C21] border border-[#2A2A2E] px-2 py-0.5 rounded">
                      Word #{wIdx + 1}: "{word}"
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#666]" />
                    {wordGlyphs.map((g, gIdx) => {
                      if (!g) {
                        return (
                          <span key={gIdx} className="px-1.5 py-0.5 rounded bg-[#1C1C21] text-[#666] border border-[#2A2A2E]">
                            [Unmapped: '{wordChars[gIdx]}']
                          </span>
                        );
                      }

                      const def = g.category ? CATEGORY_DEFINITIONS[g.category] : null;
                      return (
                        <span
                          key={gIdx}
                          className={`px-1.5 py-0.5 rounded font-medium border ${
                            def ? def.badgeBg + ' ' + def.badgeText + ' ' + def.colorClass : 'bg-[#1C1C21] text-[#888] border-[#2A2A2E]'
                          }`}
                        >
                          {g.category === LinguisticCategory.NON_CONTINUOUS_CONSONANT
                            ? `[Silent Stop: ${g.mappedKey?.toUpperCase()}]`
                            : g.category === LinguisticCategory.VOWEL
                            ? `[Vowel: ${g.mappedKey?.toUpperCase()}]`
                            : g.category === LinguisticCategory.DURATION_INDICATOR
                            ? `[Dur: ${g.durationSubtype}]`
                            : g.category === LinguisticCategory.PITCH_INDICATOR
                            ? `[Pitch: ${g.pitchLevel ? PITCH_LEVEL_DEFINITIONS[g.pitchLevel]?.name : 'Mod'}]`
                            : `[${def?.shortLabel || 'Glyph'}: ${g.mappedKey?.toUpperCase()}]`}
                        </span>
                      );
                    })}
                  </div>

                  {/* Linguistic Rule Notes */}
                  {hasSilentStop && (
                    <div className="text-[11px] text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-500/30 shrink-0 font-mono">
                      {nextIsVowel ? (
                        <span>✓ Silent articulator shapes mouth; releases into following vowel</span>
                      ) : (
                        <span>⚠ Silent articulator has no trailing vowel air release</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
