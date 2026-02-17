import React from 'react';
import { X } from 'lucide-react';
import InputField from './InputField';
import { useThemeContext } from '../context/ThemeContext';

export default function ModalForm({ 
  abierto, 
  titulo, 
  formData, 
  onFormChange, 
  onGuardar, 
  onCancelar,
  campos,
  loading = false,
  error = null
}) {
  const { isDark } = useThemeContext();
  
  if (!abierto) return null;

  return (
    <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn transition-colors duration-300 ${
      isDark ? 'bg-black/60' : 'bg-black/30'
    }`}>
      <div className={`border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden backdrop-blur-xl animate-slideUp transition-colors duration-300 ${
        isDark
          ? 'bg-linear-to-br from-slate-800 to-slate-900 border-white/20'
          : 'bg-linear-to-br from-white to-slate-50 border-slate-300'
      }`}>
        <div className={`flex justify-between items-center p-6 border-b transition-colors duration-300 ${
          isDark
            ? 'border-white/10 bg-linear-to-r from-white/10 to-transparent'
            : 'border-slate-200 bg-linear-to-r from-slate-100 to-transparent'
        }`}>
          <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{titulo}</h2>
          <button 
            onClick={onCancelar} 
            disabled={loading}
            className={`transition-all p-1 rounded-lg ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              isDark
                ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {error}
            </div>
          )}
          {campos.map((campo) => (
            <InputField
              key={campo.name}
              label={campo.label}
              type={campo.type || 'text'}
              value={formData[campo.name] || ''}
              onChange={(valor) => onFormChange(campo.name, valor)}
              placeholder={campo.placeholder}
              disabled={loading}
            />
          ))}
          <div className={`flex gap-3 pt-6 border-t transition-colors duration-300 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <button
              onClick={onCancelar}
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'border border-white/20 text-slate-300 hover:bg-white/10 hover:text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancelar
            </button>
            <button
              onClick={onGuardar}
              disabled={loading}
              className={`flex-1 px-4 py-3 bg-linear-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105 active:scale-95 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}