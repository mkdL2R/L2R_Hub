import { createFileRoute } from "@tanstack/react-router";
import { Compass, Sprout, Users, BookOpen, UserCircle } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/family-dashboard")({
  head: () => ({ meta: [{ title: "Family Dashboard — L2R" }] }),
  component: FamilyDashboard,
});

const ITEMS: NavItem[] = [
  { to: "/parent", label: "Parent Journey", icon: Users, desc: "Family ecosystem intake" },
  { to: "/compass", label: "L2R Compass", icon: Compass, desc: "Your living family guide" },
  { to: "/hub", label: "Family Growth Hub", icon: Sprout, desc: "Articles, podcasts, resources" },
  { to: "/student", label: "Add a child's profile", icon: BookOpen, desc: "Start a student journey" },
  { to: "/profile", label: "Profile", icon: UserCircle, desc: "Account & preferences" },
];

function FamilyDashboard() {
  return (
    <DashboardShell
      roleLabel="Family Dashboard"
      title="Welcome back"
      subtitle="Continue your family's journey, at your pace."
      items={ITEMS}
    />
  );
}