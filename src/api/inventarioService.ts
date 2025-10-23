import { api } from "./apiClient";
import { supabase } from "./supabaseClient";

type Proveedor = {
  id_proveedor?: number;
  nombre: string;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  activo: boolean;
  es_preferido: boolean;
  dias_entrega?: string | null;
  tiempo_entrega_promedio?: number | null;
  metodo_entrega?: string | null;
};

export const fetchProveedores = async () => {
  const response = await api.get("/proveedores");
  return response.data;
};

type ProveedorAPIData = {
  nombre_empresa: string;
  nombre_contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
  estado: boolean;
  es_preferido: boolean;
  metodo_entrega?: string | null;
};

export const saveProveedor = async (proveedor: Proveedor) => {
  // Mapear campos del frontend al formato de la API
  const apiData: ProveedorAPIData = {
    nombre_empresa: proveedor.nombre,
    nombre_contacto: proveedor.contacto,
    telefono: proveedor.telefono,
    correo: proveedor.correo,
    direccion: proveedor.direccion,
    estado: proveedor.activo,
    es_preferido: proveedor.es_preferido
  };

  // Incluir metodo_entrega si tiene valor
  if (proveedor.metodo_entrega) {
    apiData.metodo_entrega = proveedor.metodo_entrega;
  }

  if (proveedor.id_proveedor && proveedor.id_proveedor < 1000) { // ID real de la base de datos
    // Actualizar proveedor existente
    const response = await api.put(`/proveedores/${proveedor.id_proveedor}`, apiData);
    return response.data;
  } else {
    // Crear nuevo proveedor
    const response = await api.post("/proveedores", apiData);
    return response.data;
  }
};

export const fetchOrdenesCompra = async () => {
  const response = await api.get("/ordenes-compra");
  return response.data;
};

export const fetchInsumos = async () => {
  const { data, error } = await supabase.from("insumos").select("*");
  if (error) throw new Error(error.message);
  return data;
};