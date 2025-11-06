import { useEffect, useState, useMemo } from "react";
import gastosOperativosService, { GastoOperativo, CategoriaGasto } from "../../../api/gastosOperativosService";

export default function GastosOperativos() {
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);

  const [form, setForm] = useState({
    numero_gasto: "",
    fecha_gasto: new Date().toISOString().split("T")[0],
    id_categoria: 0,
    nombre_gasto: "",
    detalle: "",
    monto: 0,
    frecuencia: "mensual" as 'semanal' | 'quincenal' | 'mensual',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedGasto, setSelectedGasto] = useState<GastoOperativo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadGastos();
    loadCategorias();
  }, []);

  const loadGastos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gastosOperativosService.getGastos();
      setGastos(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = () => {
    setCategorias([
      { id_categoria: 1, nombre: "Gastos de Personal", descripcion: "Sueldos y salarios" },
      { id_categoria: 2, nombre: "Servicios Fijos (Mensuales)", descripcion: "Electricidad, agua, internet, renta" },
      { id_categoria: 3, nombre: "Insumos Operativos", descripcion: "Materiales y suministros" },
      { id_categoria: 4, nombre: "Gastos de Transporte", descripcion: "Combustible y fletes" },
      { id_categoria: 5, nombre: "Mantenimiento y Reemplazos", descripcion: "Reparaciones" },
    ]);
  };

  const getCategoriaNombre = (g: GastoOperativo): string => {
    return g.categoria_gasto?.nombre || "General";
  };

  const getNombreUsuario = (g: GastoOperativo): string => {
    if (g.perfil_usuario?.primer_nombre && g.perfil_usuario?.primer_apellido) {
      return `${g.perfil_usuario.primer_nombre} ${g.perfil_usuario.primer_apellido}`;
    }
    return "-";
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.numero_gasto || form.numero_gasto.trim().length < 3) {
      errs.numero_gasto = "Número de gasto (mín. 3 caracteres)";
    }
    if (!form.fecha_gasto) {
      errs.fecha_gasto = "Seleccione una fecha";
    }
    if (!form.id_categoria || form.id_categoria === 0) {
      errs.id_categoria = "Seleccione una categoría";
    }
    if (!form.nombre_gasto || form.nombre_gasto.trim().length < 3) {
      errs.nombre_gasto = "Nombre de gasto (mín. 3 caracteres)";
    }
    if (!form.detalle || form.detalle.trim().length < 3) {
      errs.detalle = "Detalle (mín. 3 caracteres)";
    }
    if (Number(form.monto) <= 0) {
      errs.monto = "Monto debe ser mayor a 0";
    }
    if (!form.frecuencia) {
      errs.frecuencia = "Seleccione una frecuencia";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createGasto = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = {
        numero_gasto: form.numero_gasto.trim(),
        fecha_gasto: form.fecha_gasto,
        id_categoria: form.id_categoria,
        nombre_gasto: form.nombre_gasto.trim(),
        detalle: form.detalle.trim(),
        monto: Number(form.monto),
        frecuencia: form.frecuencia,
      };
      await gastosOperativosService.createGasto(payload);
      setDrawerOpen(false);
      resetForm();
      await loadGastos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear gasto";
      setFormErrors((prev) => ({ ...prev, _general: msg }));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      numero_gasto: "",
      fecha_gasto: new Date().toISOString().split("T")[0],
      id_categoria: 0,
      nombre_gasto: "",
      detalle: "",
      monto: 0,
      frecuencia: "mensual",
    });
    setFormErrors({});
  };

  const filteredGastos = useMemo(() => {
    if (!searchTerm) return gastos;
    const q = searchTerm.toLowerCase();
    return gastos.filter((g) => {
      const det = (g.detalle || "").toLowerCase();
      const nom = (g.nombre_gasto || "").toLowerCase();
      const cat = getCategoriaNombre(g).toLowerCase();
      const usr = getNombreUsuario(g).toLowerCase();
      const num = (g.numero_gasto || "").toLowerCase();
      return det.includes(q) || nom.includes(q) || cat.includes(q) || usr.includes(q) || num.includes(q);
    });
  }, [gastos, searchTerm]);

  const paginatedGastos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGastos.slice(start, start + pageSize);
  }, [filteredGastos, currentPage]);

  const totalGastos = useMemo(() => gastos.reduce((sum, g) => sum + Number(g.monto), 0), [gastos]);

  const totalPages = Math.ceil(filteredGastos.length / pageSize);

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gastos Operativos</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ background: "#064E3B" }}
          className="text-white px-6 py-2 rounded-lg hover:opacity-90 font-medium"
        >
          + Registrar gasto
        </button>
      </div>

      {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Gastos</div>
          <div className="text-2xl font-bold text-green-600">
            Q {totalGastos.toLocaleString("es-GT", { maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Cantidad Registros</div>
          <div className="text-2xl font-bold">{gastos.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Promedio</div>
          <div className="text-2xl font-bold">
            Q {(gastos.length > 0 ? totalGastos / gastos.length : 0).toLocaleString("es-GT", { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold">No./Ref</th>
              <th className="px-6 py-3 text-sm font-semibold">Fecha</th>
              <th className="px-6 py-3 text-sm font-semibold">Nombre</th>
              <th className="px-6 py-3 text-sm font-semibold">Categoría</th>
              <th className="px-6 py-3 text-sm font-semibold">Monto</th>
              <th className="px-6 py-3 text-sm font-semibold">Usuario</th>
              <th className="px-6 py-3 text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : paginatedGastos.length > 0 ? (
              paginatedGastos.map((gasto) => (
                <tr key={gasto.id_gasto} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{gasto.numero_gasto || `#${gasto.id_gasto}`}</td>
                  <td className="px-6 py-4 text-sm">{new Date(gasto.fecha_gasto).toLocaleDateString("es-GT")}</td>
                  <td className="px-6 py-4 text-sm font-medium">{gasto.nombre_gasto}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">{getCategoriaNombre(gasto)}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    Q {Number(gasto.monto).toLocaleString("es-GT", { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm">{getNombreUsuario(gasto)}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        setSelectedGasto(gasto);
                        setModalOpen(true);
                      }}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No hay gastos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 justify-center">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {modalOpen && selectedGasto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gasto {selectedGasto.numero_gasto || `#${selectedGasto.id_gasto}`}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-500">Fecha</div>
                <div className="font-medium">{new Date(selectedGasto.fecha_gasto).toLocaleString("es-GT")}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Nombre</div>
                <div className="font-medium">{selectedGasto.nombre_gasto}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Categoría</div>
                <div className="font-medium">{getCategoriaNombre(selectedGasto)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Monto</div>
                <div className="font-bold text-green-600">Q {Number(selectedGasto.monto).toLocaleString("es-GT", { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Frecuencia</div>
                <div className="font-medium capitalize">{selectedGasto.frecuencia}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Usuario</div>
                <div className="font-medium">{getNombreUsuario(selectedGasto)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Creado</div>
                <div className="font-medium">{selectedGasto.fecha_creacion ? new Date(selectedGasto.fecha_creacion).toLocaleString("es-GT") : "N/A"}</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">Detalle</div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm">{selectedGasto.detalle}</div>
            </div>

            <div className="border-t pt-4 text-right">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)}></div>
          <div className="w-full max-w-2xl bg-white shadow-lg overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Nuevo Gasto Operativo</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {formErrors._general && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{formErrors._general}</div>}

              <div>
                <label className="block text-sm font-medium mb-2">No./Ref *</label>
                <input
                  type="text"
                  value={form.numero_gasto}
                  onChange={(e) => setForm((f) => ({ ...f, numero_gasto: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.numero_gasto ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"}`}
                  placeholder="GAST-001"
                />
                {formErrors.numero_gasto && <p className="text-xs text-red-500 mt-1">{formErrors.numero_gasto}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fecha *</label>
                <input
                  type="date"
                  value={form.fecha_gasto}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_gasto: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.fecha_gasto ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"}`}
                />
                {formErrors.fecha_gasto && <p className="text-xs text-red-500 mt-1">{formErrors.fecha_gasto}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoría *</label>
                <select
                  value={form.id_categoria}
                  onChange={(e) => setForm((f) => ({ ...f, id_categoria: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.id_categoria ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"}`}
                >
                  <option value="0">Seleccione...</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {formErrors.id_categoria && <p className="text-xs text-red-500 mt-1">{formErrors.id_categoria}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nombre del Gasto *</label>
                <input
                  type="text"
                  value={form.nombre_gasto}
                  onChange={(e) => setForm((f) => ({ ...f, nombre_gasto: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.nombre_gasto ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"}`}
                  placeholder="Pago de renta"
                />
                {formErrors.nombre_gasto && <p className="text-xs text-red-500 mt-1">{formErrors.nombre_gasto}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detalle *</label>
                <textarea
                  rows={3}
                  value={form.detalle}
                  onChange={(e) => setForm((f) => ({ ...f, detalle: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.detalle ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"}`}
                  placeholder="Descripción del gasto..."
                />
                {formErrors.detalle && <p className="text-xs text-red-500 mt-1">{formErrors.detalle}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Frecuencia *</label>
                <select
                  value={form.frecuencia}
                  onChange={(e) => setForm((f) => ({ ...f, frecuencia: e.target.value as 'semanal' | 'quincenal' | 'mensual' }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.frecuencia ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"}`}
                >
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
                {formErrors.frecuencia && <p className="text-xs text-red-500 mt-1">{formErrors.frecuencia}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monto (Q) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.monto}
                  onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formErrors.monto ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"}`}
                  placeholder="0.00"
                />
                {formErrors.monto && <p className="text-xs text-red-500 mt-1">{formErrors.monto}</p>}
              </div>
            </div>

            <div className="p-6 border-t flex gap-2 sticky bottom-0 bg-white">
              <button onClick={() => resetForm()} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" disabled={saving}>
                Limpiar
              </button>
              <button onClick={createGasto} style={{ background: "#064E3B" }} className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
