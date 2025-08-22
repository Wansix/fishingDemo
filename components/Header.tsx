"use client"

import { motion } from "framer-motion"

export default function Header() {
  return (
    <motion.header
      className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.05 }}>
            <div className="text-2xl">🐟</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              FishFarm DeFi
            </h1>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">
              대시보드
            </a>
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">
              포지션
            </a>
            <a href="#" className="text-slate-300 hover:text-cyan-400 transition-colors">
              수익
            </a>
            <motion.button
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              지갑 연결
            </motion.button>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden text-slate-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </motion.header>
  )
}
