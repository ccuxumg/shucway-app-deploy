import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import ventasImg from "/img/ventas.jpg";
import inventarioImg from "/img/inventario.jpg";
import adminImg from "/img/adm.jpg";
import reportesImg from "/img/reportes.jpg";
import configImg from "/img/config.jpg";

const modules = [
  {
    name: "Ventas",
    img: ventasImg,
    route: "/ventas",
    color: "from-blue-500 to-blue-300",
  },
  {
    name: "Inventario",
    img: inventarioImg,
    route: "/inventario",
    color: "from-green-500 to-green-300",
  },
  {
    name: "Administración",
    img: adminImg,
    route: "/administracion",
    color: "from-purple-500 to-purple-300",
  },
  {
    name: "Reportes",
    img: reportesImg,
    route: "/reportes",
    color: "from-yellow-500 to-yellow-300",
  },
  {
    name: "Configuración",
    img: configImg,
    route: "/configuracion",
    color: "from-gray-500 to-gray-300",
  },
];

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  // Configuraciones locales (simuladas)
  const [enableNotifications, setEnableNotifications] = useState<boolean>(true);
  const [autoPrint, setAutoPrint] = useState<boolean>(false);
  const [showLowStockAlerts, setShowLowStockAlerts] = useState<boolean>(true);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <header className="w-full max-w-6xl mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Panel Principal</h1>
        <p className="text-sm text-gray-600 mt-1">Accesos rápidos y estado general del sistema</p>
      </header>

      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {modules.map((mod) => (
          <div
            key={mod.name}
            role="button"
            tabIndex={0}
            onClick={() => (mod.route ? navigate(mod.route) : null)}
            onKeyDown={(e) => (e.key === "Enter" && mod.route ? navigate(mod.route) : null)}
            className={`relative rounded-2xl shadow-md cursor-pointer group overflow-hidden h-48 flex items-end bg-gradient-to-tr ${mod.color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400`}
          >
            <img
              src={mod.img}
              alt={mod.name}
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 transition duration-300"
            />
            <div className="relative z-10 p-5 w-full flex flex-col items-start">
              <span className="text-xl md:text-2xl font-semibold text-white drop-shadow-lg mb-1">{mod.name}</span>
              {mod.name === "Administración" && (
                <span className="text-xs bg-white/80 text-gray-700 px-2 py-1 rounded">Gestión de usuarios</span>
              )}
            </div>
          </div>
        ))}
      </section>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuraciones */}
        <aside className="col-span-1 lg:col-span-1 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Configuraciones</h2>
          <p className="text-sm text-gray-600 mb-4">Ajustes rápidos que puedes activar o desactivar. Estos cambios son locales por ahora.</p>

          <ul className="space-y-4">
            <li className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">Notificaciones</div>
                <div className="text-xs text-gray-500">Recibe alertas sobre ventas y pedidos</div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={enableNotifications}
                  onChange={(e) => setEnableNotifications(e.target.checked)}
                  aria-label="Activar notificaciones"
                />
                <span className={`w-11 h-6 flex items-center bg-gray-300 rounded-full p-1 transition-colors ${enableNotifications ? "bg-indigo-500" : "bg-gray-300"}`}>
                  <span className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${enableNotifications ? "translate-x-5" : "translate-x-0"}`}></span>
                </span>
              </label>
            </li>

            <li className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">Impresión automática</div>
                <div className="text-xs text-gray-500">Imprime tickets al concluir ventas</div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  aria-label="Activar impresión automática"
                />
                <span className={`w-11 h-6 flex items-center bg-gray-300 rounded-full p-1 transition-colors ${autoPrint ? "bg-indigo-500" : "bg-gray-300"}`}>
                  <span className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${autoPrint ? "translate-x-5" : "translate-x-0"}`}></span>
                </span>
              </label>
            </li>

            <li className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">Alertas de stock bajo</div>
                <div className="text-xs text-gray-500">Recibe avisos cuando el inventario es bajo</div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={showLowStockAlerts}
                  onChange={(e) => setShowLowStockAlerts(e.target.checked)}
                  aria-label="Activar alertas de stock bajo"
                />
                <span className={`w-11 h-6 flex items-center bg-gray-300 rounded-full p-1 transition-colors ${showLowStockAlerts ? "bg-indigo-500" : "bg-gray-300"}`}>
                  <span className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${showLowStockAlerts ? "translate-x-5" : "translate-x-0"}`}></span>
                </span>
              </label>
            </li>
          </ul>
        </aside>

        {/* Reportes - placeholders vacíos */}
        <section className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 min-h-[220px] flex flex-col">
            <header className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-gray-800">Ventas (últimos 30 días)</h3>
              <span className="text-xs text-gray-500">Estado: sin datos</span>
            </header>
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
              <div className="text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2" width="64" height="40" viewBox="0 0 64 40" fill="none">
                  <rect x="2" y="6" width="60" height="26" rx="3" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
                <div className="text-sm">No hay datos para mostrar</div>
                <div className="text-xs text-gray-400">Cuando ingresen ventas, aquí aparecerá la gráfica</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 min-h-[220px] flex flex-col">
            <header className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-gray-800">Inventario (stock por categoría)</h3>
              <span className="text-xs text-gray-500">Estado: sin datos</span>
            </header>
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
              <div className="text-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2" width="64" height="40" viewBox="0 0 64 40" fill="none">
                  <rect x="2" y="6" width="60" height="26" rx="3" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
                <div className="text-sm">No hay datos para mostrar</div>
                <div className="text-xs text-gray-400">Cuando se registren movimientos, aquí aparecerá la gráfica</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardHome;
