'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, FastForward, Rewind } from 'lucide-react';

interface TimeWidgetProps {
  className?: string;
  isRunning?: boolean;
  simulationSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  shouldReset?: boolean; // 명시적으로 리셋해야 할 때
}

export default function TimeWidget({ className = '', isRunning = false, simulationSpeed = 1, onSpeedChange, shouldReset = false }: TimeWidgetProps) {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedMinutes, setAccumulatedMinutes] = useState(0);
  const [lastSpeedChangeTime, setLastSpeedChangeTime] = useState<number | null>(null);
  const [previousSpeed, setPreviousSpeed] = useState(simulationSpeed);
  const [pausedTime, setPausedTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isRunning) {
      // 데모가 중지되면 현재 시점을 일시정지 시점으로 저장
      if (startTime !== null && pausedTime === null) {
        const now = Date.now();
        const lastChangeTime = lastSpeedChangeTime || startTime;
        const realElapsed = now - lastChangeTime;
        const minutesToAdd = Math.floor((realElapsed / 1000) * 10 * simulationSpeed);
        
        setAccumulatedMinutes(prev => prev + minutesToAdd);
        setPausedTime(now);
      }
      return;
    }

    // 일시정지에서 재개할 때
    if (pausedTime !== null) {
      const now = Date.now();
      setLastSpeedChangeTime(now);
      setPausedTime(null);
      return;
    }

    // 처음 시작할 때만 startTime 설정
    if (startTime === null) {
      const now = Date.now();
      setStartTime(now);
      setLastSpeedChangeTime(now);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      let currentAccumulated = accumulatedMinutes;
      let currentStartTime = lastSpeedChangeTime || startTime;
      
      // 현재 속도로 경과된 시간 계산
      const realElapsed = now - currentStartTime;
      const currentSpeedMinutes = Math.floor((realElapsed / 1000) * 10 * simulationSpeed);
      
      setTotalMinutes(currentAccumulated + currentSpeedMinutes);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isRunning, startTime, accumulatedMinutes, lastSpeedChangeTime, simulationSpeed]);

  // 속도가 변경될 때 누적 시간 업데이트
  useEffect(() => {
    if (isRunning && startTime !== null && simulationSpeed !== previousSpeed) {
      const now = Date.now();
      const lastChangeTime = lastSpeedChangeTime || startTime;
      
      // 이전 속도로 경과된 시간 계산
      const realElapsed = now - lastChangeTime;
      const minutesToAdd = Math.floor((realElapsed / 1000) * 10 * previousSpeed);
      
      setAccumulatedMinutes(prev => prev + minutesToAdd);
      setLastSpeedChangeTime(now);
      setPreviousSpeed(simulationSpeed);
         }
   }, [simulationSpeed, isRunning, startTime, lastSpeedChangeTime, previousSpeed]);

   // 명시적 리셋이 요청될 때
   useEffect(() => {
     if (shouldReset) {
       setTotalMinutes(0);
       setStartTime(null);
       setAccumulatedMinutes(0);
       setLastSpeedChangeTime(null);
       setPausedTime(null);
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
      
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <span className="text-xs text-slate-500">
            실시간 1초 = {10 * simulationSpeed}분
          </span>
        </div>
        
        {onSpeedChange && (
          <div className="flex items-center space-x-2 ml-4">
            <motion.button
              onClick={() => onSpeedChange(Math.max(0.5, simulationSpeed / 2))}
              className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={simulationSpeed <= 0.5}
              style={{
                opacity: simulationSpeed <= 0.5 ? 0.5 : 1,
                cursor: simulationSpeed <= 0.5 ? 'not-allowed' : 'pointer'
              }}
            >
              <Rewind className="w-3 h-3" />
            </motion.button>
            
            <span className="text-xs text-slate-400 min-w-[24px] text-center">
              x{simulationSpeed}
            </span>
            
            <motion.button
              onClick={() => onSpeedChange(Math.min(512, simulationSpeed * 2))}
              className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={simulationSpeed >= 512}
              style={{
                opacity: simulationSpeed >= 512 ? 0.5 : 1,
                cursor: simulationSpeed >= 512 ? 'not-allowed' : 'pointer'
              }}
            >
              <FastForward className="w-3 h-3" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}