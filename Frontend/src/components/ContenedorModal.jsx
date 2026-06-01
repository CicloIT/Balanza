import React, { useState, useEffect } from 'react';
import { X, Package, Save } from 'lucide-react';
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

export default function ContenedorModal({ abierto, item, onClose, onSaved }) {
  const { isDark } = useThemeContext();
  const [formData, setFormData] = useState({
    nro_contenedor: '',
    peso_vgm: '',
    tara_contenedor: '',
    cantidad_bultos: '',
    nro_proforma: '',
    nro_permiso_embarque: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) {
      setFormData({
        nro_contenedor:       item.nro_contenedor || '',
        peso_vgm:             item.peso_vgm ?? '',
        tara_contenedor:      item.tara_contenedor ?? '',
        cantidad_bultos:      item.cantidad_bultos ?? '',
        nro_proforma:         item.nro_proforma || '',
        nro_permiso_embarque: item.nro_permiso_embarque || '',
      });
      setError(null);
    }
  }, [item]);

  if (!abierto || !item) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.nro_contenedor.trim()) {
      setError('Nro de contenedor es obligatorio');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/pesadas/operacion/${item.operacion_id}/contenedor`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 border ${
    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
  }`;
  const labelClass = `block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col ${
        isDark ? 'bg-slate-900 border border-white/10' : 'bg-white'
      }`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-600 rounded-2xl text-white shadow-lg shadow-cyan-600/20">
              <Package size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Datos de Contenedor
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

          {/* Campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>
                Nro Contenedor <span className="text-red-500">*</span>
              </label>
              <input
                name="nro_contenedor"
                value={formData.nro_contenedor}
                onChange={handleChange}
                className={inputClass}
                placeholder="MSCU1234567"
              />
            </div>
            <div>
              <label className={labelClass}>Tara Contenedor (kg)</label>
              <input
                type="number"
                name="tara_contenedor"
                value={formData.tara_contenedor}
                onChange={handleChange}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Peso VGM (kg)</label>
              <input
                type="number"
                name="peso_vgm"
                value={formData.peso_vgm}
                onChange={handleChange}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Cantidad Bultos</label>
              <input
                type="number"
                name="cantidad_bultos"
                value={formData.cantidad_bultos}
                onChange={handleChange}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Nro Proforma</label>
              <input
                name="nro_proforma"
                value={formData.nro_proforma}
                onChange={handleChange}
                className={inputClass}
                placeholder="PLT-001"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Nro Permiso Embarque</label>
              <input
                name="nro_permiso_embarque"
                value={formData.nro_permiso_embarque}
                onChange={handleChange}
                className={inputClass}
                placeholder="PE-0000001"
              />
            </div>
          </div>

          {error && (
            <div className={`p-4 rounded-xl text-sm font-bold ${
              isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {error}
            </div>
          )}
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
            className="px-8 py-3 rounded-xl font-bold bg-cyan-600 text-white hover:bg-cyan-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-600/20"
          >
            <Save size={16} />
            {loading ? 'Guardando...' : 'Guardar Datos'}
          </button>
        </div>
      </div>
    </div>
  );
}
