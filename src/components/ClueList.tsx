import React from 'react';
import { Clue, Direction } from '../types';

interface ClueListProps {
  acrossClues: Clue[];
  downClues: Clue[];
  activeClue: Clue | null;
  activeDirection: Direction;
  onClueClick: (clue: Clue, direction: Direction) => void;
}

export const ClueList: React.FC<ClueListProps> = ({
  acrossClues,
  downClues,
  activeClue,
  activeDirection,
  onClueClick,
}) => {
  const renderClueSection = (title: string, clues: Clue[], direction: Direction) => (
    <div className="flex-1 min-w-[200px]">
      <h3 className="text-[13px] font-bold text-[#9CA3AF] uppercase tracking-[1px] mb-3">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {clues.map((clue) => (
          <li
            key={`${direction}-${clue.number}`}
            onClick={() => onClueClick(clue, direction)}
            className={`
              clue-item
              ${activeClue?.number === clue.number && activeDirection === direction
                ? 'active'
                : 'hover:bg-gray-100'}
            `}
          >
            <span className="font-extrabold ml-2 text-[#6B7280]">{clue.number}</span>
            <span className="text-inherit">{clue.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-8 w-full max-w-4xl mx-auto px-4">
      {renderClueSection('מאוזן', acrossClues, 'across')}
      {renderClueSection('מאונך', downClues, 'down')}
    </div>
  );
};
