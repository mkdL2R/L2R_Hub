import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, type LucideIcon } from "lucide-react";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export type NavItem = { to: string; label: string; icon: LucideIcon; desc: string };

export function DashboardShell({
  roleLabel,
  title,
  subtitle,
  items,
}: {
  roleLabel: string;
  title: string;
  subtitle: string;
  items: NavItem[];
}) {
  const { user } = useAuthUser();
  const [name, setName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("preferred_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.preferred_name ?? null);
        setAvatar(data?.avatar_url ?? null);
      });
  }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40_30%_97%)] via-background to-[hsl(140_25%_96%)]">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="L2R" className="h-9 w-9 rounded-xl object-cover" />
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">L2R Education Hub</div>
              <div className="text-sm font-semibold">{roleLabel}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {avatar ? (
              <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-border/60" />
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link to="/_authenticated/profile"><UserCircle className="h-4 w-4 mr-1.5" />Profile</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1.5" />Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          {title}{name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="group">
              <Card className="p-6 rounded-2xl border-border/60 hover:border-primary/40 hover:shadow-md transition-all">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <it.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-semibold">{it.label}</div>
                <div className="text-sm text-muted-foreground mt-1">{it.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}