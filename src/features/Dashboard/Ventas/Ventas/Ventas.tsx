import React, { useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* =========================================================================
   Tipos
   ========================================================================= */
export type Categoria = { id: string; nombre: string };
export type Producto = {
  id: string;
  nombre: string;
  precio: number; // Q
  categoriaId: string;
  imagen?: string | null;
};
export type CartItem = {
  producto: Producto;
  qty: number;
  mods?: string; // ej: "sin cebolla, sin guacamole | extra Salchicha x1"
};

/* =========================================================================
   Datos quemados
   ========================================================================= */
const baseCategorias: Categoria[] = [
  { id: 'all', nombre: 'Todos' },
  { id: 'shucos', nombre: 'Shucos' },
  { id: 'hamburguesas', nombre: 'Hamburguesas' },
  { id: 'gringas', nombre: 'Gringas' },
  { id: 'papas', nombre: 'Papas' },
  { id: 'bebidas', nombre: 'Bebidas' },
];

const baseProductos: Producto[] = [
  // Shucos
  { id: 'p1', nombre: 'Shuco de Carne', precio: 20, categoriaId: 'shucos' },
  { id: 'p2', nombre: 'Shuco de Chorizo', precio: 10, categoriaId: 'shucos' },
  { id: 'p3', nombre: 'Shuco de Salchicha', precio: 12, categoriaId: 'shucos' },
  { id: 'p4', nombre: 'Shuco Mixto', precio: 18, categoriaId: 'shucos' },
  // Hamburguesas
  { id: 'p10', nombre: 'Queso Hamburguesa', precio: 25, categoriaId: 'hamburguesas' },
  { id: 'p11', nombre: 'Hamburguesa de pollo', precio: 22, categoriaId: 'hamburguesas' },
  { id: 'p12', nombre: 'Hamburguesa doble de queso', precio: 30, categoriaId: 'hamburguesas' },
  // Gringas
  { id: 'p20', nombre: 'Gringa Mixta', precio: 20, categoriaId: 'gringas' },
  { id: 'p21', nombre: 'Gringa Asada', precio: 20, categoriaId: 'gringas' },
  { id: 'p22', nombre: 'Gringa Adobada', precio: 20, categoriaId: 'gringas' },
  // Papas
  { id: 'p30', nombre: 'Papas Fritas', precio: 15, categoriaId: 'papas' },
  { id: 'p31', nombre: 'Salchipapas', precio: 20, categoriaId: 'papas' },
  // Bebidas
  { id: 'p40', nombre: 'Coca Cola', precio: 5, categoriaId: 'bebidas' },
  { id: 'p41', nombre: 'Pepsi', precio: 5, categoriaId: 'bebidas' },
  { id: 'p42', nombre: 'Orange', precio: 6, categoriaId: 'bebidas' },
  { id: 'p43', nombre: 'Sprite', precio: 6, categoriaId: 'bebidas' },
];

/* =========================================================================
   Íconos por categoría
   ========================================================================= */
const CATEGORY_ICON: Record<string, string> = {
  shucos: '🌭',
  hamburguesas: '🍔',
  gringas: '🌯',
  papas: '🍟',
  bebidas: '🥤',
};

/* =========================================================================
   Ingredientes por producto (para personalización)
   ========================================================================= */
const productoIngredientes: Record<string, string[]> = {
  // Shucos
  p1: ['Salsa', 'Mayonesa', 'Mostaza', 'Guacamole', 'Repollo', 'Cebolla', 'Ketchup', 'Chile'],
  p2: ['Salsa', 'Mayonesa', 'Mostaza', 'Guacamole', 'Repollo', 'Cebolla', 'Ketchup', 'Chile'],
  p3: ['Salsa', 'Mayonesa', 'Mostaza', 'Guacamole', 'Repollo', 'Cebolla', 'Ketchup', 'Chile'],
  p4: ['Salsa', 'Mayonesa', 'Mostaza', 'Guacamole', 'Repollo', 'Cebolla', 'Ketchup', 'Chile'],

  // Hamburguesas
  p10: ['Queso', 'Lechuga', 'Tomate', 'Cebolla', 'Pepinillos', 'Salsa', 'Mayonesa'],
  p11: ['Lechuga', 'Tomate', 'Cebolla', 'Salsa', 'Mayonesa'],
  p12: ['Doble Queso', 'Lechuga', 'Tomate', 'Cebolla', 'Pepinillos', 'Salsa', 'Mayonesa'],

  // Gringas
  p20: ['Queso', 'Carne', 'Pollo', 'Salsa', 'Cebolla', 'Guacamole'],
  p21: ['Queso', 'Carne', 'Salsa', 'Cebolla', 'Guacamole'],
  p22: ['Queso', 'Adobado', 'Salsa', 'Cebolla', 'Guacamole'],
};

/* =========================================================================
   Emojis de ingredientes (para las tarjetas del formulario)
   ========================================================================= */
const ING_EMOJI: Record<string, string> = {
  Salsa: '🍅',
  Mayonesa: '🥫',
  Mostaza: '🧴',
  Guacamole: '🥑',
  Repollo: '🥬',
  Cebolla: '🧅',
  Ketchup: '🍅',
  Chile: '🌶️',
  Queso: '🧀',
  Lechuga: '🥬',
  Tomate: '🍅',
  Pepinillos: '🥒',
  Carne: '🥩',
  Pollo: '🍗',
  Adobado: '🥩',
};

// Extras disponibles para Shucos
const EXTRAS_OPCIONES: string[] = ['Salchicha', 'Tocino', 'Longaniza', 'Salami'];
const EXTRA_EMOJI: Record<string, string> = {
  Salchicha: '🌭',
  Tocino: '🥓',
  Longaniza: '🌭',
  Salami: '🍖',
};
// Shucos que mostrarán la sección de extras
const SHUCOS_CON_EXTRAS = new Set(['p1', 'p2', 'p3', 'p4']); // Carne, Chorizo, Salchicha, Mixto

/* =========================================================================
   Utilitarios
   ========================================================================= */
const currency = (q: number) => `Q${q.toFixed(2)}`;

/* —— Parseo del string de mods: "sin ..." y "extra ... xN" —— */
function parseMods(mods?: string): { sin: string[]; extras: Record<string, number> } {
  const out = { sin: [] as string[], extras: {} as Record<string, number> };
  if (!mods) return out;

  const parts = mods.split('|').map(s => s.trim());
  for (const p of parts) {
    if (/^sin\s/i.test(p)) {
      const list = p.replace(/^sin\s+/i, '')
        .split(/,\s*sin\s*/i)
        .map(s => s.trim())
        .filter(Boolean);
      out.sin = list;
    } else if (/^extra\s/i.test(p)) {
      const re = /extra\s+([^,|]+?)\s*x(\d+)/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(p)) !== null) {
        const name = m[1].trim();
        const n = parseInt(m[2], 10) || 0;
        out.extras[name] = n;
      }
    }
  }
  return out;
}

