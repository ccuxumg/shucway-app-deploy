/* ===============================================
 * 🐱 ARCHIVO .TSX (MODO LOCAL / SIN BD)
 * - Receta inline en el formulario (single/complex)
 * - ESLint/TS OK (sin any, sin hooks condicionales)
 * =============================================== */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getInsumos } from '@/api/inventarioService';
import {
  PiEyeBold,
  PiPencilSimpleBold,
  PiTrashBold,
  PiSpinnerBold,
  PiFloppyDiskBold,
  PiPlusBold,
  PiArrowLeftBold,
} from "react-icons/pi";

/* ============================================================
 * ===== Tipos =====
 * ============================================================ */
type CategoriaProducto = {
  id_categoria: number;
  nombre: string;
  tipo_categoria?: 'perpetuo' | 'operativo';
};

type Insumo = {
  id_insumo: number;
  nombre: string;
  costo_promedio: number;
  unidad_medida_compra: string;
  id_categoria?: number;
  stock_actual?: number;
};

type InsumoRaw = {
  id_insumo: number;
  nombre_insumo: string;
  tipo_insumo: string;
  costo_promedio: number;
  unidad_base: string;
  id_categoria: number;
  stock_actual: number;
};

type Producto = {
  id: string;
  nombre: string;
  descripcion?: string;
  id_categoria: number;
  categoria: string;
  precio_venta: number;
  activo: boolean;
  imagen_url?: string;
  costo_total_producto: number | null;
};

type FormProducto = Omit<Producto, "id"> & { id?: string };

type RecetaLinea = {
  id_receta_detalle?: number;
  id_producto: string;
  id_insumo: number;
  cantidad_insumo: number;
  unidad_medida: string;
  es_obligatorio: boolean;
  insumo?: {
    nombre: string;
    costo_promedio: number;
  };
};

/* ============================================================
 * ===== Utils =====
 * ============================================================ */
