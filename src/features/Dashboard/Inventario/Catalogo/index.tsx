import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PiEyeBold,
  PiPencilSimpleBold,
  PiTrashBold,
  PiArrowDownBold,
  PiArrowUpBold,
} from "react-icons/pi";
import { MdClose } from "react-icons/md";
import Kardex from './Kardex';
import { supabase } from "../../../../api/supabaseClient";

/** Tipos */
type TipoInsumo = "Perpetuo" | "Operativo";
type EstadoStock = "OK" | "Stock Bajo" | "Crítico";
type UnidadMedida = "kg" | "litros" | "unidades";

type Fila = {
  id: string;
  nombre: string;
  tipo: TipoInsumo;
  stockCantidad: number;
  unidad: UnidadMedida;
  estado: EstadoStock;
  ultimaActualizacion: string;
  categoria: string;
  descripcion?: string;
  proveedor?: string;
  costo?: number;
  ubicacion?: string;
  activo?: boolean;
  automatica?: boolean;
  imagen?: string;
  categoriaId?: number;
  proveedorId?: number;
};

// Tipo para la respuesta de la API de catálogo
type CatalogoInsumoAPI = {
  id_insumo: number;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_promedio: number | null;
  imagen_url: string | null;
  activo: boolean;
  fecha_creacion: string;
  id_categoria: number;
  id_proveedor_principal: number | null;
  categoria: {
    id_categoria: number;
    nombre: string;
    tipo_categoria: string;
  } | null;
};

/** Datos (serán cargados desde la BD) */

const TABS = [
  { id: "todos", label: "Todos" },
  { id: "perpetuos", label: "Solo Perpetuos" },
  { id: "operativos", label: "Solo Operativos" },
] as const;
 
