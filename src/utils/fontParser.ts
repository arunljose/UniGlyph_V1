/**
 * Font Parsing and Glyph Extraction Engine using opentype.js
 */
import * as opentype from 'opentype.js';
import {
  ExtractedGlyph,
  FontMetadata,
  LinguisticCategory,
  PitchLevel,
  DurationSubtype,
} from '../types/conlang';

export interface ParseFontResult {
  fontMetadata: FontMetadata;
  glyphs: ExtractedGlyph[];
}

/**
 * Parses an OTF / TTF ArrayBuffer using opentype.js and extracts every unique glyph
 */
export async function parseFontBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number
): Promise<ParseFontResult> {
  try {
    const font = opentype.parse(buffer);

    const fontMetadata: FontMetadata = {
      fontFamily: font.names.fontFamily?.en || font.names.fullName?.en || fileName.replace(/\.[^/.]+$/, ''),
      styleName: font.names.fontSubfamily?.en || 'Regular',
      unitsPerEm: font.unitsPerEm || 1000,
      ascender: font.ascender || 800,
      descender: font.descender || -200,
      glyphCount: font.glyphs.length,
      fileName,
      fileSize,
      uploadedAt: new Date().toISOString(),
    };

    const glyphs: ExtractedGlyph[] = [];
    const unitsPerEm = font.unitsPerEm || 1000;
    const ascender = font.ascender || 800;
    const descender = font.descender || -200;
    const totalHeight = ascender - descender || unitsPerEm;

    for (let i = 0; i < font.glyphs.length; i++) {
      const g = font.glyphs.get(i);
      if (!g) continue;

      // Extract bounding box
      let bbox = { x1: 0, y1: descender, x2: unitsPerEm, y2: ascender };
      try {
        const box = g.getBoundingBox();
        if (box && Number.isFinite(box.x1) && Number.isFinite(box.y2)) {
          bbox = box;
        }
      } catch {
        // Fallback bbox
      }

      // Convert glyph path to SVG string and SVG path data
      // Target rendering box: 0,0 to 1000,1000 with proper font Y-inversion
      let svgPathData = '';
      try {
        const path = g.getPath(0, ascender, unitsPerEm);
        svgPathData = path.toPathData(2);
      } catch (err) {
        console.warn(`Could not extract path for glyph ${g.name} (index ${i}):`, err);
      }

      // If glyph has no path (e.g., whitespace or empty slot), generate a clean placeholder geometry
      if (!svgPathData || svgPathData.trim().length === 0) {
        if (g.name === 'space' || g.unicode === 32) {
          svgPathData = `M 200 ${ascender - 100} L 800 ${ascender - 100} L 800 ${ascender - 60} L 200 ${ascender - 60} Z`;
        } else {
          // Subtle dot/box for invisible glyph
          svgPathData = `M 450 ${ascender / 2 - 50} L 550 ${ascender / 2 - 50} L 550 ${ascender / 2 + 50} L 450 ${ascender / 2 + 50} Z`;
        }
      }

      const glyphWidth = g.advanceWidth || unitsPerEm * 0.6;
      const viewBox = `0 0 ${unitsPerEm} ${totalHeight}`;

      const unicodeVal = g.unicode ?? (g.unicodes && g.unicodes.length > 0 ? g.unicodes[0] : undefined);
      let character: string | undefined = undefined;
      if (unicodeVal && unicodeVal >= 32 && unicodeVal <= 126) {
        character = String.fromCharCode(unicodeVal);
      }

      const glyphId = `glyph_${i}_${g.name || 'unnamed'}`;

      // Smart initial heuristic guessing from unicode or glyph name if available
      const initialGuess = guessLinguisticCategory(g.name, unicodeVal, character);

      glyphs.push({
        id: glyphId,
        index: i,
        name: g.name || `glyph_${i}`,
        unicode: unicodeVal,
        character,
        svgPathData,
        svgViewBox: viewBox,
        advanceWidth: glyphWidth,
        leftSideBearing: g.leftSideBearing,
        bbox,
        mappedKey: character ? character.toLowerCase() : null,
        category: initialGuess.category,
        durationSubtype: initialGuess.durationSubtype,
        pitchLevel: initialGuess.pitchLevel,
        ipaSymbol: initialGuess.ipaSymbol,
        articulatorNote: initialGuess.articulatorNote,
        description: initialGuess.description,
      });
    }

    return { fontMetadata, glyphs };
  } catch (error) {
    console.error('Failed to parse font with opentype.js:', error);
    throw new Error(`Failed to parse font: ${error instanceof Error ? error.message : 'Unknown font format error'}`);
  }
}

