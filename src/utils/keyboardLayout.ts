/**
 * Standard Keyboard Layout Definitions and Slot Helpers
 */
import { KeyboardKeySlot } from '../types/conlang';

export function createDefaultKeyboardSlots(): KeyboardKeySlot[] {
  const layout: Array<{
    code: string;
    key: string;
    label: string;
    row: number;
    col: number;
    width?: number;
  }> = [
    // Row 0: Number / Pitch & Duration row
    { code: 'Backquote', key: '`', label: '`', row: 0, col: 0 },
    { code: 'Digit1', key: '1', label: '1', row: 0, col: 1 },
    { code: 'Digit2', key: '2', label: '2', row: 0, col: 2 },
    { code: 'Digit3', key: '3', label: '3', row: 0, col: 3 },
    { code: 'Digit4', key: '4', label: '4', row: 0, col: 4 },
    { code: 'Digit5', key: '5', label: '5', row: 0, col: 5 },
    { code: 'Digit6', key: '6', label: '6', row: 0, col: 6 },
    { code: 'Digit7', key: '7', label: '7', row: 0, col: 7 },
    { code: 'Digit8', key: '8', label: '8', row: 0, col: 8 },
    { code: 'Digit9', key: '9', label: '9', row: 0, col: 9 },
    { code: 'Digit0', key: '0', label: '0', row: 0, col: 10 },
    { code: 'Minus', key: '-', label: '-', row: 0, col: 11 },
    { code: 'Equal', key: '=', label: '=', row: 0, col: 12 },
    { code: 'Backspace', key: 'Backspace', label: '⌫', row: 0, col: 13, width: 1.5 },

    // Row 1: Top Row (QWERTY)
    { code: 'Tab', key: 'Tab', label: 'Tab', row: 1, col: 0, width: 1.3 },
    { code: 'KeyQ', key: 'q', label: 'Q', row: 1, col: 1 },
    { code: 'KeyW', key: 'w', label: 'W', row: 1, col: 2 },
    { code: 'KeyE', key: 'e', label: 'E', row: 1, col: 3 },
    { code: 'KeyR', key: 'r', label: 'R', row: 1, col: 4 },
    { code: 'KeyT', key: 't', label: 'T', row: 1, col: 5 },
    { code: 'KeyY', key: 'y', label: 'Y', row: 1, col: 6 },
    { code: 'KeyU', key: 'u', label: 'U', row: 1, col: 7 },
    { code: 'KeyI', key: 'i', label: 'I', row: 1, col: 8 },
    { code: 'KeyO', key: 'o', label: 'O', row: 1, col: 9 },
    { code: 'KeyP', key: 'p', label: 'P', row: 1, col: 10 },
    { code: 'BracketLeft', key: '[', label: '[', row: 1, col: 11 },
    { code: 'BracketRight', key: ']', label: ']', row: 1, col: 12 },
    { code: 'Backslash', key: '\\', label: '\\', row: 1, col: 13, width: 1.2 },

    // Row 2: Home Row (ASDF)
    { code: 'CapsLock', key: 'CapsLock', label: 'Caps', row: 2, col: 0, width: 1.6 },
    { code: 'KeyA', key: 'a', label: 'A', row: 2, col: 1 },
    { code: 'KeyS', key: 's', label: 'S', row: 2, col: 2 },
    { code: 'KeyD', key: 'd', label: 'D', row: 2, col: 3 },
    { code: 'KeyF', key: 'f', label: 'F', row: 2, col: 4 },
    { code: 'KeyG', key: 'g', label: 'G', row: 2, col: 5 },
    { code: 'KeyH', key: 'h', label: 'H', row: 2, col: 6 },
    { code: 'KeyJ', key: 'j', label: 'J', row: 2, col: 7 },
    { code: 'KeyK', key: 'k', label: 'K', row: 2, col: 8 },
    { code: 'KeyL', key: 'l', label: 'L', row: 2, col: 9 },
    { code: 'Semicolon', key: ';', label: ';', row: 2, col: 10 },
    { code: 'Quote', key: "'", label: "'", row: 2, col: 11 },
    { code: 'Enter', key: 'Enter', label: '⏎', row: 2, col: 12, width: 1.9 },

    // Row 3: Bottom Row (ZXCV)
    { code: 'ShiftLeft', key: 'Shift', label: '⇧ Shift', row: 3, col: 0, width: 2.1 },
    { code: 'KeyZ', key: 'z', label: 'Z', row: 3, col: 1 },
    { code: 'KeyX', key: 'x', label: 'X', row: 3, col: 2 },
    { code: 'KeyC', key: 'c', label: 'C', row: 3, col: 3 },
    { code: 'KeyV', key: 'v', label: 'V', row: 3, col: 4 },
    { code: 'KeyB', key: 'b', label: 'B', row: 3, col: 5 },
    { code: 'KeyN', key: 'n', label: 'N', row: 3, col: 6 },
    { code: 'KeyM', key: 'm', label: 'M', row: 3, col: 7 },
    { code: 'Comma', key: ',', label: ',', row: 3, col: 8 },
    { code: 'Period', key: '.', label: '.', row: 3, col: 9 },
    { code: 'Slash', key: '/', label: '/', row: 3, col: 10 },
    { code: 'ShiftRight', key: 'Shift', label: '⇧ Shift', row: 3, col: 11, width: 2.4 },

    // Row 4: Space Row
    { code: 'Space', key: ' ', label: '␣ Space (Word Break)', row: 4, col: 0, width: 8.0 },
  ];

  return layout.map((item) => ({
    id: `slot_${item.code}`,
    code: item.code,
    key: item.key,
    displayLabel: item.label,
    row: item.row,
    col: item.col,
    width: item.width || 1.0,
    mappedGlyphId: null,
  }));
}
