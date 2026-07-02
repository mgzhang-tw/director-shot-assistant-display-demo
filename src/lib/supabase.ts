import { createClient } from "@supabase/supabase-js";
import type { ProjectData } from "../types";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://fyjvusodmuuecjcpsaly.supabase.co";
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "sb_publishable__N6UNzDSCDnyu3I6_QIEYg_S-hnu81N";

export const hasSupabaseConfig = Boolean(url && key);
export const supabase = hasSupabaseConfig ? createClient(url!, key!, { auth: { persistSession: false } }) : null;

export async function saveCloudProject(code: string, project: ProjectData) {
  if (!supabase) throw new Error("尚未設定 Supabase");
  const { error } = await supabase.rpc("save_shot_project", { p_code: code, p_payload: project });
  if (error) throw error;
}

export async function loadCloudProject(code: string): Promise<ProjectData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_shot_project", { p_code: code });
  if (error) throw error;
  return data as ProjectData | null;
}

export function createProjectCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}
