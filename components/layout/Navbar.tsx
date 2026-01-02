import React from 'react';
import { ShieldCheck, Target, BarChart, Github } from 'lucide-react';

interface NavbarProps {
  onHistoryClick?: () => void;
  onCompetitiveClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onHistoryClick, onCompetitiveClick }) => (
  <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 flex items-center justify-between sticky top-0 z-50 transition-all duration-300">
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-1.5 rounded-lg shadow-md shadow-indigo-200 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
        <ShieldCheck className="text-white w-6 h-6" />
      </div>
      <span className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">AEO Vision</span>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
      <a href="#" className="hover:text-indigo-600 transition-colors duration-200">How it works</a>
      {onCompetitiveClick && (
        <button 
          onClick={onCompetitiveClick} 
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition-all duration-300"
        >
          <Target className="w-4 h-4" />
          Win/Loss Intel
        </button>
      )}
      {onHistoryClick && (
        <button 
          onClick={onHistoryClick} 
          className="flex items-center gap-2 hover:text-indigo-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          <BarChart className="w-4 h-4" />
          History
        </button>
      )}
      <a 
        href="https://github.com/AbrahamOjes/AEO.git" 
        target="_blank" 
        rel="noreferrer" 
        className="flex items-center gap-2 hover:text-indigo-600 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50"
      >
        <Github className="w-4 h-4" />
        GitHub
      </a>
    </div>
  </nav>
);
