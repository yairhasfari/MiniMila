/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Timer, HelpCircle, Share2, RefreshCw, Lightbulb, CheckCircle2, Eye, Info } from 'lucide-react';
import { CrosswordCell } from './components/CrosswordCell';
import { ClueList } from './components/ClueList';
import { VictoryModal } from './components/VictoryModal';
import { AdminView } from './components/AdminView';
import { Footer } from './components/Footer';
import { puzzles as initialPuzzles } from './data/puzzles';
import { Puzzle, CellPosition, Direction, Clue } from './types';

const LOCAL_STORAGE_KEY = 'mini-puzzles';

const InstructionsModal = ({ showInstructions, setShowInstructions }: { showInstructions: boolean, setShowInstructions: (show: boolean) => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={() => setShowInstructions(false)}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white p-6 rounded-lg max-w-md mx-4 text-black"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold mb-4">איך לשחק</h2>
      <ul className="space-y-2 text-sm">
        <li>• מלא את הרשת עם המילים הנכונות</li>
        <li>• לחץ על תא כדי להתחיל לכתוב</li>
        <li>• השתמש בחצים כדי לנווט</li>
        <li>• לחץ על רמז כדי לראות את הרמז הנוכחי</li>
        <li>• לחץ על בדוק כדי לבדוק את התשובות</li>
        <li>• לחץ על חשוף מילה כדי לחשוף את המילה הנוכחית</li>
        <li>• שתף את התוצאה בסוף המשחק</li>
      </ul>
      <button
        onClick={() => setShowInstructions(false)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        סגור
      </button>
    </motion.div>
  </motion.div>
);

export default function App() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>(() => {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Puzzle[];
        const mergedMap = new Map<string, Puzzle>();
        initialPuzzles.forEach((puzzle) => mergedMap.set(puzzle.date, puzzle));
        parsed.forEach((puzzle) => mergedMap.set(puzzle.date, puzzle));
        return Array.from(mergedMap.values()).sort((a, b) => b.date.localeCompare(a.date));
      }
    } catch {
      // ignore invalid stored data and fall back to built-in puzzles
    }

    return initialPuzzles.slice().sort((a, b) => b.date.localeCompare(a.date));
  });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return window.localStorage.getItem('admin-auth') === 'true';
    } catch {
      return false;
    }
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [userGrid, setUserGrid] = useState<string[][]>(Array(5).fill(null).map(() => Array(5).fill('')));
  const [focusedCell, setFocusedCell] = useState<CellPosition>({ row: 0, col: 0 });
  const [activeDirection, setActiveDirection] = useState<Direction>('across');
  const [isSolved, setIsSolved] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [isCheckMode, setIsCheckMode] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'admin') {
      setIsAdminMode(true);
    }
  }, []);

  // Initialize puzzle based on current date with fallback to latest saved puzzle
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const dailyPuzzle = puzzles.find((p) => p.date === today);
    const latestPuzzle = puzzles.slice().sort((a, b) => b.date.localeCompare(a.date))[0] || null;
    const targetPuzzle = dailyPuzzle || latestPuzzle;

    if (targetPuzzle) {
      setPuzzle(targetPuzzle);
      setUserGrid(Array(5).fill(null).map(() => Array(5).fill('')));
      setIsSolved(false);
      setSeconds(0);
      setShowVictory(false);
      setIsCheckMode(false);
      setTotalAttempts(0);
      setCorrectAttempts(0);
      setIsTimerRunning(false);

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (targetPuzzle.grid[r][c] !== null) {
            setFocusedCell({ row: r, col: c });
            setIsTimerRunning(true);
            return;
          }
        }
      }
      return;
    }

    setPuzzle(null);
    setIsTimerRunning(false);
  }, [puzzles]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && !isSolved) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isSolved]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(puzzles));
    } catch {
      // ignore localStorage write errors
    }
  }, [puzzles]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const checkWin = useCallback((grid: string[][], currentPuzzle: Puzzle) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const correct = currentPuzzle.grid[r][c];
        if (correct !== null && grid[r][c] !== correct) {
          return false;
        }
      }
    }
    return true;
  }, []);

  const handleWin = useCallback(() => {
    setIsSolved(true);
    setIsTimerRunning(false);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFFFFF', '#B8860B']
    });
    setTimeout(() => setShowVictory(true), 1500);
  }, []);

  const getActiveClue = (): Clue | null => {
    if (!puzzle) return null;
    const clues = activeDirection === 'across' ? puzzle.acrossClues : puzzle.downClues;
    return clues.find(clue => {
      if (activeDirection === 'across') {
        return focusedCell.row === clue.row && 
               focusedCell.col >= clue.col && 
               focusedCell.col < clue.col + clue.length;
      } else {
        return focusedCell.col === clue.col && 
               focusedCell.row >= clue.row && 
               focusedCell.row < clue.row + clue.length;
      }
    }) || null;
  };

  const getHighlightedCells = (): CellPosition[] => {
    const clue = getActiveClue();
    if (!clue) return [];
    const cells: CellPosition[] = [];
    for (let i = 0; i < clue.length; i++) {
      if (activeDirection === 'across') {
        cells.push({ row: clue.row, col: clue.col + i });
      } else {
        cells.push({ row: clue.row + i, col: clue.col });
      }
    }
    return cells;
  };

  const moveFocus = (rowOffset: number, colOffset: number) => {
    if (!puzzle) return;
    let nextRow = focusedCell.row + rowOffset;
    let nextCol = focusedCell.col + colOffset;

    // Boundary check
    if (nextRow < 0 || nextRow >= 5 || nextCol < 0 || nextCol >= 5) return;

    // Skip black cells
    if (puzzle.grid[nextRow][nextCol] === null) {
      // Try moving one more step in the same direction
      nextRow += rowOffset;
      nextCol += colOffset;
      if (nextRow < 0 || nextRow >= 5 || nextCol < 0 || nextCol >= 5 || puzzle.grid[nextRow][nextCol] === null) return;
    }

    setFocusedCell({ row: nextRow, col: nextCol });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isSolved || !puzzle) return;

    const { key } = e;

    if (key === 'ArrowRight') {
      moveFocus(0, -1);
      setActiveDirection('across');
    } else if (key === 'ArrowLeft') {
      moveFocus(0, 1);
      setActiveDirection('across');
    } else if (key === 'ArrowUp') {
      moveFocus(-1, 0);
      setActiveDirection('down');
    } else if (key === 'ArrowDown') {
      moveFocus(1, 0);
      setActiveDirection('down');
    } else if (key === 'Backspace') {
      e.preventDefault();
      const newGrid = [...userGrid.map(row => [...row])];
      if (newGrid[focusedCell.row][focusedCell.col] === '') {
        // Cell is empty, move to previous cell
        if (activeDirection === 'across') moveFocus(0, -1);
        else moveFocus(-1, 0);
      } else {
        // Clear current cell
        newGrid[focusedCell.row][focusedCell.col] = '';
        setUserGrid(newGrid);
      }
    } else if (key === ' ') {
      setActiveDirection(prev => prev === 'across' ? 'down' : 'across');
    } else if (/^[א-ת]$/.test(key)) {
      const newGrid = [...userGrid.map(row => [...row])];
      newGrid[focusedCell.row][focusedCell.col] = key;
      setUserGrid(newGrid);
      
      // Accuracy tracking
      setTotalAttempts(prev => prev + 1);
      if (key === puzzle.grid[focusedCell.row][focusedCell.col]) {
        setCorrectAttempts(prev => prev + 1);
      }

      if (checkWin(newGrid, puzzle)) {
        handleWin();
      } else {
        // Auto advance
        if (activeDirection === 'across') moveFocus(0, 1);
        else moveFocus(1, 0);
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (isSolved) return;
    if (focusedCell.row === row && focusedCell.col === col) {
      setActiveDirection(prev => prev === 'across' ? 'down' : 'across');
    } else {
      setFocusedCell({ row, col });
    }
  };

  const handleClueClick = (clue: Clue, direction: Direction) => {
    if (isSolved) return;
    setFocusedCell({ row: clue.row, col: clue.col });
    setActiveDirection(direction);
  };

  const handleShare = () => {
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;
    const dateStr = puzzle?.date.split('-').reverse().slice(0, 2).join('/') || '';
    let gridEmojis = '';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (puzzle?.grid[r][c] === null) {
          gridEmojis += '⬛';
        } else if (userGrid[r][c] === puzzle.grid[r][c]) {
          gridEmojis += '🟩';
        } else {
          gridEmojis += '⬜';
        }
      }
      gridEmojis += '\n';
    }
    const text = `מיני-מילה ${dateStr}\n${formatTime(seconds)} | ${accuracy}%\n${gridEmojis}שחקו כאן: ${window.location.origin}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('התוצאה הועתקה ללוח!');
    });
  };

  const exitAdminMode = () => {
    setIsAdminMode(false);
    setIsAdminAuthenticated(false);
    setAdminPassword('');
  };

  const handleAdminSave = (newPuzzle: Puzzle) => {
    setPuzzles((prev) => {
      const filtered = prev.filter((p) => p.date !== newPuzzle.date);
      return [...filtered, newPuzzle].sort((a, b) => b.date.localeCompare(a.date));
    });
    exitAdminMode();
  };

  const handleDeletePuzzle = (date: string) => {
    setPuzzles(prev => prev.filter(p => p.date !== date));
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '12341') {
      setIsAdminAuthenticated(true);
      if (rememberMe) {
        try {
          window.localStorage.setItem('admin-auth', 'true');
        } catch {
          // ignore
        }
      }
    } else {
      alert('סיסמה שגויה');
    }
  };

  const revealLetter = () => {
    if (!puzzle || isSolved) return;
    const correctLetter = puzzle.grid[focusedCell.row][focusedCell.col];
    if (correctLetter) {
      const newGrid = [...userGrid.map(row => [...row])];
      newGrid[focusedCell.row][focusedCell.col] = correctLetter;
      setUserGrid(newGrid);
      if (checkWin(newGrid, puzzle)) handleWin();
    }
  };

  const revealWord = () => {
    if (!puzzle || isSolved) return;
    const clue = getActiveClue();
    if (!clue) return;
    const newGrid = userGrid.map((row) => [...row]);
    for (let i = 0; i < clue.length; i++) {
      const row = activeDirection === 'across' ? clue.row : clue.row + i;
      const col = activeDirection === 'across' ? clue.col + i : clue.col;
      newGrid[row][col] = puzzle.grid[row][col] || '';
    }
    setUserGrid(newGrid);
    if (checkWin(newGrid, puzzle)) handleWin();
  };

  if (isAdminMode && !isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleAdminAuth} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-black">הזן סיסמה</h2>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="border p-2 rounded w-full mb-4 bg-white text-black border-gray-300"
            placeholder="סיסמה"
          />
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="rememberMe" className="text-sm text-black">זכור אותי</label>
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            כניסה
          </button>
          <button
            type="button"
            onClick={exitAdminMode}
            className="mt-3 w-full bg-gray-200 text-black py-2 rounded hover:bg-gray-300"
          >
            חזרה למשחק
          </button>
        </form>
      </div>
    );
  }

  if (isAdminAuthenticated) {
    return (
      <AdminView 
        puzzles={puzzles}
        onSave={handleAdminSave} 
        onDelete={handleDeletePuzzle}
        onClose={exitAdminMode}
      />
    );
  }

  if (!puzzle) {
    if (puzzles.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="text-center max-w-lg">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">אין תשחצים במערכת</h2>
            <p className="text-base text-gray-500 mb-6">היכנס לעורך כדי ליצור את הראשון.</p>
            <button
              onClick={() => window.location.href = '?mode=admin'}
              className="text-sm text-ink font-semibold underline"
            >
              לפתיחת העורך
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <h2 className="text-xl font-bold text-gray-600">טוען תשבץ יומי...</h2>
          <button 
            onClick={() => window.location.href = '?mode=admin'}
            className="mt-4 text-xs text-gray-400 hover:underline"
          >
            פתח עריכה
          </button>
        </div>
      </div>
    );
  }

  const activeClue = getActiveClue();
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 100;

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center pb-12">
      {/* Header */}
      <header className="w-full max-w-[800px] px-4 py-6 flex justify-between items-baseline border-bottom border-grid-line mb-10">
        <div className="text-2xl font-extrabold tracking-[-0.5px] text-ink">
          תשבץ מיני <span className="text-accent">●</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInstructions(true)}
            className="p-2 rounded hover:bg-gray-100"
            title="הוראות"
          >
            <Info size={20} />
          </button>
          <div className="text-sm text-gray-600 font-medium hidden sm:block">
            {new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCheckMode(!isCheckMode)}
              className={`p-2 rounded-lg transition-all ${isCheckMode ? 'bg-accent text-ink shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}
              title="בדיקה אוטומטית"
            >
              <CheckCircle2 size={20} />
            </button>
            <button 
              onClick={revealLetter}
              className="p-2 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-lg transition-all"
              title="רמז (גלה אות)"
            >
              <Lightbulb size={20} />
            </button>
            <button 
              onClick={revealWord}
              className="p-2 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-lg transition-all"
              title="חשוף מילה"
            >
              <Eye size={20} />
            </button>
          </div>
          <div className="font-mono text-lg font-semibold tabular-nums text-ink">
            {formatTime(seconds)}
          </div>
        </div>
      </header>

      <main className="flex flex-col md:flex-row gap-12 items-start justify-center w-full max-w-[900px] px-4">
        {/* Grid Container */}
        <div className="flex flex-col items-center gap-6">
          {/* Active Clue Banner (Mobile/Top) */}
          <div className="w-full max-w-[400px] min-h-[60px]">
            <motion.div
              key={activeClue?.number + activeDirection}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-ink text-white p-4 rounded-xl shadow-xl flex items-center gap-4"
            >
              <div className="bg-accent text-ink w-8 h-8 rounded-lg flex items-center justify-center font-black shrink-0">
                {activeClue?.number}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-0.5">
                  {activeDirection === 'across' ? 'מאוזן' : 'מאונך'}
                </div>
                <div className="text-sm font-medium leading-tight">
                  {activeClue?.text || 'בחר משבצת כדי להתחיל'}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="relative">
            <div className="crossword-grid mx-auto">
              {Array.from({ length: 5 }).map((_, row) =>
                Array.from({ length: 5 }).map((_, col) => {
                  const isBlack = puzzle.grid[row][col] === null;
                  const cellNumbers: { [key: string]: number } = {};
                  [...puzzle.acrossClues, ...puzzle.downClues].forEach((clue) => {
                    cellNumbers[`${clue.row}-${clue.col}`] = clue.number;
                  });

                  return (
                    <CrosswordCell
                      key={`${row}-${col}`}
                      value={userGrid[row][col]}
                      isBlack={isBlack}
                      isFocused={focusedCell.row === row && focusedCell.col === col}
                      isHighlighted={getHighlightedCells().some(p => p.row === row && p.col === col)}
                      isActive={focusedCell.row === row && focusedCell.col === col}
                      isValidated={isCheckMode}
                      isCorrect={userGrid[row][col] === puzzle.grid[row][col]}
                      number={cellNumbers[`${row}-${col}`]}
                      onClick={() => handleCellClick(row, col)}
                      onChange={() => {}}
                      onKeyDown={handleKeyDown}
                    />
                  );
                })
              )}
            </div>
            
            {isSolved && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/10 backdrop-blur-[1px] pointer-events-none rounded-md"
              />
            )}
          </div>
        </div>

        {/* Clue Lists */}
        <div className="flex-1 w-full">
          <ClueList
            acrossClues={puzzle.acrossClues}
            downClues={puzzle.downClues}
            activeClue={activeClue}
            activeDirection={activeDirection}
            onClueClick={handleClueClick}
          />
        </div>
      </main>

      {/* Mobile Keyboard Helper (Optional, but good for UX) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-center gap-2">
        <p className="text-xs text-gray-500 font-medium">השתמש במקלדת המכשיר כדי להקליד</p>
      </div>

      <VictoryModal
        isOpen={showVictory}
        time={formatTime(seconds)}
        date={puzzle.date.split('-').reverse().join('.')}
        accuracy={accuracy}
        onClose={() => setShowVictory(false)}
        onShare={handleShare}
      />

      {showInstructions && <InstructionsModal showInstructions={showInstructions} setShowInstructions={setShowInstructions} />}

      <Footer />
    </div>
  );
}
