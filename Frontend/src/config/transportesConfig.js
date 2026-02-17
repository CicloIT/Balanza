export const transportesConfig = {
  id: 'transportes',
  label: '🚛 Transportes',
  singular: 'transporte',
  plural: 'transportes',
  endpoint: '/api/transportes',
  columnasKeys: ['codigo', 'nombre', 'cuit', 'contacto', 'telefono', 'activo'],
  columnasLabels: ['Código', 'Nombre', 'CUIT', 'Contacto', 'Teléfono', 'Activo'],
  campos: [
    { name: 'codigo', label: 'Código', type: 'text', placeholder: 'TRANS001' },
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Transportes ABC' },
    { name: 'cuit', label: 'CUIT', type: 'text', placeholder: '30987654321' },
    { name: 'contacto', label: 'Contacto', type: 'text', placeholder: 'Gerente' },
    { name: 'telefono', label: 'Teléfono', type: 'text', placeholder: '1122334455' },
  ],
};