export default function Catalogo({ initialTab }: { initialTab?: 'todos' | 'perpetuos' | 'operativos' }) {
  // Valores y helpers mínimos necesarios para compilar y mantener funcionalidad básica
  const CATEGORIAS = ["Todas las categorías", "Carnes", "Vegetales", "Bebidas"];
  const UNIDADES: UnidadMedida[] = ['kg', 'litros', 'unidades'];
  type SortKey = 'stock' | 'ultimaActualizacion' | 'nombre' | 'tipo' | 'estado' | 'categoria';

  const [q, setQ] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'todos' | 'perpetuos' | 'operativos'>(initialTab ?? 'todos');
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [sortBy, setSortBy] = useState<SortKey>('nombre' as SortKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const uid = (pref = '') => `${pref}${Date.now().toString(36)}`;
  const slugify = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const formatStock = (n: number, unidad: UnidadMedida) => `${n} ${unidad}`;
  const formatDateHuman = (iso?: string) => (iso ? new Date(iso).toLocaleString('es-ES') : '—');

  const TipoBadge = ({ tipo }: { tipo: TipoInsumo }) => (
    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">{tipo}</span>
  );
  const EstadoPill = ({ estado }: { estado: EstadoStock }) => (
    <span className="px-2 py-0.5 rounded text-xs bg-gray-100">{estado}</span>
  );
 
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Datos (editable en memoria)
  const [rows, setRows] = useState<Fila[]>([]);
  const [categoriasBD, setCategoriasBD] = useState<Array<{ id_categoria: number; nombre: string }>>([]);
  const [proveedoresBD, setProveedoresBD] = useState<Array<{ id_proveedor: number; nombre_empresa: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos desde Supabase (directamente desde insumo con join a categoria_insumo)
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Cargar desde el backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/inventario/catalogo`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Error al cargar catálogo');

        const data = result.data || [];
        const mapped = data.map((i: CatalogoInsumoAPI) => {
          const categoriaData = i.categoria;
          const tipoCategoria = categoriaData?.tipo_categoria?.toLowerCase();
          const nombreCategoria = categoriaData?.nombre;

          // Determinar estado del stock
          const stockActual = i.stock_actual || 0;
          const stockMinimo = i.stock_minimo;
          let estado: EstadoStock = "OK";
          if (stockActual <= stockMinimo * 0.5) estado = "Crítico";
          else if (stockActual <= stockMinimo) estado = "Stock Bajo";

          return {
            id: String(i.id_insumo),
            nombre: i.nombre,
            tipo: (tipoCategoria === "operativo" ? ("Operativo" as TipoInsumo) : ("Perpetuo" as TipoInsumo)),
            stockCantidad: stockActual,
            unidad: (i.unidad_medida || "unidades") as UnidadMedida,
            estado,
            ultimaActualizacion: i.fecha_creacion || new Date().toISOString(),
            categoria: nombreCategoria || "—",
            descripcion: "",
            proveedor: undefined, // Se cargará después si es necesario
            costo: i.costo_promedio != null ? Number(i.costo_promedio) : undefined,
            ubicacion: undefined,
            activo: Boolean(i.activo),
            automatica: false,
            imagen: i.imagen_url || `/insumos/${slugify(i.nombre)}.png`,
            categoriaId: i.id_categoria,
            proveedorId: i.id_proveedor_principal,
          } as Fila;
        });

        if (mounted) setRows(mapped);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("Error cargando catálogo:", message);
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar categorías y proveedores para los selects del formulario
  useEffect(() => {
    let mounted = true;
    async function loadMeta() {
      try {
        const [catRes, provRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/inventario/categorias`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }).then(res => res.json()).then(data => data.data || []),
          fetch(`${import.meta.env.VITE_API_URL}/api/inventario/proveedores`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }).then(res => res.json()).then(data => data.data || []),
        ]);
        if (!mounted) return;
        setCategoriasBD((catRes ?? []) as Array<{ id_categoria: number; nombre: string }>);
        setProveedoresBD((provRes ?? []) as Array<{ id_proveedor: number; nombre_empresa: string }>);
      } catch (e) {
        console.error("Error cargando metadatos:", e);
      }
    }
    loadMeta();
    return () => { mounted = false; };
  }, []);

  // Helper: recargar insumos directamente desde la tabla 'insumo' (mapeo similar al fallback)
  async function fetchInsumosFromTable() {
    try {
      const { data: insData, error: insErr } = await supabase
        .from("insumo")
        .select(`
          id_insumo,
          nombre,
          unidad_medida,
          stock_actual,
          stock_minimo,
          costo_promedio,
          imagen_url,
          activo,
          fecha_creacion,
          id_categoria,
          id_proveedor_principal,
          categoria_insumo!inner(tipo_categoria, nombre)
        `)
        .order("nombre", { ascending: true });
      if (insErr) throw insErr;
      const toStr = (v: unknown) => (v == null ? "" : String(v));
      const toNum = (v: unknown) => {
        const n = Number(String(v ?? "0"));
        return Number.isFinite(n) ? n : 0;
      };
      const mapped = (insData ?? []).map((i: Record<string, unknown>) => {
        const categoriaData = i["categoria_insumo"] as { tipo_categoria?: string; nombre?: string } | null;
        const tipoCategoria = toStr(categoriaData?.tipo_categoria).toLowerCase();
        const nombreCategoria = toStr(categoriaData?.nombre);

        // Determinar estado del stock
        const stockActual = toNum(i["stock_actual"]);
        const stockMinimo = toNum(i["stock_minimo"]);
        let estado: EstadoStock = "OK";
        if (stockActual <= stockMinimo * 0.5) estado = "Crítico";
        else if (stockActual <= stockMinimo) estado = "Stock Bajo";

        return {
          id: toStr(i["id_insumo"]),
          nombre: toStr(i["nombre"]),
          tipo: (tipoCategoria === "operativo" ? ("Operativo" as TipoInsumo) : ("Perpetuo" as TipoInsumo)),
          stockCantidad: stockActual,
          unidad: (toStr(i["unidad_medida"]) || "unidades") as UnidadMedida,
          estado,
          ultimaActualizacion: toStr(i["fecha_creacion"]) || new Date().toISOString(),
          categoria: nombreCategoria || "—",
          descripcion: "",
          proveedor: (() => {
            const idProv = i["id_proveedor_principal"];
            const found = proveedoresBD.find((p) => p.id_proveedor === Number(idProv));
            return found ? found.nombre_empresa : undefined;
          })(),
          costo: i["costo_promedio"] != null ? Number(i["costo_promedio"]) : undefined,
          ubicacion: undefined,
          activo: Boolean(i["activo"]),
          automatica: false,
          imagen: toStr(i["imagen_url"]) || `/insumos/${slugify(toStr(i["nombre"]))}.png`,
          categoriaId: i["id_categoria"] != null ? Number(i["id_categoria"]) : undefined,
          proveedorId: i["id_proveedor_principal"] != null ? Number(i["id_proveedor_principal"]) : undefined,
        } as Fila;
      });
      setRows(mapped);
    } catch (e: unknown) {
      console.error("Error recargando insumos:", e);
    }
  }

  // Drawer
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // MODAL de detalle
  const [detail, setDetail] = useState<Fila | null>(null);
  const kardexRef = useRef<HTMLDivElement | null>(null);

  // Form
  const blankForm: Fila = {
    id: "",
    nombre: "",
    tipo: "Operativo",
    stockCantidad: 0,
    unidad: "kg",
    estado: "OK",
    ultimaActualizacion: new Date().toISOString(),
    categoria: CATEGORIAS[1],
    descripcion: "",
    proveedor: "",
    costo: undefined,
    ubicacion: "Bodega Principal",
    activo: true,
    automatica: false,
  };
  const [form, setForm] = useState<Fila>(blankForm);


  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Filtros + orden + paginado
  const filtered = useMemo(() => {
    let r = [...rows];
    if (activeTab === "perpetuos")  r = r.filter((x) => x.tipo === "Perpetuo");
    if (activeTab === "operativos") r = r.filter((x) => x.tipo === "Operativo");
    if (categoria !== "Todas las categorías") r = r.filter((x) => x.categoria === categoria);
    if (debouncedQ) {
      r = r.filter(
        (x) =>
          x.nombre.toLowerCase().includes(debouncedQ) ||
          x.categoria.toLowerCase().includes(debouncedQ) ||
          x.tipo.toLowerCase().includes(debouncedQ)
      );
    }
    // sort
    const getValue = (a: Fila, key: SortKey): number | string => {
      if (key === "stock") return a.stockCantidad;
      if (key === "ultimaActualizacion") return new Date(a.ultimaActualizacion).getTime();
      return a[key];
    };
    r.sort((a, b) => {
      const A = getValue(a, sortBy);
      const B = getValue(b, sortBy);
      const diff =
        typeof A === "number" && typeof B === "number"
          ? A - B
          : String(A).localeCompare(String(B));
      return sortDir === "asc" ? diff : -diff;
    });
    return r;
  }, [rows, activeTab, categoria, debouncedQ, sortBy, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [activeTab, categoria, debouncedQ, perPage]);

  // Aplicar initialTab solo una vez (no debe sobrescribir cambios del usuario)
  const initialApplied = useRef(false);
  useEffect(() => {
    if (!initialApplied.current && initialTab) {
      setActiveTab(initialTab);
      initialApplied.current = true;
    }
  }, [initialTab]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // CRUD
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...blankForm, id: uid("INS"), categoriaId: categoriasBD.length > 0 ? categoriasBD[0].id_categoria : undefined });
    setOpenDrawer(true);
  };
  const openEdit = (row: Fila) => {
    setEditingId(row.id);
    // intentar completar categoriaId/proveedorId si no vienen en la fila
    const cat = categoriasBD.find((c) => c.nombre === row.categoria);
    const prov = proveedoresBD.find((p) => p.nombre_empresa === (row.proveedor ?? ""));
    setForm({ ...row, categoriaId: row.categoriaId ?? (cat ? cat.id_categoria : undefined), proveedorId: row.proveedorId ?? (prov ? prov.id_proveedor : undefined) });
    setOpenDrawer(true);
  };
  const deleteRow = async (row: Fila) => {
    const ok = window.confirm(`¿Eliminar "${row.nombre}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    // Intentar borrar en la BD para mantener consistencia.
    // Nota: si la tabla tiene RLS/policies y la sesión no tiene permisos, la operación fallará.
    setLoading(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from('insumo').delete().eq('id_insumo', Number(row.id));
      if (delErr) throw delErr;
      // recargar
      await fetchInsumosFromTable();
    } catch (e: unknown) {
      console.error('Error eliminando insumo:', e);
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('forbidden') || message.toLowerCase().includes('policy')) {
        alert('Error eliminando insumo: permiso denegado. Si quieres que CRUD sea público, revisa las políticas RLS en Supabase o marca la tabla como accesible para el rol `authenticated`/público.\nDetalles: ' + message);
      } else {
        alert('Error eliminando insumo. Revisa la consola para más detalles.\n' + message);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
  if (!form.nombre.trim()) return alert("El nombre es obligatorio");
  if (categoriasBD.length > 0 && (form.categoriaId == null || form.categoriaId === undefined)) return alert("Seleccione una categoría");

    // Mapear campos del formulario a la estructura de la tabla `insumo`
    const payload: Record<string, unknown> = {
      nombre: form.nombre,
      unidad_medida: form.unidad,
      tipo_insumo: form.tipo.toLowerCase(),
      costo_promedio: form.costo ?? 0,
      activo: Boolean(form.activo),
      imagen_url: form.imagen ?? null,
    };
  // usar ids seleccionados si existen
  if (form.categoriaId != null) payload.id_categoria = form.categoriaId;
  if (form.proveedorId != null) payload.id_proveedor_principal = form.proveedorId;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Intentar la operación aunque no haya sesión; Supabase puede devolver error por RLS si corresponde
        if (editingId) {
          // actualizar
          const { error: upErr } = await supabase.from("insumo").update(payload).eq("id_insumo", Number(editingId));
          if (upErr) throw upErr;
        } else {
          const { data: insData, error: insErr } = await supabase.from("insumo").insert(payload).select("id_insumo, nombre").single();
          if (insErr) throw insErr;
          // si se creó, actualizar id del form
          if (insData && insData.id_insumo) setForm((f) => ({ ...f, id: String(insData.id_insumo) }));
        }
        // recargar listado desde la tabla para reflejar cambios
        await fetchInsumosFromTable();
        setOpenDrawer(false);
      } catch (e: unknown) {
        // Log the raw error for debugging
        console.error('Error guardando insumo - raw error:', e);
        let message: string;
        try {
          if (e instanceof Error) {
            message = e.message;
          } else if (e && typeof e === 'object') {
            // include non-enumerable props
            message = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
          } else {
            message = String(e);
          }
        } catch (stringifyErr) {
          console.error('Error stringifying error object:', stringifyErr);
          message = String(e);
        }
        console.error('Error guardando insumo (stringified):', message);
        setError(message);
        // Detecta errores comunes de RLS/permisos y sugiere pasos
        const lower = message.toLowerCase();
        if (lower.includes('forbidden') || lower.includes('permission') || lower.includes('policy')) {
          alert('Error de permisos al guardar insumo. Es posible que las políticas RLS impidan la operación con la sesión actual. Revisa roles/permisos en Supabase.\nDetalles: ' + message);
        } else {
          alert('Error guardando insumo. Revisa la consola para más detalles.\n' + message);
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  const setFormField = useCallback(<K extends keyof Fila>(key: K, value: Fila[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  /** Render */
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">CATÁLOGO DE INSUMOS</h2>
        <p className="text-sm text-gray-500">Vista completa de todos los insumos con diferenciación por tipo de control</p>
      </div>

      {/* Filtros y acciones */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2" role="tablist" aria-label="Filtros por tipo">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  activeTab === t.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <label className="sr-only" htmlFor="categoria">Categoría</label>
          <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
            >
              <option key="todas" value="Todas las categorías">Todas las categorías</option>
              {categoriasBD.map((c) => (
                <option key={c.id_categoria} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>

          <div className="relative">
            <label className="sr-only" htmlFor="search">Buscar</label>
            <input
              id="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar insumos…"
              className="h-10 w-64 rounded-lg border border-gray-200 bg-white pl-3 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <button onClick={() => { setActiveTab("todos"); setCategoria(CATEGORIAS[0]); setQ(""); }} className="h-10 rounded-lg border px-3 text-sm font-semibold hover:bg-gray-50">
            Limpiar filtros
          </button>

          <button onClick={openCreate} className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
            Agregar Insumo
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-sm text-gray-500">
              <tr className="border-b">
                <Th label="Nombre" onSort={() => toggleSort("nombre")} active={sortBy === "nombre"} dir={sortDir} />
                <Th label="Tipo" onSort={() => toggleSort("tipo")} active={sortBy === "tipo"} dir={sortDir} />
                <Th label="Stock Actual" onSort={() => toggleSort("stock")} active={sortBy === "stock"} dir={sortDir} />
                <Th label="Estado" onSort={() => toggleSort("estado")} active={sortBy === "estado"} dir={sortDir} />
                <Th label="Última Actualización" onSort={() => toggleSort("ultimaActualizacion")} active={sortBy === "ultimaActualizacion"} dir={sortDir} />
                <Th label="Categoría" onSort={() => toggleSort("categoria")} active={sortBy === "categoria"} dir={sortDir} />
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {pageData.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <img
                          src={r.imagen || "/img/icon.png"}
                          alt={r.nombre || "imagen de insumo"}
                          className="w-8 h-8 rounded-lg object-cover bg-emerald-100"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/img/icon.png"; }}
                        />
                      <div>
                        <div className="font-semibold leading-5 line-clamp-2">{r.nombre}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <TipoBadge tipo={r.tipo} />
                          <span className="text-gray-400">•</span>
                          <span>{r.automatica ? "Actualización automática" : "Conteo manual"}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top"><span className="whitespace-nowrap">{r.tipo}</span></td>
                  <td className="px-4 py-3 align-top"><span className="font-medium">{formatStock(r.stockCantidad, r.unidad)}</span></td>
                  <td className="px-4 py-3 align-top"><EstadoPill estado={r.estado} /></td>
                  <td className="px-4 py-3 align-top"><span>{formatDateHuman(r.ultimaActualizacion)}</span></td>
                  <td className="px-4 py-3 align-top">{r.categoria}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2 justify-end">
                      <IconBtn title="Ver" onClick={() => { setDetail(r); }}><PiEyeBold /></IconBtn>
                      <IconBtn title="Editar" onClick={() => openEdit(r)}><PiPencilSimpleBold /></IconBtn>
                      <IconBtn title="Eliminar" onClick={() => deleteRow(r)}><PiTrashBold /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="max-w-md mx-auto">
                      <div className="text-lg font-semibold text-gray-700">Sin resultados</div>
                      <p className="mt-1">Intenta ajustar los filtros o buscar otra palabra clave.</p>
                      <div className="mt-3">
                        <button onClick={() => { setActiveTab("todos"); setCategoria(CATEGORIAS[0]); setQ(""); }} className="text-sm font-semibold text-emerald-700 hover:underline">
                          Restablecer filtros
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer tabla */}
        <div className="px-4 py-3 text-sm text-gray-600 flex flex-wrap items-center gap-3 justify-between">
          <div>
            Mostrando <span className="font-semibold">{pageData.length}</span> de <span className="font-semibold">{total}</span> insumos
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-500 text-xs" htmlFor="perPage">Por página</label>
            <select
              id="perPage"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="h-9 rounded border border-gray-200 bg-white px-2 text-sm"
            >
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="flex items-center gap-1 ml-2">
              <button className="h-9 px-3 rounded border text-sm disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
              <span className="px-2 text-gray-500">{page} / {totalPages}</span>
              <button className="h-9 px-3 rounded border text-sm disabled:opacity-50" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer crear/editar */}
      <AnimatePresence>
        {openDrawer && (
          <motion.aside
            initial={{ x: 520, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 520, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 w-full md:max-w-[920px] bg-white shadow-2xl border-l border-gray-100"
            role="dialog"
            aria-modal="true"
          >
            <div className="h-14 px-5 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-base md:text-lg font-bold text-gray-800">
                {editingId ? "Editar Insumo" : "Crear Insumo"}
              </h3>
              <button onClick={() => setOpenDrawer(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Cerrar">
                <MdClose size={20} />
              </button>
            </div>

            <div className="h-[calc(100vh-56px)] grid grid-cols-1 lg:grid-cols-[1fr_360px]">
              {/* Formulario */}
              <form id="insumo-form" onSubmit={submitForm} className="overflow-y-auto p-5 md:p-6 lg:p-7 space-y-5">
                {/* Información Básica */}
                <section className="bg-white rounded-xl border border-gray-200/70 shadow-sm p-4 md:p-5">
                  <div className="text-sm font-bold text-gray-800 mb-4">Información Básica</div>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="nombre">Nombre del Insumo *</label>
                      <input id="nombre" value={form.nombre} onChange={(e) => setFormField("nombre", e.target.value)} placeholder="Ej: Carne de Res Premium" className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="categoriaSel">Categoría *</label>
                        <select id="categoriaSel" value={form.categoriaId ?? ""} onChange={(e) => setFormField("categoriaId", e.target.value === "" ? undefined : Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" required>
                          <option value="">Seleccione categoría</option>
                          {categoriasBD.length > 0 ? categoriasBD.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>) : CATEGORIAS.filter((c) => c !== "Todas las categorías").map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="unidad">Unidad de Medida</label>
                        <select id="unidad" value={form.unidad} onChange={(e) => setFormField("unidad", e.target.value as UnidadMedida)} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                          {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Stock Actual</label>
                        <div className="flex gap-2">
                          <input type="number" inputMode="decimal" id="stockCantidad" value={form.stockCantidad} onChange={(e) => setFormField("stockCantidad", Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                          <select value={form.unidad} onChange={(e) => setFormField("unidad", e.target.value as UnidadMedida)} className="h-11 rounded-lg border border-gray-200 px-2 text-sm">
                            {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                        <select value={form.estado} onChange={(e) => setFormField("estado", e.target.value as EstadoStock)} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                          {(["OK", "Stock Bajo", "Crítico"] as EstadoStock[]).map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Actualización</label>
                        <select value={form.automatica ? "auto" : "manual"} onChange={(e) => setFormField("automatica", e.target.value === "auto")} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                          <option value="manual">Conteo manual</option>
                          <option value="auto">Actualización automática</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Tipo de Insumo */}
                <section className="bg-white rounded-xl border border-gray-200/70 shadow-sm p-4 md:p-5">
                  <div className="text-sm font-bold text-gray-800 mb-4">Tipo de Insumo</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TipoCard title="Operativo" desc="Insumo básico que se compra y consume directamente. No requiere preparación adicional." examples="Ejemplos: Pan, Verduras, Aceite" active={form.tipo === "Operativo"} onClick={() => setFormField("tipo", "Operativo")} />
                    <TipoCard title="Perpetuo"  desc="Producto elaborado que se fabrica usando otros insumos. Requiere receta para su preparación." examples="Ejemplos: Shuco, Hamburguesa, Salsa Especial" active={form.tipo === "Perpetuo"}  onClick={() => setFormField("tipo", "Perpetuo")} />
                  </div>
                </section>

                {/* Información Adicional */}
                <section className="bg-white rounded-xl border border-gray-200/70 shadow-sm p-4 md:p-5">
                  <div className="text-sm font-bold text-gray-800 mb-4">Información Adicional</div>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="desc">Descripción</label>
                      <textarea id="desc" value={form.descripcion ?? ""} onChange={(e) => setFormField("descripcion", e.target.value)} className="w-full min-h-[110px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Proveedor Principal</label>
                        <select value={form.proveedorId ?? ""} onChange={(e) => setFormField("proveedorId", e.target.value === "" ? undefined : Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                          <option value="">Seleccionar proveedor</option>
                          {proveedoresBD.length > 0 ? proveedoresBD.map((p) => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_empresa}</option>) : (<>
                            <option value={1}>Carnes del Valle</option>
                            <option value={2}>La Bodeguita</option>
                          </>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Costo Promedio (Q)</label>
                        <input type="number" inputMode="decimal" value={form.costo ?? ""} onChange={(e) => setFormField("costo", e.target.value === "" ? undefined : Number(e.target.value))} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ubicación</label>
                        <select value={form.ubicacion ?? ""} onChange={(e) => setFormField("ubicacion", e.target.value)} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                          <option>Seleccionar ubicación</option>
                          <option>Bodega Principal</option>
                          <option>Cocina</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                        <select value={form.activo ? "Activo" : "Inactivo"} onChange={(e) => setFormField("activo", e.target.value === "Activo")} className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                          <option>Activo</option>
                          <option>Inactivo</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen del producto</label>
                      <div className="flex gap-3 items-center">
                        {form.imagen && (
                          <img src={form.imagen} alt="preview" className="h-16 w-16 object-cover rounded border" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const ext = file.name.split('.').pop();
                            const fileName = `insumo-${form.id}-${Date.now()}.${ext}`;
                            console.debug('producto file diagnostics:', {
                              name: file.name,
                              type: file.type,
                              size: file.size,
                              constructor: file?.constructor?.name,
                              toString: Object.prototype.toString.call(file),
                              isFile: file instanceof File,
                              isBlob: file instanceof Blob
                            });

                            // Read as ArrayBuffer and upload a Blob to ensure binary content
                            const arrayBuffer = await file.arrayBuffer();
                            const blob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });
                            const { data, error } = await supabase.storage.from('producto-img').upload(fileName, blob, { upsert: true, contentType: file.type });
                            if (error) {
                              console.error('Error subiendo imagen insumo:', error);
                              alert('Error subiendo imagen: ' + error.message);
                              return;
                            }
                            const uploadedPath = data?.path || fileName;
                            const publicUrl = supabase.storage.from('producto-img').getPublicUrl(uploadedPath).data.publicUrl;
                            console.debug('producto-img upload:', { fileName, uploadedPath, publicUrl, data });
                            setFormField('imagen', publicUrl);
                          }}
                          className="block"
                        />
                      </div>
                      <input value={form.imagen ?? ""} onChange={(e) => setFormField("imagen", e.target.value)} placeholder="https://.../imagen.png" className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 mt-2" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button type="submit" disabled={loading} className="h-11 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">
                        {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Crear Insumo"}
                      </button>
                      <button type="button" className="h-11 rounded-lg border px-4 text-sm font-semibold hover:bg-gray-50" onClick={() => setOpenDrawer(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </section>
                  {error && (
                    <div className="p-3 text-sm text-rose-700 bg-rose-50 rounded-md">Error: {error}</div>
                  )}
              </form>

              {/* Resumen */}
              <div className="hidden lg:block border-l border-gray-100 bg-gray-50/60">
                <div className="h-full overflow-y-auto">
                  <div className="sticky top-0 p-5">
                    <div className="bg-white rounded-xl border border-gray-200/70 shadow-sm p-5">
                      <div className="text-sm font-bold text-gray-800 mb-4">Resumen</div>
                      <div className="space-y-3 text-sm">
                        <ResumenRow label="ID del Insumo:">{form.id || "—"}</ResumenRow>
                        <ResumenRow label="Tipo:"><EstadoPill estado={form.estado} /></ResumenRow>
                        <ResumenRow label="Categoría:">{(form.categoriaId != null ? (categoriasBD.find(c => c.id_categoria === form.categoriaId)?.nombre) : form.categoria) || "No seleccionada"}</ResumenRow>
                        <ResumenRow label="Stock:">{formatStock(form.stockCantidad, form.unidad)}</ResumenRow>
                        <ResumenRow label="Actualización:">{form.automatica ? "Automática" : "Manual"}</ResumenRow>
                      </div>
                      <div className="mt-5 flex gap-3">
                        <button form="insumo-form" type="submit" className="h-10 flex-1 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
                          {editingId ? "Guardar" : "Crear"}
                        </button>
                        <button className="h-10 flex-1 rounded-lg border px-4 text-sm font-semibold hover:bg-gray-50" onClick={() => setOpenDrawer(false)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MODAL: Vista rápida de insumo */}
      <AnimatePresence>
        {detail && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              className="fixed inset-0 z-[60] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            {/* Modal */}
            <motion.div
              key="modal"
              className="fixed inset-0 z-[61] flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="insumo-detail-title"
            >
              <div className="w-full max-w-6xl min-h-[620px] rounded-2xl bg-white shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between px-5 h-14 border-b">
                  <h3 id="insumo-detail-title" className="text-lg font-bold text-gray-800">
                    {detail.nombre}
                  </h3>
                  <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setDetail(null)} aria-label="Cerrar">
                    <MdClose size={20} />
                  </button>
                </div>

                <div className="p-6 space-y-6 max-h-[78vh] overflow-auto">
                  {/* Header info */}
                  <div className="flex flex-wrap items-center gap-2">
                      <img
                        src={detail.imagen ?? "/insumos/_placeholder.svg"}
                        alt={detail.nombre}
                        className="h-28 w-28 object-contain"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/insumos/_placeholder.svg"; }}
                      />
                    <TipoBadge tipo={detail.tipo} />
                    <EstadoPill estado={detail.estado} />
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {detail.automatica ? "Actualización automática" : "Conteo manual"}
                    </span>
                  </div>

                  {/* Grid detalle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <DetailRow label="Categoría" value={detail.categoria} />
                    <DetailRow label="Stock" value={formatStock(detail.stockCantidad, detail.unidad)} />
                    <DetailRow label="Última actualización" value={formatDateHuman(detail.ultimaActualizacion)} />
                    <DetailRow label="Unidad" value={detail.unidad} />
                    <DetailRow label="Proveedor" value={detail.proveedor ?? "—"} />
                    <DetailRow label="Ubicación" value={detail.ubicacion ?? "—"} />
                    <DetailRow label="Costo Promedio (Q)" value={detail.costo != null ? String(detail.costo) : "—"} />
                    <DetailRow label="Estado" value={detail.activo ? "Activo" : "Inactivo"} />
                  </div>

                  {detail.descripcion && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Descripción</div>
                      <p className="text-sm text-gray-700">{detail.descripcion}</p>
                    </div>
                  )}

                  {/* Kárdex incrustado dentro del modal de detalle */}
                  <div ref={kardexRef}>
                    <div className="text-sm font-semibold text-gray-700 mt-2 mb-2">Historial de Movimientos (Kárdex)</div>
                    <div className="border rounded-lg p-3 bg-white">
                      <Kardex id_insumo={Number(detail.id)} onClose={() => setDetail(null)} />
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
                  <button className="h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-gray-50" onClick={() => setDetail(null)}>
                    Cerrar
                  </button>
                  <button className="h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-gray-50" onClick={() => {
                    if (kardexRef?.current) kardexRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}>
                    Kárdex
                  </button>
                  <button className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600" onClick={() => { setDetail(null); openEdit(detail); }}>
                    Editar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
    </div>
  );
}

/** Subcomponentes */
function Th({ label, onSort, active, dir }: { label: string; onSort: () => void; active?: boolean; dir?: "asc" | "desc" }) {
  return (
    <th className="px-4 py-3 font-medium select-none">
      <button type="button" onClick={onSort} className="inline-flex items-center gap-1 text-left hover:underline" aria-label={`Ordenar por ${label}`}>
        <span>{label}</span>
        {active ? (dir === "asc" ? <PiArrowUpBold className="opacity-70" /> : <PiArrowDownBold className="opacity-70" />) : null}
      </button>
    </th>
  );
}
function ResumenRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 max-w-[55%] text-right truncate">{children}</span>
    </div>
  );
}
function TipoCard({ title, desc, examples, active, onClick }: { title: string; desc: string; examples: string; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`text-left rounded-xl p-4 border transition w-full ${active ? "border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/40" : "border-gray-200 hover:border-gray-300"}`}>
      <div className="font-semibold text-gray-800 mb-1">{title}</div>
      <p className="text-sm text-gray-600 mb-2">{desc}</p>
      <span className="inline-block rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{examples}</span>
    </button>
  );
}
function IconBtn({ title, children, onClick }: { title: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button title={title} onClick={onClick} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" type="button" aria-label={title}>
      {children}
    </button>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

