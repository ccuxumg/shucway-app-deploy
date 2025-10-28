import React, { useEffect, useState } from 'react';
// Componente visual para elegir tipo de categoría
function TipoCategoriaCard({ title, desc, examples, active, onClick }: { title: string; desc: string; examples: string; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`text-left rounded-xl p-4 border transition w-full ${active ? "border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/40" : "border-gray-200 hover:border-gray-300"}`}>
      <div className="font-semibold text-gray-800 mb-1">{title}</div>
      <p className="text-sm text-gray-600 mb-2">{desc}</p>
      <span className="inline-block rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{examples}</span>
    </button>
  );
}
import { useNavigate } from 'react-router-dom';
import { PiPlusBold, PiEyeBold, PiPencilSimpleBold, PiTrashBold, PiBroomBold } from 'react-icons/pi';
import { MdClose } from 'react-icons/md';
import api from '../../../../api/apiClient';

type Categoria = {
  id_categoria: number;
  nombre: string;
  tipo_categoria?: string | null;
};

export default function Categorias() {
  const [rows, setRows] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [viewing, setViewing] = useState<boolean>(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null);

  const [formNombre, setFormNombre] = useState<string>('');
  const [formTipo, setFormTipo] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('Todas');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategorias();
  }, []);

  async function fetchCategorias() {
    setLoading(true);
    setError(null);
    try {
      // Obtener desde el backend autenticado (evita problemas de RLS)
      const resp = await api.get('/dashboard/table-data/categoria_insumo?limit=1000');
      if (!resp || resp.status >= 400) throw new Error('Error al cargar categorías');
      const js = resp.data || {};
      const data = js.data || [];
      setRows((data ?? []) as Categoria[]);
    } catch (e) {
      console.error('Error cargando categorías desde API/backend:', e);
      const m = e instanceof Error ? e.message : String(e);
      setError(m);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setFormNombre('');
    setFormTipo('');
    setViewing(false);
    setOpenDrawer(true);
  }

  function openEdit(row: Categoria) {
    setEditing(row);
    setFormNombre(row.nombre || '');
    setFormTipo(row.tipo_categoria || '');
    setViewing(false);
    setOpenDrawer(true);
  }

  function openView(row: Categoria) {
    setEditing(row);
    setFormNombre(row.nombre || '');
    setFormTipo(row.tipo_categoria || '');
    setViewing(true);
    setOpenDrawer(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formNombre.trim()) return alert('El nombre es obligatorio');
    setLoading(true);
    try {
      if (editing) {
        // actualizar via backend
        const payload: { nombre: string; tipo_categoria: string | null } = { nombre: formNombre.trim(), tipo_categoria: formTipo || null };
        const resp = await api.put(`/dashboard/table-data/categoria_insumo/${encodeURIComponent(String(editing.id_categoria))}`, payload as Record<string, unknown>);
        if (!resp || resp.status >= 400) throw new Error('Error al actualizar categoría');
      } else {
        const payload: { nombre: string; tipo_categoria: string | null } = { nombre: formNombre.trim(), tipo_categoria: formTipo || null };
        const resp = await api.post('/dashboard/table-data/categoria_insumo', payload as Record<string, unknown>);
        if (!resp || resp.status >= 400) throw new Error('Error al crear categoría');
      }
  await fetchCategorias();
  setOpenDrawer(false);
    } catch (err: unknown) {
      console.error('Error guardando categoría:', err);
      const m = err instanceof Error ? err.message : String(err);
      alert('Error: ' + m);
    } finally {
      setLoading(false);
    }
  }

  async function doDelete(row: Categoria) {
    setLoading(true);
    try {
      const resp = await api.delete(`/dashboard/table-data/categoria_insumo/${encodeURIComponent(String(row.id_categoria))}`);
      if (!resp || resp.status >= 400) throw new Error('Error al eliminar categoría');
      await fetchCategorias();
      setConfirmDelete(null);
    } catch (err: unknown) {
      console.error('Error eliminando categoría:', err);
      const m = err instanceof Error ? err.message : String(err);
      alert('Error: ' + m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          {/* Izquierda: regresar, búsqueda y filtro */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100" title="Regresar">←</button>
            <h3 className="text-base font-semibold">Gestión de Categorías</h3>

            <label className="sr-only" htmlFor="cat-search">Buscar</label>
            <input id="cat-search" placeholder="Buscar categorías…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 w-64 rounded-lg border border-gray-200 bg-white pl-3 pr-3 text-sm text-gray-700 focus:outline-none" />

            <label className="sr-only" htmlFor="cat-tipo">Tipo</label>
            <select id="cat-tipo" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700">
              <option value="Todas">Todos</option>
              <option value="Operativo">Operativos</option>
              <option value="Perpetuo">Perpetuos</option>
            </select>
          </div>

          {/* Derecha: botones */}
          <div className="flex items-center gap-2">
            <button onClick={() => { setQ(''); setFilterTipo('Todas'); }} className="h-10 rounded-lg border px-3 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2">
              <PiBroomBold />
              Limpiar
            </button>
            <button onClick={openCreate} className="h-10 rounded-lg bg-emerald-600 px-3 text-white flex items-center gap-2">
              <PiPlusBold /> Crear Categoría
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm text-gray-600">Lista de categorías de insumo</div>
          <div className="text-sm text-gray-500">{rows.length} registros</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 text-xs uppercase">
              <tr className="border-b">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center">Cargando...</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">No hay categorías</td>
                </tr>
              )}
              {rows
                .filter((r) => {
                  if (filterTipo !== 'Todas') {
                    const tipo = (r.tipo_categoria || '').toLowerCase();
                    if (filterTipo.toLowerCase() === 'perpetuo' && !tipo.includes('perpetuo')) return false;
                    if (filterTipo.toLowerCase() === 'operativo' && tipo.includes('perpetuo')) return false;
                  }
                  if (q && !(`${r.nombre}`.toLowerCase().includes(q.toLowerCase()) || `${r.tipo_categoria}`.toLowerCase().includes(q.toLowerCase()))) return false;
                  return true;
                })
                .map((r) => (
                <tr key={r.id_categoria} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">{r.id_categoria}</td>
                  <td className="px-4 py-3 align-top">{r.nombre}</td>
                  <td className="px-4 py-3 align-top">{r.tipo_categoria ?? '—'}</td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button title="Ver" onClick={() => openView(r)} className="p-2 rounded-lg hover:bg-gray-100"><PiEyeBold /></button>
                      <button title="Editar" onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-gray-100"><PiPencilSimpleBold /></button>
                      <button title="Eliminar" onClick={() => setConfirmDelete(r)} className="p-2 rounded-lg hover:bg-gray-100 text-rose-600"><PiTrashBold /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer para ver/crear/editar */}
      <div aria-hidden={!openDrawer}>
        {openDrawer && (
          <div className="fixed inset-0 z-[60] flex">
            {/* Overlay solo detrás del drawer */}
            <div className="flex-1" onClick={() => setOpenDrawer(false)}>
              <div className="absolute inset-0 bg-black/40" />
            </div>
            <aside className="relative w-full md:w-[520px] bg-white shadow-2xl border-l z-[61] ml-auto">
              <div className="h-14 px-5 flex items-center justify-between border-b">
                <h3 className="text-base md:text-lg font-bold text-gray-800">{viewing ? 'Ver categoría' : (editing ? 'Editar categoría' : 'Crear categoría')}</h3>
                <button onClick={() => setOpenDrawer(false)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Cerrar"><MdClose /></button>
              </div>
              <div className="p-5">
                <form onSubmit={submitForm}>
                  <div className="grid gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                      <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} className={`w-full h-11 rounded-lg border px-3 ${viewing ? 'bg-gray-50' : ''}`} readOnly={viewing} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tipo de categoría</label>
                      {viewing ? (
                        <input value={formTipo} className="w-full h-11 rounded-lg border px-3 bg-gray-50" readOnly />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <TipoCategoriaCard
                            title="Operativo"
                            desc="Categoría para insumos básicos que se consumen directamente."
                            examples="Ej: Pan, Verduras, Aceite"
                            active={formTipo.toLowerCase() === 'operativo'}
                            onClick={() => setFormTipo('Operativo')}
                          />
                          <TipoCategoriaCard
                            title="Perpetuo"
                            desc="Categoría para productos elaborados que requieren receta."
                            examples="Ej: Shuco, Hamburguesa, Salsa Especial"
                            active={formTipo.toLowerCase() === 'perpetuo'}
                            onClick={() => setFormTipo('Perpetuo')}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button type="button" onClick={() => setOpenDrawer(false)} className="h-10 rounded-lg border px-4">Cerrar</button>
                      {!viewing && <button type="submit" className="h-10 rounded-lg bg-emerald-600 px-4 text-white">{editing ? 'Guardar' : 'Crear'}</button>}
                    </div>
                  </div>
                </form>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border">
            <div className="text-lg font-bold mb-2">Eliminar categoría</div>
            <div className="mb-4">¿Seguro que deseas eliminar <strong>{confirmDelete.nombre}</strong>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="h-10 rounded-lg border px-4">Cancelar</button>
              <button onClick={() => doDelete(confirmDelete)} className="h-10 rounded-lg bg-rose-600 px-4 text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-3 text-sm text-rose-700">Error: {error}</div>}
    </div>
  );
}
