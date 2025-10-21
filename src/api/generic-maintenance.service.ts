import { api } from './apiClient';

// ================================================================
// 🔧 SERVICIO GENÉRICO PARA MANTENIMIENTO
// ================================================================

export interface TableMetadata {
  tableName: string;
  displayName: string;
  fields: FieldConfig[];
  primaryKey: string;
  searchableFields: string[];
  filterableFields: string[];
  sortableFields: string[];
  relationships?: RelationshipConfig[];
}

export interface FieldConfig {
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea' | 'email' | 'password';
  required: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  options?: { value: unknown; label: string }[];
  defaultValue?: unknown;
  readonly?: boolean;
  hidden?: boolean;
}

export interface RelationshipConfig {
  field: string;
  relatedTable: string;
  relatedField: string;
  displayField: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  searchValue?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationParams;
}

// ================================================================
// 📋 FUNCIONES DEL SERVICIO
// ================================================================

export class GenericMaintenanceService {
  // Obtener todas las tablas disponibles
  static async getAvailableTables(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/maintenance/tables');
    return response.data.data;
  }

  // Obtener metadatos de una tabla específica
  static async getTableMetadata(tableName: string): Promise<TableMetadata> {
    const response = await api.get<ApiResponse<TableMetadata>>(`/maintenance/tables/${tableName}/metadata`);
    return response.data.data;
  }

  // Obtener estadísticas de una tabla
  static async getTableStats(tableName: string): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(`/maintenance/tables/${tableName}/stats`);
    return response.data.data;
  }

  // Obtener registros con paginación y filtros
  static async getRecords(
    tableName: string,
    params: QueryParams = {}
  ): Promise<{ data: Record<string, unknown>[]; pagination: PaginationParams }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const url = `/maintenance/${tableName}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<Record<string, unknown>[]>>(url);

    return {
      data: response.data.data,
      pagination: response.data.pagination || {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        total: response.data.data.length,
        totalPages: 1
      }
    };
  }

  // Obtener un registro específico
  static async getRecord(tableName: string, id: number): Promise<Record<string, unknown>> {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(`/maintenance/${tableName}/${id}`);
    return response.data.data;
  }

  // Crear un nuevo registro
  static async createRecord(tableName: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(`/maintenance/${tableName}`, data);
    return response.data.data;
  }

  // Actualizar un registro
  static async updateRecord(tableName: string, id: number, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.put<ApiResponse<Record<string, unknown>>>(`/maintenance/${tableName}/${id}`, data);
    return response.data.data;
  }

  // Eliminar un registro
  static async deleteRecord(tableName: string, id: number): Promise<void> {
    await api.delete(`/maintenance/${tableName}/${id}`);
  }
}

// ================================================================
// 🎯 FUNCIONES DE UTILIDAD
// ================================================================

// Función para formatear valores según el tipo de campo
export const formatFieldValue = (value: unknown, fieldType: string): string => {
  if (value === null || value === undefined) return '';

  switch (fieldType) {
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'boolean':
      return value ? 'Sí' : 'No';
    case 'number':
      return Number(value).toLocaleString();
    default:
      return String(value);
  }
};

// Función para validar datos antes de enviar
export const validateRecordData = (data: Record<string, unknown>, metadata: TableMetadata): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  metadata.fields.forEach(field => {
    const value = data[field.name];

    // Validar campos requeridos
    if (field.required && (value === null || value === undefined || value === '')) {
      errors.push(`El campo ${field.displayName} es requerido`);
    }

    // Validar longitud máxima
    if (field.maxLength && value && String(value).length > field.maxLength) {
      errors.push(`El campo ${field.displayName} no puede tener más de ${field.maxLength} caracteres`);
    }

    // Validar longitud mínima
    if (field.minLength && value && String(value).length < field.minLength) {
      errors.push(`El campo ${field.displayName} debe tener al menos ${field.minLength} caracteres`);
    }

    // Validar patrón
    if (field.pattern && value) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(String(value))) {
        errors.push(`El campo ${field.displayName} tiene un formato inválido`);
      }
    }

    // Validar tipo de dato
    if (value !== null && value !== undefined && value !== '') {
      switch (field.type) {
        case 'number':
          if (isNaN(Number(value))) {
            errors.push(`El campo ${field.displayName} debe ser un número`);
          }
          break;
        case 'email': {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            errors.push(`El campo ${field.displayName} debe ser un email válido`);
          }
          break;
        }
        case 'date':
          if (isNaN(Date.parse(value))) {
            errors.push(`El campo ${field.displayName} debe ser una fecha válida`);
          }
          break;
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};