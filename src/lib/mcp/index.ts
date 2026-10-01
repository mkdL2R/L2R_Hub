import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchArticles from "./tools/search-articles";
import getMyIdentity from "./tools/get-my-identity";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "left2right-edu-org",
  title: "Left2Right Edu Org",
  version: "0.1.0",
  instructions:
    "Tools for the L2R Education Hub. Use `get_my_identity` to see the signed-in user's profile, family and admissions progress, and `search_articles` to find Family Growth Hub articles.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyIdentity, searchArticles],
});
