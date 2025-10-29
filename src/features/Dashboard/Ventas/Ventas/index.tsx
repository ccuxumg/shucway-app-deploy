import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdReceiptLong, MdInventory2, MdAccountBalance, MdError } from "react-icons/md";
import { Banknote, Landmark, CreditCard } from "lucide-react";
import { ventasService, Venta, ProductoPopular } from "../../../../api/ventasService";
import { useAlerts } from "../../../../hooks/useAlerts";


// ====== Tipos ======
type RangeFilter = "todo" | "hoy" | "ayer" | "esta_semana" | "ultimos_7" | "ultimos_30" | "este_mes" | "custom";

type FilterOption = {
  key: RangeFilter;
  label: string;
};
const primary = "#00B074";
const mid = "#346C60";
const yellow = "#FFD40D";

const hexToRgba = (hex: string, alpha = 0.10) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ActionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone: string;
  onClick?: () => void;
}> = ({ title, subtitle, icon, tone, onClick }) => {
  const bg = hexToRgba(tone, 0.10);
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      aria-label={title}
      style={{ background: bg }}
      className="w-full flex items-center gap-5 rounded-xl px-6 py-5 min-h-[100px] group hover:shadow-lg transition-all duration-200 ease-in-out relative overflow-hidden"
    >
      {/* círculo decorativo */}
      <div
        className="absolute right-0 top-0 w-28 h-28 -translate-y-12 translate-x-12 rounded-full transition-transform group-hover:scale-110 duration-300 opacity-10"
        style={{ background: tone }}
      />

      {/* icono con fondo sólido */}
      <div className="relative">
        <div className="absolute inset-0 rounded-xl opacity-20" style={{ background: tone }} />
        <div
          style={{ background: tone }}
          className="relative flex items-center justify-center w-14 h-14 rounded-xl text-white shadow-lg transform transition-transform group-hover:scale-105 z-10 text-xl"
        >
          {icon}
        </div>
      </div>

      {/* textos */}
      <div className="flex flex-col text-left z-10">
        <span className="text-lg font-semibold text-gray-800 mb-1">{title}</span>
        {subtitle && <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{subtitle}</span>}
      </div>
    </motion.button>
  );
};

// ====== Badges método de pago (igual que antes) ======
const metodoBadgeClass = (metodo: string) => {
  switch (metodo) {
    case "Efectivo":
      // #00B074 con hover un poco más oscuro
      return "bg-[#00B074] hover:brightness-95 text-white";
    case "Tarjeta":
      // #C2E66E con texto #123 (== #112233)
      return "bg-[#C2E66E] hover:brightness-95 text-[#112233]";
    case "Transferencia":
      // #3f3d46 (outline), texto blanco
      return "bg-[#3f3d46] hover:brightness-110 text-white";
    default:
      return "bg-gray-600 hover:bg-gray-700 text-white";
  }
};

const MetodoIcon: React.FC<{ metodo: string; className?: string }> = ({ metodo, className = "w-4 h-4" }) => {
  switch (metodo) {
    case "Efectivo":
      return <Banknote className={className} strokeWidth={2} />;
    case "Tarjeta":
      return <CreditCard className={className} strokeWidth={2} />;
    case "Transferencia":
      return <Landmark className={className} strokeWidth={2} />;
    default:
      return <Banknote className={className} strokeWidth={2} />;
  }
};


