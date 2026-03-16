import React from 'react';
import { Printer, X } from 'lucide-react';

export default function CartaPortePreview({ formData, balanzaPeso, pesadaData, onClose }) {

  const fechaActual = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const data = pesadaData
    ? {
      transporte_id: pesadaData.transporte,
      chofer_id: pesadaData.chofer,
      vehiculo_patente: pesadaData.vehiculo_patente,
      productor_id: pesadaData.productor,
      producto_id: pesadaData.producto,
      nro_remito: pesadaData.nro_remito,
      peso: pesadaData.neto || pesadaData.bruto,
      balancero: pesadaData.balancero,
      fecha: pesadaData.fecha_salida || pesadaData.fecha_entrada
    }
    : {
      ...formData,
      fecha: fechaActual
    };

  const fechaFormateada = pesadaData
    ? new Date(data.fecha).toLocaleString('es-AR')
    : data.fecha;

  const pesoLabel = pesadaData
    ? (pesadaData.neto ? 'PESO NETO' : 'PESO BRUTO')
    : 'PESO INDICADO';

  const pesoPrincipal = data.peso
    ? `${Number(data.peso).toLocaleString('es-AR')} kg`
    : '---';

  const pesoBruto = pesadaData?.tara
    ? `${Number(pesadaData.bruto).toLocaleString('es-AR')} kg`
    : null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Carta Porte</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: Arial, sans-serif;
            font-size: 13px;
            color: #111;
            background: white;
            padding: 20mm 15mm;
          }

          .header {
            text-align: center;
            border-bottom: 3px solid #111;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 900;
            letter-spacing: 6px;
            text-transform: uppercase;
          }
          .header .subtitulo {
            font-size: 11px;
            font-weight: 600;
            color: #555;
            margin-top: 4px;
          }
          .header .fecha {
            font-size: 11px;
            color: #777;
            margin-top: 3px;
          }

          .datos-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0 40px;
            margin-bottom: 20px;
          }
          .seccion h3 {
            font-size: 12px;
            font-weight: 800;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .campo { margin-bottom: 10px; }
          .campo .label {
            font-size: 10px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .campo .valor {
            font-size: 14px;
            font-family: 'Courier New', monospace;
            margin-top: 2px;
          }

          .pesaje-box {
            border: 2px solid #111;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 20px;
          }
          .pesaje-box h3 {
            text-align: center;
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 14px;
          }
          .pesaje-grid {
            display: grid;
            grid-template-columns: ${pesoBruto ? '1fr 1fr' : '1fr'};
            gap: 12px;
          }
          .peso-celda {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
          }
          .peso-celda .peso-label {
            font-size: 10px;
            font-weight: 700;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }
          .peso-celda .peso-valor {
            font-size: 32px;
            font-family: 'Courier New', monospace;
            font-weight: 900;
          }

          .firmas {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 50px;
          }
          .firma-bloque { text-align: center; }
          .firma-linea {
            border-top: 1px solid #888;
            padding-top: 6px;
            width: 80%;
            margin: 0 auto;
          }
          .firma-titulo { font-size: 12px; font-weight: 700; }
          .firma-nombre { font-size: 11px; color: #666; margin-top: 3px; }

          @page { size: A4 portrait; margin: 0; }
          @media print { body { padding: 15mm; } }
        </style>
      </head>
      <body>

        <div class="header">
          <h1>Carta Porte</h1>
          <p class="subtitulo">DOCUMENTO NO VÁLIDO COMO FACTURA</p>
          <p class="fecha">Fecha: ${fechaFormateada}</p>
        </div>

        <div class="datos-grid">
          <div class="seccion">
            <h3>Datos del Transporte</h3>
            <div class="campo">
              <div class="label">Transporte / Empresa</div>
              <div class="valor">${data.transporte_id || 'N/A'}</div>
            </div>
            <div class="campo">
              <div class="label">Chofer</div>
              <div class="valor">${data.chofer_id || 'N/A'}</div>
            </div>
            <div class="campo">
              <div class="label">Vehículo (Patente)</div>
              <div class="valor">${data.vehiculo_patente || 'N/A'}</div>
            </div>
          </div>

          <div class="seccion">
            <h3>Datos de la Carga</h3>
            <div class="campo">
              <div class="label">Productor / Origen</div>
              <div class="valor">${data.productor_id || 'N/A'}</div>
            </div>
            <div class="campo">
              <div class="label">Producto</div>
              <div class="valor">${data.producto_id || 'N/A'}</div>
            </div>
            <div class="campo">
              <div class="label">Nro Remito Asoc.</div>
              <div class="valor">${data.nro_remito || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="pesaje-box">
          <h3>Detalle de Pesaje</h3>
          <div class="pesaje-grid">
            <div class="peso-celda">
              <div class="peso-label">${pesoLabel}</div>
              <div class="peso-valor">${pesoPrincipal}</div>
            </div>
            ${pesoBruto ? `
            <div class="peso-celda">
              <div class="peso-label">PESO BRUTO</div>
              <div class="peso-valor">${pesoBruto}</div>
            </div>` : ''}
          </div>
        </div>

        <div class="firmas">
          <div class="firma-bloque">
            <div class="firma-linea">
              <p class="firma-titulo">Firma y Aclaración Chofer</p>
            </div>
          </div>
          <div class="firma-bloque">
            <div class="firma-linea">
              <p class="firma-titulo">Firma y Aclaración Balancero</p>
              ${data.balancero ? `<p class="firma-nombre">${data.balancero}</p>` : ''}
            </div>
          </div>
        </div>

      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col relative">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Vista Previa Carta Porte
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
            >
              <Printer size={18} />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview en el modal */}
        <div className="p-8">
          <div className="text-center mb-6 pb-4 border-b-2 border-slate-800">
            <h1 className="text-3xl font-black uppercase tracking-widest mb-1">CARTA PORTE</h1>
            <p className="text-sm font-semibold text-slate-600">DOCUMENTO NO VÁLIDO COMO FACTURA</p>
            <p className="text-xs text-slate-500 mt-1">Fecha: {fechaFormateada}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-4 mb-6 text-sm">
            <div className="space-y-3">
              <h3 className="text-base font-bold border-b border-slate-300 pb-1">Datos del Transporte</h3>
              <div>
                <span className="font-bold text-slate-500 text-xs uppercase">Transporte / Empresa</span>
                <p className="font-mono mt-0.5">{data.transporte_id || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 text-xs uppercase">Chofer</span>
                <p className="font-mono mt-0.5">{data.chofer_id || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 text-xs uppercase">Vehículo (Patente)</span>
                <p className="font-mono mt-0.5">{data.vehiculo_patente || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-bold border-b border-slate-300 pb-1">Datos de la Carga</h3>
              <div>
                <span className="font-bold text-slate-500 text-xs uppercase">Productor / Origen</span>
                <p className="font-mono mt-0.5">{data.productor_id || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 text-xs uppercase">Producto</span>
                <p className="font-mono mt-0.5">{data.producto_id || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-500 text-xs uppercase">Nro Remito Asoc.</span>
                <p className="font-mono mt-0.5">{data.nro_remito || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="border-2 border-slate-800 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-black text-center mb-3 uppercase">Detalle de Pesaje</h3>
            <div className={`grid gap-4 text-center ${pesoBruto ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="block text-xs font-bold text-slate-500 mb-1 uppercase">{pesoLabel}</span>
                <span className="text-3xl font-mono font-black">{pesoPrincipal}</span>
              </div>
              {pesoBruto && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="block text-xs font-bold text-slate-500 mb-1 uppercase">Peso Bruto</span>
                  <span className="text-3xl font-mono font-black">{pesoBruto}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 text-center text-sm mt-10 pt-10">
            <div>
              <div className="border-t border-slate-400 pt-2 w-3/4 mx-auto">
                <p className="font-bold">Firma y Aclaración Chofer</p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-2 w-3/4 mx-auto">
                <p className="font-bold">Firma y Aclaración Balancero</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}