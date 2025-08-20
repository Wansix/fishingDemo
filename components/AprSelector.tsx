'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface AprSelectorProps {
  selectedApr: number;
  onSelectApr: (apr: number) => void;
}

export default function AprSelector({ selectedApr, onSelectApr }: AprSelectorProps) {
  const aprOptions = [100, 200, 300];

  return (
    <section className="pt-24 pb-16 bg-slate-800/30" style={{ marginTop: '60px' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">
              APR 선택
            </h2>
          </div>
          <p className="text-slate-400">
            원하는 연간 수익률을 선택해보세요
          </p>
        </div>

        <div className="flex justify-center items-center space-x-6">
          {aprOptions.map((apr) => {
            const isSelected = selectedApr === apr;
            return (
              <motion.button
                key={apr}
                className="relative"
                onClick={() => onSelectApr(apr)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div
                  className="px-8 py-4 rounded-xl font-bold text-xl transition-all duration-300"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : '#1e293b',
                    color: isSelected ? 'white' : '#94a3b8',
                    border: isSelected 
                      ? '2px solid #10b981' 
                      : '2px solid #374151',
                    boxShadow: isSelected
                      ? '0 10px 30px rgba(16, 185, 129, 0.3)'
                      : '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {apr}%
                </div>
                
                {isSelected && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <span className="text-white text-xs font-bold">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-slate-500">
            선택한 APR: <span className="text-green-400 font-semibold">{selectedApr}%</span>
          </p>
        </div>
      </div>
    </section>
  );
}