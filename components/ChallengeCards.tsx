'use client';

import { motion } from 'framer-motion';
import { Coffee, UtensilsCrossed } from 'lucide-react';
import { COPY } from '@/lib/copy';

interface ChallengeCardsProps {
  onSelectChallenge: (type: 'coffee' | 'meal') => void;
  selectedChallenge?: 'coffee' | 'meal' | null;
}

export default function ChallengeCards({ onSelectChallenge, selectedChallenge }: ChallengeCardsProps) {
  const challenges = [
    {
      id: 'coffee' as const,
      icon: Coffee,
      ...COPY.coffee,
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      id: 'meal' as const,
      icon: UtensilsCrossed,
      ...COPY.meal,
      gradient: 'from-emerald-500 to-blue-600',
    },
  ];

  return (
    <section id="challenge" className="py-20 bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            챌린지를 선택하세요
          </h2>
          <p className="text-slate-400 text-lg">
            자신에게 맞는 수준으로 시작해보세요
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
          {challenges.map((challenge) => {
            const Icon = challenge.icon;
            const isSelected = selectedChallenge === challenge.id;
            return (
              <motion.div
                key={challenge.id}
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={() => onSelectChallenge(challenge.id)}
              >
                <div 
                  className="rounded-2xl p-8 border transition-all duration-300 shadow-xl"
                  style={{
                    background: isSelected 
                      ? challenge.id === 'coffee' 
                        ? 'linear-gradient(135deg, #f59e0b, #ea580c)' 
                        : 'linear-gradient(135deg, #10b981, #2563eb)'
                      : '#0f172a',
                    borderColor: isSelected ? 'rgba(255, 255, 255, 0.3)' : '#374151',
                    boxShadow: isSelected 
                      ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
                      : '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                    style={{
                      background: isSelected 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : challenge.id === 'coffee'
                          ? 'linear-gradient(to right, #f59e0b, #ea580c)'
                          : 'linear-gradient(to right, #10b981, #2563eb)'
                    }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-3 ${
                    isSelected ? 'text-white' : 'text-white'
                  }`}>
                    {challenge.title}
                  </h3>
                  
                  <div className={`text-lg font-semibold mb-3 ${
                    isSelected ? 'text-white/90' : 'text-blue-400'
                  }`}>
                    {challenge.deposit}
                  </div>
                  
                  <p className={`mb-6 leading-relaxed ${
                    isSelected ? 'text-white/80' : 'text-slate-300'
                  }`}>
                    {challenge.desc}
                  </p>
                  
                  <motion.div
                    className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 text-center"
                    style={{
                      background: isSelected 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : challenge.id === 'coffee'
                          ? 'linear-gradient(to right, #f59e0b, #ea580c)'
                          : 'linear-gradient(to right, #10b981, #2563eb)',
                      color: 'white',
                      border: isSelected ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSelected ? '✓ 선택됨' : challenge.cta}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
