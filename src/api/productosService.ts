// ================================================================
// 🍔 SERVICIO DE PRODUCTOS
// ================================================================

import apiClient from "./apiClient";

// Interfaces basadas en el backend
export interface CategoriaProducto {
  id_categoria: number;
  nombre_categoria: string;
  descripcion?: string;
  estado: 'activo' | 'desactivado';
}

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  descripcion?: string;
  precio_venta: number;
  costo_producto: number;
  id_categoria?: number;
  estado: 'activo' | 'desactivado';
  imagen_url?: string;
  fecha_creacion: Date;
  categoria?: CategoriaProducto;
  variantes?: ProductoVariante[];
}

export interface ProductoVariante {
  id_variante: number;
  id_producto: number;
  nombre_variante: string;
  precio_variante: number;
  costo_variante?: number;
  estado: 'activo' | 'desactivado';
}

export interface RecetaDetalle {
  id_receta: number;
  id_producto: number;
  id_insumo: number;
  cantidad_requerida: number;
  unidad_medida: string;
}

export interface ProductoConReceta extends Producto {
  receta: RecetaDetalle[];
  variantes?: ProductoVariante[];
}

export const productosService = {
  // Obtener todas las categorías
  async getCategorias(): Promise<CategoriaProducto[]> {
    try {
      const response = await apiClient.get('/productos/categorias');
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  },

  // Obtener todos los productos
  async getProductos(activos?: boolean): Promise<Producto[]> {
    try {
      const params = activos !== undefined ? `?activos=${activos}` : '';
      const response = await apiClient.get(`/productos${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  },

  // Obtener producto por ID
  async getProductoById(id: number): Promise<Producto> {
    try {
      const response = await apiClient.get(`/productos/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      throw error;
    }
  },

  // Obtener producto con receta
  async getProductoConReceta(id: number): Promise<ProductoConReceta> {
    try {
      const response = await apiClient.get(`/productos/${id}?receta=true`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo producto con receta:', error);
      throw error;
    }
  },

  // Obtener variantes de un producto
  async getVariantesByProducto(idProducto: number): Promise<ProductoVariante[]> {
    try {
      const response = await apiClient.get(`/productos/${idProducto}/variantes`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo variantes:', error);
      throw error;
    }
  },
};