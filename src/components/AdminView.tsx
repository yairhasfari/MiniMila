import React, { useEffect, useState } from 'react';
import { Puzzle } from '../types';
import { PuzzleAdmin } from './PuzzleAdmin';

interface AdminViewProps {
  puzzles: Puzzle[];
  onSave: (puzzle: Puzzle) => void;
  onDelete: (date: string) => void;
  onClose: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ puzzles, onSave, onDelete, onClose }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('mini-admin-auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAuthenticated(true);
      sessionStorage.setItem('mini-admin-auth', 'true');
    } else {
      alert('סיסמה שגויה');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
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
            <button type="button" onClick={onClose} className="text-gray-400 text-sm hover:underline">
              חזרה למשחק
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <PuzzleAdmin puzzles={puzzles} onSave={onSave} onDelete={onDelete} onClose={onClose} />;
};
