'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface HarvestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function HarvestDialog({ isOpen, onClose, onConfirm, onCancel }: HarvestDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onConfirm();
    setIsProcessing(false);
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Dialog */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-700"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    수확 확인
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                  disabled={isProcessing}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="mb-8">
                <p className="text-slate-300 leading-relaxed mb-4 text-center text-lg">
                  수확하시겠습니까?
                </p>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                  <p className="text-sm text-slate-400 mb-2">
                    이 작업은 다음을 수행합니다:
                  </p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• 수확가능 수익을 수확한 수익에 추가</li>
                    <li>• 수확가능 수익을 0으로 초기화</li>
                    <li>• 새로운 수익이 다시 쌓이기 시작</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  (데모: UI만 동작하며 실제 거래는 발생하지 않습니다)
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 px-6 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors font-medium"
                  disabled={isProcessing}
                >
                  아니오
                </button>
                <motion.button
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-6 rounded-xl bg-green-600 text-white font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing}
                  whileHover={!isProcessing ? { scale: 1.02 } : {}}
                  whileTap={!isProcessing ? { scale: 0.98 } : {}}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>처리 중...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      <span>예</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 