import { supabase } from '../config/database';
import {
  Producto,
  CategoriaProducto,
  ProductoVariante,
  RecetaDetalle,
  CreateProductoDTO,
  UpdateProductoDTO,
  CreateVarianteDTO,
  CreateRecetaDTO,
  ProductoConReceta,
} from '../types/productos.types';

// ================================================================
// 🍔 SERVICIO DE PRODUCTOS
// ================================================================

export class ProductosService {
  // ================== CATEGORÍAS ==================

  async getCategorias(): Promise<CategoriaProducto[]> {
    const { data, error } = await supabase
      .from('categoria_producto')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre_categoria');

    if (error) throw new Error(`Error al obtener categorías: ${error.message}`);
    return data || [];
  }

  async getCategoriaById(id: number): Promise<CategoriaProducto | null> {
    const { data, error } = await supabase
      .from('categoria_producto')
      .select('*')
      .eq('id_categoria', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener categoría: ${error.message}`);
    }
    return data;
  }

  async createCategoria(
    nombre: string,
    descripcion?: string
  ): Promise<CategoriaProducto> {
    const { data, error } = await supabase
      .from('categoria_producto')
      .insert({ nombre_categoria: nombre, descripcion })
      .select()
      .single();

    if (error) throw new Error(`Error al crear categoría: ${error.message}`);
    return data;
  }

  // ================== PRODUCTOS ==================

  async getProductos(activos?: boolean): Promise<Producto[]> {
    let query = supabase
      .from('producto')
      .select('*')
      .order('nombre_producto');

    if (activos !== undefined) {
      query = query.eq('estado', activos ? 'activo' : 'desactivado');
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error al obtener productos: ${error.message}`);
    return data || [];
  }

  async getProductoById(id: number): Promise<Producto | null> {
    const { data, error } = await supabase
      .from('producto')
      .select('*')
      .eq('id_producto', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener producto: ${error.message}`);
    }
    return data;
  }

  async getProductoConReceta(id: number): Promise<ProductoConReceta | null> {
    // Obtener producto
    const producto = await this.getProductoById(id);
    if (!producto) return null;

    // Obtener receta
    const { data: receta, error: recetaError } = await supabase
      .from('receta_detalle')
      .select('*')
      .eq('id_producto', id);

    if (recetaError) {
      throw new Error(`Error al obtener receta: ${recetaError.message}`);
    }

    // Obtener variantes
    const { data: variantes, error: variantesError } = await supabase
      .from('producto_variante')
      .select('*')
      .eq('id_producto', id);

    if (variantesError) {
      throw new Error(`Error al obtener variantes: ${variantesError.message}`);
    }

    return {
      ...producto,
      receta: receta || [],
      variantes: variantes || [],
    };
  }

  async createProducto(dto: CreateProductoDTO): Promise<Producto> {
    const { data, error } = await supabase
      .from('producto')
      .insert({
        nombre_producto: dto.nombre_producto,
        descripcion: dto.descripcion,
        precio_venta: dto.precio_venta,
        costo_producto: dto.costo_producto || 0,
        id_categoria: dto.id_categoria,
        imagen_url: dto.imagen_url,
      })
      .select()
      .single();

    if (error) throw new Error(`Error al crear producto: ${error.message}`);
    return data;
  }

  async updateProducto(id: number, dto: UpdateProductoDTO): Promise<Producto> {
    const { data, error } = await supabase
      .from('producto')
      .update(dto)
      .eq('id_producto', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar producto: ${error.message}`);
    return data;
  }

  async deleteProducto(id: number): Promise<void> {
    const { error } = await supabase
      .from('producto')
      .delete()
      .eq('id_producto', id);

    if (error) throw new Error(`Error al eliminar producto: ${error.message}`);
  }

  // ================== VARIANTES ==================

  async getVariantesByProducto(idProducto: number): Promise<ProductoVariante[]> {
    const { data, error } = await supabase
      .from('producto_variante')
      .select('*')
      .eq('id_producto', idProducto);

    if (error) throw new Error(`Error al obtener variantes: ${error.message}`);
    return data || [];
  }

  async createVariante(dto: CreateVarianteDTO): Promise<ProductoVariante> {
    const { data, error } = await supabase
      .from('producto_variante')
      .insert(dto)
      .select()
      .single();

    if (error) throw new Error(`Error al crear variante: ${error.message}`);
    return data;
  }

  async deleteVariante(id: number): Promise<void> {
    const { error } = await supabase
      .from('producto_variante')
      .delete()
      .eq('id_variante', id);

    if (error) throw new Error(`Error al eliminar variante: ${error.message}`);
  }

  // ================== RECETAS ==================

  async getRecetaByProducto(idProducto: number): Promise<RecetaDetalle[]> {
    const { data, error } = await supabase
      .from('receta_detalle')
      .select('*')
      .eq('id_producto', idProducto);

    if (error) throw new Error(`Error al obtener receta: ${error.message}`);
    return data || [];
  }

  async createRecetaDetalle(dto: CreateRecetaDTO): Promise<RecetaDetalle> {
    const { data, error } = await supabase
      .from('receta_detalle')
      .insert(dto)
      .select()
      .single();

    if (error) throw new Error(`Error al crear detalle de receta: ${error.message}`);
    return data;
  }

  async deleteRecetaDetalle(id: number): Promise<void> {
    const { error } = await supabase
      .from('receta_detalle')
      .delete()
      .eq('id_receta', id);

    if (error) throw new Error(`Error al eliminar detalle de receta: ${error.message}`);
  }
}

export const productosService = new ProductosService();
