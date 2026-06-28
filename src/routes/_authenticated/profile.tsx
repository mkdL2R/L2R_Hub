import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useUserRoles } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — L2R" }] }),
  component: ProfilePage,
});

type Profile = {
  preferred_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  notification_prefs: { email?: boolean; sms?: boolean; product_updates?: boolean };
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuthUser();
  const { roles } = useUserRoles(user?.id);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("preferred_name, avatar_url, phone, email, notification_prefs")
      .eq("user_id", user.id).maybeSingle().then(({ data }) => {
        setProfile(data as Profile | null ?? {
          preferred_name: "", avatar_url: "", phone: "", email: user.email ?? "",
          notification_prefs: { email: true, sms: false, product_updates: true },
        });
      });
  }, [user]);

  async function save() {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      preferred_name: profile.preferred_name,
      avatar_url: profile.avatar_url,
      phone: profile.phone,
      email: profile.email,
      notification_prefs: profile.notification_prefs,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading || !profile) return <div className="p-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const initials = (profile.preferred_name || profile.email || "?").slice(0, 2).toUpperCase();
  const np = profile.notification_prefs ?? {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40_30%_97%)] via-background to-[hsl(140_25%_96%)] py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
        </Link>
        <Card className="mt-6 rounded-3xl p-8 border-border/60">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
              <div className="text-sm text-muted-foreground">
                {roles.filter((r) => ["parent","student","instructor","administrator"].includes(r)).join(" · ") || "Member"}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <Field label="Preferred name">
              <Input value={profile.preferred_name ?? ""} onChange={(e) => setProfile({ ...profile, preferred_name: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={profile.email ?? ""} disabled />
            </Field>
            <Field label="Phone">
              <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </Field>
            <Field label="Avatar URL">
              <Input value={profile.avatar_url ?? ""} placeholder="https://…" onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} />
            </Field>

            <div className="pt-2">
              <Label className="text-sm">Notifications</Label>
              <div className="mt-3 space-y-3">
                <Toggle label="Email updates" checked={!!np.email} onChange={(v) => setProfile({ ...profile, notification_prefs: { ...np, email: v } })} />
                <Toggle label="SMS reminders" checked={!!np.sms} onChange={(v) => setProfile({ ...profile, notification_prefs: { ...np, sms: v } })} />
                <Toggle label="Product updates" checked={!!np.product_updates} onChange={(v) => setProfile({ ...profile, notification_prefs: { ...np, product_updates: v } })} />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={signOut} className="text-muted-foreground"><LogOut className="h-4 w-4 mr-1.5" />Sign out</Button>
            <Button onClick={save} disabled={saving} className="rounded-full">{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}