import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';

const API_BASE_URL = 'http://localhost:3000';

export default function PesadaForm() {
  const { isDark } = useThemeContext();
  
  const [vehiculos, setVehiculos] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productores, setProductores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    vehiculo_id: '',
    chofer_id: '',
    producto_id: '',
    productor_id: '',
  });
  
  const [pesadas, setPesadas] = useState([]);

  // Cargar datos en montaje
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [vRes, cRes, pRes, prRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/vehiculos`),
        fetch(`${API_BASE_URL}/api/choferes`),
        fetch(`${API_BASE_URL}/api/productos`),
        fetch(`${API_BASE_URL}/api/productores`),
      ]);

      if (!vRes.ok || !cRes.ok || !pRes.ok || !prRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const [vData, cData, pData, prData] = await Promise.all([
        vRes.json(),
        cRes.json(),
        pRes.json(),
        prRes.json(),
      ]);

      setVehiculos(vData.data || vData || []);
      setChoferes(cData.data || cData || []);
      setProductos(pData.data || pData || []);
      setProductores(prData.data || prData || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cargar datos: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const agregarPesada = (tipo) => {
    if (!formData.vehiculo_id || !formData.chofer_id || !formData.producto_id || !formData.productor_id) {
      setMessage({ type: 'error', text: 'Por favor selecciona todos los campos' });
      return;
    }

    const vehiculo = vehiculos.find(v => v.id == formData.vehiculo_id);
    const chofer = choferes.find(c => c.id == formData.chofer_id);
    const producto = productos.find(p => p.id == formData.producto_id);
    const productor = productores.find(pr => pr.id == formData.productor_id);

    const nuevaPesada = {
      id: Date.now(),
      tipo, // 'BRUTO' o 'TARA'
      vehiculoPatente: vehiculo.patente,
      choferNombre: chofer.apellido_nombre,
      productoNombre: producto.nombre,
      productorNombre: productor.nombre,
      ...formData,
    };

    setPesadas([...pesadas, nuevaPesada]);
    setMessage({ type: 'success', text: `Pesada ${tipo} agregada` });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleEliminar = (id) => {
    setPesadas(pesadas.filter(p => p.id !== id));
  };

  const crearTicket = async () => {
    if (pesadas.length === 0) {
      setMessage({ type: 'error', text: 'Debes agregar al menos una pesada' });
      return;
    }

    try {
      setLoading(true);
      
      // Crear ticket
      const ticketRes = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehiculo_id: formData.vehiculo_id,
          chofer_id: formData.chofer_id,
          producto_id: formData.producto_id,
          productor_id: formData.productor_id,
          estado: 'ACTIVO',
        }),
      });

      if (!ticketRes.ok) {
        throw new Error('Error al crear ticket');
      }

      const ticket = await ticketRes.json();

      // Crear pesadas
      for (const pesada of pesadas) {
        await fetch(`${API_BASE_URL}/api/pesadas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_id: ticket.id,
            tipo: pesada.tipo,
            kilos: pesada.kilos || 0,
          }),
        });
      }

      setMessage({ type: 'success', text: 'Ticket creado exitosamente' });
      
      // Limpiar
      setFormData({
        vehiculo_id: '',
        chofer_id: '',
        producto_id: '',
        productor_id: '',
      });
      setPesadas([]);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success'
            ? isDark ? 'bg-green-500/30 text-green-400' : 'bg-green-100 text-green-700'
            : isDark ? 'bg-red-500/30 text-red-400' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className={`backdrop-blur-xl rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${
        isDark
          ? 'bg-white/10 border border-white/20'
          : 'bg-white/70 border border-slate-200'
      }`}>
        <h3 className={`text-2xl font-bold mb-6 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Nueva Pesada</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-black' : 'text-slate-700'}`}>Vehículo</label>
            <select
              name="vehiculo_id"
              value={formData.vehiculo_id}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none ${
                isDark
                  ? 'bg-white/10 border border-white/20 text-black'
                  : 'bg-white border border-slate-300 text-slate-900'
              }`}
            >
              <option value="">Seleccionar vehículo</option>
              {vehiculos.map(v => (
                <option key={v.id} value={v.id}>{v.patente} - {v.tipo_vehiculo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-black' : 'text-slate-700'}`}>Chofer</label>
            <select
              name="chofer_id"
              value={formData.chofer_id}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none ${
                isDark
                  ? 'bg-white/10 border border-white/20 text-black'
                  : 'bg-white border border-slate-300 text-slate-900'
              }`}
            >
              <option value="">Seleccionar chofer</option>
              {choferes.map(c => (
                <option key={c.id} value={c.id}>{c.apellido_nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-black' : 'text-slate-700'}`}>Producto</label>
            <select
              name="producto_id"
              value={formData.producto_id}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none ${
                isDark
                  ? 'bg-white/10 border border-white/20 text-black'
                  : 'bg-white border border-slate-300 text-slate-900'
              }`}
            >
              <option value="">Seleccionar producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-black' : 'text-slate-700'}`}>Productor</label>
            <select
              name="productor_id"
              value={formData.productor_id}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none ${
                isDark
                  ? 'bg-white/10 border border-white/20 text-black'
                  : 'bg-white border border-slate-300 text-slate-900'
              }`}
            >
              <option value="">Seleccionar productor</option>
              {productores.map(pr => (
                <option key={pr.id} value={pr.id}>{pr.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => agregarPesada('BRUTO')}
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              isDark
                ? 'bg-green-500/30 hover:bg-green-500/50 text-green-400 disabled:opacity-50'
                : 'bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50'
            }`}
          >
            + Agregar BRUTO
          </button>
          <button
            onClick={() => agregarPesada('TARA')}
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              isDark
                ? 'bg-orange-500/30 hover:bg-orange-500/50 text-orange-400 disabled:opacity-50'
                : 'bg-orange-100 hover:bg-orange-200 text-orange-700 disabled:opacity-50'
            }`}
          >
            + Agregar TARA
          </button>
        </div>

        <button
          onClick={crearTicket}
          disabled={loading || pesadas.length === 0}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${
            isDark
              ? 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50'
              : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
          }`}
        >
          {loading ? 'Guardando...' : 'Crear Ticket'}
        </button>
      </div>

      {pesadas.length > 0 && (
        <div className={`backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-white/10 border border-white/20'
            : 'bg-white/70 border border-slate-200'
        }`}>
          <div className="h-1 bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500"></div>
          <div className="p-6">
            <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Pesadas ({pesadas.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${
                    isDark
                      ? 'border-b border-white/10 bg-white/5'
                      : 'border-b border-slate-200 bg-slate-50'
                  }`}>
                    <th className={`px-4 py-3 text-left font-bold ${isDark ? 'text-black' : 'text-slate-700'}`}>Tipo</th>
                    <th className={`px-4 py-3 text-left font-bold ${isDark ? 'text-black' : 'text-slate-700'}`}>Vehículo</th>
                    <th className={`px-4 py-3 text-left font-bold ${isDark ? 'text-black' : 'text-slate-700'}`}>Chofer</th>
                    <th className={`px-4 py-3 text-left font-bold ${isDark ? 'text-black' : 'text-slate-700'}`}>Producto</th>
                    <th className={`px-4 py-3 text-left font-bold ${isDark ? 'text-black' : 'text-slate-700'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pesadas.map((pesada) => (
                    <tr key={pesada.id} className={`${
                      isDark
                        ? 'border-b border-white/5 hover:bg-white/10'
                        : 'border-b border-slate-100 hover:bg-slate-50'
                    }`}>
                      <td className={`px-4 py-3 font-bold ${
                        pesada.tipo === 'BRUTO'
                          ? 'text-green-400'
                          : 'text-orange-400'
                      }`}>{pesada.tipo}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-black' : 'text-slate-800'}`}>{pesada.vehiculoPatente}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-black' : 'text-slate-800'}`}>{pesada.choferNombre}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-black' : 'text-slate-800'}`}>{pesada.productoNombre}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEliminar(pesada.id)}
                          className={`p-2 rounded-lg transition-all ${
                            isDark
                              ? 'bg-red-500/30 text-red-400 hover:bg-red-500/50'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}