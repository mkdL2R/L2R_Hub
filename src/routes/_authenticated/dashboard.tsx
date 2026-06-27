import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useUserRoles, type Role } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, Sprout, Users, GraduationCap, BookOpen, MessageSquare, Calendar, Settings, LogOut, UserCircle } from "lucide-react";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your Dashboard — L2R" }] }),
  component: Dashboard,
});

type NavItem = { to: string; label: string; icon: typeof Compass; desc: string };

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  parent: [
    { to: "/_authenticated/dashboard", label: "Family Dashboard", icon: Users, desc: "Your family at a glance" },
    { to: "/compass", label: "L2R Compass", icon: Compass, desc: "Your living family guide" },
    { to: "/hub", label: "Family Growth Hub", icon: Sprout, desc: "Articles, podcasts, resources" },
    { to: "/parent", label: "Parent Journey", icon: BookOpen, desc: "Family ecosystem form" },
  ],
  student: [
    { to: "/_authenticated/dashboard", label: "Learning Dashboard", icon: GraduationCap, desc: "Your learning home" },
    { to: "/student", label: "Student Journey", icon: BookOpen, desc: "Your learning profile" },
    { to: "/compass", label: "My Compass", icon: Compass, desc: "Your reflection" },
    { to: "/hub", label: "Growth Hub", icon: Sprout, desc: "Resources for you" },
  ],
  instructor: [
    { to: "/_authenticated/dashboard", label: "Classes", icon: Users, desc: "Your students" },
    { to: "/hub", label: "Resources", icon: BookOpen, desc: "Teaching library" },
    { to: "/compass", label: "Compass Summaries", icon: Compass, desc: "Student insights" },
  ],
  administrator: [
    { to: "/_authenticated/dashboard", label: "Admin Home", icon: Settings, desc: "Operations" },
    { to: "/hub/admin", label: "Content", icon: BookOpen, desc: "Manage Hub" },
    { to: "/compass", label: "Compass", icon: Compass, desc: "All families" },
    { to: "/hub", label: "Growth Hub", icon: Sprout, desc: "Library" },
  ],
};

const COMMON: NavItem[] = [
  { to: "/_authenticated/profile", label: "Profile", icon: UserCircle, desc: "Your account" },
];

function pickPrimary(roles: Role[]): keyof typeof NAV_BY_ROLE {
  if (roles.includes("administrator") || roles.includes("admin")) return "administrator";
  if (roles.includes("instructor")) return "instructor";
  if (roles.includes("parent")) return "parent";
  if (roles.includes("student")) return "student";
  return "parent";
}

function Dashboard() {
  const { user } = useAuthUser();
  const { roles, loading } = useUserRoles(user?.id);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("preferred_name").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.preferred_name ?? null));
  }, [user]);

  if (loading || !user) return <div className="p-10 text-muted-foreground">Loading your dashboard…</div>;

  const primary = pickPrimary(roles);
  const items = [...NAV_BY_ROLE[primary], ...COMMON];
  const roleLabel: Record<string, string> = {
    parent: "Parent", student: "Student", instructor: "Instructor", administrator: "Administrator",
  };

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
              <div className="text-sm font-semibold">{roleLabel[primary]} Dashboard</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/_authenticated/profile"><UserCircle className="h-4 w-4 mr-1.5" />Profile</Link></Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1.5" />Sign out</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back{name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-2 text-muted-foreground">Continue your family's journey, at your pace.</p>
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