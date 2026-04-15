import React from 'react';
import { motion } from 'motion/react';

interface CrosswordCellProps {
  value: string;
  isBlack: boolean;
  isFocused: boolean;
  isHighlighted: boolean;
  isActive: boolean;
  number?: number;
  onClick: () => void;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const CrosswordCell: React.FC<CrosswordCellProps> = ({
  value,
  isBlack,
  isFocused,
  isHighlighted,
  isActive,
  number,
  onClick,
  onKeyDown,
}) => {
  if (isBlack) {
    return <div className="cell black" />;
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      className={`
        cell
        ${isHighlighted ? 'highlight' : ''}
        ${isActive ? 'active' : ''}
        ${isFocused ? 'ring-2 ring-ink ring-inset z-10' : ''}
      `}
    >
      {number && (
        <span className="cell-num">
          {number}
        </span>
      )}
      <motion.span
        initial={false}
        animate={{ scale: value ? 1 : 0.8, opacity: value ? 1 : 0 }}
        className="text-inherit"
      >
        {value}
      </motion.span>
    </div>
  );
};
