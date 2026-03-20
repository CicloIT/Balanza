import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';

const SearchableSelect = memo(({ 
  label, 
  name, 
  value, 
  options, // Array de objetos { id, nombre, patente, etc. }
  onChange, 
  placeholder = "Seleccionar...",
  displayKey = "nombre", // La propiedad que se muestra ("nombre", "patente", etc.)
  className = ""
}) => {
  const { isDark } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Sincronizar searchTerm con el valor actual si es necesario
  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  // Filtrar opciones basadas en el término de búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options.slice(0, 100); // Mostrar máximo 100 para rendimiento
    const term = searchTerm.toLowerCase();
    return options.filter(opt => {
      const displayVal = String(opt[displayKey] || '').toLowerCase();
      return displayVal.includes(term);
    }).slice(0, 50);
  }, [options, searchTerm, displayKey]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  const currentDisplayValue = useMemo(() => {
    // Si el valor actual está en las opciones, mostramos el nombre
    // Pero como PesadaForm usa el valor directamente como string (nombre/patente),
    // simplemente devolvemos el valor actual.
    return value || '';
  }, [value]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 ${
          isDark 
            ? 'bg-slate-900 border-slate-700 text-white hover:border-slate-500' 
            : 'bg-white border-slate-300 text-slate-900 hover:border-blue-400'
        } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
      >
        <span className={!value ? 'opacity-40' : ''}>
          {currentDisplayValue || placeholder}
        </span>
        <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className={`absolute z-50 w-full mt-2 rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          {/* Cámara de búsqueda interna */}
          <div className={`p-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
              <Search size={16} className="opacity-30" />
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="bg-transparent border-none outline-none w-full text-sm py-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm) {
                    handleSelect(searchTerm);
                  }
                }}
              />
              {searchTerm && (
                <X 
                  size={16} 
                  className="cursor-pointer opacity-50 hover:opacity-100" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                  }} 
                />
              )}
            </div>
          </div>

          {/* Lista de opciones */}
          <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div
                  key={opt.id || idx}
                  onClick={() => handleSelect(opt[displayKey])}
                  className={`px-4 py-3 cursor-pointer text-sm transition-colors ${
                    value === opt[displayKey]
                      ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                      : isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {opt[displayKey]}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm opacity-50 mb-2">No se encontraron resultados</p>
                {searchTerm && (
                  <button
                    onClick={() => handleSelect(searchTerm)}
                    className="text-xs font-bold text-blue-500 hover:underline"
                  >
                    Usar "{searchTerm}" como nuevo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchableSelect;
