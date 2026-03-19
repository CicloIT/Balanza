import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Scale, Info, Wifi, WifiOff, Download, Camera, RefreshCw, Monitor, FileText, Lock } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
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
  const host = window.location.host; // Host incluye el puerto de Vite (5173 o túnel)
  return `${protocol}//${host}/ws`;
};
const WS_URL = getWsUrl();

export default function PesadaForm() {
  const { isDark } = useThemeContext();
  const { canEnterManualWeight, rol } = usePermissions();

  const [vehiculos, setVehiculos] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productores, setProductores] = useState([]);
  const [transportes, setTransportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Estados de la balanza
  const [balanzaPeso, setBalanzaPeso] = useState(0);
  const [balanzaStatus, setBalanzaStatus] = useState('DISCONNECTED');
  const wsRef = useRef(null);

  // Estados de cámara
  const [camLoading, setCamLoading] = useState(false);
  const [camImages, setCamImages] = useState([]);
  const [camStatus, setCamStatus] = useState(null);
  const [activeChannels, setActiveChannels] = useState([1, 2, 3]); // Fallback inicial

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

  const [pesadas, setPesadas] = useState([]);
  // WebSocket connection
  useEffect(() => {
    const connectWS = () => {
      console.log('Intentando conectar con servidor de balanza...');
      const socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('Conectado al servidor de balanza');
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'STATUS') {
          setBalanzaStatus(data.status);
          if (data.currentWeight !== undefined && data.currentWeight !== null) {
            setBalanzaPeso(data.currentWeight);
          }
        } else if (data.type === 'WEIGHT') {
          setBalanzaPeso(data.weight);
        }
      };

      socket.onclose = () => {
        console.log('Desconectado del servidor de balanza');
        setBalanzaStatus('DISCONNECTED');
        // Reintentar conexión en 5 segundos
        setTimeout(connectWS, 5000);
      };

      socket.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        socket.close();
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Autocomplete para TARA basado en operación abierta por patente
  useEffect(() => {
    const patente = formData.vehiculo_patente;
    if (patente && patente.length >= 6) {
      const fetchActiva = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/pesadas/activa/${encodeURIComponent(patente)}`, {
            headers: getAuthHeaders()
          });
          const data = await res.json();
          if (data.success && data.data) {
            const p = data.data;
            setFormData(prev => ({
              ...prev,
              chofer_id: p.chofer_nombre || p.chofer_id || prev.chofer_id,
              producto_id: p.producto_nombre || p.producto_id || prev.producto_id,
              productor_id: p.productor_nombre || p.productor_id || prev.productor_id,
              transporte_id: p.transporte_nombre || p.transporte_id || prev.transporte_id,
              nro_remito: p.nro_remito || prev.nro_remito,
              balancero: p.balancero || prev.balancero,
            }));
            setMessage({
              type: 'success',
              text: `Datos recuperados de la pesada de BRUTO (${p.chofer_nombre || 'S/D'})`
            });
            setTimeout(() => setMessage(null), 3000);
          }
        } catch (e) {
          console.error('Error fetching active pesada:', e);
        }
      };

      const timeout = setTimeout(fetchActiva, 600);
      return () => clearTimeout(timeout);
    }
  }, [formData.vehiculo_patente]);

  // Cargar datos en montaje
  useEffect(() => {
    cargarDatos();
    cargarConfigCamaras();
  }, []);

  const cargarConfigCamaras = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/camaras/config`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.canales) {
        setActiveChannels(data.canales);
      }
    } catch (e) {
      console.error('Error cargando config de cámaras:', e);
    }
  };

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

      const failed = [];
      const dataResults = {};

      for (let i = 0; i < responses.length; i++) {
        const key = keys[i];
        const res = responses[i];
        if (!res.ok) {
          try {
            const errData = await res.json();
            failed.push(`${key} (${errData.error || res.statusText})`);
          } catch (e) {
            failed.push(`${key} (${res.statusText})`);
          }
        } else {
          dataResults[key] = await res.json();
        }
      }

      if (failed.length > 0) {
        throw new Error(`Error al cargar datos maestro: ${failed.join(', ')}`);
      }

      const vData = dataResults.vehiculos;
      const cData = dataResults.choferes;
      const pData = dataResults.productos;
      const prData = dataResults.productores;
      const tData = dataResults.transportes;

      setVehiculos(vData.data || []);
      setChoferes(cData.data || []);
      setProductos(pData.data || []);
      setProductores(prData.data || []);
      setTransportes(tData.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cargar datos: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Bloqueo de seguridad adicional para entrada manual de peso
    if (name === 'peso' && !canEnterManualWeight()) {
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setArchivoPDF(file);
    } else {
      setArchivoPDF(null);
      if (file) setMessage({ type: 'error', text: 'Solo se permiten archivos PDF' });
    }
  };

  const capturarPeso = () => {
    setFormData({
      ...formData,
      peso: balanzaPeso.toString()
    });
    setMessage({ type: 'success', text: `Peso capturado: ${balanzaPeso} kg` });
    setTimeout(() => setMessage(null), 2000);
  };

  const capturarFotos = async (patente) => {
    try {
      setCamLoading(true);
      setCamStatus('capturing');
      const res = await fetch(`${API_BASE_URL}/api/camaras/capturar-todo?patente=${encodeURIComponent(patente)}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setCamImages(data.archivos || []);
        setCamStatus('success');
      } else {
        setCamStatus('error');
      }
    } catch (e) {
      console.error(e);
      setCamStatus('error');
    } finally {
      setCamLoading(false);
    }
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

    // Verificar si el peso es manual (no viene de la balanza)
    const pesoCapturado = balanzaPeso.toString();
    const pesoIngresado = formData.peso.toString();
    const esManual = pesoIngresado !== pesoCapturado && balanzaStatus === 'CONNECTED';

    // Si es manual y no tiene permiso, mostrar error
    if (esManual && !canEnterManualWeight()) {
      setMessage({
        type: 'error',
        text: 'No tiene permiso para cargar peso manualmente. Use el botón de captura o contacte al administrador.'
      });
      return;
    }

    try {
      setLoading(true);

      // Disparar captura de fotos asíncronamente mientras se procesa la pesada
      capturarFotos(formData.vehiculo_patente);

      const chofer = choferes.find(c => c.apellido_nombre === formData.chofer_id || c.id == formData.chofer_id);
      const producto = productos.find(p => p.nombre === formData.producto_id || p.id == formData.producto_id);
      const productor = productores.find(p => p.nombre === formData.productor_id || p.id == formData.productor_id);
      const transporte = transportes.find(t => t.nombre === formData.transporte_id || t.id == formData.transporte_id);

      const dataToSend = new FormData();
      dataToSend.append('vehiculo_patente', formData.vehiculo_patente);
      dataToSend.append('tipo', tipo);
      dataToSend.append('peso', parseFloat(formData.peso));
      dataToSend.append('es_manual', esManual); // Indicar si es peso manual
      if (chofer) dataToSend.append('chofer_id', chofer.id);
      if (producto) dataToSend.append('producto_id', producto.id);
      if (productor) dataToSend.append('productor_id', productor.id);
      if (transporte) dataToSend.append('transporte_id', transporte.id);
      if (formData.balancero) dataToSend.append('balancero', formData.balancero);
      if (formData.nro_remito) dataToSend.append('nro_remito', formData.nro_remito);

      if (archivoPDF) {
        dataToSend.append('archivo', archivoPDF);
      }

      const res = await fetch(`${API_BASE_URL}/api/pesadas`, {
        method: 'POST',
        headers: getAuthHeaders(null), // FormData doesn't need Content-Type header
        body: dataToSend
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar pesada');

      setMessage({ type: 'success', text: `Pesada ${tipo} registrada exitosamente` });
      setFormData({ ...formData, peso: '', nro_remito: '', balancero: '' });
      setArchivoPDF(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-4 shadow-md border animate-fadeIn ${message.type === 'success'
          ? isDark ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-green-100 border-green-200 text-green-700'
          : isDark ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-100 border-red-200 text-red-700'
          }`}>
          {message.text}
        </div>
      )}

      <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-8 transition-all duration-300 ${isDark
        ? 'bg-slate-800/50 border border-slate-700'
        : 'bg-white/80 border border-slate-200'
        }`}>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
              <Scale className="text-white" size={24} />
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Operación de Pesaje</h3>
          </div>

          <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${balanzaStatus === 'CONNECTED'
            ? isDark ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-green-50 border-green-200 text-green-700'
            : isDark ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
            }`}>
            {balanzaStatus === 'CONNECTED' ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span className="text-sm font-bold">BALANZA: {balanzaStatus === 'CONNECTED' ? 'CONECTADA' : 'DESCONECTADA'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Fila 1 */}
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Balancero</label>
            <input
              type="text"
              name="balancero"
              value={formData.balancero}
              onChange={handleInputChange}
              placeholder="Nombre del balancero..."
              className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Vehículo (Patente) *</label>
            <input
              type="text"
              name="vehiculo_patente"
              list="list-vehiculos"
              value={formData.vehiculo_patente}
              onChange={handleInputChange}
              placeholder="Escribe patente..."
              className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
            />
            <datalist id="list-vehiculos">
              {vehiculos.map(v => <option key={v.id} value={v.patente}>{v.tipo_vehiculo}</option>)}
            </datalist>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Chofer</label>
            <input
              type="text"
              name="chofer_id"
              list="list-choferes"
              value={formData.chofer_id}
              onChange={handleInputChange}
              placeholder="Escribe chofer..."
              className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
            />
            <datalist id="list-choferes">
              {choferes.map(c => <option key={c.id} value={c.apellido_nombre} />)}
            </datalist>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Transporte</label>
            <input
              type="text"
              name="transporte_id"
              list="list-transportes"
              value={formData.transporte_id}
              onChange={handleInputChange}
              placeholder="Empresa..."
              className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
            />
            <datalist id="list-transportes">
              {transportes.map(t => <option key={t.id} value={t.nombre} />)}
            </datalist>
          </div>

          {/* Fila 2 */}
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Producto</label>
            <input
              type="text"
              name="producto_id"
              list="list-productos"
              value={formData.producto_id}
              onChange={handleInputChange}
              placeholder="Tipo de carga..."
              className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
            />
            <datalist id="list-productos">
              {productos.map(p => <option key={p.id} value={p.nombre} />)}
            </datalist>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Productor</label>
            <input
              type="text"
              name="productor_id"
              list="list-productores"
              value={formData.productor_id}
              onChange={handleInputChange}
              placeholder="Productor..."
              className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
            />
            <datalist id="list-productores">
              {productores.map(p => <option key={p.id} value={p.nombre} />)}
            </datalist>
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nro Remito</label>
            <input
              type="text"
              name="nro_remito"
              value={formData.nro_remito}
              onChange={handleInputChange}
              placeholder="0001-00000123"
              className={`w-full px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
            />
          </div>
        </div>

        {/* Captura de Peso */}
        <div className={`p-8 rounded-3xl mb-8 flex flex-col lg:flex-row items-center gap-8 ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
          }`}>

          {/* Display Balanza en Tiempo Real */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-bold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>LITERAL DE BALANZA (Real-time)</label>
              <div className={`flex items-center gap-2 text-xs font-mono ${balanzaStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${balanzaStatus === 'CONNECTED' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {balanzaStatus === 'CONNECTED' ? 'LIVE' : 'OFFLINE'}
              </div>
            </div>
            <div className={`relative group px-8 py-6 rounded-2xl flex items-center justify-center min-h-[120px] transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}>
              <span className={`text-6xl md:text-7xl font-mono font-black ${balanzaStatus === 'CONNECTED'
                ? isDark ? 'text-blue-400' : 'text-blue-600'
                : 'text-slate-400 opacity-50'
                }`}>
                {balanzaPeso.toLocaleString()}
                <span className="text-2xl ml-2">kg</span>
              </span>

              {balanzaStatus === 'CONNECTED' && (
                <button
                  onClick={capturarPeso}
                  title="Capturar este peso"
                  className="absolute -right-3 -top-3 p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 group-hover:rotate-6"
                >
                  <Download size={24} />
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center">
            <div className="w-1 h-32 bg-blue-500/20 rounded-full"></div>
            <div className="my-2 text-blue-500/50 italic text-xs">Capturar</div>
            <div className="w-1 h-32 bg-blue-500/20 rounded-full"></div>
          </div>

          {/* Input de Registro */}
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center justify-between">
              <label className={`block text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                PESO PARA REGISTRO (kg) *
              </label>
              {!canEnterManualWeight() && (
                <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  <Lock size={12} />
                  Solo Subalancero/Admin puede editar
                </span>
              )}
            </div>
            <input
              type="number"
              name="peso"
              value={formData.peso}
              onChange={handleInputChange}
              placeholder="0"
              disabled={loading}
              readOnly={!canEnterManualWeight()}
              className={`w-full px-8 py-6 text-5xl font-mono font-bold rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/30 transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-blue-400' : 'bg-white border-slate-300 text-blue-600'
                } ${!canEnterManualWeight() ? 'cursor-not-allowed opacity-80' : ''}`}
            />
            <div className="flex gap-4">
              <button
                onClick={() => registrarPesada('BRUTO')}
                disabled={loading}
                className="flex-1 px-8 py-6 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-2xl shadow-lg shadow-green-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                BRUTO
              </button>
              <button
                onClick={() => registrarPesada('TARA')}
                disabled={loading}
                className="flex-1 px-8 py-6 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl rounded-2xl shadow-lg shadow-orange-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                TARA
              </button>
            </div>

            <div className="pt-2">
              <label className={`block text-xs font-black uppercase mb-2 ${isDark ? 'text-blue-300/50' : 'text-blue-900/30'}`}>Anexar Carta de Porte (PDF)</label>
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl cursor-pointer border-2 border-dashed transition-all hover:scale-[1.02] active:scale-[0.98] ${archivoPDF
                    ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                    : isDark ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-blue-500/50 hover:bg-blue-500/5' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                >
                  {archivoPDF ? <FileText size={20} /> : <Plus size={20} />}
                  <span className="font-bold">{archivoPDF ? archivoPDF.name : 'VINCULAR PDF DE CARTA PORTE'}</span>
                </label>
                {archivoPDF && (
                  <button
                    onClick={(e) => { e.preventDefault(); setArchivoPDF(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="absolute -right-2 -top-2 p-2 bg-red-500 text-white rounded-full shadow-xl hover:bg-red-600 transition-all hover:scale-110 active:scale-90 z-10"
                    title="Quitar archivo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registro Visual (Cámaras) */}
      <div className={`p-8 rounded-3xl mb-8 border transition-all ${isDark ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Camera className="text-blue-500" size={20} />
            <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Registro Visual Automático</h4>
          </div>

          {camStatus === 'capturing' && (
            <div className="flex items-center gap-2 text-blue-500 animate-pulse">
              <RefreshCw className="animate-spin" size={16} />
              <span className="text-sm font-bold">CAPTURANDO...</span>
            </div>
          )}
          {camStatus === 'success' && (
            <div className="text-green-500 text-sm font-bold">✅ CAPTURADO</div>
          )}
          {camStatus === 'error' && (
            <div className="text-red-500 text-sm font-bold">❌ ERROR NVR</div>
          )}

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {activeChannels.map((ch) => {
            const imgPath = camImages.find(img => img.includes(`_cam${ch}_`));
            return (
              <div key={ch} className={`aspect-video rounded-2xl overflow-hidden relative border ${isDark ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-300'
                }`}>
                {imgPath ? (
                  <img
                    src={`${API_BASE_URL}/capturas/${imgPath}`}
                    alt={`Cámara ${ch}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                    <Monitor size={32} />
                    <span className="text-[8px] font-black mt-2">NO IMAGE</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded text-[8px] font-bold text-white border border-white/10 uppercase">
                  CAM 0{ch}
                </div>
              </div>
            );
          })}

          {/* Info help */}
          <div className={`${activeChannels.length > 2 ? 'md:col-span-2' : 'md:col-span-1'} flex items-center gap-4 px-6 rounded-2xl border border-dashed border-slate-500/20`}>
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
              <Info size={20} />
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Las capturas se guardan automáticamente en el servidor y quedan vinculadas al registro del pesaje actual.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 italic">
        <Info size={16} />
        El panel izquierdo muestra el peso en tiempo real de la balanza. Usa el botón azul para capturarlo y registrarlo.
      </div>
    </div>
  );
}

