"use client"

import { motion } from "framer-motion"
import type { PriceSimState } from "@/lib/priceSim"
import { COPY } from "@/lib/copy"

interface FishSceneProps {
  state: PriceSimState
}

const FishSVG = () => (
  <svg width="32" height="20" viewBox="0 0 32 20" className="fill-cyan-400">
    {/* Main body */}
    <ellipse cx="16" cy="10" rx="12" ry="6" fill="#22d3ee" stroke="#0891b2" strokeWidth="1" />

    {/* Tail fin */}
    <path d="M4 10 L0 6 L2 10 L0 14 Z" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />

    {/* Top fin */}
    <path d="M18 4 L22 2 L20 6 Z" fill="#67e8f9" stroke="#0891b2" strokeWidth="0.5" />

    {/* Bottom fin */}
    <path d="M18 16 L22 18 L20 14 Z" fill="#67e8f9" stroke="#0891b2" strokeWidth="0.5" />

    {/* Side fins */}
    <ellipse cx="12" cy="8" rx="3" ry="1.5" fill="#67e8f9" stroke="#0891b2" strokeWidth="0.5" />
    <ellipse cx="12" cy="12" rx="3" ry="1.5" fill="#67e8f9" stroke="#0891b2" strokeWidth="0.5" />

    {/* Eye */}
    <circle cx="20" cy="8" r="2" fill="white" />
    <circle cx="21" cy="8" r="1.2" fill="#1e293b" />
    <circle cx="21.5" cy="7.5" r="0.4" fill="white" />

    {/* Body stripes for detail */}
    <path d="M8 7 Q16 6 24 7" stroke="#0891b2" strokeWidth="0.5" fill="none" opacity="0.6" />
    <path d="M8 10 Q16 9 24 10" stroke="#0891b2" strokeWidth="0.5" fill="none" opacity="0.6" />
    <path d="M8 13 Q16 12 24 13" stroke="#0891b2" strokeWidth="0.5" fill="none" opacity="0.6" />
  </svg>
)

const SeaweedSVG = ({ height = 40 }: { height?: number }) => (
  <svg width="12" height={height} viewBox={`0 0 12 ${height}`} className="fill-green-600 opacity-70">
    <path
      d={`M6 ${height} Q3 ${height * 0.85} 6 ${height * 0.7} Q9 ${height * 0.55} 6 ${height * 0.4} Q3 ${height * 0.25} 6 ${height * 0.1} Q9 0 6 0`}
      stroke="#16a34a"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d={`M4 ${height} Q2 ${height * 0.8} 4 ${height * 0.6} Q6 ${height * 0.4} 4 ${height * 0.2} Q2 0 4 0`}
      stroke="#22c55e"
      strokeWidth="1"
      fill="none"
      opacity="0.7"
    />
  </svg>
)