// ====== Helpers de fechas para filtros rápidos ======
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};
const startOfWeek = () => {
  const d = startOfToday();
  const day = d.getDay(); // 0=domingo
  const diff = day === 0 ? 6 : day - 1; // semana inicia lunes
  d.setDate(d.getDate() - diff);
  return d;
};
const endOfWeek = () => {
  const d = startOfWeek();
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

const VentasDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Estado para datos del backend
  const [ventasData, setVentasData] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para productos populares
  const [productosPopulares, setProductosPopulares] = useState<ProductoPopular[]>([]);
  const [isLoadingPopulares, setIsLoadingPopulares] = useState(false);

  const { addAlert } = useAlerts();

  // Cargar ventas del backend
  useEffect(() => {
    const loadVentas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Obtener ventas de los últimos 30 días por defecto
        const fechaFin = new Date().toISOString().split('T')[0];
        const fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const ventas = await ventasService.getVentas('confirmada', fechaInicio, fechaFin);
        setVentasData(ventas);
      } catch (err) {
        console.error('Error cargando ventas:', err);
        setError('Error al cargar las ventas');
        // En caso de error, usar array vacío para que la interfaz se muestre
        setVentasData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadVentas();
  }, []);

  // Cargar productos populares
  useEffect(() => {
    const loadProductosPopulares = async () => {
      try {
        setIsLoadingPopulares(true);
        const populares = await ventasService.getProductosPopulares(4);
        setProductosPopulares(populares);
      } catch (err) {
        console.error('Error cargando productos populares:', err);
        // Agregar alerta al sistema
        addAlert({
          message: 'Error al cargar productos populares',
          icon: <MdError size={16} />,
          module: 'Ventas',
          action: () => navigate('/ventas'), // Acción para ir al módulo
        });
        // En caso de error, mantener array vacío
        setProductosPopulares([]);
      } finally {
        setIsLoadingPopulares(false);
      }
    };

    loadProductosPopulares();
  }, [addAlert, navigate]);

  // Botones con mismo look & feel que Inventario
  const cards = [
  {
    title: "REGISTRAR VENTA",
    desc: "Ir al punto de venta",
    tone: primary,
    icon: <MdReceiptLong size={22} />,   // ícono estilo Inventario
    path: "/ventas/ventas",
  },
  {
    title: "PRODUCTO",
    desc: "Gestión de productos",
    tone: mid,
    icon: <MdInventory2 size={22} />,    // ícono estilo Inventario
    path: "/ventas/producto",
  },
  {
    title: "CIERRE DE CAJA",
    desc: "Corte y arqueo de caja",
    tone: yellow,
    icon: <MdAccountBalance size={22} />, // ícono estilo Inventario
    path: "/ventas/cierre-caja",
  },
];


  // Convertir datos del backend al formato esperado por el componente
  const ventas = useMemo(() => {
    return ventasData.map(venta => ({
      id: `#${venta.id_venta}`,
      productos: venta.productos || 'Productos varios', // Si no hay descripción, usar genérica
      total: venta.total_venta,
      metodo: venta.tipo_pago === 'Cash' ? 'Efectivo' :
              venta.tipo_pago === 'Tarjeta' ? 'Tarjeta' :
              venta.tipo_pago === 'Transferencia' ? 'Transferencia' : 'Otro',
      fecha: venta.fecha_venta,
    }));
  }, [ventasData]);

  // Convertir productos populares del backend al formato del componente
  const populares = useMemo(() => {
    return productosPopulares.map((producto) => ({
      id: `pp${producto.id_producto}`,
      nombre: producto.nombre_producto,
      tag: producto.categoria || 'Producto',
      icon: getProductIcon(producto.nombre_producto),
      rating: producto.rating_promedio || 4.5 + Math.random() * 0.4, // Rating simulado si no existe
      totalVendido: producto.total_vendido,
      vecesVendido: producto.veces_vendido,
    }));
  }, [productosPopulares]);

  // Función auxiliar para asignar íconos según el nombre del producto
  const getProductIcon = (nombre: string): string => {
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes('gringa')) return '🌯';
    if (nombreLower.includes('shuco') || nombreLower.includes('salami')) return '🌭';
    if (nombreLower.includes('hamburguesa')) return '🍔';
    if (nombreLower.includes('papas') || nombreLower.includes('fritas')) return '🍟';
    if (nombreLower.includes('bebida') || nombreLower.includes('refresco')) return '🥤';
    return '🍽️'; // Ícono genérico para comida
  };

  // ------- Estado de filtros -------
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [metodos, setMetodos] = useState<string[]>([]); // multi-select

  // 🔸 Por requerimiento: por defecto "todo"
  const [range, setRange] = useState<RangeFilter>("todo");

  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const toggleMetodo = (m: string) => {
    setMetodos((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  // Aplicación de filtros en memoria (hookear a tu fetch en producción)
  const filteredVentas = useMemo(() => {
    let data = [...ventas];

    // Búsqueda por #venta o productos
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (v) => v.id.toLowerCase().includes(q) || v.productos.toLowerCase().includes(q)
      );
    }

    // Filtro por método(s)
    if (metodos.length > 0) {
      data = data.filter((v) => metodos.includes(v.metodo));
    }

    // Filtro por rango de fechas
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;
    if (range === "hoy") {
      from = startOfToday();
      to = endOfToday();
    } else if (range === "ayer") {
      const d1 = startOfToday();
      d1.setDate(d1.getDate() - 1);
      const d2 = endOfToday();
      d2.setDate(d2.getDate() - 1);
      from = d1;
      to = d2;
    } else if (range === "esta_semana") {
      from = startOfWeek();
      to = endOfWeek();
    } else if (range === "ultimos_7") {
      from = new Date(now);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      to = endOfToday();
    } else if (range === "ultimos_30") {
      from = new Date(now);
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      to = endOfToday();
    } else if (range === "este_mes") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (range === "custom" && customFrom && customTo) {
      from = new Date(customFrom);
      from.setHours(0, 0, 0, 0);
      to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
    }
    // si es "todo" no se aplican fechas

    if (from && to) {
      data = data.filter((v) => {
        const d = new Date(v.fecha);
        return d >= (from as Date) && d <= (to as Date);
      });
    }

    return data;
  }, [ventas, search, metodos, range, customFrom, customTo]);

  const activeFilters = metodos.length + (range !== "todo" ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-2xl font-bold mb-2 text-gray-800"
      >
        MÓDULO DE VENTAS
      </motion.h1>

      {/* Mostrar error si existe */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
        >
          <strong>Error:</strong> {error}
        </motion.div>
      )}

      {/* Cards principales (mismo diseño/animación que Inventario) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="grid md:grid-cols-3 gap-6 mb-10"
      >
        {cards.map((card, idx) => (
          <ActionCard
            key={idx}
            title={card.title}
            subtitle={card.desc}
            icon={card.icon}
            tone={card.tone}
            onClick={() => navigate(card.path)}
          />
        ))}
      </motion.div>

      {/* Toolbar superior: búsqueda + filtro por método (el filtro de fecha se mueve al header de la tabla) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.04 }}
        className="flex flex-wrap items-center justify-between gap-3 mb-3"
      >
        <div className="flex items-center gap-3">
          {/* Buscar */}
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ticket o producto"
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Filtro por método */}
          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            >
              <span>Filtro</span>
              {activeFilters > 0 && (
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {activeFilters}
                </span>
              )}
            </button>
            {showFilter && (
              <div className="absolute z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Método de pago</p>
                {(["Efectivo", "Tarjeta", "Transferencia"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={metodos.includes(m)}
                      onChange={() => toggleMetodo(m)}
                      className="accent-emerald-600"
                    />
                    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-[11px] ${metodoBadgeClass(m)}`}>
                      <MetodoIcon metodo={m} className="w-4 h-4" />
                      <span>{m}</span>
                    </span>
                  </label>
                ))}
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => setMetodos([])}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => setShowFilter(false)}
                    className="text-xs text-emerald-700 font-semibold"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* CONTENEDOR en 2 columnas: Tabla (izq) + Populares (der) */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* IZQUIERDA: Tabla (con header que contiene el filtro de fecha) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.06 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          {/* Header de la tabla con botón de fecha */}
          <div className="mb-4 flex items-center justify-between relative">
            <h2 className="text-lg font-semibold flex items-center gap-2">Historial de ventas</h2>

            {/* Rango de fechas (ubicado Aquí, encima de la tabla) */}
            <div className="relative">
              <button
                onClick={() => setShowDate((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              >
                
                <span>
                  {range === "hoy"
                    ? "Hoy"
                    : range === "ayer"
                    ? "Ayer"
                    : range === "esta_semana"
                    ? "Esta semana"
                    : range === "ultimos_7"
                    ? "Últimos 7 días"
                    : range === "ultimos_30"
                    ? "Últimos 30 días"
                    : range === "este_mes"
                    ? "Este mes"
                    : range === "custom"
                    ? "Rango personalizado"
                    : "Todas las fechas"}
                </span>
                <span>▾</span>
              </button>

              {showDate && (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Rango</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {([
                      { key: "todo" as RangeFilter, label: "Todas" },
                      { key: "hoy" as RangeFilter, label: "Hoy" },
                      { key: "ayer" as RangeFilter, label: "Ayer" },
                      { key: "esta_semana" as RangeFilter, label: "Esta semana" },
                      { key: "ultimos_7" as RangeFilter, label: "Últimos 7 días" },
                      { key: "ultimos_30" as RangeFilter, label: "Últimos 30 días" },
                      { key: "este_mes" as RangeFilter, label: "Este mes" },
                      { key: "custom" as RangeFilter, label: "Personalizado" },
                    ] as FilterOption[]).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setRange(key)}
                        className={`px-2 py-1.5 rounded-md border ${
                          range === key
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {range === "custom" && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-md border border-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-md border border-gray-200"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => {
                        setRange("todo");      // ← reset a "todo"
                        setCustomFrom("");
                        setCustomTo("");
                      }}
                      className="text-xs text-gray-600 hover:underline"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setShowDate(false)}
                      className="text-xs text-emerald-700 font-semibold"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabla */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando ventas...</p>
              </div>
            </div>
          ) : (
            <>
            <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3 text-sm"># Venta</th>
                <th className="p-3 text-sm">Producto(s)</th>
                <th className="p-3 text-sm">Total</th>
                <th className="p-3 text-sm">Método de pago</th>
              </tr>
            </thead>
            <tbody>
              {filteredVentas.map((v) => (
                <tr key={v.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{v.id}</td>
                  <td className="p-3">{v.productos}</td>
                  <td className="p-3 font-semibold">Q{v.total.toFixed(2)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center justify-center gap-2.5 px-4 py-2
                                  rounded-xl text-sm font-semibold shadow-sm transition-colors
                                  min-w-[11rem] shrink-0 whitespace-nowrap
                                  ${metodoBadgeClass(v.metodo)}`}
                      title={v.metodo}
                    >
                      <MetodoIcon metodo={v.metodo} className="w-5 h-5" />
                      <span className="leading-none">{v.metodo}</span>
                    </span>
                  </td>

                </tr>
              ))}
              {filteredVentas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                    No hay resultados para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="text-gray-500 text-sm mt-4">
            Mostrando {filteredVentas.length} registro(s)
          </div>
          </>
          )}
        </motion.div>

        {/* DERECHA: Panel de Ventas Populares */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.08 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Ventas Populares</h3>
            <button className="text-gray-400 hover:text-gray-600" title="Más opciones">⋯</button>
          </div>

          <div className="space-y-3">
            {isLoadingPopulares ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                  <p className="text-gray-500 text-xs">Cargando productos...</p>
                </div>
              </div>
            ) : populares.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No hay productos populares</p>
              </div>
            ) : (
              populares.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition"
              >
                <div className="shrink-0 w-16 h-16 rounded-xl bg-gray-50 grid place-content-center text-3xl">
                  {p.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {p.nombre}
                  </div>
                  <div 
                  key={p.id}
                  className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-amber-500">★ {p.rating.toFixed(1)}</span>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {p.tag}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/ventas/ventas")}
                  className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 grid place-content-center"
                  title="Añadir"
                >
                  +
                </button>
              </div>
            ))
            )}
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default VentasDashboard;
