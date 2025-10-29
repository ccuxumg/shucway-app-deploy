import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import avatarImg from "../assets/imgs/login.png";
import { CgLogOut } from "react-icons/cg";
import { MdHome, MdInventory2, MdSettings, MdOutlineAssessment, MdAdminPanelSettings, MdShoppingCart } from "react-icons/md";
import { FiBell } from "react-icons/fi";
import { IoAlertCircleOutline } from "react-icons/io5";
import { handleLogout } from "../api/handleLogout";
import { useNavigate, useLocation } from "react-router-dom";
import { MenuItemGuard } from "../components/guards/ModuleGuard";

// usar el logo público (public/img/logo.png)
const publicLogo = "/img/logo.png";

const sidebarItems = [
  { name: "Inicio", icon: <MdHome size={18} />, route: "/dashboard", module: "DASHBOARD" },
  { name: "Ventas", icon: <MdShoppingCart size={18} />, route: "/ventas", module: "VENTAS" },
  { name: "Inventario", icon: <MdInventory2 size={18} />, route: "/inventario", module: "INVENTARIO" },
  { name: "Reportes", icon: <MdOutlineAssessment size={18} />, route: "/reportes", module: "REPORTES" },
  { name: "Administración", icon: <MdAdminPanelSettings size={18} />, route: "/administracion", module: "USUARIOS" },
  { name: "Configuración", icon: <MdSettings size={18} />, route: "/configuracion", module: "CONFIGURACION" },
];

const sidebarSections = [
  { title: "General", items: [sidebarItems[0], sidebarItems[1]] },
  { title: "Operaciones", items: [sidebarItems[2], sidebarItems[3], sidebarItems[4]] },
  { title: "Ajustes", items: [sidebarItems[5]] },
];

