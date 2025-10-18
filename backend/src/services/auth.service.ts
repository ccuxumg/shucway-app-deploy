import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/errorHandler.middleware';
import {
  LoginCredentials,
  LoginResponse,
  UsuarioConRol,
  AuthUser
} from '../types';

export class AuthService {
  // Registrar nuevo usuario
  async register(userData: {
    email: string;
    password: string;
    primer_nombre: string;
    primer_apellido: string;
    segundo_nombre?: string;
    segundo_apellido?: string;
    telefono?: string;
    direccion?: string;
    username?: string;
  }): Promise<UsuarioConRol> {
    try {
      // Verificar si el correo ya existe
      const { data: existingUser } = await supabase
        .from('perfil_usuario')
        .select('id_perfil')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new AppError('El correo electrónico ya está registrado', 400);
      }

      // Hashear contraseña con bcrypt (NO usamos Supabase Auth)
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Obtener rol por defecto (cliente)
      const { data: defaultRole } = await supabase
        .from('rol_usuario')
        .select('id_rol')
        .eq('nombre_rol', 'cliente')
        .single();

      if (!defaultRole) {
        throw new AppError('Rol por defecto no encontrado', 500);
      }

      // Crear usuario en la tabla perfil_usuario
      const { data: newUser, error } = await supabase
        .from('perfil_usuario')
        .insert({
          email: userData.email,
          password_hash: hashedPassword,
          primer_nombre: userData.primer_nombre,
          segundo_nombre: userData.segundo_nombre,
          primer_apellido: userData.primer_apellido,
          segundo_apellido: userData.segundo_apellido,
          telefono: userData.telefono,
          direccion: userData.direccion,
          username: userData.username,
          id_rol: defaultRole.id_rol,
          estado: 'activo'
        })
        .select()
        .single();

      if (error || !newUser) {
        logger.error('Error al crear usuario:', error);
        throw new AppError('Error al crear usuario', 500);
      }

      // Obtener usuario con rol
      const userWithRol = await this.getUserWithRol(newUser.id_perfil);
      
      logger.info(`Usuario registrado: ${newUser.email}`);
      
      return userWithRol;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error en register:', error);
      throw new AppError('Error al registrar usuario', 500);
    }
  }

  // Login con JWT personalizado (NO usamos Supabase Auth)
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Buscar usuario por email O username en nuestra tabla
      // Probar primero con email, luego con username
      let user = null;
      
      // Intentar buscar por email primero
      const { data: userByEmail } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('email', credentials.email)
        .single();
      
      if (userByEmail) {
        user = userByEmail;
      } else {
        // Si no se encontró por email, buscar por username
        const { data: userByUsername } = await supabase
          .from('perfil_usuario')
          .select('*')
          .eq('username', credentials.email)
          .single();
        
        if (userByUsername) {
          user = userByUsername;
        }
      }

      if (!user) {
        throw new AppError('Credenciales inválidas', 401);
      }

      // Verificar si el usuario está activo
      if (user.estado !== 'activo') {
        throw new AppError('Usuario inactivo', 403);
      }

      // Verificar contraseña con bcrypt (NO usamos Supabase Auth)
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password_hash
      );

      if (!isPasswordValid) {
        throw new AppError('Credenciales inválidas', 401);
      }

      // Actualizar último acceso
      await supabase
        .from('perfil_usuario')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id_perfil', user.id_perfil);

      // Obtener usuario con rol
      const userWithRol = await this.getUserWithRol(user.id_perfil);

      // Generar tokens JWT personalizados
      const token = this.generateToken(userWithRol);
      const refreshToken = this.generateRefreshToken(userWithRol);

      logger.info(`Login exitoso: ${user.email}`);

      return {
        user: userWithRol,
        token,
        refreshToken
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error en login:', error);
      throw new AppError('Error al iniciar sesión', 500);
    }
  }

  // Validar token JWT
  async validateToken(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;

      // Verificar que el usuario siga activo en nuestra BD
      const { data: user, error } = await supabase
        .from('perfil_usuario')
        .select('estado')
        .eq('id_perfil', decoded.id_perfil)
        .single();

      if (error || !user || user.estado !== 'activo') {
        throw new AppError('Token inválido', 401);
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error en validateToken:', error);
      throw new AppError('Token inválido', 401);
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as AuthUser;

      const userWithRol = await this.getUserWithRol(decoded.id_perfil);

      const newToken = this.generateToken(userWithRol);
      const newRefreshToken = this.generateRefreshToken(userWithRol);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Error en refreshToken:', error);
      throw new AppError('Token inválido', 401);
    }
  }

  // Obtener usuario con rol (usando tu estructura de BD)
  private async getUserWithRol(userId: number): Promise<UsuarioConRol> {
    const { data: user, error: userError } = await supabase
      .from('perfil_usuario')
      .select(`
        id_perfil,
        email,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        telefono,
        direccion,
        fecha_nacimiento,
        username,
        avatar_url,
        id_rol,
        estado,
        fecha_registro,
        ultimo_acceso,
        rol_usuario (
          id_rol,
          nombre_rol,
          descripcion,
          nivel_permisos,
          permisos,
          activo
        )
      `)
      .eq('id_perfil', userId)
      .single();

    if (userError || !user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Extraer el rol del usuario
    const rol = Array.isArray(user.rol_usuario) ? user.rol_usuario[0] : user.rol_usuario;

    if (!rol) {
      throw new AppError('Rol de usuario no encontrado', 404);
    }

    // Eliminar rol_usuario del objeto user y agregarlo como propiedad 'rol'
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rol_usuario, ...userData } = user;

    return {
      ...userData,
      rol
    } as UsuarioConRol;
  }

  // Generar token JWT personalizado
  private generateToken(user: UsuarioConRol): string {
    const payload = {
      id_perfil: user.id_perfil,
      email: user.email,
      username: user.username || user.email,
      nombre: `${user.primer_nombre} ${user.primer_apellido}`,
        role: {
        id_rol: user.rol.id_rol,
        nombre_rol: user.rol.nombre_rol,
        nivel_permisos: user.rol.nivel_permisos
      }
    };
    
    // @ts-expect-error - jwt.sign types are too strict, but this is valid usage
    return jwt.sign(payload, config.jwt.secret, { 
      expiresIn: config.jwt.expiresIn
    });
  }

  // Generar refresh token
  private generateRefreshToken(user: UsuarioConRol): string {
    const payload = {
      id_perfil: user.id_perfil,
      email: user.email,
      rol: user.rol.nombre_rol
    };
    
    // @ts-expect-error - jwt.sign types are too strict, but this is valid usage
    return jwt.sign(payload, config.jwt.secret, { 
      expiresIn: config.jwt.refreshExpiresIn
    });
  }
}

export const authService = new AuthService();
