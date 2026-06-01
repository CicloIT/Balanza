import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Lock } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';

const STORAGE_KEY = 'balanza_user';

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.id) headers['x-user-id'] = user.id.toString();
      if (user?.username) headers['x-username'] = user.username;
    }
  } catch {}
  return headers;
};

export default function EditPesadaModal({ abierto, item, onClose, onSaved, choferes, productos, productores, transportes }) {
  const { isDark } = useThemeContext();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [campoError, setCampoError] = useState(null);

  useEffect(() => {
    if (item) {
      setCampoError(null);
      setError(null);
      setFormData({
        vehiculo_patente:      item.vehiculo_patente || '',
        sentido:               item.sentido || 'INGRESO',
        chofer_id:             item.chofer_id ?? '',
        producto_id:           item.producto_id ?? '',
        productor_id:          item.productor_id ?? '',
        transporte_id:         item.transporte_id ?? '',
        nro_remito:            item.nro_remito || '',
        balancero:             item.balancero || '',
        es_contenedor:         item.es_contenedor ?? false,
        nro_contenedor:        item.nro_contenedor || '',
        peso_vgm:              item.peso_vgm ?? '',
        tara_contenedor:       item.tara_contenedor ?? '',
        cantidad_bultos:       item.cantidad_bultos ?? '',
        nro_proforma:          item.nro_proforma || '',
        nro_permiso_embarque:  item.nro_permiso_embarque || '',
      });
      setError(null);
    }
  }, [item]);

  if (!abierto || !item) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (campoError === name) setCampoError(null);
    if (error) setError(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/pesadas/operacion/${item.operacion_id}/datos`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setCampoError(data.campo || null);
        throw new Error(data.error || 'Error al guardar');
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (campo) => `w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 border ${
    campoError === campo
      ? 'border-red-500 ring-2 ring-red-500/40 focus:ring-red-500'
      : isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-300 text-slate-800 focus:ring-blue-500'
  } ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`;
  const labelClass = (campo) => `block text-sm font-bold mb-2 ${
    campoError === campo ? 'text-red-500' : isDark ? 'text-slate-300' : 'text-slate-700'
  }`;
  const selectClass = `w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border ${
    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className={`relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col ${
        isDark ? 'bg-slate-900 border border-white/10' : 'bg-white'
      }`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-600/20">
              <Edit2 size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Editar Operación
              </h2>
              <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Op. #{item.operacion_id} — {item.vehiculo_patente}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${
              isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Error banner — top */}
          {error && (
            <div className={`flex items-start gap-3 p-4 rounded-2xl border-2 ${
              isDark ? 'bg-red-500/15 border-red-500/60 text-red-300' : 'bg-red-50 border-red-400 text-red-800'
            }`}>
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-black text-sm mb-0.5">No se pudo guardar</p>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Pesos (solo lectura) */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-100'
          }`}>
            <p className={`text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <Lock size={12} /> Pesos (no editables)
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Bruto', value: item.bruto, color: isDark ? 'text-green-400' : 'text-green-600' },
                { label: 'Tara',  value: item.tara,  color: isDark ? 'text-slate-300' : 'text-slate-600' },
                { label: 'Neto',  value: item.neto,  color: isDark ? 'text-cyan-300' : 'text-cyan-600' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase font-bold opacity-50 mb-1">{label}</p>
                  <p className={`font-mono font-black text-sm ${color}`}>
                    {value != null ? Number(value).toLocaleString('es-AR') : '—'} kg
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Datos generales */}
          <div>
            <p className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Datos Generales
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass('vehiculo_patente')}>Patente</label>
                <input name="vehiculo_patente" value={formData.vehiculo_patente || ''} onChange={handleChange} className={inputClass('vehiculo_patente')} />
              </div>
              <div>
                <label className={labelClass('sentido')}>Sentido</label>
                <select name="sentido" value={formData.sentido || ''} onChange={handleChange} className={selectClass}>
                  <option value="INGRESO">INGRESO</option>
                  <option value="SALIDA">SALIDA</option>
                </select>
              </div>
              <div>
                <label className={labelClass('nro_remito')}>Nro Remito</label>
                <input name="nro_remito" value={formData.nro_remito || ''} onChange={handleChange} className={inputClass('nro_remito')} placeholder="REM-001" />
              </div>
              <div>
                <label className={labelClass('balancero')}>Balancero</label>
                <input name="balancero" value={formData.balancero || ''} onChange={handleChange} className={inputClass('balancero')} />
              </div>
            </div>
          </div>

          {/* Entidades */}
          <div>
            <p className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              Entidades
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass('chofer_id')}>Chofer</label>
                <select name="chofer_id" value={formData.chofer_id || ''} onChange={handleChange} className={selectClass}>
                  <option value="">— Sin asignar —</option>
                  {(choferes || []).map(c => (
                    <option key={c.id} value={c.id}>{c.apellido_nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass('transporte_id')}>Transporte</label>
                <select name="transporte_id" value={formData.transporte_id || ''} onChange={handleChange} className={selectClass}>
                  <option value="">— Sin asignar —</option>
                  {(transportes || []).map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass('producto_id')}>Producto</label>
                <select name="producto_id" value={formData.producto_id || ''} onChange={handleChange} className={selectClass}>
                  <option value="">— Sin asignar —</option>
                  {(productos || []).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass('productor_id')}>Productor</label>
                <select name="productor_id" value={formData.productor_id || ''} onChange={handleChange} className={selectClass}>
                  <option value="">— Sin asignar —</option>
                  {(productores || []).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contenedor */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                Contenedor
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="es_contenedor"
                  checked={formData.es_contenedor || false}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Es contenedor
                </span>
              </label>
            </div>
            {formData.es_contenedor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass('nro_contenedor')}>Nro Contenedor</label>
                  <input name="nro_contenedor" value={formData.nro_contenedor || ''} onChange={handleChange} className={inputClass('nro_contenedor')} placeholder="MSCU1234567" />
                </div>
                <div>
                  <label className={labelClass('tara_contenedor')}>Tara Contenedor (kg)</label>
                  <input type="number" name="tara_contenedor" value={formData.tara_contenedor ?? ''} onChange={handleChange} className={inputClass('tara_contenedor')} />
                </div>
                <div>
                  <label className={labelClass('peso_vgm')}>Peso VGM (kg)</label>
                  <input type="number" name="peso_vgm" value={formData.peso_vgm ?? ''} onChange={handleChange} className={inputClass('peso_vgm')} />
                </div>
                <div>
                  <label className={labelClass('cantidad_bultos')}>Cantidad Bultos</label>
                  <input type="number" name="cantidad_bultos" value={formData.cantidad_bultos ?? ''} onChange={handleChange} className={inputClass('cantidad_bultos')} />
                </div>
                <div>
                  <label className={labelClass('nro_proforma')}>Nro Proforma</label>
                  <input name="nro_proforma" value={formData.nro_proforma || ''} onChange={handleChange} className={inputClass('nro_proforma')} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass('nro_permiso_embarque')}>Nro Permiso Embarque</label>
                  <input name="nro_permiso_embarque" value={formData.nro_permiso_embarque || ''} onChange={handleChange} className={inputClass('nro_permiso_embarque')} />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex justify-end gap-3 ${
          isDark ? 'border-white/10 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 ${
              isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Save size={16} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
