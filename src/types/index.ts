import { Dayjs } from "dayjs";
import { TableProps } from "antd";
import { ReactNode, ComponentType } from "react";

interface GuardProps {
  children: ReactNode;
}

export interface IRoute {
  path: string;
  element: ComponentType;
  guard?: ComponentType<GuardProps>;
  layout?: ComponentType<GuardProps>;
  requiredLevel?: number; // Nivel mínimo de permiso requerido
}

export interface AuthUserType {
  id: string;
  email: string;
  last_sign_in_at: string;
  created_at: string;
  updated_at: string;
}

export interface RolUsuario {
  nombre: string;
  nivel_permisos: number;
}

export interface UsuarioRol {
  id_rol: number;
  rol_usuario: RolUsuario;
}

export interface UsuarioFormData {
  email: string;
  password: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: Dayjs | null;
  avatar_url: string;
  estado: 'activo' | 'inactivo' | 'eliminado';
  username: string | null;
  rol: string;
}

export interface UsuarioDataType {
  id_perfil: number; // Cambiado de string a number para coincidir con backend
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  fecha_registro: string;
  estado: string;
  username: string | null;
  avatar_url: string | null;
  ultimo_acceso: string | null;
  email?: string;
  nombre?: string; // Campo adicional del backend
  roles?: string; // Roles concatenados del backend
  nivel_permiso?: number; // Nivel de permiso del backend
}

export type TColumns = TableProps<UsuarioDataType>["columns"];

export interface IFilters {
  telefono: string | null;
  fecha_nacimiento:
    | [start: Dayjs | null | undefined, end: Dayjs | null | undefined]
    | null;
  estado: string | null;
}

export interface ITableHeaderProps {
  columnsInfo: TColumns;
  handleChangeColumns: (cols: TColumns) => void;
  handleFilterSubmit: (filters: IFilters) => void;
  handleSearch: (search: string) => void;
}

export interface IColumnsBtn {
  columnsInfo: TColumns;
  handleChangeColumns: (cols: TColumns) => void;
}
