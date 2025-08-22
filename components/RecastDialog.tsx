'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface RecastDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function RecastDialog({ isOpen, onClose, onConfirm }: RecastDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onConfirm();
    setIsProcessing(false);
    onClose();
    
    // Show success toast
    showToast('그물을 재배치했어요! 다시 잡히기 시작합니다. 🎣');
  };

  const showToast = (message: string) => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
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
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    그물 재배치
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
                <p className="text-slate-300 leading-relaxed mb-4">
                  물고기 떼 위치에 맞게 그물을 이동합니다.
                </p>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                  <p className="text-sm text-slate-400 mb-2">
                    이 작업은 다음을 수행합니다:
                  </p>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>• 현재 포지션 범위 조정</li>
                    <li>• 새로운 가격 범위로 리밸런스</li>
                    <li>• 수익 창출 재개</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  (데모: UI만 동작하며 실제 거래는 발생하지 않습니다)
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-6 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors font-medium"
                  disabled={isProcessing}
                >
                  취소
                </button>
                <motion.button
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-6 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <RotateCcw className="w-4 h-4" />
                      <span>서명(시뮬레이션)</span>
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
