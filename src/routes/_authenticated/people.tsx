import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useUserRoles } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Mail, UserPlus, ShieldCheck, ShieldOff, Copy, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { createInstructorInvite, revokeInstructorInvite } from "@/lib/invitations";

export const Route = createFileRoute("/_authenticated/people")({
  head: () => ({ meta: [{ title: "People Management — L2R" }] }),
  component: PeoplePage,
});

type Invite = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
  accepted_at: string | null;
  token: string;
};

function PeoplePage() {
  const { user, loading } = useAuthUser();
  const { roles, loading: rolesLoading } = useUserRoles(user?.id);
  const navigate = useNavigate();
  const isInstructor = roles.includes("instructor") || roles.includes("administrator") || roles.includes("admin");

  const [invites, setInvites] = useState<Invite[]>([]);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (loading || rolesLoading) return;
    if (!isInstructor) {
      navigate({ to: "/dashboard" as never, replace: true });
    }
  }, [loading, rolesLoading, isInstructor, navigate]);

  async function refresh() {
    setFetching(true);
    const { data, error } = await supabase
      .from("instructor_invitations")
      .select("id,email,full_name,status,created_at,accepted_at,token")
      .order("created_at", { ascending: false });
    if (!error) setInvites((data ?? []) as Invite[]);
    setFetching(false);
  }

  useEffect(() => {
    if (isInstructor) refresh();
  }, [isInstructor]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const clean = email.trim().toLowerCase();
    if (!clean) { setBusy(false); return; }
    try {
      const inv = await createInstructorInvite(user.id, clean, name);
      void navigator.clipboard.writeText(inv.url).catch(() => {});
      setInfo(`Invitation link for ${inv.email} copied to clipboard. Share it with them to accept.`);
      setName(""); setEmail("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  async function revoke(id: string) {
    await revokeInstructorInvite(id);
    refresh();
  }

  async function resend(inv: Invite) {
    if (!user) return;
    try {
      const fresh = await createInstructorInvite(user.id, inv.email, inv.full_name ?? undefined);
      await navigator.clipboard.writeText(fresh.url).catch(() => {});
      toast.success(`New invitation link for ${inv.email} copied.`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  function copyInviteLink(inv: Invite) {
    const url = `${window.location.origin}/invite?token=${inv.token}`;
    void navigator.clipboard.writeText(url);
    toast.success(`Invitation link for ${inv.email} copied`);
  }

  if (loading || rolesLoading || !isInstructor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40_30%_97%)] via-background to-[hsl(140_25%_96%)] py-10 px-6">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/instructor-dashboard"><ArrowLeft className="h-4 w-4 mr-1.5" /> Back</Link>
        </Button>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">People Management</h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-xl">
            Invite trusted colleagues. Instructor accounts are invitation-only — invited users are auto-promoted the first time they sign in with Google using the invited email address.
          </p>
          <p className="mt-2 text-xs text-muted-foreground max-w-xl">
            Automatic email delivery is coming soon. For now, share the sign-in link with each invitee directly.
          </p>
        </div>

        <Card className="p-6 rounded-2xl border-border/60 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Invite Instructor</h2>
          </div>
          <form onSubmit={sendInvite} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={busy} className="rounded-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4 mr-1.5" /> Send invitation</>}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {info && <p className="text-sm text-emerald-700">{info}</p>}
            </div>
          </form>
        </Card>

        <Card className="p-6 rounded-2xl border-border/60">
          <h2 className="font-semibold mb-4">Invitations</h2>
          {fetching ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invitations yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {invites.map((i) => (
                <li key={i.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.full_name || i.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{i.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={i.status === "accepted" ? "default" : i.status === "revoked" ? "secondary" : "outline"}>
                      {i.status === "accepted" ? <ShieldCheck className="h-3 w-3 mr-1" /> : i.status === "revoked" ? <ShieldOff className="h-3 w-3 mr-1" /> : null}
                      {i.status}
                    </Badge>
                    {i.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => copyInviteLink(i)} title="Copy invitation link">
                          <Copy className="h-4 w-4 mr-1.5" /> Copy link
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => resend(i)} title="Refresh invitation">
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => revoke(i.id)}>Revoke</Button>
                      </>
                    )}
                    {i.status === "revoked" && (
                      <Button size="sm" variant="ghost" onClick={() => resend(i)}>Reinvite</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}