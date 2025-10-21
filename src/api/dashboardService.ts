import apiClient from "./apiClient";

export interface StatsData {
  ventas: {
    total: number;
    change: number;
  };
  inventario: {
    total: number;
    change: number;
  };
  clientes: {
    total: number;
    change: number;
  };
  ganancias: {
    total: number;
    change: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export interface Alert {
  id?: number;
  type: 'warning' | 'info' | 'error';
  message: string;
  timestamp: string;
}

export interface InventoryItem {
  id?: number;
  name: string;
  qty?: string;
  note?: string;
}

export const dashboardService = {
  async getStats(): Promise<StatsData> {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  async getVentasSemana(): Promise<{ dia: string; total: number }[]> {
    const response = await apiClient.get('/dashboard/ventas-semana');
    return response.data;
  },

  async getAlertasRecientes(): Promise<Alert[]> {
    const response = await apiClient.get('/dashboard/alertas');
    return response.data;
  },

  async getInventoryData(): Promise<{ 
    perpetual: InventoryItem[]; 
    operational: InventoryItem[]; 
    totalPerpetualStock: number; 
    totalOperationalStock: number; 
    totalPerpetualItems: number; 
    totalOperationalItems: number; 
  }> {
    const response = await apiClient.get('/dashboard/inventory');
    return response.data;
  }
};