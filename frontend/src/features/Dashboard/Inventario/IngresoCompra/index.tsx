import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";
import {
  PiEyeBold, PiTrashBold,
  PiSpinnerBold, PiFloppyDiskBold, PiPlusBold, PiPackageBold, PiPencilSimpleBold
} from "react-icons/pi";
import { fetchProveedores, fetchOrdenesCompra } from "../../../../api/inventarioService";

/* =============== Tipos API =============== */
type ProveedorAPI = {
  id_proveedor: number;
  nombre_empresa: string;
  nombre_contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  estado: boolean;
  metodo_entrega?: string | null;
  es_preferido?: boolean;
};

type OrdenCompraAPI = {
  id_orden: number;
  fecha_orden: string;
  id_proveedor: number;
  estado: string;
  tipo_orden?: string | null;
  motivo_generacion?: string | null;
  fecha_aprobacion?: string | null;
  subtotal: number;
  iva: number;
  tipo_pago?: string | null;
};
type Proveedor = {
  id_proveedor: number;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  activo: boolean;
  es_preferido: boolean;
  dias_entrega?: string | null;
  tiempo_entrega_promedio?: number | null;
  metodo_entrega?: string | null;
};

export type Orden = {
  id_orden: string;
  numero_orden: string | null;
  fecha: string | null;
  id_proveedor?: number | null;
  proveedor?: { nombre: string } | null;
  total?: number | null;
  estado?: string | null;
  items_count?: number | null;
};

export type Item = {
  id: string;
  id_insumo?: number | null;
  descripcion: string;
  qty: number;
  precio: number;
};

type InsumoRow = {
  id_insumo: number;
  nombre: string;
  costo_promedio?: number | null;
  unidad_medida_compra?: string | null;
};

type FormProveedor = {
  id_proveedor?: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  activo: boolean;
  es_preferido: boolean;
  dias_entrega: string | null;
  tiempo_entrega_promedio: number | null;
  metodo_entrega: string | null;
};

/* =============== SEED (Local) - REMOVIDO: Ahora usa datos dinámicos =============== */

const INSUMOS_SEED_COMPRAS: InsumoRow[] = [
  { id_insumo: 1, nombre: "Pan para Shuco", costo_promedio: 1.5, unidad_medida_compra: "u" },
  { id_insumo: 2, nombre: "Carne Asada (libra)", costo_promedio: 35, unidad_medida_compra: "lb" },
  { id_insumo: 3, nombre: "Chorizo", costo_promedio: 4, unidad_medida_compra: "u" },
  { id_insumo: 4, nombre: "Torta de Hamburguesa", costo_promedio: 6, unidad_medida_compra: "u" },
  { id_insumo: 5, nombre: "Queso (libra)", costo_promedio: 22, unidad_medida_compra: "lb" },
  { id_insumo: 6, nombre: "Coca Cola (lata)", costo_promedio: 3, unidad_medida_compra: "u" },
  { id_insumo: 7, nombre: "Papas (libra)", costo_promedio: 5, unidad_medida_compra: "lb" },
  { id_insumo: 8, nombre: "Aceite Vegetal (Litro)", costo_promedio: 18, unidad_medida_compra: "lt" },
  { id_insumo: 9, nombre: "Servilletas (Paquete 100u)", costo_promedio: 10, unidad_medida_compra: "paq" },
];

/* =============== Utiles =============== */
const INPUT_CLS =
  "w-full h-11 rounded-lg border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-100 disabled:text-gray-500";

const fmtQ = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(n);
const fmtDate = (s?: string | null) => (s ? new Date(s + "T00:00:00").toLocaleDateString("es-GT") : "—");

/* =========================================================================
 * DrawerRight (estilo Ventas)
 * ========================================================================= */
