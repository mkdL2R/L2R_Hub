import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, PRIMARY_ROLES, type Role } from "@/lib/hub-auth";
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
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const primary = (roles ?? []).map((r) => r.role as Role).find((r) =>
        ["parent", "student", "instructor", "administrator"].includes(r as string)
      );
      if (primary) {
        navigate({ to: "/_authenticated/dashboard" });
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
      await supabase.from("profiles").upsert({ user_id: user.id, email: user.email ?? null, primary_role: role });
      navigate({ to: "/_authenticated/dashboard" });
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
          <img src={logoAsset.url} alt="L2R" className="h-14 w-14 rounded-2xl object-cover mx-auto mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight">Tell us who's signing in</h1>
          <p className="mt-2 text-sm text-muted-foreground">We'll tailor your experience. You can adjust this later.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRIMARY_ROLES.map((r) => (
            <button
              key={r.value}
              disabled={busy}
              onClick={() => pickRole(r.value)}
              className="text-left rounded-2xl border border-border/60 p-5 hover:border-primary/50 hover:bg-accent/40 transition-all disabled:opacity-60"
            >
              <div className="text-3xl">{r.emoji}</div>
              <div className="mt-3 font-semibold">{r.label}</div>
              <div className="text-sm text-muted-foreground">{r.description}</div>
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