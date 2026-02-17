import React from 'react';
import { useThemeContext } from '../context/ThemeContext';

export default function InputField({ 
  label, 
  value, 
  onChange, 
  type = 'text',
  placeholder = '',
  disabled = false
}) {
  const { isDark } = useThemeContext();

  return (
    <div>
      <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
        isDark ? 'text-slate-300' : 'text-slate-700'
      } ${disabled ? 'opacity-50' : ''}`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
          isDark
            ? 'bg-white/10 border border-white/20 focus:border-white/30 text-white placeholder-slate-400'
            : 'bg-white border border-slate-300 focus:border-blue-400 text-slate-900 placeholder-slate-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}