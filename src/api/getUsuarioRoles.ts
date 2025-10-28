import api from './apiClient';

export const getUsuarioRoles = async (id_perfil: string) => {
  // Obtener perfil y roles por separado desde el backend
  const filters = encodeURIComponent(JSON.stringify({ id_perfil }));
  const resp = await api.get(`/dashboard/table-data/perfil_usuario?filters=${filters}`);
  if (!resp || resp.status >= 400) throw new Error('Error al obtener usuario');
  const js = resp.data || {};
  const rows = js.data || [];
  if (!rows.length) return [];
  const perfil = rows[0];
  // Obtener rol por id_rol
  const roleId = perfil.id_rol;
  if (!roleId) return [];
  const rresp = await api.get(`/dashboard/table-data/rol_usuario?filters=${encodeURIComponent(JSON.stringify({ id_rol: roleId }))}`);
  if (!rresp || rresp.status >= 400) return [];
  const rjs = rresp.data || {};
  const rrows = rjs.data || [];
  return rrows;
};
