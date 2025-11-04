// ================================================================
// 📦 TIPOS DE FINANZAS
// ================================================================

export interface CategoriaGasto {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface GastoOperativo {
  id_gasto: number;
  numero_gasto: string;
  fecha_gasto: Date;
  id_categoria: number;
  nombre_gasto: string;
  detalle: string;
  monto: number;
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
  id_perfil: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface DepositoBanco {
  id_deposito: number;
  fecha_deposito: Date;
  monto: number;
  banco: string;
  numero_cuenta?: string;
  id_responsable?: number;
  comprobante_url?: string;
  observaciones?: string;
}

export interface ArqueoCaja {
  id_arqueo: number;
  fecha_arqueo: Date;
  id_cajero?: number;
  efectivo_esperado: number;
  efectivo_contado: number;
  diferencia: number;
  observaciones?: string;
}

// ================================================================
// DTOs para Finanzas
// ================================================================

export interface CreateCategoriaGastoDTO {
  nombre: string;
  descripcion?: string;
}

export interface CreateGastoDTO {
  numero_gasto: string;
  fecha_gasto?: string;
  id_categoria: number;
  nombre_gasto: string;
  detalle: string;
  monto: number;
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
}

export interface CreateDepositoDTO {
  fecha_deposito?: string;
  monto: number;
  banco: string;
  numero_cuenta?: string;
  comprobante_url?: string;
  observaciones?: string;
}

export interface CreateArqueoDTO {
  efectivo_contado: number;
  observaciones?: string;
}

export interface ResumenFinanciero {
  fecha_inicio: string;
  fecha_fin: string;
  total_ventas: number;
  total_gastos: number;
  total_depositos: number;
  diferencia_caja: number;
  utilidad_neta: number;
}
