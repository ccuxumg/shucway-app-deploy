import { useEffect, useState, useMemo } from "react";
import { PiPackageBold, PiEyeBold } from "react-icons/pi";
import { useNavigate } from 'react-router-dom';
import { api } from "../../../../api/apiClient";

/* =============== Tipos =============== */
type RecepcionMercaderia = {
  id_recepcion: number;
  id_orden: number;
  fecha_recepcion: string;
  numero_factura?: string;
  numero_orden?: string; // Agregado para compatibilidad directa
  perfil_usuario?: {
    primer_nombre: string;
    primer_apellido: string;
  };
  orden_compra?: {
    numero_orden: string;
    proveedor?: {
      nombre: string;
      nombre_empresa?: string;
    };
  };
  detalle_recepcion_mercaderia?: Array<{
    id_detalle: number;
    id_recepcion?: number;
    id_detalle_orden?: number;
    cantidad_recibida?: number;
    cantidad_aceptada?: number;
    id_lote?: number;
    id_presentacion?: number;
    insumo_presentacion?: {
      id_insumo: number;
      insumo?: {
        nombre_insumo: string;
      };
    };
    lote_insumo?: {
      id_insumo: number;
      insumo?: {
        nombre_insumo: string;
      };
    };
  }>;
  _count?: {
    detalle_recepcion_mercaderia: number;
  };
};

/* =============== Componente Principal =============== */
export default function RecepcionMercaderia() {
  const [recepciones, setRecepciones] = useState<RecepcionMercaderia[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecepcion, setSelectedRecepcion] = useState<RecepcionMercaderia | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadRecepciones();
  }, []);

  const loadRecepciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/inventario/recepciones-mercaderia");
      setRecepciones(response.data?.data || []);
    } catch (err: unknown) {
      console.error("Error loading recepciones:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado y paginación
  const filteredRecepciones = useMemo(() => {
    const recepcionesArray = Array.isArray(recepciones) ? recepciones : [];
    if (!searchTerm) return recepcionesArray;
    return recepcionesArray.filter((r) =>
      r.numero_factura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.numero_orden || r.orden_compra?.numero_orden)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orden_compra?.proveedor?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recepciones, searchTerm]);

  const paginatedRecepciones = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRecepciones.slice(startIndex, startIndex + pageSize);
  }, [filteredRecepciones, currentPage]);

  const totalPages = Math.ceil((Array.isArray(filteredRecepciones) ? filteredRecepciones.length : 0) / pageSize);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <PiPackageBold className="text-blue-600" />
            Recepción de Mercadería
          </h1>
          <p className="text-gray-600 mt-1">
            Historial de recepciones de mercadería y control de calidad
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50 text-gray-700 font-medium">
            ← Regresar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por factura, orden o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 rounded-lg border border-gray-300 px-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          {/* Nota: El botón 'Actualizar' fue removido por petición del usuario. La recarga se hará automáticamente o vía acciones específicas (Ver/Editar). */}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando recepciones...</p>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Factura</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Orden</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Proveedor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRecepciones.map((recepcion) => (
                    <tr key={recepcion.id_recepcion} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{recepcion.id_recepcion}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(recepcion.fecha_recepcion).toLocaleDateString('es-GT')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {recepcion.numero_factura || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {recepcion.numero_orden || recepcion.orden_compra?.numero_orden || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {recepcion.orden_compra?.proveedor?.nombre || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {recepcion.perfil_usuario
                          ? `${recepcion.perfil_usuario.primer_nombre} ${recepcion.perfil_usuario.primer_apellido}`
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {recepcion._count?.detalle_recepcion_mercaderia || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedRecepcion(recepcion); setModalOpen(true); }}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            title="Ver detalles"
                          >
                            <PiEyeBold size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedRecepciones.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <PiPackageBold className="text-4xl text-gray-300" />
                          <p>No hay recepciones registradas</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredRecepciones.length)} de {filteredRecepciones.length} recepciones
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de visualización de recepción */}
      {modalOpen && selectedRecepcion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recepción #{selectedRecepcion.id_recepcion}</h2>
              <button onClick={() => { setModalOpen(false); setSelectedRecepcion(null); }} className="text-gray-500 hover:text-gray-700">Cerrar</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Fecha</div>
                <div className="font-medium">{new Date(selectedRecepcion.fecha_recepcion).toLocaleString('es-GT')}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Factura</div>
                <div className="font-medium">{selectedRecepcion.numero_factura || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Orden</div>
                <div className="font-medium">{selectedRecepcion.numero_orden || selectedRecepcion.orden_compra?.numero_orden || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Proveedor</div>
                <div className="font-medium">{selectedRecepcion.orden_compra?.proveedor?.nombre || '-'}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Detalle</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">ID Detalle</th>
                      <th className="px-4 py-2 text-left">Insumo</th>
                      <th className="px-4 py-2 text-left">Cantidad recibida</th>
                      <th className="px-4 py-2 text-left">Cantidad aceptada</th>
                      <th className="px-4 py-2 text-left">Lote</th>
                      <th className="px-4 py-2 text-left">Presentación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRecepcion.detalle_recepcion_mercaderia?.map(d => (
                      <tr key={d.id_detalle} className="border-t">
                        <td className="px-4 py-2">#{d.id_detalle}</td>
                        <td className="px-4 py-2">{d.lote_insumo?.insumo?.nombre_insumo || d.insumo_presentacion?.insumo?.nombre_insumo || '-'}</td>
                        <td className="px-4 py-2">{d.cantidad_recibida ?? '-'}</td>
                        <td className="px-4 py-2">{d.cantidad_aceptada ?? '-'}</td>
                        <td className="px-4 py-2">{d.id_lote ?? '-'}</td>
                        <td className="px-4 py-2">{d.id_presentacion ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}