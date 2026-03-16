import React, { useState, useEffect, useRef } from 'react';
import { Printer, X, Loader2 } from 'lucide-react';
import { useThemeContext } from '../context/ThemeContext';

const API_BASE_URL = '';

export default function ReportePesadas({ pesadas, onClose }) {
    const { isDark } = useThemeContext();
    const [guardando, setGuardando] = useState(true);
    const [errorGuardar, setErrorGuardar] = useState(null);
    const [reporte, setReporte] = useState(null);
    const yaGuardado = useRef(false); // ⭐ Flag para evitar dobles guardados

    // Guardar automáticamente al montar (solo UNA vez)
    useEffect(() => {
        if (!yaGuardado.current) {
            yaGuardado.current = true;
            guardarReporte();
        }
    }, []);

    const guardarReporte = async () => {
        try {
            setGuardando(true);
            setErrorGuardar(null);
            const res = await fetch(`${API_BASE_URL}/api/reportes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pesadas })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar reporte');
            setReporte(data.data);
        } catch (e) {
            setErrorGuardar(e.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <ReportePreview
            pesadas={pesadas}
            numeroReporte={reporte?.numero_reporte}
            fechaEmision={reporte?.created_at ? new Date(reporte.created_at).toLocaleString('es-AR') : new Date().toLocaleString('es-AR')}
            guardando={guardando}
            errorGuardar={errorGuardar}
            onClose={onClose}
            isDark={isDark}
        />
    );
}

// ─── Preview reutilizable (usado tanto en ReportePesadas como en historial) ──
export function ReportePreview({ pesadas, numeroReporte, fechaEmision, guardando, errorGuardar, onClose, isDark: isDarkProp }) {
    const ctx = useThemeContext();
    const isDark = isDarkProp !== undefined ? isDarkProp : ctx.isDark;

    const formatP = (v) => v != null
        ? Number(v).toLocaleString('es-AR', { minimumFractionDigits: 0 }) + ' kg'
        : '—';

    const formatF = (v) => v
        ? new Date(v).toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit'
        })
        : '—';

    const totalBruto = pesadas.reduce((acc, p) => acc + (Number(p.bruto) || 0), 0);
    const totalTara = pesadas.reduce((acc, p) => acc + (Number(p.tara) || 0), 0);
    const totalNeto = pesadas.reduce((acc, p) => acc + (Number(p.neto) || 0), 0);

    const handlePrint = () => {
        const nroLabel = numeroReporte
            ? `N° ${String(numeroReporte).padStart(6, '0')}`
            : '';

        const filas = pesadas.map((p, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
        <td style="text-align:center;color:#94a3b8">${i + 1}</td>
        <td style="font-family:monospace;font-weight:700">${p.vehiculo_patente || '—'}</td>
        <td>${formatF(p.fecha_entrada)}</td>
        <td>${formatF(p.fecha_salida)}</td>
        <td>${p.productor || '—'}</td>
        <td>${p.transporte || '—'}</td>
        <td>${p.producto || '—'}</td>
        <td>${p.nro_remito || '—'}</td>
        <td style="font-weight:700;color:#15803d">${formatP(p.bruto)}</td>
        <td style="color:#475569">${formatP(p.tara)}</td>
        <td style="font-weight:800;font-size:14px;color:#0e7490">${formatP(p.neto)}</td>
        <td style="font-size:10px;color:#64748b">${p.balancero_entrada || p.balancero || '—'}</td>
        <td style="font-size:10px;color:#64748b">${p.balancero_salida || '—'}</td>
      </tr>
    `).join('');

        const printWindow = window.open('', '_blank', 'width=1200,height=750');
        printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <title>Reporte de Pesadas ${nroLabel}</title>
        <style>
          * { box-sizing:border-box; margin:0; padding:0; }
          body { font-family:Arial,sans-serif; font-size:11px; color:#111; background:#fff; padding:10mm; }

          .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1e293b; padding-bottom:10px; margin-bottom:14px; }
          .header h1 { font-size:20px; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:#1e293b; }
          .header .meta { text-align:right; font-size:10px; color:#64748b; line-height:1.6; }
          .header .meta strong { font-size:16px; color:#1e293b; display:block; }

          table { width:100%; border-collapse:collapse; font-size:10px; }
          thead tr { background:#1e293b; color:#fff; }
          thead th { padding:7px 5px; text-align:left; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; white-space:nowrap; }
          tbody td { padding:5px; border-bottom:1px solid #e2e8f0; vertical-align:middle; }

          tfoot tr { background:#f1f5f9; border-top:2px solid #1e293b; }
          tfoot td { padding:7px 5px; font-weight:700; }

          .totales-boxes { display:flex; justify-content:flex-end; gap:16px; margin-top:14px; }
          .total-box { text-align:center; border:2px solid #1e293b; border-radius:8px; padding:8px 16px; min-width:110px; }
          .total-box .t-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#64748b; }
          .total-box .t-valor { font-size:18px; font-family:'Courier New',monospace; font-weight:900; margin-top:3px; }
          .total-box.neto .t-valor { color:#0e7490; }
          .total-box.bruto .t-valor { color:#15803d; }

          .firmas { display:grid; grid-template-columns:1fr 1fr 1fr; gap:30px; margin-top:36px; }
          .firma-bloque { text-align:center; }
          .firma-linea { border-top:1px solid #94a3b8; padding-top:5px; }
          .firma-titulo { font-size:10px; font-weight:700; }

          @page { size:A4 landscape; margin:0; }
          @media print { body { padding:8mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Reporte de Pesadas</h1>
            <div style="font-size:10px;color:#64748b;margin-top:4px">Emisión: ${fechaEmision}</div>
          </div>
          <div class="meta">
            ${nroLabel ? `<strong>${nroLabel}</strong>` : ''}
            <div style="margin-top:4px">${pesadas.length} pesada${pesadas.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th><th>Dominio</th><th>Entrada</th><th>Salida</th>
              <th>Productor</th><th>Transporte</th><th>Producto</th><th>Remito</th>
              <th>Bruto</th><th>Tara</th><th>Neto</th><th>Op. Entrada</th><th>Op. Salida</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr>
              <td colspan="8" style="text-align:right;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#475569">Totales</td>
              <td style="color:#15803d">${totalBruto.toLocaleString('es-AR')} kg</td>
              <td style="color:#475569">${totalTara.toLocaleString('es-AR')} kg</td>
              <td style="color:#0e7490;font-size:13px">${totalNeto.toLocaleString('es-AR')} kg</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>

        <div class="totales-boxes">
          <div class="total-box bruto">
            <div class="t-label">Total Bruto</div>
            <div class="t-valor">${totalBruto.toLocaleString('es-AR')} kg</div>
          </div>
          <div class="total-box">
            <div class="t-label">Total Tara</div>
            <div class="t-valor">${totalTara.toLocaleString('es-AR')} kg</div>
          </div>
          <div class="total-box neto">
            <div class="t-label">Total Neto</div>
            <div class="t-valor">${totalNeto.toLocaleString('es-AR')} kg</div>
          </div>
        </div>

        <div class="firmas">
          <div class="firma-bloque"><div class="firma-linea"><p class="firma-titulo">Firma Responsable</p></div></div>
          <div class="firma-bloque"><div class="firma-linea"><p class="firma-titulo">Conformidad</p></div></div>
          <div class="firma-bloque"><div class="firma-linea"><p class="firma-titulo">Sello y Firma</p></div></div>
        </div>
      </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className={`rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                }`}>

                {/* Header */}
                <div className={`sticky top-0 p-4 flex items-center justify-between rounded-t-xl border-b z-10 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold">Reporte de Pesadas</h2>
                            {/* Estado de guardado */}
                            {guardando && (
                                <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    <Loader2 size={12} className="animate-spin" />
                                    Guardando...
                                </span>
                            )}
                            {!guardando && !errorGuardar && numeroReporte && (
                                <span className={`text-xs px-3 py-1 rounded-full font-bold ${isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-50 text-green-700'
                                    }`}>
                                    ✓ Guardado — N° {String(numeroReporte).padStart(6, '0')}
                                </span>
                            )}
                            {!guardando && errorGuardar && (
                                <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-50 text-red-700'
                                    }`}>
                                    ✗ Error al guardar
                                </span>
                            )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {pesadas.length} pesada{pesadas.length !== 1 ? 's' : ''} · {fechaEmision}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all"
                        >
                            <Printer size={18} />
                            Imprimir
                        </button>
                        <button onClick={onClose} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                            }`}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabla preview */}
                <div className="p-4 overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className={isDark ? 'bg-slate-700' : 'bg-slate-800'}>
                                {['#', 'Dominio', 'Entrada', 'Salida', 'Productor', 'Transporte', 'Producto', 'Remito', 'Bruto', 'Tara', 'Neto', 'Op. Entrada', 'Op. Salida'].map(h => (
                                    <th key={h} className="px-3 py-3 text-left text-white font-bold uppercase tracking-wide text-[10px] whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pesadas.map((p, i) => (
                                <tr key={i} className={`border-b transition-colors ${isDark
                                    ? i % 2 === 0 ? 'border-slate-700' : 'bg-slate-700/30 border-slate-700'
                                    : i % 2 === 0 ? 'border-slate-100' : 'bg-slate-50 border-slate-100'
                                    }`}>
                                    <td className={`px-3 py-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{i + 1}</td>
                                    <td className={`px-3 py-2.5 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.vehiculo_patente}</td>
                                    <td className={`px-3 py-2.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatF(p.fecha_entrada)}</td>
                                    <td className={`px-3 py-2.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatF(p.fecha_salida)}</td>
                                    <td className={`px-3 py-2.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{p.productor || '—'}</td>
                                    <td className={`px-3 py-2.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{p.transporte || '—'}</td>
                                    <td className={`px-3 py-2.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{p.producto || '—'}</td>
                                    <td className={`px-3 py-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{p.nro_remito || '—'}</td>
                                    <td className={`px-3 py-2.5 font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>{formatP(p.bruto)}</td>
                                    <td className={`px-3 py-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{formatP(p.tara)}</td>
                                    <td className={`px-3 py-2.5 font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{formatP(p.neto)}</td>
                                    <td className={`px-3 py-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.balancero_entrada || p.balancero || '—'}</td>
                                    <td className={`px-3 py-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{p.balancero_salida || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={`border-t-2 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-300'}`}>
                                <td colSpan={8} className={`px-3 py-3 text-right text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    Totales
                                </td>
                                <td className={`px-3 py-3 font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>{totalBruto.toLocaleString('es-AR')} kg</td>
                                <td className={`px-3 py-3 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{totalTara.toLocaleString('es-AR')} kg</td>
                                <td className={`px-3 py-3 font-bold text-base ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{totalNeto.toLocaleString('es-AR')} kg</td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    </table>

                </div>
            </div>
        </div>
    );
}