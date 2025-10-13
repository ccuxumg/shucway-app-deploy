import React, { useState, useEffect } from 'react';
import '../Inventario.css';
import './Auditoria.css';
import { MdCheckCircle, MdEventNote, MdErrorOutline } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../api/supabaseClient';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Row = { id?: number; name: string; categoria?: string; unidad?: string; sistema?: number; conteo: number | null; diferencia?: number; estado?: string; notas?: string };

type AuditoriaProps = {
  initialSessionId?: string;
  auditorName?: string;
};

const Auditoria: React.FC<AuditoriaProps> = ({ initialSessionId, auditorName }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  

  // Exportar CSV
  const exportCSV = () => {
    const headers = ['Insumo', 'Categoría', 'Unidad', 'Stock del Sistema', 'Conteo Físico', 'Diferencia', 'Estado', 'Notas'];
    // Encerrar cada campo entre comillas dobles y escapar comillas internas
    const csvRows = [headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',')];
    rows.forEach(r => {
      const fields = [
        r.name ?? '',
        r.categoria ?? '',
        r.unidad ?? '',
        (r.sistema ?? '').toString(),
        (r.conteo ?? '').toString(),
        (r.diferencia ?? '').toString(),
        r.estado ?? '',
        r.notas ?? ''
      ];
      csvRows.push(fields.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    });
    // Usar CRLF para compatibilidad con Excel en Windows
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_inventario_${sessionId || 'reporte'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revocar URL para liberar memoria
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // Helper: generar y descargar PDF desde un string HTML (usa html2canvas + jsPDF)
  const generatePdfFromHtml = async (htmlString: string, filename: string) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = htmlString;
    document.body.appendChild(container);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDFMod = await import('jspdf');
      const jsPDF = (jsPDFMod as any).jsPDF;
      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save(filename);
      pushNotification('success', `PDF descargado: ${filename}`);
    } catch (error) {
      console.error('Error generando PDF con html2canvas/jsPDF', error);
      pushNotification('error', 'Error generando PDF.');
      throw error;
    } finally {
      document.body.removeChild(container);
    }
  };

  // Exportar PDF (simple, usando window.print)
  const buildPrintHtml = (title: string, tableHtml: string, subtitle?: string) => {
    const fecha = new Date().toLocaleString();
    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body{font-family: Arial, Helvetica, sans-serif; color:#111; margin:20px}
            .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
            .brand{display:flex;gap:12px;align-items:center}
            .brand img{height:56px}
            h2{margin:0 0 4px 0}
            .meta{font-size:13px;color:#444}
            table{width:100%;border-collapse:collapse;margin-top:12px}
            th,td{padding:8px;border:1px solid #e5e7eb;text-align:left;font-size:13px}
            th{background:#f3f4f6;color:#111}
            tbody tr:nth-child(even){background:#fbfbfb}
            .footer{margin-top:16px;font-size:12px;color:#666}
            @media print{ .no-print{display:none} }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand"><img src="/img/logo.png" alt="logo"/> <div><h2>${title}</h2><div class="meta">${subtitle ?? ''}</div></div></div>
            <div style="text-align:right"><div class="meta">Fecha: ${fecha}</div></div>
          </div>
          ${tableHtml}
          <div class="footer">Generado desde Shucway - Auditoría</div>
        </body>
      </html>`;
  };

  const exportPDF = async () => {
    const headers = ['Insumo', 'Categoría', 'Unidad', 'Stock del Sistema', 'Conteo Físico', 'Diferencia', 'Estado', 'Notas'];
    const headerHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const bodyHtml = `<tbody>${rows.map(r => `<tr><td>${r.name}</td><td>${r.categoria ?? ''}</td><td>${r.unidad ?? ''}</td><td>${r.sistema ?? ''}</td><td>${r.conteo ?? ''}</td><td>${r.diferencia ?? ''}</td><td>${r.estado ?? ''}</td><td>${r.notas ?? ''}</td></tr>`).join('')}</tbody>`;
    const tableHtml = `<table>${headerHtml}${bodyHtml}</table>`;
    const subtitle = `Auditor: ${detectedName} · Sesión: ${sessionId ?? '—'}`;
    const html = buildPrintHtml('Auditoría de Inventario', tableHtml, subtitle);
    setShowExportModal(false);
    try {
      const filename = `auditoria_inventario_${sessionId || 'reporte'}.pdf`;
      await generatePdfFromHtml(html, filename);
    } catch (e) {
      console.error('Export PDF failed', e);
      pushNotification('error', 'No se pudo generar el PDF.');
    }
  };
  // No generar sessionId por defecto: usar únicamente el que venga por props
  const sessionId = initialSessionId ?? undefined;
  const { user } = useAuth();
  const detectedName = user?.user_metadata?.full_name || user?.email || auditorName || '—';
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  // Notificaciones locales (simple)
  const [notification, setNotification] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);

  const pushNotification = (type: 'info' | 'success' | 'error', message: string, autoClose = true) => {
    setNotification({ type, message });
    if (autoClose) setTimeout(() => setNotification(null), 3000);
  };

  // Cargar insumos desde la vista vw_inventario_actual en la BD (extraído para reuso)
  const loadRows = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_inventario_actual')
        .select('id_insumo, insumo, categoria, stock_actual, unidad_medida, estado_stock')
        .order('insumo', { ascending: true })
        .limit(500);
      if (error) {
        const errObj = (error as { message?: string } | null) ?? null;
          const msg = errObj && errObj.message ? errObj.message : String(error);
          console.warn('Error cargando inventario para auditoría:', msg);
        return;
      }
      if (Array.isArray(data)) {
        const mapped: Row[] = (data as Array<{ id_insumo?: number; insumo?: string; categoria?: string; unidad_medida?: string; stock_actual?: number }>).map(r => ({ id: r.id_insumo, name: r.insumo ?? '—', categoria: r.categoria, unidad: r.unidad_medida, sistema: r.stock_actual ?? 0, conteo: null, estado: 'pendiente', notas: '' }));
        setRows(mapped);
      }
    } catch (e) {
      console.error('Excepción cargando inventario:', e);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) loadRows();
    return () => { mounted = false; };
  }, []);

  // Finalizar auditoría: persistir ajuste y detalles en la BD y crear movimientos correspondientes
  const finalizeAudit = async () => {
    console.log('finalizeAudit invoked', { sessionId });
    // Mostrar feedback inmediato para asegurar que el click se procesó
    setNotification({ type: 'info', message: 'Iniciando validación de auditoría...' });
    let effectiveSession = sessionId;
    if (!effectiveSession) {
      // No hay sesión, pero permitimos continuar usando una marca temporal
      pushNotification('info', 'No hay sesión de auditoría asignada. Se usará una sesión temporal para guardar el ajuste.');
      effectiveSession = 'sin_sesion';
    }
    const diffs = rows.filter(r => typeof r.conteo === 'number' && (r.conteo ?? 0) !== (r.sistema ?? 0));
    if (diffs.length === 0) {
      pushNotification('info', 'No hay diferencias para aplicar.');
      return;
    }

    // Solicitar motivo; si el usuario cancela, abortar
    const motivoPrompt = window.prompt('Motivo del ajuste (breve):', 'Ajuste por auditoría');
    if (motivoPrompt === null) {
      pushNotification('info', 'Finalización de auditoría cancelada.');
      return;
    }
    const motivo = motivoPrompt || 'Ajuste por auditoría';

  setIsFinalizing(true);
  pushNotification('info', 'Aplicando ajuste, por favor espere...');
    try {
      // 1) Crear registro de ajuste_inventario
      const ajustePayload = {
        motivo,
        descripcion: `Ajuste generado por auditoría. Sesión: ${effectiveSession}`,
        id_perfil: user?.id ?? null
      };

      type AjusteResp = { id_ajuste?: number } | null;
      const insertRes = await supabase
        .from('ajuste_inventario')
        .insert(ajustePayload)
        .select('id_ajuste')
        .single();

      if (insertRes.error) throw insertRes.error;
      const ajusteData = insertRes.data as AjusteResp | null;
      const idAjuste = ajusteData && ajusteData.id_ajuste ? ajusteData.id_ajuste : null;
  if (!idAjuste) throw new Error('No se obtuvo id del ajuste creado');

      // 2) Preparar detalles y movimientos en bloque
      const detalles = diffs.map(d => ({
        id_ajuste: idAjuste,
        id_insumo: d.id ?? null,
        id_lote: null,
        cantidad_ajustada: (d.conteo ?? 0) - (d.sistema ?? 0),
        costo_unitario: null,
        motivo_detalle: d.notas && d.notas.length > 0 ? d.notas : `Ajuste por auditoría (sesión ${sessionId})`
      }));

      const movimientos = diffs.map(d => {
        const cantidadSigned = (d.conteo ?? 0) - (d.sistema ?? 0);
        const tipo_mov = cantidadSigned < 0 ? 'salida_ajuste' : 'devolucion';
        return {
          id_insumo: d.id ?? null,
          id_lote: null,
          tipo_movimiento: tipo_mov,
          cantidad: Math.abs(cantidadSigned),
          id_perfil: user?.id ?? null,
          id_referencia: idAjuste,
          modulo_origen: 'auditoria',
          descripcion: `Ajuste por auditoría. Sesión: ${sessionId}`
        };
      });

      // 3) Insertar detalles
      const { error: detError } = await supabase.from('detalle_ajuste_inventario').insert(detalles);
      if (detError) throw detError;

      // 4) Insertar movimientos (esto actualizará stock via triggers del servidor)
      const { error: movError } = await supabase.from('movimiento_inventario').insert(movimientos);
      if (movError) {
        // rollback: eliminar detalles e intento de ajuste
        await supabase.from('detalle_ajuste_inventario').delete().eq('id_ajuste', idAjuste);
        await supabase.from('ajuste_inventario').delete().eq('id_ajuste', idAjuste);
        throw movError;
      }

      pushNotification('success', 'Ajuste aplicado correctamente. Generando resumen...');
      // Generar HTML del resumen y descargar como PDF usando jsPDF
      const html = `
            <html>
              <head>
                <title>Resumen Ajuste - Auditoría</title>
                <style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:6px;font-family:Arial;font-size:12px;}th{background:#f4f4f4}</style>
              </head>
              <body>
                <h3>Resumen de Ajuste - Auditoría</h3>
                <p>Sesión: ${sessionId}</p>
                <p>Motivo: ${motivo}</p>
                <table>
                  <thead><tr><th>Insumo</th><th>Stock Sistema</th><th>Conteo</th><th>Diferencia</th></tr></thead>
                  <tbody>
                    ${diffs.map(d => `<tr><td>${d.name}</td><td>${d.sistema ?? ''}</td><td>${d.conteo ?? ''}</td><td>${((d.conteo ?? 0) - (d.sistema ?? 0)).toFixed(2)}</td></tr>`).join('')}
                  </tbody>
                </table>
              </body>
            </html>`;
      try {
        const jsPDFModule = await import('jspdf');
        const jsPDF = (jsPDFModule as any).jsPDF;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        await doc.html(html, {
          html2canvas: { scale: 1 },
          // tipamos como any para evitar implicit any en el callback
          callback: (doc2: any) => {
            const filename = `ajuste_auditoria_${sessionId || 'reporte'}.pdf`;
            try { (doc2 as any).save(filename); pushNotification('success', `Resumen descargado: ${filename}`); } catch (error) { console.warn(error); pushNotification('error', 'No se pudo descargar el PDF.'); }
          }
        });
      } catch (error) {
        console.warn('Error generando PDF con jsPDF', error);
        pushNotification('info', 'No se pudo generar PDF automáticamente; se abrió una vista imprimible.');
        try {
          const summaryWin = window.open('', '_blank');
          if (summaryWin) { summaryWin.document.write(html); summaryWin.document.close(); }
        } catch (e) { console.warn('No se pudo abrir la vista imprimible', e); }
      }
      await loadRows();
    } catch (e) {
      const errObj = e as Error;
      const errMsg = errObj?.message ?? String(e);
      console.error('Error aplicando ajuste de auditoría:', errMsg);
      pushNotification('error', 'Error aplicando ajuste: ' + errMsg);
    } finally {
      setIsFinalizing(false);
    }
  };

  const counted = rows.filter(r => typeof r.conteo === 'number').length;
  const discrepancies = rows.filter(r => typeof r.conteo === 'number' && Math.abs((r.conteo ?? 0) - (r.sistema ?? 0)) > 0).length;

  const handleConteoChange = (index: number, value: string) => {
    const v = value === '' ? null : Number(value);
    setRows(prev => {
      const copy = [...prev];
      const prevRow = copy[index] ?? { id: undefined, name: '—', categoria: undefined, unidad: undefined, sistema: 0, conteo: null, diferencia: undefined, estado: 'pendiente', notas: '' };
      const sistemaVal = typeof prevRow.sistema === 'number' ? prevRow.sistema : 0;
      const diferencia = v === null ? undefined : +(( (v - sistemaVal) ).toFixed(2));
      const estado = v === null ? 'pendiente' : (Math.abs((v - sistemaVal)) > 0 ? 'contado' : 'contado');
      copy[index] = { ...prevRow, conteo: v, diferencia, estado };
      return copy;
    });
  };

  const handleNotasChange = (index: number, value: string) => {
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], notas: value };
      return copy;
    });
  };

  const markNoDiff = () => {
    setRows(prev => prev.map(r => ({ ...r, conteo: r.sistema ?? null, diferencia: 0, estado: 'contado' })));
    pushNotification('info', 'Se marcaron todos los ítems como sin diferencias.');
  };

  const resetConteo = () => {
    setRows(prev => prev.map(r => ({ ...r, conteo: null, diferencia: undefined, estado: 'pendiente' })));
    pushNotification('info', 'Conteos reiniciados.');
  };

  return (
    <div className="inv-list">
      <h3>AUDITORÍA DE INVENTARIO (CONTEO FÍSICO)</h3>

      <div className="auditoria-header">
        {/* Notification banner */}
        {notification && (
          <div style={{ position: 'fixed', right: 18, top: 70, zIndex: 99999 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 999, background: '#fff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 6px 18px rgba(16,24,40,0.06)', minWidth: 220, maxWidth: 340 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: notification.type === 'success' ? '#16a34a' : (notification.type === 'error' ? '#dc2626' : '#2563eb') }} />
              <div style={{ fontSize: 13, color: '#111', flex: 1 }}>{notification.message}</div>
              <button aria-label="Cerrar" onClick={() => setNotification(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 14, padding: '6px 8px', cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        )}
        <div className="auditoria-top">
          <div className="auditoria-cards">
          <div className="audit-card audit-success">
            <div>
              <div className="small">Sesión de Auditoría</div>
              <div className="big">{sessionId ?? <span className="text-sm text-gray-500">Sin sesión asignada</span>}</div>
            </div>
            <div className="audit-icon" aria-hidden><MdCheckCircle size={20} /></div>
          </div>

          <div className="audit-card audit-count">
            <div>
              <div className="small">Items Contados</div>
              <div className="big">{counted}/{rows.length}</div>
            </div>
            <div className="audit-icon" aria-hidden><MdEventNote size={20} /></div>
          </div>

          <div className="audit-card audit-danger">
            <div>
              <div className="small">Discrepancias</div>
              <div className="big">{discrepancies}</div>
            </div>
            <div className="audit-icon" aria-hidden><MdErrorOutline size={20} /></div>
          </div>

              <div className="audit-card audit-user">
            <div>
              <div className="small">Auditor</div>
              <div className="big">{detectedName}</div>
            </div>
            <div className="audit-icon" aria-hidden><FaUserCircle size={20} /></div>
          </div>
          </div>
          <div className="auditoria-actions-wrapper">
        <div className="auditoria-actions">
          <button className="btn primary" disabled={isFinalizing} onClick={finalizeAudit}>{isFinalizing ? 'Aplicando...' : 'Finalizar Auditoría'}</button>
              <button className="btn secondary" onClick={markNoDiff}>Marcar Sin Diferencias</button>
          <button className="btn outline" onClick={() => setShowExportModal(true)}>Exportar Resultados</button>
      {/* Mini modal de exportación */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 280, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <h4 style={{ marginBottom: 16 }}>Exportar Reporte</h4>
            <button className="btn primary" style={{ marginBottom: 8, width: '100%' }} onClick={exportCSV}>Descargar CSV</button>
            <button className="btn secondary" style={{ marginBottom: 8, width: '100%' }} onClick={exportPDF}>Descargar PDF</button>
            <button className="btn ghost" style={{ width: '100%' }} onClick={() => setShowExportModal(false)}>Cancelar</button>
          </div>
        </div>
      )}
              <button className="btn ghost" onClick={resetConteo}>Reiniciar Conteo</button>
            </div>
          </div>
        </div>
      </div>

      <div className="auditoria-search" style={{ marginTop: 12, marginBottom: 8 }}>
        <input placeholder="Buscar insumo por nombre..." className="w-full p-2 rounded border" />
      </div>

      <div className="auditoria-table">
        <table className="inv-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Categoría</th>
              <th>Unidad</th>
              <th>Stock del Sistema</th>
              <th>Conteo Físico</th>
              <th>Diferencia</th>
              <th>Estado</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td>{r.categoria}</td>
                <td>{r.unidad}</td>
                <td>{r.sistema}</td>
                <td>
                  <input
                    type="number"
                    value={r.conteo ?? ''}
                    onChange={(e) => handleConteoChange(i, e.target.value)}
                    className={`p-1 border rounded w-28 ${typeof r.conteo === 'number' ? 'counted' : ''}`}
                  />
                </td>
                <td>
                  <span className={`diff-cell ${typeof r.diferencia === 'number' ? (r.diferencia > 0 ? 'diff-positive' : (r.diferencia < 0 ? 'diff-negative' : 'diff-zero')) : 'diff-zero'}`}>
                    {typeof r.diferencia === 'number' ? (r.diferencia > 0 ? (`+${r.diferencia.toFixed(2)}`) : r.diferencia.toFixed(2)) : ''}
                  </span>
                </td>
                <td>
                  <span className={`badge ${r.estado === 'contado' ? 'badge-success' : 'badge-pending'}`}>{r.estado}</span>
                </td>
                <td><input className="p-1 border rounded w-full" placeholder="Observaciones" value={r.notas} onChange={(e) => handleNotasChange(i, e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Auditoria;