import React from 'react';
import { useNavigate } from 'react-router-dom';
import mantenimientoImg from '/img/mantenimiento.jpg';
import consultasImg from '/img/sql.jpg';
import backupImg from '/img/Backup.jpg';

const Configuracion: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      name: 'Mantenimiento',
      img: mantenimientoImg,
      route: '/configuracion/mantenimiento',
      description: 'Gestionar tablas de la base de datos'
    },
    {
      name: 'Consultas SQL',
      img: consultasImg,
      route: '/configuracion/consultas-sql',
      description: 'Ejecutar consultas personalizadas'
    },
    {
      name: 'Backup',
      img: backupImg,
      route: '/configuracion/backup',
      description: 'Generar y gestionar backups'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="w-full max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Configuración y Mantenimiento</h1>
        <p className="text-sm text-gray-600 mt-1">Herramientas avanzadas para la gestión del sistema</p>
      </header>

      <section className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => (
          <div
            key={option.name}
            role="button"
            tabIndex={0}
            onClick={() => navigate(option.route)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(option.route)}
            className="relative rounded-2xl shadow-md cursor-pointer group overflow-hidden h-48 flex items-end bg-gradient-to-tr from-gray-500 to-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          >
            <img
              src={option.img}
              alt={option.name}
              className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-60 transition duration-300"
            />
            <div className="relative z-10 p-5 w-full flex flex-col items-start">
              <span className="text-xl md:text-2xl font-semibold text-white drop-shadow-lg mb-1">{option.name}</span>
              <span className="text-xs bg-white/80 text-gray-700 px-2 py-1 rounded">{option.description}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Configuracion;
