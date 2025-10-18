// ================================================================
// 📦 TIPOS DE VENTAS Y CLIENTES
// ================================================================

export interface Cliente {
  id_cliente: number;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fecha_registro: Date;
  puntos_acumulados: number;
  ultima_compra?: Date;
}

export interface Venta {
  id_venta: number;
  id_cliente?: number;
  fecha_venta: Date;
  tipo_pago: 'Cash' | 'Paggo' | 'Tarjeta' | 'Transferencia';
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  id_cajero?: number;
  total_venta: number;
  total_costo: number;
  ganancia: number;
  notas?: string;
}

export interface DetalleVenta {
  id_detalle: number;
  id_venta: number;
  id_producto?: number;
  id_variante?: number;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  subtotal: number;
  costo_total: number;
  ganancia: number;
  descuento: number;
  es_canje_puntos: boolean;
  puntos_canjeados: number;
}

export interface HistorialPuntos {
  id_historial: number;
  id_cliente: number;
  tipo_movimiento: 'acumulacion' | 'canje' | 'expiracion' | 'ajuste';
  puntos: number;
  id_venta?: number;
  descripcion?: string;
  fecha_movimiento: Date;
}

export interface BitacoraVentas {
  id_bitacora: number;
  id_venta: number;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  datos_anteriores?: Record<string, unknown>;
  datos_nuevos?: Record<string, unknown>;
  id_perfil?: number;
  fecha_operacion: Date;
}

// ================================================================
// DTOs para Ventas
// ================================================================

export interface CreateVentaDTO {
  id_cliente?: number;
  tipo_pago: 'Cash' | 'Paggo' | 'Tarjeta' | 'Transferencia';
  puntos_usados?: number;
  notas?: string;
  detalles: CreateDetalleVentaDTO[];
}

export interface CreateDetalleVentaDTO {
  id_producto?: number;
  id_variante?: number;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  es_canje_puntos?: boolean;
  puntos_canjeados?: number;
}

export interface CreateClienteDTO {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface UpdateClienteDTO {
  nombre?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface CanjearPuntosDTO {
  id_cliente: number;
  puntos_a_canjear: number;
  descripcion?: string;
}

export interface VentaCompleta extends Venta {
  detalles: DetalleVenta[];
  cliente?: Cliente;
  cajero?: {
    id_perfil: number;
    nombre: string;
  };
}
