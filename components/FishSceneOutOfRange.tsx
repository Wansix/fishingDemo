'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { PriceSimState } from '@/lib/priceSim';
import { COPY } from '@/lib/copy';

interface FishSceneOutOfRangeProps {
  state: PriceSimState;
  onRecast: () => void;
  demoStatus?: string;
}

const FishSVG = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" className="fill-red-400">
    <path d="M0 8 L5 3 L15 3 L20 0 L24 8 L20 16 L15 13 L5 13 L0 8 Z" stroke="#f87171" strokeWidth="1" />
    <circle cx="6" cy="8" r="1.5" className="fill-slate-900" />
    <path d="M8 8 L12 8" stroke="#dc2626" strokeWidth="1" />
  </svg>
);

const SeaweedSVG = () => (
  <svg width="8" height="40" viewBox="0 0 8 40" className="fill-green-600 opacity-60">
    <path d="M4 40 Q2 35 4 30 Q6 25 4 20 Q2 15 4 10 Q6 5 4 0" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const NetVisualization = ({ range }: { range: { lower: number; upper: number } }) => {
  const minPrice = 100;
  const maxPrice = 200;
  const leftPosition = ((range.lower - minPrice) / (maxPrice - minPrice)) * 90 + 5;
  const rightPosition = ((range.upper - minPrice) / (maxPrice - minPrice)) * 90 + 5;
  const netWidth = rightPosition - leftPosition;

  return (
    <>
      {/* Left boundary line */}
      <div
        className="absolute"
        style={{
          left: `${leftPosition}%`,
          top: '35%',
          width: '3px',
          height: '30%',
          backgroundColor: '#6b7280',
          zIndex: 8,
          opacity: 0.7
        }}
      />
      
      {/* Right boundary line */}
      <div
        className="absolute"
        style={{
          left: `${rightPosition}%`,
          top: '35%',
          width: '3px',
          height: '30%',
          backgroundColor: '#6b7280',
          zIndex: 8,
          opacity: 0.7
        }}
      />

      {/* Net pattern in the middle */}
      <div
        className="absolute"
        style={{
          left: `${leftPosition}%`,
          top: '40%',
          width: `${netWidth}%`,
          height: '20%',
          zIndex: 7,
          opacity: 0.4
        }}
      >
        {/* Horizontal lines */}
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full"
            style={{
              top: `${i * 25}%`,
              height: '1px',
              backgroundColor: '#6b7280'
            }}
          />
        ))}
        
        {/* Vertical lines */}
        {Array.from({ length: Math.floor(netWidth * 2) }, (_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full"
            style={{
              left: `${(i + 1) * (100 / (Math.floor(netWidth * 2) + 1))}%`,
              width: '1px',
              backgroundColor: '#6b7280'
            }}
          />
        ))}
      </div>

      {/* Net label */}
      <div
        className="absolute text-xs font-bold text-gray-400"
        style={{
          left: `${(leftPosition + rightPosition) / 2}%`,
          top: '32%',
          transform: 'translateX(-50%)',
          zIndex: 9
        }}
      >
        빈 그물 (${range.lower.toFixed(0)}-${range.upper.toFixed(0)})
      </div>
    </>
  );
};

