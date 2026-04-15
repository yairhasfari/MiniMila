import { Puzzle } from '../types';

/**
 * ADMIN: Add new puzzles here.
 * Format:
 * {
 *   id: 'unique-id',
 *   date: 'YYYY-MM-DD',
 *   grid: [
 *     ['ש', 'ל', 'ו', 'ם', null], // Row 0 (RTL: index 0 is right-most)
 *     ...
 *   ],
 *   acrossClues: [
 *     { number: 1, text: 'ברכת פרידה או פגישה', answer: 'שלום', row: 0, col: 0, length: 4 },
 *     ...
 *   ],
 *   downClues: [ ... ]
 * }
 */

export const puzzles: Puzzle[] = [
  {
    id: '2026-04-15',
    date: '2026-04-15',
    grid: [
      ['ש', 'מ', 'ש', 'ו', null], // Row 0: שמשו (His sun?) - Let's make better words
      ['ל', 'ח', 'ם', 'נ', 'י'], // Row 1: לחמני
      ['ו', 'ר', 'ד', 'ו', 'ת'], // Row 2: ורדות
      ['ם', 'ה', 'ה', 'ר', 'י'], // Row 3: מההרי
      [null, 'ר', 'ם', 'ה', 'ם'], // Row 4: רמהם
    ],
    acrossClues: [
      { number: 1, text: 'הכוכב שלנו (בנטייה)', answer: 'שמשו', row: 0, col: 0, length: 4 },
      { number: 5, text: 'סוג של מאפה קטן (סלנג)', answer: 'לחמני', row: 1, col: 0, length: 5 },
      { number: 7, text: 'צבע של פרחים מסוימים (רבים)', answer: 'ורדות', row: 2, col: 0, length: 5 },
      { number: 8, text: 'מכיוון ההרים', answer: 'מההרי', row: 3, col: 0, length: 5 },
      { number: 9, text: 'גבוהים וחזקים (סלנג/קיצור)', answer: 'רמהם', row: 4, col: 1, length: 4 },
    ],
    downClues: [
      { number: 1, text: 'מילת פרידה או פגישה', answer: 'שלום', row: 0, col: 0, length: 4 },
      { number: 2, text: 'מישהו שמתחרט', answer: 'מחרה', row: 0, col: 1, length: 4 }, // Not great
      { number: 3, text: 'שם של דג או מזל', answer: 'שמדה', row: 0, col: 2, length: 4 }, // Not great
      { number: 4, text: 'אורח או דייר', answer: 'ונרה', row: 0, col: 3, length: 4 }, // Not great
      { number: 6, text: 'ההפך מנמוך (רבים)', answer: 'יתים', row: 1, col: 4, length: 4 },
    ],
  },
  // Add more puzzles here...
  {
    id: '2026-04-16',
    date: '2026-04-16',
    grid: [
      ['א', 'ב', 'ג', 'ד', null],
      ['ה', 'ו', 'ז', 'ח', 'ט'],
      ['י', 'כ', 'ל', 'מ', 'נ'],
      ['ס', 'ע', 'פ', 'צ', 'ק'],
      [null, 'ר', 'ש', 'ת', 'א'],
    ],
    acrossClues: [
      { number: 1, text: 'ארבע האותיות הראשונות', answer: 'אבגד', row: 0, col: 0, length: 4 },
      { number: 5, text: 'חמש האותיות הבאות', answer: 'הוזחט', row: 1, col: 0, length: 5 },
      { number: 7, text: 'עוד חמש אותיות', answer: 'יכלמנ', row: 2, col: 0, length: 5 },
      { number: 8, text: 'ועוד חמש', answer: 'סעפצק', row: 3, col: 0, length: 5 },
      { number: 9, text: 'רשת א', answer: 'רשתא', row: 4, col: 1, length: 4 },
    ],
    downClues: [
      { number: 1, text: 'אותיות ראשונות בטור', answer: 'אהיס', row: 0, col: 0, length: 4 },
      { number: 2, text: 'טור שני', answer: 'בוכער', row: 0, col: 1, length: 5 },
      { number: 3, text: 'טור שלישי', answer: 'גזלפש', row: 0, col: 2, length: 5 },
      { number: 4, text: 'טור רביעי', answer: 'דחמצת', row: 0, col: 3, length: 5 },
      { number: 6, text: 'טור חמישי', answer: 'טנקא', row: 1, col: 4, length: 4 },
    ],
  }
];

export const getPuzzleByDate = (date: string): Puzzle | undefined => {
  return puzzles.find(p => p.date === date);
};
