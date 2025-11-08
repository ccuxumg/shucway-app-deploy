import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdReceiptLong, MdInventory2, MdAccountBalance, MdError } from "react-icons/md";
import { Banknote, Landmark, CreditCard, TrendingUp, Package, DollarSign, Users } from "lucide-react";
import { ventasService, Venta, ProductoPopular } from "../../../../api/ventasService";
import { useAlerts } from "../../../../hooks/useAlerts";
import type { LucideIcon } from "lucide-react";
import "../../Reportes/Reportes.styles.css";


const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];


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

const VentasDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Estado para datos del backend
  const [ventasData, setVentasData] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para productos populares
  const [productosRecientes, setProductosRecientes] = useState<ProductoPopular[]>([]);
  const [isLoadingPopulares, setIsLoadingPopulares] = useState(false);

  const { addAlert } = useAlerts();

  // ------- Estado de filtros -------
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [metodos, setMetodos] = useState<string[]>([]); // multi-select

  // 🔸 Por requerimiento: por defecto "todo"
  const [range, setRange] = useState<RangeFilter>("todo");

  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[1]); // 10 por defecto

  const toggleMetodo = (m: string) => {
    setMetodos((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Guatemala'
      });
    } catch {
      return dateString;
    }
  };

  // Función para ver detalles de venta
  const verDetallesVenta = (ventaId: string) => {
    // Por ahora solo navega a la página de ventas, pero se puede mejorar para mostrar detalles específicos
    navigate('/ventas/ventas', { state: { ventaId: ventaId.replace('#', '') } });
  };

  // Cargar ventas con filtros aplicados
  useEffect(() => {
    const loadVentas = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determinar fechas según el filtro
        let fechaInicio: string | undefined;
        let fechaFin: string | undefined;
        const now = new Date();

        if (range === "hoy") {
          fechaInicio = fechaFin = now.toISOString().split('T')[0];
        } else if (range === "ayer") {
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          fechaInicio = fechaFin = yesterday.toISOString().split('T')[0];
        } else if (range === "esta_semana") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lunes
          fechaInicio = startOfWeek.toISOString().split('T')[0];
          fechaFin = now.toISOString().split('T')[0];
        } else if (range === "ultimos_7") {
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          fechaInicio = sevenDaysAgo.toISOString().split('T')[0];
          fechaFin = now.toISOString().split('T')[0];
        } else if (range === "ultimos_30") {
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          fechaInicio = thirtyDaysAgo.toISOString().split('T')[0];
          fechaFin = now.toISOString().split('T')[0];
        } else if (range === "este_mes") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          fechaInicio = startOfMonth.toISOString().split('T')[0];
          fechaFin = now.toISOString().split('T')[0];
        } else if (range === "custom" && customFrom && customTo) {
          fechaInicio = customFrom;
          fechaFin = customTo;
        } else {
          // "todo" - últimos 90 días por defecto
          const ninetyDaysAgo = new Date(now);
          ninetyDaysAgo.setDate(now.getDate() - 90);
          fechaInicio = ninetyDaysAgo.toISOString().split('T')[0];
          fechaFin = now.toISOString().split('T')[0];
        }

        const ventas = await ventasService.getVentas('confirmada', fechaInicio, fechaFin);
        setVentasData(ventas);
      } catch (err) {
        console.error('Error cargando ventas:', err);
        setError('Error al cargar las ventas');
        setVentasData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadVentas();
  }, [range, customFrom, customTo]);

  // Cargar productos recientes
  useEffect(() => {
    const loadProductosRecientes = async () => {
      try {
        setIsLoadingPopulares(true);
        const recientes = await ventasService.getProductosRecientes(4);
        setProductosRecientes(recientes);
      } catch (err) {
        console.error('Error cargando productos recientes:', err);
        // Agregar alerta al sistema
        addAlert({
          message: 'Error al cargar productos recientes',
          icon: <MdError size={16} />,
          module: 'Ventas',
          action: () => navigate('/ventas'), // Acción para ir al módulo
        });
        // En caso de error, mantener array vacío
        setProductosRecientes([]);
      } finally {
        setIsLoadingPopulares(false);
      }
    };

    loadProductosRecientes();
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
    title: "VER CLIENTES",
    desc: "Gestión de clientes",
    tone: "#8B5CF6", // purple
    icon: <Users size={22} />, // ícono de usuarios
    path: "/clientes",
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
      productos: venta.productos_resumen || venta.productos || 'Productos varios',
      total: venta.total_venta,
      metodo: venta.tipo_pago === 'Cash' ? 'Efectivo' :
              venta.tipo_pago === 'Tarjeta' ? 'Tarjeta' :
              venta.tipo_pago === 'Transferencia' ? 'Transferencia' : 'Otro',
      fecha: venta.fecha_venta,
    }));
  }, [ventasData]);

  // Convertir productos recientes del backend al formato del componente
  const getProductIcon = (nombre: string): string => {
    const nombreLower = nombre.toLowerCase();
    if (nombreLower.includes('gringa')) return '🌯';
    if (nombreLower.includes('shuco') || nombreLower.includes('salami')) return '🌭';
    if (nombreLower.includes('hamburguesa')) return '🍔';
    if (nombreLower.includes('papas') || nombreLower.includes('fritas')) return '🍟';
    if (nombreLower.includes('bebida') || nombreLower.includes('refresco')) return '🥤';
    return '🍽️'; // Ícono genérico para comida
  };

  const productosRecientesList = useMemo(() => {
    return productosRecientes.map((producto) => ({
      id: `pp${producto.id_producto}`,
      nombre: producto.nombre_producto,
      tag: producto.categoria || 'Producto',
      icon: getProductIcon(producto.nombre_producto),
      rating: producto.rating_promedio || 4.5 + Math.random() * 0.4, // Rating simulado si no existe
      totalVendido: producto.total_vendido,
      vecesVendido: producto.veces_vendido,
    }));
  }, [productosRecientes]);

  // Aplicación de filtros en memoria (solo búsqueda y método de pago) con paginación
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

    return data;
  }, [ventas, search, metodos]);

  // Paginación
  const totalPages = Math.ceil(filteredVentas.length / pageSize);
  const paginatedVentas = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredVentas.slice(startIndex, endIndex);
  }, [filteredVentas, currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Calcular filtros activos
  const activeFilters = metodos.length + (range !== "todo" ? 1 : 0) + (search ? 1 : 0);

  // Calcular métricas para las tarjetas
  const metrics = useMemo(() => {
    const totalVentas = filteredVentas.length;
    // Estimación de productos vendidos (promedio de 2 productos por venta)
    const totalProductosVendidos = Math.round(totalVentas * 2.1);
    const totalIngresos = filteredVentas.reduce((sum, venta) => sum + venta.total, 0);

    return {
      totalVentas,
      totalProductos: totalProductosVendidos,
      totalIngresos
    };
  }, [filteredVentas]);

  // Definir tarjetas métricas siguiendo el patrón de reportes
  const kpiCards = useMemo(() => {
    const base: Array<{
      key: string;
      label: string;
      icon: LucideIcon;
      accent: string;
      background: string;
      value: string;
    }> = [
      {
        key: "totalVentas",
        label: "Total Ventas",
        icon: TrendingUp,
        accent: "#047857",
        background: "#ecfdf3",
        value: metrics.totalVentas.toString(),
      },
      {
        key: "productosVendidos",
        label: "Productos Vendidos",
        icon: Package,
        accent: "#1d4ed8",
        background: "#eff6ff",
        value: metrics.totalProductos.toLocaleString("es-GT"),
      },
      {
        key: "ingresosTotales",
        label: "Ingresos Totales",
        icon: DollarSign,
        accent: "#92400e",
        background: "#fff7ed",
        value: `Q${metrics.totalIngresos.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    ];

    return base;
  }, [metrics]);

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      {/* Header con botón regresar y título */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-4 mb-2"
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-200 font-medium shadow-sm hover:bg-gray-50 transition-all"
        >
          <span className="text-xl">←</span>
          <span>Regresar</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          MÓDULO DE VENTAS
        </h1>
      </motion.div>

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
        className="grid md:grid-cols-4 gap-6 mb-6"
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

      {/* Tarjetas de métricas - estilo reportes */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.02 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        {kpiCards.map((card) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="report-card"
            style={{ background: card.background }}
          >
            <div className="report-card__icon" style={{ color: card.accent }}>
              <card.icon size={22} />
            </div>
            <div className="report-card__content">
              <span className="report-card__label">{card.label}</span>
              <span className="report-card__value">{card.value}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CONTENEDOR en 2 columnas: Tabla (izq) + Recientes (der) */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* IZQUIERDA: Tabla (con header que contiene búsqueda, filtro y rango de fecha) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.06 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          {/* Header de la tabla con búsqueda, filtro y rango de fecha */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Historial de ventas</h2>

              {/* Rango de fechas */}
              <div className="relative">
                <button
                  onClick={() => setShowDate((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
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
                          setRange("todo");
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

            {/* Búsqueda y filtro en la misma línea */}
            <div className="flex items-center gap-3">
              {/* Buscar */}
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ticket o producto"
                  className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                />
              </div>

              {/* Filtro por método */}
              <div className="relative">
                <button
                  onClick={() => setShowFilter((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm"
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
                <th className="p-3 text-sm">Fecha</th>
                <th className="p-3 text-sm">Producto(s)</th>
                <th className="p-3 text-sm">Total</th>
                <th className="p-3 text-sm">Método de pago</th>
                <th className="p-3 text-sm">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVentas.map((v) => (
                <tr key={v.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{v.id}</td>
                  <td className="p-3 text-sm text-gray-600">{formatDate(v.fecha)}</td>
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
                  <td className="p-3">
                    <button
                      onClick={() => verDetallesVenta(v.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Ver detalles"
                    >
                      Ver más
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedVentas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500 text-sm">
                    No hay resultados para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="text-gray-500 text-sm mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>
                Mostrando {paginatedVentas.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, filteredVentas.length)} de {filteredVentas.length} registro(s)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Mostrar:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
          </>
          )}
        </motion.div>

        {/* DERECHA: Panel de Productos Recientes */}
        <motion.aside
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.08 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Productos Más Vendidos</h3>
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
            ) : productosRecientesList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No hay productos recientes</p>
              </div>
            ) : (
              productosRecientesList.map((p) => (
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
                    <span className="text-xs text-blue-500">📊 {p.vecesVendido} vendidos</span>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-700 border border-green-200">
                      Q{p.totalVendido.toFixed(2)}
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
