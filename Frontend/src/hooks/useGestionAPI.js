import { useState, useEffect } from 'react';

const API_BASE_URL = '';

export function useGestionAPI(config) {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState({ abierto: false, item: null });
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarItems();
  }, [config.endpoint]);

  const cargarItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${config.endpoint}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const result = await response.json();
      setItems(result.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (item = null) => {
    setModal({ abierto: true, item });
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
    setError(null);
    setSuccess(null);
  };

  const cerrarModal = () => {
    setModal({ abierto: false, item: null });
    setFormData({});
    setError(null);
    setSuccess(null);
  };

  const guardarItem = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const method = modal.item ? 'PUT' : 'POST';
      const url = modal.item 
        ? `${API_BASE_URL}${config.endpoint}/${modal.item.id}`
        : `${API_BASE_URL}${config.endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (modal.item) {
        // Editar
        setItems(items.map(item => 
          item.id === modal.item.id 
            ? result.data
            : item
        ));
        setSuccess('Elemento actualizado correctamente');
      } else {
        // Crear
        setItems([...items, result.data]);
        setSuccess('Elemento creado correctamente');
      }
      
      setTimeout(() => {
        cerrarModal();
      }, 800);
    } catch (err) {
      setError(err.message);
      console.error('Error guardando item:', err);
    } finally {
      setLoading(false);
    }
  };

  const eliminarItem = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${config.endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }

      setItems(items.filter(item => item.id !== id));
      setSuccess('Elemento eliminado correctamente');
    } catch (err) {
      setError(err.message);
      console.error('Error eliminando item:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    setLoading(true);
    setError(null);
    try {
      const nuevoEstado = !item.activo;
      const response = await fetch(`${API_BASE_URL}${config.endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...item, activo: nuevoEstado }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.statusText}`);
      }

      const result = await response.json();
      setItems(items.map(i => i.id === id ? result.data : i));
      setSuccess(`Elemento ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
    } catch (err) {
      setError(err.message);
      console.error('Error cambiando estado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor });
  };

  return {
    items,
    modal,
    formData,
    loading,
    error,
    success,
    abrirModal,
    cerrarModal,
    guardarItem,
    eliminarItem,
    toggleEstado,
    handleFormChange,
  };
}
