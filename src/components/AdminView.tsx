import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Trash2, Grid, List, Calendar, ChevronRight, Edit3, Plus, Lock, LayoutDashboard } from 'lucide-react';
import { Puzzle, Clue, Direction } from '../types';

interface AdminViewProps {
  puzzles: Puzzle[];
  onSave: (puzzle: Puzzle) => void;
  onDelete: (date: string) => void;
  onClose: () => void;
}

type AdminMode = 'dashboard' | 'creator';

export const AdminView: React.FC<AdminViewProps> = ({ puzzles, onSave, onDelete, onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mode, setMode] = useState<AdminMode>('dashboard');
  
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<(string | null)[][]>(
    Array(5).fill(null).map(() => Array(5).fill(''))
  );
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [acrossClues, setAcrossClues] = useState<{ [key: string]: string }>({});
  const [downClues, setDownClues] = useState<{ [key: string]: string }>({});

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('סיסמה שגויה');
    }
  };

  const startNewPuzzle = () => {
    setEditingPuzzle(null);
    setGrid(Array(5).fill(null).map(() => Array(5).fill('')));
    setDate(new Date().toISOString().split('T')[0]);
    setAcrossClues({});
    setDownClues({});
    setMode('creator');
  };

  const editPuzzle = (p: Puzzle) => {
    setEditingPuzzle(p);
    setGrid(p.grid.map(row => [...row]));
    setDate(p.date);
    
    const ac: { [key: string]: string } = {};
    p.acrossClues.forEach(c => ac[`${c.row}-${c.col}`] = c.text);
    const dc: { [key: string]: string } = {};
    p.downClues.forEach(c => dc[`${c.row}-${c.col}`] = c.text);
    
    setAcrossClues(ac);
    setDownClues(dc);
    setMode('creator');
  };

  // Toggle black/white or input letter
  const handleCellClick = (r: number, c: number, e: React.MouseEvent) => {
    const newGrid = [...grid.map(row => [...row])];
    if (e.shiftKey || e.altKey) {
      newGrid[r][c] = newGrid[r][c] === null ? '' : null;
    }
    setGrid(newGrid);
  };

  const handleLetterChange = (r: number, c: number, val: string) => {
    if (grid[r][c] === null) return;
    const newGrid = [...grid.map(row => [...row])];
    newGrid[r][c] = val.slice(-1);
    setGrid(newGrid);
  };

  // Identify words and numbers (Visual Sync)
  const { identifiedAcross, identifiedDown, cellToNumber } = useMemo(() => {
    const across: Clue[] = [];
    const down: Clue[] = [];
    let currentNumber = 1;
    const c2n: { [key: string]: number } = {};

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] === null) continue;

        const isAcrossStart = (c === 0 || grid[r][c - 1] === null) && (c < 4 && grid[r][c + 1] !== null);
        const isDownStart = (r === 0 || grid[r - 1][c] === null) && (r < 4 && grid[r + 1][c] !== null);

        if (isAcrossStart || isDownStart) {
          c2n[`${r}-${c}`] = currentNumber;

          if (isAcrossStart) {
            let length = 0;
            let answer = '';
            let tempC = c;
            while (tempC < 5 && grid[r][tempC] !== null) {
              answer += grid[r][tempC] || ' ';
              length++;
              tempC++;
            }
            across.push({
              number: currentNumber,
              text: acrossClues[`${r}-${c}`] || '',
              answer,
              row: r,
              col: c,
              length
            });
          }

          if (isDownStart) {
            let length = 0;
            let answer = '';
            let tempR = r;
            while (tempR < 5 && grid[tempR][c] !== null) {
              answer += grid[tempR][c] || ' ';
              length++;
              tempR++;
            }
            down.push({
              number: currentNumber,
              text: downClues[`${r}-${c}`] || '',
              answer,
              row: r,
              col: c,
              length
            });
          }

          currentNumber++;
        }
      }
    }

    return { identifiedAcross: across, identifiedDown: down, cellToNumber: c2n };
  }, [grid, acrossClues, downClues]);

  const handleSave = () => {
    const puzzle: Puzzle = {
      id: date,
      date,
      grid: grid.map(row => row.map(cell => cell === null ? null : (cell || ' '))),
      acrossClues: identifiedAcross.map(clue => ({
        ...clue,
        text: acrossClues[`${clue.row}-${clue.col}`] || ''
      })),
      downClues: identifiedDown.map(clue => ({
        ...clue,
        text: downClues[`${clue.row}-${clue.col}`] || ''
      }))
    };

    console.log('Generated Puzzle JSON:', JSON.stringify(puzzle, null, 2));
    onSave(puzzle);
    setMode('dashboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-gray-400" size={24} />
          </div>
          <h2 className="text-2xl font-black mb-6">כניסת מנהל</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="password" 
              placeholder="הכנס סיסמה (1234)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-grid-line rounded-xl p-4 text-center font-bold outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <button className="w-full bg-ink text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all">
              התחבר
            </button>
            <button type="button" onClick={onClose} className="text-gray-400 text-sm hover:underline">חזרה למשחק</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-white border-b border-grid-line px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
          <h1 className="text-2xl font-black text-ink">ניהול תשבצים</h1>
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
              onClick={startNewPuzzle}
              className="bg-ink text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"
            >
              <Plus size={18} />
              תשבץ חדש
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <AnimatePresence mode="wait">
          {mode === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-2 mb-8 text-gray-400 font-bold uppercase tracking-widest text-sm">
                <LayoutDashboard size={16} />
                לוח בקרה
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {puzzles.sort((a, b) => b.date.localeCompare(a.date)).map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-2xl border border-grid-line shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                    <div>
                      <div className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">{p.date.split('-').reverse().join('.')}</div>
                      <div className="text-lg font-black text-ink">תשבץ {p.date}</div>
                      <div className="text-xs text-gray-400 mt-1">{p.acrossClues.length} מאוזן • {p.downClues.length} מאונך</div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => editPuzzle(p)}
                        className="p-2 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => { if(confirm('למחוק תשבץ זה?')) onDelete(p.date); }}
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
              key="creator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16"
            >
              {/* Grid Editor */}
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

              {/* Clues Editor */}
              <div className="flex flex-col gap-10">
                <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-sm">
                  <List size={16} />
                  הגדרות ורמזים
                </div>

                <div className="space-y-12">
                  <section>
                    <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-[1px] mb-6 border-b border-grid-line pb-2">מאוזן</h3>
                    <div className="space-y-6">
                      {identifiedAcross.map(clue => (
                        <div key={`across-${clue.number}`} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-accent text-ink w-6 h-6 rounded flex items-center justify-center font-black text-xs">{clue.number}</span>
                            <span className="text-xs font-bold text-gray-400">({clue.length} אותיות: {clue.answer})</span>
                          </div>
                          <input 
                            type="text"
                            placeholder="הכנס רמז למילה..."
                            value={acrossClues[`${clue.row}-${clue.col}`] || ''}
                            onChange={(e) => setAcrossClues({ ...acrossClues, [`${clue.row}-${clue.col}`]: e.target.value })}
                            className="w-full bg-white border border-grid-line rounded-xl p-4 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
                          />
                        </div>
                      ))}
                      {identifiedAcross.length === 0 && <p className="text-gray-300 italic text-sm">אין מילים מאוזנות</p>}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[13px] font-black text-gray-400 uppercase tracking-[1px] mb-6 border-b border-grid-line pb-2">מאונך</h3>
                    <div className="space-y-6">
                      {identifiedDown.map(clue => (
                        <div key={`down-${clue.number}`} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-accent text-ink w-6 h-6 rounded flex items-center justify-center font-black text-xs">{clue.number}</span>
                            <span className="text-xs font-bold text-gray-400">({clue.length} אותיות: {clue.answer})</span>
                          </div>
                          <input 
                            type="text"
                            placeholder="הכנס רמז למילה..."
                            value={downClues[`${clue.row}-${clue.col}`] || ''}
                            onChange={(e) => setDownClues({ ...downClues, [`${clue.row}-${clue.col}`]: e.target.value })}
                            className="w-full bg-white border border-grid-line rounded-xl p-4 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
                          />
                        </div>
                      ))}
                      {identifiedDown.length === 0 && <p className="text-gray-300 italic text-sm">אין מילים מאונכות</p>}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
