import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Role, MembershipStatus } from "./hub-auth";
import { dashboardPathForRole } from "./hub-auth";

/**
 * Identity architecture
 * =====================
 * Every authenticated account has ONE identity, resolved server-side by the
 * `resolve_identity()` SQL function. That function joins auth.users →
 * profiles → user_roles → family_members → families → parents/students/
 * instructor_profiles → onboarding_status into a single JSON payload.
 *
 * The client never guesses identity from ad-hoc queries. Every post-auth
 * entry point (auth callback, /onboarding, /dashboard, AccountGate) calls
 * `useIdentity()` (or `loadIdentity()`) and dispatches from the result.
 */
export type Identity = {
  user_id: string;
  profile: {
    user_id: string;
    email: string | null;
    preferred_name: string | null;
    avatar_url: string | null;
    primary_role: Role | null;
    membership_status: MembershipStatus | null;
  } | null;
  roles: Role[];
  family_id: string | null;
  family: Record<string, unknown> | null;
  parent: Record<string, unknown> | null;
  student: Record<string, unknown> | null;
  instructor: Record<string, unknown> | null;
  onboarding: { journey: string; status: string; final_enrolled: boolean | null }[];
};

export async function loadIdentity(): Promise<Identity | null> {
  const { data, error } = await supabase.rpc("resolve_identity" as never);
  if (error) throw error;
  return (data as Identity | null) ?? null;
}

/**
 * Given a resolved identity, decide where to send the user. Callers should
 * only redirect based on this function — never on a bespoke role check.
 *
 *  1. No profile yet     → /onboarding (role picker)
 *  2. No primary_role    → /onboarding (role picker)
 *  3. Instructor / admin → their dashboard (regardless of membership)
 *  4. Enrolled           → role dashboard
 *  5. Applicant          → role dashboard (admissions tracker takes over)
 *  6. Visitor + role     → /hub (browse until they start a journey)
 */
export function routeForIdentity(identity: Identity | null): string {
  if (!identity || !identity.profile) return "/onboarding";
  const role = identity.profile.primary_role;
  const status = identity.profile.membership_status ?? "visitor";
  if (!role) return "/onboarding";
  if (role === "instructor" || role === "administrator" || role === "admin") {
    return dashboardPathForRole(role);
  }
  if (status === "visitor") return "/hub";
  return dashboardPathForRole(role);
}

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) {
          if (mounted) { setIdentity(null); setLoading(false); }
          return;
        }
        const id = await loadIdentity();
        if (!mounted) return;
        setIdentity(id);
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { identity, loading, error, route: routeForIdentity(identity) };
}