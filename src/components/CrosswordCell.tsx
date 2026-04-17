import React from 'react';
import { motion } from 'motion/react';

interface CrosswordCellProps {
  value: string;
  isBlack: boolean;
  isFocused: boolean;
  isHighlighted: boolean;
  isActive: boolean;
  isValidated?: boolean;
  isCorrect?: boolean;
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
  isValidated,
  isCorrect,
  number,
  onClick,
  onKeyDown,
}) => {
  if (isBlack) {
    return <div className="cell black" />;
  }

  const getValidationClass = () => {
    if (!isValidated || !value) return '';
    return isCorrect ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

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
        ${getValidationClass()}
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
