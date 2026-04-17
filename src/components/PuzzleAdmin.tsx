import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Save, Trash2, Grid, List, Calendar, Edit3, Plus, LayoutDashboard, Download } from 'lucide-react';
import { Puzzle, Clue } from '../types';

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [acrossClues, setAcrossClues] = useState<{ [key: string]: string }>({});
  const [downClues, setDownClues] = useState<{ [key: string]: string }>({});

  const resetCreator = () => {
    setEditingPuzzle(null);
    setGrid(Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => '')));
    setDate(new Date().toISOString().split('T')[0]);
    setAcrossClues({});
    setDownClues({});
    setMode('creator');
  };

  const editPuzzle = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    setGrid(puzzle.grid.map((row) => [...row]));
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
    if (!event.shiftKey && !event.altKey) return;
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[row][col] = next[row][col] === null ? '' : null;
      return next;
    });
  };

  const handleLetterChange = (row: number, col: number, value: string) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      if (next[row][col] === null) return next;
      next[row][col] = value.slice(-1);
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

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-white border-b border-grid-line px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Edit3 size={24} />
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
                  className="bg-transparent border-none focus:ring-0 font-bold text-sm"
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
              <div className="flex items-center gap-2 mb-8 text-gray-400 font-bold uppercase tracking-widest text-sm">
                <Grid size={16} />
                עריכת לוח
              </div>

              <div className="crossword-grid mb-8">
                {grid.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      onClick={(e) => handleCellClick(r, c, e)}
                      className={`cell ${cell === null ? 'black' : ''} relative`}
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
                            className="w-full h-full bg-transparent text-center border-none focus:ring-0 p-0 text-2xl font-bold"
                          />
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="bg-gray-100 p-4 rounded-xl text-xs text-gray-500 max-w-sm text-center">
                <p className="font-bold mb-1">טיפים:</p>
                <p>• הקלד אותיות ישירות במשבצות</p>
                <p>• Shift + קליק להפיכת משבצת לשחורה/לבנה</p>
                <p>• המספרים מתעדכנים אוטומטית לפי מבנה הלוח</p>
              </div>
            </div>

            <div className="flex flex-col gap-10">
              <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-sm">
                <List size={16} />
                הגדרות ורמזים
              </div>

              <div className="space-y-12">
                <section>
                  <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-[1px] mb-6 border-b border-grid-line pb-2">מאוזן</h3>
                  <div className="space-y-6">
                    {identifiedAcross.map((clue) => (
                      <div key={`across-${clue.number}`} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-accent text-ink w-6 h-6 rounded flex items-center justify-center font-black text-xs">
                            {clue.number}
                          </span>
                          <span className="text-xs font-bold text-gray-400">({clue.length} אותיות: {clue.answer})</span>
                        </div>
                        <input
                          type="text"
                          placeholder="הכנס רמז למילה..."
                          value={acrossClues[`${clue.row}-${clue.col}`] || ''}
                          onChange={(e) =>
                            setAcrossClues({ ...acrossClues, [`${clue.row}-${clue.col}`]: e.target.value })
                          }
                          className="w-full bg-white border border-grid-line rounded-xl p-4 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                      </div>
                    ))}
                    {identifiedAcross.length === 0 && (
                      <p className="text-gray-300 italic text-sm">אין מילים מאוזנות</p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-[1px] mb-6 border-b border-grid-line pb-2">מאונך</h3>
                  <div className="space-y-6">
                    {identifiedDown.map((clue) => (
                      <div key={`down-${clue.number}`} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-accent text-ink w-6 h-6 rounded flex items-center justify-center font-black text-xs">
                            {clue.number}
                          </span>
                          <span className="text-xs font-bold text-gray-400">({clue.length} אותיות: {clue.answer})</span>
                        </div>
                        <input
                          type="text"
                          placeholder="הכנס רמז למילה..."
                          value={downClues[`${clue.row}-${clue.col}`] || ''}
                          onChange={(e) =>
                            setDownClues({ ...downClues, [`${clue.row}-${clue.col}`]: e.target.value })
                          }
                          className="w-full bg-white border border-grid-line rounded-xl p-4 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                      </div>
                    ))}
                    {identifiedDown.length === 0 && (
                      <p className="text-gray-300 italic text-sm">אין מילים מאונכות</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};
