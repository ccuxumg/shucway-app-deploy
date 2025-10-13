import React, { useState } from "react";
import UsuariosTable from "../../../components/UsuariosTable/UsuariosTable";
import { MdAdminPanelSettings, MdPriceCheck, MdReceiptLong, MdTrendingUp } from "react-icons/md";
import { motion } from "framer-motion";

// colores principales para las tarjetas (hex)
const CARD_COLORS: Record<string, string> = {
  usuarios: "#346d61",
  precios: "#01a049",
  promociones: "#fec223",
  gastos: "#13443c",
};

const hexToRgba = (hex: string, alpha = 0.08) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const InfoCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone: string; // color hex
  onClick?: () => void;
}> = ({ title, subtitle, icon, tone, onClick }) => {
  const bg = hexToRgba(tone, 0.12);
  const iconBg = tone;
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
      {/* Círculo decorativo de fondo */}
      <div 
        className="absolute right-0 top-0 w-32 h-32 -translate-y-16 translate-x-16 rounded-full transition-transform group-hover:scale-110 duration-300 opacity-10"
        style={{ background: iconBg }}
      />
      
      {/* Contenedor del icono con borde y fondo */}
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-xl opacity-20"
          style={{ background: iconBg }}
        />
        <div 
          style={{ background: iconBg }} 
          className="relative flex items-center justify-center w-16 h-16 rounded-xl text-white shadow-lg transform transition-transform group-hover:scale-105 z-10"
        >
          {React.isValidElement(icon) ? 
            React.cloneElement(icon as unknown as React.ReactElement, { 
              className: 'text-white transition-transform group-hover:scale-110', 
              size: 24 
            }) : icon}
        </div>
      </div>
      
      <div className="flex flex-col text-left z-10">
        <span className="text-lg font-semibold text-gray-800 mb-1">{title}</span>
        {subtitle && (
          <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
            {subtitle}
          </span>
        )}
      </div>
    </motion.button>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendLabel }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-gray-500">{title}</span>
      <div className="text-green-600">{icon}</div>
    </div>
    <div className="flex items-baseline space-x-4">
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {trend && (
        <div className={`flex items-center space-x-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
          <MdTrendingUp className={`${trend > 0 ? '' : 'transform rotate-180'}`} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    {trendLabel && <p className="mt-1 text-sm text-gray-500">{trendLabel}</p>}
  </div>
);

const Usuarios = () => {
  const [activeTab, setActiveTab] = useState('todos');

  return (
    <div className="w-full bg-[#f3f2f7] pt-6 pb-8 px-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Usuarios"
          value="0"
          icon={<MdAdminPanelSettings size={20} />}
          trend={0}
          trendLabel="vs mes anterior"
        />
        <StatCard
          title="Usuarios Activos"
          value="0"
          icon={<MdAdminPanelSettings size={20} />}
          trend={0}
          trendLabel="últimos 30 días"
        />
        <StatCard
          title="Nuevos Usuarios"
          value="0"
          icon={<MdAdminPanelSettings size={20} />}
          trend={0}
          trendLabel="este mes"
        />
        <StatCard
          title="Tasa de Retención"
          value="0%"
          icon={<MdAdminPanelSettings size={20} />}
          trend={0}
          trendLabel="promedio mensual"
        />
      </div>

      {/* Actions Cards */}
      <div className="w-full mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <InfoCard title="GESTIÓN DE USUARIO" subtitle="Acciones rápidas" icon={<MdAdminPanelSettings />} tone={CARD_COLORS.usuarios} />
          <InfoCard title="CONFIGURACIÓN DE PRECIOS" subtitle="Ajustes y promociones" icon={<MdPriceCheck />} tone={CARD_COLORS.precios} />
          <InfoCard title="GASTOS OPERATIVOS" subtitle="Registro de costos" icon={<MdReceiptLong />} tone={CARD_COLORS.gastos} />
        </div>
      </div>

      {/* Tabs y Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex space-x-6">
            {['todos', 'activos', 'inactivos', 'pendientes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="px-6 py-4">
          <UsuariosTable />
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
