'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, RotateCcw, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';

interface PriceControlProps {
  onSetRange: (min: number, max: number) => void;
  onResetToRandom: () => void;
  currentRange: { min: number; max: number } | null;
  onStart: () => void;
  onStop: () => void;
  isRunning: boolean;
  onIncrementPrice: () => void;
  onDecrementPrice: () => void;
  onStartDemo: () => void;
  onStopDemo: () => void;
  isDemoRunning: boolean;
}

export default function PriceControl({ onSetRange, onResetToRandom, currentRange, onStart, onStop, isRunning, onIncrementPrice, onDecrementPrice, onStartDemo, onStopDemo, isDemoRunning }: PriceControlProps) {
  const [minPrice, setMinPrice] = useState(140);
  const [maxPrice, setMaxPrice] = useState(150);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pressInterval, setPressInterval] = useState<NodeJS.Timeout | null>(null);

  const handleApply = () => {
    if (minPrice >= maxPrice) {
      alert('최소 가격은 최대 가격보다 작아야 합니다.');
      return;
    }
    onSetRange(minPrice, maxPrice);
  };

  const handleReset = () => {
    onResetToRandom();
    setIsExpanded(false);
  };

  const handleMouseDown = (direction: 'increment' | 'decrement') => {
    // First click
    if (direction === 'increment') {
      onIncrementPrice();
    } else {
      onDecrementPrice();
    }

    // Set up continuous pressing
    const interval = setInterval(() => {
      if (direction === 'increment') {
        onIncrementPrice();
      } else {
        onDecrementPrice();
      }
    }, 100); // Every 100ms for smooth increment

    setPressInterval(interval);
  };

  const handleMouseUp = () => {
    if (pressInterval) {
      clearInterval(pressInterval);
      setPressInterval(null);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-30 flex space-x-2" style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 30 }}>


      {/* Manual Price Control Buttons */}
      <motion.button
        onMouseDown={() => handleMouseDown('decrement')}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="mb-2 p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ 
          backgroundColor: '#ea580c', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '8px', 
          marginBottom: '8px' 
        }}
      >
        <ChevronLeft className="w-4 h-4" />
      </motion.button>

      <motion.button
        onMouseDown={() => handleMouseDown('increment')}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="mb-2 p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ 
          backgroundColor: '#ea580c', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '8px', 
          marginBottom: '8px' 
        }}
      >
        <ChevronRight className="w-4 h-4" />
      </motion.button>

      {/* Demo Button */}
      <motion.button
        onClick={isDemoRunning ? onStopDemo : onStartDemo}
        className={`mb-2 p-2 text-white rounded-lg shadow-lg flex items-center space-x-2 ${
          isDemoRunning ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ 
          backgroundColor: isDemoRunning ? '#9333ea' : '#a855f7', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '8px', 
          marginBottom: '8px' 
        }}
      >
        <PlayCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{isDemoRunning ? '데모 정지' : '데모'}</span>
      </motion.button>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px', borderRadius: '8px', marginBottom: '8px' }}
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">가격 설정</span>
      </motion.button>

      {/* Price Control Panel */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        style={{ overflow: 'hidden' }}
        className="bg-slate-900 backdrop-blur-sm rounded-xl border-2 border-slate-600 shadow-2xl"
      >
        <div className="p-4" style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '12px', border: '2px solid #475569' }}>
          <div className="space-y-4">
            {/* Current Status */}
            <div className="text-xs text-green-400 mb-2" style={{ fontSize: '12px', color: '#4ade80', marginBottom: '8px' }}>
              {currentRange ? `활성: $${currentRange.min} ~ $${currentRange.max}` : '랜덤 모드'}
            </div>

            {/* Min Price Input */}
            <div>
              <label className="block text-sm text-slate-300 mb-1" style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '4px' }}>
                최소 가격
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
                min="1"
                max="999"
              />
            </div>

            {/* Max Price Input */}
            <div>
              <label className="block text-sm text-slate-300 mb-1" style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '4px' }}>
                최대 가격
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
                min="2"
                max="1000"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <motion.button
                onClick={handleApply}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                적용
              </motion.button>
              
              <motion.button
                onClick={handleReset}
                className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '8px',
                  backgroundColor: '#ea580c',
                  color: 'white',
                  borderRadius: '8px'
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="text-xs text-slate-500" style={{ fontSize: '11px', color: '#64748b' }}>
              적용 후 가격이 설정 범위에서 1씩 증감합니다
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}