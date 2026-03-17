import React, { useState, useRef } from 'react';
import { Edit2, Trash2, Eye, EyeOff, FileText, CheckSquare, Square, Upload } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';
import Guard from './Guard';

const FilaTabla = React.memo(({
  item, idx, isDark, tipo, selected, columnasKeys, renderCelda,
  onToggleSeleccion, onToggleEstado, onEditar, onEliminar, onSubirPDF,
  soloLectura, mostrarColumnaAcciones
}) => {
  // Generar prefijo de permisos basado en el tipo (módulo)
  const resourcePrefix = tipo === 'pesadas' ? 'pesaje' : tipo;

  return (
    <tr
      className={`transition-all duration-150 ${selected
        ? isDark ? 'bg-indigo-500/10 border-b border-indigo-500/20' : 'bg-indigo-50 border-b border-indigo-100'
        : isDark ? 'border-b border-white/5 hover:bg-white/10' : 'border-b border-slate-100 hover:bg-slate-50'
        }`}
      style={{
        animation: idx < 100 ? `fadeInRow 0.3s ease-out ${idx * 0.05}s both` : 'none'
      }}
    >
      {tipo === 'pesadas' && (
        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
          <button onClick={(e) => onToggleSeleccion(e, item.id)}>
            {selected
              ? <CheckSquare size={18} className="text-indigo-500" />
              : <Square size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            }
          </button>
        </td>
      )}

      {columnasKeys.map((key) => (
        <td key={key} className={`px-6 py-4 text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
          {renderCelda(item, key, isDark)}
        </td>
      ))}

      {mostrarColumnaAcciones && (
        <td className="px-6 py-4">
          <div className="flex gap-2">
            {!soloLectura && (
              <>
                <Guard permissions={`${resourcePrefix}:update`}>
                  <button
                    onClick={() => onToggleEstado(item.id)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${item.estado === 'activo'
                      ? isDark ? 'bg-green-500/30 text-green-400 hover:bg-green-500/50' : 'bg-green-100 text-green-700 hover:bg-green-200'
                      : isDark ? 'bg-red-500/30 text-red-400 hover:bg-red-500/50' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    title={item.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  >
                    {item.estado === 'activo' ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </Guard>

                <Guard permissions={`${resourcePrefix}:update`}>
                  <button
                    onClick={() => onEditar(item)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${isDark ? 'bg-blue-500/30 text-blue-400 hover:bg-blue-500/50' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                </Guard>

                <Guard permissions={`${resourcePrefix}:delete`}>
                  <button
                    onClick={() => onEliminar(item.id)}
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${isDark ? 'bg-red-500/30 text-red-400 hover:bg-red-500/50' : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </Guard>
              </>
            )}

            {tipo === 'pesadas' && (
              <>
                {item.ruta && (
                  <a
                    href={item.ruta.startsWith('documentos/') ? `/${item.ruta}` : `/documentos/${item.ruta}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105 border font-semibold text-sm shadow-sm ${isDark
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/40'
                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      }`}
                    title="Ver Carta de Porte PDF"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText size={18} />
                    <span>Ver Carta Porte</span>
                  </a>
                )}
                {!item.ruta && (
                  <Guard permissions="pesaje:update">
                    <label
                      className={`p-2 rounded-lg cursor-pointer transition-all hover:scale-110 border ${isDark
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/40'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      title="Subir Carta de Porte PDF"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Upload size={18} />
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={(e) => onSubirPDF && onSubirPDF(e, item.id)}
                      />
                    </label>
                  </Guard>
                )}
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
});

export default function TablaItems({
  items,
  tipo,
  columnasKeys,
  columnasLabels,
  onEditar,
  onEliminar,
  onToggleEstado,
  onSubirPDF,
  onGenerarReporte,
  soloLectura = false
}) {
  const { isDark } = useThemeContext();
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const reporteEnProceso = useRef(false); // ⭐ Previene dobles clics

  const handleToggleSeleccion = React.useCallback((e, id) => {
    e.stopPropagation();
    setSeleccionadas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleTodas = () => {
    setSeleccionadas(prev => {
      // Si todas están seleccionadas, deselecciona todo
      if (prev.size === items.length && items.length > 0) {
        return new Set();
      }
      // Si no, selecciona todo
      return new Set(items.map(i => i.id));
    });
  };

  const handleGenerarReporte = async () => {
    // ⭐ Previene múltiples clics mientras se procesa
    if (reporteEnProceso.current) return;

    reporteEnProceso.current = true;

    try {
      const itemsSeleccionados = items.filter(i => seleccionadas.has(i.id));

      if (itemsSeleccionados.length === 0) return;

      // Ejecuta el callback del reporte
      await onGenerarReporte?.(itemsSeleccionados);

      // Limpia la selección solo después de que el reporte se generó exitosamente
      setSeleccionadas(new Set());
    } catch (error) {
      console.error('Error al generar reporte:', error);
    } finally {
      reporteEnProceso.current = false;
    }
  };

  const todasSeleccionadas = items.length > 0 && seleccionadas.size === items.length;
  const algunaSeleccionada = seleccionadas.size > 0;
  const mostrarColumnaAcciones = !soloLectura || tipo === 'pesadas';

  const renderCelda = React.useCallback((item, key, isDarkMode) => {
    const value = item[key];

    if (value === null || value === undefined) {
      if (key === 'bruto' || key === 'tara' || key === 'neto') {
        return <span className="text-slate-400 italic">Pendiente</span>;
      }
      return <span className="text-slate-400">-</span>;
    }

    if (key === 'codigo') {
      return (
        <span className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors duration-300 ${isDarkMode ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
          }`}>{value}</span>
      );
    }

    if (key === 'precio') {
      return (
        <span className={`font-bold text-base transition-colors duration-300 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
          }`}>
          ${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }

    if (key === 'estado') {
      const isActivo = value === 'activo' || value === true || value === 'true';
      return (
        <span className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors duration-300 ${isActivo
          ? isDarkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700'
          : isDarkMode ? 'bg-red-500/30 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
          {isActivo ? 'Activo' : 'Inactivo'}
        </span>
      );
    }

    if (key === 'abierta') {
      return (
        <span className={`px-3 py-1 rounded-lg font-semibold text-sm transition-colors duration-300 ${value
          ? isDarkMode ? 'bg-yellow-500/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
          : isDarkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700'
          }`}>
          {value ? 'En Proceso' : 'Completada'}
        </span>
      );
    }

    if (key === 'bruto') {
      return (
        <span className={`font-bold transition-colors duration-300 ${isDarkMode ? 'text-green-300' : 'text-green-700'
          }`}>
          {Number(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg
        </span>
      );
    }

    if (key === 'tara') {
      return (
        <span className={`transition-colors duration-300 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
          {Number(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg
        </span>
      );
    }

    if (key === 'neto') {
      return (
        <span className={`font-bold text-lg transition-colors duration-300 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
          }`}>
          {Number(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg
        </span>
      );
    }

    if (key.includes('fecha') || key === 'created_at' || key === 'updated_at') {
      if (!value) return <span className="text-slate-400">-</span>;
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return (
        <span className="font-mono text-sm">
          {date.toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })}
        </span>
      );
    }

    return value;
  }, []);

  return (
    <div>
      {/* Barra de reporte — solo en pesadas */}
      {tipo === 'pesadas' && (
        <div className={`flex items-center justify-between px-6 py-3 border-b transition-colors duration-300 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
          }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTodas}
              className={`flex items-center gap-2 text-sm font-medium transition-all ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {todasSeleccionadas
                ? <CheckSquare size={18} className="text-indigo-500" />
                : <Square size={18} />
              }
              {todasSeleccionadas ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
            {algunaSeleccionada && (
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {seleccionadas.size} seleccionada{seleccionadas.size !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <button
            onClick={handleGenerarReporte}
            disabled={!algunaSeleccionada || reporteEnProceso.current}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 border ${algunaSeleccionada && !reporteEnProceso.current
              ? isDark
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/40 cursor-pointer'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer'
              : 'opacity-30 cursor-not-allowed ' + (isDark
                ? 'bg-slate-700 border-slate-600 text-slate-500'
                : 'bg-slate-100 border-slate-200 text-slate-400')
              }`}
          >
            <FileText size={16} />
            {reporteEnProceso.current ? 'Generando...' : 'Generar Reporte'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`transition-colors duration-300 ${isDark ? 'border-b border-white/10 bg-white/5' : 'border-b border-slate-200 bg-slate-50'
              }`}>
              {tipo === 'pesadas' && <th className="px-4 py-4 w-10"></th>}
              {columnasLabels.map((label) => (
                <th key={label} className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                  {label}
                </th>
              ))}
              {mostrarColumnaAcciones && (
                <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <FilaTabla
                key={item.id}
                item={item}
                idx={idx}
                isDark={isDark}
                tipo={tipo}
                selected={seleccionadas.has(item.id)}
                columnasKeys={columnasKeys}
                renderCelda={renderCelda}
                onToggleSeleccion={handleToggleSeleccion}
                onToggleEstado={onToggleEstado}
                onEditar={onEditar}
                onEliminar={onEliminar}
                onSubirPDF={onSubirPDF}
                soloLectura={soloLectura}
                mostrarColumnaAcciones={mostrarColumnaAcciones}
              />
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}