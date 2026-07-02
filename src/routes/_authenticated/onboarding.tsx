import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, PRIMARY_ROLES, dashboardPathForRole, type Role } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — L2R" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [needsRole, setNeedsRole] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles").select("primary_role").eq("user_id", user.id).maybeSingle();
      const existing = profile?.primary_role as Role | null | undefined;
      if (existing && ["parent", "student", "instructor", "administrator"].includes(existing)) {
        navigate({ to: dashboardPathForRole(existing) as never });
        return;
      }
      const { data: claimed } = await supabase.rpc("claim_instructor_invitation");
      if (claimed === true) {
        navigate({ to: dashboardPathForRole("instructor") as never });
        return;
      }
      setNeedsRole(true);
      setChecking(false);
    })();
  }, [user, loading, navigate]);

  async function pickRole(role: Role) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: user.id, role });
      if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName = (meta.full_name as string) || (meta.name as string) || (meta.preferred_name as string) || null;
      const avatar = (meta.avatar_url as string) || (meta.picture as string) || null;
      await supabase.from("profiles").upsert({
        user_id: user.id,
        email: user.email ?? null,
        preferred_name: fullName,
        avatar_url: avatar,
        primary_role: role,
      });
      navigate({ to: dashboardPathForRole(role) as never });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save role");
    } finally {
      setBusy(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!needsRole) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40_30%_97%)] via-background to-[hsl(140_25%_96%)] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-10 rounded-3xl border-border/60 shadow-lg">
        <div className="text-center mb-8">
          <img src={logoAsset.url} alt="L2R" className="h-16 w-16 rounded-2xl object-cover mx-auto mb-5 shadow-sm" />
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to Left2Right Education Hub</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            We're delighted to have you join our learning community. Let's begin by identifying how you'll be participating.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRIMARY_ROLES.map((r) => (
            <button
              key={r.value}
              disabled={busy}
              onClick={() => pickRole(r.value)}
              className="text-center rounded-3xl border border-border/60 p-8 hover:border-primary/50 hover:bg-accent/40 hover:shadow-md transition-all disabled:opacity-60"
            >
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <r.icon className="h-7 w-7" />
              </div>
              <div className="mt-4 text-lg font-semibold">{r.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{r.description}</div>
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
        <div className="mt-8 text-center">
          <Button variant="ghost" size="sm" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}