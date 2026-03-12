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
  onToggleEstado,
  soloLectura = false
}) {
  const { isDark } = useThemeContext();

  // Función para formatear el valor de una celda
  const renderCelda = (item, key, isDarkMode) => {
    const value = item[key];

    // Manejar valores null/undefined
    if (value === null || value === undefined) {
      if (key === 'bruto' || key === 'tara' || key === 'neto') {
        return <span className="text-slate-400 italic">Pendiente</span>;
      }
      return <span className="text-slate-400">-</span>;
    }

    // Código con estilo especial
    if (key === 'codigo') {
      return (
        <span className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors duration-300 ${
          isDarkMode
            ? 'bg-blue-500/30 text-blue-300'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {value}
        </span>
      );
    }

    // Precio con formato de moneda
    if (key === 'precio') {
      return (
        <span className={`font-bold text-base transition-colors duration-300 ${
          isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
        }`}>
          ${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }

    // Estado con badge de color
    if (key === 'estado') {
      const isActivo = value === 'activo' || value === true || value === 'true';
      return (
        <span className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors duration-300 ${
          isActivo
            ? isDarkMode
              ? 'bg-green-500/30 text-green-300'
              : 'bg-green-100 text-green-700'
            : isDarkMode
              ? 'bg-red-500/30 text-red-300'
              : 'bg-red-100 text-red-700'
        }`}
        >
          {isActivo ? 'Activo' : 'Inactivo'}
        </span>
      );
    }

    // Estado de operación (abierta/cerrada)
    if (key === 'abierta') {
      return (
        <span className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors duration-300 ${
          value
            ? isDarkMode
              ? 'bg-yellow-500/30 text-yellow-300'
              : 'bg-yellow-100 text-yellow-700'
            : isDarkMode
              ? 'bg-green-500/30 text-green-300'
              : 'bg-green-100 text-green-700'
        }`}
        >
          {value ? 'En Proceso' : 'Completada'}
        </span>
      );
    }

    // Peso bruto (destacado en verde)
    if (key === 'bruto') {
      return (
        <span className={`font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-green-300' : 'text-green-700'
        }`}>
          {Number(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg
        </span>
      );
    }

    // Peso tara
    if (key === 'tara') {
      return (
        <span className={`transition-colors duration-300 ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}
        >
          {Number(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg
        </span>
      );
    }

    // Peso neto (destacado)
    if (key === 'neto') {
      return (
        <span className={`font-bold text-lg transition-colors duration-300 ${
          isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
        }`}
        >
          {Number(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg
        </span>
      );
    }

    // Fechas (formatear)
    if (key.includes('fecha') || key === 'created_at' || key === 'updated_at') {
      if (!value) return <span className="text-slate-400">-</span>;
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return (
        <span className="font-mono text-sm">
          {date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      );
    }

    // Valor por defecto
    return value;
  };

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
            {!soloLectura && (
              <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>Acciones</th>
            )}
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
                  {renderCelda(item, key, isDark)}
                </td>
              ))}
              {!soloLectura && (
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
              )}
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