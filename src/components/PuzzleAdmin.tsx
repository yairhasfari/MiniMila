import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Trash2, Grid, List, Calendar, Edit3, Plus, LayoutDashboard, Download, Zap, Wand2 } from 'lucide-react';
import { Puzzle, Clue } from '../types';
import { Footer } from './Footer';
import { HEBREW_LEXICON, HEBREW_NOUN_LEXICON } from '../utils/hebrewDictionary';
import { autoFillGridBacktracking } from '../utils/crosswordBacktracking';
import { generateCluesForGrid } from '../utils/clueGenerator';

interface PuzzleAdminProps {
  puzzles: Puzzle[];
  onSave: (puzzle: Puzzle) => void;
  onDelete: (date: string) => void;
  onClose: () => void;
}

type AdminMode = 'dashboard' | 'creator';

export const PuzzleAdmin: React.FC<PuzzleAdminProps> = ({ puzzles, onSave, onDelete, onClose }) => {
  const [mode, setMode] = useState<AdminMode>('dashboard');
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ''))
  );
  const [userInput, setUserInput] = useState<boolean[][]>(
    Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false))
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [acrossClues, setAcrossClues] = useState<{ [key: string]: string }>({});
  const [downClues, setDownClues] = useState<{ [key: string]: string }>({});
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [highlightedCells, setHighlightedCells] = useState<{ row: number; col: number }[]>([]);

  // Calculate cells for a specific clue
  const getClueCells = (clue: Clue, direction: 'across' | 'down') => {
    const cells: { row: number; col: number }[] = [];
    const { row, col, length } = clue;

    for (let i = 0; i < length; i++) {
      if (direction === 'across') {
        if (col + i < 5) cells.push({ row, col: col + i });
      } else {
        if (row + i < 5) cells.push({ row: row + i, col });
      }
    }

    return cells;
  };

  // Handle clue input focus to highlight cells
  const handleClueFocus = (clue: Clue, direction: 'across' | 'down') => {
    const cells = getClueCells(clue, direction);
    setHighlightedCells(cells);
  };

  // Handle clue input blur to clear highlighting
  const handleClueBlur = () => {
    setHighlightedCells([]);
  };

  const resetCreator = () => {
    setEditingPuzzle(null);
    setGrid(Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => '')));
    setUserInput(Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => false)));
    setDate(new Date().toISOString().split('T')[0]);
    setAcrossClues({});
    setDownClues({});
    setMode('creator');
  };

  const editPuzzle = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    setGrid(puzzle.grid.map((row) => [...row]));
    setUserInput(puzzle.grid.map((row) => row.map((cell) => cell !== null && cell !== '')));
    setDate(puzzle.date);

    const ac: { [key: string]: string } = {};
    puzzle.acrossClues.forEach((clue) => {
      ac[`${clue.row}-${clue.col}`] = clue.text;
    });

    const dc: { [key: string]: string } = {};
    puzzle.downClues.forEach((clue) => {
      dc[`${clue.row}-${clue.col}`] = clue.text;
    });

    setAcrossClues(ac);
    setDownClues(dc);
    setMode('creator');
  };

  const handleCellClick = (row: number, col: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (event.shiftKey || event.altKey) {
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[row][col] = next[row][col] === null ? '' : null;
        return next;
      });
      setUserInput((prev) => {
        const next = prev.map((row) => [...row]);
        next[row][col] = false;
        return next;
      });
      return;
    }
    setSelectedCell({ row, col });
  };

  const handleLetterChange = (row: number, col: number, value: string) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      if (next[row][col] === null) return next;
      next[row][col] = value.slice(-1);
      return next;
    });
    setUserInput((prev) => {
      const next = prev.map((row) => [...row]);
      next[row][col] = value.slice(-1) !== '';
      return next;
    });
  };

  const { identifiedAcross, identifiedDown, cellToNumber } = useMemo(() => {
    const across: Clue[] = [];
    const down: Clue[] = [];
    const cellNumbers: { [key: string]: number } = {};
    let currentNumber = 1;

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] === null) continue;

        const isAcrossStart =
          (c === 0 || grid[r][c - 1] === null) &&
          (c < 4 && grid[r][c + 1] !== null);
        const isDownStart =
          (r === 0 || grid[r - 1][c] === null) &&
          (r < 4 && grid[r + 1][c] !== null);

        if (isAcrossStart || isDownStart) {
          cellNumbers[`${r}-${c}`] = currentNumber;

          if (isAcrossStart) {
            let length = 0;
            let answer = '';
            let scanC = c;
            while (scanC < 5 && grid[r][scanC] !== null) {
              answer += grid[r][scanC] || ' ';
              length += 1;
              scanC += 1;
            }
            across.push({
              number: currentNumber,
              text: acrossClues[`${r}-${c}`] || '',
              answer,
              row: r,
              col: c,
              length,
            });
          }

          if (isDownStart) {
            let length = 0;
            let answer = '';
            let scanR = r;
            while (scanR < 5 && grid[scanR][c] !== null) {
              answer += grid[scanR][c] || ' ';
              length += 1;
              scanR += 1;
            }
            down.push({
              number: currentNumber,
              text: downClues[`${r}-${c}`] || '',
              answer,
              row: r,
              col: c,
              length,
            });
          }

          currentNumber += 1;
        }
      }
    }

    return {
      identifiedAcross: across,
      identifiedDown: down,
      cellToNumber: cellNumbers,
    };
  }, [grid, acrossClues, downClues]);

  const handleSave = () => {
    const validPuzzle = grid.every((row) =>
      row.every((cell) => cell === null || (typeof cell === 'string' && cell.trim().length === 1))
    );

    if (!validPuzzle) {
      alert('אנא מלא/י כל משבצת שאינה שחורה באות אחת.');
      return;
    }

    const newPuzzle: Puzzle = {
      id: date,
      date,
      grid: grid.map((row) =>
        row.map((value) => (value === null ? null : value.trim() || ''))
      ),
      acrossClues: identifiedAcross.map((clue) => ({
        ...clue,
        text: acrossClues[`${clue.row}-${clue.col}`] || '',
      })),
      downClues: identifiedDown.map((clue) => ({
        ...clue,
        text: downClues[`${clue.row}-${clue.col}`] || '',
      })),
    };

    onSave(newPuzzle);
    setMode('dashboard');
  };

  const downloadExport = () => {
    try {
      const json = JSON.stringify(puzzles, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `puzzles-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('לא ניתן ליצור קובץ ייצוא לשמירה. נא שתף את המידע באופן ידני.');
    }
  };

  const handleGenerateClues = async () => {
    console.log('🎯 Starting clue generation...');
    console.log('📊 identifiedAcross:', identifiedAcross);
    console.log('📊 identifiedDown:', identifiedDown);

    const acrossWords = identifiedAcross
      .map((clue) => clue.answer.trim().replace(/\s+/g, ''))
      .filter((word) => word.length > 0);
    const downWords = identifiedDown
      .map((clue) => clue.answer.trim().replace(/\s+/g, ''))
      .filter((word) => word.length > 0);

    console.log('📝 Across words (filtered):', acrossWords);
    console.log('📝 Down words (filtered):', downWords);

    if (acrossWords.length === 0 && downWords.length === 0) {
      alert('אין מילים בתשבץ. אנא מלא את התשבץ תחילה.');
      return;
    }

    try {
      const generatedClues = await generateCluesForGrid({
        across: acrossWords,
        down: downWords,
      });

      console.log('🎉 Generated clues result:', generatedClues);

      // Update across clues
      identifiedAcross.forEach((clue, index) => {
        const key = `${clue.row}-${clue.col}`;
        if (!acrossClues[key] && generatedClues[`across-${index}`]) {
          setAcrossClues((prev) => ({
            ...prev,
            [key]: generatedClues[`across-${index}`],
          }));
        }
      });

      // Update down clues
      identifiedDown.forEach((clue, index) => {
        const key = `${clue.row}-${clue.col}`;
        if (!downClues[key] && generatedClues[`down-${index}`]) {
          setDownClues((prev) => ({
            ...prev,
            [key]: generatedClues[`down-${index}`],
          }));
        }
      });

      alert('נוצרו הגדרות אוטומטית לתאים ריקים!');
    } catch (error) {
      console.error('💥 Error generating clues:', error);
      alert(`שגיאה בהפקת הגדרות אוטומטיות: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getSelectedWordCells = () => {
    if (!selectedCell) return [];
    const { row, col } = selectedCell;
    if (grid[row][col] === null) return [];

    const cells: { row: number; col: number }[] = [];
    if (selectedDirection === 'across') {
      let start = col;
      while (start > 0 && grid[row][start - 1] !== null) start -= 1;
      let cursor = start;
      while (cursor < 5 && grid[row][cursor] !== null) {
        cells.push({ row, col: cursor });
        cursor += 1;
      }
    } else {
      let start = row;
      while (start > 0 && grid[start - 1][col] !== null) start -= 1;
      let cursor = start;
      while (cursor < 5 && grid[cursor][col] !== null) {
        cells.push({ row: cursor, col });
        cursor += 1;
      }
    }

    return cells;
  };

  const clearBoard = () => {
    setGrid((prev) => prev.map((row) => row.map((cell) => (cell === null ? null : ''))));
    setUserInput((prev) => prev.map((row) => row.map(() => false)));
  };

  const clearSelectedWord = () => {
    const cells = getSelectedWordCells();
    if (cells.length === 0) {
      alert('בחר תא תקין לפני מחיקת מילה.');
      return;
    }
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      cells.forEach(({ row, col }) => {
        if (next[row][col] !== null) {
          next[row][col] = '';
        }
      });
      return next;
    });
    setUserInput((prev) => {
      const next = prev.map((row) => [...row]);
      cells.forEach(({ row, col }) => {
        if (grid[row][col] !== null) {
          next[row][col] = false;
        }
      });
      return next;
    });
  };

  const toggleSelectedDirection = () => {
    setSelectedDirection((current) => (current === 'across' ? 'down' : 'across'));
  };

  const handleAutoFill = (lexicon: Set<string>, fillOneWord: boolean = false) => {
    // Create a grid that preserves user input and black squares, allows autofill in empty/autofilled cells
    const fillableGrid = grid.map((row, r) =>
      row.map((cell, c) => {
        if (cell === null) return null; // Preserve black squares
        return userInput[r][c] ? cell : ''; // Preserve user input, allow filling empty/autofilled cells
      })
    );

    const filledGrid = autoFillGridBacktracking(fillableGrid, lexicon, fillOneWord);

    if (filledGrid) {
      setGrid(filledGrid);
      // Mark autofilled cells as not user input
      setUserInput((prev) => {
        const next = prev.map((row, r) =>
          row.map((cell, c) => {
            if (grid[r][c] === null) return false; // Black squares are never user input
            return cell || (filledGrid[r][c] !== '' && filledGrid[r][c] !== grid[r][c]);
          })
        );
        return next;
      });
      return;
    }

    alert('לא ניתן למלא את הלוח עם המילון הנוכחי והאותיות הקיימות. נסה לשנות את המבנה או לבדוק אם מילאת אותיות לא תואמות.');
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-20">
      <header className="bg-white border-b border-grid-line px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Edit3 size={24} />
          </button>
          <button
            onClick={onClose}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all"
          >
            חזרה למשחק
          </button>
          <div>
            <h1 className="text-2xl font-black text-ink">ניהול תשבצים</h1>
            <p className="text-sm text-gray-500">מסלול מנהל מאובטח /secret-gate</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mode === 'creator' ? (
            <>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-grid-line">
                <Calendar size={16} className="text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 font-bold text-sm text-black"
                />
              </div>
              <button
                onClick={handleSave}
                className="bg-ink text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"
              >
                <Save size={18} />
                שמור
              </button>
              <button
                onClick={() => setMode('dashboard')}
                className="text-gray-400 font-bold px-4 py-2 hover:text-gray-600"
              >
                ביטול
              </button>
            </>
          ) : (
            <button
              onClick={resetCreator}
              className="bg-ink text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"
            >
              <Plus size={18} />
              תשבץ חדש
            </button>
          )}
          <button
            onClick={downloadExport}
            className="bg-white text-ink px-4 py-2 rounded-xl border border-grid-line font-bold flex items-center gap-2 hover:bg-gray-50 transition-all"
          >
            <Download size={18} />
            ייצא קובץ נתונים
          </button>
          <button
            onClick={clearBoard}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold transition-all"
          >
            נקה לוח
          </button>
          <button
            onClick={clearSelectedWord}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-xl font-bold transition-all"
          >
            מחיקת מילה
          </button>
          <button
            onClick={toggleSelectedDirection}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-bold transition-all"
          >
            כיוון: {selectedDirection === 'across' ? 'מאוזן' : 'מאונך'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {mode === 'dashboard' ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-2 mb-8 text-gray-400 font-bold uppercase tracking-widest text-sm">
              <LayoutDashboard size={16} />
              לוח בקרה
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {puzzles
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((puzzleItem) => (
                  <div
                    key={puzzleItem.id}
                    className="bg-white p-6 rounded-2xl border border-grid-line shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group"
                  >
                    <div>
                      <div className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">
                        {puzzleItem.date.split('-').reverse().join('.')}
                      </div>
                      <div className="text-lg font-black text-ink">תשבץ {puzzleItem.date}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {puzzleItem.acrossClues.length} מאוזן • {puzzleItem.downClues.length} מאונך
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => editPuzzle(puzzleItem)}
                        className="p-2 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('למחוק תשבץ זה?')) onDelete(puzzleItem.date);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              {puzzles.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-grid-line rounded-3xl">
                  <p className="text-gray-400 font-medium">אין תשבצים שמורים עדיין</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-8 text-gray-700 font-bold uppercase tracking-widest text-sm">
                <Grid size={16} />
                עריכת לוח
              </div>

              <div className="crossword-grid mb-8">
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isHighlighted = highlightedCells.some(pos => pos.row === r && pos.col === c);
                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={(e) => handleCellClick(r, c, e)}
                        className={`cell ${cell === null ? 'black' : ''} ${isHighlighted ? 'highlight' : ''} relative`}
                      >
                        {cell !== null && (
                          <>
                            {cellToNumber[`${r}-${c}`] && (
                              <span className="cell-num">{cellToNumber[`${r}-${c}`]}</span>
                            )}
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleLetterChange(r, c, e.target.value)}
                              className={`w-full h-full bg-transparent text-center border-none focus:ring-0 p-0 text-2xl font-bold ${
                                userInput[r][c] ? 'text-blue-600' : 'text-gray-600'
                              }`}
                            />
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <button
                  onClick={() => handleAutoFill(HEBREW_LEXICON, false)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                  <Zap size={18} />
                  מילוי אוטומטי
                </button>
                <button
                  onClick={() => handleAutoFill(HEBREW_NOUN_LEXICON, false)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                  <Zap size={18} />
                  מילוי שם עצם
                </button>
                <button
                  onClick={() => handleAutoFill(HEBREW_LEXICON, true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                  <Zap size={18} />
                  מילוי מילה אחת
                </button>
              </div>

              <button
                onClick={handleGenerateClues}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all w-full justify-center"
              >
                <Wand2 size={20} />
                צור הגדרות אוטומטית
              </button>

              <button
                onClick={async () => {
                  console.log('🔑 API Key exists:', !!import.meta.env.VITE_GROQ_API_KEY);
                  console.log('🔑 API Key value:', import.meta.env.VITE_GROQ_API_KEY?.substring(0, 10) + '...');

                  // Test API call
                  try {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        model: 'llama-3.1-8b-instant',
                        messages: [
                          { role: 'user', content: 'Say "Hello" in Hebrew' }
                        ],
                        max_tokens: 10,
                      }),
                    });

                    console.log('🧪 Test API response status:', response.status);
                    if (response.ok) {
                      const data = await response.json();
                      console.log('🧪 Test API response:', data);
                      alert('API test successful! Check console for details.');
                    } else {
                      const error = await response.text();
                      console.error('🧪 Test API error:', error);
                      alert('API test failed! Check console.');
                    }
                  } catch (error) {
                    console.error('🧪 Test API network error:', error);
                    alert('API test network error! Check console.');
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                🧪 Test API
              </button>

              <div className="bg-gray-100 p-4 rounded-xl text-xs text-gray-700 max-w-sm text-center">
                <p className="font-bold mb-1 text-gray-900">טיפים:</p>
                <p>• הקלד אותיות ישירות במשבצות (כחול = ידני)</p>
                <p>• Shift + קליק להפיכת משבצת לשחורה/לבנה</p>
                <p>• מילוי אוטומטי משמר את האותיות שהקלדת</p>
                <p>• מילוי מילה אחת ממלא רק מילה בודדת</p>
              </div>
            </div>

            <div className="flex flex-col gap-10">
              <div className="flex items-center gap-2 text-gray-700 font-bold uppercase tracking-widest text-sm">
                <List size={16} />
                הגדרות ורמזים
              </div>

              <div className="space-y-12">
                <section>
                  <h3 className="text-[13px] font-black text-gray-700 uppercase tracking-[1px] mb-6 border-b border-grid-line pb-2">מאוזן</h3>
                  <div className="space-y-6">
                    {identifiedAcross.map((clue) => (
                      <div key={`across-${clue.number}`} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-accent text-ink w-6 h-6 rounded flex items-center justify-center font-black text-xs">
                            {clue.number}
                          </span>
                          <span className="text-xs font-bold text-gray-700">({clue.length} אותיות: {clue.answer})</span>
                        </div>
                        <input
                          type="text"
                          placeholder="הכנס רמז למילה..."
                          value={acrossClues[`${clue.row}-${clue.col}`] || ''}
                          onChange={(e) =>
                            setAcrossClues({ ...acrossClues, [`${clue.row}-${clue.col}`]: e.target.value })
                          }
                          onFocus={() => handleClueFocus(clue, 'across')}
                          onBlur={handleClueBlur}
                          className="w-full bg-white border border-grid-line rounded-xl p-4 text-sm text-black placeholder:text-gray-500 focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                      </div>
                    ))}
                    {identifiedAcross.length === 0 && (
                      <p className="text-gray-600 italic text-sm">אין מילים מאוזנות</p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-[13px] font-black text-gray-700 uppercase tracking-[1px] mb-6 border-b border-grid-line pb-2">מאונך</h3>
                  <div className="space-y-6">
                    {identifiedDown.map((clue) => (
                      <div key={`down-${clue.number}`} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-accent text-ink w-6 h-6 rounded flex items-center justify-center font-black text-xs">
                            {clue.number}
                          </span>
                          <span className="text-xs font-bold text-gray-700">({clue.length} אותיות: {clue.answer})</span>
                        </div>
                        <input
                          type="text"
                          placeholder="הכנס רמז למילה..."
                          value={downClues[`${clue.row}-${clue.col}`] || ''}
                          onChange={(e) =>
                            setDownClues({ ...downClues, [`${clue.row}-${clue.col}`]: e.target.value })
                          }
                          onFocus={() => handleClueFocus(clue, 'down')}
                          onBlur={handleClueBlur}
                          className="w-full bg-white border border-grid-line rounded-xl p-4 text-sm text-black placeholder:text-gray-500 focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                      </div>
                    ))}
                    {identifiedDown.length === 0 && (
                      <p className="text-gray-600 italic text-sm">אין מילים מאונכות</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
};
