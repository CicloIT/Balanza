import React from 'react';
import { Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';

export default function TablaItems({ 
  items, 
  tipo, 
  columnasKeys, 
  columnasLabels,
  onEditar,
  onEliminar,
  onToggleEstado
}) {
  const { isDark } = useThemeContext();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`transition-colors duration-300 ${
            isDark
              ? 'border-b border-white/10 bg-white/5'
              : 'border-b border-slate-200 bg-slate-50'
          }`}>
            {columnasLabels.map((label) => (
              <th key={label} className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {label}
              </th>
            ))}
            <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr 
              key={item.id} 
              className={`transition-all duration-200 ${
                isDark
                  ? 'border-b border-white/5 hover:bg-white/10'
                  : 'border-b border-slate-100 hover:bg-slate-50'
              }`}
              style={{
                animation: `fadeInRow 0.3s ease-out ${idx * 0.05}s both`
              }}
            >
              {columnasKeys.map((key) => (
                <td key={key} className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  {key === 'codigo' ? (
                    <span className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors duration-300 ${
                      isDark
                        ? 'bg-blue-500/30 text-blue-300'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item[key]}
                    </span>
                  ) : key === 'precio' ? (
                    <span className={`font-bold text-base transition-colors duration-300 ${
                      isDark ? 'text-cyan-300' : 'text-cyan-700'
                    }`}>${item[key]}</span>
                  ) : key === 'estado' ? (
                    <span className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors duration-300 ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}>
                      {item[key]}
                    </span>
                  ) : (
                    item[key]
                  )}
                </td>
              ))}
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleEstado(item.id)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      item.estado === 'activo'
                        ? isDark
                          ? 'bg-green-500/30 text-green-400 hover:bg-green-500/50'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                        : isDark
                          ? 'bg-red-500/30 text-red-400 hover:bg-red-500/50'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                    title={item.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  >
                    {item.estado === 'activo' ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    onClick={() => onEditar(item)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      isDark
                        ? 'bg-blue-500/30 text-blue-400 hover:bg-blue-500/50'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => onEliminar(item.id)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${
                      isDark
                        ? 'bg-red-500/30 text-red-400 hover:bg-red-500/50'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}