/**
 * Heuristic classifier to aid initial categorization if user uploads an existing font
 */
function guessLinguisticCategory(
  glyphName: string = '',
  unicode?: number,
  char?: string
): {
  category: LinguisticCategory | null;
  durationSubtype?: DurationSubtype;
  pitchLevel?: PitchLevel;
  ipaSymbol?: string;
  articulatorNote?: string;
  description?: string;
} {
  const name = glyphName.toLowerCase();
  const c = char ? char.toLowerCase() : '';

  // Vowels
  if (['a', 'e', 'i', 'o', 'u'].includes(c) || ['a', 'e', 'i', 'o', 'u'].includes(name)) {
    return {
      category: LinguisticCategory.VOWEL,
      ipaSymbol: `/${c || name}/`,
      articulatorNote: 'Core vocalic airflow',
      description: 'Continuous vocalized resonator',
    };
  }

  // Non-continuous consonants (Plosives / Stops)
  if (['p', 't', 'k', 'b', 'd', 'g', 'q'].includes(c)) {
    const notes: Record<string, string> = {
      p: 'Bilabial stop (mouth closed)',
      t: 'Alveolar stop (tongue tip at ridge)',
      k: 'Velar stop (tongue dorsum at soft palate)',
      b: 'Voiced bilabial closure',
      d: 'Voiced alveolar closure',
      g: 'Voiced velar closure',
      q: 'Uvular stop closure',
    };
    return {
      category: LinguisticCategory.NON_CONTINUOUS_CONSONANT,
      ipaSymbol: `[${c}]`,
      articulatorNote: notes[c] || 'Silent starting mouth position',
      description: 'Zero sound until released into vowel air',
    };
  }

  // Continuous consonants (Fricatives, Nasals, Liquids)
  if (['m', 'n', 's', 'z', 'f', 'v', 'l', 'r', 'h', 'w', 'j'].includes(c)) {
    const notes: Record<string, string> = {
      m: 'Bilabial nasal sustained airflow',
      n: 'Alveolar nasal sustained airflow',
      s: 'Alveolar fricative sibilant',
      z: 'Voiced alveolar fricative',
      f: 'Labiodental fricative',
      v: 'Voiced labiodental fricative',
      l: 'Alveolar lateral approximant',
      r: 'Alveolar trill / approximant',
      h: 'Glottal fricative breath',
    };
    return {
      category: LinguisticCategory.CONTINUOUS_CONSONANT,
      ipaSymbol: `/${c}/`,
      articulatorNote: notes[c] || 'Continuous airflow consonant',
      description: 'Independent audible sustained sound',
    };
  }

  // Numbers & Punctuations
  if (/[0-9]/.test(c) || ['period', 'comma', 'exclam', 'question', 'colon', 'semicolon'].includes(name)) {
    return {
      category: LinguisticCategory.NUMBERS_PUNCTUATION,
      description: 'Numerical or grammatical delimiter',
    };
  }

  // Default: unassigned
  return { category: null };
}

/**
 * Procedural UniGlyph Demo Font
 * Generates an authentic constructed script set with rich geometric vector glyphs
 * designed specifically for the UniGlyph language rules (Silent stops, Vowels, Pitch, Duration, etc.)
 */
