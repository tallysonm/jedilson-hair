import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BARBER_PHOTOS_BUCKET = "barber-photos";

export async function uploadBarberPhoto(file: File, barberId: number | string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `barber-${barberId}-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BARBER_PHOTOS_BUCKET)
    .upload(filename, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from(BARBER_PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
