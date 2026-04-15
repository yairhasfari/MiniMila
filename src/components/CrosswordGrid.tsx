import React from 'react';
import { CrosswordCell } from './CrosswordCell';
import { Puzzle, CellPosition } from '../types';

interface CrosswordGridProps {
  puzzle: Puzzle;
  userGrid: string[][];
  focusedCell: CellPosition;
  highlightedCells: CellPosition[];
  activeCell: CellPosition;
  onCellClick: (row: number, col: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  puzzle,
  userGrid,
  focusedCell,
  highlightedCells,
  activeCell,
  onCellClick,
  onKeyDown,
}) => {
  const isHighlighted = (row: number, col: number) =>
    highlightedCells.some((pos) => pos.row === row && pos.col === col);

  const isActive = (row: number, col: number) =>
    activeCell.row === row && activeCell.col === col;

  const isFocused = (row: number, col: number) =>
    focusedCell.row === row && focusedCell.col === col;

  // Map to get clue numbers for cells
  const cellNumbers: { [key: string]: number } = {};
  [...puzzle.acrossClues, ...puzzle.downClues].forEach((clue) => {
    cellNumbers[`${clue.row}-${clue.col}`] = clue.number;
  });

  return (
    <div className="crossword-grid mx-auto">
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => {
          const isBlack = puzzle.grid[row][col] === null;
          return (
            <CrosswordCell
              key={`${row}-${col}`}
              value={userGrid[row][col]}
              isBlack={isBlack}
              isFocused={isFocused(row, col)}
              isHighlighted={isHighlighted(row, col)}
              isActive={isActive(row, col)}
              number={cellNumbers[`${row}-${col}`]}
              onClick={() => onCellClick(row, col)}
              onChange={() => {}} // Handled by onKeyDown in parent
              onKeyDown={onKeyDown}
            />
          );
        })
      )}
    </div>
  );
};
