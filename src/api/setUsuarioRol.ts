import api from './apiClient';

export const setUsuarioRol = async (id_perfil: string, id_rol: number | null) => {
  try {
    if (!id_rol) {
      // buscar id_rol de 'cliente' en backend
      const rresp = await api.get(`/dashboard/table-data/rol_usuario?filters=${encodeURIComponent(JSON.stringify({ nombre_rol: 'cliente' }))}`);
      if (!rresp || rresp.status >= 400) throw new Error('Error al obtener rol por defecto');
      const rjs = rresp.data || {};
      const rrows = rjs.data || [];
      const clienteRol = rrows[0];
      if (clienteRol && clienteRol.id_rol) {
        const resp = await api.put(`/dashboard/table-data/perfil_usuario/${encodeURIComponent(String(id_perfil))}`, { id_rol: clienteRol.id_rol });
        if (!resp || resp.status >= 400) throw new Error('Error al setear rol por defecto');
        return resp.data?.data ?? null;
      }
      return null;
    }

    // Actualizar usando backend
    const resp = await api.put(`/dashboard/table-data/perfil_usuario/${encodeURIComponent(String(id_perfil))}`, { id_rol });
    if (!resp || resp.status >= 400) throw new Error('Error al actualizar rol');
    return resp.data?.data ?? null;
  } catch (error) {
    console.error('Error en setUsuarioRol:', error);
    throw error;
  }
};
