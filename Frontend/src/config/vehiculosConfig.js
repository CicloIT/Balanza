export const vehiculosConfig = {
  id: 'vehiculos',
  label: '🚗 Vehículos',
  singular: 'vehículo',
  plural: 'vehículos',
  endpoint: '/api/vehiculos',
  columnasKeys: ['patente', 'tipo_vehiculo', 'transporte_nombre', 'activo'],
  columnasLabels: ['Patente', 'Tipo', 'Transporte', 'Activo'],
  campos: [
    { name: 'patente', label: 'Patente', type: 'text', placeholder: 'ABC-123' },
    { name: 'tipo_vehiculo', label: 'Tipo de Vehículo', type: 'text', placeholder: 'CHASIS' },
    { name: 'transporte_id', label: 'Empresa de Transporte (ID)', type: 'number', placeholder: '1' },
    { name: 'observaciones', label: 'Observaciones', type: 'text', placeholder: 'Notas opcionales' },
  ],
};
