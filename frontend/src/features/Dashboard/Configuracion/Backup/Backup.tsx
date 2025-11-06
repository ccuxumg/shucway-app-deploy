import React, { useState, useEffect, useCallback } from 'react';
import { message, Button, Modal } from 'antd';
import { DownloadOutlined, InfoCircleOutlined, DeleteOutlined, CheckCircleOutlined, SettingOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Estilos CSS para la tabla similar al inventario
const tableStyles = `
.inv-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(16,24,40,0.06);
}

.inv-table th, .inv-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #f1f3f4;
  font-size: 0.9rem;
}

.inv-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #12443D;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.inv-table tbody tr:hover {
  background: #f8f9fa;
}

.inv-table tbody tr:last-child td {
  border-bottom: none;
}
`;

interface BackupRecord {
  id: string;
  date: string;
  size: string;
  status: string;
  type: 'full' | 'incremental';
}

interface IncrementalBackupMetadata {
  generatedAt: string;
  filename?: string;
  ventasCount: number;
  detallesCount: number;
  insumosCount: number;
  totalVentas?: number;
  totalStock?: number;
  note?: string;
}

interface BackupDatasets {
  ventas?: unknown[];
  insumos?: unknown[];
}

interface BackupInfoResponse {
  success?: boolean;
  message?: string;
  recommendation?: string;
  availableOptions?: string[];
  limitations?: Record<string, string>;
  error?: string;
  details?: string;
  metadata?: IncrementalBackupMetadata;
  datasets?: BackupDatasets;
}

type IncrementalBackupPayload = BackupInfoResponse & { datasets?: Required<BackupDatasets> };

const DEFAULT_INCREMENTAL_MESSAGE = 'Genera un backup incremental para exportar ventas e insumos con su stock actual.';

const formatDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const MAX_BACKUPS = 5;

const Backup: React.FC = () => {
  const navigate = useNavigate();

  const apiBaseUrl = ((import.meta.env.VITE_API_URL as string | undefined) || '/api').replace(/\/$/, '');
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
  const supabaseProjectRef = (() => {
    try {
      const host = new URL(supabaseUrl).hostname;
      return host.split('.')[0] || '';
    } catch {
      return '';
    }
  })();
  const supabaseDashboardUrl = supabaseProjectRef
    ? `https://supabase.com/dashboard/project/${supabaseProjectRef}/sql`
    : 'https://supabase.com/dashboard';

  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState<{ full: boolean; incremental: boolean }>({
    full: false,
    incremental: false,
  });
  const [supportInfo, setSupportInfo] = useState<BackupInfoResponse | null>(null);

  const loadStoredBackups = useCallback(() => {
    try {
      const storedBackups = localStorage.getItem('backups');
      if (!storedBackups) return;
      const parsed: BackupRecord[] = JSON.parse(storedBackups);
      setBackups(parsed.slice(0, MAX_BACKUPS));
    } catch (error) {
      console.warn('No se pudo leer el historial de backups locales:', error);
      localStorage.removeItem('backups');
    }
  }, []);

  const fetchSupportInfo = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/backup/incremental?summary=true`);
      if (!response.ok) return;
      const data: BackupInfoResponse = await response.json();
      setSupportInfo({
        success: data.success,
        message: data.message,
        metadata: data.metadata,
        recommendation: data.recommendation,
        availableOptions: data.availableOptions,
        limitations: data.limitations,
      });
    } catch (error) {
      console.error('Error cargando la información de soporte de backups:', error);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    loadStoredBackups();
    void fetchSupportInfo();
  }, [loadStoredBackups, fetchSupportInfo]);

  const downloadBackup = useCallback(
    async (type: 'full' | 'incremental') => {
      setLoading((prev) => ({ ...prev, [type]: true }));

      try {
        const endpoint = `${apiBaseUrl}/backup/${type === 'full' ? 'full' : 'incremental'}`;
        const response = await fetch(endpoint);
        const contentDisposition = response.headers.get('Content-Disposition');

        if (!response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorPayload: BackupInfoResponse = await response.json();
            setSupportInfo((prev) => ({ ...(prev ?? {}), ...errorPayload }));

            Modal.info({
              title:
                errorPayload.error ||
                `Backup ${type === 'full' ? 'completo' : 'incremental'} no disponible`,
              okText: 'Entendido',
              content: (
                <div className="space-y-2">
                  {errorPayload.message && <p>{errorPayload.message}</p>}
                  {errorPayload.details && (
                    <p className="text-sm text-gray-600">{errorPayload.details}</p>
                  )}
                  {type === 'full' ? (
                    <>
                      <p className="text-sm text-gray-600">
                        Puedes generar un respaldo manual desde Supabase:
                      </p>
                      <a
                        href={supabaseDashboardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 underline"
                      >
                        {supabaseDashboardUrl}
                      </a>
                    </>
                  ) : null}
                </div>
              ),
            });
            return;
          }

          throw new Error(`Error HTTP ${response.status}`);
        }

        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-');
        let filename =
          type === 'incremental'
            ? `backup-${type}-${timestamp}.json`
            : `backup-${type}-${now.toISOString().split('T')[0]}.sql`;

        let blob: Blob;

        if (type === 'incremental') {
          const data: IncrementalBackupPayload = await response.json();
          const jsonString = JSON.stringify(data, null, 2);
          blob = new Blob([jsonString], { type: 'application/json' });

          if (data.metadata) {
            filename = data.metadata.filename ?? filename;
            setSupportInfo({
              success: data.success,
              message: data.message,
              metadata: data.metadata,
            });
          } else {
            setSupportInfo({ success: data.success, message: data.message });
          }

          if (data.metadata) {
            Modal.success({
              title: 'Backup incremental generado',
              okText: 'Entendido',
              content: (
                <div className="space-y-2 text-sm text-gray-700">
                  <p>Generado: {formatDateTime(data.metadata.generatedAt)}</p>
                  <p>Ventas exportadas: {data.metadata.ventasCount}</p>
                  <p>Detalles de venta exportados: {data.metadata.detallesCount}</p>
                  <p>Insumos exportados: {data.metadata.insumosCount}</p>
                  {typeof data.metadata.totalVentas === 'number' && (
                    <p>
                      Total vendido:
                      {' '}
                      {new Intl.NumberFormat('es-BO', {
                        style: 'currency',
                        currency: 'BOB',
                      }).format(data.metadata.totalVentas)}
                    </p>
                  )}
                  {typeof data.metadata.totalStock === 'number' && (
                    <p>Stock total acumulado: {data.metadata.totalStock}</p>
                  )}
                  {data.metadata.note && <p>{data.metadata.note}</p>}
                </div>
              ),
            });
          }
        } else {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorPayload: BackupInfoResponse = await response.json();
            setSupportInfo((prev) => ({ ...(prev ?? {}), ...errorPayload }));

            Modal.info({
              title: errorPayload.error || 'Backup completo no disponible',
              okText: 'Entendido',
              content: (
                <div className="space-y-2">
                  {errorPayload.message && <p>{errorPayload.message}</p>}
                  {errorPayload.details && (
                    <p className="text-sm text-gray-600">{errorPayload.details}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Puedes generar un respaldo manual desde Supabase:
                  </p>
                  <a
                    href={supabaseDashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 underline"
                  >
                    {supabaseDashboardUrl}
                  </a>
                </div>
              ),
            });
            return;
          }

          blob = await response.blob();
        }

        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="(.+)"/);
          if (matches?.[1]) {
            filename = matches[1];
          }
        }

        if (!blob.size) {
          message.warning('El backup generado no contiene datos.');
          return;
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        const backupRecord: BackupRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
          status: 'Completado',
          type,
        };

        setBackups((prev) => {
          const updated = [backupRecord, ...prev].slice(0, MAX_BACKUPS);
          localStorage.setItem('backups', JSON.stringify(updated));
          return updated;
        });
        message.success(
          type === 'incremental'
            ? 'Backup incremental generado correctamente.'
            : 'Backup completo generado correctamente.'
        );
      } catch (error) {
        console.error(`Error descargando backup ${type}:`, error);
        message.error(
          `Error al descargar backup ${type}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
      } finally {
        setLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [apiBaseUrl, supabaseDashboardUrl]
  );

  const deleteBackup = useCallback((backupId: string) => {
    Modal.confirm({
      title: '¿Eliminar backup?',
      content: 'Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este backup?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        setBackups((prev) => {
          const updated = prev.filter((backup) => backup.id !== backupId);
          localStorage.setItem('backups', JSON.stringify(updated));
          return updated;
        });
        message.success('Backup eliminado exitosamente');
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <style>{tableStyles}</style>
      <div className="w-full max-w-full mx-auto mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Backup de Base de Datos</h1>
          <p className="text-base text-gray-600">
            Genera y gestiona backups completos de la base de datos de forma segura
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50 text-gray-700 font-medium"
          >
            ← Regresar
          </button>
        </div>
      </div>

      <div className="w-full max-w-full mx-auto grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-4 border border-blue-100">
            <div className="flex items-center mb-3">
              <SettingOutlined className="text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Configuración</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center p-2 bg-green-50 rounded-md border border-green-200">
                <CheckCircleOutlined className="text-green-600 mr-2" />
                <div>
                  <div className="text-green-700 font-medium text-sm">SQL Legible</div>
                  <p className="text-xs text-gray-600">Formato recomendado para revisión manual</p>
                </div>
              </div>
              <div className="flex items-center p-2 bg-orange-50 rounded-md border border-orange-200">
                <FolderOpenOutlined className="text-orange-600 mr-2" />
                <div>
                  <div className="text-orange-700 font-medium text-sm">
                    {Math.max(0, MAX_BACKUPS - backups.length)} backups disponibles
                  </div>
                  <p className="text-xs text-gray-600">Límite: {MAX_BACKUPS} backups locales</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Generar Nuevo Backup</h2>
              <p className="text-gray-600">Crea un respaldo completo de tu base de datos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex-1">
                <Button
                  type="primary"
                  onClick={() => void downloadBackup('full')}
                  disabled={loading.full}
                  icon={<DownloadOutlined />}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-base font-bold disabled:opacity-50 w-full h-auto"
                  size="large"
                >
                  {loading.full ? 'Generando...' : 'BACKUP COMPLETO'}
                </Button>
                <p className="text-xs text-gray-600 mt-3">Archivo SQL con estructura y datos completos</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex-1">
                <Button
                  onClick={() => void downloadBackup('incremental')}
                  disabled={loading.incremental}
                  icon={<InfoCircleOutlined />}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-bold disabled:opacity-50 w-full h-auto"
                  size="large"
                >
                  {loading.incremental ? 'Procesando...' : 'DISPONIBILIDAD INCREMENTAL'}
                </Button>
                <p className="text-xs text-gray-600 mt-3">
                  Consulta la disponibilidad según tu plan de Supabase
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Historial de Backups</h2>
              <p className="text-gray-600">Revisa y descarga backups anteriores</p>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="inv-table w-full">
                <thead>
                  <tr>
                    <th className="min-w-[200px]">Fecha</th>
                    <th className="min-w-[100px]">Tipo</th>
                    <th className="min-w-[100px]">Tamaño</th>
                    <th className="min-w-[120px]">Estado</th>
                    <th className="min-w-[120px]">Acciones</th>
                    <th className="min-w-[80px]">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length ? (
                    backups.map((backup) => (
                      <tr key={backup.id}>
                        <td>{new Date(backup.date).toLocaleString()}</td>
                        <td>{backup.type === 'full' ? 'Completo' : 'Incremental'}</td>
                        <td>{backup.size}</td>
                        <td>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              backup.status === 'Completado'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {backup.status}
                          </span>
                        </td>
                        <td>
                          <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => void downloadBackup(backup.type)}
                            className="bg-teal-600 hover:bg-teal-700 text-white border-0 font-bold uppercase text-xs px-3 py-1 rounded-md flex items-center gap-1 transition-colors"
                          >
                            {backup.type === 'full' ? 'DESCARGAR' : 'DETALLE'}
                          </Button>
                        </td>
                        <td>
                          <Button
                            size="middle"
                            icon={<DeleteOutlined style={{ fontSize: '16px' }} />}
                            danger
                            onClick={() => deleteBackup(backup.id)}
                            className="border-0 text-xs px-3 py-2 rounded-md flex items-center gap-1 transition-colors hover:bg-red-50"
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-sm text-gray-500 text-center py-4">
                        No hay backups generados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full mx-auto mt-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <InfoCircleOutlined className="text-yellow-600 mt-1 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-yellow-700 text-sm">
                {supportInfo?.metadata
                  ? `Último resumen generado ${formatDateTime(supportInfo.metadata.generatedAt)}`
                  : supportInfo?.message || DEFAULT_INCREMENTAL_MESSAGE}
              </p>
              {supportInfo?.metadata ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-yellow-700">
                  <div>Ventas exportadas: {supportInfo.metadata.ventasCount}</div>
                  <div>Detalles registrados: {supportInfo.metadata.detallesCount}</div>
                  <div>Insumos exportados: {supportInfo.metadata.insumosCount}</div>
                  {typeof supportInfo.metadata.totalStock === 'number' && (
                    <div>Stock total acumulado: {supportInfo.metadata.totalStock}</div>
                  )}
                  {typeof supportInfo.metadata.totalVentas === 'number' && (
                    <div>
                      Total vendido:
                      {' '}
                      {new Intl.NumberFormat('es-BO', {
                        style: 'currency',
                        currency: 'BOB',
                      }).format(supportInfo.metadata.totalVentas)}
                    </div>
                  )}
                </div>
              ) : null}
              {supportInfo?.metadata?.note && (
                <p className="text-sm text-yellow-700">{supportInfo.metadata.note}</p>
              )}
              {supportInfo?.message && supportInfo.metadata && (
                <p className="text-sm text-yellow-700">{supportInfo.message}</p>
              )}
              {!supportInfo?.metadata && supportInfo?.recommendation && (
                <p className="text-sm text-yellow-700">Recomendación: {supportInfo.recommendation}</p>
              )}
              {!supportInfo?.metadata && supportInfo?.limitations?.freeTier && (
                <p className="text-sm text-yellow-700">
                  Limitación del plan: {supportInfo.limitations.freeTier}
                </p>
              )}
              <a
                href={supabaseDashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline text-sm"
              >
                Abrir panel de SQL en Supabase
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backup;
