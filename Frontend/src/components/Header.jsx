import React from 'react';
import { useThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function Header({
  activeTab,
  onTabChange,
  tabs
}) {
  const { isDark, toggleTheme } = useThemeContext();
  const { user, logout } = useAuth();

  return (
    <div className={`transition-colors duration-300 sticky top-0 z-40 backdrop-blur-xl border-b ${isDark
      ? 'bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 border-white/10'
      : 'bg-linear-to-b from-white via-blue-50 to-white border-slate-200'
      }`}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-4xl font-bold transition-colors duration-300 ${isDark
              ? 'bg-linear-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent'
              : 'bg-linear-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent'
              }`}>
              Sistema de Gestión
            </h1>
            <p className={`text-sm mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>Administra tu negocio de manera eficiente</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Info de usuario */}
            {user && (
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-200'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <span className="text-lg" title={`Rol: ${user.rol}`}>
                  {user.rol === 'admin' && '👑'}
                  {user.rol === 'gerente' && '💼'}
                  {user.rol === 'restriccion' && '🚫'}
                  {user.rol === 'balancero' && '⚖️'}
                  {user.rol === 'subalancero' && '🔧'}
                  {!['admin', 'gerente', 'restriccion', 'balancero', 'subalancero'].includes(user.rol) && '👤'}
                </span>
                <div className="leading-none">
                  <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {user.rol}
                  </p>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {user.username}
                  </p>
                </div>
              </div>
            )}

            {/* Toggle tema */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-300 ${isDark
                ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Cerrar sesión */}
            {user && (
              <button
                onClick={logout}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                  isDark
                    ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20'
                    : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                }`}
                title="Cerrar sesión"
              >
                🚪 Salir
              </button>
            )}

            <div className="text-4xl">📊</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all backdrop-blur-md flex items-center gap-3 active:scale-95 ${activeTab === tab.id
                  ? isDark
                    ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/30'
                    : 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-400/40 ring-2 ring-blue-300/30'
                  : isDark
                    ? 'bg-slate-800/40 text-slate-400 border border-white/5 hover:bg-slate-800/60 hover:text-white'
                    : 'bg-white/60 text-slate-600 border border-slate-200/50 hover:bg-white hover:text-slate-900 shadow-sm'
                }`}
            >
              <span className="text-xl leading-none">{tab.label.split(' ')[0]}</span>
              <span className="text-sm tracking-tight">{tab.label.split(' ').slice(1).join(' ')}</span>
              {tab.id !== 'pesada' && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${activeTab === tab.id
                    ? 'bg-white/20 text-white shadow-inner'
                    : isDark
                      ? 'bg-white/10 text-slate-500'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideInTab {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}