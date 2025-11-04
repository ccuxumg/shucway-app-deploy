import { api } from './apiClient';

/* =============== Tipos =============== */
export interface CategoriaGasto {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
}

export interface PerfilMin {
  id_perfil: number;
  primer_nombre: string;
  primer_apellido: string;
}

export interface GastoOperativo {
  id_gasto: number;
  numero_gasto: string;
  fecha_gasto: string;
  nombre_gasto: string;
  detalle: string;
  monto: number;
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
  id_categoria: number;
  id_perfil: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  categoria_gasto?: CategoriaGasto;
  perfil_usuario?: PerfilMin;
}

export interface CreateGastoDTO {
  numero_gasto: string;
  fecha_gasto: string;
  id_categoria: number;
  nombre_gasto: string;
  detalle: string;
  monto: number;
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
}

export interface ResumenGastos {
  total_gastos: number;
  cantidad_registros: number;
  promedio_gasto: number;
  gastos: GastoOperativo[];
}

/* =============== Service =============== */
const gastosOperativosService = {
  // GET: Listar todos los gastos
  async getGastos(): Promise<GastoOperativo[]> {
    try {
      const response = await api.get('/gastos-operativos');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching gastos operativos:', error);
      throw error;
    }
  },

  // GET: Obtener gasto por ID
  async getGastoById(id: number): Promise<GastoOperativo> {
    try {
      const response = await api.get(`/gastos-operativos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gasto by ID:', error);
      throw error;
    }
  },

  // GET: Filtrar por rango de fechas
  async getGastosPorFechas(fechaInicio: string, fechaFin: string): Promise<GastoOperativo[]> {
    try {
      const response = await api.get('/gastos-operativos/fechas', {
        params: { fechaInicio, fechaFin },
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching gastos por fechas:', error);
      throw error;
    }
  },

  // GET: Filtrar por categoría
  async getGastosPorCategoria(categoriaId: number): Promise<GastoOperativo[]> {
    try {
      const response = await api.get('/gastos-operativos/categoria', {
        params: { categoriaId },
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching gastos por categoría:', error);
      throw error;
    }
  },

  // POST: Crear nuevo gasto
  async createGasto(gasto: CreateGastoDTO): Promise<GastoOperativo> {
    try {
      const response = await api.post('/gastos-operativos', gasto);
      return response.data;
    } catch (error) {
      console.error('Error creating gasto:', error);
      throw error;
    }
  },

  // PUT: Actualizar gasto
  async updateGasto(id: number, gasto: Partial<CreateGastoDTO>): Promise<GastoOperativo> {
    try {
      const response = await api.put(`/gastos-operativos/${id}`, gasto);
      return response.data;
    } catch (error) {
      console.error('Error updating gasto:', error);
      throw error;
    }
  },

  // DELETE: Eliminar gasto
  async deleteGasto(id: number): Promise<void> {
    try {
      await api.delete(`/gastos-operativos/${id}`);
    } catch (error) {
      console.error('Error deleting gasto:', error);
      throw error;
    }
  },

  // GET: Resumen/estadísticas de gastos
  async getResumenGastos(fechaInicio?: string, fechaFin?: string): Promise<ResumenGastos> {
    try {
      const params = fechaInicio && fechaFin ? { fechaInicio, fechaFin } : {};
      const response = await api.get('/gastos-operativos/resumen', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching resumen gastos:', error);
      throw error;
    }
  },
};

export default gastosOperativosService;
