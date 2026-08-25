/**
 * UniGlyph Linguistic Configuration & Type Definitions
 */

export enum LinguisticCategory {
  CONTINUOUS_CONSONANT = 'continuous_consonant',
  NON_CONTINUOUS_CONSONANT = 'non_continuous_consonant',
  VOWEL = 'vowel',
  DURATION_INDICATOR = 'duration_indicator',
  PITCH_INDICATOR = 'pitch_indicator',
  NUMBERS_PUNCTUATION = 'numbers_punctuation',
}

export type DurationSubtype = 'shorter' | 'longer';

export type PitchLevel =
  | 'very_very_low'  // Level 1
  | 'very_low'       // Level 2
  | 'low'            // Level 3
  | 'high'           // Level 4
  | 'very_high'      // Level 5
  | 'very_very_high'; // Level 6

export interface ExtractedGlyph {
  id: string;
  index: number;
  name: string;
  unicode?: number;
  character?: string;
  svgPathData: string;
  svgViewBox: string;
  advanceWidth: number;
  leftSideBearing?: number;
  bbox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  
  // Mapping & Categorization
  mappedKey: string | null; // e.g., 'q', 'w', '1', 'a'
  category: LinguisticCategory | null;
  durationSubtype?: DurationSubtype;
  pitchLevel?: PitchLevel;
  ipaSymbol?: string;
  articulatorNote?: string;
  description?: string;

  // Phase 2 Preparation
  audioFileUploaded?: boolean;
  audioFileName?: string;
  audioDataUrl?: string;
}

export interface KeyboardKeySlot {
  id: string;
  code: string; // e.g. 'KeyQ', 'Digit1', 'Space'
  key: string;  // e.g. 'q', '1', ' '
  displayLabel: string;
  row: number;
  col: number;
  width?: number; // 1 = standard key, 1.5 = tab, 2 = backspace, etc.
  mappedGlyphId: string | null;
}

export interface FontMetadata {
  fontFamily: string;
  styleName: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  glyphCount: number;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface ConlangProjectConfig {
  version: string;
  projectName: string;
  languageName: string;
  createdAt: string;
  lastModified: string;
  fontMetadata: FontMetadata | null;
  glyphs: ExtractedGlyph[];
  keyboardSlots: KeyboardKeySlot[];
  acousticSettings: {
    durationModifiers: {
      shorter: number; // e.g. 0.5x
      longer: number;  // e.g. 2.0x
      default: number; // 1.0x
    };
    pitchModifiers: Record<PitchLevel, number>; // Semitones
    nonContinuousEnvelope: {
      attackMs: number;
      curve: 'exponential' | 'linear' | 'burst';
    };
  };
}

export interface CategoryInfo {
  id: LinguisticCategory;
  name: string;
  shortLabel: string;
  description: string;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  acceptsAudio: boolean; // For Phase 2 rule enforcement
}

export const CATEGORY_DEFINITIONS: Record<LinguisticCategory, CategoryInfo> = {
  [LinguisticCategory.CONTINUOUS_CONSONANT]: {
    id: LinguisticCategory.CONTINUOUS_CONSONANT,
    name: 'Continuous Consonants',
    shortLabel: 'Cont. Consonant',
    description: 'Sustained airflow sounds (nasals, fricatives, liquids, e.g. /m/, /s/, /v/, /l/). Has independent audio.',
    colorClass: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    borderClass: 'border-cyan-500/40 ring-cyan-400/20',
    acceptsAudio: true,
  },
  [LinguisticCategory.NON_CONTINUOUS_CONSONANT]: {
    id: LinguisticCategory.NON_CONTINUOUS_CONSONANT,
    name: 'Non-Continuous Consonants (Silent Articulators)',
    shortLabel: 'Silent Articulator',
    description: 'No independent sound. Shapes starting tongue/mouth position; sound is only produced when released into a following vowel.',
    colorClass: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    borderClass: 'border-amber-500/40 ring-amber-400/20',
    acceptsAudio: false, // Rule enforcement: explicitly disabled
  },
  [LinguisticCategory.VOWEL]: {
    id: LinguisticCategory.VOWEL,
    name: 'Vowels',
    shortLabel: 'Vowel',
    description: 'Core vocalized air stream (e.g. /a/, /e/, /i/, /o/, /u/). Modifiable by duration and pitch.',
    colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    borderClass: 'border-emerald-500/40 ring-emerald-400/20',
    acceptsAudio: true,
  },
  [LinguisticCategory.DURATION_INDICATOR]: {
    id: LinguisticCategory.DURATION_INDICATOR,
    name: 'Duration Indicators',
    shortLabel: 'Duration Mod.',
    description: 'Modifiers altering preceding vowel duration (Shorter duration, Longer duration). Inherently silent.',
    colorClass: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    borderClass: 'border-purple-500/40 ring-purple-400/20',
    acceptsAudio: false, // Rule enforcement
  },
  [LinguisticCategory.PITCH_INDICATOR]: {
    id: LinguisticCategory.PITCH_INDICATOR,
    name: 'Pitch Indicators',
    shortLabel: 'Pitch Mod.',
    description: 'Modifiers shifting pitch across 6 distinct levels (Very Very Low to Very Very High). Inherently silent.',
    colorClass: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    borderClass: 'border-rose-500/40 ring-rose-400/20',
    acceptsAudio: false, // Rule enforcement
  },
  [LinguisticCategory.NUMBERS_PUNCTUATION]: {
    id: LinguisticCategory.NUMBERS_PUNCTUATION,
    name: 'Numbers & Punctuations',
    shortLabel: 'Num / Punct',
    description: 'Digits (0-9), pause markers, glottal separators, and sentence punctuation.',
    colorClass: 'text-slate-400 bg-slate-900 border-slate-700',
    badgeBg: 'bg-[#1C1C21]',
    badgeText: 'text-slate-300',
    borderClass: 'border-slate-600 ring-slate-400/20',
    acceptsAudio: false, // Rule enforcement
  },
};

export const PITCH_LEVEL_DEFINITIONS: Record<PitchLevel, { name: string; levelNumber: number; defaultSemitone: number; symbol: string }> = {
  very_very_low: { name: 'Very Very Low', levelNumber: 1, defaultSemitone: -7, symbol: '˩' },
  very_low: { name: 'Very Low', levelNumber: 2, defaultSemitone: -4, symbol: '˨' },
  low: { name: 'Low', levelNumber: 3, defaultSemitone: -2, symbol: '˧' },
  high: { name: 'High', levelNumber: 4, defaultSemitone: 2, symbol: '˦' },
  very_high: { name: 'Very High', levelNumber: 5, defaultSemitone: 5, symbol: '˥' },
  very_very_high: { name: 'Very Very High', levelNumber: 6, defaultSemitone: 8, symbol: 'ꜛ' },
};
