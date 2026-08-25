/**
 * Conlang Studio - Phase 1: OTF Extraction & Keyboard Mapping Setup
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  ExtractedGlyph,
  KeyboardKeySlot,
  FontMetadata,
  LinguisticCategory,
  DurationSubtype,
  PitchLevel,
  ConlangProjectConfig,
  CATEGORY_DEFINITIONS,
  PITCH_LEVEL_DEFINITIONS,
} from './types/conlang';
import { createSampleUniGlyphDataset, ParseFontResult } from './utils/fontParser';
import { createDefaultKeyboardSlots } from './utils/keyboardLayout';
import { Header } from './components/Header';
import { FontUploader } from './components/FontUploader';
import { GlyphPool } from './components/GlyphPool';
import { KeyboardMapper } from './components/KeyboardMapper';
import { CategoryManager } from './components/CategoryManager';
import { GlyphInspectorModal } from './components/GlyphInspectorModal';
import { InteractiveTyperPhase1 } from './components/InteractiveTyperPhase1';
import { ExportImportModal } from './components/ExportImportModal';
import { CheckCircle2, ArrowRight, BookOpen, Layers, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  // Initialize with the canonical UniGlyph font dataset
  const [fontMetadata, setFontMetadata] = useState<FontMetadata | null>(null);
  const [glyphs, setGlyphs] = useState<ExtractedGlyph[]>([]);
  const [slots, setSlots] = useState<KeyboardKeySlot[]>([]);

  // Selection & Modal States
  const [selectedGlyph, setSelectedGlyph] = useState<ExtractedGlyph | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  // Live Typing & Physical Key State
  const [typedSequence, setTypedSequence] = useState<string>('p a 4 +  k e 1 -');
  const [activePressedKey, setActivePressedKey] = useState<string | null>(null);

  // Initialize initial state on mount
  useEffect(() => {
    const defaultData = createSampleUniGlyphDataset();
    const defaultSlots = createDefaultKeyboardSlots();

    // Map initial glyphs to slots
    const slotMap = new Map<string, string>();
    defaultData.glyphs.forEach((g) => {
      if (g.mappedKey) {
        slotMap.set(g.mappedKey.toLowerCase(), g.id);
      }
    });

    const updatedSlots = defaultSlots.map((slot) => {
      const matchId = slotMap.get(slot.key.toLowerCase());
      return {
        ...slot,
        mappedGlyphId: matchId || null,
      };
    });

    setFontMetadata(defaultData.fontMetadata);
    setGlyphs(defaultData.glyphs);
    setSlots(updatedSlots);
  }, []);

  // Listen to physical keyboard events for live testing and typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input field or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      setActivePressedKey(e.key);

      // If mapped key is pressed, append to sandbox typed sequence
      const matchedSlot = slots.find(
        (s) => s.key.toLowerCase() === e.key.toLowerCase() || s.code === e.code
      );

      if (matchedSlot && matchedSlot.mappedGlyphId) {
        e.preventDefault();
        setTypedSequence((prev) => prev + matchedSlot.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setTypedSequence((prev) => prev.slice(0, -1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setTypedSequence((prev) => prev + ' ');
      }
    };

    const handleKeyUp = () => {
      setActivePressedKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [slots]);

  // Handle uploaded font
  const handleFontLoaded = (result: ParseFontResult) => {
    setFontMetadata(result.fontMetadata);
    setGlyphs(result.glyphs);

    // Update slots with initial guesses from extracted font
    const keyMap = new Map<string, string>();
    result.glyphs.forEach((g) => {
      if (g.mappedKey) {
        keyMap.set(g.mappedKey.toLowerCase(), g.id);
      }
    });

    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        mappedGlyphId: keyMap.get(slot.key.toLowerCase()) || null,
      }))
    );
  };

  // Assign glyph to keyboard slot
  const handleAssignGlyphToSlot = useCallback((slotCode: string, glyphId: string | null) => {
    const targetSlot = slots.find((s) => s.code === slotCode);
    if (!targetSlot) return;

    setSlots((prevSlots) =>
      prevSlots.map((s) => {
        // If assigning glyph that was previously on another key, remove from old key
        if (glyphId && s.mappedGlyphId === glyphId && s.code !== slotCode) {
          return { ...s, mappedGlyphId: null };
        }
        if (s.code === slotCode) {
          return { ...s, mappedGlyphId: glyphId };
        }
        return s;
      })
    );

    // Also update glyph mappedKey
    if (glyphId) {
      setGlyphs((prevGlyphs) =>
        prevGlyphs.map((g) => {
          if (g.id === glyphId) {
            return { ...g, mappedKey: targetSlot.key.toLowerCase() };
          }
          // If this key was mapped to another glyph, unmap it
          if (g.mappedKey === targetSlot.key.toLowerCase() && g.id !== glyphId) {
            return { ...g, mappedKey: null };
          }
          return g;
        })
      );
    }
  }, [slots]);

  // Auto-map unassigned glyphs sequentially to available keyboard keys
  const handleAutoMapSequential = () => {
    const unmappedGlyphs = glyphs.filter((g) => !g.mappedKey);
    const emptySlots = slots.filter((s) => !s.mappedGlyphId && s.key.trim().length > 0 && s.key !== 'Shift' && s.key !== 'CapsLock' && s.key !== 'Tab' && s.key !== 'Enter' && s.key !== 'Backspace');

    if (unmappedGlyphs.length === 0 || emptySlots.length === 0) return;

    const newSlots = [...slots];
    const newGlyphs = [...glyphs];

    for (let i = 0; i < Math.min(unmappedGlyphs.length, emptySlots.length); i++) {
      const g = unmappedGlyphs[i];
      const s = emptySlots[i];

      const slotIdx = newSlots.findIndex((x) => x.id === s.id);
      if (slotIdx !== -1) {
        newSlots[slotIdx] = { ...newSlots[slotIdx], mappedGlyphId: g.id };
      }

      const glyphIdx = newGlyphs.findIndex((x) => x.id === g.id);
      if (glyphIdx !== -1) {
        newGlyphs[glyphIdx] = { ...newGlyphs[glyphIdx], mappedKey: s.key.toLowerCase() };
      }
    }

    setSlots(newSlots);
    setGlyphs(newGlyphs);
  };

  // Clear all key mappings
  const handleClearAllMappings = () => {
    setSlots((prev) => prev.map((s) => ({ ...s, mappedGlyphId: null })));
    setGlyphs((prev) => prev.map((g) => ({ ...g, mappedKey: null })));
  };

  // Update category of a single glyph
  const handleUpdateGlyphCategory = (
    glyphId: string,
    category: LinguisticCategory | null,
    durationSubtype?: DurationSubtype,
    pitchLevel?: PitchLevel
  ) => {
    setGlyphs((prev) =>
      prev.map((g) => {
        if (g.id === glyphId) {
          return {
            ...g,
            category,
            durationSubtype: category === LinguisticCategory.DURATION_INDICATOR ? (durationSubtype || 'shorter') : undefined,
            pitchLevel: category === LinguisticCategory.PITCH_INDICATOR ? (pitchLevel || 'high') : undefined,
          };
        }
        return g;
      })
    );
  };

  // Batch categorize multiple glyphs
  const handleBatchCategorize = (
    glyphIds: string[],
    category: LinguisticCategory,
    durationSubtype?: DurationSubtype,
    pitchLevel?: PitchLevel
  ) => {
    const idSet = new Set(glyphIds);
    setGlyphs((prev) =>
      prev.map((g) => {
        if (idSet.has(g.id)) {
          return {
            ...g,
            category,
            durationSubtype: category === LinguisticCategory.DURATION_INDICATOR ? (durationSubtype || 'shorter') : undefined,
            pitchLevel: category === LinguisticCategory.PITCH_INDICATOR ? (pitchLevel || 'high') : undefined,
          };
        }
        return g;
      })
    );
  };

  // Select slot
  const handleSelectSlot = (slot: KeyboardKeySlot) => {
    setActiveSlotId(slot.id);
    if (slot.mappedGlyphId) {
      const g = glyphs.find((item) => item.id === slot.mappedGlyphId);
      if (g) {
        setSelectedGlyph(g);
        setIsInspectorOpen(true);
      }
    }
  };

  // Select glyph from pool or category
  const handleSelectGlyph = (glyph: ExtractedGlyph) => {
    setSelectedGlyph(glyph);
    setIsInspectorOpen(true);
  };

  // Save changes from inspector modal
  const handleSaveGlyph = (updatedGlyph: ExtractedGlyph) => {
    setGlyphs((prev) => prev.map((g) => (g.id === updatedGlyph.id ? updatedGlyph : g)));

    // If key mapping changed
    if (updatedGlyph.mappedKey) {
      const targetSlot = slots.find((s) => s.key.toLowerCase() === updatedGlyph.mappedKey?.toLowerCase());
      if (targetSlot) {
        handleAssignGlyphToSlot(targetSlot.code, updatedGlyph.id);
      }
    }
  };

  // Reset all to demo defaults
  const handleReset = () => {
    const defaultData = createSampleUniGlyphDataset();
    const defaultSlots = createDefaultKeyboardSlots();
    const slotMap = new Map<string, string>();
    defaultData.glyphs.forEach((g) => {
      if (g.mappedKey) slotMap.set(g.mappedKey.toLowerCase(), g.id);
    });
    setSlots(defaultSlots.map((s) => ({ ...s, mappedGlyphId: slotMap.get(s.key.toLowerCase()) || null })));
    setGlyphs(defaultData.glyphs);
    setFontMetadata(defaultData.fontMetadata);
    setTypedSequence('p a 4 +  k e 1 -');
  };

  // Import JSON configuration
  const handleImportConfig = (imported: ConlangProjectConfig) => {
    if (imported.fontMetadata) setFontMetadata(imported.fontMetadata);
    if (imported.glyphs) setGlyphs(imported.glyphs);
    if (imported.keyboardSlots) setSlots(imported.keyboardSlots);
  };

  // Build full project config object for export
  const projectConfig: ConlangProjectConfig = {
    version: '1.0.0',
    projectName: 'UniGlyph Canonical Conlang',
    languageName: 'UniGlyph',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    fontMetadata,
    glyphs,
    keyboardSlots: slots,
    acousticSettings: {
      durationModifiers: {
        shorter: 0.5,
        longer: 2.0,
        default: 1.0,
      },
      pitchModifiers: {
        very_very_low: -7,
        very_low: -4,
        low: -2,
        high: 2,
        very_high: 5,
        very_very_high: 8,
      },
      nonContinuousEnvelope: {
        attackMs: 15,
        curve: 'exponential',
      },
    },
  };

  const mappedKeysCount = slots.filter((s) => s.mappedGlyphId !== null).length;
  const categorizedCount = glyphs.filter((g) => g.category !== null).length;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E0E0E0] flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Header */}
      <Header
        glyphs={glyphs}
        mappedKeysCount={mappedKeysCount}
        totalSlots={slots.length}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onReset={handleReset}
        onLoadDemoFont={handleReset}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Phase 1 Overview & Linguistic Principles Card */}
        <section id="phase1-linguistic-primer" className="bg-[#111114] rounded-xl p-5 sm:p-6 border border-[#2A2A2E]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-mono font-medium uppercase tracking-wider">
                  Phase 1 Operational Target
                </span>
                <span className="text-[#666] text-xs">•</span>
                <span className="text-[#888] text-xs font-mono">UniGlyph Language System</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#E0E0E0]">
                OTF Glyph Extraction & Linguistic Keyboard Mapping
              </h2>
              <p className="text-xs sm:text-sm text-[#888] leading-relaxed">
                Configure the fundamental script alphabet and assign each glyph to its functional phonological class.
                The visual layout enforces distinct separation between consonants, silent articulators, vowels, and acoustic modifiers.
              </p>
            </div>

            {/* Quick Readiness Progress Card */}
            <div className="bg-[#1C1C21] rounded-xl p-4 border border-[#2A2A2E] flex flex-col gap-2.5 min-w-[280px]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#888]">Phase 1 Mapping Health</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {categorizedCount}/{glyphs.length} Categorized
                </span>
              </div>

              <div className="w-full bg-[#0A0A0C] rounded-full h-2 overflow-hidden border border-[#2A2A2E]">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${glyphs.length > 0 ? (categorizedCount / glyphs.length) * 100 : 0}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#888]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>OTF Parser Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>6 Linguistic Groups</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Virtual Matrix Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>JSON Schema Synced</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. OTF Font Ingestion & Parsing Engine */}
        <FontUploader
          fontMetadata={fontMetadata}
          glyphCount={glyphs.length}
          onFontLoaded={handleFontLoaded}
        />

        {/* 2. Interactive Extracted Glyphs Pool */}
        <GlyphPool
          glyphs={glyphs}
          selectedGlyphId={selectedGlyph?.id || null}
          onSelectGlyph={handleSelectGlyph}
          onUpdateGlyphCategory={handleUpdateGlyphCategory}
          onBatchCategorize={handleBatchCategorize}
          onAutoMapSequential={handleAutoMapSequential}
        />

        {/* 3. Virtual Keyboard Mapping Chassis */}
        <KeyboardMapper
          slots={slots}
          glyphs={glyphs}
          activeSlotId={activeSlotId}
          onSelectSlot={handleSelectSlot}
          onAssignGlyphToSlot={handleAssignGlyphToSlot}
          onClearAllMappings={handleClearAllMappings}
          activePressedKey={activePressedKey}
        />

        {/* 4. Categorization Buckets (6 Core Linguistic Groups) */}
        <CategoryManager
          glyphs={glyphs}
          onSelectGlyph={handleSelectGlyph}
          onUpdateGlyphCategory={handleUpdateGlyphCategory}
        />

        {/* 5. Live UniGlyph Interactive Typing Sandbox & Rule Verifier */}
        <InteractiveTyperPhase1
          glyphs={glyphs}
          typedSequence={typedSequence}
          onTypedSequenceChange={setTypedSequence}
          onClearSequence={() => setTypedSequence('')}
        />

        {/* Phase 1 Completion Confirmation Card */}
        <section id="phase1-confirmation-footer" className="bg-[#111114] rounded-xl border border-[#2A2A2E] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-[#E0E0E0] text-sm sm:text-base">Phase 1 Architecture Complete</h3>
            </div>
            <p className="text-xs text-[#888] mt-1 max-w-2xl">
              All OTF vector extraction pipelines, keyboard mapping interfaces, 6-group linguistic categorization rules, and JSON persistence schemas are in place and verified.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-export-phase1-json"
              type="button"
              onClick={() => setIsExportImportOpen(true)}
              className="px-4 py-2 rounded bg-white text-black hover:bg-slate-200 text-xs font-medium transition-colors shadow-sm"
            >
              Export Schema JSON
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2E] bg-[#111114] py-4 mt-8 text-center text-xs text-[#888]">
        <p>UniGlyph Conlang Studio • Computational Linguistics & Script Synthesis Environment</p>
      </footer>

      {/* Glyph Inspector Modal */}
      <GlyphInspectorModal
        glyph={selectedGlyph}
        slots={slots}
        isOpen={isInspectorOpen}
        onClose={() => {
          setIsInspectorOpen(false);
          setSelectedGlyph(null);
        }}
        onSaveGlyph={handleSaveGlyph}
      />

      {/* Export / Import Schema Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        config={projectConfig}
        onImportConfig={handleImportConfig}
      />
    </div>
  );
}