const DrawerRight: React.FC<React.PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  widthClass?: string;
  title?: string;
}>> = ({ open, onClose, widthClass = "w-full sm:w-[520px]", title, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[2000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.24 }}
            className={`absolute right-0 top-0 h-full bg-white shadow-2xl ${widthClass} flex flex-col z-[2001]`}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-800">{title}</div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Cerrar">✕</button>
            </div>
            <div className="flex-1 overflow-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* =============== Pastillas (rojo/verde) =============== */
function Pill({ tone, children }: { tone: "green" | "red"; children: React.ReactNode }) {
  const c = tone === "green"
    ? { bg: "bg-emerald-50", text: "text-emerald-800", br: "border-emerald-200", dot: "bg-emerald-600" }
    : { bg: "bg-rose-50",    text: "text-rose-800",    br: "border-rose-200",    dot: "bg-rose-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${c.bg} ${c.text} ${c.br} px-3 py-1 text-sm font-semibold`}>
      <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
      {children}
    </span>
  );
}
function OrderState({ estado }: { estado?: string | null }) {
  const v = (estado || "").toLowerCase();
  const label = v.includes("aprob") ? "Aprobada" : v.includes("recib") ? "Recibida" : v.includes("cancel") ? "Cancelada" : "Pendiente";
  const tone: "green" | "red" = label === "Aprobada" || label === "Recibida" ? "green" : "red";
  return <Pill tone={tone}>{label}</Pill>;
}
function ProviderState({ active }: { active?: boolean | null }) {
  return <Pill tone={active ? "green" : "red"}>{active ? "Activo" : "Inactivo"}</Pill>;
}

/* =============== Componente de Paginación =============== */
function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-4 py-3 bg-gray-50 rounded-lg">
      {/* Información de registros */}
      <div className="text-sm text-gray-600">
        Mostrando {totalItems === 0 ? 0 : startItem} - {endItem} de {totalItems} registros
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-4">
        {/* Selector de registros por página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 px-2 text-sm border border-gray-300 rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        {/* Controles de navegación */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages || 1}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============== Botones chicos =============== */
function IconBtn({ children, onClick, title, style }: { children: React.ReactNode; onClick?: () => void; title?: string; style?: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={style}
      className="p-2 rounded-lg hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
    >
      {children}
    </button>
  );
}
/* Tabs VERDES como en Ventas */
function TabButton({ active, onClick, label }: { active?: boolean; onClick?: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-4 py-2 rounded-xl text-base font-semibold whitespace-nowrap border transition " +
        (active
          ? "bg-emerald-600 text-white border-emerald-600 shadow"
          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100")
      }
    >
      {label}
    </button>
  );
}

/* =============== Componente Principal =============== */
export default function IngresoCompra(): JSX.Element {
  const [rows, setRows] = useState<Orden[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [allProveedores, setAllProveedores] = useState<Proveedor[]>([]); // Para el filtro dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de confirmación de eliminación de proveedor
  const [deleteProviderModal, setDeleteProviderModal] = useState<{ open: boolean; provider: Proveedor | null }>({ open: false, provider: null });

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [proveedoresData, ordenesData] = await Promise.all([
          fetchProveedores(),
          fetchOrdenesCompra()
        ]);

        // Transformar datos de proveedores para que coincidan con el tipo esperado
        const proveedoresFormatted = proveedoresData.map((prov: ProveedorAPI) => ({
          id_proveedor: prov.id_proveedor,
          nombre: prov.nombre_empresa,
          contacto: prov.nombre_contacto,
          telefono: prov.telefono,
          correo: prov.correo,
          direccion: prov.direccion,
          activo: prov.estado,
          es_preferido: prov.es_preferido ?? false,
          dias_entrega: null,
          tiempo_entrega_promedio: null,
          metodo_entrega: prov.metodo_entrega
        }));

        // Transformar datos de órdenes de compra
        const ordenesFormatted = ordenesData.map((orden: OrdenCompraAPI) => {
          const proveedorEncontrado = proveedoresFormatted.find((p: FormProveedor) => p.id_proveedor === orden.id_proveedor);
          return {
            id_orden: orden.id_orden.toString(),
            numero_orden: `OC-${orden.id_orden}`,
            fecha: orden.fecha_orden,
            id_proveedor: orden.id_proveedor,
            proveedor: proveedorEncontrado ? { nombre: proveedorEncontrado.nombre } : null,
            total: orden.subtotal + orden.iva,
            estado: orden.estado,
            items_count: 0 // Calcular si es necesario
          };
        });

        setProveedores(proveedoresFormatted);
        setAllProveedores(proveedoresFormatted); // Para el dropdown de filtro
        setRows(ordenesFormatted);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtros órdenes
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("Todas");
  const [selectedProveedorIdFilter, setSelectedProveedorIdFilter] = useState<string>("Todos");

  // Filtros proveedores
  const [providerQ, setProviderQ] = useState<string>("");
  const [providerActivoFilter, setProviderActivoFilter] = useState<"all" | "activo" | "inactivo">("all");
  const [providerPreferidoFilter, setProviderPreferidoFilter] = useState<"all" | "si" | "no">("all");

  // Paginación proveedores
  const [providerPage, setProviderPage] = useState(1);
  const [providerPageSize, setProviderPageSize] = useState(5);

  // Paginación órdenes
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(5);

  // Drawer orden
  const [openDrawer, setOpenDrawer] = useState(false);
  const [detail, setDetail] = useState<Orden | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  // Hook de navegación
  const navigate = useNavigate();

  // Drawer proveedor
  const [openProvDrawer, setOpenProvDrawer] = useState(false);
  const [provDetail, setProvDetail] = useState<Proveedor | null>(null);

  // Bloquea scroll al abrir drawers
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = (openDrawer || openProvDrawer) ? "hidden" : "";
    return () => { document.body.style.overflow = prev || ""; };
  }, [openDrawer, openProvDrawer]);

  // Reset paginación cuando cambian filtros
  useEffect(() => {
    setProviderPage(1);
  }, [providerQ, providerActivoFilter, providerPreferidoFilter]);

  // Reset filtros de proveedores cuando se filtra por proveedor en órdenes
  useEffect(() => {
    if (selectedProveedorIdFilter !== "Todos") {
      setProviderQ("");
      setProviderActivoFilter("all");
      setProviderPreferidoFilter("all");
    }
  }, [selectedProveedorIdFilter]);

  useEffect(() => {
    setOrderPage(1);
  }, [q, status, selectedProveedorIdFilter]);

  /* ---- Filtrados ---- */
  const filteredOrders = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "Todas") {
        const estadoOrden = (r.estado || "pendiente").toLowerCase();
        const filtroEstado = status.toLowerCase();
        if (filtroEstado === "pendiente" && (estadoOrden.includes("aprob") || estadoOrden.includes("recib") || estadoOrden.includes("cancel"))) return false;
        if (filtroEstado !== "pendiente" && !estadoOrden.includes(filtroEstado)) return false;
      }
      if (selectedProveedorIdFilter !== "Todos" && String(r.id_proveedor ?? "") !== selectedProveedorIdFilter) return false;
      if (!ql) return true;
      const numOrden = `${r.numero_orden ?? ""}`.toLowerCase();
      const provNombre = `${r.proveedor?.nombre ?? ""}`.toLowerCase();
      return numOrden.includes(ql) || provNombre.includes(ql);
    });
  }, [rows, q, status, selectedProveedorIdFilter]);

  const counts = useMemo(() => {
    const acc = { Pendiente: 0, Aprobada: 0, Recibida: 0, Cancelada: 0 } as Record<string, number>;
    rows.forEach((r) => {
      const s = (r.estado || "").toLowerCase();
      if (s.includes("aprob")) acc.Aprobada++;
      else if (s.includes("recib")) acc.Recibida++;
      else if (s.includes("cancel")) acc.Cancelada++;
      else acc.Pendiente++;
    });
    return acc;
  }, [rows]);

  const filteredProviders = useMemo(() => {
    return proveedores
      .filter((p) => {
        const searchTerm = providerQ.toLowerCase();
        const nombreEmpresa = (p.nombre || "").toLowerCase();
        const nombreContacto = (p.contacto || "").toLowerCase();
        return nombreEmpresa.includes(searchTerm) || nombreContacto.includes(searchTerm);
      })
      .filter((p) => (providerActivoFilter === "all" ? true : providerActivoFilter === "activo" ? p.activo : !p.activo))
      .filter((p) => (providerPreferidoFilter === "all" ? true : providerPreferidoFilter === "si" ? p.es_preferido : !p.es_preferido));
  }, [proveedores, providerQ, providerActivoFilter, providerPreferidoFilter]);

  // Ajustar página si excede el límite
  useEffect(() => {
    const maxPages = Math.ceil(filteredProviders.length / providerPageSize);
    if (providerPage > maxPages && maxPages > 0) {
      setProviderPage(maxPages);
    }
  }, [filteredProviders.length, providerPageSize, providerPage]);

  useEffect(() => {
    const maxPages = Math.ceil(filteredOrders.length / orderPageSize);
    if (orderPage > maxPages && maxPages > 0) {
      setOrderPage(maxPages);
    }
  }, [filteredOrders.length, orderPageSize, orderPage]);

  // Datos paginados proveedores
  const paginatedProviders = useMemo(() => {
    const startIndex = (providerPage - 1) * providerPageSize;
    return filteredProviders.slice(startIndex, startIndex + providerPageSize);
  }, [filteredProviders, providerPage, providerPageSize]);

  // Datos paginados órdenes
  const paginatedOrders = useMemo(() => {
    const startIndex = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(startIndex, startIndex + orderPageSize);
  }, [filteredOrders, orderPage, orderPageSize]);

  /* ---- Acciones Proveedores ---- */
  const openViewProvider = (p: Proveedor) => { setProvDetail(p); setOpenProvDrawer(true); };
  const deleteProvider = (p: Proveedor) => {
    setDeleteProviderModal({ open: true, provider: p });
  };

  const confirmDeleteProvider = useCallback(() => {
    if (!deleteProviderModal.provider) return;
    setProveedores((prev) => prev.filter(x => x.id_proveedor !== deleteProviderModal.provider!.id_proveedor));
    setAllProveedores((prev) => prev.filter(x => x.id_proveedor !== deleteProviderModal.provider!.id_proveedor));
    setDeleteProviderModal({ open: false, provider: null });
  }, [deleteProviderModal.provider]);

  /* ---- Helpers Drawer Órdenes ---- */
  const openNewOrder  = () => { setDetail(null); setReadOnly(false); setOpenDrawer(true); };
  const openViewOrder = (r: Orden) => { setDetail(r);  setReadOnly(true);  setOpenDrawer(true); };
  const openRecepcionMercaderia = () => {
    navigate('/inventario/recepcion-mercaderia');
  };

  return (
    <div className="w-full p-6 lg:p-8 space-y-8">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <PiSpinnerBold className="animate-spin text-2xl text-emerald-600 mr-2" />
          <span className="text-lg text-gray-600">Cargando datos...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* ===================== Proveedores ===================== */}
          <section>
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Proveedores</h3>
            <p className="text-sm text-gray-500">Administra proveedores (ver detalles e insumos relacionados).</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50 text-gray-700 font-medium">
              ← Regresar
            </button>
          </div>
        </div>

        {/* Filtros de Proveedores */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <input
              value={providerQ}
              onChange={(e) => setProviderQ(e.target.value)}
              placeholder="Buscar proveedor..."
              className="h-11 rounded-lg border border-gray-200 px-3 text-base bg-white md:col-span-2"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Estado:</label>
              <select
                value={providerActivoFilter}
                onChange={(e) => setProviderActivoFilter(e.target.value as "all"|"activo"|"inactivo")}
                className="h-11 rounded-lg border border-gray-200 px-3 text-base bg-white"
              >
                <option value="all">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Preferido:</label>
              <select
                value={providerPreferidoFilter}
                onChange={(e) => setProviderPreferidoFilter(e.target.value as "all"|"si"|"no")}
                className="h-11 rounded-lg border border-gray-200 px-3 text-base bg-white"
              >
                <option value="all">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla Proveedores (agrandada + verde) */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="text-left text-gray-700 bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3.5 font-semibold">Nombre</th>
                  <th className="px-4 py-3.5 font-semibold">Contacto</th>
                  <th className="px-4 py-3.5 font-semibold">Teléfono</th>
                  <th className="px-4 py-3.5 font-semibold">Estado</th>
                  <th className="px-4 py-3.5 font-semibold">Preferido</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 leading-7">
                {filteredProviders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 italic">No se encontraron proveedores.</td></tr>
                )}
                {paginatedProviders.map((p) => (
                  <tr key={p.id_proveedor} className="hover:bg-gray-50">
                    <td className="px-4 py-3.5 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3.5">{p.contacto || "—"}</td>
                    <td className="px-4 py-3.5">{p.telefono || "—"}</td>
                    <td className="px-4 py-3.5"><ProviderState active={p.activo} /></td>
                    <td className="px-4 py-3.5">{p.es_preferido ? "⭐ Sí" : "No"}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconBtn title="Ver" onClick={() => openViewProvider(p)}><PiEyeBold /></IconBtn>
                        <IconBtn title="Editar" onClick={() => navigate(`/inventario?tab=catalogo&editProveedor=${p.id_proveedor}`)} style={{ color: '#7c3aed' }}>
                          <PiPencilSimpleBold />
                        </IconBtn>
                        <IconBtn title="Eliminar" onClick={() => deleteProvider(p)}><PiTrashBold className="text-rose-600" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación proveedores */}
          {filteredProviders.length > 0 && (
            <PaginationControls
              currentPage={providerPage}
              totalItems={filteredProviders.length}
              pageSize={providerPageSize}
              onPageChange={setProviderPage}
              onPageSizeChange={(size) => {
                setProviderPageSize(size);
                setProviderPage(1); // Reset to first page when changing page size
              }}
            />
          )}
        </div>
      </section>

      <hr className="my-8 border-gray-200" />

      {/* ===================== Órdenes de Compra ===================== */}
      <section>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Órdenes de Compra</h3>
            <p className="text-sm text-gray-500">Historial y alta de órdenes.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openNewOrder}
              className="h-11 rounded-xl bg-emerald-600 px-4 text-base font-semibold text-white hover:bg-emerald-700 flex items-center gap-2"
            >
              <PiPlusBold /> Nueva Orden
            </button>
            <button
              onClick={openRecepcionMercaderia}
              className="h-11 rounded-xl px-4 text-base font-semibold text-white hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: '#346c60' }}
            >
              <PiPackageBold /> Recepción Mercadería
            </button>
          </div>
        </div>

        {/* Filtros Órdenes */}
        <div className="bg-white rounded-2xl shadow p-5 mb-5 flex flex-col gap-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-medium text-gray-700 mr-2">Estado:</span>
            {["Todas", ...Object.keys(counts)].map((estadoKey) => {
              const count = estadoKey === "Todas" ? rows.length : counts[estadoKey] ?? 0;
              const label = estadoKey === "Todas" ? `Todas (${count})` : `${estadoKey} (${count})`;
              if (estadoKey !== "Todas" && count === 0 && status !== estadoKey) return null;
              return <TabButton key={estadoKey} active={status === estadoKey} onClick={() => setStatus(estadoKey)} label={label} />;
            })}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="filtroProveedorOrden" className="text-base font-medium text-gray-700 whitespace-nowrap">Proveedor:</label>
              <select
                id="filtroProveedorOrden"
                value={selectedProveedorIdFilter}
                onChange={(e) => setSelectedProveedorIdFilter(e.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-base text-gray-800 flex-grow sm:w-64"
              >
                <option value="Todos">Todos</option>
                {allProveedores.map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="relative sm:ml-auto w-full sm:w-auto">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar N° Orden / Proveedor..."
                className="h-11 w-full sm:w-80 rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-base"
              />
            </div>
            <button
              onClick={() => { setQ(""); setStatus("Todas"); setSelectedProveedorIdFilter("Todos"); }}
              className="h-11 rounded-lg border px-4 text-base font-semibold text-gray-700 hover:bg-gray-100 flex-shrink-0"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Tabla Órdenes (más grande y SOLO 👁️) */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-lg">
              <thead className="text-left text-gray-700 bg-gray-50">
                <tr className="border-b">
                  <th className="px-5 py-4 font-semibold">N° Orden</th>
                  <th className="px-5 py-4 font-semibold">Fecha</th>
                  <th className="px-5 py-4 font-semibold">Proveedor</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold text-right">Total</th>
                  <th className="px-5 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 leading-[2.1rem]">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400 italic">No se encontraron órdenes.</td></tr>
                ) : (
                  paginatedOrders.map((r) => (
                    <tr key={r.id_orden} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-semibold text-gray-900">{r.numero_orden ?? r.id_orden}</td>
                      <td className="px-5 py-4 text-gray-800">{fmtDate(r.fecha)}</td>
                      <td className="px-5 py-4 text-gray-800">{r.proveedor?.nombre ?? <span className="italic text-gray-400">N/A</span>}</td>
                      <td className="px-5 py-4"><OrderState estado={r.estado} /></td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">{fmtQ(r.total)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <button onClick={() => openViewOrder(r)} title="Ver" className="p-2.5 rounded-lg hover:bg-emerald-50 text-gray-700 hover:text-emerald-700">
                            <PiEyeBold className="w-6 h-6" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación órdenes */}
          {filteredOrders.length > 0 && (
            <PaginationControls
              currentPage={orderPage}
              totalItems={filteredOrders.length}
              pageSize={orderPageSize}
              onPageChange={setOrderPage}
              onPageSizeChange={(size) => {
                setOrderPageSize(size);
                setOrderPage(1); // Reset to first page when changing page size
              }}
            />
          )}
        </div>
      </section>
        </>
      )}

      {/* Drawer: Orden */}
      <DrawerRight
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        title={detail ? (readOnly ? "Ver Orden de Compra" : "Editar Orden de Compra") : "Nueva Orden de Compra"}
        widthClass="w-full md:w-[700px] lg:w-[920px]"
      >
        <div className="flex-1">
          <PurchaseOrderForm
            detail={detail}
            readOnly={readOnly}
            onClose={() => { setOpenDrawer(false); setDetail(null); setReadOnly(false); }}
            setRows={setRows}
            proveedores={proveedores}
          />
        </div>
      </DrawerRight>

      {/* Modal: Proveedor */}
      {openProvDrawer && provDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Ver Proveedor</h2>
              <button onClick={() => setOpenProvDrawer(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <ProviderInsumosModal id_proveedor={provDetail.id_proveedor} proveedorData={provDetail} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de proveedor */}
      {deleteProviderModal.open && deleteProviderModal.provider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <PiTrashBold className="text-rose-600 text-2xl mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el proveedor <strong>"{deleteProviderModal.provider.nombre}"</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteProviderModal({ open: false, provider: null })}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProvider}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ======================================================================
 * ===== Formulario de Orden de Compra =====
 * ====================================================================== */
function PurchaseOrderForm({
  detail, readOnly, onClose, setRows, proveedores
}: {
  detail: Orden | null;
  readOnly: boolean;
  onClose: () => void;
  setRows: React.Dispatch<React.SetStateAction<Orden[]>>;
  proveedores: Proveedor[];
}) {
  const [selectedProveedorId, setSelectedProveedorId] = useState<string>(String(detail?.id_proveedor ?? ""));
  const [fecha, setFecha] = useState<string>(detail?.fecha ? String(detail.fecha).slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState<string>("");
  const [items, setItems] = useState<Item[]>([{ id: crypto.randomUUID(), descripcion: "Item de ejemplo", qty: 1, precio: 10 }]);
  const [saving, setSaving] = useState(false);
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

  useEffect(() => {
    if (detail?.id_orden) {
      const mock: Item[] =
        detail.id_orden === "oc1"
          ? [
              { id: crypto.randomUUID(), id_insumo: 1, descripcion: "Pan para Shuco", qty: 50, precio: 1.5 },
              { id: crypto.randomUUID(), id_insumo: 7, descripcion: "Papas (libra)", qty: 10, precio: 5 },
            ]
          : [{ id: crypto.randomUUID(), descripcion: "Otro item", qty: 2, precio: 25 }];
      setItems(mock);
      setSelectedProveedorId(String(detail.id_proveedor ?? ""));
      setFecha(detail.fecha ? String(detail.fecha).slice(0, 10) : new Date().toISOString().slice(0, 10));
    } else {
      setItems([{ id: crypto.randomUUID(), descripcion: "", qty: 1, precio: 0 }]);
      setNota("");
      setSelectedProveedorId("");
      setFecha(new Date().toISOString().slice(0, 10));
    }
  }, [detail]);

  const subtotal = useMemo(() => items.reduce((acc, it) => acc + (it.qty * it.precio || 0), 0), [items]);
  const iva = useMemo(() => +(subtotal * 0.12).toFixed(2), [subtotal]);
  const total = useMemo(() => +(subtotal + iva).toFixed(2), [subtotal, iva]);

  async function generateOrderNumber(targetDate: string): Promise<string> {
    const y = new Date(targetDate || new Date()).getFullYear();
    const randomNum = String(Math.floor(Math.random() * 900) + 100);
    return `OC-${y}-${randomNum}`;
  }

  const handleSave = async (status: "Pendiente" | "Aprobada") => {
    if (!selectedProveedorId) return alert("Por favor, selecciona un proveedor.");
    if (!fecha) return alert("Por favor, ingresa una fecha.");
    if (items.length === 0 || items.every((it) => !(it.descripcion || "").trim() && !it.id_insumo)) return alert("Agrega al menos un ítem válido.");

    setSaving(true);
    let numeroFinal = detail?.numero_orden || "";
    if (!detail && !numeroFinal) numeroFinal = await generateOrderNumber(fecha);
    const provData = proveedores.find((p) => String(p.id_proveedor) === selectedProveedorId);

    const saved: Orden = {
      id_orden: detail?.id_orden || `tmp-${Date.now()}`,
      numero_orden: numeroFinal || null,
      fecha,
      id_proveedor: selectedProveedorId ? Number(selectedProveedorId) : null,
      proveedor: provData ? { nombre: provData.nombre } : undefined,
      total,
      estado: status,
      items_count: items.length,
    };
    await new Promise((res) => setTimeout(res, 600));
    setRows((prev) => (detail ? prev.map((r) => (r.id_orden === detail.id_orden ? saved : r)) : [saved, ...prev]));
    setSaving(false);
    onClose();
  };

  const addItem = () => {
    const id = crypto.randomUUID();
    setItems((p) => [...p, { id, descripcion: "", qty: 1, precio: 0 }]);
    setFocusRowId(id);
  };
  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const updateItem = (id: string, patch: Partial<Item>) => setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const canSave = !readOnly && !!fecha && !!selectedProveedorId && items.length > 0 && items.some((it) => (it.descripcion || "").trim() || it.id_insumo);

  return (
    <>
      <form className="p-6 lg:p-7 space-y-6" onSubmit={(e) => e.preventDefault()}>
      {/* Proveedor/Fecha/Número */}
      <section className="bg-gray-50 rounded-xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="proveedorSelectForm" className="block text-xs font-semibold text-gray-600 mb-1">Proveedor *</label>
          <select id="proveedorSelectForm" value={selectedProveedorId} onChange={(e) => setSelectedProveedorId(e.target.value)} disabled={readOnly} required className={INPUT_CLS}>
            <option value="" disabled>Selecciona...</option>
            {proveedores.map((p) => (<option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="fechaInputForm" className="block text-xs font-semibold text-gray-600 mb-1">Fecha *</label>
          <input id="fechaInputForm" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={readOnly} required className={INPUT_CLS} />
        </div>
        <div>
          <label htmlFor="numeroOrdenInputForm" className="block text-xs font-semibold text-gray-600 mb-1">N° Orden</label>
          <input id="numeroOrdenInputForm" value={detail?.numero_orden || ""} readOnly disabled className={`${INPUT_CLS} bg-gray-100 text-gray-500`} placeholder="(Automático)" />
        </div>
      </section>

      {/* Detalle */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-gray-800">Detalle de la Orden</h4>
          {!readOnly && (
            <button type="button" onClick={addItem} className="h-10 rounded-lg border px-3 text-base font-semibold hover:bg-gray-50 flex items-center gap-2">
              <PiPlusBold /> Agregar producto
            </button>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-base">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 text-left font-semibold">Descripción / Insumo</th>
                <th className="p-3 text-right font-semibold w-28">Cant.</th>
                <th className="p-3 text-right font-semibold w-36">P. Unit.</th>
                <th className="p-3 text-right font-semibold w-36">Subtotal</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="p-2 align-top">
                    <InsumoSearch
                      disabled={readOnly}
                      value={it.descripcion}
                      onChangeText={(t) => updateItem(it.id, { descripcion: t, id_insumo: undefined })}
                      onSelect={(opt) => updateItem(it.id, { id_insumo: opt.id_insumo, descripcion: opt.nombre, precio: opt.costo_promedio ?? it.precio })}
                      insumosSeed={INSUMOS_SEED_COMPRAS}
                      autoFocus={focusRowId === it.id}
                    />
                  </td>
                  <td className="p-2 align-top text-right">
                    <input disabled={readOnly} type="number" min={1} step={1} value={it.qty} onChange={(e) => updateItem(it.id, { qty: Number(e.target.value) || 1 })} className={`${INPUT_CLS} text-right`} />
                  </td>
                  <td className="p-2 align-top text-right">
                    <input disabled={readOnly} type="number" min={0} step={0.01} value={it.precio} onChange={(e) => updateItem(it.id, { precio: Number(e.target.value) || 0 })} className={`${INPUT_CLS} text-right`} />
                  </td>
                  <td className="p-2 align-top text-right font-semibold text-gray-800">{fmtQ(it.qty * it.precio)}</td>
                  <td className="p-2 align-top text-center">
                    {!readOnly && items.length > 1 && (
                      <button type="button" onClick={() => removeItem(it.id)} title="Quitar línea" className="p-2 rounded text-rose-600 hover:bg-rose-50">
                        <PiTrashBold className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (<tr><td colSpan={5} className="p-4 text-center text-gray-500 italic">Agrega al menos un ítem.</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notas + Resumen */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <div className="text-base font-bold text-gray-800 mb-3">Notas</div>
          <textarea disabled={readOnly} className={`${INPUT_CLS} min-h-[110px]`} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Instrucciones especiales..." />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-base font-bold text-gray-800 mb-3">Resumen</div>
          <div className="space-y-1 text-base mb-4">
            <div className="flex items-center justify-between"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{fmtQ(subtotal)}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-600">IVA (12%)</span><span className="font-semibold">{fmtQ(iva)}</span></div>
            <div className="pt-2 mt-2 border-t flex items-center justify-between text-lg"><span className="font-semibold text-gray-900">Total</span><span className="font-bold text-gray-900">{fmtQ(total)}</span></div>
          </div>
          {!readOnly ? (
            <div className="mt-4 space-y-3">
              <button type="button" onClick={() => handleSave("Pendiente")} disabled={!canSave || saving} className="h-11 w-full rounded-lg border px-4 text-base font-semibold hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <PiSpinnerBold className="animate-spin" /> : <PiFloppyDiskBold />} {saving ? "Guardando..." : "Guardar Borrador"}
              </button>
              <button type="button" onClick={() => handleSave("Aprobada")} disabled={!canSave || saving} className="h-11 w-full rounded-lg bg-emerald-600 px-4 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <PiSpinnerBold className="animate-spin" /> : "✔️"} {saving ? "Guardando..." : "Guardar y Aprobar"}
              </button>
              <button type="button" onClick={onClose} className="h-10 w-full rounded-lg border px-4 text-base font-semibold text-gray-700 hover:bg-gray-100">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button type="button" onClick={onClose} className="h-10 rounded-lg border px-4 text-base font-semibold text-gray-700 hover:bg-gray-100">
                Cerrar Vista
              </button>
            </div>
          )}
        </div>
      </section>
    </form>
    </>
  );
}

/* ======================================================================
 * ===== Modal de Insumos Relacionados con Proveedor =====
 * ====================================================================== */
type InsumoRelacionado = {
  id_insumo: number;
  nombre: string;
  categoria?: string;
  stock_actual?: number;
  unidad_medida?: string;
  costo_promedio?: number;
  descripcion_presentacion?: string;
  unidades_por_presentacion?: number;
  es_principal?: boolean;
};



function ProviderInsumosModal({ id_proveedor, proveedorData }: { id_proveedor: number; proveedorData: Proveedor }) {
  const [insumos, setInsumos] = useState<InsumoRelacionado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener insumos del proveedor desde insumo_presentacion
        const response = await fetch(`${import.meta.env.VITE_API_URL}/compras/proveedores/${id_proveedor}/insumos`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!mounted) return;

        const data = result.data || [];

        // Mapear los datos para que coincidan con el tipo esperado
        const mappedData = data.map((item: unknown) => {
          const i = item as {
            insumo?: {
              id_insumo?: number;
              nombre_insumo?: string;
              categoria_insumo?: { nombre?: string };
              stock_minimo?: number;
              unidad_base?: string;
              costo_promedio?: number;
            };
            id_insumo?: number;
            descripcion_presentacion?: string;
            unidad_compra?: string;
            costo_compra_unitario?: number;
            unidades_por_presentacion?: number;
            es_principal?: boolean;
          };
          return {
            id_insumo: i.insumo?.id_insumo || i.id_insumo,
            nombre: i.insumo?.nombre_insumo || i.descripcion_presentacion || 'Sin nombre',
            categoria: i.insumo?.categoria_insumo?.nombre || undefined,
            stock_actual: i.insumo?.stock_minimo ?? undefined,
            unidad_medida: i.unidad_compra || i.insumo?.unidad_base || 'unidad',
            costo_promedio: i.costo_compra_unitario ?? i.insumo?.costo_promedio ?? undefined,
            descripcion_presentacion: i.descripcion_presentacion,
            unidades_por_presentacion: i.unidades_por_presentacion,
            es_principal: i.es_principal,
          } as InsumoRelacionado;
        });

        setInsumos(mappedData);
      } catch (e: unknown) {
        let msg = '';
        if (e instanceof Error) msg = e.message;
        else if (typeof e === 'object' && e !== null) msg = JSON.stringify(e);
        else msg = String(e);
        console.error('Provider insumos load error:', msg);
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('policy')) {
          setError('Error de permisos leyendo insumos del proveedor. Verifica políticas RLS.');
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id_proveedor]);

  return (
    <div className="space-y-6">
      {/* Datos del Proveedor */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Proveedor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Nombre Empresa</label>
            <p className="text-base text-gray-800">{proveedorData.nombre}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Nombre Contacto</label>
            <p className="text-base text-gray-800">{proveedorData.contacto || 'No especificado'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Teléfono</label>
            <p className="text-base text-gray-800">{proveedorData.telefono || 'No especificado'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Correo</label>
            <p className="text-base text-gray-800">{proveedorData.correo || 'No especificado'}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600">Dirección</label>
            <p className="text-base text-gray-800">{proveedorData.direccion || 'No especificada'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Estado</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              proveedorData.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {proveedorData.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Preferido</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              proveedorData.es_preferido ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {proveedorData.es_preferido ? '⭐ Sí' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Insumos Relacionados */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Insumos Relacionados con el Proveedor</h3>
        {loading && <div className="text-sm text-gray-500">Cargando insumos...</div>}
        {error && <div className="text-sm text-red-600">Error: {error}</div>}
        {!loading && !error && (
          <div className="max-h-[400px] overflow-y-auto border rounded-lg">
            <table className="w-full text-sm table-auto min-w-full">
              <thead className="text-left text-xs text-gray-500 bg-gray-50">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Presentación</th>
                  <th className="px-3 py-3">Categoría</th>
                  <th className="px-3 py-3 text-right">Unidades x Pres.</th>
                  <th className="px-3 py-3">Unidad</th>
                  <th className="px-3 py-3 text-right">Costo Unit.</th>
                  <th className="px-3 py-3">Principal</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((insumo, index) => (
                  <tr key={`insumo-${insumo.id_insumo}-${index}`} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-3 py-3 text-gray-600 font-medium">{index + 1}</td>
                    <td className="px-3 py-3 text-gray-800 font-medium">{insumo.nombre}</td>
                    <td className="px-3 py-3 text-gray-700">{insumo.descripcion_presentacion || '-'}</td>
                    <td className="px-3 py-3 text-gray-700">{insumo.categoria || '-'}</td>
                    <td className="px-3 py-3 text-right text-gray-800">{insumo.unidades_por_presentacion ?? '-'}</td>
                    <td className="px-3 py-3 text-gray-600">{insumo.unidad_medida || '-'}</td>
                    <td className="px-3 py-3 text-right text-gray-800">Q {insumo.costo_promedio?.toFixed(2) ?? '-'}</td>
                    <td className="px-3 py-3 text-center">{insumo.es_principal ? '⭐' : ''}</td>
                  </tr>
                ))}
                {insumos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-sm text-gray-500 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-gray-400 text-lg">📦</span>
                        No hay insumos registrados para este proveedor.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
function InsumoSearch({
  value, onChangeText, onSelect, disabled, insumosSeed, autoFocus
}: {
  value: string;
  onChangeText: (t: string) => void;
  onSelect: (opt: InsumoRow) => void;
  disabled?: boolean;
  insumosSeed: InsumoRow[];
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");
  const [opts, setOpts] = useState<InsumoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setQ(value || ""); }, [value]);

  // Abrir y enfocar cuando se agrega una nueva línea
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      setOpen(true);
    }
  }, [autoFocus]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      if (!q || q.trim().length < 1) setOpts([]);
      else {
        const queryLower = q.toLowerCase();
        const results = insumosSeed.filter((ins) => ins.nombre.toLowerCase().includes(queryLower));
        setOpts(results.slice(0, 8));
      }
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, insumosSeed]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="relative w-full" ref={boxRef}>
      <input
        ref={inputRef}
        disabled={disabled}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          onChangeText(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar insumo..."
        className={INPUT_CLS}
      />
      <AnimatePresence>
        {open && (q.trim().length > 0 || loading || opts.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute z-10 top-full mt-1 w-full rounded-lg border bg-white shadow-lg max-h-60 overflow-y-auto"
          >
            {loading ? (
              <div className="p-3 text-center text-base text-gray-500">Buscando...</div>
            ) : opts.length === 0 && q.trim().length > 0 ? (
              <div className="p-3 text-center text-base text-gray-500">Sin resultados para "{q}"</div>
            ) : (
              opts.map((opt) => (
                <button
                  type="button"
                  key={opt.id_insumo}
                  onClick={() => {
                    onSelect(opt);
                    setQ(opt.nombre);
                    setOpen(false);
                    setOpts([]);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-base"
                >
                  <div className="font-medium text-gray-800">{opt.nombre}</div>
                  <div className="text-sm text-gray-500">
                    Costo: {fmtQ(opt.costo_promedio)} / {opt.unidad_medida_compra || "unidad"}
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