const NetVisualization = ({ range }: { range: { lower: number; upper: number } }) => {
  const minPrice = 100
  const maxPrice = 200
  const leftPosition = ((range.lower - minPrice) / (maxPrice - minPrice)) * 90 + 5
  const rightPosition = ((range.upper - minPrice) / (maxPrice - minPrice)) * 90 + 5
  const netWidth = rightPosition - leftPosition

  return (
    <>
      {/* Enhanced boundary posts with rope texture */}
      <div
        className="absolute rounded-full shadow-lg"
        style={{
          left: `${leftPosition}%`,
          top: "32%",
          width: "6px",
          height: "36%",
          background: "linear-gradient(to bottom, #d97706, #92400e)",
          zIndex: 8,
          opacity: 0.9,
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        }}
      />

      <div
        className="absolute rounded-full shadow-lg"
        style={{
          left: `${rightPosition}%`,
          top: "32%",
          width: "6px",
          height: "36%",
          background: "linear-gradient(to bottom, #d97706, #92400e)",
          zIndex: 8,
          opacity: 0.9,
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        }}
      />

      {/* Enhanced net pattern with curved lines and rope texture */}
      <div
        className="absolute"
        style={{
          left: `${leftPosition}%`,
          top: "35%",
          width: `${netWidth}%`,
          height: "30%",
          zIndex: 7,
          opacity: 0.8,
        }}
      >
        {/* Curved horizontal lines */}
        {Array.from({ length: 6 }, (_, i) => (
          <svg
            key={`h-${i}`}
            className="absolute w-full"
            style={{
              top: `${i * 16.67}%`,
              height: "4px",
            }}
            viewBox="0 0 100 4"
          >
            <path
              d={`M0 2 Q25 ${1 + Math.sin(i) * 0.5} 50 2 Q75 ${3 - Math.sin(i) * 0.5} 100 2`}
              stroke="#f59e0b"
              strokeWidth="1.5"
              fill="none"
              opacity="0.9"
            />
          </svg>
        ))}

        {/* Curved vertical lines */}
        {Array.from({ length: Math.max(3, Math.floor(netWidth / 8)) }, (_, i) => (
          <svg
            key={`v-${i}`}
            className="absolute h-full"
            style={{
              left: `${(i + 1) * (100 / (Math.max(3, Math.floor(netWidth / 8)) + 1))}%`,
              width: "4px",
            }}
            viewBox="0 0 4 100"
          >
            <path
              d={`M2 0 Q${1.5 + Math.cos(i) * 0.5} 25 2 50 Q${2.5 - Math.cos(i) * 0.5} 75 2 100`}
              stroke="#f59e0b"
              strokeWidth="1.5"
              fill="none"
              opacity="0.9"
            />
          </svg>
        ))}

        {/* Net knots at intersections */}
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: Math.max(3, Math.floor(netWidth / 8)) }, (_, col) => (
            <div
              key={`knot-${row}-${col}`}
              className="absolute w-1 h-1 bg-amber-600 rounded-full opacity-70"
              style={{
                left: `${(col + 1) * (100 / (Math.max(3, Math.floor(netWidth / 8)) + 1))}%`,
                top: `${row * 16.67}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )),
        )}
      </div>

      {/* Enhanced net label with better styling */}
      <div
        className="absolute text-sm font-bold text-amber-300 bg-slate-900/70 px-2 py-1 rounded-md backdrop-blur-sm"
        style={{
          left: `${(leftPosition + rightPosition) / 2}%`,
          top: "29%",
          transform: "translateX(-50%)",
          zIndex: 9,
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        🎣 그물 (${range.lower.toFixed(0)}-${range.upper.toFixed(0)})
      </div>
    </>
  )
}

export default function FishScene({ state }: FishSceneProps) {
  const range = {
    lower: state.netCenter * (1 - state.netWidthPercent / 200),
    upper: state.netCenter * (1 + state.netWidthPercent / 200),
  }

  const isInRange = state.schoolCenter >= range.lower && state.schoolCenter <= range.upper

  // Price range for positioning (100-200 maps to 5%-95% of screen width)
  const minPrice = 100
  const maxPrice = 200
  const fishXPosition = ((state.schoolCenter - minPrice) / (maxPrice - minPrice)) * 90 + 5 // 5%-95% range

  return (
    <div className="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 min-h-[500px] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Enhanced seaweed with varied heights */}
        <div className="absolute bottom-0 left-10">
          <SeaweedSVG height={45} />
        </div>
        <div className="absolute bottom-0 left-32">
          <SeaweedSVG height={38} />
        </div>
        <div className="absolute bottom-0 right-20">
          <SeaweedSVG height={42} />
        </div>
        <div className="absolute bottom-0 right-40">
          <SeaweedSVG height={35} />
        </div>

        {/* Enhanced water bubbles with varied sizes */}
        {Array.from({ length: 12 }).map((_, i) => {
          const bubblePositions = [
            { left: 20, top: 30, size: 3 },
            { left: 35, top: 45, size: 2 },
            { left: 55, top: 25, size: 4 },
            { left: 70, top: 40, size: 2.5 },
            { left: 85, top: 55, size: 3.5 },
            { left: 15, top: 65, size: 2 },
            { left: 45, top: 70, size: 3 },
            { left: 75, top: 60, size: 2.5 },
            { left: 25, top: 80, size: 1.5 },
            { left: 60, top: 35, size: 2 },
            { left: 80, top: 25, size: 1.8 },
            { left: 40, top: 55, size: 2.2 },
          ]
          const position = bubblePositions[i] || {
            left: Math.random() * 80 + 10,
            top: Math.random() * 60 + 20,
            size: 2,
          }

          return (
            <motion.div
              key={i}
              className="absolute bg-blue-200/40 rounded-full border border-blue-300/30"
              style={{
                left: `${position.left}%`,
                top: `${position.top}%`,
                width: `${position.size}px`,
                height: `${position.size}px`,
              }}
              animate={{
                y: [-10, -40, -10],
                opacity: [0.2, 0.7, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + i * 0.3,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.4,
              }}
            />
          )
        })}
      </div>

      {/* Price Scale Grid Lines - Full Height */}
      <div className="absolute inset-0" style={{ zIndex: 5 }}>
        {Array.from({ length: 11 }, (_, i) => {
          const price = 100 + i * 10
          const xPosition = ((price - minPrice) / (maxPrice - minPrice)) * 90 + 5 // Same calculation as fish
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${xPosition}%`,
                width: "2px",
                backgroundColor: "rgba(148, 163, 184, 0.4)",
                top: 0,
                height: "100%",
                zIndex: 5,
              }}
            />
          )
        })}
      </div>

      {/* Fish Current Price Line */}
      <motion.div
        className="absolute h-full"
        style={{
          left: `${fishXPosition}%`,
          width: "2px",
          backgroundColor: "#22d3ee",
          top: 0,
          zIndex: 10,
          opacity: 0.8,
        }}
        animate={{
          left: `${fishXPosition}%`,
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      />

      {/* Enhanced School of Fish with varied animations */}
      <motion.div
        className="absolute flex items-center space-x-1"
        style={{
          top: "45%",
          left: `${fishXPosition}%`,
          transform: "translateX(-50%)",
        }}
        animate={{
          left: `${fishXPosition}%`,
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -4, 0],
              rotate: [0, 3, 0],
              x: [0, Math.sin(i) * 2, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 0.8,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.15,
            }}
            style={{
              zIndex: 6 - i, // Layering effect
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
          position: "absolute",
          top: "32px",
          left: "32px",
          backgroundColor: "#0f172a",
          color: "white",
          padding: "16px",
          borderRadius: "12px",
          border: "2px solid #475569",
          width: "256px",
          zIndex: 50,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div
          className="text-sm text-slate-300 mb-2"
          style={{ fontSize: "14px", marginBottom: "8px", color: "#cbd5e1" }}
        >
          현재 SOL 가격
        </div>
        <div
          className="text-3xl font-bold text-cyan-400 mb-2"
          style={{ fontSize: "30px", fontWeight: "bold", color: "#22d3ee", marginBottom: "8px" }}
        >
          ${state.price.toFixed(2)}
        </div>
        <div className="text-sm text-slate-400" style={{ fontSize: "14px", color: "#94a3b8" }}>
          그물 범위: ${range.lower.toFixed(2)} ~ ${range.upper.toFixed(2)}
        </div>
      </div>

      {/* Earnings Badge - Top Right */}
      {isInRange && (
        <motion.div
          className="absolute top-8 right-8 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-20 text-lg font-semibold"
          style={{
            position: "absolute",
            top: "32px",
            right: "32px",
            backgroundColor: "#10b981",
            color: "white",
            padding: "12px 24px",
            borderRadius: "9999px",
            zIndex: 50,
            fontSize: "18px",
            fontWeight: "600",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
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
          position: "absolute",
          bottom: "32px",
          right: "32px",
          backgroundColor: "#0f172a",
          color: "white",
          padding: "16px",
          borderRadius: "12px",
          border: "2px solid #475569",
          zIndex: 50,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          minWidth: "200px",
        }}
      >
        <div
          className="text-sm text-slate-300 mb-2"
          style={{ fontSize: "14px", marginBottom: "8px", color: "#cbd5e1" }}
        >
          누적 수익
        </div>
        <div
          className="text-2xl font-bold text-green-400"
          style={{ fontSize: "24px", fontWeight: "bold", color: "#4ade80" }}
        >
          ${state.accumulatedProfit.toFixed(2)}
        </div>
      </div>
    </div>
  )
}
