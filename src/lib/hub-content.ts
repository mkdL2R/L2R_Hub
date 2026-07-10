import { supabase } from "@/integrations/supabase/client";

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  hero_image_url: string | null;
  author: string | null;
  category: string;
  reading_minutes: number;
  status: string;
  publish_at: string;
};

export type Episode = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  category: string;
  status: string;
  is_featured: boolean;
  publish_at: string;
};

export type Resource = {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  category: string;
  age_group: string | null;
  status: string;
  publish_at: string;
};

export function fmtDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export async function listPublishedArticles() {
  const { data, error } = await supabase
    .from("hub_articles")
    .select("*")
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .order("publish_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Article[];
}

export async function listPublishedEpisodes() {
  const { data, error } = await supabase
    .from("hub_podcast_episodes")
    .select("*")
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .order("publish_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Episode[];
}

export async function listPublishedResources() {
  const { data, error } = await supabase
    .from("hub_resources")
    .select("*")
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .order("publish_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Resource[];
}

const CATEGORY_TONES = [
  "bg-crayon/10 text-crayon border-crayon/25",
  "bg-sketch/10 text-sketch border-sketch/25",
  "bg-mustard/20 text-mustard-foreground border-mustard/40",
  "bg-sage/25 text-sage-foreground border-sage/40",
  "bg-primary/10 text-primary border-primary/25",
] as const;

export function categoryTone(category: string | null | undefined): string {
  if (!category) return CATEGORY_TONES[0];
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_TONES[h % CATEGORY_TONES.length];
}