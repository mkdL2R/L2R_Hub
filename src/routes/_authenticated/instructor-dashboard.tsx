import { createFileRoute } from "@tanstack/react-router";
import { Compass, Sprout, Users, BookOpen, Settings, UserCircle, TreeDeciduous, UserPlus } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/instructor-dashboard")({
  head: () => ({ meta: [{ title: "Instructor Admin — L2R" }] }),
  component: InstructorDashboard,
});

const ITEMS: NavItem[] = [
  { to: "/people", label: "People Management", icon: UserPlus, desc: "Invite instructors" },
  { to: "/hub/admin", label: "Content Admin", icon: Settings, desc: "Publish & manage Hub" },
  { to: "/hub", label: "Growth Hub", icon: Sprout, desc: "Library" },
  { to: "/compass", label: "Compass Summaries", icon: Compass, desc: "Family insights" },
  { to: "/living-tree", label: "Living Trees", icon: TreeDeciduous, desc: "Family timelines & notes" },
  { to: "/hub/articles", label: "Articles", icon: BookOpen, desc: "Teaching library" },
  { to: "/parent", label: "Family intakes", icon: Users, desc: "Review parent flow" },
  { to: "/profile", label: "Profile", icon: UserCircle, desc: "Account & preferences" },
];

function InstructorDashboard() {
  return (
    <DashboardShell
      roleLabel="Instructor Admin Dashboard"
      title="Welcome"
      subtitle="Administrative tools and learning library."
      items={ITEMS}
    />
  );
}