export function createSampleUniGlyphDataset(): ParseFontResult {
  const unitsPerEm = 1000;
  const ascender = 800;
  const descender = -200;
  const totalHeight = 1000;

  // Curated UniGlyph symbolic script dataset
  const sampleDefs: Array<{
    name: string;
    key: string;
    category: LinguisticCategory;
    durationSubtype?: DurationSubtype;
    pitchLevel?: PitchLevel;
    ipaSymbol?: string;
    articulatorNote?: string;
    description: string;
    path: string;
  }> = [
    // --- NON-CONTINUOUS CONSONANTS (Silent Articulators) ---
    {
      name: 'ug_stop_bilabial',
      key: 'p',
      category: LinguisticCategory.NON_CONTINUOUS_CONSONANT,
      ipaSymbol: '[p]',
      articulatorNote: 'Bilabial closure (lips sealed tight)',
      description: 'Silent articulator: releases into next vowel with burst attack',
      // Geometric glyph: Twin closed horizontal brackets
      path: 'M 250 200 L 450 200 L 450 600 L 250 600 L 250 520 L 370 520 L 370 280 L 250 280 Z M 750 200 L 550 200 L 550 600 L 750 600 L 750 520 L 630 520 L 630 280 L 750 280 Z',
    },
    {
      name: 'ug_stop_alveolar',
      key: 't',
      category: LinguisticCategory.NON_CONTINUOUS_CONSONANT,
      ipaSymbol: '[t]',
      articulatorNote: 'Alveolar stop (tongue tip at ridge)',
      description: 'Silent articulator: sharp coronal contact',
      // Geometric glyph: Upward sharp triangle with internal spine
      path: 'M 500 150 L 780 650 L 680 650 L 500 320 L 320 650 L 220 650 Z M 460 380 L 540 380 L 540 650 L 460 650 Z',
    },
    {
      name: 'ug_stop_velar',
      key: 'k',
      category: LinguisticCategory.NON_CONTINUOUS_CONSONANT,
      ipaSymbol: '[k]',
      articulatorNote: 'Velar stop (tongue dorsum on soft palate)',
      description: 'Silent articulator: deep dorsal occlusion',
      // Geometric glyph: Hexagonal diamond with center crossbar
      path: 'M 500 150 L 780 400 L 500 650 L 220 400 Z M 500 240 L 320 400 L 500 560 L 680 400 Z M 350 380 L 650 380 L 650 420 L 350 420 Z',
    },
    {
      name: 'ug_stop_voiced_bilabial',
      key: 'b',
      category: LinguisticCategory.NON_CONTINUOUS_CONSONANT,
      ipaSymbol: '[b]',
      articulatorNote: 'Voiced bilabial closure',
      description: 'Silent articulator: low-pressure lip seal',
      // Glyph: Twin connected rounded bars
      path: 'M 250 200 L 600 200 C 720 200 780 280 780 380 C 780 450 720 500 620 500 L 250 500 Z M 330 280 L 330 420 L 580 420 C 650 420 690 380 690 350 C 690 310 650 280 580 280 Z M 250 480 L 640 480 C 740 480 800 540 800 640 C 800 740 730 800 600 800 L 250 800 Z M 330 560 L 330 720 L 580 720 C 660 720 710 680 710 640 C 710 600 660 560 580 560 Z',
    },
    {
      name: 'ug_stop_voiced_alveolar',
      key: 'd',
      category: LinguisticCategory.NON_CONTINUOUS_CONSONANT,
      ipaSymbol: '[d]',
      articulatorNote: 'Voiced alveolar closure',
      description: 'Silent articulator: firm mid-mouth tongue closure',
      // Glyph: Vertical spine with semi-oval loop
      path: 'M 250 150 L 330 150 L 330 650 L 250 650 Z M 330 150 L 550 150 C 720 150 800 260 800 400 C 800 540 720 650 550 650 L 330 650 Z M 410 230 L 410 570 L 530 570 C 660 570 710 490 710 400 C 710 310 660 230 530 230 Z',
    },
    {
      name: 'ug_stop_glottal',
      key: 'q',
      category: LinguisticCategory.NON_CONTINUOUS_CONSONANT,
      ipaSymbol: '[ʔ]',
      articulatorNote: 'Glottal stop (vocal fold occlusion)',
      description: 'Silent articulator: abrupt throat block',
      // Glyph: Hooked crescent
      path: 'M 500 150 C 680 150 780 260 780 380 C 780 480 700 540 600 600 L 600 700 L 500 700 L 500 570 C 620 510 680 460 680 380 C 680 290 600 230 500 230 C 400 230 320 290 320 380 L 220 380 C 220 260 320 150 500 150 Z M 450 760 L 550 760 L 550 840 L 450 840 Z',
    },

    // --- VOWELS (Core Vocalic Resonance) ---
    {
      name: 'ug_vowel_a',
      key: 'a',
      category: LinguisticCategory.VOWEL,
      ipaSymbol: '/a/',
      articulatorNote: 'Open front unrounded vowel',
      description: 'Wide resonant open vowel tone',
      // Glyph: Radiating sunburst circle with open base
      path: 'M 500 150 C 680 150 800 270 800 450 C 800 630 680 750 500 750 C 320 750 200 630 200 450 C 200 270 320 150 500 150 Z M 500 240 C 370 240 290 330 290 450 C 290 570 370 660 500 660 C 630 660 710 570 710 450 C 710 330 630 240 500 240 Z M 450 360 L 550 360 L 550 540 L 450 540 Z',
    },
    {
      name: 'ug_vowel_e',
      key: 'e',
      category: LinguisticCategory.VOWEL,
      ipaSymbol: '/e/',
      articulatorNote: 'Close-mid front unrounded vowel',
      description: 'Bright harmonic vowel resonance',
      // Glyph: Triple horizontal tiered bars with left spine
      path: 'M 250 180 L 780 180 L 780 260 L 340 260 L 340 400 L 680 400 L 680 480 L 340 480 L 340 620 L 780 620 L 780 700 L 250 700 Z',
    },
    {
      name: 'ug_vowel_i',
      key: 'i',
      category: LinguisticCategory.VOWEL,
      ipaSymbol: '/i/',
      articulatorNote: 'Close front unrounded vowel',
      description: 'High frequency piercing vowel',
      // Glyph: Slender pillar with double floating chevrons
      path: 'M 460 250 L 540 250 L 540 700 L 460 700 Z M 500 120 L 600 200 L 400 200 Z M 350 700 L 650 700 L 650 750 L 350 750 Z',
    },
    {
      name: 'ug_vowel_o',
      key: 'o',
      category: LinguisticCategory.VOWEL,
      ipaSymbol: '/o/',
      articulatorNote: 'Close-mid back rounded vowel',
      description: 'Deep resonant rounded chamber sound',
      // Glyph: Concentric circles
      path: 'M 500 150 C 690 150 820 280 820 450 C 820 620 690 750 500 750 C 310 750 180 620 180 450 C 180 280 310 150 500 150 Z M 500 250 C 370 250 280 340 280 450 C 280 560 370 650 500 650 C 630 650 720 560 720 450 C 720 340 630 250 500 250 Z',
    },
    {
      name: 'ug_vowel_u',
      key: 'u',
      category: LinguisticCategory.VOWEL,
      ipaSymbol: '/u/',
      articulatorNote: 'Close back rounded vowel',
      description: 'Low-frequency rounded hum base',
      // Glyph: Deep U-trough vessel
      path: 'M 250 180 L 340 180 L 340 480 C 340 600 410 670 500 670 C 590 670 660 600 660 480 L 660 180 L 750 180 L 750 480 C 750 650 640 760 500 760 C 360 760 250 650 250 480 Z',
    },

    // --- CONTINUOUS CONSONANTS (Sustained Airflow) ---
    {
      name: 'ug_cont_nasal_m',
      key: 'm',
      category: LinguisticCategory.CONTINUOUS_CONSONANT,
      ipaSymbol: '/m/',
      articulatorNote: 'Bilabial nasal (humming air via nose)',
      description: 'Sustained warm nasal hum',
      // Glyph: Twin rounded arches
      path: 'M 200 250 L 280 250 L 280 650 L 200 650 Z M 280 350 C 320 280 380 250 460 250 C 530 250 590 290 620 360 C 660 280 730 250 800 250 L 800 650 L 720 650 L 720 370 C 720 320 680 290 630 290 C 570 290 530 330 530 390 L 530 650 L 450 650 L 450 370 C 450 320 410 290 360 290 C 310 290 280 330 280 390 L 280 650 L 200 650 Z',
    },
    {
      name: 'ug_cont_nasal_n',
      key: 'n',
      category: LinguisticCategory.CONTINUOUS_CONSONANT,
      ipaSymbol: '/n/',
      articulatorNote: 'Alveolar nasal airflow',
      description: 'Crisp nasal resonance',
      // Glyph: Single strong arch
      path: 'M 250 250 L 340 250 L 340 650 L 250 650 Z M 340 360 C 380 280 460 250 560 250 C 680 250 760 330 760 460 L 760 650 L 670 650 L 670 460 C 670 380 620 330 540 330 C 450 330 340 390 340 480 L 340 650 L 250 650 Z',
    },
    {
      name: 'ug_cont_fric_s',
      key: 's',
      category: LinguisticCategory.CONTINUOUS_CONSONANT,
      ipaSymbol: '/s/',
      articulatorNote: 'Alveolar sibilant fricative',
      description: 'Continuous white-noise hiss',
      // Glyph: Elegant sine wave / serpent
      path: 'M 720 280 C 680 200 580 160 480 160 C 340 160 250 230 250 340 C 250 440 330 490 480 530 C 630 570 680 610 680 690 C 680 770 600 820 480 820 C 350 820 260 760 220 660 L 300 620 C 330 700 400 740 480 740 C 550 740 600 700 600 640 C 600 570 540 530 400 490 C 270 450 170 390 170 290 C 170 200 270 120 440 120 C 550 120 640 170 680 240 Z',
    },
    {
      name: 'ug_cont_fric_z',
      key: 'z',
      category: LinguisticCategory.CONTINUOUS_CONSONANT,
      ipaSymbol: '/z/',
      articulatorNote: 'Voiced alveolar fricative',
      description: 'Continuous buzzing buzz-tone',
      // Glyph: Angular lightning zigzag
      path: 'M 250 200 L 750 200 L 750 280 L 400 620 L 750 620 L 750 700 L 250 700 L 250 620 L 600 280 L 250 280 Z',
    },
    {
      name: 'ug_cont_liquid_l',
      key: 'l',
      category: LinguisticCategory.CONTINUOUS_CONSONANT,
      ipaSymbol: '/l/',
      articulatorNote: 'Alveolar lateral liquid',
      description: 'Smooth continuous liquid vowel-like consonant',
      // Glyph: Vertical reed with right horizontal base
      path: 'M 350 150 L 440 150 L 440 620 L 750 620 L 750 700 L 350 700 Z',
    },
    {
      name: 'ug_cont_liquid_r',
      key: 'r',
      category: LinguisticCategory.CONTINUOUS_CONSONANT,
      ipaSymbol: '/r/',
      articulatorNote: 'Alveolar trill / rhotic glide',
      description: 'Continuous rolling resonant consonant',
      // Glyph: Curved horn with branch
      path: 'M 280 200 L 370 200 L 370 650 L 280 650 Z M 370 320 C 440 240 540 220 650 250 L 610 340 C 520 310 440 340 370 430 Z',
    },

    // --- DURATION INDICATORS (Modifies preceding vowel length) ---
    {
      name: 'ug_dur_shorter',
      key: '-',
      category: LinguisticCategory.DURATION_INDICATOR,
      durationSubtype: 'shorter',
      articulatorNote: 'Truncates preceding vowel duration (0.5x)',
      description: 'Down-pointing delta modifier symbol (Staccato duration)',
      // Glyph: Downward pointing inverted triangle
      path: 'M 200 250 L 800 250 L 500 750 Z M 320 330 L 500 630 L 680 330 Z',
    },
    {
      name: 'ug_dur_longer',
      key: '+',
      category: LinguisticCategory.DURATION_INDICATOR,
      durationSubtype: 'longer',
      articulatorNote: 'Prolongs preceding vowel duration (2.0x)',
      description: 'Up-pointing delta modifier symbol (Prolonged duration)',
      // Glyph: Upward pointing triangle with horizontal wings
      path: 'M 500 200 L 800 700 L 200 700 Z M 500 320 L 320 630 L 680 630 Z M 150 480 L 850 480 L 850 540 L 150 540 Z',
    },

    // --- PITCH INDICATORS (6 Distinct Levels) ---
    {
      name: 'ug_pitch_1_very_very_low',
      key: '1',
      category: LinguisticCategory.PITCH_INDICATOR,
      pitchLevel: 'very_very_low',
      articulatorNote: 'Pitch Level 1 (Deepest bass: -7 semitones)',
      description: 'Lowest pitch bar (Baseline deep bottom shelf)',
      // Glyph: Solid bar at bottom with downward point
      path: 'M 200 720 L 800 720 L 800 800 L 500 880 L 200 800 Z M 460 300 L 540 300 L 540 680 L 460 680 Z',
    },
    {
      name: 'ug_pitch_2_very_low',
      key: '2',
      category: LinguisticCategory.PITCH_INDICATOR,
      pitchLevel: 'very_low',
      articulatorNote: 'Pitch Level 2 (Very low tone: -4 semitones)',
      description: 'Low-register pitch indicator',
      // Glyph: Low bar with single dot
      path: 'M 200 620 L 800 620 L 800 700 L 200 700 Z M 450 400 L 550 400 L 550 500 L 450 500 Z',
    },
    {
      name: 'ug_pitch_3_low',
      key: '3',
      category: LinguisticCategory.PITCH_INDICATOR,
      pitchLevel: 'low',
      articulatorNote: 'Pitch Level 3 (Low-mid tone: -2 semitones)',
      description: 'Sub-neutral low pitch indicator',
      // Glyph: Mid-low horizontal bar
      path: 'M 200 520 L 800 520 L 800 600 L 200 600 Z M 350 350 L 650 350 L 500 200 Z',
    },
    {
      name: 'ug_pitch_4_high',
      key: '4',
      category: LinguisticCategory.PITCH_INDICATOR,
      pitchLevel: 'high',
      articulatorNote: 'Pitch Level 4 (High-mid tone: +2 semitones)',
      description: 'Supra-neutral high pitch indicator',
      // Glyph: Mid-high horizontal bar
      path: 'M 200 380 L 800 380 L 800 460 L 200 460 Z M 500 200 L 650 320 L 350 320 Z',
    },
    {
      name: 'ug_pitch_5_very_high',
      key: '5',
      category: LinguisticCategory.PITCH_INDICATOR,
      pitchLevel: 'very_high',
      articulatorNote: 'Pitch Level 5 (Very high tone: +5 semitones)',
      description: 'Upper register pitch indicator',
      // Glyph: High upper bar with dual accent marks
      path: 'M 200 240 L 800 240 L 800 320 L 200 320 Z M 350 420 L 450 420 L 450 560 L 350 560 Z M 550 420 L 650 420 L 650 560 L 550 560 Z',
    },
    {
      name: 'ug_pitch_6_very_very_high',
      key: '6',
      category: LinguisticCategory.PITCH_INDICATOR,
      pitchLevel: 'very_very_high',
      articulatorNote: 'Pitch Level 6 (Peak falsetto / acute: +8 semitones)',
      description: 'Highest pitch mark (Peak top crown)',
      // Glyph: Crown crest at very top
      path: 'M 200 120 L 800 120 L 800 200 L 500 140 L 200 200 Z M 500 240 L 600 400 L 400 400 Z M 460 440 L 540 440 L 540 750 L 460 750 Z',
    },

    // --- NUMBERS & PUNCTUATION ---
    {
      name: 'ug_punct_space_break',
      key: ' ',
      category: LinguisticCategory.NUMBERS_PUNCTUATION,
      articulatorNote: 'Word boundary / breathing pause',
      description: 'Triggers live speech synthesis in Phase 4',
      // Glyph: Horizontal anchor bar
      path: 'M 200 680 L 800 680 L 800 740 L 200 740 Z M 200 620 L 260 620 L 260 680 L 200 680 Z M 740 620 L 800 620 L 800 680 L 740 680 Z',
    },
    {
      name: 'ug_punct_stop_period',
      key: '.',
      category: LinguisticCategory.NUMBERS_PUNCTUATION,
      articulatorNote: 'Terminal sentence period',
      description: 'Major syntactic closure',
      // Glyph: Diamond point
      path: 'M 500 650 L 600 750 L 500 850 L 400 750 Z',
    },
    {
      name: 'ug_num_0',
      key: '0',
      category: LinguisticCategory.NUMBERS_PUNCTUATION,
      articulatorNote: 'Numeral Zero (Sun / Void)',
      description: 'UniGlyph Numeral 0',
      path: 'M 500 200 L 750 450 L 500 700 L 250 450 Z M 500 300 L 350 450 L 500 600 L 650 450 Z',
    },
    {
      name: 'ug_num_7',
      key: '7',
      category: LinguisticCategory.NUMBERS_PUNCTUATION,
      articulatorNote: 'Numeral Seven (Ray)',
      description: 'UniGlyph Numeral 7',
      path: 'M 250 200 L 750 200 L 750 280 L 420 720 L 330 720 L 650 280 L 250 280 Z',
    },
    {
      name: 'ug_num_8',
      key: '8',
      category: LinguisticCategory.NUMBERS_PUNCTUATION,
      articulatorNote: 'Numeral Eight (Twin Infinity)',
      description: 'UniGlyph Numeral 8',
      path: 'M 500 150 C 620 150 700 230 700 330 C 700 410 640 470 560 500 C 660 530 720 600 720 700 C 720 800 620 880 500 880 C 380 880 280 800 280 700 C 280 600 340 530 440 500 C 360 470 300 410 300 330 C 300 230 380 150 500 150 Z M 500 230 C 430 230 380 270 380 330 C 380 390 430 440 500 440 C 570 440 620 390 620 330 C 620 270 570 230 500 230 Z M 500 560 C 420 560 360 610 360 690 C 360 770 420 810 500 810 C 580 810 640 770 640 690 C 640 610 580 560 500 560 Z',
    },
    {
      name: 'ug_num_9',
      key: '9',
      category: LinguisticCategory.NUMBERS_PUNCTUATION,
      articulatorNote: 'Numeral Nine (Spiraling Apex)',
      description: 'UniGlyph Numeral 9',
      path: 'M 500 150 C 660 150 780 260 780 430 C 780 620 650 780 450 850 L 410 770 C 580 710 680 580 690 460 C 640 500 570 530 500 530 C 350 530 240 420 240 280 C 240 180 340 150 500 150 Z M 500 230 C 390 230 330 280 330 350 C 330 420 390 460 500 460 C 580 460 650 410 680 350 C 660 270 590 230 500 230 Z',
    },
  ];

  const glyphs: ExtractedGlyph[] = sampleDefs.map((def, idx) => ({
    id: `ug_glyph_${idx}_${def.name}`,
    index: idx,
    name: def.name,
    unicode: def.key ? def.key.charCodeAt(0) : undefined,
    character: def.key || undefined,
    svgPathData: def.path,
    svgViewBox: `0 0 ${unitsPerEm} ${totalHeight}`,
    advanceWidth: 800,
    leftSideBearing: 100,
    bbox: { x1: 150, y1: -100, x2: 850, y2: 850 },
    mappedKey: def.key,
    category: def.category,
    durationSubtype: def.durationSubtype,
    pitchLevel: def.pitchLevel,
    ipaSymbol: def.ipaSymbol,
    articulatorNote: def.articulatorNote,
    description: def.description,
  }));

  const fontMetadata: FontMetadata = {
    fontFamily: 'UniGlyph Standard Script',
    styleName: 'Canonical OTF Extraction',
    unitsPerEm,
    ascender,
    descender,
    glyphCount: glyphs.length,
    fileName: 'uniglyph-canonical.otf',
    fileSize: 48200,
    uploadedAt: new Date().toISOString(),
  };

  return { fontMetadata, glyphs };
}
