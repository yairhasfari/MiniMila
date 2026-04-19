import React, { useEffect, useRef } from 'react';
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
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Focus hidden input when cell is focused to trigger mobile keyboard
  useEffect(() => {
    if (isFocused && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [isFocused]);

  if (isBlack) {
    return <div className="cell black" />;
  }

  const getValidationClass = () => {
    if (!isValidated || !value) return '';
    return isCorrect ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const handleHiddenInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    onKeyDown(e as any);
  };

  return (
    <>
      <div
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={0}
        className={`
          cell
          ${isHighlighted ? 'highlight' : ''}
          ${isActive ? 'active' : ''}
          ${isFocused ? 'focused' : ''}
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
      {/* Hidden input for mobile keyboard support */}
      {isFocused && (
        <input
          ref={hiddenInputRef}
          type="text"
          inputMode="text"
          value={value}
          onChange={() => {}}
          onKeyDown={handleHiddenInputKeyDown}
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            opacity: 0,
            pointerEvents: 'none',
          }}
          autoComplete="off"
          aria-hidden="true"
        />
      )}
    </>
  );
};
