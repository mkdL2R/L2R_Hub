import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useIdentity } from "@/lib/identity";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your Dashboard — L2R" }] }),
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { loading, route } = useIdentity();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    navigate({ to: route as never, replace: true });
  }, [loading, route, navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}