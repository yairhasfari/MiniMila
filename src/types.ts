export type Direction = 'across' | 'down';

export interface Clue {
  number: number;
  text: string;
  answer: string;
  row: number;
  col: number;
  length: number;
}

export interface Puzzle {
  id: string;
  date: string; // YYYY-MM-DD
  grid: (string | null)[][]; // null for black squares, string for the correct letter
  acrossClues: Clue[];
  downClues: Clue[];
}

export interface CellPosition {
  row: number;
  col: number;
}
