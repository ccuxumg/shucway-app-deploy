import { useEffect, useState, useMemo } from "react";
import { MdLocalDining } from "react-icons/md";
import { api } from "../../../api/apiClient";
import gastosOperativosService, { GastoOperativo, CategoriaGasto, Proveedor } from "../../../api/gastosOperativosService";

/* =============== Componente Principal =============== */
export default function GastosOperativos() {
  const [gastos, setGastos] = useState<GastoOperativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drawer/form
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [form, setForm] = useState({
    numero_gasto: "",
    fecha_gasto: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
    id_categoria: "" as unknown as number | "",
    detalle: "",
    monto: "" as unknown as number | "",
    tipo_movimiento: "compra" as "compra" | "gasto" | "inversion",
    id_proveedor: "" as unknown as number | "",
    comprobante: null as File | null,
  });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});

  // Modal de detalle
  const [selectedGasto, setSelectedGasto] = useState<GastoOperativo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadGastos();
    // Cargar cat/proveedores para el form
    (async () => {
      try {
        const [cats, provs] = await Promise.all([
          api.get("/categoria-gasto?activos=1"),
          api.get("/proveedores?activos=1"),
        ]);
        setCategorias(cats.data || []);
        setProveedores(provs.data || []);
      } catch (e) {
        console.warn("No se pudieron cargar categorías/proveedores", e);
      }
    })();
  }, []);

  const loadGastos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gastosOperativosService.getGastos();
      setGastos(data);
    } catch (err: unknown) {
      console.error("Error loading gastos operativos:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ======= Helpers de compatibilidad y UI =======
  const getDetalle = (g: GastoOperativo) => g.detalle ?? "-";
  const getCategoriaNombre = (g: GastoOperativo) => {
    if (typeof g.categoria_gasto === 'object' && g.categoria_gasto?.nombre) {
      return g.categoria_gasto.nombre;
    }
    return "General";
  };
  const getNombreUsuario = (g: GastoOperativo) =>
    g.perfil_usuario?.primer_nombre && g.perfil_usuario?.primer_apellido
      ? `${g.perfil_usuario.primer_nombre} ${g.perfil_usuario.primer_apellido}`
      : "-";

  // ======= Validación del formulario =======
  const validateForm = () => {
    const errs: { [k: string]: string } = {};
    if (!form.numero_gasto || form.numero_gasto.trim().length < 3)
      errs.numero_gasto = "Ingrese un número de gasto (mín. 3)";
    if (!form.fecha_gasto) errs.fecha_gasto = "Seleccione una fecha";
    if (!form.id_categoria || Number.isNaN(Number(form.id_categoria)))
      errs.id_categoria = "Seleccione una categoría";
    if (!form.detalle || form.detalle.trim().length < 3)
      errs.detalle = "Detalle muy corto";
    const montoNum = Number(form.monto);
    if (Number.isNaN(montoNum) || montoNum <= 0)
      errs.monto = "El monto debe ser mayor a 0";
    if (!["compra", "gasto", "inversion"].includes(form.tipo_movimiento))
      errs.tipo_movimiento = "Tipo de movimiento inválido";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ======= Crear Gasto alineado a BD =======
  const createGasto = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);

      let comprobante_url: string | undefined;
      if (form.comprobante) {
        const fd = new FormData();
        fd.append("file", form.comprobante);
        const r = await api.post("/uploads/comprobantes/gasto", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        comprobante_url = r.data?.url as string;
      }

      const payload = {
        numero_gasto: form.numero_gasto.trim(),
        fecha_gasto: form.fecha_gasto,
        id_categoria: Number(form.id_categoria),
        detalle: form.detalle.trim(),
        monto: Number(form.monto),
        tipo_movimiento: form.tipo_movimiento,
        id_proveedor:
          form.id_proveedor === "" ? undefined : Number(form.id_proveedor),
        comprobante_url,
      };

      await gastosOperativosService.createGasto(payload);

      // Reset & refresh
      setDrawerOpen(false);
      setForm({
        numero_gasto: "",
        fecha_gasto: new Date().toISOString().slice(0, 10),
        id_categoria: "" as unknown as number | "",
        detalle: "",
        monto: "" as unknown as number | "",
        tipo_movimiento: "compra",
        id_proveedor: "" as unknown as number | "",
        comprobante: null,
      });
      await loadGastos();
    } catch (err: unknown) {
      console.error("Error creando gasto:", err);
      const msg = err instanceof Error ? err.message : "No se pudo crear el gasto";
      setFormErrors((prev) => ({ ...prev, _general: msg }));
    } finally {
      setSaving(false);
    }
  };

  // ======= Filtrado y paginación =======
  const filteredGastos = useMemo(() => {
    if (!searchTerm) return gastos;
    const q = searchTerm.toLowerCase();
    return gastos.filter((g) => {
      const det = getDetalle(g).toLowerCase();
      const cat = getCategoriaNombre(g).toLowerCase();
      const usr = getNombreUsuario(g).toLowerCase();
      const num = (g.numero_gasto ?? "").toLowerCase();
      return (
        det.includes(q) || cat.includes(q) || usr.includes(q) || num.includes(q)
      );
    });
  }, [gastos, searchTerm]);

  const paginatedGastos = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredGastos.slice(startIndex, startIndex + pageSize);
  }, [filteredGastos, currentPage]);

  const totalPages = Math.ceil(filteredGastos.length / pageSize);

  const totalGastos = useMemo(() => {
    return gastos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);
  }, [gastos]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <MdLocalDining className="text-green-600" />
            Gastos Operativos
          </h1>
          <p className="text-gray-600 mt-1">
            Registro y control de gastos operativos del negocio
          </p>
        </div>

        {/* Botón para abrir Drawer */}
        <div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 shadow"
          >
            + Registrar gasto
          </button>
        </div>
      </div>

      {/* Resumen de gastos */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-green-600 pl-4">
            <p className="text-sm text-gray-600">Total de Gastos</p>
            <p className="text-2xl font-bold text-gray-900">
              Q
              {totalGastos.toLocaleString("es-GT", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="border-l-4 border-blue-600 pl-4">
            <p className="text-sm text-gray-600">Total de Registros</p>
            <p className="text-2xl font-bold text-gray-900">{gastos.length}</p>
          </div>
          <div className="border-l-4 border-purple-600 pl-4">
            <p className="text-sm text-gray-600">Promedio por Gasto</p>
            <p className="text-2xl font-bold text-gray-900">
              Q
              {(gastos.length > 0
                ? totalGastos / gastos.length
                : 0
              ).toLocaleString("es-GT", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por No./Ref, detalle, categoría o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando gastos operativos...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <div className="text-red-600 mb-2">⚠️ Error</div>
            <p className="text-gray-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      No./Ref
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Detalle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Categoría
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Monto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGastos.length > 0 ? (
                    paginatedGastos.map((gasto) => (
                      <tr
                        key={gasto.id_gasto}
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 text-sm">
                          {gasto.numero_gasto ?? `#${gasto.id_gasto}`}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(gasto.fecha_gasto).toLocaleDateString(
                            "es-GT"
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getDetalle(gasto)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {getCategoriaNombre(gasto)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {gasto.tipo_movimiento ?? "gasto"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          Q
                          {Number(gasto.monto).toLocaleString("es-GT", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {getNombreUsuario(gasto)}
                        </td>
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
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {filteredGastos.length === 0 && searchTerm
                          ? "Sin resultados de búsqueda"
                          : "Sin gastos operativos registrados"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de visualización de gasto */}
      {modalOpen && selectedGasto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedGasto.numero_gasto
                  ? `Gasto ${selectedGasto.numero_gasto}`
                  : `Gasto Operativo #${selectedGasto.id_gasto}`}
              </h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedGasto(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-500">Fecha</div>
                <div className="font-medium">
                  {new Date(selectedGasto.fecha_gasto).toLocaleString("es-GT")}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Categoría</div>
                <div className="font-medium">
                  {getCategoriaNombre(selectedGasto)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Tipo</div>
                <div className="font-medium">
                  {selectedGasto.tipo_movimiento ?? "gasto"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Usuario</div>
                <div className="font-medium">{getNombreUsuario(selectedGasto)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Monto</div>
                <div className="font-bold text-green-600 text-lg">
                  Q
                  {Number(selectedGasto.monto).toLocaleString("es-GT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              {selectedGasto.numero_gasto && (
                <div>
                  <div className="text-sm text-gray-500">No./Ref</div>
                  <div className="font-medium">{selectedGasto.numero_gasto}</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Detalle</div>
              <div className="p-4 bg-gray-50 rounded-lg text-gray-800">
                {getDetalle(selectedGasto)}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedGasto(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer lateral derecho: crear nuevo gasto (ALINEADO A BD) */}
      {drawerOpen && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Registrar gasto operativo</h3>
                <p className="text-sm text-gray-500">
                  Completa los datos del gasto y guarda para registrarlo.
                </p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {formErrors._general && (
                <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                  {formErrors._general}
                </div>
              )}

              {/* No./Referencia */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">No. / Referencia</label>
                <input
                  type="text"
                  placeholder="G-2025-00123"
                  value={form.numero_gasto}
                  onChange={(e) => setForm((f) => ({ ...f, numero_gasto: e.target.value }))}
                  className={`h-11 rounded-lg border px-3 focus:outline-none focus:ring-2 ${
                    formErrors.numero_gasto ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"
                  }`}
                />
                {formErrors.numero_gasto && (
                  <span className="text-xs text-red-500">{formErrors.numero_gasto}</span>
                )}
              </div>

              {/* Fecha */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  value={form.fecha_gasto}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_gasto: e.target.value }))}
                  className={`h-11 rounded-lg border px-3 focus:outline-none focus:ring-2 ${
                    formErrors.fecha_gasto ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"
                  }`}
                />
                {formErrors.fecha_gasto && (
                  <span className="text-xs text-red-500">{formErrors.fecha_gasto}</span>
                )}
              </div>

              {/* Categoría (FK) */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Categoría</label>
                <select
                  value={form.id_categoria as number | ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      id_categoria: e.target.value === "" ? ("" as unknown as number) : Number(e.target.value),
                    }))
                  }
                  className={`h-11 rounded-lg border px-3 focus:outline-none focus:ring-2 ${
                    formErrors.id_categoria ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"
                  }`}
                >
                  <option value="">Seleccione…</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre} ({c.tipo_gasto})
                    </option>
                  ))}
                </select>
                {formErrors.id_categoria && (
                  <span className="text-xs text-red-500">{formErrors.id_categoria}</span>
                )}
              </div>

              {/* Tipo de movimiento (CHECK) */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Tipo de movimiento</label>
                <div className="flex gap-2 text-sm">
                  {(["compra", "gasto", "inversion"] as const).map((v) => (
                    <label
                      key={v}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${
                        form.tipo_movimiento === v ? "border-green-500 bg-green-50" : "border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo_movimiento"
                        value={v}
                        checked={form.tipo_movimiento === v}
                        onChange={() => setForm((f) => ({ ...f, tipo_movimiento: v }))}
                      />
                      <span className="capitalize">{v}</span>
                    </label>
                  ))}
                </div>
                {formErrors.tipo_movimiento && (
                  <span className="text-xs text-red-500">{formErrors.tipo_movimiento}</span>
                )}
              </div>

              {/* Proveedor (opcional) */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Proveedor (opcional)</label>
                <select
                  value={form.id_proveedor as number | ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      id_proveedor: e.target.value === "" ? ("" as unknown as number) : Number(e.target.value),
                    }))
                  }
                  className="h-11 rounded-lg border px-3 focus:outline-none focus:ring-2 border-gray-300 focus:ring-green-200"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>
                      {p.nombre_empresa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Monto (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.monto as number | ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      monto: e.target.value === "" ? ("" as unknown as number) : Number(e.target.value),
                    }))
                  }
                  className={`h-11 rounded-lg border px-3 focus:outline-none focus:ring-2 ${
                    formErrors.monto ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"
                  }`}
                />
                {formErrors.monto && (
                  <span className="text-xs text-red-500">{formErrors.monto}</span>
                )}
              </div>

              {/* Detalle */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Detalle</label>
                <textarea
                  rows={3}
                  placeholder="Describe el gasto (concepto, período, motivo)…"
                  value={form.detalle}
                  onChange={(e) => setForm((f) => ({ ...f, detalle: e.target.value }))}
                  className={`rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                    formErrors.detalle ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-200"
                  }`}
                />
                {formErrors.detalle && (
                  <span className="text-xs text-red-500">{formErrors.detalle}</span>
                )}
              </div>

              {/* Comprobante (opcional) */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Comprobante (opcional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setForm((f) => ({ ...f, comprobante: e.target.files?.[0] ?? null }))}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 hover:file:bg-gray-200"
                />
                {form.comprobante && (
                  <span className="text-xs text-gray-500">
                    {form.comprobante.name} · {(form.comprobante.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Conserva el comprobante físico o digital para auditoría.
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  onClick={() =>
                    setForm({
                      numero_gasto: "",
                      fecha_gasto: new Date().toISOString().slice(0, 10),
                      id_categoria: "" as unknown as number | "",
                      detalle: "",
                      monto: "" as unknown as number | "",
                      tipo_movimiento: "compra",
                      id_proveedor: "" as unknown as number | "",
                      comprobante: null,
                    })
                  }
                  disabled={saving}
                >
                  Limpiar
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-white ${
                    saving ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
                  } shadow`}
                  onClick={createGasto}
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Guardar gasto"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
