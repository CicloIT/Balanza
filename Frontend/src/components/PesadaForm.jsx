import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Plus, Trash2, Scale, Info, Wifi, WifiOff, Download, Camera, RefreshCw, Monitor, FileText, Lock } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import SearchableSelect from './SearchableSelect';

const API_BASE_URL = '';
const STORAGE_KEY = 'balanza_user';

// Helper para obtener headers con información del usuario
const getAuthHeaders = (contentType = null) => {
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.id) {
        headers['x-user-id'] = user.id.toString();
      }
      if (user?.username) {
        headers['x-username'] = user.username;
      }
    }
  } catch {
    // Ignorar errores
  }

  return headers;
};

const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
};
const WS_URL = getWsUrl();

/* ─── Sub-componente para el Display de la Balanza (Localiza re-renders) ─── */
const BalanzaDisplay = memo(({ onCapture, weightRef, statusRef, isDark }) => {
  const [peso, setPeso] = useState(0);
  const [status, setStatus] = useState('DISCONNECTED');
  const wsRef = useRef(null);

  useEffect(() => {
    const connectWS = () => {      
      const socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('[BalanzaDisplay] Conectado');
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS') {
          setStatus(data.status);
          statusRef.current = data.status;
          if (data.currentWeight !== undefined && data.currentWeight !== null) {
            setPeso(data.currentWeight);
            weightRef.current = data.currentWeight;
          }
        } else if (data.type === 'WEIGHT') {
          setPeso(data.weight);
          weightRef.current = data.weight;
        }
      };

      socket.onclose = () => {
        console.log('[BalanzaDisplay] Desconectado. Reintentando en 3s...');
        setStatus('DISCONNECTED');
        statusRef.current = 'DISCONNECTED';
        setTimeout(connectWS, 3000);
      };

      socket.onerror = (err) => {
        console.log('[BalanzaDisplay] Error WS:', err);
        socket.close();
      };
    };

    connectWS();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [weightRef, statusRef]);

  return (
    <div className="flex-1 w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className={`text-sm font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          LITERAL DE BALANZA (Real-time)
        </label>
        <div className={`flex items-center gap-2 text-xs font-mono ${status === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`}>
          <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          {status === 'CONNECTED' ? 'LIVE' : 'CABEZAL FUERA DE SERVICIO'}
        </div>
      </div>
      <div className={`relative group px-8 py-6 rounded-2xl flex items-center justify-center min-h-[120px] transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
        <span className={`text-6xl md:text-7xl font-mono font-black ${status === 'CONNECTED'
          ? isDark ? 'text-blue-400' : 'text-blue-600'
          : 'text-slate-400 opacity-50'
          }`}>
          {peso.toLocaleString()}
          <span className="text-2xl ml-2">kg</span>
        </span>
      </div>
    </div>
  );
});

export default function PesadaForm({ transportes: transportesProp, choferes: choferesProp, productos: productosProp, productores: productoresProp, onPesadaCreated }) {
  const { isDark } = useThemeContext();
  const { canEnterManualWeight, rol } = usePermissions();

  const [vehiculos, setVehiculos] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productores, setProductores] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Refs para capturar peso sin disparar re-renders del form entero constantemente
  const currentWeightRef = useRef(0);
  const currentStatusRef = useRef('DISCONNECTED');

  const [camLoading, setCamLoading] = useState(false);
  const [camImages, setCamImages] = useState([]);
  const [camStatus, setCamStatus] = useState(null);
  const [activeChannels, setActiveChannels] = useState([1, 2, 3]);
  const [marcaGrabadora, setMarcaGrabadora] = useState(
    () => localStorage.getItem('balanza_marca_grabadora') || 'dahua'
  );

  const [formData, setFormData] = useState({
    vehiculo_patente: '',
    chofer_id: '',
    producto_id: '',
    productor_id: '',
    transporte_id: '',
    balancero: '',
    peso: '',
    nro_remito: '',
  });
  const [archivoPDF, setArchivoPDF] = useState(null);
  const fileInputRef = useRef(null);

  const [pesadaActiva, setPesadaActiva] = useState(null);

  // Auto-completar datos si hay una pesada abierta para la patente
  useEffect(() => {
    if (formData.vehiculo_patente.trim().length >= 6) {
      const fetchActiva = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/pesadas/activa/${formData.vehiculo_patente}`, {
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success && data.data) {
            setPesadaActiva(data.data);
            // Auto-completar campos de maestro
            setFormData(prev => ({
              ...prev,
              chofer_id: data.data.chofer_nombre || data.data.chofer_id || '',
              producto_id: data.data.producto_nombre || data.data.producto_id || '',
              productor_id: data.data.productor_nombre || data.data.productor_id || '',
              transporte_id: data.data.transporte_nombre || data.data.transporte_id || '',
            }));
          } else {
            setPesadaActiva(null);
          }
        } catch (e) { console.error(e); }
      };

      const timeout = setTimeout(fetchActiva, 600);
      return () => clearTimeout(timeout);
    }
  }, [formData.vehiculo_patente]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const endpoints = {
          vehiculos: `${API_BASE_URL}/api/vehiculos`,
          choferes: `${API_BASE_URL}/api/choferes`,
          productos: `${API_BASE_URL}/api/productos`,
          productores: `${API_BASE_URL}/api/productores`,
          transportes: `${API_BASE_URL}/api/transportes`,
        };

        const keys = Object.keys(endpoints);
        const responses = await Promise.all(
          Object.values(endpoints).map(url => fetch(url, { headers: getAuthHeaders() }))
        );

        const dataResults = {};
        for (let i = 0; i < responses.length; i++) {
          const key = keys[i];
          const res = responses[i];
          if (res.ok) dataResults[key] = await res.json();
        }

        setVehiculos(dataResults.vehiculos?.data || []);
        setChoferes(dataResults.choferes?.data || []);
        setProductos(dataResults.productos?.data || []);
        setProductores(dataResults.productores?.data || []);
        setTransportes(dataResults.transportes?.data || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
    
    // Cargar config cámaras
    (async () => {
      try {
        const marca = localStorage.getItem('balanza_marca_grabadora') || 'dahua';
        const res = await fetch(`${API_BASE_URL}/api/camaras/config?marca=${marca}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.canales) setActiveChannels(data.canales);
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'peso' && !canEnterManualWeight()) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, [canEnterManualWeight]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
       setArchivoPDF(file);
    } else {
       setArchivoPDF(null);
       if (file) setMessage({ type: 'error', text: 'Solo se permiten archivos PDF' });
    }
  }, []);

  const handleCapture = useCallback((peso) => {
    setFormData(prev => ({ ...prev, peso: peso.toString() }));
    setMessage({ type: 'success', text: `Peso capturado: ${peso} kg` });
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const capturarFotos = async (patente, marca = marcaGrabadora) => {
    try {
      setCamLoading(true);
      setCamStatus('capturing');
      const res = await fetch(
        `${API_BASE_URL}/api/camaras/capturar-todo?patente=${encodeURIComponent(patente)}&marca=${marca}`,
        { headers: getAuthHeaders() }
      );
      const data = await res.json();
      if (data.status === 'ok') {
        setCamImages(data.archivos || []);
        setCamStatus('success');
        return data.archivos || [];
      } else {
        setCamStatus('error');
        return [];
      }
    } catch (e) {
      setCamStatus('error');
      return [];
    } finally {
      setCamLoading(false);
    }
  };

  const cambiarMarca = async (nuevaMarca) => {
    setMarcaGrabadora(nuevaMarca);
    localStorage.setItem('balanza_marca_grabadora', nuevaMarca);
    setCamImages([]);
    setCamStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/camaras/config?marca=${nuevaMarca}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && data.canales) setActiveChannels(data.canales);
    } catch (e) { /* ignore */ }
  };

  const registrarPesada = async (tipo) => {
    if (!formData.peso || parseFloat(formData.peso) <= 0) {
      setMessage({ type: 'error', text: 'Por favor ingresa un peso válido' });
      return;
    }
    if (!formData.vehiculo_patente.trim()) {
      setMessage({ type: 'error', text: 'La patente es obligatoria' });
      return;
    }

    // Usamos las refs para verificar manual vs real-time
    const pesoCapturado = currentWeightRef.current.toString();
    const pesoIngresado = formData.peso.toString();
    const esManual = pesoIngresado !== pesoCapturado && currentStatusRef.current === 'CONNECTED';

    if (esManual && !canEnterManualWeight()) {
      setMessage({ type: 'error', text: 'No tiene permiso para cargar peso manualmente.' });
      return;
    }

    try {
      setLoading(true);
      
      // Solo capturar fotos si no hay pesada activa con fotos operacion_id
      // o si es una pesada nueva (BRUTO sin operacion previa)
      let fotosCapturadas = [];
      const yaTieneFotos = pesadaActiva && pesadaActiva.fotos && JSON.parse(typeof pesadaActiva.fotos === 'string' ? pesadaActiva.fotos : JSON.stringify(pesadaActiva.fotos)).length > 0;
      
      if (!yaTieneFotos) {
        console.log('📸 No se encontraron fotos previas, capturando nuevas...');
        fotosCapturadas = await capturarFotos(formData.vehiculo_patente);
      } else {
        console.log('📸 La operación ya tiene fotos vinculadas, saltando captura.');
      }

      // Mapear nombres a IDs si es necesario (para datalists)
      const findId = (list, val, nameAttr = 'nombre') => {
        const found = list.find(x => x[nameAttr] === val || x.id == val || x.apellido_nombre === val);
        return found ? found.id : null;
      };

      const cId = findId(choferes,    formData.chofer_id,    'apellido_nombre');
      const pId = findId(productos,   formData.producto_id);
      const prId = findId(productores, formData.productor_id);
      const tId = findId(transportes, formData.transporte_id);

      const d = new FormData();
      d.append('vehiculo_patente', formData.vehiculo_patente);
      d.append('tipo', tipo);
      d.append('peso', parseFloat(formData.peso));
      d.append('es_manual', esManual);
      if (cId) d.append('chofer_id', cId);
      if (pId) d.append('producto_id', pId);
      if (prId) d.append('productor_id', prId);
      if (tId) d.append('transporte_id', tId);
      if (formData.balancero) d.append('balancero', formData.balancero);
      if (formData.nro_remito) d.append('nro_remito', formData.nro_remito);
      if (archivoPDF) d.append('archivo', archivoPDF);
      
      // Pasar las fotos capturadas (array de objetos o strings)
      if (fotosCapturadas && fotosCapturadas.length > 0) {
        d.append('fotos', JSON.stringify(fotosCapturadas));
      } else if (camImages && camImages.length > 0) {
        // Fallback si por alguna razón no se capturaron ahora pero hay previas
        d.append('fotos', JSON.stringify(camImages));
      }

      const res = await fetch(`${API_BASE_URL}/api/pesadas`, {
        method: 'POST',
        headers: getAuthHeaders(null),
        body: d
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al registrar pesada');

      setMessage({ type: 'success', text: `Pesada ${tipo} registrada exitosamente` });
      if (onPesadaCreated) onPesadaCreated();
      setFormData({ 
        vehiculo_patente: '',
        chofer_id: '',
        producto_id: '',
        productor_id: '',
        transporte_id: '',
        balancero: '',
        peso: '',
        nro_remito: ''
      });
      setArchivoPDF(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-xl p-4 shadow-lg border animate-fadeIn ${message.type === 'success'
          ? isDark ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-green-100 border-green-200 text-green-700'
          : isDark ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-100 border-red-200 text-red-700'
          }`}>
          {message.text}
        </div>
      )}

      <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-8 transition-all duration-300 ${isDark
        ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-slate-200'}`}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 text-white">
              <Scale size={24} />
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Operación de Pesaje</h3>
          </div>
          {pesadaActiva && (
            <div className={`px-4 py-1.5 rounded-lg text-xs font-bold ${isDark ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
              ESTADO: PESADA ABIERTA (PENDIENTE TARA)
            </div>
          )}
        </div>

        {/* Maestro Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SearchableSelect
            label="Vehículo / Patente"
            name="vehiculo_patente"
            value={formData.vehiculo_patente}
            options={vehiculos}
            displayKey="patente"
            onChange={handleInputChange}
            placeholder="ABC-123"
          />
          <SearchableSelect
            label="Chofer"
            name="chofer_id"
            value={formData.chofer_id}
            options={choferesProp}
            displayKey="apellido_nombre"
            onChange={handleInputChange}
            placeholder="Apellido, Nombre"
          />
          <SearchableSelect
            label="Transporte"
            name="transporte_id"
            value={formData.transporte_id}
            options={transportesProp}
            displayKey="nombre"
            onChange={handleInputChange}
            placeholder="Empresa..."
          />
          <SearchableSelect
            label="Producto"
            name="producto_id"
            value={formData.producto_id}
            options={productosProp}
            displayKey="nombre"
            onChange={handleInputChange}
            placeholder="Tipo de carga..."
          />
          <SearchableSelect
            label="Productor"
            name="productor_id"
            value={formData.productor_id}
            options={productoresProp}
            displayKey="nombre"
            onChange={handleInputChange}
            placeholder="Productor..."
          />
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nro Remito</label>
            <input name="nro_remito" value={formData.nro_remito} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'}`} placeholder="0001-00000123" />
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Balancero</label>
            <input name="balancero" value={formData.balancero} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'}`} placeholder="Nombre balancero" />
          </div>
        </div>

        {/* Peso Section */}
        <div className={`p-8 rounded-3xl mb-8 flex flex-col lg:flex-row items-center gap-8 ${isDark ? 'bg-blue-600/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
          <BalanzaDisplay 
             isDark={isDark} 
             onCapture={handleCapture}
             weightRef={currentWeightRef}
             statusRef={currentStatusRef}
          />

          <div className="hidden lg:flex flex-col items-center opacity-30">
            <div className="w-1 h-24 bg-blue-500 rounded-full"></div>
            <Scale size={20} className="my-2 text-blue-500" />
            <div className="w-1 h-24 bg-blue-500 rounded-full"></div>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div className="flex items-center justify-between gap-2">
               <label className={`text-sm font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>PESO PARA REGISTRO (kg)</label>
               {!canEnterManualWeight() && <Lock size={14} className="text-slate-400" title="Manual weight locked for balancero" />}
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="number"
                  name="peso"
                  value={formData.peso}
                  onChange={handleInputChange}
                  disabled={!canEnterManualWeight()}
                  placeholder="0"
                  className={`w-full text-5xl md:text-6xl font-mono font-black py-6 px-8 rounded-2xl text-center outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-600'} ${!canEnterManualWeight() ? 'cursor-not-allowed opacity-80' : 'focus:ring-2 focus:ring-emerald-500'}`}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold opacity-30">kg</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (currentStatusRef.current === 'CONNECTED') {
                    handleCapture(currentWeightRef.current);
                  }
                }}
                disabled={currentStatusRef.current !== 'CONNECTED'}
                className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
                  currentStatusRef.current === 'CONNECTED'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Download size={20} />
                {currentStatusRef.current === 'CONNECTED' ? 'CAPTURAR PESO BALANZA' : 'BALANZA DESCONECTADA'}
              </button>
            </div>
          </div>
        </div>

        {/* PDF Upload */}
        <div className="mb-8">
           <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Carta de Porte (PDF Opcional)</label>
           <div 
             onClick={() => fileInputRef.current?.click()}
             className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center gap-3 ${archivoPDF 
               ? 'border-emerald-500/50 bg-emerald-500/5' : isDark ? 'border-slate-700 bg-slate-900/50 hover:border-blue-500/50' : 'border-slate-300 bg-slate-50 hover:border-blue-400'}`}
           >
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
             {archivoPDF ? <><FileText className="text-emerald-500" size={32}/><span className="text-sm font-bold text-emerald-500">{archivoPDF.name}</span></> : <><Download size={32} className="opacity-30"/><span className="text-sm opacity-50">Haz clic para seleccionar o arrastra el archivo aquí</span></>}
           </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
           <button onClick={() => registrarPesada('BRUTO')} disabled={loading} className="flex-1 py-5 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">REGISTRAR BRUTO</button>
           <button onClick={() => registrarPesada('TARA')} disabled={loading} className="flex-1 py-5 bg-linear-to-r from-emerald-600 to-teal-700 text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">REGISTRAR TARA</button>
        </div>
      </div>

      {/* Cámaras Section */}
      <div className={`backdrop-blur-xl rounded-2xl shadow-xl p-8 border transition-all ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'}`}>

         {/* Header con selector de marca */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Camera className="text-blue-500" size={24}/>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cámaras de Seguridad</h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Toggle Marca */}
              <div className={`flex rounded-xl overflow-hidden border text-xs font-black ${isDark ? 'border-slate-600 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
                <button
                  id="btn-marca-dahua"
                  onClick={() => cambiarMarca('dahua')}
                  disabled={camLoading}
                  className={`px-4 py-2 transition-all ${
                    marcaGrabadora === 'dahua'
                      ? 'bg-blue-600 text-white shadow-inner'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  DAHUA
                </button>
                <button
                  id="btn-marca-hikvision"
                  onClick={() => cambiarMarca('hikvision')}
                  disabled={camLoading}
                  className={`px-4 py-2 transition-all ${
                    marcaGrabadora === 'hikvision'
                      ? 'bg-red-600 text-white shadow-inner'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  HIKVISION
                </button>
              </div>
              {/* Refresh */}
              <button
                onClick={() => capturarFotos(formData.vehiculo_patente)}
                disabled={camLoading}
                className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
                title="Recapturar fotos"
              >
                <RefreshCw size={20} className={camLoading ? 'animate-spin' : ''}/>
              </button>
            </div>
         </div>

         {/* Badge de marca activa */}
         <div className="mb-4">
           <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
             marcaGrabadora === 'hikvision'
               ? 'bg-red-500/15 text-red-400 border border-red-500/30'
               : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
           }`}>
             <span className={`w-1.5 h-1.5 rounded-full ${
               marcaGrabadora === 'hikvision' ? 'bg-red-400' : 'bg-blue-400'
             }`}></span>
             {marcaGrabadora === 'hikvision' ? 'Hikvision — Canales 400 · 500 · 1800' : 'Dahua — Detección automática de canales'}
           </span>
         </div>

         {/* Grid de cámaras */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeChannels.map(ch => {
              const img = camImages.find(i => i.canal === ch);
              const imgSrc = img ? (img.ruta.startsWith('/capturas/') ? img.ruta : `/capturas/${img.ruta}`) : null;
              return (
                <div key={ch} className={`aspect-video rounded-2xl overflow-hidden border relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  {img
                    ? <img src={imgSrc} alt={`Cámara ${ch}`} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30">
                        <Monitor size={48}/>
                        <span className="text-xs font-bold">CÁMARA {ch}</span>
                      </div>
                  }
                  {camLoading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><RefreshCw className="text-white animate-spin" size={24}/></div>}
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}
