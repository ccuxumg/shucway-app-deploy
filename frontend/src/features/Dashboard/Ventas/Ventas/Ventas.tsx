import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { productosService, type Producto, type CategoriaProducto, type ProductoConReceta, type RecetaDetalle } from '@/api/productosService';
import { fetchInsumos } from '@/api/inventarioService';
import CategoriaModal from './CategoriaModal';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationContainer } from '@/components/NotificationContainer';
import { Trash2, X, Check, Edit3, Minus, Plus, ShoppingCart } from 'lucide-react';

type Insumo = {
  id_insumo: number;
  nombre_insumo: string;
  // Puedes agregar más campos si es necesario
};

// Tipo para categorías locales (como "Todos")
interface CategoriaLocal {
  id_categoria: number | string;
  nombre_categoria: string;
  descripcion?: string;
  estado: 'activo' | 'desactivado';
}

// Tipo union para categorías
type CategoriaDisplay = CategoriaProducto | CategoriaLocal;
import { clientesService, type Cliente } from '@/api/clientesService';
import { ventasService, type CreateVentaDTO } from '@/api/ventasService';

/* =========================================================================
   Tipos
   ========================================================================= */
export type Categoria = { id: string; nombre: string };
export type CartItem = {
  producto: Producto;
  qty: number;
  mods?: string; // ej: "sin cebolla, sin guacamole | extra Salchicha x1"
  id_variante?: number; // Para variantes del producto
};

/* =========================================================================
   Datos quemados (solo constantes necesarias)
   ========================================================================= */

/* =========================================================================
   Íconos por categoría (usando Lucide React)
   ========================================================================= */
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  shucos: <ShoppingCart className="w-6 h-6" />,
  hamburguesas: <ShoppingCart className="w-6 h-6" />,
  gringas: <ShoppingCart className="w-6 h-6" />,
  papas: <ShoppingCart className="w-6 h-6" />,
  bebidas: <ShoppingCart className="w-6 h-6" />,
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
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={
      'h-14 px-5 rounded-xl text-base font-semibold transition-all duration-200 uppercase ' +
      (active 
        ? 'bg-emerald-800 text-white shadow-lg' 
        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
      )
    }
  >
    {typeof children === 'string' ? children.toUpperCase() : children}
  </motion.button>
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`absolute right-0 top-0 h-full bg-white shadow-2xl ${widthClass} flex flex-col`}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold text-gray-800">{title}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
};

/* =========================================================================
   Componente principal
   ========================================================================= */
