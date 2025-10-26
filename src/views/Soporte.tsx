import React from 'react';

const teamMembers = [
  {
    name: 'Andrea Sofia Chafolla Mendez',
    carne: '5090-22-216',
    phone: '+502 3052 6004'
  },
  {
    name: 'Carmi Emileny Cuxum Gonzalez',
    carne: '5090-22-3686',
    phone: '+502 3031 8249'
  },
  {
    name: 'Josué Daniel Figueroa Herrera',
    carne: '5090-22-36',
    phone: '+502 5625 2922'
  },
  {
    name: 'Dilan René Escobar Rodríguez',
    carne: '5090-22-1010',
    phone: '+502 5748 1467'
  },
  {
    name: 'Bartola Angelica Grave Barrera',
    carne: '5090-22-7985',
    phone: '+502 3652 9993'
  }
];

const Soporte: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gray-50 p-6">
      {/* Logo en la esquina superior derecha */}
      <div className="absolute top-4 right-4">
        <img
          src="/image/other/logo-umg.png"
          alt="Logo Universidad Mariano Gálvez"
          className="w-24 h-24 object-contain"
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Soporte Técnico
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 text-center">
            INTEGRANTES – GRUPO NO.5
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Carné
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    Teléfono
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map((member, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {member.carne}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {member.phone}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Soporte;