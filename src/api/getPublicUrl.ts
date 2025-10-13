import { supabase } from "./supabaseClient";

export const getPublicUrl = (filePath: string) => {
  const { data } = supabase.storage.from("user-img").getPublicUrl(filePath);
  if (data?.publicUrl) {
    return data.publicUrl;
  } else {
    return null;
  }
};
