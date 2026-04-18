import { HEBREW_WORDS_BY_LENGTH, HEBREW_LEXICON } from './hebrewDictionary';

type Grid = (string | null)[][];

type Segment = {
  row: number;
  col: number;
  length: number;
  direction: 'across' | 'down';
  pattern: string;
};

const getSegments = (grid: Grid): Segment[] => {
  const segments: Segment[] = [];

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === null) continue;
      if (c > 0 && grid[r][c - 1] !== null) continue;

      let length = 0;
      let pattern = '';
      for (let cc = c; cc < grid[r].length && grid[r][cc] !== null; cc++) {
        length++;
        pattern += grid[r][cc] === '' ? '?' : grid[r][cc];
      }

      if (length > 1) {
        segments.push({ row: r, col: c, length, direction: 'across', pattern });
      }
    }
  }

  for (let c = 0; c < grid[0].length; c++) {
    for (let r = 0; r < grid.length; r++) {
      if (grid[r][c] === null) continue;
      if (r > 0 && grid[r - 1][c] !== null) continue;

      let length = 0;
      let pattern = '';
      for (let rr = r; rr < grid.length && grid[rr][c] !== null; rr++) {
        length++;
        pattern += grid[rr][c] === '' ? '?' : grid[rr][c];
      }

      if (length > 1) {
        segments.push({ row: r, col: c, length, direction: 'down', pattern });
      }
    }
  }

  return segments;
};

const buildWordsByLength = (lexicon: Set<string>): Map<number, string[]> => {
  return [...lexicon].reduce((map, word) => {
    const length = word.length;
    const current = map.get(length);

    if (current) {
      current.push(word);
    } else {
      map.set(length, [word]);
    }

    return map;
  }, new Map<number, string[]>());
};

const patternMatchesWord = (pattern: string, word: string) => {
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== '?' && pattern[i] !== word[i]) {
      return false;
    }
  }

  return true;
};

const shuffleArray = <T>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const findMatchingWords = (
  pattern: string,
  wordsByLength: Map<number, string[]>,
  randomize: boolean = false
): string[] => {
  const candidates = wordsByLength.get(pattern.length) ?? [];
  const filtered = candidates.filter((word) => patternMatchesWord(pattern, word));
  return randomize ? shuffleArray(filtered) : filtered;
};

const getCurrentPattern = (gridState: Grid, segment: Segment) => {
  let pattern = '';

  for (let i = 0; i < segment.length; i++) {
    const r = segment.direction === 'across' ? segment.row : segment.row + i;
    const c = segment.direction === 'across' ? segment.col + i : segment.col;
    const cell = gridState[r][c];
    pattern += cell === '' ? '?' : cell;
  }

  return pattern;
};

const applyWordToGrid = (gridState: Grid, segment: Segment, word: string) => {
  const nextGrid = gridState.map((row) => [...row]);

  for (let i = 0; i < word.length; i++) {
    const r = segment.direction === 'across' ? segment.row : segment.row + i;
    const c = segment.direction === 'across' ? segment.col + i : segment.col;
    nextGrid[r][c] = word[i];
  }

  return nextGrid;
};

export const simpleAutoFill = (grid: Grid, lexicon: Set<string>): Grid => {
  const newGrid = grid.map((row) => [...row]);
  const segments = getSegments(newGrid);
  const wordsByLength = lexicon === HEBREW_LEXICON ? HEBREW_WORDS_BY_LENGTH : buildWordsByLength(lexicon);

  for (const segment of segments) {
    const candidates = findMatchingWords(segment.pattern, wordsByLength);

    if (candidates.length > 0) {
      const randomWord = candidates[Math.floor(Math.random() * candidates.length)];

      for (let i = 0; i < randomWord.length; i++) {
        if (segment.direction === 'across') {
          newGrid[segment.row][segment.col + i] = randomWord[i];
        } else {
          newGrid[segment.row + i][segment.col] = randomWord[i];
        }
      }
    }
  }

  return newGrid;
};

export const autoFillGridBacktracking = (
  initialGrid: Grid,
  lexicon: Set<string>,
  fillOneWord: boolean = false,
  maxAttempts: number = 20
): Grid | null => {
  const segments = getSegments(initialGrid);
  const wordsByLength = lexicon === HEBREW_LEXICON ? HEBREW_WORDS_BY_LENGTH : buildWordsByLength(lexicon);

  // Add timestamp-based randomization seed
  const seed = Date.now() % 1000;
  let randomCounter = seed;

  const seededRandom = () => {
    randomCounter = (randomCounter * 9301 + 49297) % 233280;
    return randomCounter / 233280;
  };

  const shuffleArraySeeded = <T>(items: T[]): T[] => {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const backtrack = (gridState: Grid, remainingSegments: number[], fillOneWord: boolean = false): boolean => {
    if (remainingSegments.length === 0) {
      return true;
    }

    let bestSegmentIndex = -1;
    let bestCandidateCount = Infinity;
    let bestCandidates: string[] = [];

    for (const segmentId of remainingSegments) {
      const segment = segments[segmentId];
      const pattern = getCurrentPattern(gridState, segment);
      const candidates = findMatchingWords(pattern, wordsByLength, true);

      if (candidates.length === 0) {
        return false;
      }

      if (candidates.length < bestCandidateCount) {
        bestCandidateCount = candidates.length;
        bestCandidates = candidates;
        bestSegmentIndex = segmentId;
      } else if (candidates.length === bestCandidateCount) {
        // Randomly choose between segments with same candidate count
        if (seededRandom() < 0.5) {
          bestCandidates = candidates;
          bestSegmentIndex = segmentId;
        }
      }
    }

    if (bestSegmentIndex === -1) {
      return false;
    }

    const nextRemaining = remainingSegments.filter((id) => id !== bestSegmentIndex);
    const segment = segments[bestSegmentIndex];
    const shuffledCandidates = shuffleArraySeeded(bestCandidates);

    for (const word of shuffledCandidates) {
      const nextGrid = applyWordToGrid(gridState, segment, word);

      // If fillOneWord is true, return true after filling one segment
      if (fillOneWord) {
        for (let r = 0; r < initialGrid.length; r++) {
          for (let c = 0; c < initialGrid[r].length; c++) {
            gridState[r][c] = nextGrid[r][c];
          }
        }
        return true;
      }

      if (backtrack(nextGrid, nextRemaining, fillOneWord)) {
        for (let r = 0; r < initialGrid.length; r++) {
          for (let c = 0; c < initialGrid[r].length; c++) {
            gridState[r][c] = nextGrid[r][c];
          }
        }

        return true;
      }
    }

    return false;
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const trialGrid = initialGrid.map((row) => [...row]);
    const shuffledSegmentIds = shuffleArraySeeded(segments.map((_, index) => index));

    if (backtrack(trialGrid, shuffledSegmentIds, fillOneWord)) {
      return trialGrid;
    }
  }

  return null;
};