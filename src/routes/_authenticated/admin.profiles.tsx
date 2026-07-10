import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useUserRoles } from "@/lib/hub-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Trash2, X, Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/profiles")({
  head: () => ({
    meta: [
      { title: "Admin — Profiles" },
      { name: "description", content: "Manage families, parents, and students." },
    ],
  }),
  component: AdminProfiles,
});

type Row = {
  user_id: string;
  email: string | null;
  preferred_name: string | null;
  primary_role: string | null;
  status: string | null;
  created_at: string;
  family_id: string | null;
  family_name: string | null;
  journey: string | null;
  onboarding_status: string | null;
  current_step: number | null;
  total_steps: number | null;
};

function AdminProfiles() {
  const { user, loading: userLoading } = useAuthUser();
  const { isStaff, loading: rolesLoading } = useUserRoles(user?.id);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_list_profiles" as never);
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows((data as unknown as Row[]) ?? []);
  }, []);

  useEffect(() => {
    if (isStaff) void load();
  }, [isStaff, load]);

  if (userLoading || rolesLoading) return <div className="p-8">Loading…</div>;
  if (!isStaff) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border/60 bg-card p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Staff only</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have access to this page.</p>
      </div>
    );
  }

  async function setStatus(userId: string, status: "approved" | "rejected" | "pending") {
    setBusy(userId);
    const { error } = await supabase.rpc(
      "admin_set_profile_status" as never,
      { _user_id: userId, _status: status } as never,
    );
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    void load();
  }

  async function del(userId: string) {
    if (!confirm("Delete this profile and all their data? This cannot be undone.")) return;
    setBusy(userId);
    const { error } = await supabase.rpc(
      "admin_delete_profile_data" as never,
      { _user_id: userId } as never,
    );
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    void load();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Profiles</h1>
          <p className="text-muted-foreground">Approve, reject, or delete family and student profiles.</p>
        </div>
        <Button variant="outline" onClick={() => load()}>Refresh</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Family</th>
              <th className="px-4 py-3">Journey</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No profiles yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.user_id} className="border-t border-border/60">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.preferred_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.email ?? "—"}</div>
                </td>
                <td className="px-4 py-3">{r.primary_role ?? "—"}</td>
                <td className="px-4 py-3">{r.family_name ?? "—"}</td>
                <td className="px-4 py-3">
                  {r.journey ? (
                    <span>
                      {r.journey} · {r.current_step ?? 0}/{r.total_steps ?? 0}
                      {r.onboarding_status ? ` · ${r.onboarding_status}` : ""}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                    {r.status ?? "pending"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={busy === r.user_id} onClick={() => setStatus(r.user_id, "approved")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === r.user_id} onClick={() => setStatus(r.user_id, "rejected")}>
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" disabled={busy === r.user_id} onClick={() => del(r.user_id)}>
                      {busy === r.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}