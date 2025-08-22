'use client';

import { motion } from 'framer-motion';
import { PriceSimState } from '@/lib/priceSim';
import { COPY } from '@/lib/copy';

interface FishSceneProps {
  state: PriceSimState;
}

const FishSVG = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" className="fill-cyan-400">
    <path d="M0 8 L5 3 L15 3 L20 0 L24 8 L20 16 L15 13 L5 13 L0 8 Z" stroke="#22d3ee" strokeWidth="1" />
    <circle cx="6" cy="8" r="1.5" className="fill-slate-900" />
    <path d="M8 8 L12 8" stroke="#0891b2" strokeWidth="1" />
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
          backgroundColor: '#fbbf24',
          zIndex: 8,
          opacity: 0.9
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
          backgroundColor: '#fbbf24',
          zIndex: 8,
          opacity: 0.9
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
          opacity: 0.6
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
              backgroundColor: '#fbbf24'
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
              backgroundColor: '#fbbf24'
            }}
          />
        ))}
      </div>

      {/* Net label */}
      <div
        className="absolute text-xs font-bold text-yellow-400"
        style={{
          left: `${(leftPosition + rightPosition) / 2}%`,
          top: '32%',
          transform: 'translateX(-50%)',
          zIndex: 9
        }}
      >
        그물 (${range.lower.toFixed(0)}-${range.upper.toFixed(0)})
      </div>
    </>
  );
};

export default function FishScene({ state }: FishSceneProps) {
  const range = {
    lower: state.netCenter * (1 - state.netWidthPercent / 200),
    upper: state.netCenter * (1 + state.netWidthPercent / 200),
  };

  const isInRange = state.schoolCenter >= range.lower && state.schoolCenter <= range.upper;

  // Price range for positioning (100-200 maps to 5%-95% of screen width)
  const minPrice = 100;
  const maxPrice = 200;
  const fishXPosition = ((state.schoolCenter - minPrice) / (maxPrice - minPrice)) * 90 + 5; // 5%-95% range

  return (
    <div className="bg-gradient-to-b from-blue-900 to-blue-800 min-h-[500px] relative overflow-hidden">
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
        
        {/* Water bubbles */}
        {Array.from({ length: 8 }).map((_, i) => {
          const bubblePositions = [
            { left: 20, top: 30 },
            { left: 35, top: 45 },
            { left: 55, top: 25 },
            { left: 70, top: 40 },
            { left: 85, top: 55 },
            { left: 15, top: 65 },
            { left: 45, top: 70 },
            { left: 75, top: 60 }
          ];
          const position = bubblePositions[i];
          
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-300/30 rounded-full"
              style={{
                left: `${position.left}%`,
                top: `${position.top}%`,
              }}
              animate={{
                y: [-10, -30, -10],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + (i * 0.25),
                repeat: Infinity,
                delay: i * 0.25,
              }}
            />
          );
        })}
      </div>

      {/* Price Scale Grid Lines - Full Height */}
      <div className="absolute inset-0" style={{ zIndex: 5 }}>
        {Array.from({ length: 11 }, (_, i) => {
          const price = 100 + (i * 10);
          const xPosition = ((price - minPrice) / (maxPrice - minPrice)) * 90 + 5; // Same calculation as fish
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${xPosition}%`,
                width: '2px',
                backgroundColor: 'rgba(148, 163, 184, 0.4)',
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
          backgroundColor: '#22d3ee',
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
          transform: 'translateX(-50%)', // Center the fish on the line
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
              rotate: [0, 2, 0],
            }}
            transition={{
              duration: 1.5 + Math.random() * 0.5,
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
        <div className="text-3xl font-bold text-cyan-400 mb-2" style={{ fontSize: '30px', fontWeight: 'bold', color: '#22d3ee', marginBottom: '8px' }}>
          ${state.price.toFixed(2)}
        </div>
        <div className="text-sm text-slate-400" style={{ fontSize: '14px', color: '#94a3b8' }}>
          그물 범위: ${range.lower.toFixed(2)} ~ ${range.upper.toFixed(2)}
        </div>
      </div>

      {/* Earnings Badge - Top Right */}
      {isInRange && (
        <motion.div
          className="absolute top-8 right-8 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-20 text-lg font-semibold"
          style={{
            position: 'absolute',
            top: '32px',
            right: '32px',
            backgroundColor: '#10b981',
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
          {COPY.scenes.inRangeBadge}
        </motion.div>
      )}

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
        <div className="text-2xl font-bold text-green-400" style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>
          ${state.accumulatedProfit.toFixed(2)}
        </div>
      </div>
    </div>
  );
}