import React, { useState, useEffect } from 'react';
import './Inventario.css';
import { MdInventory2, MdAddShoppingCart, MdAssignmentTurnedIn } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import Catalogo from './Catalogo';
import IngresoCompra from './IngresoCompra';
import Auditoria from './Auditoria';
import { supabase } from '../../../api/supabaseClient';

const primary = '#00B074';
const mid = '#346C60';
const dark = '#12443D';
const yellow = '#FFD40D';

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

// Los datos ahora se cargan desde Supabase. Mantener tipos mínimos para el front.
type InventoryItem = { id?: number; name: string; qty?: string; note?: string };

// Tipo usado internamente para mapear filas desde la vista o tabla
type RowForMapping = {
  id_insumo?: number;
  insumo?: string;
  nombre?: string;
  stock_actual?: number | null;
  unidad_medida?: string;
  estado_stock?: string;
};

type Tab = 'overview'|'catalogo'|'ingreso'|'auditoria';

const Inventario: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Estado dinámico para reemplazar los arrays estáticos
  const [perpetualData, setPerpetualData] = useState<InventoryItem[]>([]);
  const [operationalData, setOperationalData] = useState<InventoryItem[]>([]);
// alertas removidas temporalmente
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // sección objetivo para el catálogo: 'todos' | 'perpetuos' | 'operativos'
  const [catalogTarget, setCatalogTarget] = useState<'todos'|'perpetuos'|'operativos'>('todos');
  

  // Carga inicial desde la base de datos (función reutilizable para reintento)
  const load = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // Intento preferente: vista agregada por el DBA
      const { data: inventarioRows, error: invErr } = await supabase
        .from('vw_inventario_actual')
        .select('id_insumo, insumo, categoria, stock_actual, stock_minimo, unidad_medida, estado_stock')
        .order('insumo', { ascending: true })
        .limit(200);

      // Si la vista falla por permisos, haremos un fallback a la tabla `insumo`
  let rowsForMapping: Array<RowForMapping> | null = null;

      if (invErr) {
        const maybeErr = invErr as { message?: string } | undefined;
        const msg = maybeErr && maybeErr.message ? maybeErr.message : String(invErr);
        console.warn('Error leyendo vw_inventario_actual:', msg);
        // No tirar excepción: intentamos fallback
        try {
          const { data: insRows, error: insErr } = await supabase
            .from('insumo')
            .select('id_insumo, nombre, tipo_insumo, unidad_medida, stock')
            .order('nombre', { ascending: true })
            .limit(200);

          if (insErr) {
            const maybe2 = insErr as { message?: string } | undefined;
            const msg2 = maybe2 && maybe2.message ? maybe2.message : String(insErr);
            console.warn('Fallback insumo falló:', msg2);
            setFetchError(msg + ' | ' + msg2);
          } else {
            rowsForMapping = Array.isArray(insRows) ? insRows.map((r: RowForMapping) => {
              const asRecord = r as unknown as Record<string, unknown>;
              const fallbackStock = typeof asRecord['stock'] === 'number' ? (asRecord['stock'] as number) : null;
              const stockVal = r.stock_actual ?? fallbackStock ?? null;
              return {
                id_insumo: r.id_insumo,
                insumo: r.nombre,
                stock_actual: stockVal,
                unidad_medida: r.unidad_medida,
                // No hay stock_minimo en la tabla insumo del script provisto; dejamos estado por defecto
                estado_stock: stockVal === 0 ? 'Crítico' : 'Normal'
              };
            }) : null;
          }
        } catch (fallbackErr) {
          console.error('Error en fallback a insumo:', fallbackErr);
        }
      } else {
        rowsForMapping = Array.isArray(inventarioRows) ? inventarioRows : null;
      }

      if (Array.isArray(rowsForMapping)) {
        // Intentamos obtener tipo_insumo desde la tabla insumo para enriquecer si fue necesario
  const ids = rowsForMapping.map((r: RowForMapping) => r.id_insumo).filter(Boolean) as number[];
        let insumosFull: Array<{ id_insumo?: number; tipo_insumo?: string; nombre?: string }> = [];
        if (ids.length) {
          const { data: insFull, error: insFullErr } = await supabase.from('insumo').select('id_insumo, tipo_insumo, nombre').in('id_insumo', ids);
          if (insFullErr) {
            const maybe = insFullErr as { message?: string } | undefined;
            console.warn('Error leyendo insumo (tipo):', maybe && maybe.message ? maybe.message : insFullErr);
          }
          insumosFull = Array.isArray(insFull) ? insFull : [];
        }

        const mappedAll = rowsForMapping.map((row: RowForMapping) => {
          const tipo = insumosFull.find(i => i.id_insumo === row.id_insumo)?.tipo_insumo || 'perpetuo';
          return {
            id: row.id_insumo,
            name: (row.insumo ?? row.nombre ?? '—') as string,
            qty: row.stock_actual != null ? String(row.stock_actual) : '-',
            note: row.estado_stock || 'Normal',
            tipo_insumo: tipo
          };
        });

        const perpetualItems = mappedAll.filter(m => m.tipo_insumo === 'perpetuo').map(({ id, name, qty, note }) => ({ id, name: name as string, qty, note }));
        const operationalItems = mappedAll.filter(m => m.tipo_insumo === 'operativo').map(({ id, name, qty, note }) => ({ id, name: name as string, qty, note }));

        setPerpetualData(perpetualItems as InventoryItem[]);
        setOperationalData(operationalItems as InventoryItem[]);
      }

      // alertas removidas temporalmente
    } catch (e) {
      console.error('Error cargando datos de inventario:', e);
      setFetchError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // No usar valores por defecto. Los arrays provienen exclusivamente de la BD.
  const perpetual = perpetualData;
  const operational = operationalData;
  // alerts removed

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
                        <button className="see-all" onClick={() => { setCatalogTarget('perpetuos'); setActiveTab('catalogo'); }}>Ver todos</button>
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
                        <button className="see-all" onClick={() => { setCatalogTarget('operativos'); setActiveTab('catalogo'); }}>Ver todos</button>
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
                  <Catalogo initialTab={catalogTarget} />
                </motion.div>
              )}

              {activeTab === 'ingreso' && (
                <motion.div key="ingreso" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                  <IngresoCompra />
                </motion.div>
              )}

              {activeTab === 'auditoria' && (
                <motion.div key="auditoria" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                  <Auditoria />
                </motion.div>
              )}
            </AnimatePresence>
      </div>
    </div>
  );
};

export default Inventario;