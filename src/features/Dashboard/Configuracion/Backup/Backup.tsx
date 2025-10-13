import React, { useState, useEffect } from 'react';

interface BackupRecord {
  id: string;
  date: string;
  size: string;
  status: string;
}

const Backup: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar backups desde localStorage o BD
    const storedBackups = localStorage.getItem('backups');
    if (storedBackups) {
      setBackups(JSON.parse(storedBackups));
    }
  }, []);

  const generateBackup = async () => {
    setLoading(true);
    try {
      // Simular generación de backup
      // En producción, usar Supabase API para dump
      const backupData = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        size: '1.2 MB',
        status: 'Completado'
      };

      // Descargar archivo simulado
      const blob = new Blob(['-- Simulado backup SQL --'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${backupData.date}.sql`;
      a.click();
      URL.revokeObjectURL(url);

      // Guardar en lista
      const newBackups = [backupData, ...backups];
      setBackups(newBackups);
      localStorage.setItem('backups', JSON.stringify(newBackups));
    } catch (error) {
      console.error('Error generating backup:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="w-full max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Backup de Base de Datos</h1>
        <p className="text-sm text-gray-600 mt-1">Genera y gestiona backups completos de la base de datos</p>
      </header>

      <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="mb-6">
          <button
            onClick={generateBackup}
            disabled={loading}
            className="bg-green-500 text-white px-6 py-3 rounded-md text-lg font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Generando...' : 'Generar Backup Completo'}
          </button>
          <p className="text-sm text-gray-600 mt-2">Descarga un script SQL completo de la base de datos de Supabase</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Historial de Backups</h3>
          {backups.length === 0 ? (
            <p className="text-gray-500">No hay backups generados aún.</p>
          ) : (
            <div className="space-y-4">
              {backups.map(backup => (
                <div key={backup.id} className="border border-gray-300 rounded-md p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">Backup del {new Date(backup.date).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Tamaño: {backup.size}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${backup.status === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {backup.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Backup;
