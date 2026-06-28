import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Role =
  | "admin"
  | "editor"
  | "member"
  | "parent"
  | "student"
  | "instructor"
  | "administrator"
  | "mentor"
  | "wellness_practitioner";

export const PRIMARY_ROLES: { value: Role; label: string; emoji: string; description: string }[] = [
  { value: "parent", label: "Parent", emoji: "👨‍👩‍👧", description: "I'm raising a learner" },
  { value: "student", label: "Student", emoji: "👨‍🎓", description: "I am the learner" },
  { value: "instructor", label: "Instructor", emoji: "👩‍🏫", description: "I teach and guide" },
];

export function dashboardPathForRole(role: Role | string | null | undefined): string {
  switch (role) {
    case "parent": return "/_authenticated/family-dashboard";
    case "student": return "/_authenticated/student-dashboard";
    case "instructor":
    case "administrator":
    case "admin":
      return "/_authenticated/instructor-dashboard";
    default: return "/_authenticated/onboarding";
  }
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return { user, loading };
}

export function useUserRoles(userId: string | undefined) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        setRoles((data ?? []).map((r) => r.role as Role));
        setLoading(false);
      });
  }, [userId]);
  return { roles, isStaff: roles.includes("admin") || roles.includes("editor"), loading };
}

export const ARTICLE_CATEGORIES = [
  "Parenting",
  "Communication",
  "Child Development",
  "Emotional Intelligence",
  "Study Habits",
  "Character Development",
  "Health & Wellbeing",
  "Nutrition",
  "Digital Citizenship",
  "Family Relationships",
] as const;

export const PODCAST_CATEGORIES = [
  "Parenting",
  "Education",
  "Family Communication",
  "Student Success",
  "Health",
  "Leadership",
  "Interviews",
  "Workshops",
] as const;

export const RESOURCE_CATEGORIES = [
  "Guides",
  "Worksheets",
  "Family Activities",
  "Reading Lists",
  "Study Planners",
  "Reflection Journals",
  "Printables",
] as const;
