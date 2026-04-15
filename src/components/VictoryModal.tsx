import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, RefreshCw } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  time: string;
  date: string;
  onClose: () => void;
  onShare: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  time,
  date,
  onClose,
  onShare,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center relative"
          >
            <div className="relative z-10">
              <h2 className="text-[32px] font-extrabold text-ink mb-4">כל הכבוד! 🎉</h2>
              
              <div className="bg-bg rounded-xl p-6 mb-8">
                <p id="statsSummary" className="text-lg font-medium text-gray-600">
                  תשבץ מיני {date.split('.').slice(0, 2).join('/')} • {time}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onShare}
                  className="bg-ink text-white py-3 px-8 rounded-full font-semibold cursor-pointer transition-all active:scale-95 shadow-lg"
                >
                  שתף תוצאה
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 font-medium py-2 hover:text-gray-600 transition-colors"
                >
                  סגור
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
