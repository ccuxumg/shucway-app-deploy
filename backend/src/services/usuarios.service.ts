import { supabase } from '../config/database';

// ================================================================
// 👥 SERVICIO DE USUARIOS (PERFILES)
// ================================================================

type SupabaseRolRecord = {
  id_perfil: number;
  rol_usuario: { nombre: string; nivel_permiso: number } | { nombre: string; nivel_permiso: number }[];
};

export interface PerfilUsuario {
  id_perfil: number;
  nombre: string;
  email: string;
  username: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  avatar_url?: string;
  estado: 'activo' | 'desactivado' | 'suspendido';
  fecha_registro: Date;
  ultimo_acceso?: Date;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
}

export interface PerfilConRoles extends PerfilUsuario {
  roles: string; // String concatenado de roles
  nivel_permiso: number;
}

export interface CreateUsuarioDTO {
  nombre: string;
  email: string;
  username: string;
  password: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  avatar_url?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
}

export interface UpdateUsuarioDTO {
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  avatar_url?: string;
  estado?: 'activo' | 'desactivado' | 'suspendido';
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
}

export class UsuariosService {
  /**
   * Obtener todos los usuarios con paginación y filtros
   */
  async getUsuarios(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      estado?: string;
      searchValue?: string;
      telefono?: string;
      fecha_inicio?: string;
      fecha_fin?: string;
    }
  ): Promise<{ data: PerfilConRoles[]; count: number }> {
    const offset = (page - 1) * pageSize;

    // Construir query base
    let query = supabase
      .from('perfil_usuario')
      .select('*', { count: 'exact' })
      .order('fecha_registro', { ascending: false });

    // Aplicar filtros
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    if (filters?.telefono) {
      query = query.ilike('telefono', `%${filters.telefono}%`);
    }

    if (filters?.fecha_inicio && filters?.fecha_fin) {
      query = query
        .gte('fecha_nacimiento', filters.fecha_inicio)
        .lte('fecha_nacimiento', filters.fecha_fin);
    }

    if (filters?.searchValue && filters.searchValue.trim().length > 0) {
      query = query.or(
        `primer_nombre.ilike.%${filters.searchValue}%,primer_apellido.ilike.%${filters.searchValue}%,username.ilike.%${filters.searchValue}%,email.ilike.%${filters.searchValue}%`
      );
    }

    // Obtener perfiles paginados
    const { data: perfiles, error: perfilesError, count } = await query.range(offset, offset + pageSize - 1);

    if (perfilesError) throw new Error(`Error al obtener usuarios: ${perfilesError.message}`);

    if (!perfiles || perfiles.length === 0) {
      return { data: [], count: 0 };
    }

    // Obtener roles para estos perfiles
    const ids = perfiles.map((p) => p.id_perfil);
    const rolesMap: Record<number, { roles: string; nivel: number }> = {};

    if (ids.length > 0) {
      const { data: rolesData, error: rolesError } = await supabase
        .from('usuario_rol')
        .select(
          `
          id_perfil,
          rol_usuario!inner(nombre, nivel_permiso)
        `
        )
        .in('id_perfil', ids);

      if (!rolesError && rolesData) {
        rolesData.forEach((r: SupabaseRolRecord) => {
          const rol = Array.isArray(r.rol_usuario) ? r.rol_usuario[0] : r.rol_usuario;
          const roleName = rol?.nombre || 'Sin rol';
          const nivelPermiso = rol?.nivel_permiso || 0;
          const idPerfil = r.id_perfil;

          if (!rolesMap[idPerfil]) {
            rolesMap[idPerfil] = { roles: roleName, nivel: nivelPermiso };
          } else {
            rolesMap[idPerfil].roles += `, ${roleName}`;
            // Tomar el nivel más alto
            if (nivelPermiso > rolesMap[idPerfil].nivel) {
              rolesMap[idPerfil].nivel = nivelPermiso;
            }
          }
        });
      }
    }

    // Combinar perfiles con roles
    const perfilesConRoles = perfiles.map((perfil) => ({
      ...perfil,
      roles: rolesMap[perfil.id_perfil]?.roles || 'Sin rol',
      nivel_permiso: rolesMap[perfil.id_perfil]?.nivel || 0,
    })) as PerfilConRoles[];

    return {
      data: perfilesConRoles,
      count: count || 0,
    };
  }

  /**
   * Obtener usuario por ID
   */
  async getUsuarioById(id: number): Promise<PerfilConRoles | null> {
    // Obtener perfil
    const { data: perfil, error } = await supabase
      .from('perfil_usuario')
      .select('*')
      .eq('id_perfil', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }

    if (!perfil) return null;

    // Obtener roles
    const { data: rolesData } = await supabase
      .from('usuario_rol')
      .select(
        `
        rol_usuario!inner(nombre, nivel_permiso)
      `
      )
      .eq('id_perfil', id);

    let roles = 'Sin rol';
    let nivel_permiso = 0;

    if (rolesData && rolesData.length > 0) {
      const rolesArray = rolesData as unknown as Array<{
        rol_usuario: { nombre: string; nivel_permiso: number } | { nombre: string; nivel_permiso: number }[];
      }>;

      roles = rolesArray
        .map((r) => {
          const rol = Array.isArray(r.rol_usuario) ? r.rol_usuario[0] : r.rol_usuario;
          return rol?.nombre || 'Sin rol';
        })
        .join(', ');

      nivel_permiso = Math.max(
        ...rolesArray.map((r) => {
          const rol = Array.isArray(r.rol_usuario) ? r.rol_usuario[0] : r.rol_usuario;
          return rol?.nivel_permiso || 0;
        })
      );
    }

    return {
      ...perfil,
      roles,
      nivel_permiso,
    } as PerfilConRoles;
  }

  /**
   * Actualizar usuario
   */
  async updateUsuario(id: number, dto: UpdateUsuarioDTO): Promise<PerfilUsuario> {
    const { data, error } = await supabase
      .from('perfil_usuario')
      .update(dto)
      .eq('id_perfil', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar usuario: ${error.message}`);
    return data;
  }

  /**
   * Cambiar estado de usuario
   */
  async cambiarEstado(id: number, estado: 'activo' | 'desactivado' | 'suspendido'): Promise<PerfilUsuario> {
    return this.updateUsuario(id, { estado });
  }

  /**
   * Eliminar usuario (soft delete - cambiar estado a desactivado)
   */
  async deleteUsuario(id: number): Promise<void> {
    await this.cambiarEstado(id, 'desactivado');
  }

  /**
   * Obtener roles de un usuario
   */
  async getRolesByUsuario(idUsuario: number): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('usuario_rol')
      .select(
        `
        id_usuario_rol,
        id_rol,
        fecha_asignacion,
        rol_usuario!inner(
          id_rol,
          nombre,
          nivel_permiso
        )
      `
      )
      .eq('id_perfil', idUsuario);

    if (error) throw new Error(`Error al obtener roles: ${error.message}`);
    return data || [];
  }

  /**
   * Asignar rol a usuario
   */
  async asignarRol(idUsuario: number, idRol: number): Promise<void> {
    const { error } = await supabase.from('usuario_rol').insert({
      id_perfil: idUsuario,
      id_rol: idRol,
    });

    if (error) throw new Error(`Error al asignar rol: ${error.message}`);
  }

  /**
   * Remover rol de usuario
   */
  async removerRol(idUsuarioRol: number): Promise<void> {
    const { error } = await supabase.from('usuario_rol').delete().eq('id_usuario_rol', idUsuarioRol);

    if (error) throw new Error(`Error al remover rol: ${error.message}`);
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getEstadisticas(): Promise<{
    total: number;
    activos: number;
    desactivados: number;
    nuevosEsteMes: number;
  }> {
    // Total usuarios
    const { count: total } = await supabase
      .from('perfil_usuario')
      .select('*', { count: 'exact', head: true });

    // Usuarios activos
    const { count: activos } = await supabase
      .from('perfil_usuario')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo');

    // Usuarios desactivados
    const { count: desactivados } = await supabase
      .from('perfil_usuario')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'desactivado');

    // Nuevos usuarios este mes
    const primerDiaMes = new Date();
    primerDiaMes.setDate(1);
    primerDiaMes.setHours(0, 0, 0, 0);

    const { count: nuevosEsteMes } = await supabase
      .from('perfil_usuario')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_registro', primerDiaMes.toISOString());

    return {
      total: total || 0,
      activos: activos || 0,
      desactivados: desactivados || 0,
      nuevosEsteMes: nuevosEsteMes || 0,
    };
  }
}

export const usuariosService = new UsuariosService();
