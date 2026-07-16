import { createFileRoute } from "@tanstack/react-router";
import { Compass, Sprout, BookOpen, GraduationCap, UserCircle, TreeDeciduous, Award, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/hub-auth";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/student-dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard — L2R" }] }),
  component: StudentDashboard,
});

const ITEMS: NavItem[] = [
  { to: "/student", label: "Student Journey", icon: GraduationCap, desc: "Your learning profile" },
  { to: "/compass", label: "My Compass", icon: Compass, desc: "Your reflection" },
  { to: "/living-tree", label: "The Living Tree", icon: TreeDeciduous, desc: "Your growth journey" },
  { to: "/hub", label: "Growth Hub", icon: Sprout, desc: "Resources for you" },
  { to: "/hub/articles", label: "Articles", icon: BookOpen, desc: "Read & listen" },
  { to: "/profile", label: "Profile", icon: UserCircle, desc: "Account & preferences" },
];

function StudentDashboard() {
  const { user } = useAuthUser();
  const [ribbons, setRibbons] = useState<Ribbon[]>(DEFAULT_RIBBONS);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: savedCount }, { data: family }] = await Promise.all([
        supabase
          .from("hub_saved_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.from("family_members").select("family_id").eq("user_id", user.id).maybeSingle(),
      ]);
      let compassDone = false;
      let hasStudent = false;
      if (family?.family_id) {
        const [{ data: eco }, { data: stu }] = await Promise.all([
          supabase
            .from("ecosystem_profiles")
            .select("daily_routine")
            .eq("family_id", family.family_id)
            .maybeSingle(),
          supabase.from("students").select("id").eq("family_id", family.family_id).limit(1).maybeSingle(),
        ]);
        compassDone = !!(eco?.daily_routine && typeof eco.daily_routine === "object" && "compass" in (eco.daily_routine as object));
        hasStudent = !!stu;
      }
      setRibbons([
        { key: "journey", label: "First Reflection", desc: "Started the student journey", earned: hasStudent, color: "text-mustard-foreground bg-mustard/30" },
        { key: "compass", label: "Compass Unlocked", desc: "Your Compass has been generated", earned: compassDone, color: "text-sketch bg-sketch/15" },
        { key: "reader", label: "Curious Reader", desc: "Saved 3 items in the Hub", earned: (savedCount ?? 0) >= 3, color: "text-crayon bg-crayon/15" },
        { key: "explorer", label: "Map Explorer", desc: "Opened the Hub map view", earned: typeof window !== "undefined" && !!localStorage.getItem("l2r:hub-map-seen"), color: "text-forest bg-forest/15" },
      ]);
    })();
  }, [user]);

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Hi"
      subtitle="Your learning home — explore, reflect, and grow."
      items={ITEMS}
      marginNote="a notebook, not a scoreboard"
      footer={<RibbonsPanel ribbons={ribbons} />}
    />
  );
}

type Ribbon = { key: string; label: string; desc: string; earned: boolean; color: string };

const DEFAULT_RIBBONS: Ribbon[] = [
  { key: "journey", label: "First Reflection", desc: "Started the student journey", earned: false, color: "text-mustard-foreground bg-mustard/30" },
  { key: "compass", label: "Compass Unlocked", desc: "Your Compass has been generated", earned: false, color: "text-sketch bg-sketch/15" },
  { key: "reader", label: "Curious Reader", desc: "Saved 3 items in the Hub", earned: false, color: "text-crayon bg-crayon/15" },
  { key: "explorer", label: "Map Explorer", desc: "Opened the Hub map view", earned: false, color: "text-forest bg-forest/15" },
];

function RibbonsPanel({ ribbons }: { ribbons: Ribbon[] }) {
  const earned = ribbons.filter((r) => r.earned).length;
  return (
    <section className="card-paper p-6">
      <div className="flex items-center gap-3">
        <div className="icon-badge h-10 w-10 text-crayon"><Award className="h-5 w-5" /></div>
        <div>
          <h2 className="font-serif text-2xl">Your notebook ribbons</h2>
          <p className="text-sm text-muted-foreground">
            {earned} of {ribbons.length} earned — little marks for real steps.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ribbons.map((r) => (
          <div
            key={r.key}
            className={`rounded-2xl border p-4 transition-all ${
              r.earned
                ? `${r.color} border-transparent shadow-sm`
                : "border-dashed border-border/60 bg-card/30 text-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              {r.earned ? <Award className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span className="font-serif text-lg leading-tight">{r.label}</span>
            </div>
            <p className="mt-1 text-xs">{r.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}