import bibleText from '../data/bible.txt?raw';
import bibleNounsText from '../data/bibleNouns.txt?raw';

const normalizeWord = (word: string): string => word.trim();

const rawHebrewWords = bibleText
  .split(/\r?\n/)
  .map(normalizeWord)
  .filter((word) => word.length >= 2 && word.length <= 8 && /^[\u0590-\u05FF]+$/.test(word));

const rawHebrewNounWords = bibleNounsText
  .split(/\r?\n/)
  .map(normalizeWord)
  .filter((word) => word.length >= 2 && word.length <= 8 && /^[\u0590-\u05FF]+$/.test(word));

export const HEBREW_LEXICON: Set<string> = new Set(rawHebrewWords);
export const HEBREW_NOUN_LEXICON: Set<string> = new Set(rawHebrewNounWords);

const shuffleArray = <T>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const HEBREW_WORDS_BY_LENGTH = rawHebrewWords.reduce((map, word) => {
  const length = word.length;
  const current = map.get(length);

  if (current) {
    current.push(word);
  } else {
    map.set(length, [word]);
  }

  return map;
}, new Map<number, string[]>());

export const HEBREW_NOUN_WORDS_BY_LENGTH = rawHebrewNounWords.reduce((map, word) => {
  const length = word.length;
  const current = map.get(length);

  if (current) {
    current.push(word);
  } else {
    map.set(length, [word]);
  }

  return map;
}, new Map<number, string[]>());

// Shuffle the word lists to ensure randomization
for (const [length, words] of HEBREW_WORDS_BY_LENGTH) {
  HEBREW_WORDS_BY_LENGTH.set(length, shuffleArray(words));
}

for (const [length, words] of HEBREW_NOUN_WORDS_BY_LENGTH) {
  HEBREW_NOUN_WORDS_BY_LENGTH.set(length, shuffleArray(words));
}

export const COMMON_HEBREW_WORDS: Set<string> = new Set([
  'שלום', 'תודה', 'בבקשה', 'כן', 'לא', 'מה', 'איפה', 'מתי', 'למה', 'מי',
  'אני', 'אתה', 'היא', 'הוא', 'אנחנו', 'אתם', 'הם', 'כלב', 'חתול', 'בית',
  'רכב', 'מים', 'אוכל', 'שמש', 'ירח', 'כוכב', 'ים', 'הר', 'עץ', 'פרח',
  'ספר', 'עט', 'נייר', 'מחשב', 'טלפון', 'שעון', 'כיסא', 'שולחן', 'מיטה', 'חלון',
  'דלת', 'רחוב', 'עיר', 'מדינה', 'עולם', 'אהבה', 'שמחה', 'כעס', 'פחד', 'תקווה',
  'חבר', 'משפחה', 'ילד', 'אישה', 'גבר', 'אבא', 'אמא', 'בן', 'בת', 'סבא',
  'סבתא', 'דוד', 'דודה', 'אח', 'אחות', 'חברה', 'עבודה', 'לימוד', 'פעם', 'שנה',
  'יום', 'לילה', 'בוקר', 'ערב', 'זמן', 'מקום', 'דרך', 'ביד', 'ברגל', 'בעיניים',
  'בפה', 'בלב', 'בנשמה', 'בנפש', 'בגוף', 'בראש', 'בודאב', 'צבע', 'רחוק', 'קרוב',
  'גדול', 'קטן', 'גבוה', 'נמוך', 'חם', 'קר', 'חזק', 'חלש', 'טוב', 'רע',
]);