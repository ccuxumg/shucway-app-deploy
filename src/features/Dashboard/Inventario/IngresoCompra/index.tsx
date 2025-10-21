import React, { useEffect, useMemo, useState } from "react";
import { PiEyeBold, PiTrashBold, PiPencilSimpleBold } from "react-icons/pi";
import { MdClose } from "react-icons/md";
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from "../../../../api/supabaseClient";

type Orden = {
  id_orden: string;
  numero_orden: string | null;
  fecha: string | null;
  id_proveedor?: string | null;
  proveedor?: string | null;
  total?: number;
  estado?: string | null;
};

type ColumnMeta = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  character_maximum_length: number | null;
};

type ItemLine = {
  id_insumo: number | string;
  nombre: string;
  unidad?: string;
  precio?: number;
  cantidad: number;
  subtotal: number;
};

export default function IngresoCompra(): JSX.Element {
  const [rows, setRows] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [providers, setProviders] = useState<Array<Record<string, unknown>>>([]);
  const [providerQ, setProviderQ] = useState<string>('');
  const [providerActivoFilter, setProviderActivoFilter] = useState<string>('all');
  const [providerPreferidoFilter, setProviderPreferidoFilter] = useState<string>('all');
  const [providerShowCount, setProviderShowCount] = useState<number>(3);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Proveedor - creación / edición UI
  const [openProvDrawer, setOpenProvDrawer] = useState(false);
  const [provDetail, setProvDetail] = useState<Record<string, unknown> | null>(null);
  const [provName, setProvName] = useState<string>('');
  const [provContacto, setProvContacto] = useState<string>('');
  const [provTelefono, setProvTelefono] = useState<string>('');
  const [provCorreo, setProvCorreo] = useState<string>('');
  const [provDireccion, setProvDireccion] = useState<string>('');
  const [provActivo, setProvActivo] = useState<boolean>(true);
  const [provPreferido, setProvPreferido] = useState<boolean>(false);
  const [provDiasEntrega, setProvDiasEntrega] = useState<string>('');
  const [provTiempoEntrega, setProvTiempoEntrega] = useState<number | undefined>(undefined);
  const [provSaving, setProvSaving] = useState(false);
  const [provSaveMessage, setProvSaveMessage] = useState<string | null>(null);
  const [provReadOnly, setProvReadOnly] = useState<boolean>(false);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [detail, setDetail] = useState<Orden | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(false);

  const [catalogo, setCatalogo] = useState<Array<Record<string, unknown>>>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | undefined>(undefined);
  const [lines, setLines] = useState<ItemLine[]>([]);
  const [selectedInsumoId, setSelectedInsumoId] = useState<string | undefined>(undefined);
  const [cantidadToAdd, setCantidadToAdd] = useState<number>(1);

  const loadCatalog = async (providerId?: string | undefined) => {
    try {
      let q = supabase.from('insumo').select('id_insumo,nombre,unidad_medida,costo_promedio,imagen_url,id_proveedor_principal').order('nombre', { ascending: true }).limit(1000);
      if (providerId) {
        const pid = Number(providerId);
        if (Number.isFinite(pid)) q = q.eq('id_proveedor_principal', pid);
      }
      const { data: items, error: itemsErr } = await q;
      if (itemsErr) {
        console.warn('catalogo load error', itemsErr);
        setCatalogo([]);
      } else {
        setCatalogo(items ?? []);
      }
    } catch (err) {
      console.warn('catalogo load failed', err);
      setCatalogo([]);
    }
  };

  const getInsertSelect = (): string => {
    const desired = ['id_orden', 'numero_orden', 'fecha', 'id_proveedor', 'total', 'estado'];
    try {
      const available = Array.isArray(columns) ? columns.map(c => c.column_name) : [];
      const cols = desired.filter(d => available.includes(d));
      if (cols.length === 0) return 'id_orden';
      return cols.join(',');
    } catch {
      return 'id_orden,numero_orden,id_proveedor,total,estado';
    }
  };

  useEffect(() => {
    loadCatalog(selectedProviderId);
  }, [selectedProviderId]);

  const total = useMemo(() => lines.reduce((s, l) => s + (Number(l.subtotal) || 0), 0), [lines]);

  const getVal = (obj: unknown, key: string): unknown => (obj as Record<string, unknown>)[key];
  const toStr = (v: unknown): string | null => (v == null ? null : String(v));
  const toNum = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    const n = Number(String(v));
    return Number.isFinite(n) ? n : undefined;
  };

  const normalizePayload = (raw: Record<string, unknown>): Record<string, unknown> => {
    const p: Record<string, unknown> = { ...raw };
    if (Array.isArray(columns)) {
      for (const c of columns) {
        const name = c.column_name;
        const val = p[name];
        if (val == null) continue;
        const dtype = String(c.data_type).toLowerCase();
        if (dtype.includes('int') || dtype.includes('numeric') || dtype.includes('double')) {
          const n = toNum(val);
          p[name] = Number.isFinite(n as number) ? n : null;
        }
      }
    }
    if (p['id_proveedor'] != null) {
      const n = toNum(p['id_proveedor']);
      p['id_proveedor'] = Number.isFinite(n as number) ? n : null;
    }
  const maybeTotal = toNum(p['total']);
  p['total'] = Number.isFinite(maybeTotal as number) ? maybeTotal : (Number(total) || 0);
    const rawLineas = p['lineas'];
    if (rawLineas == null) {
      p['lineas'] = lines.length > 0 ? lines : null;
    } else if (typeof rawLineas === 'string') {
      try { p['lineas'] = JSON.parse(rawLineas); } catch { p['lineas'] = lines.length > 0 ? lines : null; }
    } else {
      p['lineas'] = Array.isArray(rawLineas) ? rawLineas : lines.length > 0 ? lines : null;
    }

    if (Object.prototype.hasOwnProperty.call(p, 'numero_orden')) delete p['numero_orden'];
    if (Object.prototype.hasOwnProperty.call(p, 'id_orden')) delete p['id_orden'];
    return p;
  };

  useEffect(() => {
    let mounted = true;
    async function loadMeta() {
      // columnas por defecto si no podemos leer information_schema
      const fallbackColumns: ColumnMeta[] = [
        { column_name: 'numero_orden', data_type: 'text', is_nullable: 'YES', character_maximum_length: null },
        // omitimos 'fecha' en el fallback porque muchas bases no la tienen y provoca errores 42703
        { column_name: 'id_proveedor', data_type: 'int', is_nullable: 'YES', character_maximum_length: null },
        { column_name: 'total', data_type: 'numeric', is_nullable: 'YES', character_maximum_length: null },
        { column_name: 'estado', data_type: 'text', is_nullable: 'YES', character_maximum_length: null },
      ];
      try {
        const { data: cols, error: colsErr, status } = await supabase
          .from("information_schema.columns")
          .select("column_name,data_type,is_nullable,character_maximum_length")
          .eq("table_name", "orden_compra")
          .eq("table_schema", "public")
          .order("ordinal_position", { ascending: true });
        if (status === 404) {
          // PostgREST en supabase suele bloquear information_schema para el role anon.
          // En vez de spam de warnings, aplicamos silent fallback a columnas conocidas para que
          // la generación del formulario funcione.
          if (mounted) setColumns(fallbackColumns);
          // opcional: registrar a debug en vez de warn para no llenar la consola en producción
          console.debug('information_schema not accessible (404): using fallback columns');
        } else if (colsErr) {
          console.warn('Error loading columns metadata:', colsErr);
        } else if (Array.isArray(cols) && mounted) {
          setColumns(cols as ColumnMeta[]);
        }
      } catch (e) {
        console.warn('Unexpected error loading columns metadata', e);
      }

      try {
        // pedir la mayoría de campos para mostrar en la tabla
        const { data: provs, error: provErr, status } = await supabase
          .from('proveedor')
          .select('id_proveedor,nombre,contacto,telefono,correo,direccion,activo,es_preferido,dias_entrega,tiempo_entrega_promedio')
          .order('id_proveedor', { ascending: true }).limit(500);
        if (status === 403) {
          console.warn('Proveedor select forbidden (403) — mostrar fallback vacío');
          if (mounted) {
            setProviders([]);
            setProvidersError('Permiso denegado para listar proveedores (403)');
          }
        } else if (provErr) {
          console.warn('Error loading proveedores:', provErr);
          if (mounted) setProvidersError(String(provErr.message ?? provErr));
        } else if (provs && mounted) setProviders(provs as Record<string, unknown>[]);
      } catch (e) {
        console.warn('Unexpected error loading proveedores', e);
        if (mounted) setProviders([]);
      }

      return () => { mounted = false; };
    }
    loadMeta();
  }, []);

  // Cargar órdenes cuando cambian columnas (o al montar si columns inicialmente [])
  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        // detectar columna de fecha válida en la tabla (priorizar 'fecha', luego 'fecha_orden')
        const dateCandidates = ['fecha', 'fecha_orden', 'fecha_orden_compra'];
        const dateCol = columns.find((c) => dateCandidates.includes(c.column_name))?.column_name;

  // construir lista de campos a solicitar; NO incluir ni ordenar por la columna de fecha directamente
  // (evita 42703 si la columna no existe). Ordenaremos en cliente si la columna aparece en la respuesta.
  const selectFields = 'id_orden, numero_orden, id_proveedor, total, estado, proveedor:proveedor(nombre)';

        // Intentar leer desde vw_orden_compra primero (si existe) y si no, desde orden_compra
        const sources = ['vw_orden_compra', 'orden_compra'];
        let data: unknown = null;
        let err: unknown = null;
        for (const src of sources) {
          try {
            const res = await supabase.from(src).select(selectFields).limit(500);
            data = res.data;
            err = res.error;
            // si la relación no existe, intentar la siguiente fuente
            if (err && typeof err === 'object') {
              const m = (err as Record<string, unknown>).message ?? (err as Record<string, unknown>).error ?? '';
              const errRec = err as Record<string, unknown>;
              const errCode = errRec ? (typeof errRec['code'] === 'string' ? String(errRec['code']) : '') : '';
              if (typeof m === 'string' && (m.includes(`relation "${src}" does not exist`) || errCode === '42P01')) {
                console.debug(`${src} not available, trying next source`);
                continue;
              }
            }
            break;
          } catch (e) {
            err = e;
            const em = String(e);
            if (em.includes('does not exist') || em.includes('42P01')) continue;
            break;
          }
        }

  if (err) {
          // obtener mensaje legible del error de supabase/postgrest
          const asObj = err as unknown;
          let msg = '';
          if (asObj && typeof asObj === 'object') {
            const o = asObj as Record<string, unknown>;
            if (typeof o.message === 'string') msg = o.message;
            else if (typeof o.error === 'string') msg = o.error;
            else msg = JSON.stringify(o);
          } else {
            msg = String(asObj);
          }
          console.warn("orden_compra join proveedor failed:", msg, err);
          if (mounted) setError(String(msg));
          // Si el error es por columna inexistente (p.ej. 42703), no volvemos a usar dateCol en el retry
          let retryDateCol: string | undefined = dateCol ?? undefined;
          try {
            const errObj = err as unknown;
            if (errObj && typeof errObj === 'object') {
              const eo = errObj as Record<string, unknown>;
              const code = eo['code'];
              if (code === '42703' || (typeof msg === 'string' && msg.includes('column orden_compra.'))) {
                retryDateCol = undefined;
                console.debug('orden_compra missing requested column, retrying without date column');
              }
            }
          } catch { /* ignore parsing errors */ }

          // fallback: volver a intentar sin join y usando la columna de fecha sólo si retryDateCol está definida
          let baseSelect = 'id_orden, numero_orden, id_proveedor, total, estado';
          if (retryDateCol) baseSelect = `id_orden, numero_orden, ${retryDateCol}, id_proveedor, total, estado`;
          const baseQuery = supabase.from('orden_compra').select(baseSelect).limit(500);
          const { data: d2, error: err2 } = retryDateCol ? await baseQuery.order(retryDateCol, { ascending: false }) : await baseQuery;
          if (err2) throw err2;
          if (!mounted) return;
          setRows(((d2 as unknown) as Record<string, unknown>[]).map((r) => ({
            id_orden: String(getVal(r, 'id_orden') ?? ''),
            numero_orden: toStr(getVal(r, 'numero_orden')),
            fecha: retryDateCol ? toStr(getVal(r, retryDateCol)) ?? toStr(getVal(r, 'fecha')) : (toStr(getVal(r, 'fecha')) ?? null),
            id_proveedor: toStr(getVal(r, 'id_proveedor')),
            proveedor: null,
            total: toNum(getVal(r, 'total')) ?? 0,
            estado: toStr(getVal(r, 'estado')),
          })));
        } else {
          if (!mounted) return;
          // data puede venir de vw_orden_compra o de orden_compra; no asumimos que incluyen 'fecha'
          const rowsData = (data as unknown) as Record<string, unknown>[];
          // si detectamos la columna dateCol en los resultados, ordenamos en cliente por esa columna (desc)
          if (dateCol && rowsData.length > 0 && Object.prototype.hasOwnProperty.call(rowsData[0], dateCol)) {
            rowsData.sort((a, b) => {
              const da = getVal(a, dateCol) ? new Date(String(getVal(a, dateCol))).getTime() : 0;
              const db = getVal(b, dateCol) ? new Date(String(getVal(b, dateCol))).getTime() : 0;
              return db - da;
            });
          }
          setRows(rowsData.map((r) => {
            const provObj = getVal(r, 'proveedor') as Record<string, unknown> | null;
            return {
              id_orden: String(getVal(r, 'id_orden') ?? ''),
              numero_orden: toStr(getVal(r, 'numero_orden')),
              fecha: dateCol ? toStr(getVal(r, dateCol)) ?? toStr(getVal(r, 'fecha')) : toStr(getVal(r, 'fecha')),
              id_proveedor: toStr(getVal(r, 'id_proveedor')),
              proveedor: provObj ? toStr(provObj['nombre']) : null,
              total: toNum(getVal(r, 'total')) ?? 0,
              estado: toStr(getVal(r, 'estado')),
            };
          }));
        }
  } catch (e: unknown) {
        // intentar obtener información útil del error
        let parsed: string;
        if (e instanceof Error) parsed = e.message;
        else if (typeof e === 'object') {
          try { parsed = JSON.stringify(e, Object.getOwnPropertyNames(e)); } catch { parsed = String(e); }
        } else parsed = String(e);
        console.error("Error cargando ordenes:", parsed, e);
        if (mounted) setError(parsed);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOrders();
    return () => { mounted = false; };
  }, [columns]);

  const openNew = () => {
    setDetail(null);
    setOpenDrawer(true);
  };
  const openNewProvider = () => {
    setProvDetail(null);
    setProvName('');
    setProvContacto('');
    setProvTelefono('');
    setProvCorreo('');
    setProvDireccion('');
    setProvActivo(true);
    setProvPreferido(false);
    setProvDiasEntrega('');
    setProvTiempoEntrega(undefined);
    setProvSaveMessage(null);
    setProvReadOnly(false);
    setOpenProvDrawer(true);
  };

  const openEditProvider = (p: Record<string, unknown>) => {
    setProvDetail(p);
    setProvName(String(p['nombre'] ?? ''));
    setProvContacto(String(p['contacto'] ?? ''));
    setProvTelefono(String(p['telefono'] ?? ''));
    setProvCorreo(String(p['correo'] ?? ''));
    setProvDireccion(String(p['direccion'] ?? ''));
    setProvActivo(Boolean(p['activo'] ?? true));
    setProvPreferido(Boolean(p['es_preferido'] ?? false));
    setProvDiasEntrega(String(p['dias_entrega'] ?? ''));
    setProvTiempoEntrega(p['tiempo_entrega_promedio'] ? Number(p['tiempo_entrega_promedio']) : undefined);
    setProvSaveMessage(null);
    setProvReadOnly(false);
    setOpenProvDrawer(true);
  };

  const openViewProvider = (p: Record<string, unknown>) => {
    setProvDetail(p);
    setProvName(String(p['nombre'] ?? ''));
    setProvContacto(String(p['contacto'] ?? ''));
    setProvTelefono(String(p['telefono'] ?? ''));
    setProvCorreo(String(p['correo'] ?? ''));
    setProvDireccion(String(p['direccion'] ?? ''));
    setProvActivo(Boolean(p['activo'] ?? true));
    setProvPreferido(Boolean(p['es_preferido'] ?? false));
    setProvDiasEntrega(String(p['dias_entrega'] ?? ''));
    setProvTiempoEntrega(p['tiempo_entrega_promedio'] ? Number(p['tiempo_entrega_promedio']) : undefined);
    setProvSaveMessage(null);
    setProvReadOnly(true);
    setOpenProvDrawer(true);
  };

  const handleDeleteProvider = async (p: Record<string, unknown>) => {
    const id = p['id_proveedor'];
    if (!confirm(`Eliminar proveedor ${p['nombre'] ?? id}?`)) return;
    try {
      const { error } = await supabase.from('proveedor').delete().eq('id_proveedor', id);
      if (error) throw error;
      setProviders((prev) => prev.filter(x => x['id_proveedor'] !== id));
    } catch (err) {
      console.warn('Delete proveedor failed, applying local fallback', err);
      setProviders((prev) => prev.filter(x => x['id_proveedor'] !== id));
    }
  };
  const openView = (r: Orden) => {
    setDetail(r);
    setReadOnly(true);
    setOpenDrawer(true);
  };

  // open edit for order: preload detail into form inputs and allow editing
  const openEditOrder = (r: Orden) => {
    setDetail(r);
    setReadOnly(false);
    setOpenDrawer(true);
  };
  const deleteRow = (r: Orden) => {
    if (!confirm(`Eliminar orden ${r.numero_orden ?? r.id_orden}?`)) return;
    setRows((p) => p.filter((x) => x.id_orden !== r.id_orden));
  };

  const handleSaveProvider = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!provName.trim()) return setProvSaveMessage('El nombre es requerido');
    setProvSaving(true);
    setProvSaveMessage(null);
    try {
      const payload: Record<string, unknown> = {
        nombre: provName.trim(), contacto: provContacto.trim() || null, telefono: provTelefono.trim() || null,
        correo: provCorreo.trim() || null, direccion: provDireccion.trim() || null, activo: provActivo, es_preferido: provPreferido,
        dias_entrega: provDiasEntrega.trim() || null, tiempo_entrega_promedio: provTiempoEntrega ?? null,
      };
      if (provDetail && provDetail['id_proveedor']) {
        // actualizar
        const id = provDetail['id_proveedor'];
        const { data, error } = await supabase.from('proveedor').update(payload).eq('id_proveedor', id).select('id_proveedor,nombre,contacto,telefono,correo,direccion,activo,es_preferido,dias_entrega,tiempo_entrega_promedio').single();
        if (error) throw error;
        if (data) {
          setProviders((p) => [data as Record<string, unknown>, ...p.filter(x => x['id_proveedor'] !== id)]);
          setProvSaveMessage('Proveedor actualizado');
          setTimeout(() => { setProvSaveMessage(null); setOpenProvDrawer(false); }, 700);
        }
      } else {
        // crear nuevo
        const { data, error } = await supabase.from('proveedor').insert([payload]).select('id_proveedor,nombre,contacto,telefono,correo,direccion,activo,es_preferido,dias_entrega,tiempo_entrega_promedio').single();
        if (error) throw error;
        if (data) {
          setProviders((p) => [data as Record<string, unknown>, ...p]);
          setProvSaveMessage('Proveedor creado');
          setTimeout(() => { setProvSaveMessage(null); setOpenProvDrawer(false); }, 700);
        }
      }
    } catch (err) {
      console.warn('Save proveedor failed:', err);
      setProvSaveMessage('Error guardando proveedor');
    } finally {
      setProvSaving(false);
    }
  };

  const formatted = useMemo(() => rows, [rows]);

  const filteredRows = useMemo(() => {
    return formatted.filter((r) => {
      if (statusFilter) {
        const s = (r.estado || '').toString().toLowerCase();
        if (statusFilter === 'Recibida' && !s.includes('recib')) return false;
        if (statusFilter === 'Cancelada' && !s.includes('cancel')) return false;
        if (statusFilter === 'Pendiente' && (s.includes('recib') || s.includes('cancel'))) return false;
      }
      if (q) {
        const ql = q.toLowerCase();
        if (!((r.numero_orden ?? '') + ' ' + (r.proveedor ?? '')).toLowerCase().includes(ql)) return false;
      }
      if (dateFrom && r.fecha) {
        if (new Date(r.fecha) < new Date(dateFrom)) return false;
      }
      if (dateTo && r.fecha) {
        if (new Date(r.fecha) > new Date(dateTo)) return false;
      }
      return true;
    });
  }, [formatted, statusFilter, q, dateFrom, dateTo]);

  const handleSave = async (payload: Record<string, unknown>) => {
    try {
  const normalized = normalizePayload(payload);
  console.debug('handleSave: payload to send to supabase (normalized):', normalized);
  const insertSelect = getInsertSelect();
  console.debug('handleSave: insert select fields:', insertSelect);
  const { data: ins, error: insErr } = await supabase.from('orden_compra').insert([normalized as Record<string, unknown>]).select(insertSelect);
      if (insErr) {
        try {
          const str = JSON.stringify(insErr, Object.getOwnPropertyNames(insErr), 2);
          console.error('Supabase insert error object (stringified):', str);
        } catch (e) {
          console.error('Supabase insert error object (non-stringifiable):', insErr, e);
        }
        console.error('Supabase insert error object:', insErr);
        throw insErr;
      }
      if (ins && Array.isArray(ins)) {
        const rawRow = ins[0];
        const newRow = (typeof rawRow === 'object' && rawRow !== null) ? rawRow as Record<string, unknown> : {};
        const provId = toStr(getVal(newRow, 'id_proveedor'));
        const provName = providers.find(x => String(x['id_proveedor'] ?? '') === String(provId))?.['nombre'];
        setRows((p) => [{ id_orden: String(getVal(newRow, 'id_orden') ?? `tmp-${Date.now()}`), numero_orden: toStr(getVal(newRow, 'numero_orden')), fecha: toStr(getVal(newRow, 'fecha')), id_proveedor: provId, proveedor: provName ? String(provName) : null, total: toNum(getVal(newRow, 'total')) ?? 0, estado: toStr(getVal(newRow, 'estado')) }, ...p]);

  // Si la orden se creó ya con estado 'Recibida', crear movimiento_encabezado + líneas
        try {
            const createdEstado = String(getVal(newRow, 'estado') ?? (normalized.estado ?? 'Pendiente'));
          if (createdEstado.toLowerCase().includes('recib')) {
            // crear encabezado de movimiento vinculado a la orden
            const referenciaId = toNum(getVal(newRow, 'id_orden')) ?? undefined;
            const { data: encData, error: encErr } = await supabase.from('movimiento_encabezado').insert([{ id_perfil: null, modulo_origen: 'INGRESO_COMPRA', id_referencia: referenciaId, descripcion: `Movimiento por orden ${toStr(getVal(newRow, 'numero_orden'))}` }]).select('id_movimiento').single();
            if (encErr) throw encErr;
            const idMovimiento = encData?.id_movimiento;
            if (idMovimiento) {
              const linesPayload = lines.map((ln) => ({ id_movimiento: idMovimiento, id_insumo: Number(ln.id_insumo), id_lote: null, tipo_movimiento: 'ENTRADA', cantidad: ln.cantidad }));
              const { error: linesErr } = await supabase.from('movimiento_linea').insert(linesPayload);
              if (linesErr) console.warn('Error inserting movimiento_linea:', linesErr);
              // Incrementar stock por cada línea (RPC) — si falla, lo registramos
              for (const ln of lines) {
                try {
                  const id = Number(ln.id_insumo);
                  if (Number.isFinite(id)) {
                    const { error: rpcErr } = await supabase.rpc('incrementar_stock_insumo', { p_id_insumo: id, p_cantidad: ln.cantidad });
                    if (rpcErr) console.warn('RPC incrementar_stock_insumo failed for', id, rpcErr);
                  }
                } catch (e) {
                  console.warn('Error calling rpc for incremento de stock', e);
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error creando movimiento tras crear orden recibida:', e);
        }
      }
  // success
      return { success: true } as const;
    } catch (err) {
      // enhanced logging for server 400 debugging
      try {
        // intentar stringificar el error para copiar fácilmente desde la consola
        try {
          const s = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
          console.warn('Insert orden failed, fallback local. Error (raw) (stringified):', s);
        } catch (e) {
          console.warn('Insert orden failed, fallback local. Error (raw):', err, e);
        }
        // si es un objeto con propiedades message/details/hint/code, mostrarlo explícitamente
        if (err && typeof err === 'object') {
          const e = err as Record<string, unknown>;
          console.warn('Supabase error details:', { message: e.message ?? e.error ?? null, details: e.details ?? null, hint: e.hint ?? null, code: e.code ?? null, status: e.status ?? null });
        }
      } catch (e) {
        console.warn('Error printing supabase error details', e);
      }
      setRows((p) => [{
        id_orden: `tmp-${Date.now()}`,
        numero_orden: toStr(payload.numero_orden),
        fecha: toStr(payload.fecha),
        id_proveedor: toStr(payload.id_proveedor),
        proveedor: providers.find(x => String(x['id_proveedor'] ?? '') === String(payload.id_proveedor ?? ''))?.['nombre'] ? String(providers.find(x => String(x['id_proveedor'] ?? '') === String(payload.id_proveedor ?? ''))?.['nombre']) : null,
        total: Number(payload.total ?? 0),
        estado: String(payload.estado ?? 'Pendiente')
      }, ...p]);
      return { success: false, error: err } as const;
    }
  };

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const validatePayload = (payload: Record<string, unknown>) => {
    const errors: Record<string, string> = {};
    columns.forEach((c) => {
      const name = c.column_name;
      // Do not validate PK or DB-generated 'numero_orden' here; the DB will generate those values
      if (name === 'id_orden' || name === 'numero_orden') return; // pk / generated
      const val = payload[name];
      if (c.is_nullable === 'NO' && (val === undefined || val === null || String(val).trim() === '')) {
        errors[name] = 'Este campo es requerido';
        return;
      }
      if (val != null && (c.data_type.includes('int') || c.data_type.includes('numeric') || c.data_type.includes('double'))) {
        const n = Number(String(val));
        if (!Number.isFinite(n)) errors[name] = 'Valor numérico inválido';
      }
    });
    return errors;
  };

  // Contadores por estado
  const counts = useMemo(() => {
    const acc: Record<string, number> = { Pendiente: 0, Recibida: 0, Cancelada: 0 };
    rows.forEach((r) => {
      const s = (r.estado || "").toString().toLowerCase();
      if (s.includes("recib")) acc.Recibida += 1;
      else if (s.includes("cancel")) acc.Cancelada += 1;
      else acc.Pendiente += 1;
    });
    return acc;
  }, [rows]);

  const filteredProviders = useMemo(() => {
    if (!Array.isArray(providers)) return [];
    return providers
      .filter(p => String(p['nombre'] ?? '').toLowerCase().includes(providerQ.toLowerCase()))
      .filter(p => providerActivoFilter === 'all' ? true : (providerActivoFilter === 'activo' ? !!p['activo'] : !p['activo']))
      .filter(p => providerPreferidoFilter === 'all' ? true : (providerPreferidoFilter === 'si' ? !!p['es_preferido'] : !p['es_preferido']));
  }, [providers, providerQ, providerActivoFilter, providerPreferidoFilter]);

  const visibleProviders = useMemo(() => filteredProviders.slice(0, providerShowCount), [filteredProviders, providerShowCount]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Ingreso Compra</h2>
        <p className="text-sm text-gray-500">Vista completa de todas las órdenes de compra</p>
      </div>

      {/* Sección Proveedores */}
      <div className="mt-6 mb-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Proveedores</h3>
            <p className="text-sm text-gray-500">Lista de proveedores y creación rápida</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openNewProvider} className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">Nuevo proveedor</button>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
          <input value={providerQ} onChange={(e) => setProviderQ(e.target.value)} placeholder="Filtrar por nombre..." className="h-10 rounded border px-2 w-full sm:col-span-2 max-w-2xl" />
          {/* ID filter removed as requested */}
          <select value={providerActivoFilter} onChange={(e) => setProviderActivoFilter(e.target.value)} className="h-10 rounded border px-2 max-w-xs">
            <option value="all">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <select value={providerPreferidoFilter} onChange={(e) => setProviderPreferidoFilter(e.target.value)} className="h-10 rounded border px-2 max-w-xs">
            <option value="all">Todos</option>
            <option value="si">Preferidos</option>
            <option value="no">No preferidos</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {providersError ? <div className="p-3 text-sm text-rose-600">{providersError}</div> : null}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-sm text-gray-500">
                    <tr className="border-b">
                      <th className="p-3">ID</th>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Contacto</th>
                      <th className="p-3">Teléfono</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3">Dirección</th>
                      <th className="p-3">Activo</th>
                      <th className="p-3">Preferido</th>
                      <th className="p-3">Días</th>
                      <th className="p-3">Tiempo (h)</th>
                      <th className="p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProviders.length === 0 ? (
                      <tr key="none"><td colSpan={11} className="p-4 text-center text-gray-500">No hay proveedores</td></tr>
                    ) : (
                      <>
                        {visibleProviders.map((p) => (
                          <tr key={String(p['id_proveedor'])} className="border-b hover:bg-gray-50">
                            <td className="p-3">{String(p['id_proveedor'] ?? '')}</td>
                            <td className="p-3">{String(p['nombre'] ?? '')}</td>
                            <td className="p-3">{String(p['contacto'] ?? '')}</td>
                            <td className="p-3">{String(p['telefono'] ?? '')}</td>
                            <td className="p-3">{String(p['correo'] ?? '')}</td>
                            <td className="p-3">{String(p['direccion'] ?? '')}</td>
                            <td className="p-3">{p['activo'] ? <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded">Sí</span> : <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">No</span>}</td>
                            <td className="p-3">{p['es_preferido'] ? <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded">Sí</span> : <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">No</span>}</td>
                            <td className="p-3">{String(p['dias_entrega'] ?? '')}</td>
                            <td className="p-3">{p['tiempo_entrega_promedio'] != null ? String(p['tiempo_entrega_promedio']) : '—'}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2 justify-end">
                                <button title="Ver" onClick={() => openViewProvider(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="Ver"><PiEyeBold /></button>
                                <button title="Editar" onClick={() => openEditProvider(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="Editar"><PiPencilSimpleBold /></button>
                                <button title="Eliminar" onClick={() => handleDeleteProvider(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="Eliminar"><PiTrashBold /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr><td colSpan={11} className="p-2 text-center">
                          {filteredProviders.length > providerShowCount ? (
                            <button onClick={() => setProviderShowCount((s) => s + 3)} className="px-3 py-1 rounded border">Mostrar más</button>
                          ) : filteredProviders.length > 3 ? (
                            <button onClick={() => setProviderShowCount(3)} className="px-3 py-1 rounded border">Mostrar menos</button>
                          ) : null}
                        </td></tr>
                      </>
                    )}
                  </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drawer Proveedor (motion.aside) */}
      <AnimatePresence>
        {openProvDrawer && (
          <motion.aside
            initial={{ x: 520, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 520, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-sm bg-white shadow-2xl border-l border-gray-100"
            role="dialog"
            aria-modal="true"
          >
            <div className="h-14 px-5 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-base md:text-lg font-bold text-gray-800">{provDetail ? `Proveedor ${String(provDetail['nombre'] ?? provDetail['id_proveedor'])}` : 'Nuevo Proveedor'}</h3>
              <button onClick={() => setOpenProvDrawer(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Cerrar">
                <MdClose size={20} />
              </button>
            </div>
            <div className="h-[calc(100vh-56px)] overflow-y-auto p-5">
              <form onSubmit={handleSaveProvider} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700">Nombre</label>
                  <input value={provName} onChange={(e) => setProvName(e.target.value)} name="nombre" className="w-full h-10 rounded border px-2" disabled={provReadOnly} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Contacto</label>
                  <input value={provContacto} onChange={(e) => setProvContacto(e.target.value)} name="contacto" className="w-full h-10 rounded border px-2" disabled={provReadOnly} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700">Teléfono</label>
                      <input value={provTelefono} onChange={(e) => setProvTelefono(e.target.value)} name="telefono" className="w-full h-10 rounded border px-2" disabled={provReadOnly} />
                  </div>
                  <div>
                      <label className="block text-sm text-gray-700">Correo</label>
                      <input value={provCorreo} onChange={(e) => setProvCorreo(e.target.value)} name="correo" className="w-full h-10 rounded border px-2" disabled={provReadOnly} />
                  </div>
                </div>
                <div>
                    <label className="block text-sm text-gray-700">Dirección</label>
                    <input value={provDireccion} onChange={(e) => setProvDireccion(e.target.value)} name="direccion" className="w-full h-10 rounded border px-2" disabled={provReadOnly} />
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={provActivo} onChange={(e) => setProvActivo(e.target.checked)} disabled={provReadOnly} /> Activo</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={provPreferido} onChange={(e) => setProvPreferido(e.target.checked)} disabled={provReadOnly} /> Preferido</label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-700">Días de entrega</label>
                      <input value={provDiasEntrega} onChange={(e) => setProvDiasEntrega(e.target.value)} name="dias_entrega" className="w-full h-10 rounded border px-2" disabled={provReadOnly} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Tiempo entrega (horas)</label>
                      <input value={provTiempoEntrega ?? ''} onChange={(e) => setProvTiempoEntrega(e.target.value ? Number(e.target.value) : undefined)} type="number" name="tiempo_entrega_promedio" className="w-full h-10 rounded border px-2" disabled={provReadOnly} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4 items-center">
                    {provReadOnly ? (
                      <button type="button" onClick={() => setOpenProvDrawer(false)} className="px-4 py-2 border rounded">Cerrar</button>
                    ) : (
                      <>
                        <button type="submit" disabled={provSaving} className={`px-4 py-2 ${provSaving ? 'bg-gray-300 text-gray-700' : 'bg-emerald-600 text-white'} rounded`}>{provSaving ? 'Guardando...' : 'Guardar'}</button>
                        <button type="button" onClick={() => setOpenProvDrawer(false)} className="px-4 py-2 border rounded">Cancelar</button>
                      </>
                    )}
                    {provSaveMessage ? <div className="text-sm ml-3 text-gray-600">{provSaveMessage}</div> : null}
                </div>
              </form>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Estados:</div>
          <button onClick={() => setStatusFilter(null)} className={`px-3 py-1 rounded ${statusFilter === null ? 'bg-gray-200' : 'bg-white'}`}>Todos ({counts.Pendiente + counts.Recibida + counts.Cancelada})</button>
          <button onClick={() => setStatusFilter('Pendiente')} className={`px-3 py-1 rounded ${statusFilter === 'Pendiente' ? 'bg-gray-200' : 'bg-white'}`}>Pendientes ({counts.Pendiente})</button>
          <button onClick={() => setStatusFilter('Recibida')} className={`px-3 py-1 rounded ${statusFilter === 'Recibida' ? 'bg-gray-200' : 'bg-white'}`}>Recibidas ({counts.Recibida})</button>
          <button onClick={() => setStatusFilter('Cancelada')} className={`px-3 py-1 rounded ${statusFilter === 'Cancelada' ? 'bg-gray-200' : 'bg-white'}`}>Canceladas ({counts.Cancelada})</button>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0 sm:ml-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="h-10 rounded border px-2" />
          <input value={dateFrom ?? ''} onChange={(e) => setDateFrom(e.target.value || null)} type="date" className="h-10 rounded border px-2" />
          <input value={dateTo ?? ''} onChange={(e) => setDateTo(e.target.value || null)} type="date" className="h-10 rounded border px-2" />
          <button onClick={openNew} className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
            Crear Nueva Orden
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Movimientos</h3>
          <p className="text-sm text-gray-500">Historial y control de las órdenes de compra registradas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-sm text-gray-500">
              <tr className="border-b">
                <th className="p-3">N.º de Orden</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Proveedor</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="p-4 text-center text-rose-600">Error: {error}</td></tr>
              ) : filteredRows.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">No hay órdenes</td></tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id_orden} className="border-b hover:bg-gray-50">
                    <td className="p-3">{r.numero_orden ?? r.id_orden}</td>
                    <td className="p-3">{r.fecha ? new Date(r.fecha).toLocaleDateString() : '—'}</td>
                    <td className="p-3">{r.proveedor ?? '—'}</td>
                    <td className="p-3">{r.total ? r.total.toFixed(2) : '—'}</td>
                    <td className="p-3">{r.estado ?? '—'}</td>
                    <td className="p-3 flex items-center gap-2">
                      {/* Acciones estilo catálogo: Ver (solo lectura), Editar, Eliminar */}
                      <button title="Ver" onClick={() => openView(r)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="Ver"><PiEyeBold /></button>
                      <button title="Editar" onClick={() => openEditOrder(r)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="Editar"><PiPencilSimpleBold /></button>
                      <button title="Eliminar" onClick={() => deleteRow(r)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="Eliminar"><PiTrashBold /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer derecho */}
      <AnimatePresence>
        {openDrawer && (
          <motion.aside
            initial={{ x: 520, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 520, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 z-50 w-full md:max-w-[920px] bg-white shadow-2xl border-l border-gray-100"
            role="dialog"
            aria-modal="true"
          >
            <div className="h-14 px-5 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-base md:text-lg font-bold text-gray-800">{detail ? `Orden ${detail.numero_orden ?? detail.id_orden}` : 'Nueva Orden'}</h3>
              <button onClick={() => setOpenDrawer(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Cerrar">
                <MdClose size={20} />
              </button>
            </div>

            <div className="h-[calc(100vh-56px)] grid grid-cols-1 lg:grid-cols-[1fr_360px]">
              <div className="overflow-y-auto p-5 md:p-6 lg:p-7">
                {/* contenido del formulario/orden */}
                <div className="p-2">
                  {detail && readOnly ? (
                    <div>
                      <p><strong>Proveedor:</strong> {detail.proveedor ?? '—'}</p>
                      <p><strong>Fecha:</strong> {detail.fecha ?? '—'}</p>
                      <p><strong>Total:</strong> {detail.total?.toFixed(2) ?? '—'}</p>
                      <p className="mt-4">(Detalle de línea y acciones no implementadas en este PR)</p>
                    </div>
                  ) : (
                      <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const fd = new FormData(form);
                      const payload: Record<string, unknown> = {};
                      fd.forEach((v, k) => { payload[k] = v; });
                      // validar
                      const errors = validatePayload(payload);
                      setFormErrors(errors);
                      if (Object.keys(errors).length > 0) {
                        setSaveMessage('Corrige los campos marcados antes de enviar');
                        const firstKey = Object.keys(errors)[0];
                        const el = form.querySelector(`[name="${firstKey}"]`) as HTMLInputElement | null;
                        if (el) el.focus();
                        return;
                      }
                      setSaveMessage(null);
                      setSaving(true);
                      try {
                        // añadir totales y líneas al payload para persistencia
                        // Enviar `lineas` como JSON (array) en lugar de string; la columna en la BD debe ser json/jsonb
                        const payloadWithTotals = { ...payload, total: total, lineas: lines, estado: payload.estado ?? 'Pendiente' } as Record<string, unknown>;
                        if (detail && !readOnly) {
                          // actualizar orden existente
                          const id = detail.id_orden;
                          const normalizedUpdate = normalizePayload(payloadWithTotals);
                          const { data, error } = await supabase.from('orden_compra').update(normalizedUpdate).eq('id_orden', id).select('*').single();
                          if (error) throw error;
                          // actualizar fila local
                          setRows((prev) => prev.map(r => r.id_orden === String(id) ? ({ ...r, numero_orden: toStr(getVal(data, 'numero_orden')), fecha: toStr(getVal(data, 'fecha')), id_proveedor: toStr(getVal(data, 'id_proveedor')), total: toNum(getVal(data, 'total')) ?? r.total, estado: toStr(getVal(data, 'estado')) }) : r));
                          setSaveMessage('Orden actualizada correctamente');
                          setTimeout(() => { setSaveMessage(null); setOpenDrawer(false); }, 700);
                        } else {
                          const res = await handleSave(payloadWithTotals);
                          if (res && res.success) {
                            setSaveMessage('Orden creada correctamente');
                            setTimeout(() => { setSaveMessage(null); setOpenDrawer(false); }, 700);
                          } else {
                            setSaveMessage('No se pudo guardar en el servidor, se añadió localmente (fallback)');
                            setTimeout(() => setSaveMessage(null), 2000);
                          }
                        }
                      } catch (err) {
                        console.warn('Save/update orden failed, fallback local', err);
                        setSaveMessage('Error al guardar la orden');
                        setTimeout(() => setSaveMessage(null), 2000);
                      } finally {
                        setSaving(false);
                      }
                    }}>
                      {/* Reusar la generación de inputs existente */}
                      {columns.length > 0 ? (
                        columns.filter(c => c.column_name !== 'id_orden').map((c) => {
                          const name = c.column_name;
                          const initial = detail ? String(getVal(detail, name) ?? '') : '';
                          if (name === 'numero_orden') {
                            // No renderizamos input para numero_orden: debe generarlo la BD.
                            return null;
                          }
                          if (name === 'estado') {
                            const val = initial || 'Pendiente';
                            return (
                              <div key={name} className="mb-3">
                                <label className="block text-sm text-gray-700">Estado</label>
                                <select name={name} defaultValue={val} className="w-full h-10 rounded border px-2" disabled={readOnly}>
                                  <option value="Pendiente">Pendiente</option>
                                  <option value="Recibida">Recibida</option>
                                  <option value="Cancelada">Cancelada</option>
                                </select>
                              </div>
                            );
                          }
                          if (name === 'id_proveedor') {
                            // Controlado: cuando se selecciona proveedor, cargamos catálogo filtrado
                            return (
                              <div key={name} className="mb-3">
                                <label className="block text-sm text-gray-700">Proveedor</label>
                                <select name={name} value={selectedProviderId ?? ''} onChange={async (e) => {
                                  const v = e.target.value || undefined;
                                  setSelectedProviderId(v);
                                  try {
                                    await loadCatalog(v);
                                  } catch (err) {
                                    console.warn('catalogo load failed', err);
                                    setCatalogo([]);
                                  }
                                }} className="w-full h-10 rounded border px-2" disabled={readOnly}>
                                  <option value="">Seleccionar</option>
                                  {providers.map(p => (
                                    <option key={String(p['id_proveedor'] ?? '')} value={String(p['id_proveedor'] ?? '')}>
                                      {String(p['nombre'] ?? '')}
                                    </option>
                                  ))}
                                </select>
                                {formErrors[name] ? <div className="text-sm text-red-500 mt-1">{formErrors[name]}</div> : null}
                                <div className="mt-2">
                                  <label className="block text-sm text-gray-700">Catálogo de Insumos</label>
                                  <select value={selectedInsumoId ?? ''} onChange={(e) => setSelectedInsumoId(e.target.value || undefined)} className="w-full h-10 rounded border px-2">
                                    <option value="">Seleccionar insumo</option>
                                    {catalogo.map((it) => (
                                      <option key={String(it['id_insumo'] ?? '')} value={String(it['id_insumo'] ?? '')}>{String(it['nombre'] ?? '')} {it['unidad_medida'] ? `(${String(it['unidad_medida'])})` : ''}</option>
                                    ))}
                                  </select>
                                  <div className="flex gap-2 mt-2">
                                    <input type="number" min={1} value={cantidadToAdd} onChange={(e) => setCantidadToAdd(Number(e.target.value || 1))} className="w-28 h-10 rounded border px-2" />
                                    <button type="button" onClick={() => {
                                      if (!selectedInsumoId) return alert('Seleccione un insumo');
                                      const it = catalogo.find(c => String(c['id_insumo']) === String(selectedInsumoId));
                                      if (!it) return alert('Insumo no encontrado en el catálogo');
                                      const precio = Number(it['costo_promedio'] ?? 0);
                                      const linea: ItemLine = { id_insumo: selectedInsumoId, nombre: String(it['nombre'] ?? ''), unidad: String(it['unidad_medida'] ?? ''), precio, cantidad: cantidadToAdd || 1, subtotal: precio * (cantidadToAdd || 1) };
                                      setLines((l) => [...l, linea]);
                                    }} className="px-3 py-2 bg-emerald-500 text-white rounded">Agregar</button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          if (c.data_type.includes('date')) {
                            const dv = initial ? initial.slice(0, 10) : '';
                            return (
                              <div key={name} className="mb-3">
                                <label className="block text-sm text-gray-700">{name}</label>
                                <input name={name} type="date" defaultValue={dv} className="w-full h-10 rounded border px-2" disabled={readOnly} />
                                {formErrors[name] ? <div className="text-sm text-red-500 mt-1">{formErrors[name]}</div> : null}
                              </div>
                            );
                          }
                          if (c.data_type.includes('int') || c.data_type.includes('numeric') || c.data_type.includes('double') ) {
                            return (
                              <div key={name} className="mb-3">
                                <label className="block text-sm text-gray-700">{name}</label>
                                <input name={name} type="number" defaultValue={initial} className="w-full h-10 rounded border px-2" disabled={readOnly} />
                              </div>
                            );
                          }
                          return (
                            <div key={name} className="mb-3">
                              <label className="block text-sm text-gray-700">{name}</label>
                              <input name={name} defaultValue={initial} className="w-full h-10 rounded border px-2" disabled={readOnly} />
                              {formErrors[name] ? <div className="text-sm text-red-500 mt-1">{formErrors[name]}</div> : null}
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <div className="mb-3">
                            <label className="block text-sm text-gray-700">Proveedor</label>
                            <input name="proveedor" className="w-full h-10 rounded border px-2" placeholder="Proveedor" />
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm text-gray-700">Fecha</label>
                            <input name="fecha" type="date" className="w-full h-10 rounded border px-2" />
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 mt-4 items-center">
                        {readOnly ? (
                          <button type="button" onClick={() => setOpenDrawer(false)} className="px-4 py-2 border rounded">Cerrar</button>
                        ) : (
                          <>
                            <button type="submit" disabled={saving} className={`px-4 py-2 ${saving ? 'bg-gray-300 text-gray-700' : 'bg-emerald-600 text-white'} rounded`}>{saving ? 'Guardando...' : 'Guardar'}</button>
                            <button type="button" onClick={() => setOpenDrawer(false)} className="px-4 py-2 border rounded">Cancelar</button>
                          </>
                        )}
                        {saveMessage ? <div className="text-sm ml-3 text-gray-600">{saveMessage}</div> : null}
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Resumen lateral */}
              <div className="hidden lg:block border-l border-gray-100 bg-gray-50/60">
                <div className="h-full overflow-y-auto">
                  <div className="sticky top-0 p-5">
                    <div className="bg-white rounded-xl border border-gray-200/70 shadow-sm p-5">
                      <div className="text-sm font-bold text-gray-800 mb-4">Resumen</div>
                      <div className="text-sm font-semibold mt-3">Movimientos</div>
                      <div className="text-xs text-gray-500 mb-3">Operaciones relacionadas con el stock y recepción de la orden</div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4"><span className="text-gray-500">ID</span><span className="font-medium text-gray-800">{detail?.id_orden ?? '—'}</span></div>
                        <div className="flex items-center justify-between gap-4"><span className="text-gray-500">Proveedor</span><span className="font-medium text-gray-800">{detail?.proveedor ?? '—'}</span></div>
                          <div className="flex items-center justify-between gap-4"><span className="text-gray-500">Total</span><span className="font-medium text-gray-800">{(lines.length > 0 ? total : detail?.total)?.toFixed?.(2) ?? '—'}</span></div>
                          <div>
                            <div className="text-sm font-semibold mt-2 mb-2">Líneas</div>
                            {lines.length === 0 ? null : (
                              <div className="space-y-2">
                                {lines.map((ln, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="font-medium">{ln.nombre}</div>
                                      <div className="text-xs text-gray-500">{ln.cantidad} x {ln.precio?.toFixed?.(2) ?? '0.00'}</div>
                                    </div>
                                    <div className="text-right">
                                      <div>{ln.subtotal.toFixed(2)}</div>
                                      <button type="button" onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-rose-600">Eliminar</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            {/* Acciones: recibir o rechazar cuando no readonly */}
                            {!readOnly && (
                              <div className="flex gap-2">
                                <button type="button" onClick={async () => {
                                  // recibir la orden: crear movimiento_encabezado, insertar líneas, incrementar stock y actualizar orden_compra.estado
                                  if (!confirm('Marcar orden como recibida y actualizar stock?')) return;
                                  try {
                                    if (!detail) return;
                                    // crear encabezado de movimiento vinculado a la orden
                                    const referenciaId = isNaN(Number(detail.id_orden)) ? null : Number(detail.id_orden);
                                    const { data: encData, error: encErr } = await supabase.from('movimiento_encabezado').insert([{ id_perfil: null, modulo_origen: 'INGRESO_COMPRA', id_referencia: referenciaId, descripcion: `Movimiento por orden ${detail.numero_orden ?? ''}` }]).select('id_movimiento').single();
                                    if (encErr) throw encErr;
                                    const idMovimiento = encData?.id_movimiento;
                                    if (idMovimiento) {
                                      // insertar líneas basadas en `lines` del formulario si existen; si no, intentar reconstruir desde detail.lineas
                                      const toInsertLines = lines.length > 0 ? lines.map((ln) => ({ id_movimiento: idMovimiento, id_insumo: Number(ln.id_insumo), id_lote: null, tipo_movimiento: 'ENTRADA', cantidad: ln.cantidad })) : [];
                                      if (toInsertLines.length === 0 && detail) {
                                        const rawLineas = getVal(detail, 'lineas');
                                        if (rawLineas != null) {
                                          try {
                                            let parsed: unknown;
                                            if (typeof rawLineas === 'string') parsed = JSON.parse(rawLineas);
                                            else parsed = rawLineas;
                                            if (Array.isArray(parsed)) {
                                              for (const pl of parsed) {
                                                const plObj = pl as Record<string, unknown>;
                                                const idIns = toNum(plObj['id_insumo']) ?? Number(plObj['id_insumo'] ?? 0);
                                                const qty = toNum(plObj['cantidad']) ?? Number(plObj['cantidad'] ?? 0);
                                                toInsertLines.push({ id_movimiento: idMovimiento, id_insumo: idIns, id_lote: null, tipo_movimiento: 'ENTRADA', cantidad: qty });
                                              }
                                            }
                                          } catch (e) {
                                            console.warn('No se pudo parsear detail.lineas para insertar líneas:', e);
                                          }
                                        }
                                      }
                                      if (toInsertLines.length > 0) {
                                        const { error: linesErr } = await supabase.from('movimiento_linea').insert(toInsertLines);
                                        if (linesErr) console.warn('Error inserting movimiento_linea:', linesErr);
                                      }
                                      for (const ln of (toInsertLines.length > 0 ? toInsertLines : lines)) {
                                        try {
                                          const id = Number(ln.id_insumo);
                                          if (Number.isFinite(id)) {
                                            const { error: rpcErr } = await supabase.rpc('incrementar_stock_insumo', { p_id_insumo: id, p_cantidad: ln.cantidad });
                                            if (rpcErr) {
                                              // fallback: intentar update leyendo stock actual
                                              console.warn('RPC failed for incremento:', rpcErr);
                                              const { data: cur, error: curErr } = await supabase.from('insumo').select('stock').eq('id_insumo', id).single();
                                              if (!curErr && cur && typeof (cur as Record<string, unknown>).stock !== 'undefined') {
                                                const currentStock = Number((cur as Record<string, unknown>).stock) || 0;
                                                const qty = Number(ln.cantidad || 0);
                                                const newStock = currentStock + qty;
                                                await supabase.from('insumo').update({ stock: newStock }).eq('id_insumo', id);
                                              }
                                            }
                                          }
                                        } catch (e) {
                                          console.warn('Error incrementando stock por línea:', e);
                                        }
                                      }
                                    }

                                    // actualizar orden_compra estado
                                    if (detail && detail.id_orden) {
                                      await supabase.from('orden_compra').update({ estado: 'Recibida' }).eq('id_orden', detail.id_orden);
                                      setRows((prev) => prev.map(r => r.id_orden === detail.id_orden ? ({ ...r, estado: 'Recibida' }) : r));
                                    }
                                    alert('Orden recibida y stock actualizado');
                                    setOpenDrawer(false);
                                  } catch (err) {
                                    console.error('Error recibiendo orden:', err);
                                    alert('Error recibiendo orden. Revisa la consola.');
                                  }
                                }} className="px-3 py-2 bg-emerald-600 text-white rounded">Recibir</button>
                                <button type="button" onClick={async () => {
                                  if (!detail || !detail.id_orden) return;
                                  if (!confirm('Marcar orden como rechazada?')) return;
                                  try {
                                    await supabase.from('orden_compra').update({ estado: 'Cancelada' }).eq('id_orden', detail.id_orden);
                                    setRows((prev) => prev.map(r => r.id_orden === detail.id_orden ? ({ ...r, estado: 'Cancelada' }) : r));
                                    alert('Orden rechazada');
                                    setOpenDrawer(false);
                                  } catch (err) {
                                    console.error('Error rechazando orden:', err);
                                    alert('Error rechazando orden');
                                  }
                                }} className="px-3 py-2 border rounded">Rechazar</button>
                              </div>
                            )}
                          </div>
                      </div>
                      <div className="mt-5 flex gap-3">
                        <button onClick={() => { /* submit form */ }} className="h-10 flex-1 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">Guardar</button>
                        <button className="h-10 flex-1 rounded-lg border px-4 text-sm font-semibold hover:bg-gray-50" onClick={() => setOpenDrawer(false)}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      
    </div>
  );
}