// colores provistos por el cliente
const ICON_HEX: Record<string, string> = {
  Inicio: "#346C60",
  Ventas: "#00A149",
  Inventario: "#12443D",
  Reportes: "#FFC222",
  Administración: "#346C60",
  Configuración: "#12443D",
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    // Obtener el usuario del localStorage (guardado por el backend JWT)
    const fetchUser = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setUserName(null);
          setAvatarUrl(null);
          return;
        }

        const user = JSON.parse(userStr);
        
        // Construir el nombre completo del usuario
        const fullName = `${user.primer_nombre || ''} ${user.primer_apellido || ''}`.trim();
        const nameToUse = fullName || user.username || user.nombre || user.email?.split('@')[0] || 'Usuario';
        
        setUserName(nameToUse);
        setAvatarUrl(user.avatar_url || null);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        setUserName('Usuario');
        setAvatarUrl(null);
      }
    };
    fetchUser();
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return null;
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // sidebar label animations handled inline per-item

  // Cierra el menú de perfil al hacer click fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Cierra el buscador al hacer click fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Debounce simple para evitar filtrar en cada pulsación
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    // 200ms debounce — ligero y reactivo
    // store id as number (window.setTimeout returns number in browsers)
    debounceRef.current = window.setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 200) as unknown as number;

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // removed theme toggle per request

  const currentRouteName = () => {
    const match = sidebarItems.find((s) => s.route === location.pathname);
    return match?.name || location.pathname.replace("/", "") || "Panel";
  };

  // Preparar una lista de sugerencias con sección y ruta para el buscador
  // Incluye los items del sidebar más rutas internas (lista ligera para evitar imports circulares)
  const extraRoutes: { name: string; route: string; section: string }[] = [
    { name: 'Dashboard', route: '/dashboard', section: 'General' },
    { name: 'Configuración', route: '/configuracion', section: 'Ajustes' },
    { name: 'Mantenimiento', route: '/configuracion/mantenimiento', section: 'Ajustes' },
    { name: 'Consultas SQL', route: '/configuracion/consultas-sql', section: 'Ajustes' },
    { name: 'Backup', route: '/configuracion/backup', section: 'Ajustes' },
    { name: 'Administración', route: '/administracion', section: 'General' },
    { name: 'Gestionar Roles', route: '/administracion/roles', section: 'General' },
    { name: 'Ventas', route: '/ventas', section: 'General' },
    { name: 'Punto de Venta', route: '/ventas/ventas', section: 'Ventas' },
    { name: 'Producto (Ventas)', route: '/ventas/producto', section: 'Ventas' },
    { name: 'Cierre de Caja', route: '/ventas/cierre-caja', section: 'Ventas' },
    { name: 'Inventario', route: '/inventario', section: 'Operaciones' },
    { name: 'Categorias', route: '/inventario/categorias', section: 'Operaciones' },
    { name: 'Reportes', route: '/reportes', section: 'Operaciones' },
    { name: 'Perfil', route: '/perfil', section: 'General' },
    { name: 'Soporte', route: '/soporte', section: 'General' },
    { name: 'Login', route: '/login', section: 'Público' },
  ];

  const combined = [
    ...sidebarSections.flatMap((sec) => sec.items.map((it) => ({ name: it.name, route: it.route, section: sec.title })) ),
    ...extraRoutes,
  ];

  // Deduplicate by route (mantener la primera aparición)
  const searchableItems = Array.from(new Map(combined.map(item => [item.route, item])).values());

  // Búsqueda minimalista y eficiente: puntuamos coincidencias y ordenamos
  const fuzzyScore = (text: string, q: string) => {
    const t = text.toLowerCase();
    const qq = q.toLowerCase();
    if (!qq) return 0;
    if (t === qq) return 100;
    if (t.startsWith(qq)) return 80;
    if (t.includes(qq)) return 60;
    // subsequence match (letras en orden) — bajo coste
    let i = 0;
    for (const c of qq) {
      i = t.indexOf(c, i);
      if (i === -1) return 0;
      i++;
    }
    return 20; // small score for subsequence matches
  };

  const filteredSuggestions = debouncedQuery
    ? searchableItems
        .map((it) => {
          const nameScore = fuzzyScore(it.name, debouncedQuery);
          const routeScore = fuzzyScore(it.route, debouncedQuery);
          const score = Math.max(nameScore, routeScore);
          return { item: it, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((s) => s.item)
    : [];

  const selectSuggestion = (item: { name: string; route: string }) => {
    navigate(item.route);
    setIsSearchOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
        selectSuggestion(filteredSuggestions[highlightedIndex]);
      } else if (filteredSuggestions.length === 1) {
        selectSuggestion(filteredSuggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Componente local: CajaQuick (declarado antes del return para evitar errores TSX)
  const CajaQuick: React.FC = () => {
    const [startTs, setStartTs] = useState<number | null>(() => {
      try {
        const v = localStorage.getItem('caja:start');
        return v ? Number(v) : null;
      } catch {
        return null;
      }
    });
    const cajaOpen = !!startTs;
    const [showConfirm, setShowConfirm] = useState(false);

    const openCaja = () => {
      const ts = Date.now();
  try { localStorage.setItem('caja:start', String(ts)); } catch { /* ignore storage errors */ }
      setStartTs(ts);
      navigate('/ventas/cierre-caja');
    };

    const closeCaja = () => {
  try { localStorage.removeItem('caja:start'); } catch { /* ignore storage errors */ }
      setStartTs(null);
      navigate('/ventas/cierre-caja');
    };

    

    const formatDateSpanish = (ts: number) => {
      try {
        const d = new Date(ts);
        const day = d.getDate();
        const monthNames = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
        return `${day} DE ${monthNames[d.getMonth()]}`;
      } catch { return '' }
    };

    const formatCurrency = (amount: number) => {
      // show like Q.78.0 or Q.0.00 -> use 2 decimals
      return `Q.${amount.toFixed(2)}`;
    };

    // Always render card; button color/label depends on cajaOpen.
    return (
      <>
        <div className="flex items-center justify-center w-full">
          <div className="w-full bg-gray-50 rounded-lg p-4 flex flex-col items-center shadow-md">
            <div className="text-xs text-gray-500">{formatDateSpanish(startTs || Date.now())}</div>
            <div className="text-2xl font-extrabold text-gray-800 mt-2">{formatCurrency(0)}</div>
            <div className="mt-3 w-full">
              {!cajaOpen ? (
                <button onClick={openCaja} className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-full font-semibold">Abrir Caja</button>
              ) : (
                <button onClick={() => setShowConfirm(true)} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-2 rounded-full font-semibold">Cerrar Caja</button>
              )}
            </div>
          </div>
        </div>

        {/* Confirmación modal al cerrar caja */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
            <div className="relative bg-white rounded-lg shadow-lg p-6 w-80"> 
              <h3 className="text-lg font-semibold mb-2">Confirmar cierre</h3>
              <p className="text-sm text-gray-600 mb-4">¿Estás seguro de que deseas cerrar la caja? Se registrará el cierre y podrá revisarse en el módulo de ventas.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowConfirm(false)} className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200">Cancelar</button>
                <button onClick={() => { setShowConfirm(false); closeCaja(); }} className="px-3 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold">Cerrar caja</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex min-h-screen font-[Barrow,Segoe UI,Roboto,sans-serif]">
      {/* Sidebar */}
      <motion.aside
        aria-label="Sidebar"
        initial={false}
        animate={{ width: collapsed ? 80 : 224 }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
        className={`z-50 fixed left-0 top-0 h-full bg-white shadow-lg flex flex-col items-center py-6 overflow-hidden`}
      >
        <div className={`flex items-center gap-3 px-4 ${collapsed ? "justify-center" : "justify-center w-full"} mb-6`}>
          <motion.button whileTap={{ scale: 0.985 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.18 }} onClick={() => navigate('/dashboard')} aria-label="Ir al dashboard" className={`flex items-center ${collapsed ? 'justify-center' : 'justify-center'} w-full bg-transparent p-0 rounded-md hover:bg-transparent focus:outline-none transition-colors`}> 
            <img src={publicLogo} alt="logo" className={`cursor-pointer ${collapsed ? "w-12 sm:w-14" : "w-36 sm:w-44"} transition-all duration-300`} />
          </motion.button>
        </div>
        <nav className="flex flex-col gap-4 w-full px-3" role="navigation">
          {sidebarSections.map((sec) => (
            <div key={sec.title}>
              {!collapsed && <div className="px-3 text-xs uppercase text-gray-400 mb-1">{sec.title}</div>}
              <div className="flex flex-col gap-2">
                {sec.items.map((item) => {
                  const isActive = location.pathname === item.route;
                  return (
                    <MenuItemGuard key={item.name} moduleName={item.module}>
                      <Tippy
                        content={item.name}
                        disabled={!collapsed}
                        animation="scale"
                        placement="right"
                        delay={[80, 0]}
                        duration={[160, 80]}
                        hideOnClick={false}
                        interactive={false}
                        arrow={true}
                      >
                        <button
                          onClick={() => navigate(item.route)}
                          title={collapsed ? item.name : undefined}
                          className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-base font-medium transition-all duration-150 w-full text-left hover:bg-gray-50 transform ${
                            isActive ? "bg-green-50 text-green-700 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.06)]" : "text-gray-700"
                          }`}
                        >
                          {/* active indicator */}
                          <AnimatePresence>{isActive && (
                            <motion.span layoutId="active-indicator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-green-500" />
                          )}</AnimatePresence>

                          <motion.div whileHover={{ scale: 1.06 }} transition={{ type: "spring", stiffness: 300 }} className={`flex items-center justify-center ${collapsed ? 'w-12 h-12' : 'w-11 h-11'} rounded-lg shadow-sm`} style={{ background: ICON_HEX[item.name] || '#E5E7EB', color: '#fff' }}>
                            {item.icon}
                          </motion.div>
                          <AnimatePresence initial={false} mode="wait">
                            {!collapsed && (
                              <motion.span key={item.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }} className="ml-2">
                                {item.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                      </Tippy>
                    </MenuItemGuard>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-1" />
        {/* Caja rápida: abrir / cerrar caja y contador */}
        <div className="w-full px-3 mb-4">
          {/* estado de la caja almacenado en localStorage: 'caja:start' = timestamp */}
          {/* Mostrar botón Abrir Caja cuando cerrada; contador + Cerrar cuando abierta */}
          {/* Usa navigate a la ruta de cierre de caja para integrarse con el módulo de ventas */}
          <CajaQuick />
        </div>

        <div className="w-full px-3 mb-4">
          {/* sidebar: perfil eliminado según solicitud */}

          <div className="mt-4 flex justify-center">
              {collapsed ? (
              <Tippy content="Cerrar sesión" placement="right" animation="scale" delay={[80,0]} duration={[160,80]} hideOnClick={false} interactive={false} arrow={true}>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-md shadow-sm"
                  aria-label="Cerrar sesión"
                >
                  <CgLogOut size={18} />
                </button>
              </Tippy>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-md shadow-sm text-base font-semibold"
              >
                <CgLogOut />
                <span>Cerrar sesión</span>
              </button>
            )}
          </div>
        </div>
  </motion.aside>

  

  {/* spacer para que el contenido no quede bajo el sidebar (animado) */}
  <motion.div initial={false} animate={{ width: collapsed ? 80 : 224 }} transition={{ type: 'spring', stiffness: 220, damping: 30 }} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
  <header className="sticky top-0 z-30 bg-white backdrop-blur-sm" style={{ boxShadow: '0 1px 0 rgba(16,24,40,0.04)' }}>
          <div className="max-w-full mx-auto px-6 py-3 flex items-center gap-4">
            <div className="flex items-center w-48">
              <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-md hover:bg-gray-100 transition-colors" aria-label="toggle sidebar" aria-expanded={!collapsed}>
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
              <div className="ml-3 hidden md:block">
                <div className="text-xs text-gray-500">Sección</div>
                <div className="font-semibold text-gray-800">{currentRouteName()}</div>
              </div>
            </div>

            {/* Centered search */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-2xl">
                <div className="relative" ref={searchRef}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path>
                    </svg>
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); setHighlightedIndex(-1); }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Busca aquí lo que te interese"
                    aria-label="Buscar"
                    className="w-full bg-gray-100 border border-transparent rounded-full py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />

                  {/* Dropdown de sugerencias */}
                  {isSearchOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-md shadow-lg z-50 max-h-64 overflow-auto">
                      {filteredSuggestions.length > 0 ? (
                        <ul role="listbox" className="divide-y divide-gray-100">
                          {filteredSuggestions.map((s, idx) => (
                            <li
                              key={s.route}
                              role="option"
                              aria-selected={highlightedIndex === idx}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectSuggestion(s)}
                              className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${highlightedIndex === idx ? 'bg-blue-50' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-800">{s.name}</div>
                                <div className="text-xs text-gray-400">{s.section}</div>
                              </div>
                              <div className="text-xs text-gray-500 truncate">{s.route}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">No se encontraron resultados</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: notifications + profile */}
            <div className="flex items-center gap-4 justify-end w-auto min-w-[260px]">
              <button className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors relative flex items-center justify-center" aria-label="notificaciones">
                <FiBell size={18} className="text-green-600" />
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">5</span>
              </button>
              <button className="p-2 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors relative flex items-center justify-center" aria-label="alertas">
                <IoAlertCircleOutline size={18} className="text-pink-500" />
                <span className="absolute -top-1 -right-1 bg-pink-400 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">2</span>
              </button>

              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen((s) => !s)} className="flex items-center gap-3" aria-label="Abrir perfil">
                  <div className="relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-lg object-cover ring-0 hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700 border-2 border-white shadow-lg ring-0 hover:scale-105 transition-transform">
                        {getInitials(userName) || <img src={avatarImg} alt="avatar" className="w-10 h-10 rounded-full object-cover" />}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="hidden md:flex flex-col text-sm text-gray-700">
                    <span className="text-xs text-gray-500">Hola,</span>
                    <span className="font-semibold text-gray-800 truncate max-w-[200px]">{userName || "Usuario"}</span>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-2 z-50">
                    <button onClick={() => { navigate('/perfil'); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mi perfil</button>
                    <button onClick={() => { navigate('/soporte'); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Soporte</button>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                      <CgLogOut /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>

              {/* vertical separator */}
              <div className="h-8 w-px bg-gray-200 ml-3 hidden md:block" />
            </div>
          </div>
  </header>

  <div className="flex-1 overflow-auto p-6 bg-transparent">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
