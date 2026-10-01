import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_articles",
  title: "Search Growth Hub articles",
  description: "Search published Family Growth Hub articles by keyword.",
  inputSchema: {
    query: z.string().trim().optional().describe("Keyword to match in titles."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    const sb = supabaseForUser(ctx);
    let q = sb.from("hub_articles").select("slug, title, excerpt, category, reading_minutes, publish_at")
      .eq("status", "published").order("publish_at", { ascending: false }).limit(limit ?? 10);
    if (query) q = q.ilike("title", `%${query}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const articles = (data ?? []).map((a) => ({
      slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.category,
      reading_minutes: a.reading_minutes, publish_at: a.publish_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(articles) }], structuredContent: { articles } };
  },
});
