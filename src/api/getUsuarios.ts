
import { supabase } from "./supabaseClient";
import { IFilters } from "../types";

export const getUsuarios = async (
  currentPage: number = 1,
  pageSize: number = 10,
  filters: IFilters | null = null,
  searchValue: string = ""
) => {
  try {
    console.log('🔍 Consultando usuarios...');

    // Verificar sesión
    const { data: authData } = await supabase.auth.getSession();

    if (!authData.session) {
      console.error('❌ No hay sesión activa');
      throw new Error('No hay sesión activa');
    }

    // Usar pageSize y currentPage para paginar
    const limit = pageSize || 10;
    const offset = (currentPage > 0 ? currentPage - 1 : 0) * limit;

    // Consultar directamente desde tablas base para evitar problemas de permisos con vistas
    console.log('🔁 Consultando desde tablas base (perfil_usuario + usuario_rol)');

    // Construir consulta base para perfiles
    let perfilQuery = supabase
      .from('perfil_usuario')
      .select('*', { count: 'exact' })
      .order('fecha_registro', { ascending: false });

    // Aplicar filtros si existen
    if (filters) {
      if (filters.estado) {
        perfilQuery = perfilQuery.eq('estado', filters.estado as string);
      }
      // Para fecha_nacimiento, aplicar filtro si existe
      if (filters.fecha_nacimiento && filters.fecha_nacimiento[0] && filters.fecha_nacimiento[1]) {
        const startDate = filters.fecha_nacimiento[0].format('YYYY-MM-DD');
        const endDate = filters.fecha_nacimiento[1].format('YYYY-MM-DD');
        perfilQuery = perfilQuery.gte('fecha_nacimiento', startDate).lte('fecha_nacimiento', endDate);
      }
      // Para teléfono, aplicar filtro si existe
      if (filters.telefono) {
        perfilQuery = perfilQuery.ilike('telefono', `%${filters.telefono}%`);
      }
    }

    // Aplicar búsqueda por nombre o apellido
    if (searchValue && searchValue.trim().length > 0) {
      perfilQuery = perfilQuery.or(`primer_nombre.ilike.%${searchValue}%,primer_apellido.ilike.%${searchValue}%,username.ilike.%${searchValue}%`);
    }

    // Obtener perfiles paginados
    const { data: perfiles, error: perfilesError, count } = await perfilQuery.range(offset, offset + limit - 1);

    if (perfilesError) {
      console.error('❌ Error al obtener perfiles:', perfilesError.message);
      throw perfilesError;
    }

    // Si no hay perfiles, retornar vacío
    if (!perfiles || perfiles.length === 0) {
      return {
        data: [],
        count: 0,
      };
    }

    // Obtener IDs de perfiles para consultar roles
    const ids = perfiles.map((p) => p.id_perfil).filter(Boolean);

    // Obtener roles para estos perfiles
    const rolesMap: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: rolesData, error: rolesError } = await supabase
        .from('usuario_rol')
        .select(`
          id_perfil,
          rol_usuario!inner(nombre)
        `)
        .in('id_perfil', ids);

      if (!rolesError && rolesData) {
        rolesData.forEach((r: { id_perfil: string; rol_usuario: { nombre: string }[] }) => {
          const roleName = r.rol_usuario?.[0]?.nombre || 'Sin rol';
          const idPerfil = r.id_perfil;
          if (idPerfil) {
            rolesMap[idPerfil] = rolesMap[idPerfil]
              ? `${rolesMap[idPerfil]}, ${roleName}`
              : roleName;
          }
        });
      }
    }

    // Combinar perfiles con roles
    const perfilesConRoles = perfiles.map((perfil) => ({
      ...perfil,
      roles: rolesMap[perfil.id_perfil] || 'Sin rol',
      // Agregar campos adicionales para compatibilidad
      email: perfil.email || null,
    }));

    console.log(`✅ Consulta exitosa: ${perfilesConRoles.length} usuarios obtenidos`);

    return {
      data: perfilesConRoles,
      count: count || perfilesConRoles.length,
    };
  } catch (error) {
    console.error('💥 Error en getUsuarios:', error);
    throw error;
  }
};
