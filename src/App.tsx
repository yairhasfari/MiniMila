/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Timer, HelpCircle, Settings, Share2, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import { CrosswordGrid } from './components/CrosswordGrid';
import { ClueList } from './components/ClueList';
import { VictoryModal } from './components/VictoryModal';
import { getPuzzleByDate } from './data/puzzles';
import { Puzzle, CellPosition, Direction, Clue } from './types';

export default function App() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [userGrid, setUserGrid] = useState<string[][]>(Array(5).fill(null).map(() => Array(5).fill('')));
  const [focusedCell, setFocusedCell] = useState<CellPosition>({ row: 0, col: 0 });
  const [activeDirection, setActiveDirection] = useState<Direction>('across');
  const [isSolved, setIsSolved] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize puzzle based on current date
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const dailyPuzzle = getPuzzleByDate(today);
    
    if (dailyPuzzle) {
      setPuzzle(dailyPuzzle);
      // Find first non-black cell to focus
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (dailyPuzzle.grid[r][c] !== null) {
            setFocusedCell({ row: r, col: c });
            setIsTimerRunning(true);
            return;
          }
        }
      }
    }
  }, []);

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
      const newGrid = [...userGrid.map(row => [...row])];
      if (newGrid[focusedCell.row][focusedCell.col] === '') {
        // Move back and then delete
        if (activeDirection === 'across') moveFocus(0, -1);
        else moveFocus(-1, 0);
      } else {
        newGrid[focusedCell.row][focusedCell.col] = '';
        setUserGrid(newGrid);
      }
    } else if (key === ' ') {
      setActiveDirection(prev => prev === 'across' ? 'down' : 'across');
    } else if (/^[א-ת]$/.test(key)) {
      const newGrid = [...userGrid.map(row => [...row])];
      newGrid[focusedCell.row][focusedCell.col] = key;
      setUserGrid(newGrid);
      
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
    const text = `מיני תשבץ ${puzzle?.date.split('-').reverse().slice(0, 2).join('/')} - ${formatTime(seconds)}\n${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: 'מיני תשבץ עברי', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('התוצאה הועתקה ללוח!');
    }
  };

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <h2 className="text-xl font-bold text-gray-600">טוען תשבץ יומי...</h2>
        </div>
      </div>
    );
  }

  const activeClue = getActiveClue();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center pb-12">
      {/* Header */}
      <header className="w-full max-w-[800px] px-4 py-6 flex justify-between items-baseline border-bottom border-grid-line mb-10">
        <div className="text-2xl font-extrabold tracking-[-0.5px] text-ink">
          תשבץ מיני <span className="text-accent">●</span>
        </div>
        
        <div className="text-sm text-[#6B7280] font-medium">
          {new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </div>

        <div className="font-mono text-lg font-semibold tabular-nums text-ink">
          {formatTime(seconds)}
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
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                  {activeDirection === 'across' ? 'מאוזן' : 'מאונך'}
                </div>
                <div className="text-sm font-medium leading-tight">
                  {activeClue?.text || 'בחר משבצת כדי להתחיל'}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="relative">
            <CrosswordGrid
              puzzle={puzzle}
              userGrid={userGrid}
              focusedCell={focusedCell}
              highlightedCells={getHighlightedCells()}
              activeCell={focusedCell}
              onCellClick={handleCellClick}
              onKeyDown={handleKeyDown}
            />
            
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
        <p className="text-xs text-gray-400 font-medium">השתמש במקלדת המכשיר כדי להקליד</p>
      </div>

      <VictoryModal
        isOpen={showVictory}
        time={formatTime(seconds)}
        date={puzzle.date.split('-').reverse().join('.')}
        onClose={() => setShowVictory(false)}
        onShare={handleShare}
      />
    </div>
  );
}
