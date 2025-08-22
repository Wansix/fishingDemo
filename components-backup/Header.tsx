'use client';

import { Fish } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Fish className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold text-white">FishFarm DeFi</span>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <a href="#challenge" className="text-slate-300 hover:text-blue-400 transition-colors">
              챌린지
            </a>
            <a href="#how-it-works" className="text-slate-300 hover:text-blue-400 transition-colors">
              작동원리
            </a>
            <a href="#demo" className="text-slate-300 hover:text-blue-400 transition-colors">
              데모
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}