export default function FishSceneOutOfRange({ state, onRecast, demoStatus }: FishSceneOutOfRangeProps) {
  const range = {
    lower: state.netCenter * (1 - state.netWidthPercent / 200),
    upper: state.netCenter * (1 + state.netWidthPercent / 200),
  };

  // Price range for positioning (100-200 maps to 5%-95% of screen width)
  const minPrice = 100;
  const maxPrice = 200;
  const fishXPosition = ((state.schoolCenter - minPrice) / (maxPrice - minPrice)) * 90 + 5; // 5%-95% range

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 min-h-[500px] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Seaweed */}
        <div className="absolute bottom-0 left-10">
          <SeaweedSVG />
        </div>
        <div className="absolute bottom-0 left-32">
          <SeaweedSVG />
        </div>
        <div className="absolute bottom-0 right-20">
          <SeaweedSVG />
        </div>
        <div className="absolute bottom-0 right-40">
          <SeaweedSVG />
        </div>
        
        {/* Water bubbles - fewer and slower */}
        {Array.from({ length: 4 }).map((_, i) => {
          const bubblePositions = [
            { left: 25, top: 40 },
            { left: 60, top: 30 },
            { left: 80, top: 50 },
            { left: 15, top: 60 }
          ];
          const position = bubblePositions[i];
          
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-slate-400/20 rounded-full"
              style={{
                left: `${position.left}%`,
                top: `${position.top}%`,
              }}
              animate={{
                y: [-5, -15, -5],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 4 + (i * 0.5),
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          );
        })}
      </div>

      {/* Price Scale Grid Lines - Full Height */}
      <div className="absolute inset-0" style={{ zIndex: 5 }}>
        {Array.from({ length: 11 }, (_, i) => {
          const price = 100 + (i * 10);
          const xPosition = ((price - minPrice) / (maxPrice - minPrice)) * 90 + 5;
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${xPosition}%`,
                width: '2px',
                backgroundColor: 'rgba(107, 114, 128, 0.4)',
                top: 0,
                height: '100%',
                zIndex: 5
              }}
            />
          );
        })}
      </div>


      {/* Fish Current Price Line */}
      <motion.div
        className="absolute h-full"
        style={{
          left: `${fishXPosition}%`,
          width: '2px',
          backgroundColor: '#f87171',
          top: 0,
          zIndex: 10,
          opacity: 0.8
        }}
        animate={{
          left: `${fishXPosition}%`,
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      />

      {/* School of Fish - Position based on price */}
      <motion.div
        className="absolute flex items-center space-x-2"
        style={{
          top: '45%',
          left: `${fishXPosition}%`,
          transform: 'translateX(-50%)',
        }}
        animate={{
          left: `${fishXPosition}%`,
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -3, 0],
              rotate: [0, -2, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 0.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          >
            <FishSVG />
          </motion.div>
        ))}
      </motion.div>

      {/* Net Visualization */}
      <NetVisualization range={range} />

      {/* Price Info - Top Left */}
      <div 
        className="absolute top-8 left-8 bg-slate-900 backdrop-blur-sm rounded-xl p-4 text-white border-2 border-slate-600 w-64 z-20 shadow-2xl"
        style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '16px',
          borderRadius: '12px',
          border: '2px solid #475569',
          width: '256px',
          zIndex: 50,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div className="text-sm text-slate-300 mb-2" style={{ fontSize: '14px', marginBottom: '8px', color: '#cbd5e1' }}>
          현재 SOL 가격
        </div>
        <div className="text-3xl font-bold text-red-400 mb-2" style={{ fontSize: '30px', fontWeight: 'bold', color: '#f87171', marginBottom: '8px' }}>
          ${state.price.toFixed(2)}
        </div>
        <div className="text-sm text-slate-400" style={{ fontSize: '14px', color: '#94a3b8' }}>
          그물 범위: ${range.lower.toFixed(2)} ~ ${range.upper.toFixed(2)}
        </div>
      </div>

      {/* Out of Range Warning - Top Right */}
      <motion.div
        className="absolute top-8 right-8 bg-red-500 text-white px-6 py-3 rounded-full shadow-lg z-20 text-lg font-semibold"
        style={{
          position: 'absolute',
          top: '32px',
          right: '32px',
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '9999px',
          zIndex: 50,
          fontSize: '18px',
          fontWeight: '600',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {demoStatus || COPY.scenes.outRangeBadge}
      </motion.div>

      {/* Recast Button - Center Bottom */}
      <motion.div
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={() => {
            console.log('Recast button in FishSceneOutOfRange clicked');
            onRecast();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full flex items-center space-x-3 shadow-lg transition-colors text-lg font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ zIndex: 50 }}
        >
          <RotateCcw className="w-6 h-6" />
          <span>{COPY.scenes.recast}</span>
        </motion.button>
      </motion.div>

      {/* Profit Display - Bottom Right */}
      <div 
        className="absolute bottom-8 right-8 bg-slate-900 backdrop-blur-sm rounded-xl p-4 text-white border-2 border-slate-600 z-20 shadow-2xl"
        style={{
          position: 'absolute',
          bottom: '32px',
          right: '32px',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '16px',
          borderRadius: '12px',
          border: '2px solid #475569',
          zIndex: 50,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          minWidth: '200px'
        }}
      >
        <div className="text-sm text-slate-300 mb-2" style={{ fontSize: '14px', marginBottom: '8px', color: '#cbd5e1' }}>
          누적 수익
        </div>
        <div className="text-2xl font-bold text-slate-400 mb-1" style={{ fontSize: '24px', fontWeight: 'bold', color: '#94a3b8' }}>
          ${state.accumulatedProfit.toFixed(2)}
        </div>
        <div className="text-sm text-orange-400" style={{ fontSize: '14px', color: '#fb923c' }}>
          범위 밖 - 수익 정지
        </div>
      </div>
    </div>
  );
}