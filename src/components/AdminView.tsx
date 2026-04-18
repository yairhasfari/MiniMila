import React from 'react';
import { Puzzle } from '../types';
import { PuzzleAdmin } from './PuzzleAdmin';

interface AdminViewProps {
  puzzles: Puzzle[];
  onSave: (puzzle: Puzzle) => void;
  onDelete: (date: string) => void;
  onClose: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ puzzles, onSave, onDelete, onClose }) => {
  return <PuzzleAdmin puzzles={puzzles} onSave={onSave} onDelete={onDelete} onClose={onClose} />;
};
