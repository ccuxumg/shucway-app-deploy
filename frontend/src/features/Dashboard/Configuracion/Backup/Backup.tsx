import React, { useState, useEffect } from 'react';
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

const Backup: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState<{ full: boolean; incremental: boolean }>({
    full: false,
    incremental: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar backups desde localStorage
    const storedBackups = localStorage.getItem('backups');
    if (storedBackups) {
      setBackups(JSON.parse(storedBackups));
    }
  }, []);

  const downloadBackup = async (type: 'full' | 'incremental') => {
    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      const endpoint = type === 'full' ? '/api/backup/full' : '/api/backup/incremental';

      if (type === 'incremental') {
        // Para incremental, solo mostramos información
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.success) {
          message.info(data.message);
        } else {
          message.error(data.error || 'Error al procesar backup incremental');
        }
        return;
      }

      // Para backup completo, descargamos el archivo
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Obtener el nombre del archivo desde los headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `backup-${type}-${new Date().toISOString().split('T')[0]}.sql`;

      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches) {
          filename = matches[1];
        }
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Registrar en historial
      const backupRecord: BackupRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'Completado',
        type
      };

      const newBackups = [backupRecord, ...backups];
      setBackups(newBackups);
      localStorage.setItem('backups', JSON.stringify(newBackups));

      message.success(`Backup ${type === 'full' ? 'completo' : 'incremental'} descargado exitosamente`);

    } catch (error) {
      console.error(`Error descargando backup ${type}:`, error);
      message.error(`Error al descargar backup ${type}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const deleteBackup = (backupId: string) => {
    Modal.confirm({
      title: '¿Eliminar backup?',
      content: 'Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este backup?',
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        const newBackups = backups.filter(backup => backup.id !== backupId);
        setBackups(newBackups);
        localStorage.setItem('backups', JSON.stringify(newBackups));
        message.success('Backup eliminado exitosamente');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <style>{tableStyles}</style>
      <div className="w-full max-w-full mx-auto mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Backup de Base de Datos</h1>
          <p className="text-base text-gray-600">Genera y gestiona backups completos de la base de datos de forma segura</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50 text-gray-700 font-medium">
            ← Regresar
          </button>
        </div>
      </div>

      <div className="w-full max-w-full mx-auto grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Sidebar con información - más compacto */}
        <div className="xl:col-span-1 space-y-4">

          {/* Configuración de Backup */}
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
                  <div className="text-orange-700 font-medium text-sm"> {Math.max(0, 5 - backups.length)} backups disponibles</div>
                  <p className="text-xs text-gray-600">Límite: 5 backups locales</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Contenido principal - ocupa más espacio */}
        <div className="xl:col-span-4 space-y-6">

          {/* Generar Nuevo Backup */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Generar Nuevo Backup</h2>
              <p className="text-gray-600">Crea un respaldo completo de tu base de datos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex-1">
                <Button
                  type="primary"
                  onClick={() => downloadBackup('full')}
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
                  onClick={() => downloadBackup('incremental')}
                  disabled={loading.incremental}
                  icon={<InfoCircleOutlined />}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-base font-bold disabled:opacity-50 w-full h-auto"
                  size="large"
                >
                  {loading.incremental ? 'Procesando...' : 'INFO INCREMENTAL'}
                </Button>
                <p className="text-xs text-gray-600 mt-3">No disponible en plan gratuito</p>
              </div>
            </div>
          </div>

          {/* Historial de Backups */}
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
                {backups.length ? backups.map((backup) => (
                  <tr key={backup.id}>
                    <td>{new Date(backup.date).toLocaleString()}</td>
                    <td>{backup.type === 'full' ? 'Completo' : 'Incremental'}</td>
                    <td>{backup.size}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        backup.status === 'Completado' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {backup.status}
                      </span>
                    </td>
                    <td>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadBackup(backup.type)}
                        className="bg-teal-600 hover:bg-teal-700 text-white border-0 font-bold uppercase text-xs px-3 py-1 rounded-md flex items-center gap-1 transition-colors"
                      >
                        DESCARGAR
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
                )) : (
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

      {/* Nota informativa al final */}
      <div className="w-full max-w-full mx-auto mt-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <InfoCircleOutlined className="text-yellow-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="text-yellow-700 text-sm">
                Los backups incrementales no están disponibles en el plan gratuito de Supabase.
                Configura storage externo para backups automáticos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backup;
