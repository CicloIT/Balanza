export const choferesConfig = {
  id: 'choferes',
  label: '🚗 Choferes',
  singular: 'chofer',
  plural: 'choferes',
  endpoint: '/api/choferes',
  columnasKeys: ['codigo', 'apellido_nombre', 'nro_documento', 'tipo_documento', 'nacionalidad', 'activo'],
  columnasLabels: ['Código', 'Nombre', 'Documento', 'Tipo Doc.', 'Nacionalidad', 'Activo'],
  campos: [
    { name: 'codigo', label: 'Código', type: 'text', placeholder: 'CHO001' },
    { name: 'apellido_nombre', label: 'Nombre Completo', type: 'text', placeholder: 'García Juan' },
    { name: 'tipo_documento', label: 'Tipo Documento', type: 'text', placeholder: 'DNI' },
    { name: 'nro_documento', label: 'Número Documento', type: 'text', placeholder: '12345678' },
    { name: 'nacionalidad', label: 'Nacionalidad', type: 'text', placeholder: 'Argentina' },
  ],
};