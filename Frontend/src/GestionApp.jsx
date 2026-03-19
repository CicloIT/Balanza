import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import ActionBar from './components/ActionBar';
import TablaItems from './components/TablaItems';
import ModalForm from './components/ModalForm';
import EmptyState from './components/EmptyState';
import PesadaForm from './components/PesadaForm';
import { useGestionAPI } from './hooks/useGestionAPI';
import { usePesadasInfinite } from './hooks/usePesadasInfinite';
import { useThemeContext } from './context/ThemeContext';
import { usePermissions } from './hooks/usePermissions';
import { choferesConfig } from './config/choferesConfig';
import { productoresConfig } from './config/productoresConfig';
import { productosConfig } from './config/productosConfig';
import { transportesConfig } from './config/transportesConfig';
import { provinciasConfig } from './config/provinciasConfig';
import { localidadesConfig } from './config/localidadesConfig';
import { vehiculosConfig } from './config/vehiculosConfig';
import { pesadasConfig } from './config/pesadasConfig';
import Dashboard from './components/Dashboard';
import ReportePesadas from './components/ReportePesadas';
import ReportesHistorial from './components/ReportesHistorial';
import Guard from './components/Guard';
import ProtectedRoute from './components/ProtectedRoute';

export default function GestionApp() {
  const { isDark } = useThemeContext();
  const { hasModuleAccess, canEditModule, isAdmin, PERMISSIONS, MODULES } = usePermissions();

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

  // Determinar el tab inicial según los permisos del usuario
  const getInitialTab = () => {
    if (hasModuleAccess(MODULES.DASHBOARD)) return MODULES.DASHBOARD;
    if (hasModuleAccess(MODULES.PESADA)) return MODULES.PESADA;
    if (hasModuleAccess(MODULES.PESADAS)) return MODULES.PESADAS;
    // Buscar el primer módulo disponible
    const availableModules = [
      MODULES.CHOFERES, 
      MODULES.PRODUCTORES, 
      MODULES.PRODUCTOS, 
      MODULES.TRANSPORTES, 
      MODULES.VEHICULOS, 
      MODULES.PROVINCIAS, 
      MODULES.LOCALIDADES
    ];
    for (const module of availableModules) {
      if (hasModuleAccess(module)) return module;
    }
    return MODULES.DASHBOARD;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const choferes = useGestionAPI(choferesConfig, hasModuleAccess(MODULES.CHOFERES));
  const productores = useGestionAPI(productoresConfig, hasModuleAccess(MODULES.PRODUCTORES));
  const productos = useGestionAPI(productosConfig, hasModuleAccess(MODULES.PRODUCTOS));
  const transportes = useGestionAPI(transportesConfig, hasModuleAccess(MODULES.TRANSPORTES));
  const provincias = useGestionAPI(provinciasConfig, canEditModule(MODULES.PROVINCIAS));
  const localidades = useGestionAPI(localidadesConfig, canEditModule(MODULES.LOCALIDADES));
  const vehiculos = useGestionAPI(vehiculosConfig, hasModuleAccess(MODULES.VEHICULOS));
  const pesadas = usePesadasInfinite(activeTab === MODULES.PESADAS);

  const [pesadasReporte, setPesadasReporte] = useState(null);

  const handleSubirPDF = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!window.confirm(`¿Subir Carta de Porte para la operación de pesaje?`)) {
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('archivo', file);
      
      const storedUser = JSON.parse(localStorage.getItem('balanza_user') || '{}');
      const headers = {};
      if (storedUser.id) headers['x-user-id'] = storedUser.id.toString();
      if (storedUser.username) headers['x-username'] = storedUser.username;

      const url = `/api/pesadas/operacion/${id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: formData
      });
      
      if (!response.ok) throw new Error('Error al subir el archivo');
      
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Error subiendo el PDF');
    }
  };

  const gestionMap = {
    choferes, productores, productos, transportes,
    provincias, localidades, vehiculos, pesadas,
  };

  const currentGestion = gestionMap[activeTab];
  const currentConfig = configs[activeTab];

  // Tabs filtrados según permisos del usuario
  const tabs = useMemo(() => {
    const allTabs = [
      { id: MODULES.DASHBOARD, label: 'Dashboard',     count: null },
      { id: MODULES.CHOFERES, label: choferesConfig.label, count: choferes.items.length },
      { id: MODULES.PRODUCTORES, label: productoresConfig.label, count: productores.items.length },
      { id: MODULES.PRODUCTOS, label: productosConfig.label, count: productos.items.length },
      { id: MODULES.TRANSPORTES, label: transportesConfig.label, count: transportes.items.length },
      { id: MODULES.PROVINCIAS, label: provinciasConfig.label, count: provincias.items.length },
      { id: MODULES.LOCALIDADES, label: localidadesConfig.label, count: localidades.items.length },
      { id: MODULES.VEHICULOS, label: vehiculosConfig.label, count: vehiculos.items.length },
      { id: MODULES.PESADA, label: 'Nueva Pesada',    count: null },
      { id: MODULES.PESADAS, label: pesadasConfig.label, count: pesadas.items.length },
      { id: MODULES.REPORTES, label: 'Reportes',       count: null },
    ];

    return allTabs.filter(tab => {
      // Siempre mostrar Dashboard, Nueva Pesada, Pesadas y Reportes si tienen acceso base
      if ([MODULES.DASHBOARD, MODULES.PESADA, MODULES.PESADAS, MODULES.REPORTES].includes(tab.id)) {
        return hasModuleAccess(tab.id);
      }
      
      // Para los demás (Maestros), solo mostrar si tiene permiso de escritura/edición
      // así cumplimos con "solo ver lo que puedo hacer"
      return canEditModule(tab.id);
    });
  }, [
    choferes.items.length,
    productores.items.length,
    productos.items.length,
    transportes.items.length,
    provincias.items.length,
    localidades.items.length,
    vehiculos.items.length,
    pesadas.items.length,
    hasModuleAccess,
    MODULES
  ]);

  // Verificar si el usuario puede editar el módulo actual
  const canEditCurrentModule = canEditModule(activeTab);

  // Tabs que no usan el layout genérico de tabla
  const tabsEspeciales = [MODULES.PESADA, MODULES.DASHBOARD, MODULES.REPORTES];

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

      <div className="relative z-50">
        <Header activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {!tabsEspeciales.includes(activeTab) && (
          <>
            <AlertBox type="error" message={currentGestion?.error} />
            <AlertBox type="success" message={currentGestion?.success} />
          </>
        )}

        {/* Tabs especiales */}
        {activeTab === MODULES.PESADA && (
          <ProtectedRoute permissions={PERMISSIONS.PESAJE_CREATE}>
            <PesadaForm
              transportes={transportes.items}
              choferes={choferes.items}
              productos={productos.items}
              productores={productores.items}
            />
          </ProtectedRoute>
        )}

        {activeTab === MODULES.DASHBOARD && (
          <ProtectedRoute permissions={PERMISSIONS.DASHBOARD_VIEW}>
            <Dashboard />
          </ProtectedRoute>
        )}

        {activeTab === MODULES.REPORTES && (
          <ProtectedRoute permissions={PERMISSIONS.REPORTES_VIEW}>
            <ReportesHistorial />
          </ProtectedRoute>
        )}

        {/* Tabs con tabla genérica */}
        {!tabsEspeciales.includes(activeTab) && currentConfig && (
          <ProtectedRoute permissions={`${activeTab === 'pesadas' ? 'pesaje' : activeTab}:view`}>
            <div className={`backdrop-blur-xl transition-colors duration-300 rounded-2xl shadow-2xl overflow-hidden ${isDark
              ? 'bg-white/10 border border-white/20'
              : 'bg-white/70 border border-slate-200'
              }`}>
              <div className="h-1 bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500"></div>

              <ActionBar
                titulo={currentConfig.plural}
                count={currentGestion.items.length}
                onAgregar={() => currentGestion.abrirModal()}
                loading={currentGestion.loading}
                permission={`${activeTab === 'pesadas' ? 'pesaje' : activeTab}:create`}
                soloLectura={activeTab === 'pesadas'}
              />

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
                    onSubirPDF={handleSubirPDF}
                    onGenerarReporte={(items) => setPesadasReporte(items)}
                    soloLectura={activeTab === 'pesadas'}
                    hasMore={currentGestion.hasMore}
                    loadMore={currentGestion.loadMore}
                    loadingMore={currentGestion.loadingMore}
                  />
                </div>
              ) : (
                <EmptyState
                  mensaje={`No hay ${currentConfig.plural} registrados`}
                  icono="📭"
                />
              )}
            </div>
          </ProtectedRoute>
        )}
      </div>

      {/* Modal formulario */}
      {!tabsEspeciales.includes(activeTab) && activeTab !== 'pesadas' && currentGestion && (
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

      {/* Reporte de múltiples pesadas — se guarda automáticamente */}
      {pesadasReporte && (
        <ReportePesadas
          pesadas={pesadasReporte}
          onClose={() => setPesadasReporte(null)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}