const Ventas: React.FC<{ onBack?: () => void }> = () => {
  const navigate = useNavigate();
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Estados para datos del backend
  const [categorias, setCategorias] = useState<CategoriaDisplay[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [catActiva, setCatActiva] = useState<number | 'all'>('all');
  const [query, setQuery] = useState('');

  // Carrito
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [ordenN, setOrdenN] = useState<number>(1);

  // Cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  // Cargar datos del backend al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar categorías, productos y clientes en paralelo
        const [categoriasData, productosData, clientesData] = await Promise.all([
          productosService.getCategorias(),
          productosService.getProductos(true), // Solo productos activos
          clientesService.getClientes(),
        ]);

        // Agregar categoría "Todos" al inicio
        const categoriasConTodos = [
          { id_categoria: 'all', nombre_categoria: 'Todos', descripcion: 'Todas las categorías', estado: 'activo' as const },
          ...categoriasData
        ];
        setCategorias(categoriasConTodos);
        setProductos(productosData);
        setClientes(clientesData);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Modales/Drawers
  const [categoriaModal, setCategoriaModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    categoria?: CategoriaProducto | null;
  }>({
    isOpen: false,
    mode: 'create',
    categoria: null
  });
  const [openCliente, setOpenCliente] = useState(false);
  // Modal de confirmación para eliminar producto del carrito
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    itemToDelete: CartItem | null;
  }>({
    isOpen: false,
    itemToDelete: null
  });
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
  const [clientModo, setClientModo] = useState<'registrados' | 'nuevo' | 'editar'>('registrados');
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null);
  const [nitMode, setNitMode] = useState<'CF' | 'NIT'>('CF');
  const [nitValue, setNitValue] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const filteredClients = useMemo(() => {
    const s = clientSearch.trim().toLowerCase();
    if (!s) return clientes;
    return clientes.filter(
      c =>
        c.nombre.toLowerCase().includes(s) ||
        (c.telefono ?? '').toLowerCase().includes(s)
    );
  }, [clientSearch, clientes]);

  // ——— NUEVO: edición de línea del carrito ———
  const [editTarget, setEditTarget] = useState<{ id: string; mods?: string } | null>(null);
  // ---------------------------------------------------------------

  // Búsqueda/Filtrado
  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      const catOk = catActiva === 'all' ? true : p.id_categoria === catActiva;
      const qOk = q ? p.nombre_producto.toLowerCase().includes(q) : true;
      const activo = p.estado === 'activo';
      return catOk && qOk && activo;
    });
  }, [productos, query, catActiva]);

  /* ============================================================
     Carrito
     ============================================================ */
  const addToCart = (prod: Producto, mods?: string, qty: number = 1, idVariante?: number) => {
    setCarrito((prev) => {
      const idx = prev.findIndex((c) => c.producto.id_producto === prod.id_producto && (c.mods || '') === (mods || '') && c.id_variante === idVariante);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { producto: prod, qty, mods, id_variante: idVariante }];
    });
  };

  const setQty = (id: number, mods: string | undefined, qty: number, idVariante?: number) => {
    setCarrito((prev) =>
      prev
        .map((c) =>
          c.producto.id_producto === id && (c.mods || '') === (mods || '') && c.id_variante === idVariante
            ? { ...c, qty: Math.max(0, qty) }
            : c
        )
        .filter((c) => c.qty > 0)
    );
  };

  const removeItem = (id: number, mods?: string, idVariante?: number) => {
    const itemToDelete = carrito.find((c) => c.producto.id_producto === id && (c.mods || '') === (mods || '') && c.id_variante === idVariante);
    if (itemToDelete) {
      setDeleteConfirmModal({
        isOpen: true,
        itemToDelete
      });
    }
  };

  const confirmRemoveItem = () => {
    if (deleteConfirmModal.itemToDelete) {
      const { producto, mods, id_variante } = deleteConfirmModal.itemToDelete;
      setCarrito((prev) => prev.filter((c) => !(c.producto.id_producto === producto.id_producto && (c.mods || '') === (mods || '') && c.id_variante === id_variante)));
      addNotification({
        type: 'success',
        title: 'Producto eliminado',
        message: `${producto.nombre_producto} ha sido eliminado del carrito`,
        duration: 3000
      });
    }
    setDeleteConfirmModal({ isOpen: false, itemToDelete: null });
  };

  const cancelRemoveItem = () => {
    setDeleteConfirmModal({ isOpen: false, itemToDelete: null });
  };

  const limpiar = () => setCarrito([]);

  const total = useMemo(
    () => carrito.reduce((acc, it) => acc + it.producto.precio_venta * it.qty, 0),
    [carrito]
  );

  /* ============================================================
     Personalización
     ============================================================ */
  const catPersonalizable = new Set(['shucos', 'hamburguesas', 'gringas']);

  const openCustomizer = (prod: Producto) => {
    // modo "nuevo"
    setEditTarget(null);

    if (!catPersonalizable.has(prod.categoria?.nombre_categoria.toLowerCase() || '')) {
      addToCart(prod);
      return;
    }
    setCustomProd(prod);

    // Por ahora, usar ingredientes quemados basados en el nombre del producto
    // TODO: Implementar sistema de ingredientes dinámico desde backend
    const ingrs = productoIngredientes[prod.nombre_producto] || [];
    const initialChecks: Record<string, boolean> = {};
    ingrs.forEach((i) => (initialChecks[i] = true));
    setCustomChecks(initialChecks);

    // TODO: Implementar extras dinámicos desde backend
    if (SHUCOS_CON_EXTRAS.has(prod.nombre_producto)) {
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
    setEditTarget({ id: item.producto.id_producto.toString(), mods: item.mods });

    const prod = item.producto;
    setCustomProd(prod);

    // checks
    const ingrs = productoIngredientes[prod.nombre_producto] || [];
    const checks: Record<string, boolean> = {};
    ingrs.forEach(i => checks[i] = true);

    const parsed = parseMods(item.mods);
    parsed.sin.forEach(s => { if (s in checks) checks[s] = false; });
    setCustomChecks(checks);

    // extras
    if (SHUCOS_CON_EXTRAS.has(prod.nombre_producto)) {
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
          c => !(c.producto.id_producto.toString() === editTarget.id && (c.mods || '') === (editTarget.mods || ''))
        );
        // fusionar si ya existe una igual
        const keyMatch = (c: CartItem) => c.producto.id_producto === customProd.id_producto && (c.mods || '') === (modsFinal || '');
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
  const handleOpenCategoriaModal = (mode: 'create' | 'edit' = 'create', categoria?: CategoriaProducto) => {
    setCategoriaModal({
      isOpen: true,
      mode,
      categoria: categoria || null
    });
  };

  const handleCloseCategoriaModal = () => {
    setCategoriaModal({
      isOpen: false,
      mode: 'create',
      categoria: null
    });
  };

  const handleSaveCategoria = async (categoriaData: Omit<CategoriaProducto, 'id_categoria'>) => {
    try {
      if (categoriaModal.mode === 'create') {
        // Crear nueva categoría
        // Generar ID numérico único basado en el máximo ID existente
        const maxId = categorias.reduce((max, cat) => {
          const id = typeof cat.id_categoria === 'number' ? cat.id_categoria : 0;
          return Math.max(max, id);
        }, 0);
        const newId = maxId + 1;

        // Verificar que no exista una categoría con el mismo nombre
        const nombreExiste = categorias.some((c) =>
          c.nombre_categoria.toLowerCase() === categoriaData.nombre_categoria.toLowerCase()
        );

        if (nombreExiste) {
          addNotification({ type: 'warning', title: 'Categoría duplicada', message: 'Ya existe una categoría con ese nombre' });
          return;
        }

        const nuevaCategoria: CategoriaProducto = {
          id_categoria: newId,
          nombre_categoria: categoriaData.nombre_categoria,
          descripcion: categoriaData.descripcion || '',
          estado: categoriaData.estado
        };

        setCategorias((prev) => [...prev, nuevaCategoria]);
        setCatActiva('all'); // Resetear filtro para mostrar todas las categorías

      } else if (categoriaModal.mode === 'edit' && categoriaModal.categoria) {
        // Actualizar categoría existente
        setCategorias((prev) =>
          prev.map((cat) =>
            cat.id_categoria === categoriaModal.categoria!.id_categoria
              ? { ...cat, ...categoriaData }
              : cat
          )
        );
      }
    } catch (error) {
      console.error('Error saving categoria:', error);
      addNotification({ type: 'error', title: 'Error', message: 'Error al guardar la categoría' });
    }
  };

  const handleGuardarCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (nitMode === 'NIT' && !String(nitValue).trim()) {
      addNotification({
        type: 'warning',
        title: 'Campo requerido',
        message: 'Ingresa el NIT para continuar',
      });
      return;
    }

    try {
      const nuevoCliente = {
        nombre: String(fd.get('nombre') || 'Cliente'),
        telefono: String(fd.get('telefono') || undefined),
        direccion: nitMode === 'CF' ? 'CF' : String(nitValue).trim(), // Usando direccion para NIT por ahora
      };

      const clienteCreado = await clientesService.createCliente(nuevoCliente);
      setClienteSeleccionado(clienteCreado);

      // Recargar la lista de clientes
      const clientesActualizados = await clientesService.getClientes();
      setClientes(clientesActualizados);

      setNitMode('CF');
      setNitValue('');
      setOpenCliente(false);

      // Notificación de éxito
      addNotification({
        type: 'success',
        title: 'Cliente creado',
        message: `El cliente ${clienteCreado.nombre} ha sido registrado exitosamente`,
      });
    } catch (error: unknown) {
      console.error('Error creando cliente:', error);

      // Determinar el tipo de error y mostrar notificación apropiada
      let errorMessage = 'Error al guardar el cliente. Inténtalo de nuevo.';
      let errorTitle = 'Error';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
          errorTitle = 'Error de validación';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      addNotification({
        type: 'error',
        title: errorTitle,
        message: errorMessage,
      });
    }
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setClientModo('editar');
    // Pre-llenar los campos del formulario
    setNitValue(cliente.direccion === 'CF' ? '' : cliente.direccion || '');
    setNitMode(cliente.direccion === 'CF' ? 'CF' : 'NIT');
  };

  const handleEliminarCliente = (cliente: Cliente) => {
    setClienteAEliminar(cliente);
  };

  const confirmarEliminarCliente = async () => {
    if (!clienteAEliminar) return;

    try {
      await clientesService.deleteCliente(clienteAEliminar.id_cliente);

      // Actualizar la lista de clientes
      const clientesActualizados = await clientesService.getClientes();
      setClientes(clientesActualizados);

      // Si el cliente eliminado era el seleccionado, deseleccionarlo
      if (clienteSeleccionado?.id_cliente === clienteAEliminar.id_cliente) {
        setClienteSeleccionado(null);
      }

      addNotification({
        type: 'success',
        title: 'Cliente eliminado',
        message: `El cliente "${clienteAEliminar.nombre}" ha sido eliminado exitosamente`,
      });

      setClienteAEliminar(null);
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      addNotification({
        type: 'error',
        title: 'Error al eliminar',
        message: 'No se pudo eliminar el cliente. Inténtalo de nuevo.',
      });
    }
  };

  const handleActualizarCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!clienteEditando) return;

    const fd = new FormData(e.currentTarget);

    if (nitMode === 'NIT' && !String(nitValue).trim()) {
      addNotification({
        type: 'warning',
        title: 'Campo requerido',
        message: 'Ingresa el NIT para continuar',
      });
      return;
    }

    try {
      const clienteActualizado = {
        nombre: String(fd.get('nombre') || clienteEditando.nombre),
        telefono: String(fd.get('telefono') || clienteEditando.telefono || undefined),
        direccion: nitMode === 'CF' ? 'CF' : String(nitValue).trim(),
      };

      await clientesService.updateCliente(clienteEditando.id_cliente, clienteActualizado);

      // Actualizar la lista de clientes
      const clientesActualizados = await clientesService.getClientes();
      setClientes(clientesActualizados);

      // Actualizar el cliente seleccionado si era el que se editó
      if (clienteSeleccionado?.id_cliente === clienteEditando.id_cliente) {
        const clienteActualizadoCompleto = clientesActualizados.find(c => c.id_cliente === clienteEditando.id_cliente);
        if (clienteActualizadoCompleto) {
          setClienteSeleccionado(clienteActualizadoCompleto);
        }
      }

      // Resetear el estado
      setClienteEditando(null);
      setClientModo('registrados');
      setNitMode('CF');
      setNitValue('');

      addNotification({
        type: 'success',
        title: 'Cliente actualizado',
        message: `El cliente "${clienteActualizado.nombre}" ha sido actualizado exitosamente`,
      });
    } catch (error) {
      console.error('Error actualizando cliente:', error);

      let errorMessage = 'Error al actualizar el cliente. Inténtalo de nuevo.';
      let errorTitle = 'Error';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
          errorTitle = 'Error de validación';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      addNotification({
        type: 'error',
        title: errorTitle,
        message: errorMessage,
      });
    }
  };

  /* ============================================================
     Pago
     ============================================================ */
  const irAPago = () => {
    if (!carrito.length) return addNotification({ type: 'warning', title: 'Carrito vacío', message: 'Agrega productos a la orden' });
    setPagoError('');
    setCashInvalid(false);
    setTransfInvalid(false);
    setOpenPago(true);
  };

  const confirmarPago = async () => {
    if (!carrito.length) return addNotification({ type: 'warning', title: 'Carrito vacío', message: 'Tu carrito está vacío.' });

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

    try {
      // Crear el payload para la venta
      const ventaData: CreateVentaDTO = {
        id_cliente: clienteSeleccionado?.id_cliente,
        tipo_pago: metodo === 'efectivo' ? 'Cash' : metodo === 'transferencia' ? 'Transferencia' : 'Paggo',
        detalles: carrito.map((item) => ({
          id_producto: item.producto.id_producto,
          id_variante: item.id_variante,
          cantidad: item.qty,
          precio_unitario: item.producto.precio_venta,
          descuento: 0, // Por ahora no hay descuentos
          es_canje_puntos: false,
          puntos_canjeados: 0,
        })),
      };

      // Crear la venta en el backend
      const ventaCreada = await ventasService.createVenta(ventaData);

      // Actualizar recuentos Caja / Banco
      if (metodo === 'efectivo') setTotalCaja((v) => v + total);
      else setTotalBanco((v) => v + total);

      // Construir payload del ticket
      const recibido = metodo === 'efectivo' ? Number(dineroRecibido || 0) : null;
      const cambioLocal = metodo === 'efectivo' ? Math.max(0, (recibido ?? 0) - total) : null;

      const ticketData = {
        ordenN,
        ventaId: ventaCreada.id_venta, // Agregar el ID de la venta creada
        cliente: clienteSeleccionado,
        items: carrito.map((it) => ({
          id: it.producto.id_producto,
          nombre: it.producto.nombre_producto,
          qty: it.qty,
          precio: it.producto.precio_venta,
          mods: it.mods || null,
          subtotal: it.producto.precio_venta * it.qty,
        })),
        total,
        metodo, // 'efectivo' | 'transferencia'
        efectivo: metodo === 'efectivo' ? { dineroRecibido: recibido, cambio: cambioLocal } : null,
        transferencia: metodo === 'transferencia' ? { referencia, banco } : null,
        fechaHora: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem('ticketventa:last', JSON.stringify(ticketData));
      } catch (error) {
        console.warn('No se pudo guardar el ticket en sessionStorage:', error);
      }

      // Reset y cierre del drawer
      setOrdenN((n) => n + 1);
      limpiar();
      setClienteSeleccionado(null);
      setMetodo('efectivo');
      setReferencia('');
      setBanco('');
      setDineroRecibido('');
      setOpenPago(false);

      // Navegar directamente (el toast se muestra en Ticket)
      navigate('/ventas/ticketventa', { state: ticketData });
    } catch (error) {
      console.error('Error creando la venta:', error);
      addNotification({ type: 'error', title: 'Error', message: 'Error al procesar la venta. Inténtalo de nuevo.' });
    }
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

  // Estado para el drawer de receta
  const [openReceta, setOpenReceta] = useState(false);
  const [recetaProducto, setRecetaProducto] = useState<ProductoConReceta | null>(null);
  const [loadingReceta, setLoadingReceta] = useState(false);
  const [insumos, setInsumos] = useState<Insumo[]>([]);

  // Cargar insumos al montar el componente (solo una vez)
  useEffect(() => {
    const cargarInsumos = async () => {
      try {
        const data = await fetchInsumos();
        setInsumos(data || []);
      } catch {
        setInsumos([]);
      }
    };
    cargarInsumos();
  }, []);

  // Handler para abrir el drawer de receta
  const handleOpenReceta = async (id_producto: number) => {
    setLoadingReceta(true);
    setOpenReceta(true);
    try {
      const prod = await productosService.getProductoConReceta(id_producto);
      setRecetaProducto(prod);
    } catch {
      setRecetaProducto(null);
    } finally {
      setLoadingReceta(false);
    }
  };
          {/* Drawer: Receta del producto */}
          <DrawerRight
            open={openReceta}
            onClose={() => setOpenReceta(false)}
            title={recetaProducto ? `Receta: ${recetaProducto.nombre_producto}` : 'Receta'}
            widthClass="w-full sm:w-[420px]"
          >
            {loadingReceta ? (
              <div className="p-8 flex items-center justify-center text-lg text-gray-500">
                Cargando receta...
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="font-semibold text-lg text-gray-800 mb-2">Ingredientes:</div>
                {recetaProducto && recetaProducto.receta && recetaProducto.receta.length > 0 ? (
                  <ul className="space-y-2">
                    {recetaProducto.receta.map((r: RecetaDetalle, idx: number) => {
                      const insumo = insumos.find((i) => i.id_insumo === r.id_insumo);
                      return (
                        <li key={r.id_insumo + '-' + idx} className="flex items-center gap-3 text-[15px]">
                          <span className="font-medium text-gray-700">{insumo ? insumo.nombre_insumo : `ID ${r.id_insumo}`}</span>
                          <span className="text-gray-500">{r.cantidad_requerida} {r.unidad_base}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-gray-500">No hay receta registrada para este producto.</div>
                )}
              </div>
            )}
          </DrawerRight>

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Mostrar loading o error si es necesario */}
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 1) CONTENEDOR */}
          <div className="max-w-[1280px] mx-auto px-6 py-6">
            {/* Encabezado mejorado */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/ventas")}
                  className="flex items-center gap-2 h-12 px-5 rounded-xl bg-white text-gray-700 border border-gray-200 text-base font-semibold shadow-sm hover:bg-gray-50 transition-all"
                >
                  <span className="text-xl">←</span>
                  <span>Regresar</span>
                </button>
              </div>
              <div className="flex flex-1 items-center justify-end gap-2">
                <div className="relative w-full sm:w-80">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar producto o categoría"
                    className="w-full h-12 rounded-xl border border-gray-200 bg-white pl-4 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {/* Ícono SVG lupa */}
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
                  </span>
                </div>
                <button
                  onClick={() => handleOpenCategoriaModal('create')}
                  className="h-12 px-5 rounded-xl text-base font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                >
                  + Categoría
                </button>
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
                {/* Fila de categorías dinámicas con scroll horizontal */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-gray-100 hover:scrollbar-thumb-emerald-400 transition-colors">
                  {categorias
                    .filter((c) => c.estado === 'activo' || c.id_categoria === 'all')
                    .sort((a, b) => {
                      if (a.id_categoria === 'all') return -1;
                      if (b.id_categoria === 'all') return 1;
                      return a.nombre_categoria.localeCompare(b.nombre_categoria);
                    })
                    .map((c) => (
                      <Pill
                        key={c.id_categoria}
                        active={catActiva === c.id_categoria}
                        onClick={() => setCatActiva(c.id_categoria === 'all' ? 'all' : Number(c.id_categoria))}
                      >
                        {c.nombre_categoria}
                      </Pill>
                    ))}
                </div>

                {/* Contenedor con scroll SOLO en 'Todos' */}
                <div className={catActiva === 'all' ? 'max-h-[70vh] overflow-y-auto pr-1' : ''}>
                  <div className={`grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-5 lg:gap-6`}>
                    {filtrados.map((p, idx) => (
                      <motion.div
                        key={p.id_producto}
                        whileHover={{ y: -2, scale: 1.01 }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: idx * 0.015 }}
                        className="group bg-white rounded-2xl border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition overflow-hidden text-left relative cursor-pointer"
                        onClick={e => {
                          // Si el click fue en el ícono de editar, no agregar al carrito
                          if ((e.target as HTMLElement).closest('.btn-edit-receta')) return;
                          openCustomizer(p);
                        }}
                      >
                        <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center text-gray-400 relative">
                          <span className="leading-none text-[100px] xl:text-[130px]">
                            {CATEGORY_ICON[p.id_categoria ?? ''] ?? '🍔'}
                          </span>
                          {/* Ícono de ver receta (ojo) */}
                          <button
                            className="btn-edit-receta absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white border border-gray-200 rounded-full p-2 shadow hover:bg-emerald-50 transition"
                            title="Ver receta"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenReceta(p.id_producto);
                            }}
                          >
                            {/* Ícono de ojo */}
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-3">
                          <div className="font-semibold text-gray-800 group-hover:text-emerald-700 leading-snug break-words line-clamp-2 text-[14px]">
                            {p.nombre_producto}
                          </div>
                          <div className="mt-1 text-[13px] text-gray-500">
                            {categorias.find((c) => c.id_categoria === p.id_categoria)?.nombre_categoria}
                          </div>
                          <div className="mt-2 font-extrabold text-emerald-700 text-[18px]">
                            {currency(p.precio_venta)}
                          </div>
                        </div>
                      </motion.div>
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
                    {clienteSeleccionado ? (
                      <span>{clienteSeleccionado.nombre} · {clienteSeleccionado.telefono || 'Sin teléfono'}</span>
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
                          key={it.producto.id_producto + (it.mods || '')}
                          className="py-5 px-4 flex items-start gap-4 hover:bg-gray-50"
                        >
                          <div className="w-14 h-14 rounded-md bg-gray-100 grid place-content-center text-2xl">
                            {CATEGORY_ICON[it.producto.categoria?.nombre_categoria.toLowerCase() || ''] ?? <ShoppingCart className="w-6 h-6" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-[17px] md:text-[18px] leading-tight truncate">
                              {it.producto.nombre_producto}
                            </div>

                            {modsList.length > 0 && (
                              <ul className="mt-1.5 pl-5 list-disc text-[13px] leading-5 text-gray-700 space-y-1">
                                {modsList.map((m) => <li key={m}>sin {m}</li>)}
                              </ul>
                            )}

                            <div className="mt-2 text-[13px] text-gray-600">
                              {currency(it.producto.precio_venta)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              className="w-9 h-9 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                              onClick={() => setQty(it.producto.id_producto, it.mods, it.qty - 1, it.id_variante)}
                              aria-label="Disminuir"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="min-w-[2.25rem] text-center text-lg">{it.qty}</div>
                            <button
                              className="w-9 h-9 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                              onClick={() => setQty(it.producto.id_producto, it.mods, it.qty + 1, it.id_variante)}
                              aria-label="Aumentar"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="w-28 text-right font-semibold text-lg">
                            {currency(it.producto.precio_venta * it.qty)}
                          </div>

                          {/* NUEVO: Editar línea */}
                          <button
                            className="text-emerald-600 hover:text-emerald-700 ml-1 p-2 rounded hover:bg-emerald-50"
                            onClick={() => openEditFromCart(it)}
                            title="Editar"
                            aria-label="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            className="text-rose-600 hover:text-rose-700 ml-1 p-2 rounded hover:bg-rose-50"
                            onClick={() => removeItem(it.producto.id_producto, it.mods, it.id_variante)}
                            title="Quitar"
                            aria-label="Quitar"
                          >
                            <Trash2 className="w-4 h-4" />
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
                        className="h-12 rounded-lg border text-base font-semibold hover:bg-gray-50 uppercase flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        CANCELAR
                      </button>
                      <button
                        onClick={irAPago}
                        disabled={!carrito.length}
                        className="h-12 rounded-lg bg-emerald-600 text-white text-base font-semibold hover:bg-emerald-700 disabled:opacity-50 uppercase flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        CONTINUAR
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
                        <tr key={it.producto.id_producto + (it.mods || '') + i} className={i % 2 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-gray-100 grid place-content-center">
                                {CATEGORY_ICON[it.producto.categoria?.nombre_categoria.toLowerCase() || ''] ?? <ShoppingCart className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="font-medium text-gray-800 text-[15px]">{it.producto.nombre_producto}</div>
                                {it.mods && <div className="text-sm text-gray-500">{it.mods}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-700 text-[15px]">{currency(it.producto.precio_venta)}</td>
                          <td className="px-5 py-3.5">
                            <div className="inline-flex items-center rounded-lg border border-gray-200 px-3 h-10 select-none bg-white text-[15px]">
                              {it.qty}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-gray-900 text-[16px]">
                            {currency(it.producto.precio_venta * it.qty)}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => removeItem(it.producto.id_producto, it.mods)}
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
            title={customProd ? `${customProd.nombre_producto}` : 'Personalizar'}
            widthClass="w-full sm:w-[525px]"
          >
            {customProd && (
              <div className="p-5 space-y-6 text-[15px]">
                {/* Header del producto */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 grid place-content-center text-4xl">
                    {CATEGORY_ICON[customProd.categoria?.nombre_categoria.toLowerCase() || ''] ?? <ShoppingCart className="w-8 h-8" />}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-base">{customProd.nombre_producto}</div>
                    <div className="text-[15px] text-gray-500">{currency(customProd.precio_venta)}</div>
                  </div>
                </div>

                {/* EXTRAS (solo shucos p1..p4) */}
                {SHUCOS_CON_EXTRAS.has(customProd.nombre_producto) && (
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

          {/* Modal: crear/editar categoría */}
          <CategoriaModal
            isOpen={categoriaModal.isOpen}
            onClose={handleCloseCategoriaModal}
            onSave={handleSaveCategoria}
            categoria={categoriaModal.categoria}
            mode={categoriaModal.mode}
          />

          {/* Modal: confirmar eliminación de producto del carrito */}
          {deleteConfirmModal.isOpen && deleteConfirmModal.itemToDelete && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
              >
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ¿Eliminar producto?
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    ¿Estás seguro de que quieres eliminar <strong>{deleteConfirmModal.itemToDelete.producto.nombre_producto}</strong> del carrito?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={cancelRemoveItem}
                      className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 uppercase flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      CANCELAR
                    </button>
                    <button
                      onClick={confirmRemoveItem}
                      className="flex-1 h-10 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 uppercase flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      ELIMINAR
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Modal: agregar/seleccionar cliente (ACTUALIZADO) */}
          {openCliente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setOpenCliente(false)} />
              <div className="relative w-full max-w-[720px] bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {clientModo === 'registrados' ? 'Clientes registrados' :
                     clientModo === 'editar' ? 'Editar cliente' : 'Agregar cliente'}
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
                            <li key={c.id_cliente} className="relative">
                              <div className="flex items-center gap-3 p-3">
                                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 flex-1">
                                  <input
                                    type="radio"
                                    name="clienteReg"
                                    checked={clienteSeleccionado?.id_cliente === c.id_cliente}
                                    onChange={() => setClienteSeleccionado(c)}
                                    className="accent-emerald-600"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xl text-gray-800 truncate">
                                      {c.nombre} {c.telefono ? `· ${c.telefono}` : ''}
                                    </div>
                                    <div className="text-xl text-gray-500">
                                      {c.direccion || 'NIT: —'}
                                    </div>
                                    <div className="text-sm text-emerald-600 font-medium mt-1">
                                      {c.puntos_acumulados > 0 ? (
                                        `⭐ ${c.puntos_acumulados} puntos acumulados`
                                      ) : (
                                        `🌱 Sin compras realizadas aún`
                                      )}
                                    </div>
                                  </div>
                                </label>
                                {/* Botones de acción */}
                                <div className="flex gap-2 ml-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditarCliente(c);
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Editar cliente"
                                  >
                                    📝
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEliminarCliente(c);
                                    }}
                                    className="p-2 text-gray-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Eliminar cliente"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
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
                        disabled={!clienteSeleccionado}
                        onClick={() => {
                          if (!clienteSeleccionado) return;
                          setClienteSeleccionado(clienteSeleccionado);
                          setOpenCliente(false);
                        }}
                        className="h-10 rounded-lg bg-emerald-600 text-white px-4 text-xl font-semibold hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Seleccionar
                      </button>
                    </div>
                  </>
                ) : clientModo === 'editar' ? (
                  <form onSubmit={handleActualizarCliente} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xl font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          name="nombre"
                          defaultValue={clienteEditando?.nombre || ''}
                          required
                          className="w-full h-11 rounded-lg border border-gray-200 px-3 text-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xl font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          name="telefono"
                          type="tel"
                          defaultValue={clienteEditando?.telefono || ''}
                          className="w-full h-11 rounded-lg border border-gray-200 px-3 text-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xl font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          value={nitMode}
                          onChange={(e) => setNitMode(e.target.value as 'CF' | 'NIT')}
                          className="w-full h-11 rounded-lg border border-gray-200 px-3 text-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <option value="CF">Consumidor Final (CF)</option>
                          <option value="NIT">NIT</option>
                        </select>
                      </div>
                      {nitMode === 'NIT' && (
                        <div>
                          <label className="block text-xl font-medium text-gray-700 mb-1">NIT</label>
                          <input
                            value={nitValue}
                            onChange={(e) => setNitValue(e.target.value)}
                            placeholder="Ingresa el NIT"
                            className="w-full h-11 rounded-lg border border-gray-200 px-3 text-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setClientModo('registrados');
                          setClienteEditando(null);
                        }}
                        className="h-10 rounded-lg border px-4 text-xl font-semibold hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="h-10 rounded-lg bg-blue-600 text-white px-4 text-xl font-semibold hover:bg-blue-700"
                      >
                        Actualizar Cliente
                      </button>
                    </div>
                  </form>
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
        </>
      )}

      {/* Modal: confirmar eliminación de cliente */}
      {clienteAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setClienteAEliminar(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Eliminar cliente
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar al cliente <strong>"{clienteAEliminar.nombre}"</strong>?
                <br />
                <span className="text-sm text-red-600 font-medium">
                  Esta acción no se puede deshacer.
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setClienteAEliminar(null)}
                  className="flex-1 h-11 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminarCliente}
                  className="flex-1 h-11 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor de notificaciones */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </div>
  );
};

export default Ventas;
