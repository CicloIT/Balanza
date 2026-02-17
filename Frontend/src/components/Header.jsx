import React from 'react';
import { useThemeContext } from '../context/ThemeContext';

export default function Header({ 
  activeTab, 
  onTabChange, 
  tabs 
}) {
  const { isDark, toggleTheme } = useThemeContext();
  return (
    <div className={`transition-colors duration-300 sticky top-0 z-40 backdrop-blur-xl border-b ${
      isDark
        ? 'bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 border-white/10'
        : 'bg-linear-to-b from-white via-blue-50 to-white border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-4xl font-bold transition-colors duration-300 ${
              isDark
                ? 'bg-linear-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent'
                : 'bg-linear-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent'
            }`}>
              Sistema de Gestión
            </h1>
            <p className={`text-sm mt-1 transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>Administra tu negocio de manera eficiente</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <div className="text-4xl">📊</div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap backdrop-blur-sm ${
                activeTab === tab.id
                  ? isDark
                    ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-500/50 scale-105'
                    : 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-400/50 scale-105'
                  : isDark
                    ? 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900'
              }`}
              style={{
                animation: activeTab === tab.id ? 'slideInTab 0.3s ease-out' : 'none'
              }}
            >
              {tab.label} 
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold transition-colors duration-300 ${
                activeTab === tab.id 
                  ? 'bg-white/30 text-white' 
                  : isDark
                    ? 'bg-white/20 text-slate-300'
                    : 'bg-slate-300 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideInTab {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}