const currency = (n: number) =>
  (n || 0).toLocaleString("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  });

const unique = <T,>(arr: T[]) => Array.from(new Set(arr));

const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ===== Icon Button ===== */
function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-emerald-50 text-gray-700 hover:text-emerald-700"
      type="button"
      aria-label={title}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * ===== SEED =====
 * ============================================================ */
const BASE: Omit<Producto, "imagen_url" | "id" | "costo_total_producto">[] = [
  { nombre: "Shuco de Asada", descripcion: "Shuco con carne asada", categoria: "Shucos", id_categoria: 1, precio_venta: 15, activo: true },
  { nombre: "Shuco de Chorizo", descripcion: "Shuco con chorizo", categoria: "Shucos", id_categoria: 1, precio_venta: 12, activo: true },
  { nombre: "Shuco de Salami", descripcion: "Shuco con salami", categoria: "Shucos", id_categoria: 1, precio_venta: 12, activo: true },
  { nombre: "Pollo Burger", descripcion: "Hamburguesa de pollo", categoria: "Hamburguesas", id_categoria: 2, precio_venta: 15, activo: true },
  { nombre: "Cheese Burger", descripcion: "Hamburguesa con queso", categoria: "Hamburguesas", id_categoria: 2, precio_venta: 15, activo: true },
  { nombre: "Gringa Adobada", descripcion: "Gringa de carne adobada", categoria: "Gringas", id_categoria: 3, precio_venta: 20, activo: true },
  { nombre: "Gringa Asada", descripcion: "Gringa de carne asada", categoria: "Gringas", id_categoria: 3, precio_venta: 20, activo: true },
  { nombre: "Pierna de Pollo", descripcion: "Pierna de pollo frita", categoria: "Pollo", id_categoria: 4, precio_venta: 9, activo: true },
  { nombre: "Coca Cola", descripcion: "Coca Cola fría", categoria: "Bebidas", id_categoria: 5, precio_venta: 6, activo: true },
  { nombre: "Pepsi Cola", descripcion: "Pepsi Cola fría", categoria: "Bebidas", id_categoria: 5, precio_venta: 5, activo: true },
  { nombre: "French Fries", descripcion: "Papas fritas", categoria: "Papas", id_categoria: 6, precio_venta: 15, activo: true },
];

const SEED: Producto[] = BASE.map((p, i) => ({
  ...p,
  id: `p${i + 1}`,
  costo_total_producto: p.precio_venta * 0.45,
  imagen_url: `/productos/${slugify(p.nombre)}.png`,
}));

const CATEGORIAS_SEED: CategoriaProducto[] = [
  { id_categoria: 1, nombre: "Shucos", tipo_categoria: "perpetuo" },
  { id_categoria: 2, nombre: "Hamburguesas", tipo_categoria: "perpetuo" },
  { id_categoria: 3, nombre: "Gringas", tipo_categoria: "perpetuo" },
  { id_categoria: 4, nombre: "Pollo", tipo_categoria: "perpetuo" },
  { id_categoria: 5, nombre: "Bebidas", tipo_categoria: "perpetuo" },
  { id_categoria: 6, nombre: "Papas", tipo_categoria: "perpetuo" },
];

const INSUMOS_SEED: Insumo[] = [
  { id_insumo: 1, nombre: "Pan para Shuco", costo_promedio: 1.5, unidad_medida_compra: "u" },
  { id_insumo: 2, nombre: "Carne Asada (libra)", costo_promedio: 35, unidad_medida_compra: "lb" },
  { id_insumo: 3, nombre: "Chorizo", costo_promedio: 4, unidad_medida_compra: "u" },
  { id_insumo: 4, nombre: "Torta de Hamburguesa", costo_promedio: 6, unidad_medida_compra: "u" },
  { id_insumo: 5, nombre: "Queso (libra)", costo_promedio: 22, unidad_medida_compra: "lb" },
  { id_insumo: 6, nombre: "Coca Cola (lata)", costo_promedio: 3, unidad_medida_compra: "u" },
  { id_insumo: 7, nombre: "Papas (libra)", costo_promedio: 5, unidad_medida_compra: "lb" },
];

/* ============================================================
 * COMPONENTE PRINCIPAL
 * ============================================================ */
export default function Productos() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Producto[]>(SEED);
  const [categorias] = useState<CategoriaProducto[]>(CATEGORIAS_SEED);
  const [loading] = useState(false);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [recetas, setRecetas] = useState<Record<string, RecetaLinea[]>>({
    p1: [
      { id_producto: "p1", id_insumo: 1, cantidad_insumo: 1, unidad_medida: "u", es_obligatorio: true, insumo: { nombre: "Pan para Shuco", costo_promedio: 1.5 } },
      { id_producto: "p1", id_insumo: 2, cantidad_insumo: 0.25, unidad_medida: "lb", es_obligatorio: true, insumo: { nombre: "Carne Asada (libra)", costo_promedio: 35 } },
    ],
  });

  // filtros
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("Todas");
  const [estado, setEstado] = useState<"todos" | "activo" | "inactivo">("todos");

  // modales
  const [showView, setShowView] = useState<Producto | null>(null);
  const [modalProducto, setModalProducto] = useState<
    | null
    | {
        mode: "create" | "edit";
        data: FormProducto;
      }
  >(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; productId: string; productName: string } | null>(null);

  const [openRecetario, setOpenRecetario] = useState<{ open: boolean; initialProductId?: string }>({ open: false });

  const categoriasFiltro = useMemo(
    () => ["Todas", ...unique(categorias.map((c) => c.nombre))],
    [categorias]
  );

  const filtered = useMemo(() => {
    let data = [...rows];
    if (cat !== "Todas") data = data.filter((r) => r.categoria === cat);
    if (estado !== "todos") data = data.filter((r) => r.activo === (estado === "activo"));
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      data = data.filter(
        (r) =>
          r.nombre.toLowerCase().includes(s) ||
          (r.descripcion || "").toLowerCase().includes(s) ||
          r.categoria.toLowerCase().includes(s)
      );
    }
    return data;
  }, [rows, q, cat, estado]);

  const openCreate = () => {
    const nuevo: FormProducto = {
      nombre: "",
      descripcion: "",
      id_categoria: categorias[0]?.id_categoria ?? 1,
      categoria: categorias[0]?.nombre ?? "Shucos",
      precio_venta: 0,
      activo: true,
      imagen_url: "",
      costo_total_producto: null,
    };
    setModalProducto({ mode: "create", data: nuevo });
  };

  const openEdit = (p: Producto) => setModalProducto({ mode: "edit", data: { ...p } });

  // ======= GUARDA (con receta inline) =======
  const onSaveProducto = (payload: {
    mode: "create" | "edit";
    producto: FormProducto;
    link: "none" | "single" | "complex";
    singleInsumo?: Insumo;
    recipeLines?: RecetaLinea[];
  }) => {
    const categoriaNombre =
      categorias.find((c) => c.id_categoria === payload.producto.id_categoria)?.nombre || "N/A";

    if (payload.mode === "create") {
      const finalId = `p-${Date.now()}`;

      const prod: Producto = {
        ...payload.producto,
        id: finalId,
        categoria: categoriaNombre,
        imagen_url:
          payload.producto.imagen_url || `/productos/${slugify(payload.producto.nombre)}.png`,
        costo_total_producto: payload.producto.costo_total_producto ?? null,
      };

      if (payload.link === "single" && payload.singleInsumo) {
        const ins = payload.singleInsumo;
        prod.costo_total_producto = ins.costo_promedio * 1;
        setRecetas((prev) => ({
          ...prev,
          [finalId]: [
            {
              id_producto: finalId,
              id_insumo: ins.id_insumo,
              cantidad_insumo: 1,
              unidad_medida: ins.unidad_medida_compra || "u",
              es_obligatorio: true,
              insumo: { nombre: ins.nombre, costo_promedio: ins.costo_promedio },
            },
          ],
        }));
      } else if (payload.link === "complex" && payload.recipeLines && payload.recipeLines.length) {
        const mapped = payload.recipeLines.map((l) => ({ ...l, id_producto: finalId }));
        const costo = mapped.reduce((acc, l) => {
          const costoLinea =
            (l.insumo?.costo_promedio ??
              INSUMOS_SEED.find((i) => i.id_insumo === l.id_insumo)?.costo_promedio ??
              0) * (l.cantidad_insumo || 0);
          return acc + costoLinea;
        }, 0);
        prod.costo_total_producto = +costo.toFixed(2);
        setRecetas((prev) => ({ ...prev, [finalId]: mapped }));
      }

      setRows((prev) => [prod, ...prev]);
    } else {
      // EDIT
      setRows((prev) =>
        prev.map((r) =>
          r.id === payload.producto.id
            ? {
                ...(payload.producto as Producto),
                categoria: categoriaNombre,
                imagen_url:
                  payload.producto.imagen_url ||
                  `/productos/${slugify(payload.producto.nombre)}.png`,
              }
            : r
        )
      );

      if (payload.link === "single" && payload.singleInsumo && payload.producto.id) {
        const idProd = payload.producto.id;
        const ins = payload.singleInsumo;
        setRecetas((prev) => ({
          ...prev,
          [idProd]: [
            {
              id_producto: idProd,
              id_insumo: ins.id_insumo,
              cantidad_insumo: 1,
              unidad_medida: ins.unidad_medida_compra || "u",
              es_obligatorio: true,
              insumo: { nombre: ins.nombre, costo_promedio: ins.costo_promedio },
            },
          ],
        }));
      } else if (payload.link === "complex" && payload.recipeLines && payload.producto.id) {
        const idProd = payload.producto.id;
        const mapped = payload.recipeLines.map((l) => ({ ...l, id_producto: idProd }));
        setRecetas((prev) => ({ ...prev, [idProd]: mapped }));
      }
    }

    setModalProducto(null);
  };

  const onDelete = (id: string) => {
    const product = rows.find(r => r.id === id);
    if (product) {
      setDeleteConfirm({ show: true, productId: id, productName: product.nombre });
    }
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      setRows((prev) => prev.filter((r) => r.id !== deleteConfirm.productId));
      setRecetas((prev) => {
        const n = { ...prev };
        delete n[deleteConfirm.productId];
        return n;
      });
      setDeleteConfirm(null);
    }
  };

  const handleRecetaSaved = (productId: string, nuevoCosto: number) => {
    setRows((prevRows) =>
      prevRows.map((p) => (p.id === productId ? { ...p, costo_total_producto: nuevoCosto } : p))
    );
  };

  // cargar insumos desde API usando inventarioService para obtener solo operativos
  useEffect(() => {
    const loadInsumos = async () => {
      try {
        const insumosData = await getInsumos();
        // Usar todos los insumos (considerando operativos por defecto)
        const operativos = (insumosData.data as InsumoRaw[])
          .map((item) => ({
            id_insumo: item.id_insumo,
            nombre: item.nombre_insumo,
            costo_promedio: item.costo_promedio,
            unidad_medida_compra: item.unidad_base,
            id_categoria: item.id_categoria,
            stock_actual: item.stock_actual,
          }));

        console.log('Insumos cargados:', operativos);
        if (operativos.length === 0) {
          console.log('No hay insumos, usando datos seed');
          setInsumos(INSUMOS_SEED);
        } else {
          setInsumos(operativos);
        }
      } catch (error) {
        console.warn('Error obteniendo insumos:', error);
        // fallback a datos seed si falla la API
        console.log('Usando datos seed como fallback');
        setInsumos(INSUMOS_SEED);
      }
    };

    loadInsumos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
            <p className="text-sm text-gray-500">Catálogo de venta con filtros por categoría y estado</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="h-11 rounded-xl px-4 text-base font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 border border-gray-300"
            >
              <PiArrowLeftBold />
              Regresar
            </button>
            {/* Verde oscuro SOLO este botón */}
            <button
              onClick={() => setOpenRecetario({ open: true })}
              className="h-11 rounded-xl px-4 text-base font-semibold text-white flex items-center gap-2 bg-[#12443D] hover:bg-[#0f3833]"
            >
              📖 Ver Recetario
            </button>
            <button
              onClick={openCreate}
              className="h-11 rounded-xl bg-emerald-600 px-4 text-base font-semibold text-white hover:bg-emerald-700 flex items-center gap-2"
            >
              <PiPlusBold />
              Agregar Producto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow p-5 mb-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-base text-gray-700 font-medium">Categoría:</span>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {categoriasFiltro.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base text-gray-700 font-medium">Estado:</span>
              <div className="flex gap-2">
                {(["todos", "activo", "inactivo"] as const).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEstado(e)}
                    className={
                      "h-9 rounded-lg px-3 text-sm font-semibold border transition " +
                      (estado === e
                        ? "bg-emerald-600 text-white border-emerald-600 shadow"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100")
                    }
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar producto…"
                className="h-11 w-72 rounded-lg border border-gray-200 bg-white pl-3 pr-3 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <button
              onClick={() => {
                setQ("");
                setCat("Todas");
                setEstado("todos");
              }}
              className="h-11 rounded-lg border px-4 text-base font-semibold hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="text-left text-gray-700 bg-gray-50">
                <tr className="border-b">
                  <th className="px-5 py-3.5 font-semibold">Producto</th>
                  <th className="px-5 py-3.5 font-semibold">Descripción</th>
                  <th className="px-5 py-3.5 font-semibold">Categoría</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Precio</th>
                  <th className="px-5 py-3.5 font-semibold">Estado</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-900 leading-7">
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      Simulando carga...
                    </td>
                  </tr>
                )}
                {!loading &&
                  filtered.map((r) => {
                    const fallback = `/productos/${slugify(r.nombre)}.png`;
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={r.imagen_url || fallback}
                              alt={r.nombre}
                              className="w-10 h-10 rounded-lg object-cover bg-emerald-100"
                              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                (e.currentTarget as HTMLImageElement).src = "/img/icon.png";
                              }}
                            />
                            <div className="font-semibold leading-6 line-clamp-2">{r.nombre}</div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-gray-700 line-clamp-2">{r.descripcion || "—"}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-800">{r.categoria}</td>
                        <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                          {currency(r.precio_venta)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                              r.activo
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {r.activo ? "activo" : "inactivo"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            <IconBtn title="Ver" onClick={() => setShowView(r)}>
                              <PiEyeBold className="h-5 w-5" />
                            </IconBtn>
                            <IconBtn title="Editar" onClick={() => openEdit(r)}>
                              <PiPencilSimpleBold className="h-5 w-5" />
                            </IconBtn>
                            <IconBtn title="Eliminar" onClick={() => onDelete(r.id)}>
                              <PiTrashBold className="h-5 w-5 text-rose-600" />
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Sin resultados con los filtros actuales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 text-base text-gray-700">
            Mostrando <span className="font-semibold">{filtered.length}</span> productos
          </div>
        </div>

        {/* Modal VER */}
        <AnimatePresence>
          {showView && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowView(null)}
              />
              <motion.div
                initial={{ scale: 0.98, y: 8, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.98, y: 8, opacity: 0 }}
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">
                    {showView.nombre}
                  </h3>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100"
                    onClick={() => setShowView(null)}
                  >
                    ✕
                  </button>
                </div>

                <img
                  src={
                    showView.imagen_url ||
                    `/productos/${slugify(showView.nombre)}.png`
                  }
                  alt={showView.nombre}
                  className="w-full h-48 object-cover rounded-lg mb-4 bg-emerald-50"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    (e.currentTarget as HTMLImageElement).src = "/img/icon.png";
                  }}
                />

                <div className="space-y-3 text-base">
                  <Row label="Categoría" value={showView.categoria} />
                  <Row label="Precio de venta" value={currency(showView.precio_venta)} />
                  <Row
                    label="Costo"
                    value={
                      showView.costo_total_producto != null
                        ? currency(showView.costo_total_producto)
                        : "—"
                    }
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      Descripción
                    </div>
                    <p className="text-gray-800">{showView.descripcion || "—"}</p>
                  </div>
                  <div className="mt-3 rounded-lg border p-3 bg-gray-50">
                    <div className="text-sm font-semibold text-gray-600 mb-1">
                      Receta asociada
                    </div>
                    {recetas[showView.id]?.length ? (
                      <ul className="list-disc pl-5 text-gray-700">
                        {recetas[showView.id].map((it, i) => (
                          <li key={`${it.id_insumo}-${i}`}>
                            {it.insumo?.nombre || "Insumo desconocido"} — {it.cantidad_insumo} {it.unidad_medida}
                            {it.es_obligatorio ? " (obligatorio)" : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-700">
                        (Sin líneas de receta registradas)
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    className="h-10 rounded-lg border px-4 text-base font-semibold hover:bg-gray-50"
                    onClick={() => setShowView(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal CREAR/EDITAR PRODUCTO (con receta inline) */}
        <ProductoModal
          modal={modalProducto}
          categorias={categorias}
          onClose={() => setModalProducto(null)}
          onSave={onSaveProducto}
          insumos={insumos}
        />

        {/* Modal de confirmación de eliminación */}
        <AnimatePresence>
          {deleteConfirm?.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setDeleteConfirm(null)}
              />
              <motion.div
                initial={{ scale: 0.98, y: 8, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.98, y: 8, opacity: 0 }}
                className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <PiTrashBold className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Eliminar Producto</h3>
                  <p className="text-gray-600 mb-6">
                    ¿Estás seguro de que quieres eliminar <strong>"{deleteConfirm.productName}"</strong>?
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 h-10 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 h-10 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Producto */}
        <ProductoModal
          modal={modalProducto}
          categorias={categorias}
          onClose={() => setModalProducto(null)}
          onSave={onSaveProducto}
          insumos={insumos}
        />

        {/* Gestor de Recetas adicional (opcional) */}
        <RecetarioModal
          open={openRecetario.open}
          onClose={() => setOpenRecetario({ open: false })}
          productos={rows}
          recetas={recetas}
          setRecetas={setRecetas}
          initialProductId={openRecetario.initialProductId}
          onRecetaSaved={handleRecetaSaved}
          insumos={insumos}
        />
      </div>
    </div>
  );
}

/* ============================================================
 * ===== Subcomponentes =====
 * ============================================================ */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

/* ---------- Modal de Crear/Editar Producto (receta inline) ---------- */
function ProductoModal({
  modal,
  categorias,
  onClose,
  onSave,
  insumos,
}: {
  modal: { mode: "create" | "edit"; data: FormProducto } | null;
  categorias: CategoriaProducto[];
  onClose: () => void;
  onSave: (p: {
    mode: "create" | "edit";
    producto: FormProducto;
    link: "none" | "single" | "complex";
    singleInsumo?: Insumo;
    recipeLines?: RecetaLinea[];
  }) => void;
  insumos: Insumo[];
}) {
  const [form, setForm] = useState<FormProducto | null>(modal?.data ?? null);

  // 👉 solo dos opciones (sin “none”)
  const [link, setLink] = useState<"single" | "complex">("single");

  // single
  const [singleInsumo, setSingleInsumo] = useState<Insumo | null>(null);
  const [insumoQuery, setInsumoQuery] = useState("");
  const [insumoResults, setInsumoResults] = useState<Insumo[]>([]);

  // complex (receta inline)
  const [recipeLines, setRecipeLines] = useState<RecetaLinea[]>([]);

  // imagen
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const searchInsumos = useCallback(async (query: string) => {
    if (!query) {
      setInsumoResults([]);
      return;
    }
    const s = query.toLowerCase();

    // Filtrar insumos por nombre
    const filtered = insumos
      .filter((i) => i.nombre.toLowerCase().includes(s))
      .slice(0, 6);

    // Obtener stock actual para cada insumo
    const insumosWithStock = await Promise.all(
      filtered.map(async (insumo) => {
        try {
          const stockResponse = await fetch(`${import.meta.env.VITE_API_URL}/inventario/stock?idInsumo=${insumo.id_insumo}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
          });
          const stockData = await stockResponse.json();
          return {
            ...insumo,
            stock_actual: stockData.data || 0
          };
        } catch (error) {
          console.warn(`Error obteniendo stock para insumo ${insumo.id_insumo}:`, error);
          return {
            ...insumo,
            stock_actual: 0
          };
        }
      })
    );

    setInsumoResults(insumosWithStock);
  }, [insumos]);

  // inicializa cuando recibe el modal
  useEffect(() => {
    if (modal) {
      setForm(modal.data);
      setLink("single"); // default
      setSingleInsumo(null);
      setInsumoQuery("");
      setRecipeLines([]); // limpia receta inline
    }
  }, [modal]);

  // recalcula costo mostrado según vínculo
  const costoCalculado = useMemo(() => {
    if (!form) return 0;
    if (link === "single" && singleInsumo) {
      return singleInsumo.costo_promedio;
    }
    if (link === "complex" && recipeLines.length > 0) {
      return recipeLines.reduce((acc, l: RecetaLinea) => {
        const costo = l.insumo?.costo_promedio ??
          (Array.isArray(insumos) ? insumos.find((i) => i.id_insumo === l.id_insumo)?.costo_promedio : 0) ?? 0;
        return acc + (l.cantidad_insumo || 0) * costo;
      }, 0);
    }
    return form.costo_total_producto ?? 0;
  }, [form, link, singleInsumo, recipeLines, insumos]);

  // margen calculado
  const precioBase = form?.precio_venta ?? 0;
  const margen = useMemo(() => {
    const ganancia = precioBase - costoCalculado;
    const porcentaje = precioBase > 0 ? (ganancia / precioBase) * 100 : 0;
    return {
      ganancia: currency(ganancia),
      porcentaje: `${porcentaje.toFixed(1)}%`,
    };
  }, [precioBase, costoCalculado]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...(f as FormProducto), imagen_url: reader.result as string }));
      setUploading(false);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!modal || !form) return null;
  const title = modal.mode === "create" ? "Crear Nuevo Producto" : "Editar Producto";

  const save = () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    if (!form.id_categoria) return alert("Selecciona una categoría");
    if (!(form.precio_venta >= 0)) return alert("Precio inválido");

    // como ahora solo hay dos opciones, el link que mandamos es el actual
    const payload: {
      mode: "create" | "edit";
      producto: FormProducto;
      link: "single" | "complex";
      singleInsumo?: Insumo;
      recipeLines?: RecetaLinea[];
    } = {
      mode: modal.mode,
      producto: {
        ...form,
        costo_total_producto: +costoCalculado.toFixed(2),
      },
      link,
    };

    if (link === "single") {
      if (!singleInsumo) return alert("Selecciona un insumo");
      payload.singleInsumo = singleInsumo;
    } else {
      if (!recipeLines.length) return alert("Agrega al menos un insumo a la receta");
      payload.recipeLines = recipeLines;
    }

    // la firma original acepta también "none", pero esto es compatible
    onSave(payload as unknown as {
      mode: "create" | "edit";
      producto: FormProducto;
      link: "none" | "single" | "complex";
      singleInsumo?: Insumo;
      recipeLines?: RecetaLinea[];
    });
  };

  return (
    <AnimatePresence>
      {modal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.98, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-100 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-gray-400">
                  Productos / {modal.mode === "create" ? "Crear" : "Editar"}
                </div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onClose}>✕</button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto p-1 pr-3">
              <div className="grid gap-4">

                {/* Información Básica */}
                <section className="bg-white rounded-xl border border-gray-200/70 shadow-sm p-4">
                  <div className="text-sm font-bold text-gray-800 mb-3">Información Básica</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                      <input
                        value={form.nombre}
                        onChange={(e) => setForm((f) => ({ ...(f as FormProducto), nombre: e.target.value }))}
                        className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría *</label>
                      <select
                        value={form.id_categoria}
                        onChange={(e) => setForm((f) => ({ ...(f as FormProducto), id_categoria: Number(e.target.value) }))}
                        className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      >
                        {categorias.map((c) => (
                          <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Precio de Venta (Q) *
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={form.precio_venta}
                        onChange={(e) => setForm((f) => ({ ...(f as FormProducto), precio_venta: Number(e.target.value || 0) }))}
                        className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </div>

                    {/* Vínculo con inventario (Receta) */}
                    <div className="sm:col-span-2">
                      <div className="text-sm font-bold text-gray-800 mb-3">Vínculo con Inventario (Receta)</div>

                      {/* SOLO 2 opciones */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-gray-50">
                          <input type="radio" name="link" value="single" checked={link === "single"} onChange={() => setLink("single")} />
                          Insumo sin receta (Ej: soda)
                        </label>
                        <label className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-gray-50">
                          <input type="radio" name="link" value="complex" checked={link === "complex"} onChange={() => setLink("complex")} />
                          Insumo con receta (Ej: Shuco de Asada)
                        </label>
                      </div>

                      {/* SINGLE: buscador de insumo */}
                      {link === "single" && (
                        <div className="mt-3 relative">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Selecciona el Insumo *</label>
                          {singleInsumo ? (
                            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                              <span className="text-sm font-medium text-emerald-700">{singleInsumo.nombre}</span>
                              <button type="button" onClick={() => setSingleInsumo(null)} className="text-xs font-bold">✕</button>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="text"
                                value={insumoQuery}
                                onChange={(e) => { setInsumoQuery(e.target.value); searchInsumos(e.target.value); }}
                                placeholder="Buscar insumo (ej: Coca Cola)"
                                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                              />
                              {insumoResults.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  {insumoResults.map((ins) => (
                                    <li
                                      key={ins.id_insumo}
                                      onClick={() => {
                                        setSingleInsumo(ins);
                                        setInsumoQuery("");
                                        setInsumoResults([]);
                                      }}
                                      className="p-3 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="font-medium text-gray-800">{ins.nombre}</div>
                                      <div className="text-xs text-gray-600 mt-1">
                                        Cantidad actual: {ins.stock_actual || 0} | Precio unitario: {currency(ins.costo_promedio)} | Unidad base: {ins.unidad_medida_compra || 'N/A'}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                          <p className="text-[11px] text-gray-500 mt-1">
                            Costo calculado: {currency(singleInsumo?.costo_promedio || 0)}
                          </p>
                        </div>
                      )}

                      {/* COMPLEX: editor de receta inline */}
                      {link === "complex" && (
                        <div className="mt-4 space-y-2">
                          <InlineRecipeEditor
                            lines={recipeLines}
                            setLines={setRecipeLines}
                            insumos={insumos}
                          />
                          <div className="text-sm text-emerald-600 font-semibold">
                            Costo de Receta (Calculado): {currency(costoCalculado)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Costo (Calculado)</label>
                      <input
                        type="text" readOnly
                        value={currency(costoCalculado)}
                        className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm bg-gray-50 text-gray-700 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Margen (Calc.)</label>
                      <input
                        type="text" readOnly
                        value={`${margen.ganancia} (${margen.porcentaje})`}
                        className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm bg-gray-50 text-emerald-600 font-medium focus:outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* Información Adicional */}
                <section className="bg-white rounded-xl border border-gray-200/70 shadow-sm p-4">
                  <div className="text-sm font-bold text-gray-800 mb-3">Información Adicional</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Descripción */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                      <textarea
                        value={form.descripcion ?? ""}
                        onChange={(e) => setForm((f) => ({ ...(f as FormProducto), descripcion: e.target.value || undefined }))}
                        className="w-full min-h-[90px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </div>

                    {/* Imagen */}
                    <ProductoImagen form={form} setForm={setForm} uploading={uploading} fileInputRef={fileInputRef} onUpload={handleUpload} />
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t flex justify-end gap-2">
              <button type="button" className="h-10 rounded-lg border px-4 text-base font-semibold hover:bg-gray-50" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="button"
                className="h-10 rounded-lg bg-emerald-600 px-4 text-base font-semibold text-white hover:bg-emerald-700 flex items-center gap-1.5"
                onClick={save}
              >
                <PiFloppyDiskBold />
                {modal.mode === "create" ? "Guardar Producto" : "Guardar Cambios"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Bloque de imagen del producto (reutilizable) ---------- */
function ProductoImagen({
  form,
  setForm,
  uploading,
  fileInputRef,
  onUpload,
}: {
  form: FormProducto;
  setForm: React.Dispatch<React.SetStateAction<FormProducto | null>>;
  uploading: boolean;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen</label>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-16 h-16 rounded-lg border overflow-hidden bg-gray-50">
          {form.imagen_url ? (
            <img
              src={form.imagen_url}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                (e.currentTarget as HTMLImageElement).src = "/img/icon.png";
              }}
            />
          ) : (
            <div className="w-full h-full grid place-content-center text-gray-400 text-xs">
              sin imagen
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 rounded-lg border px-3 text-sm font-semibold hover:bg-gray-50" disabled={uploading}>
            {uploading ? "Subiendo..." : "Subir imagen"}
          </button>
          {form.imagen_url && (
            <button type="button" onClick={() => setForm((f) => ({ ...(f as FormProducto), imagen_url: undefined }))} className="h-10 rounded-lg border px-3 text-sm font-semibold hover:bg-gray-50">
              Quitar
            </button>
          )}
        </div>
        <input
          ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); }}
        />
      </div>
      <input
        value={form.imagen_url ?? ""}
        onChange={(e) => setForm((f) => ({ ...(f as FormProducto), imagen_url: e.target.value || undefined }))}
        placeholder="https://…/imagen.png (opcional)"
        className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />
    </div>
  );
}

/* ---------- Editor de Receta INLINE ---------- */
function InlineRecipeEditor({
  lines,
  setLines,
  insumos,
}: {
  lines: RecetaLinea[];
  setLines: React.Dispatch<React.SetStateAction<RecetaLinea[]>>;
  insumos: Insumo[];
}) {
  // Filtrar solo insumos operativos (ya vienen filtrados desde la API)
  const insumosOperativos = React.useMemo(() => {
    return insumos;
  }, [insumos]);

  const addLinea = () => {
    console.log('Intentando agregar línea, insumosOperativos:', insumosOperativos);
    if (!insumosOperativos || insumosOperativos.length === 0) {
      console.error('No hay insumos operativos disponibles:', insumosOperativos);
      alert(`No hay insumos disponibles para crear la receta. Verifica que los insumos estén cargados y que haya categorías de insumo configuradas.`);
      return;
    }

    // Agregar una línea vacía que el usuario podrá configurar
    setLines((prev) => [
      ...prev,
      {
        id_producto: "",
        id_insumo: insumosOperativos[0]?.id_insumo || 0,
        cantidad_insumo: 1,
        unidad_medida: insumosOperativos[0]?.unidad_medida_compra || "u",
        es_obligatorio: true,
        insumo: insumosOperativos[0] ? {
          nombre: insumosOperativos[0].nombre,
          costo_promedio: insumosOperativos[0].costo_promedio
        } : undefined
      },
    ]);
  };

  const updateLinea = <K extends keyof RecetaLinea>(index: number, field: K, value: RecetaLinea[K]) => {
    setLines((prev) => {
      const copy = [...prev];
      const linea = { ...copy[index], [field]: value } as RecetaLinea;
      if (field === "id_insumo") {
        const i = insumosOperativos.find((x: Insumo) => x.id_insumo === Number(value));
        if (i) {
          linea.unidad_medida = i.unidad_medida_compra || "u";
          linea.insumo = { nombre: i.nombre, costo_promedio: i.costo_promedio };
        }
      }
      copy[index] = linea;
      return copy;
    });
  };

  const removeLinea = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-800">Receta del Producto</h4>
        <button
          type="button"
          onClick={addLinea}
          disabled={insumosOperativos.length === 0}
          className={`h-9 rounded-lg border px-3 text-sm font-semibold flex items-center gap-1 ${
            insumosOperativos.length === 0
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "hover:bg-gray-50"
          }`}
        >
          <PiPlusBold /> Añadir Insumo
        </button>
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-gray-500">
          {insumos.length === 0
            ? "Cargando insumos..."
            : insumosOperativos.length === 0
            ? "No hay insumos operativos disponibles. Verifica que haya insumos con categorías operativas configuradas."
            : "Aún no has agregado líneas a la receta."
          }
        </p>
      ) : (
        <div className="space-y-2">
          {lines.map((l, index) => (
            <div key={`${l.id_insumo}-${index}`} className="flex gap-2 items-center p-2 rounded-lg border">
              <select
                value={l.id_insumo}
                onChange={(e) => updateLinea(index, "id_insumo", Number(e.target.value))}
                className="flex-1 h-9 rounded-md border border-gray-200 px-2 text-sm"
              >
                {insumosOperativos.map((ins: Insumo) => (
                  <option key={ins.id_insumo} value={ins.id_insumo}>
                    {ins.nombre} ({currency(ins.costo_promedio)})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={l.cantidad_insumo}
                onChange={(e) => updateLinea(index, "cantidad_insumo", Number(e.target.value || 0))}
                className="w-20 h-9 rounded-md border border-gray-200 px-2 text-sm text-right"
              />
              <input
                type="text"
                value={l.unidad_medida}
                readOnly
                className="w-16 h-9 rounded-md border border-gray-200 px-2 text-sm bg-gray-50"
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={l.es_obligatorio}
                  onChange={(e) => updateLinea(index, "es_obligatorio", e.target.checked)}
                />
                Oblig.
              </label>
              <button
                type="button"
                onClick={() => removeLinea(index)}
                className="p-1.5 rounded text-red-600 hover:bg-red-50"
                title="Eliminar"
              >
                <PiTrashBold className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Gestor de Recetas (opcional, fuera del modal) ---------- */
function RecetarioModal({
  open,
  onClose,
  productos,
  recetas,
  setRecetas,
  initialProductId,
  onRecetaSaved,
  insumos,
}: {
  open: boolean;
  onClose: () => void;
  productos: Producto[];
  recetas: Record<string, RecetaLinea[]>;
  setRecetas: React.Dispatch<React.SetStateAction<Record<string, RecetaLinea[]>>>;
  initialProductId?: string;
  onRecetaSaved: (productId: string, nuevoCosto: number) => void;
  insumos: Insumo[];
}) {
  const productosSinReceta = useMemo(() => {
    return productos.filter(p => !recetas[p.id] || recetas[p.id].length === 0);
  }, [productos, recetas]);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [currentReceta, setCurrentReceta] = useState<RecetaLinea[]>([]);
  const [allInsumos] = useState<Insumo[]>(Array.isArray(insumos) ? insumos : []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);

  const loadReceta = useCallback((productId: string) => {
    setLoading(true);
    setSelectedProductId(productId);
    const recetaExistente = recetas[productId] || [];
    setCurrentReceta(recetaExistente);
    setLoading(false);
  }, [recetas]);

  useEffect(() => {
    if (open && initialProductId) {
      loadReceta(initialProductId);
    }
    if (!open) {
      setSelectedProductId(null);
      setCurrentReceta([]);
    }
  }, [open, initialProductId, loadReceta]);

  const addLinea = () => {
    const primerInsumo = allInsumos[0];
    if (!primerInsumo) return alert("No hay insumos cargados");
    if (!selectedProductId) return alert("Error: No hay producto seleccionado");

    setCurrentReceta(prev => [
      ...prev,
      {
        id_producto: selectedProductId,
        id_insumo: primerInsumo.id_insumo,
        cantidad_insumo: 1,
        unidad_medida: primerInsumo.unidad_medida_compra || "u",
        es_obligatorio: true,
        insumo: { nombre: primerInsumo.nombre, costo_promedio: primerInsumo.costo_promedio }
      } as RecetaLinea
    ]);
  };

  const updateLinea = <K extends keyof RecetaLinea>(
    index: number,
    field: K,
    value: RecetaLinea[K]
  ) => {
    const copy = [...currentReceta];
    const linea = { ...copy[index], [field]: value } as RecetaLinea;

    if (field === "id_insumo") {
      const insumo = allInsumos.find(i => i.id_insumo === Number(value));
      if (insumo) {
        linea.unidad_medida = insumo.unidad_medida_compra || "u";
        linea.insumo = { nombre: insumo.nombre, costo_promedio: insumo.costo_promedio };
      }
    }
    copy[index] = linea;
    setCurrentReceta(copy);
  };

  const removeLinea = (index: number) => {
    setCurrentReceta(prev => prev.filter((_, i) => i !== index));
  };

  const costoTotalCalculado = useMemo(() => {
    return currentReceta.reduce((total, linea) => {
      const cantidad = linea.cantidad_insumo || 0;
      const costo = linea.insumo?.costo_promedio ||
        allInsumos.find(i => i.id_insumo === linea.id_insumo)?.costo_promedio || 0;
      return total + (cantidad * costo);
    }, 0);
  }, [currentReceta, allInsumos]);

  const onSaveReceta = async () => {
    if (!selectedProductId) return alert("No hay un producto seleccionado.");
    setSaving(true);
    await new Promise(res => setTimeout(res, 500));
    setRecetas(prev => ({ ...prev, [selectedProductId]: currentReceta }));
    onRecetaSaved(selectedProductId, costoTotalCalculado);
    setSaving(false);
    onClose();
  };

  const selectedProducto = productos.find(p => p.id === selectedProductId);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.98, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            className="relative w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-gray-800">Gestor de Recetas</h3>
                {productosSinReceta.length > 0 && (
                  <button
                    onClick={() => setShowCreateRecipe(true)}
                    className="h-9 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <PiPlusBold size={16} />
                    Crear Receta
                  </button>
                )}
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onClose}>
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 flex overflow-hidden">
              {/* Lista productos */}
              <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
                <div className="p-3">
                  <h4 className="text-sm font-semibold mb-2">Productos con Receta</h4>
                  {productos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => loadReceta(p.id)}
                      className={`w-full text-left p-2 rounded-lg text-sm ${
                        selectedProductId === p.id
                          ? "bg-emerald-100 text-emerald-700 font-medium"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form receta */}
              <div className="w-2/3 flex-1 flex flex-col">
                {selectedProductId ? (
                  <>
                    <div className="p-4 border-b">
                      <h4 className="font-semibold text-gray-800">Editando: {selectedProducto?.nombre}</h4>
                      <p className="text-sm text-gray-500">
                        Precio Venta: {currency(selectedProducto?.precio_venta || 0)}
                      </p>
                      <p className="text-sm text-emerald-600 font-medium">
                        Costo de Receta (Calculado): {currency(costoTotalCalculado)}
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {loading && <p>Cargando receta...</p>}

                      {currentReceta.map((linea, index) => (
                        <div key={`${linea.id_insumo}-${index}`} className="flex gap-2 items-center p-2 rounded-lg border">
                          <select
                            value={linea.id_insumo}
                            onChange={(e) => updateLinea(index, "id_insumo", Number(e.target.value))}
                            className="flex-1 h-9 rounded-md border border-gray-200 px-2 text-sm"
                          >
                            {insumos.map((ins: Insumo) => (
                              <option key={ins.id_insumo} value={ins.id_insumo}>
                                {ins.nombre} ({currency(ins.costo_promedio)})
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={linea.cantidad_insumo}
                            onChange={(e) => updateLinea(index, "cantidad_insumo", Number(e.target.value || 0))}
                            className="w-16 h-9 rounded-md border border-gray-200 px-2 text-sm text-right"
                          />
                          <input
                            type="text"
                            value={linea.unidad_medida}
                            onChange={(e) => updateLinea(index, "unidad_medida", e.target.value)}
                            className="w-16 h-9 rounded-md border border-gray-200 px-2 text-sm"
                          />
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={linea.es_obligatorio}
                              onChange={(e) => updateLinea(index, "es_obligatorio", e.target.checked)}
                            />
                            Oblig.
                          </label>
                          <IconBtn title="Eliminar" onClick={() => removeLinea(index)}>
                            <PiTrashBold className="h-4 w-4 text-red-500" />
                          </IconBtn>
                        </div>
                      ))}

                      <button
                        onClick={addLinea}
                        className="h-10 w-full rounded-lg border border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-1"
                      >
                        <PiPlusBold /> Añadir Insumo
                      </button>
                    </div>

                    <div className="mt-4 p-4 border-t flex justify-end gap-2">
                      <button
                        type="button"
                        className="h-10 rounded-lg border px-4 text-base font-semibold hover:bg-gray-50"
                        onClick={onClose}
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        className="h-10 rounded-lg bg-emerald-600 px-4 text-base font-semibold text-white hover:bg-emerald-700 flex items-center gap-1.5"
                        onClick={onSaveReceta}
                        disabled={saving}
                      >
                        {saving ? <PiSpinnerBold className="animate-spin" /> : <PiFloppyDiskBold />}
                        {saving ? "Guardando..." : "Guardar Receta"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                    <p className="font-medium">Selecciona un producto</p>
                    <p className="text-sm">
                      Selecciona un producto de la lista de la izquierda para ver o editar su receta.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal para seleccionar producto para nueva receta */}
      {showCreateRecipe && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateRecipe(false)} />
          <motion.div
            initial={{ scale: 0.98, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Crear Nueva Receta</h3>
              <button
                className="p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setShowCreateRecipe(false)}
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Selecciona un producto para crear su receta:
            </p>

            <div className="max-h-60 overflow-y-auto">
              {productosSinReceta.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => {
                    setSelectedProductId(producto.id);
                    setCurrentReceta([]);
                    setShowCreateRecipe(false);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-emerald-50 border border-gray-200 mb-2"
                >
                  <div className="font-medium text-gray-800">{producto.nombre}</div>
                  <div className="text-sm text-gray-500">
                    Precio: {currency(producto.precio_venta)}
                  </div>
                </button>
              ))}
            </div>

            {productosSinReceta.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No hay productos disponibles sin receta.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
