import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, Home, Compass, BookOpen, MessageCircle, CalendarDays, Sparkles, type LucideIcon } from "lucide-react";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";
import { Mascot } from "@/components/mascots/Mascot";
import { SketchDivider } from "@/components/sketch/SketchDivider";

export type NavItem = { to: string; label: string; icon: LucideIcon; desc: string };

const JOURNAL_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/compass", label: "My Compass", icon: Compass },
  { to: "/living-tree", label: "Learning Journey", icon: Sparkles },
  { to: "/hub", label: "Resources", icon: BookOpen },
  { to: "/profile", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Calendar", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

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
    <div className="min-h-screen grain">
      <div className="flex min-h-screen">
        {/* Journal sidebar */}
        <aside className="hidden md:flex md:w-60 shrink-0 flex-col gap-1 border-r-[1.5px] border-ink/20 bg-sidebar/70 backdrop-blur px-4 py-6">
          <Link to="/" className="mb-6 flex items-center gap-2">
            <img src={logoAsset.url} alt="L2R" className="h-10 w-10 rounded-xl object-cover ink-border" />
            <div className="leading-tight">
              <div className="handwritten text-2xl leading-none">Left2Right</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Learning Journal</div>
            </div>
          </Link>
          <nav className="flex flex-col gap-0.5">
            {JOURNAL_NAV.map((n, i) => (
              <Link
                key={i}
                to={n.to}
                className="group flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-card hover:text-foreground transition-colors"
              >
                <n.icon className="h-4 w-4" />
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-6">
            <SketchDivider className="mb-4 h-3 w-full text-ink/40" />
            <div className="flex items-center gap-3">
              {avatar ? (
                <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover ink-border" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-full bg-card ink-border">
                  <UserCircle className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-semibold">{name ?? "You"}</div>
                <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{roleLabel}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1.5" />Sign out
            </Button>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="md:hidden border-b-[1.5px] border-ink/20 bg-card/80 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center justify-between px-4 py-3">
              <Link to="/" className="flex items-center gap-2">
                <img src={logoAsset.url} alt="L2R" className="h-8 w-8 rounded-lg object-cover ink-border" />
                <span className="handwritten text-xl">Left2Right</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            {/* Welcome block */}
            <section className="relative overflow-hidden paper-card p-6 sm:p-8">
              <div aria-hidden className="absolute -right-6 -top-6 opacity-90">
                <Mascot shape="star" color="yellow" size={96} float mood="wow" />
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{roleLabel}</div>
                  <h1 className="mt-1 handwritten text-4xl sm:text-5xl leading-tight text-foreground">
                    {title}{name ? `, ${name}` : ""}.
                  </h1>
                  <p className="mt-2 max-w-xl text-sm sm:text-base text-muted-foreground">{subtitle}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink/40 bg-card px-3 py-1 text-xs font-semibold">
                      <span className="h-2 w-2 rounded-full bg-leaf" /> Currently learning
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink/40 bg-sun/40 px-3 py-1 text-xs font-semibold">
                      Growing every day
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 flex items-end justify-between">
              <h2 className="handwritten text-3xl">Your journal</h2>
              <SketchDivider className="ml-4 h-3 flex-1 text-ink/25" />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it, i) => (
                <Link key={it.to + i} to={it.to} className="group">
                  <Card className="relative p-6 hover-lift">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-[10px] border-[1.5px] border-ink/40 bg-sun/40">
                        <it.icon className="h-5 w-5" />
                      </div>
                      <div className="font-serif text-2xl leading-none">{it.label}</div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">{it.desc}</div>
                    <div className="mt-5 h-2 w-full overflow-hidden rounded-full border-[1.5px] border-ink/40 bg-muted">
                      <div
                        className="h-full bg-sun"
                        style={{ width: `${20 + ((i * 17) % 70)}%` }}
                      />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Footer strip with mascots */}
            <div className="mt-12 flex items-center justify-between paper-card px-6 py-5">
              <div>
                <div className="handwritten text-2xl">Keep going.</div>
                <p className="text-sm text-muted-foreground">Small steps every week become a whole story.</p>
              </div>
              <div className="flex items-center gap-2">
                <Mascot shape="circle" color="green" size={44} float />
                <Mascot shape="drop" color="blue" size={44} float mood="wink" />
                <Mascot shape="triangle" color="red" size={44} float />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}