import { supabase } from "./supabaseClient";
import { IFilters } from "../types";

interface RolUsuarioJoin {
  id_rol: number;
  rol_usuario: {
    nombre: string;
    nivel_permisos: number;
  };
}

export const getUsuarios = async (
  currentPage: number,
  pageSize: number,
  filters: IFilters,
  searchValue: string
) => {
  try {
    // Verificar sesión y obtener información del usuario
    const { data: authData } = await supabase.auth.getSession();
    
    if (!authData.session) {
      console.error('No hay sesión activa');
      throw new Error('No hay sesión activa');
    }

    // Obtener el rol del usuario actual
    const { data: roleData, error: roleError } = await supabase
      .from('perfil_usuario')
      .select(`
        id_rol,
        rol_usuario!inner(
          nombre,
          nivel_permisos
        )
      `)
      .eq('email', authData.session.user.email)
      .single();

    if (roleError) {
      console.error('Error al obtener el rol:', roleError);
      throw new Error('Error al verificar permisos');
    }

    console.log('Rol del usuario:', roleData);

    // Verificar si el usuario es admin
    const isAdmin = (roleData as unknown as RolUsuarioJoin)?.rol_usuario?.nombre === 'Administrador';
    console.log('¿Es administrador?:', isAdmin);

    // Construir la consulta base
    // Incluir join con rol_usuario para obtener el nombre del rol
    let query = supabase
      .from("perfil_usuario")
      .select(`*, rol_usuario!inner(nombre)`, { count: 'exact' })
      .order('fecha_registro', { ascending: false });

    // Si no es admin, solo ver su propio perfil
    if (!isAdmin) {
      query = query.eq('id_perfil', authData.session.user.id);
    }

    // Aplicar filtros
    if (searchValue) {
      query = query.or(`primer_nombre.ilike.%${searchValue}%,primer_apellido.ilike.%${searchValue}%`);
    }

    if (filters.telefono) {
      query = query.ilike('telefono', `%${filters.telefono}%`);
    }

    if (filters.fecha_nacimiento && filters.fecha_nacimiento.length === 2) {
      const [startDate, endDate] = filters.fecha_nacimiento;
      if (startDate && endDate) {
        query = query
          .gte('fecha_nacimiento', startDate.toISOString())
          .lte('fecha_nacimiento', endDate.toISOString());
      }
    }

    if (filters.estado) {
      query = query.eq('estado', filters.estado);
    }

    // Aplicar paginación
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Ejecutar la consulta
    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }

    return {
      data: data || [],
      count: count || 0
    };
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    throw error;
  }
}
