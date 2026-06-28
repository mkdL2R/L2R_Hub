import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, dashboardPathForRole, type Role } from "@/lib/hub-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your Dashboard — L2R" }] }),
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { user, loading } = useAuthUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles").select("primary_role").eq("user_id", user.id).maybeSingle();
      const role = data?.primary_role as Role | null | undefined;
      if (!role) {
        navigate({ to: "/_authenticated/onboarding" as never, replace: true });
        return;
      }
      navigate({ to: dashboardPathForRole(role) as never, replace: true });
    })();
  }, [user, loading, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}