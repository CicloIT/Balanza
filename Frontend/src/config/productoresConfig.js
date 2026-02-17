export const productoresConfig = {
  id: 'productores',
  label: '🏭 Productores',
  singular: 'productor',
  plural: 'productores',
  endpoint: '/api/productores',
  columnasKeys: ['codigo', 'nombre', 'cuit', 'activo'],
  columnasLabels: ['Código', 'Nombre', 'CUIT', 'Activo'],
  campos: [
    { name: 'codigo', label: 'Código', type: 'text', placeholder: 'PROD001' },
    { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Productor ABC' },
    { name: 'cuit', label: 'CUIT', type: 'text', placeholder: '20123456789' },
  ],
};