/* =========================================================================
   Pill y Card
   ========================================================================= */
const Pill: React.FC<React.PropsWithChildren<{ active?: boolean; onClick?: () => void }>> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={
      'h-14 px-5 rounded-xl text-base font-semibold transition-colors ' +
      (active ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
    }
  >
    {children}
  </button>
);

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>
);

/* =========================================================================
   Drawer
   ========================================================================= */
const DrawerRight: React.FC<
  React.PropsWithChildren<{ open: boolean; onClose: () => void; widthClass?: string; title?: string }>
> = ({ open, onClose, widthClass = 'w-full sm:w-[420px]', title, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.24 }}
            className={`absolute right-0 top-0 h-full bg-white shadow-2xl ${widthClass} flex flex-col`}
          >
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold text-gray-800">{title}</div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* =========================================================================
   Componente principal
   ========================================================================= */
const Ventas: React.FC<{ onBack?: () => void }> = () => {
  const navigate = useNavigate();

  // Estado base
  const [categorias, setCategorias] = useState<Categoria[]>(baseCategorias);
  const [productos] = useState<Producto[]>(baseProductos);

  // Filtros
  const [catActiva, setCatActiva] = useState<string>('all');
  const [query, setQuery] = useState('');

  // Carrito
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [ordenN, setOrdenN] = useState<number>(1);

  // Cliente
  const [cliente, setCliente] = useState<{ nombre: string; telefono: string; nit: string } | null>(null);

  // Modales/Drawers
  const [openCat, setOpenCat] = useState(false);
  const [openCliente, setOpenCliente] = useState(false);
  // Cantidades de extras en el customizer
  const [customExtrasQty, setCustomExtrasQty] = useState<Record<string, number>>({});

  // Drawer de pago
  const [openPago, setOpenPago] = useState(false);
  const [metodo, setMetodo] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [referencia, setReferencia] = useState('');
  const [banco, setBanco] = useState('');

  // Efectivo
  const [dineroRecibido, setDineroRecibido] = useState<string>('');
  const receivedNumber = Number(dineroRecibido || 0);

  //totales de caja y banco (recuento)
  const [totalCaja, setTotalCaja] = useState<number>(0);
  const [totalBanco, setTotalBanco] = useState<number>(0);

  // Drawer de personalización
  const [openCustom, setOpenCustom] = useState(false);
  const [customProd, setCustomProd] = useState<Producto | null>(null);
  const [customChecks, setCustomChecks] = useState<Record<string, boolean>>({});
  const [customQty, setCustomQty] = useState<number>(1);

  // pago errores
  const [pagoError, setPagoError] = useState<string>('');
  const [cashInvalid, setCashInvalid] = useState<boolean>(false);
  const [transfInvalid, setTransfInvalid] = useState(false);

  // Clientes registrados / nuevo
  type ClienteReg = { id: string; nombre: string; telefono: string; nit: string };
  const [clientesReg, setClientesReg] = useState<ClienteReg[]>([]);
  const [clientModo, setClientModo] = useState<'registrados' | 'nuevo'>('registrados');
  const [nitMode, setNitMode] = useState<'CF' | 'NIT'>('CF');
  const [nitValue, setNitValue] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const filteredClients = useMemo(() => {
    const s = clientSearch.trim().toLowerCase();
    if (!s) return clientesReg;
    return clientesReg.filter(
      c =>
        c.nombre.toLowerCase().includes(s) ||
        (c.telefono ?? '').toLowerCase().includes(s) ||
        (c.nit ?? '').toLowerCase().includes(s)
    );
  }, [clientSearch, clientesReg]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // ——— NUEVO: edición de línea del carrito ———
  const [editTarget, setEditTarget] = useState<{ id: string; mods?: string } | null>(null);
  // ---------------------------------------------------------------

  // Búsqueda/Filtrado
  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      const catOk = catActiva === 'all' ? true : p.categoriaId === catActiva;
      const qOk = q ? p.nombre.toLowerCase().includes(q) : true;
      return catOk && qOk;
    });
  }, [productos, query, catActiva]);

  /* ============================================================
     Carrito
     ============================================================ */
  const addToCart = (prod: Producto, mods?: string, qty: number = 1) => {
    setCarrito((prev) => {
      const idx = prev.findIndex((c) => c.producto.id === prod.id && (c.mods || '') === (mods || ''));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { producto: prod, qty, mods }];
    });
  };

  const setQty = (id: string, mods: string | undefined, qty: number) => {
    setCarrito((prev) =>
      prev
        .map((c) =>
          c.producto.id === id && (c.mods || '') === (mods || '')
            ? { ...c, qty: Math.max(0, qty) }
            : c
        )
        .filter((c) => c.qty > 0)
    );
  };

  const removeItem = (id: string, mods?: string) => {
    setCarrito((prev) => prev.filter((c) => !(c.producto.id === id && (c.mods || '') === (mods || ''))));
  };

  const limpiar = () => setCarrito([]);

  const total = useMemo(
    () => carrito.reduce((acc, it) => acc + it.producto.precio * it.qty, 0),
    [carrito]
  );

  /* ============================================================
     Personalización
     ============================================================ */
  const catPersonalizable = new Set(['shucos', 'hamburguesas', 'gringas']);

  const openCustomizer = (prod: Producto) => {
    // modo "nuevo"
    setEditTarget(null);

    if (!catPersonalizable.has(prod.categoriaId)) {
      addToCart(prod);
      return;
    }
    setCustomProd(prod);

    const ingrs = productoIngredientes[prod.id] || [];
    const initialChecks: Record<string, boolean> = {};
    ingrs.forEach((i) => (initialChecks[i] = true));
    setCustomChecks(initialChecks);

    if (SHUCOS_CON_EXTRAS.has(prod.id)) {
      const initExtras: Record<string, number> = {};
      EXTRAS_OPCIONES.forEach((n) => (initExtras[n] = 0));
      setCustomExtrasQty(initExtras);
    } else {
      setCustomExtrasQty({});
    }

    setCustomQty(1);
    setOpenCustom(true);
  };

  // —— NUEVO: abrir personalizador para EDITAR una línea del carrito ——
  const openEditFromCart = (item: CartItem) => {
    setEditTarget({ id: item.producto.id, mods: item.mods });

    const prod = item.producto;
    setCustomProd(prod);

    // checks
    const ingrs = productoIngredientes[prod.id] || [];
    const checks: Record<string, boolean> = {};
    ingrs.forEach(i => checks[i] = true);

    const parsed = parseMods(item.mods);
    parsed.sin.forEach(s => { if (s in checks) checks[s] = false; });
    setCustomChecks(checks);

    // extras
    if (SHUCOS_CON_EXTRAS.has(prod.id)) {
      const init: Record<string, number> = {};
      EXTRAS_OPCIONES.forEach(n => init[n] = 0);
      Object.entries(parsed.extras).forEach(([k, v]) => {
        if (k in init) init[k] = v;
      });
      setCustomExtrasQty(init);
    } else {
      setCustomExtrasQty({});
    }

    setCustomQty(item.qty);
    setOpenCustom(true);
  };

  const confirmCustomizer = () => {
    if (!customProd) return;

    // 1) Omitidos
    const allIngr = Object.keys(customChecks);
    const omitidos = allIngr.filter((k) => !customChecks[k]);
    const modsSin = omitidos.length ? 'sin ' + omitidos.join(', sin ') : undefined;

    // 2) Extras
    const extrasList = Object.entries(customExtrasQty)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k} x${n}`);
    const modsExtras = extrasList.length ? 'extra ' + extrasList.join(', extra ') : undefined;

    // 3) Unir
    const modsFinal = [modsSin, modsExtras].filter(Boolean).join(' | ');

    // Si estamos editando, reemplaza la línea; si no, agrega
    if (editTarget) {
      setCarrito(prev => {
        const withoutOld = prev.filter(
          c => !(c.producto.id === editTarget.id && (c.mods || '') === (editTarget.mods || ''))
        );
        // fusionar si ya existe una igual
        const keyMatch = (c: CartItem) => c.producto.id === customProd.id && (c.mods || '') === (modsFinal || '');
        const idx = withoutOld.findIndex(keyMatch);
        if (idx >= 0) {
          const copy = [...withoutOld];
          copy[idx] = { ...copy[idx], qty: copy[idx].qty + customQty };
          return copy;
        }
        return [...withoutOld, { producto: customProd, qty: customQty, mods: modsFinal || undefined }];
      });
      setEditTarget(null);
    } else {
      addToCart(customProd, modsFinal || undefined, customQty);
    }

    setOpenCustom(false);
  };

  /* ============================================================
     Modales menores
     ============================================================ */
  const handleCrearCategoria = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nombre = String(fd.get('nombre') || '').trim();
    if (!nombre) return;
    const id = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (categorias.find((c) => c.id === id)) return alert('Ya existe esa categoría');
    setCategorias((prev) => [...prev, { id, nombre }]);
    setOpenCat(false);
    setCatActiva(id);
  };

  const handleGuardarCliente = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (nitMode === 'NIT' && !String(nitValue).trim()) {
      alert('Ingresa el NIT');
      return;
    }

    const nuevo = {
      nombre: String(fd.get('nombre') || 'Daniel Figueroa'),
      telefono: String(fd.get('telefono') || '56522922'),
      nit: nitMode === 'CF' ? 'CF' : String(nitValue).trim(),
    };

    setCliente(nuevo);
    setClientesReg(prev => [...prev, { id: `c-${Date.now()}`, ...nuevo }]);

    setNitMode('CF');
    setNitValue('');
    setOpenCliente(false);
  };

  /* ============================================================
     Pago
     ============================================================ */
  const irAPago = () => {
    if (!carrito.length) return alert('Agrega productos a la orden');
    setPagoError('');
    setCashInvalid(false);
    setTransfInvalid(false);
    setOpenPago(true);
  };

  const confirmarPago = () => {
    if (!carrito.length) return alert('Tu carrito está vacío.');

    if (metodo === 'transferencia' && (!referencia.trim() || !banco.trim())) {
      setPagoError('Ingresa número de referencia y banco de origen.');
      setTransfInvalid(true);
      setCashInvalid(false);
      return;
    }

    if (metodo === 'efectivo') {
      if (Number.isNaN(receivedNumber) || receivedNumber <= 0) {
        setPagoError('Ingresa el dinero recibido.');
        setCashInvalid(true);
        setTransfInvalid(false);
        return;
      }
      if (receivedNumber < total) {
        setPagoError('El dinero recibido es menor al total.');
        setCashInvalid(true);
        setTransfInvalid(false);
        return;
      }
    }

    // Actualizar recuentos Caja / Banco
    if (metodo === 'efectivo') setTotalCaja((v) => v + total);
    else setTotalBanco((v) => v + total);

    // Construir payload del ticket
    const recibido = metodo === 'efectivo' ? Number(dineroRecibido || 0) : null;
    const cambioLocal = metodo === 'efectivo' ? Math.max(0, (recibido ?? 0) - total) : null;

    const ticketData = {
      ordenN,
      cliente,
      items: carrito.map((it) => ({
        id: it.producto.id,
        nombre: it.producto.nombre,
        qty: it.qty,
        precio: it.producto.precio,
        mods: it.mods || null,
        subtotal: it.producto.precio * it.qty,
      })),
      total,
      metodo, // 'efectivo' | 'transferencia'
      efectivo: metodo === 'efectivo' ? { dineroRecibido: recibido, cambio: cambioLocal } : null,
      transferencia: metodo === 'transferencia' ? { referencia, banco } : null,
      fechaHora: new Date().toISOString(),
    };

    try { sessionStorage.setItem('ticketventa:last', JSON.stringify(ticketData)); } catch {}

    // Reset y cierre del drawer
    setOrdenN((n) => n + 1);
    limpiar();
    setCliente(null);
    setMetodo('efectivo');
    setReferencia('');
    setBanco('');
    setDineroRecibido('');
    setOpenPago(false);

    // Navegar directamente (el toast se muestra en Ticket)
    navigate('/ventas/ticketventa', { state: ticketData });
  };

  /* ============================================================
     Render
     ============================================================ */
  const cambio = Math.max(0, receivedNumber - total);

  const toModsList = (mods?: string) => {
    if (!mods) return [] as string[];
    return mods
      .replace(/^sin\s+/i, '')
      .split(/,\s*sin\s*/i)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* 1) CONTENEDOR */}
      <div className="max-w-[1280px] mx-auto px-6 py-6">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/ventas")}
              className="flex items-center gap-2 h-14 px-6 rounded-xl bg-white text-gray-700 border border-gray-200 text-base font-semibold shadow-sm hover:bg-gray-50 transition-all"
            >
              <span className="text-xl">←</span>
              <span>Regresar</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-800">MÓDULO DE VENTAS</h2>
          </div>
        </motion.div>

        {/* 2) GRID DOS COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-8">
          {/* Columna izquierda: catálogo */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="min-w-0"
          >
            {/* Fila categorías + agregar */}
            <div className="flex items-center gap-2 mb-4">
              {categorias.map((c) => (
                <Pill key={c.id} active={catActiva === c.id} onClick={() => setCatActiva(c.id)}>
                  {c.nombre}
                </Pill>
              ))}
              <button
                onClick={() => setOpenCat(true)}
                className="ml-1 h-14 px-5 rounded-xl text-base font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              >
                + Categoría
              </button>
              <div className="flex-1" />
              <div className="relative w-full sm:w-96">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busca aquí lo que te interese"
                  className="w-full h-14 rounded-xl border border-gray-200 bg-white pl-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              </div>
            </div>

            {/* Contenedor con scroll SOLO en 'Todos' */}
            <div className={catActiva === 'all' ? 'max-h-[70vh] overflow-y-auto pr-1' : ''}>
              <div className={`grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-5 lg:gap-6`}>
                {filtrados.map((p, idx) => (
                  <motion.button
                    key={p.id}
                    onClick={() => openCustomizer(p)}
                    whileHover={{ y: -2, scale: 1.01 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.015 }}
                    className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition overflow-hidden text-left"
                  >
                    <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center text-gray-400">
                      <span className="leading-none text-[100px] xl:text-[130px]">
                        {CATEGORY_ICON[p.categoriaId] ?? '🍔'}
                      </span>
                    </div>

                    <div className="p-3">
                      <div className="font-semibold text-gray-800 group-hover:text-emerald-700 leading-snug break-words line-clamp-2 text-[14px]">
                        {p.nombre}
                      </div>
                      <div className="mt-1 text-[13px] text-gray-500">
                        {categorias.find((c) => c.id === p.categoriaId)?.nombre}
                      </div>
                      <div className="mt-2 font-extrabold text-emerald-700 text-[18px]">
                        {currency(p.precio)}
                      </div>
                    </div>
                  </motion.button>
                ))}

                {filtrados.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-10">
                    No hay productos para mostrar
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Columna derecha: Orden */}
          <motion.aside
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.04 }}
            className="sticky top-6"
          >
            <Card className="p-5 md:p-6">
              {/* Header ORDEN / Cliente */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[12px] text-gray-500 uppercase tracking-wide">ORDEN #</div>
                  <div className="text-2xl font-extrabold text-gray-900">{ordenN}</div>
                </div>
                <button
                  onClick={() => setOpenCliente(true)}
                  className="h-11 px-3 rounded-lg text-[13px] font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                >
                  + Cliente
                </button>
              </div>

              <div className="mb-4 text-[14px] text-gray-700">
                <span className="font-semibold text-gray-900">Cliente: </span>
                {cliente ? (
                  <span>{cliente.nombre} · {cliente.telefono} · NIT {cliente.nit}</span>
                ) : (
                  <span className="italic text-gray-400">(sin cliente)</span>
                )}
              </div>

              {/* Recuento CAJA / BANCO */}
              <div className="mb-4 rounded-xl border border-dashed border-gray-200 p-4 bg-gray-50/60">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-gray-600">CAJA</span>
                  <span className="font-semibold text-gray-900">{currency(totalCaja)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[14px]">
                  <span className="text-gray-600">BANCO</span>
                  <span className="font-semibold text-gray-900">{currency(totalBanco)}</span>
                </div>
              </div>

              {/* Lista de ítems */}
              <div className="divide-y border-y rounded-lg overflow-hidden">
                {carrito.map((it) => {
                  const modsList = toModsList(it.mods);
                  return (
                    <div
                      key={it.producto.id + (it.mods || '')}
                      className="py-5 px-4 flex items-start gap-4 hover:bg-gray-50"
                    >
                      <div className="w-14 h-14 rounded-md bg-gray-100 grid place-content-center text-2xl">
                        {CATEGORY_ICON[it.producto.categoriaId] ?? '🍽️'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-[17px] md:text-[18px] leading-tight truncate">
                          {it.producto.nombre}
                        </div>

                        {modsList.length > 0 && (
                          <ul className="mt-1.5 pl-5 list-disc text-[13px] leading-5 text-gray-700 space-y-1">
                            {modsList.map((m) => <li key={m}>sin {m}</li>)}
                          </ul>
                        )}

                        <div className="mt-2 text-[13px] text-gray-600">
                          {currency(it.producto.precio)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          className="w-9 h-9 rounded bg-gray-100 hover:bg-gray-200 text-lg"
                          onClick={() => setQty(it.producto.id, it.mods, it.qty - 1)}
                          aria-label="Disminuir"
                        >–</button>
                        <div className="min-w-[2.25rem] text-center text-lg">{it.qty}</div>
                        <button
                          className="w-9 h-9 rounded bg-gray-100 hover:bg-gray-200 text-lg"
                          onClick={() => setQty(it.producto.id, it.mods, it.qty + 1)}
                          aria-label="Aumentar"
                        >+</button>
                      </div>

                      <div className="w-28 text-right font-semibold text-lg">
                        {currency(it.producto.precio * it.qty)}
                      </div>

                      {/* NUEVO: Editar línea */}
                      <button
                        className="text-emerald-600 hover:text-emerald-700 ml-1 text-lg"
                        onClick={() => openEditFromCart(it)}
                        title="Editar"
                        aria-label="Editar"
                      >
                        ✏️
                      </button>

                      <button
                        className="text-rose-600 hover:text-rose-700 ml-1 text-lg"
                        onClick={() => removeItem(it.producto.id, it.mods)}
                        title="Quitar"
                        aria-label="Quitar"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
                {carrito.length === 0 && (
                  <div className="py-8 text-center text-gray-400 text-[14px]">
                    Tu orden está vacía
                  </div>
                )}
              </div>

              {/* TOTAL + Acciones */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-[15px] text-gray-700">
                  <span className="font-medium">TOTAL</span>
                  <span className="text-2xl font-extrabold text-gray-900">{currency(total)}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={limpiar}
                    className="h-12 rounded-lg border text-base font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={irAPago}
                    disabled={!carrito.length}
                    className="h-12 rounded-lg bg-emerald-600 text-white text-base font-semibold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </Card>
          </motion.aside>

        </div>
      </div>

      {/* Drawer: Pago */}
      <DrawerRight
        open={openPago}
        onClose={() => setOpenPago(false)}
        title="Detalle de pago"
        widthClass="w-full sm:w-[525px]"
      >
        <div className="p-5 space-y-5 text-[15px]">
          <Card>
            <div className="px-5 py-3.5 border-b bg-gray-50 rounded-t-xl">
              <span className="text-base font-semibold text-gray-700">Productos</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="text-sm uppercase text-gray-600">
                  <tr>
                    <th className="px-5 py-3.5">Producto</th>
                    <th className="px-5 py-3.5">Precio unitario</th>
                    <th className="px-5 py-3.5">Cantidad</th>
                    <th className="px-5 py-3.5">Subtotal</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {carrito.map((it, i) => (
                    <tr key={it.producto.id + (it.mods || '') + i} className={i % 2 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-gray-100 grid place-content-center">
                            {CATEGORY_ICON[it.producto.categoriaId] ?? '🍔'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800 text-[15px]">{it.producto.nombre}</div>
                            {it.mods && <div className="text-sm text-gray-500">{it.mods}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 text-[15px]">{currency(it.producto.precio)}</td>
                      <td className="px-5 py-3.5">
                        <div className="inline-flex items-center rounded-lg border border-gray-200 px-3 h-10 select-none bg-white text-[15px]">
                          {it.qty}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 text-[16px]">
                        {currency(it.producto.precio * it.qty)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => removeItem(it.producto.id, it.mods)}
                          className="text-gray-500 hover:text-emerald-600 text-[15px]"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {carrito.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-gray-500 text-[15px]">
                        Tu orden está vacía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">{currency(total)}</span>
            </div>
            <div className="my-4 h-px bg-gray-100" />
            <div className="flex items-center justify-between">
              <span className="text-gray-700 text-[15px]">Total</span>
              <span className="text-emerald-600 font-extrabold text-2xl">{currency(total)}</span>
            </div>

            {/* Métodos de pago */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                aria-pressed={metodo === 'efectivo'}
                onClick={() => { setMetodo('efectivo'); setPagoError(''); setCashInvalid(false); }}
                className={`h-12 rounded-lg px-4 font-semibold text-xl border transition ${
                  metodo === 'efectivo'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-inner'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                EFECTIVO
              </button>
              <button
                aria-pressed={metodo === 'transferencia'}
                onClick={() => { setMetodo('transferencia'); setPagoError(''); setCashInvalid(false); }}
                className={`h-12 rounded-lg px-4 font-semibold text-xl border transition ${
                  metodo === 'transferencia'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-inner'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                TRANSFERENCIA
              </button>
            </div>

            {/* Dinero recibido / Cambio SOLO en EFECTIVO */}
            {metodo === 'efectivo' && (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xl font-medium text-gray-600">Dinero recibido</label>
                  <input
                    value={dineroRecibido}
                    onChange={(e) => {
                      setDineroRecibido(e.target.value.replace(/[^0-9.]/g, ''));
                      setCashInvalid(false);
                      setPagoError('');
                    }}
                    placeholder="Q0.00"
                    className={
                      `w-full h-12 rounded-lg border bg-white px-3 text-xl outline-none ` +
                      (cashInvalid ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-200 focus:ring-emerald-200')
                    }
                  />
                </div>
                <div>
                  <label className="text-xl font-medium text-gray-600">Cambio</label>
                  <input
                    value={currency(cambio)}
                    readOnly
                    className="w-full h-12 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xl outline-none"
                  />
                </div>
              </div>
            )}

            {/* Referencia/Banco solo cuando sea TRANSFERENCIA */}
            {metodo === 'transferencia' && (
              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-xl font-medium text-gray-600">Número de referencia</label>
                  <input
                    value={referencia}
                    onChange={(e) => {
                      setReferencia(e.target.value);
                      setTransfInvalid(false);
                      setPagoError('');
                    }}
                    placeholder="Ej. 123456789"
                    className={
                      `w-full h-12 rounded-lg border bg-white px-3 text-xl outline-none ` +
                      (transfInvalid ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-200 focus:ring-emerald-200')
                    }
                  />
                </div>
                <div>
                  <label className="text-xl font-medium text-gray-600">Banco de origen</label>
                  <input
                    value={banco}
                    onChange={(e) => {
                      setBanco(e.target.value);
                      setTransfInvalid(false);
                      setPagoError('');
                    }}
                    placeholder="Ej. Banco Industrial"
                    className={
                      `w-full h-12 rounded-lg border bg-white px-3 text-xl outline-none ` +
                      (transfInvalid ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-200 focus:ring-emerald-200')
                    }
                  />
                </div>
              </div>
            )}

            {/* Error inline */}
            {pagoError && (
              <div className="mt-3 text-s text-rose-600 font-medium">{pagoError}</div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setOpenPago(false)}
                className="h-12 rounded-lg bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPago}
                disabled={!carrito.length}
                className="h-12 rounded-lg bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-700 disabled:opacity-50"
              >
                Pagar ahora
              </button>
            </div>
          </Card>
        </div>
      </DrawerRight>

      {/* Drawer: Personalización */}
      <DrawerRight
        open={openCustom}
        onClose={() => setOpenCustom(false)}
        title={customProd ? `${customProd.nombre}` : 'Personalizar'}
        widthClass="w-full sm:w-[525px]"
      >
        {customProd && (
          <div className="p-5 space-y-6 text-[15px]">
            {/* Header del producto */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-100 grid place-content-center text-4xl">
                {CATEGORY_ICON[customProd.categoriaId] ?? '🍽️'}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-base">{customProd.nombre}</div>
                <div className="text-[15px] text-gray-500">{currency(customProd.precio)}</div>
              </div>
            </div>

            {/* EXTRAS (solo shucos p1..p4) */}
            {SHUCOS_CON_EXTRAS.has(customProd.id) && (
              <div className="space-y-3">
                <div className="text-[15px] font-medium text-gray-800">Agrega extras</div>
                <div className="space-y-2">
                  {EXTRAS_OPCIONES.map((k) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-xl border border-gray-200 p-3 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{EXTRA_EMOJI[k] ?? '🍖'}</span>
                        <span className="text-[15px] text-gray-800">{k}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCustomExtrasQty((prev) => ({
                              ...prev,
                              [k]: Math.max(0, (prev[k] || 0) - 1),
                            }))
                          }
                          className="h-9 w-9 rounded bg-gray-100 hover:bg-gray-200"
                          aria-label={`Quitar ${k}`}
                        >
                          –
                        </button>
                        <div className="min-w-[2rem] text-center text-[15px]">
                          {customExtrasQty[k] || 0}
                        </div>
                        <button
                          onClick={() =>
                            setCustomExtrasQty((prev) => ({
                              ...prev,
                              [k]: (prev[k] || 0) + 1,
                            }))
                          }
                          className="h-9 w-9 rounded bg-gray-100 hover:bg-gray-200"
                          aria-label={`Agregar ${k}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredientes a quitar */}
            <div className="text-[15px] text-gray-600">
              Selecciona lo que <span className="font-medium">NO</span> llevará el producto
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.keys(customChecks).map((k) => {
                const checked = customChecks[k];
                return (
                  <label
                    key={k}
                    className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border transition cursor-pointer select-none ${
                      checked ? 'border-gray-200 hover:shadow-sm' : 'border-rose-200 bg-rose-50/60'
                    }`}
                  >
                    <div className={`text-6xl leading-none ${checked ? '' : 'opacity-40'}`}>
                      {ING_EMOJI[k] ?? '🍽️'}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setCustomChecks((prev) => ({ ...prev, [k]: e.target.checked }))}
                      />
                      <span className="text-[15px] text-gray-800">{k}</span>
                    </div>

                    {!checked && <div className="pointer-events-none absolute inset-0 rounded-2xl bg-rose-100/30" />}
                  </label>
                );
              })}
              {Object.keys(customChecks).length === 0 && (
                <div className="col-span-full text-[15px] text-gray-500">
                  Este producto no tiene ingredientes configurables.
                </div>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <div className="text-[15px] text-gray-600 mb-2">Cantidad</div>
              <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setCustomQty((q) => Math.max(1, q - 1))}
                  className="h-11 w-11 grid place-content-center text-gray-700 hover:bg-gray-50"
                  aria-label="Disminuir"
                >
                  –
                </button>
                <div className="px-5 select-none text-base">{customQty}</div>
                <button
                  onClick={() => setCustomQty((q) => q + 1)}
                  className="h-11 w-11 grid place-content-center text-gray-700 hover:bg-gray-50"
                  aria-label="Aumentar"
                >
                  +
                </button>
              </div>
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setOpenCustom(false)}
                className="h-12 rounded-lg bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCustomizer}
                className="h-12 rounded-lg bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-700"
              >
                {editTarget ? 'Guardar cambios' : 'Añadir al carrito'}
              </button>
            </div>
          </div>
        )}
      </DrawerRight>

      {/* Modal: crear categoría */}
      {openCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenCat(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Agregar categoría</h3>
              <button onClick={() => setOpenCat(false)} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
            </div>
            <form onSubmit={handleCrearCategoria} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la categoría</label>
                <input
                  name="nombre"
                  placeholder="Ej. Salsas"
                  className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpenCat(false)} className="h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="h-10 rounded-lg bg-emerald-600 text-white px-4 text-sm font-semibold hover:bg-emerald-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: agregar/seleccionar cliente (ACTUALIZADO) */}
      {openCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenCliente(false)} />
          <div className="relative w-full max-w-[720px] bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {clientModo === 'registrados' ? 'Clientes registrados' : 'Agregar cliente'}
              </h3>
              <button onClick={() => setOpenCliente(false)} className="p-2 rounded-lg hover:bg-gray-100">✕</button>
            </div>

            {/* Selector de modo */}
            <div className="grid sm:grid-cols-[1fr_220px] gap-3 mb-4">
              <div className="text-xl text-gray-600 self-center">
                Elige si deseas seleccionar un cliente existente o registrar uno nuevo.
              </div>
              <div>
                <label className="block text-xl font-semibold text-gray-600 mb-1">Modo</label>
                <select
                  value={clientModo}
                  onChange={(e) => setClientModo(e.target.value as 'registrados' | 'nuevo')}
                  className="w-full h-11 rounded-lg border border-gray-200 px-3 text-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="registrados">Clientes Registrados</option>
                  <option value="nuevo">Agregar Cliente</option>
                </select>
              </div>
            </div>

            {clientModo === 'registrados' ? (
              <>
                <div className="mb-3">
                  <label className="block text-xl font-semibold text-gray-600 mb-1">Buscar</label>
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar por nombre, teléfono o NIT…"
                    className="w-full h-11 rounded-lg border border-gray-200 px-3 text-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>

                <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
                  {filteredClients.length ? (
                    <ul className="divide-y text-sm">
                      {filteredClients.map((c) => (
                        <li key={c.id}>
                          <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="clienteReg"
                              checked={selectedClientId === c.id}
                              onChange={() => setSelectedClientId(c.id)}
                              className="accent-emerald-600"
                            />
                            <div className="min-w-0">
                              <div className="text-xl text-gray-800 truncate">{c.nombre}</div>
                              <div className="text-xl text-gray-500">
                                {c.telefono || '—'} · {c.nit || 'NIT: —'}
                              </div>
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-500">
                      No hay clientes registrados.
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setOpenCliente(false)}
                    className="h-10 rounded-lg border px-4 text-xl font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedClientId}
                    onClick={() => {
                      const c = clientesReg.find((x) => x.id === selectedClientId);
                      if (!c) return;
                      setCliente({ nombre: c.nombre, telefono: c.telefono, nit: c.nit });
                      setOpenCliente(false);
                    }}
                    className="h-10 rounded-lg bg-emerald-600 text-white px-4 text-xl font-semibold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Seleccionar
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleGuardarCliente} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xl font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      name="nombre"
                      defaultValue=""
                      className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-s outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xl font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      name="telefono"
                      defaultValue=""
                      className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-s outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>

                {/* --- NIT: selector CF / NIT --- */}
                <div>
                  <label className="block text-xl font-medium text-gray-700 mb-2">NIT</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setNitMode('CF'); setNitValue(''); }}
                      className={`h-11 px-4 rounded-lg border text-lg font-semibold transition ${
                        nitMode === 'CF'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      C.F
                    </button>
                    <button
                      type="button"
                      onClick={() => setNitMode('NIT')}
                      className={`h-11 px-4 rounded-lg border text-lg font-semibold transition ${
                        nitMode === 'NIT'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      NIT
                    </button>
                  </div>

                  {nitMode === 'NIT' && (
                    <input
                      value={nitValue}
                      onChange={(e) => setNitValue(e.target.value)}
                      placeholder="Ej. 1234567-8"
                      className="mt-3 w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-s outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenCliente(false)}
                    className="h-10 rounded-lg border px-4 text-xl font-semibold hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-emerald-600 text-white px-4 text-xl font-semibold hover:bg-emerald-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Ventas;
