import { useState } from 'react';

export function useGestion(datosIniciales) {
  const [items, setItems] = useState(datosIniciales);
  const [modal, setModal] = useState({ abierto: false, item: null });
  const [formData, setFormData] = useState({});

  const abrirModal = (item = null) => {
    setModal({ abierto: true, item });
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
  };

  const cerrarModal = () => {
    setModal({ abierto: false, item: null });
    setFormData({});
  };

  const guardarItem = () => {
    if (modal.item) {
      // Editar
      setItems(items.map(item => 
        item.id === modal.item.id 
          ? { ...formData, id: modal.item.id } 
          : item
      ));
    } else {
      // Crear
      setItems([...items, { 
        ...formData, 
        id: Date.now(), 
        estado: 'activo' 
      }]);
    }
    cerrarModal();
  };

  const eliminarItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const toggleEstado = (id) => {
    setItems(items.map(item =>
      item.id === id 
        ? { ...item, estado: item.estado === 'activo' ? 'inactivo' : 'activo' }
        : item
    ));
  };

  const handleFormChange = (campo, valor) => {
    setFormData({ ...formData, [campo]: valor });
  };

  return {
    items,
    modal,
    formData,
    abrirModal,
    cerrarModal,
    guardarItem,
    eliminarItem,
    toggleEstado,
    handleFormChange,
  };
}