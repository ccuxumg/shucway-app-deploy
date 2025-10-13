// src/api/uploadFile.ts
import { RcFile } from "antd/es/upload";
import { supabase } from "./supabaseClient";

export const uploadFile = async (file?: RcFile): Promise<string | null> => {
  if (!file) return null;

 
  const filePath = `avatars/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("user-img")  
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error("Error al subir el archivo:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("user-img").getPublicUrl(filePath);
  return data.publicUrl || null;
};
