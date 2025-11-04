import { Request, Response } from 'express';
import { supabase } from '../config/database';

/* ============ GET: Listar todos los gastos operativos ============ */
export const getGastosOperativos = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('gasto_operativo')
      .select(`
        id_gasto,
        numero_gasto,
        fecha_gasto,
        nombre_gasto,
        detalle,
        monto,
        frecuencia,
        id_categoria,
        id_perfil,
        fecha_creacion,
        fecha_actualizacion,
        categoria_gasto:id_categoria(id_categoria, nombre, descripcion),
        perfil_usuario:id_perfil(id_perfil, primer_nombre, primer_apellido)
      `)
      .order('fecha_gasto', { ascending: false });

    if (error) {
      console.error('Error fetching gastos operativos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error in getGastosOperativos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ============ GET: Obtener gasto operativo por ID ============ */
export const getGastoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('gasto_operativo')
      .select(`
        id_gasto,
        numero_gasto,
        fecha_gasto,
        nombre_gasto,
        detalle,
        monto,
        frecuencia,
        id_categoria,
        id_perfil,
        fecha_creacion,
        fecha_actualizacion,
        categoria_gasto:id_categoria(id_categoria, nombre, descripcion),
        perfil_usuario:id_perfil(id_perfil, primer_nombre, primer_apellido)
      `)
      .eq('id_gasto', id)
      .single();

    if (error) {
      console.error('Error fetching gasto:', error);
      res.status(404).json({ error: 'Gasto operativo no encontrado' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('Error in getGastoById:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ============ GET: Obtener gastos por rango de fechas ============ */
export const getGastoPorFechas = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      res.status(400).json({ error: 'Debe proporcionar fechaInicio y fechaFin' });
      return;
    }

    const { data, error } = await supabase
      .from('gasto_operativo')
      .select(`
        id_gasto,
        numero_gasto,
        fecha_gasto,
        nombre_gasto,
        detalle,
        monto,
        frecuencia,
        id_categoria,
        id_perfil,
        fecha_creacion,
        fecha_actualizacion,
        categoria_gasto:id_categoria(id_categoria, nombre, descripcion),
        perfil_usuario:id_perfil(id_perfil, primer_nombre, primer_apellido)
      `)
      .gte('fecha_gasto', fechaInicio)
      .lte('fecha_gasto', fechaFin)
      .order('fecha_gasto', { ascending: false });

    if (error) {
      console.error('Error fetching gastos por fechas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error in getGastoPorFechas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ============ GET: Obtener gastos por categoría ============ */
export const getGastoPorCategoria = async (req: Request, res: Response) => {
  try {
    const { categoriaId } = req.query;

    if (!categoriaId) {
      res.status(400).json({ error: 'Debe proporcionar categoriaId' });
      return;
    }

    const { data, error } = await supabase
      .from('gasto_operativo')
      .select(`
        id_gasto,
        numero_gasto,
        fecha_gasto,
        nombre_gasto,
        detalle,
        monto,
        frecuencia,
        id_categoria,
        id_perfil,
        fecha_creacion,
        fecha_actualizacion,
        categoria_gasto:id_categoria(id_categoria, nombre, descripcion),
        perfil_usuario:id_perfil(id_perfil, primer_nombre, primer_apellido)
      `)
      .eq('id_categoria', categoriaId)
      .order('fecha_gasto', { ascending: false });

    if (error) {
      console.error('Error fetching gastos por categoría:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Error in getGastoPorCategoria:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ============ POST: Crear nuevo gasto operativo ============ */
export const createGasto = async (req: Request, res: Response) => {
  try {
    const { numero_gasto, fecha_gasto, id_categoria, nombre_gasto, detalle, monto, frecuencia } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id_perfil = (req as any).user?.id_perfil;

    // Validaciones básicas
    if (!numero_gasto || !fecha_gasto || !id_categoria || !nombre_gasto || !detalle || !monto || !frecuencia) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }

    // Validar que frecuencia sea un valor permitido
    const frecuenciasPermitidas = ['semanal', 'quincenal', 'mensual'];
    if (!frecuenciasPermitidas.includes(frecuencia)) {
      res.status(400).json({ error: 'Frecuencia debe ser: semanal, quincenal o mensual' });
      return;
    }

    if (monto <= 0) {
      res.status(400).json({ error: 'El monto debe ser mayor a 0' });
      return;
    }

    if (numero_gasto.length < 3) {
      res.status(400).json({ error: 'El número de gasto debe tener al menos 3 caracteres' });
      return;
    }

    if (nombre_gasto.length < 3) {
      res.status(400).json({ error: 'El nombre del gasto debe tener al menos 3 caracteres' });
      return;
    }

    // Verificar que el número de gasto sea único
    const { data: existingGasto } = await supabase
      .from('gasto_operativo')
      .select('id_gasto')
      .eq('numero_gasto', numero_gasto)
      .single();

    if (existingGasto) {
      res.status(409).json({ error: 'El número de gasto ya existe' });
      return;
    }

    const { data, error } = await supabase
      .from('gasto_operativo')
      .insert([
        {
          numero_gasto: numero_gasto.trim(),
          fecha_gasto,
          id_categoria: parseInt(id_categoria),
          nombre_gasto: nombre_gasto.trim(),
          detalle: detalle.trim(),
          monto: parseFloat(monto),
          frecuencia,
          id_perfil,
        },
      ])
      .select(`
        id_gasto,
        numero_gasto,
        fecha_gasto,
        nombre_gasto,
        detalle,
        monto,
        frecuencia,
        id_categoria,
        id_perfil,
        fecha_creacion,
        fecha_actualizacion,
        categoria_gasto:id_categoria(id_categoria, nombre, descripcion),
        perfil_usuario:id_perfil(id_perfil, primer_nombre, primer_apellido)
      `);

    if (error) {
      console.error('Error creating gasto:', error);
      res.status(500).json({ error: 'Error al crear el gasto operativo' });
      return;
    }

    res.status(201).json(data?.[0]);
  } catch (err) {
    console.error('Error in createGasto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ============ PUT: Actualizar gasto operativo ============ */
export const updateGasto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { numero_gasto, fecha_gasto, id_categoria, nombre_gasto, detalle, monto, frecuencia } = req.body;

    // Validaciones básicas
    if (monto && monto <= 0) {
      res.status(400).json({ error: 'El monto debe ser mayor a 0' });
      return;
    }

    if (frecuencia) {
      const frecuenciasPermitidas = ['semanal', 'quincenal', 'mensual'];
      if (!frecuenciasPermitidas.includes(frecuencia)) {
        res.status(400).json({ error: 'Frecuencia debe ser: semanal, quincenal o mensual' });
        return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (numero_gasto) updateData.numero_gasto = numero_gasto.trim();
    if (fecha_gasto) updateData.fecha_gasto = fecha_gasto;
    if (id_categoria) updateData.id_categoria = parseInt(id_categoria);
    if (nombre_gasto) updateData.nombre_gasto = nombre_gasto.trim();
    if (detalle) updateData.detalle = detalle.trim();
    if (monto) updateData.monto = parseFloat(monto);
    if (frecuencia) updateData.frecuencia = frecuencia;

    const { data, error } = await supabase
      .from('gasto_operativo')
      .update(updateData)
      .eq('id_gasto', id)
      .select(`
        id_gasto,
        numero_gasto,
        fecha_gasto,
        nombre_gasto,
        detalle,
        monto,
        frecuencia,
        id_categoria,
        id_perfil,
        fecha_creacion,
        fecha_actualizacion,
        categoria_gasto:id_categoria(id_categoria, nombre, descripcion),
        perfil_usuario:id_perfil(id_perfil, primer_nombre, primer_apellido)
      `);

    if (error) {
      console.error('Error updating gasto:', error);
      res.status(500).json({ error: 'Error al actualizar el gasto' });
      return;
    }

    if (!data || data.length === 0) {
      res.status(404).json({ error: 'Gasto operativo no encontrado' });
      return;
    }

    res.json(data[0]);
  } catch (err) {
    console.error('Error in updateGasto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ============ DELETE: Eliminar gasto operativo ============ */
export const deleteGasto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('gasto_operativo')
      .delete()
      .eq('id_gasto', id);

    if (error) {
      console.error('Error deleting gasto:', error);
      res.status(500).json({ error: 'Error al eliminar el gasto' });
      return;
    }

    res.json({ message: 'Gasto operativo eliminado correctamente' });
  } catch (err) {
    console.error('Error in deleteGasto:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* ============ GET: Obtener resumen/estadísticas de gastos ============ */
export const getResumenGastos = async (req: Request, res: Response) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let query = supabase
      .from('gasto_operativo')
      .select('*');

    if (fechaInicio && fechaFin) {
      query = query
        .gte('fecha_gasto', fechaInicio)
        .lte('fecha_gasto', fechaFin);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching resumen:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    const gastos = data || [];
    const totalGastos = gastos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);

    res.json({
      total_gastos: totalGastos,
      cantidad_registros: gastos.length,
      promedio_gasto: gastos.length > 0 ? totalGastos / gastos.length : 0,
      gastos: gastos,
    });
  } catch (err) {
    console.error('Error in getResumenGastos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
