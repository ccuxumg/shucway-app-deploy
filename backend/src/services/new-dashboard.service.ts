import { supabase } from '../config/database';

interface DashboardStats {
  ventas: {
    total: string;
    change: number;
  };
  inventario: {
    total: string;
    change: number;
  };
  clientes: {
    total: string;
    change: number;
  };
  ganancias: {
    total: string;
    change: number;
  };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Obtener todas las estadísticas en paralelo
    const [
      { data: ventasData, error: ventasError },
      { data: inventarioData, error: inventarioError },
      { data: clientesData, error: clientesError },
      { data: gananciasData, error: gananciasError }
    ] = await Promise.all([
      supabase.rpc('fn_obtener_estadisticas_ventas'),
      supabase.rpc('fn_obtener_estadisticas_inventario'),
      supabase.rpc('fn_obtener_estadisticas_clientes'),
      supabase.rpc('fn_obtener_estadisticas_ganancias')
    ]);

    // Verificar errores
    if (ventasError) throw ventasError;
    if (inventarioError) throw inventarioError;
    if (clientesError) throw clientesError;
    if (gananciasError) throw gananciasError;

    const formatMoney = (amount: number) => 
      `Q${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return {
      ventas: {
        total: formatMoney(ventasData?.total || 0),
        change: Number(ventasData?.cambio_porcentual || 0)
      },
      inventario: {
        total: String(inventarioData?.total || 0),
        change: Number(inventarioData?.cambio_porcentual || 0)
      },
      clientes: {
        total: String(clientesData?.total || 0),
        change: Number(clientesData?.cambio_porcentual || 0)
      },
      ganancias: {
        total: formatMoney(gananciasData?.total || 0),
        change: Number(gananciasData?.cambio_porcentual || 0)
      }
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    throw error;
  }
};