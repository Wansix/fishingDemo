'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, FastForward, Rewind } from 'lucide-react';

interface TimeWidgetProps {
  className?: string;
  isRunning?: boolean;
  timeUnit?: string;
  onTimeUnitChange?: (unit: string) => void; // 시간 단위 변경
  shouldReset?: boolean; // 명시적으로 리셋해야 할 때
}

export default function TimeWidget({ className = '', isRunning = false, timeUnit = '10분', onTimeUnitChange, shouldReset = false }: TimeWidgetProps) {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [baseTime, setBaseTime] = useState<number | null>(null); // 시뮬레이션 시작 기준점
  const [pausedMinutes, setPausedMinutes] = useState(0); // 일시정지된 누적 시간

  // 시간 단위별 분당 변환
  const getMinutesPerSecond = () => {
    switch(timeUnit) {
      case '10분': return 10;
      case '1시간': return 60;
      case '1일': return 24 * 60; // 1440분
      case '7일': return 7 * 24 * 60; // 10080분
      default: return 10;
    }
  };

  useEffect(() => {
    if (!isRunning) {
      // 데모가 중지되면 현재까지의 시간을 저장
      if (baseTime !== null) {
        const now = Date.now();
        const realElapsed = now - baseTime;
        const currentMinutes = Math.floor((realElapsed / 1000) * getMinutesPerSecond());
        setPausedMinutes(pausedMinutes + currentMinutes);
        setBaseTime(null);
      }
      return;
    }

    // 데모가 시작/재개될 때
    if (baseTime === null) {
      setBaseTime(Date.now());
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const realElapsed = now - baseTime;
      const currentMinutes = Math.floor((realElapsed / 1000) * getMinutesPerSecond());
      
      setTotalMinutes(pausedMinutes + currentMinutes);
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, baseTime, pausedMinutes, timeUnit]);

     // 명시적 리셋이 요청될 때
  useEffect(() => {
    if (shouldReset) {
      setTotalMinutes(0);
      setBaseTime(null);
      setPausedMinutes(0);
    }
  }, [shouldReset]);

  const formatDay = () => {
    return Math.floor(totalMinutes / (24 * 60));
  };

  const formatHour = () => {
    return Math.floor((totalMinutes % (24 * 60)) / 60).toString().padStart(2, '0');
  };

  const formatMinute = () => {
    return (totalMinutes % 60).toString().padStart(2, '0');
  };

  return (
    <motion.div
      className={`bg-slate-900/90 backdrop-blur-sm rounded-xl p-5 border border-slate-700 shadow-xl ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-4 mb-4">
        <Clock className="w-5 h-5 text-blue-400" />
        <div className="text-sm text-slate-400">시뮬레이션 시간</div>
      </div>
      
      <div className="flex items-end justify-center space-x-6 mb-4">
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500 mb-2">일</span>
          <motion.span 
            className="text-3xl font-bold font-mono"
            style={{ color: '#60a5fa' }}
            key={formatDay()}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatDay()}
          </motion.span>
        </div>
        
        <motion.span 
          className="text-2xl mb-1"
          style={{ color: '#64748b' }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          :
        </motion.span>
        
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500 mb-2">시</span>
          <motion.span 
            className="text-3xl font-bold font-mono"
            style={{ color: '#4ade80' }}
            key={formatHour()}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatHour()}
          </motion.span>
        </div>
        
        <motion.span 
          className="text-2xl mb-1"
          style={{ color: '#64748b' }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
        >
          :
        </motion.span>
        
        <div className="flex flex-col items-center">
          <span className="text-xs text-slate-500 mb-2">분</span>
          <motion.span 
            className="text-3xl font-bold font-mono"
            style={{ color: '#facc15' }}
            key={formatMinute()}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {formatMinute()}
          </motion.span>
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="text-center">
          <span className="text-xs text-slate-500">
            실시간 1초 = {timeUnit}
          </span>
        </div>
      </div>
      
      {/* Time Unit Buttons */}
      {onTimeUnitChange && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2 text-center">시간 단위 설정</div>
          <div className="grid grid-cols-4 gap-2">
            <motion.button
              onClick={() => onTimeUnitChange('10분')}
              className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                timeUnit === '10분' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              10분
            </motion.button>
            
            <motion.button
              onClick={() => onTimeUnitChange('1시간')}
              className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                timeUnit === '1시간' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              1시간
            </motion.button>
            
            <motion.button
              onClick={() => onTimeUnitChange('1일')}
              className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                timeUnit === '1일' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              1일
            </motion.button>
            
            <motion.button
              onClick={() => onTimeUnitChange('7일')}
              className={`px-2 py-1 rounded-lg transition-colors text-xs ${
                timeUnit === '7일' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              7일
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}