import React, { useState } from 'react';
import Header from './components/Header';

import ActionBar from './components/ActionBar';
import TablaItems from './components/TablaItems';
import ModalForm from './components/ModalForm';
import EmptyState from './components/EmptyState';
import PesadaForm from './components/PesadaForm';
import { useGestionAPI } from './hooks/useGestionAPI';
import { useThemeContext } from './context/ThemeContext';
import { choferesConfig } from './config/choferesConfig';
import { productoresConfig } from './config/productoresConfig';
import { productosConfig } from './config/productosConfig';
import { transportesConfig } from './config/transportesConfig';
import { provinciasConfig } from './config/provinciasConfig';
import { localidadesConfig } from './config/localidadesConfig';
import { vehiculosConfig } from './config/vehiculosConfig';
import { pesadasConfig } from './config/pesadasConfig';
import Dashboard from './components/Dashboard';

export default function GestionApp() {
  const { isDark } = useThemeContext();

  // Configuraciones
  const configs = {
    choferes: choferesConfig,
    productores: productoresConfig,
    productos: productosConfig,
    transportes: transportesConfig,
    provincias: provinciasConfig,
    localidades: localidadesConfig,
    vehiculos: vehiculosConfig,
    pesadas: pesadasConfig,
  };

  // Estados
  const [activeTab, setActiveTab] = useState('dashboard');
  const choferes = useGestionAPI(choferesConfig);
  const productores = useGestionAPI(productoresConfig);
  const productos = useGestionAPI(productosConfig);
  const transportes = useGestionAPI(transportesConfig);
  const provincias = useGestionAPI(provinciasConfig);
  const localidades = useGestionAPI(localidadesConfig);
  const vehiculos = useGestionAPI(vehiculosConfig);
  const pesadas = useGestionAPI(pesadasConfig);

  // Mapeo de gestion por tipo
  const gestionMap = {
    choferes,
    productores,
    productos,
    transportes,
    provincias,
    localidades,
    vehiculos,
    pesadas,
  };

  const currentGestion = gestionMap[activeTab];
  const currentConfig = configs[activeTab];

  // Preparar datos para tabs
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', count: null },
    { id: 'choferes', label: choferesConfig.label, count: choferes.items.length },
    { id: 'productores', label: productoresConfig.label, count: productores.items.length },
    { id: 'productos', label: productosConfig.label, count: productos.items.length },
    { id: 'transportes', label: transportesConfig.label, count: transportes.items.length },
    { id: 'provincias', label: provinciasConfig.label, count: provincias.items.length },
    { id: 'localidades', label: localidadesConfig.label, count: localidades.items.length },
    { id: 'vehiculos', label: vehiculosConfig.label, count: vehiculos.items.length },
    { id: 'pesada', label: '📟 Nueva Pesada', count: null },
    { id: 'pesadas', label: pesadasConfig.label, count: pesadas.items.length },

  ];

  // Componente para mostrar alerts
  const AlertBox = ({ type, message }) => {
    if (!message) return null;
    const bgColor = type === 'success'
      ? isDark ? 'bg-green-500/30 border-green-500/50 text-green-300' : 'bg-green-50 border-green-200 text-green-800'
      : isDark ? 'bg-red-500/30 border-red-500/50 text-red-300' : 'bg-red-50 border-red-200 text-red-800';

    return (
      <div className={`border rounded-lg p-4 mb-4 animate-fadeIn ${bgColor}`}>
        {message}
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark
      ? 'bg-linear-to-br from-slate-900 via-slate-800 to-slate-900'
      : 'bg-linear-to-br from-blue-50 via-white to-cyan-50'
      }`}>
      {/* Efecto decorativo de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isDark ? (
          <>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </>
        ) : (
          <>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </>
        )}
      </div>

      {/* Header */}
      <div className="relative z-10">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Mostrar Alerts - Solo si no estamos en pesada ni dashboard */}
        {activeTab !== 'pesada' && activeTab !== 'dashboard' && (
          <>
            <AlertBox type="error" message={currentGestion?.error} />
            <AlertBox type="success" message={currentGestion?.success} />
          </>
        )}

        {/* Tab de Pesada o Dashboard */}
        {activeTab === 'pesada' ? (
          <PesadaForm
            transportes={transportes.items}
            choferes={choferes.items}
            productos={productos.items}
            productores={productores.items}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard />

        ) : (
          <div className={`backdrop-blur-xl transition-colors duration-300 rounded-2xl shadow-2xl overflow-hidden ${isDark
            ? 'bg-white/10 border border-white/20'
            : 'bg-white/70 border border-slate-200'
            }`}>
            {/* Barra superior con gradiente */}
            <div className="h-1 bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500"></div>

            {/* Action Bar */}
            <ActionBar
              titulo={currentConfig.plural}
              count={currentGestion.items.length}
              onAgregar={() => currentGestion.abrirModal()}
              loading={currentGestion.loading}
              soloLectura={activeTab === 'pesadas'}
            />

            {/* Tabla o Empty State */}
            {currentGestion.loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: isDark ? '#06b6d4' : '#0ea5e9' }}></div>
              </div>
            ) : currentGestion.items.length > 0 ? (
              <div className="overflow-hidden">
                <TablaItems
                  items={currentGestion.items}
                  tipo={activeTab}
                  columnasKeys={currentConfig.columnasKeys}
                  columnasLabels={currentConfig.columnasLabels}
                  onEditar={(item) => currentGestion.abrirModal(item)}
                  onEliminar={(id) => currentGestion.eliminarItem(id)}
                  onToggleEstado={(id) => currentGestion.toggleEstado(id)}
                  soloLectura={activeTab === 'pesadas'}
                />
              </div>
            ) : (
              <EmptyState
                mensaje={`No hay ${currentConfig.plural} registrados`}
                icono="📭"
              />
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {activeTab !== 'pesada' && activeTab !== 'pesadas' && activeTab !== 'dashboard' && currentGestion && (
        <ModalForm
          abierto={currentGestion.modal.abierto}
          titulo={
            currentGestion.modal.item
              ? `Editar ${currentConfig.singular}`
              : `Nuevo ${currentConfig.singular}`
          }
          formData={currentGestion.formData}
          onFormChange={currentGestion.handleFormChange}
          onGuardar={currentGestion.guardarItem}
          onCancelar={currentGestion.cerrarModal}
          campos={currentConfig.campos}
          loading={currentGestion.loading}
          error={currentGestion.error}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}