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
import { supabase } from "../api/supabaseClient";

// usar el logo público (public/img/logo.png)
const publicLogo = "/img/logo.png";

const sidebarItems = [
  { name: "Inicio", icon: <MdHome size={18} />, route: "/dashboard" },
  { name: "Ventas", icon: <MdShoppingCart size={18} />, route: "/ventas" },
  { name: "Inventario", icon: <MdInventory2 size={18} />, route: "/inventario" },
  { name: "Reportes", icon: <MdOutlineAssessment size={18} />, route: "/reportes" },
  { name: "Administración", icon: <MdAdminPanelSettings size={18} />, route: "/administracion" },
  { name: "Configuración", icon: <MdSettings size={18} />, route: "/configuracion" },
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

  useEffect(() => {
    // Intenta obtener el usuario de supabase; si no, usa email como fallback
    const getUserMetadata = (u: unknown): Record<string, unknown> | null => {
      if (!u || typeof u !== 'object') return null;
      const obj = u as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(obj, 'user_metadata')) {
        const md = obj['user_metadata'];
        if (md && typeof md === 'object') return md as Record<string, unknown>;
      }
      return null;
    };

    const fetchUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) {
          setUserName(null);
          setAvatarUrl(null);
          return;
        }

        // Primero intentar obtener el perfil desde la tabla perfil_usuario
        try {
          const { data: profile, error: profileError } = await supabase
            .from('perfil_usuario')
            .select('primer_nombre, primer_apellido, username, avatar_url')
            .eq('id_perfil', user.id)
            .single();

          if (!profileError && profile) {
            const fullName = `${profile.primer_nombre || ''} ${profile.primer_apellido || ''}`.trim();
            const nameToUse = fullName || profile.username || (user.email ? user.email.split('@')[0] : null);
            setUserName(nameToUse);
            setAvatarUrl(profile.avatar_url || null);
            return;
          }
        } catch {
          // ignore and fallback to metadata
        }

        // Si no hay perfil, usar metadata o email como fallback
        const metadata = getUserMetadata(user);
        const metaName = metadata && (metadata['full_name'] as string) ? (metadata['full_name'] as string) : null;
        const fallbackName = metaName || (user.email ? user.email.split('@')[0] : null);
        let avatar: string | null = null;
        if (metadata) {
          avatar = (metadata['avatar_url'] as string) || (metadata['avatar'] as string) || (metadata['picture'] as string) || null;
        }
        setAvatarUrl(avatar);
        setUserName(fallbackName);
      } catch {
        setUserName(null);
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

  // removed theme toggle per request

  const currentRouteName = () => {
    const match = sidebarItems.find((s) => s.route === location.pathname);
    return match?.name || location.pathname.replace("/", "") || "Panel";
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
                    <Tippy
                      key={item.name}
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
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex-1" />

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
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium"
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path>
                    </svg>
                  </span>
                  <input
                    placeholder="Busca aquí lo que te interese"
                    className="w-full bg-gray-100 border border-transparent rounded-full py-2 pl-10 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
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
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Configuración</button>
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
