
import React, { useState, useEffect } from 'react';
import { MdInventory2, MdAddShoppingCart, MdAssignmentTurnedIn } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
const primary = '#00B074';
const mid = '#346C60';
const dark = '#12443D';
const yellow = '#FFD40D';

type InventoryItem = { id?: number; name: string; qty?: string; note?: string };
type RowForMapping = {
  id_insumo?: number;
  nombre_insumo?: string;
  nombre?: string;
  cantidad_actual?: number | null;
  unidad_medida?: string;
  tipo_categoria?: string;
  estado?: string;
};
type Tab = 'overview'|'catalogo'|'ingreso'|'auditoria';

const Inventario: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [perpetualData, setPerpetualData] = useState<InventoryItem[]>([]);
  const [operationalData, setOperationalData] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

// Componente InvActionCard (igual al ejemplo de shucway-web)
const hexToRgba = (hex: string, alpha = 0.12) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const InvActionCard: React.FC<{ title: string; subtitle?: string; icon: React.ReactNode; tone: string; onClick?: () => void; active?: boolean }> = ({ title, subtitle, icon, tone, onClick, active }) => {
  const bg = hexToRgba(tone, 0.10);
  const iconBg = tone;
  const baseClass = 'w-full flex items-center gap-5 rounded-xl px-6 py-5 min-h-[100px] group hover:shadow-lg transition-all duration-200 ease-in-out relative overflow-hidden';
  const activeClass = active ? 'inv-action-active' : '';
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onClick}
      aria-label={title}
      style={{ background: bg }}
      className={`${baseClass} ${activeClass}`}
    >
      <div className="absolute right-0 top-0 w-28 h-28 -translate-y-12 translate-x-12 rounded-full transition-transform group-hover:scale-110 duration-300 opacity-10" style={{ background: iconBg }} />
      <div className="relative">
        <div className="absolute inset-0 rounded-xl opacity-20" style={{ background: iconBg }} />
        <div style={{ background: iconBg }} className="relative flex items-center justify-center w-14 h-14 rounded-xl text-white shadow-lg transform transition-transform group-hover:scale-105 z-10">
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: 'text-white transition-transform group-hover:scale-110', size: 22 }) : icon}
        </div>
      </div>
      <div className="flex flex-col text-left z-10">
        <span className="text-lg font-semibold text-gray-800 mb-1">{title}</span>
        {subtitle && <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">{subtitle}</span>}
      </div>
    </motion.button>
  );
};

  // Carga inicial desde el backend Node
  const load = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/inventario/insumos');
      const result = await response.json();
      let rowsForMapping: Array<RowForMapping> | null = null;
      if (result && Array.isArray(result.insumos)) {
        rowsForMapping = result.insumos;
      }
      if (Array.isArray(rowsForMapping)) {
        // Mapear y separar perpetuos/operativos
        const mappedAll = rowsForMapping.map((row: RowForMapping) => {
          const tipo = row.tipo_categoria || 'perpetuo';
          return {
            id: row.id_insumo,
            name: row.nombre_insumo ?? row.nombre ?? '—',
            qty: row.cantidad_actual != null ? String(row.cantidad_actual) : '-',
            note: row.estado || (row.cantidad_actual === 0 ? 'Crítico' : 'Normal'),
            tipo_insumo: tipo
          };
        });
        const perpetualItems = mappedAll.filter(m => m.tipo_insumo === 'perpetuo').map(({ id, name, qty, note }) => ({ id, name, qty, note }));
        const operationalItems = mappedAll.filter(m => m.tipo_insumo === 'operativo').map(({ id, name, qty, note }) => ({ id, name, qty, note }));
        setPerpetualData(perpetualItems as InventoryItem[]);
        setOperationalData(operationalItems as InventoryItem[]);
      }
    } catch (e) {
      setFetchError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const perpetual = perpetualData;
  const operational = operationalData;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {fetchError && (
        <div className="max-w-6xl mx-auto mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
          <div>
            <strong>Error cargando datos:</strong> {fetchError}
          </div>
          <div>
            <button onClick={() => load()} className="btn primary">Reintentar</button>
          </div>
        </div>
      )}
      {isLoading && <div className="max-w-6xl mx-auto mb-4 text-sm text-gray-500">Cargando datos de inventario...</div>}
      <div className="inv-container">
        <header className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">MÓDULO DE INVENTARIO</h2>
          <p className="text-sm text-gray-500 mt-1">Control de insumos, inventario operativo y alertas</p>
        </header>
        {/* Actions Cards (adaptado de Usuarios) - ocultas cuando se entra a un apartado */}
        {activeTab === 'overview' ? (
          <div className="w-full mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
              <InvActionCard title="CATÁLOGO DE INSUMOS" subtitle="Ver y administrar insumos" icon={<MdInventory2 />} tone={primary} onClick={() => setActiveTab('catalogo')} active={activeTab === ('catalogo' as Tab)} />   
              <InvActionCard title="INGRESO COMPRA" subtitle="Registrar nueva entrada" icon={<MdAddShoppingCart />} tone={mid} onClick={() => setActiveTab('ingreso')} active={activeTab === ('ingreso' as Tab)} />
              <InvActionCard title="AUDITORÍA DE INVENTARIO" subtitle="Revisión y auditorías" icon={<MdAssignmentTurnedIn />} tone={yellow} onClick={() => setActiveTab('auditoria')} active={activeTab === ('auditoria' as Tab)} />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <button onClick={() => setActiveTab('overview')} className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50">← Regresar</button>
          </div>
        )}
            {/* Contenido por pestaña */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {/* Summary cards */}
                  <div className="inv-overview">
                    <div className="inv-card">
                      <h3>Productos Perpetuo</h3>
                      <div className="number">{perpetual.length}</div>
                    </div>

                    <div className="inv-card">
                      <h3>Productos Operativos</h3>
                      <div className="number">{operational.length}</div>
                    </div>

                    {/* Alertas removidas: tarjeta eliminada para evitar referencias a estado inexistente */}

                    <div className="inv-card">
                      <h3>Contactos Próximos</h3>
                      <div className="number">1</div>
                    </div>
                  </div>

                  {/* Inventories */}
                  <div className="inv-grid">
                    <div className="inv-list">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4>Inventario Perpetuo</h4>
                        <button className="see-all" onClick={() => setActiveTab('catalogo')}>Ver todos</button>
                      </div>
                      <table className="inv-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perpetual.length ? perpetual.map((it) => (
                            <tr key={String(it.id ?? it.name)}>
                              <td>{it.name}</td>
                              <td>{it.qty}</td>
                              <td style={{ color: it.note === 'OK' ? mid : it.note === 'Stock Bajo' ? yellow : dark }}>{it.note}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan={3} className="text-sm text-gray-500">No hay productos perpetuos registrados.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="inv-list">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4>Inventario Operativo</h4>
                        <button className="see-all" onClick={() => setActiveTab('catalogo')}>Ver todos</button>
                      </div>
                      <table className="inv-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {operational.length ? operational.map((it) => (
                            <tr key={String(it.id ?? it.name)}>
                              <td>{it.name}</td>
                              <td>{it.qty}</td>
                              <td style={{ color: it.note === 'OK' ? mid : it.note === 'Vencido' ? '#ff5c5c' : yellow }}>{it.note}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan={3} className="text-sm text-gray-500">No hay productos operativos registrados.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Alerts removed */}

                  {/* Footer actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Control en tiempo real • Control periódico</div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 rounded-md" style={{ background: primary, color: '#fff' }}>Exportar Reporte</button>
                      <button className="px-4 py-2 rounded-md" style={{ background: mid, color: '#fff' }}>Ver Catálogo Completo</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'catalogo' && (
                <motion.div key="catalogo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                  {/* Aquí iría el componente de catálogo si lo tienes implementado */}
                  {/* <Catalogo initialTab={catalogTarget} /> */}
                </motion.div>
              )}

              {activeTab === 'ingreso' && (
                <motion.div key="ingreso" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                  {/* <IngresoCompra /> */}
                </motion.div>
              )}

              {activeTab === 'auditoria' && (
                <motion.div key="auditoria" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                  {/* <Auditoria /> */}
                </motion.div>
              )}
            </AnimatePresence>
      </div>
    </div>
  );
};

export default Inventario;