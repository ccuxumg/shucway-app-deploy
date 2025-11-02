import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../api/supabaseClient';

type Movimiento = {
  id_movimiento?: number;
  fecha_movimiento?: string;
  clase?: string;
  tipo_movimiento?: string;
  id_lote?: number | string | null;
  cantidad?: number | null;
  costo_unitario_real?: number | null;
  costo_total?: number | null;
};

export default function Kardex({ id_insumo, onClose }: { id_insumo: number | string; onClose?: () => void }) {
  const [rows, setRows] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Manejar id_insumo nulo o no numérico: intentar pasarlo como string si Number() es NaN
        const idNum = Number(id_insumo);
        const { data, error } = await supabase.rpc('fn_kardex_insumo', {
          p_id_insumo: idNum,
          p_fecha_desde: null,
          p_fecha_hasta: null,
        });
        if (!mounted) return;
        if (error) throw error;
        setRows(Array.isArray(data) ? data as Movimiento[] : []);
      } catch (e: unknown) {
        let msg = '';
        if (e instanceof Error) msg = e.message;
        else if (typeof e === 'object' && e !== null) msg = JSON.stringify(e);
        else msg = String(e);
        console.error('Kardex load error:', msg);
        // Si es un error de permisos, dar pista
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('policy')) {
          setError('Error de permisos leyendo kardex. Verifica políticas RLS y la sesión actual.');
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id_insumo]);

  // Calcular saldo acumulado simple (iterativo por fecha)
  type RowSaldo = Movimiento & { entrada?: number | null; salida?: number | null; saldo?: number };
  const rowsWithSaldo = React.useMemo(() => {
    let saldo = 0;
    return rows.map((r): RowSaldo => {
      const t = String(r.tipo_movimiento ?? '').toLowerCase();
      const ent = t.includes('compra') || t.includes('in') || t.includes('entrada') ? Number(r.cantidad ?? 0) : 0;
      const sal = t.includes('venta') || t.includes('out') || t.includes('salida') ? Number(r.cantidad ?? 0) : 0;
      saldo = saldo + ent - sal;
      return { ...r, entrada: ent || null, salida: sal || null, saldo } as RowSaldo;
    });
  }, [rows]);

  return (
    <div className="w-full bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Historial de Movimientos (Kárdex)</h4>
        <div className="flex items-center gap-2">
          {onClose && <button className="text-sm px-3 py-1 rounded border" onClick={onClose}>Cerrar</button>}
        </div>
      </div>
      {loading && <div className="text-sm text-gray-500">Cargando movimientos...</div>}
      {error && <div className="text-sm text-red-600">Error: {error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto max-h-[52vh] md:max-h-[56vh]">
          <table className="w-full text-sm table-auto">
            <thead className="text-left text-xs text-gray-500">
              <tr>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Clase</th>
                <th className="px-2 py-2">Tipo</th>
                <th className="px-2 py-2">Lote</th>
                <th className="px-2 py-2 text-right">Entrada</th>
                <th className="px-2 py-2 text-right">Salida</th>
                <th className="px-2 py-2 text-right">Saldo</th>
                <th className="px-2 py-2 text-right">Costo</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithSaldo.map((r) => (
                <tr key={r.id_movimiento} className="border-t">
                  <td className="px-2 py-2">{r.fecha_movimiento ? new Date(r.fecha_movimiento).toLocaleString() : '-'}</td>
                  <td className="px-2 py-2">{r.clase ?? r.tipo_movimiento}</td>
                  <td className="px-2 py-2">{r.tipo_movimiento}</td>
                  <td className="px-2 py-2">{r.id_lote ?? '-'}</td>
                  <td className="px-2 py-2 text-right">{r.entrada ?? '-'}</td>
                  <td className="px-2 py-2 text-right">{r.salida ?? '-'}</td>
                  <td className="px-2 py-2 text-right font-medium">{r.saldo ?? '-'}</td>
                  <td className="px-2 py-2 text-right">{r.costo_unitario_real != null ? Number(r.costo_unitario_real).toFixed(2) : '-'}</td>
                </tr>
              ))}
              {rowsWithSaldo.length === 0 && (
                <tr><td colSpan={8} className="px-2 py-4 text-sm text-gray-500">No hay movimientos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
