import { createFileRoute } from "@tanstack/react-router";
import { Compass, Sprout, BookOpen, GraduationCap, UserCircle } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/_authenticated/student-dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard — L2R" }] }),
  component: StudentDashboard,
});

const ITEMS: NavItem[] = [
  { to: "/student", label: "Student Journey", icon: GraduationCap, desc: "Your learning profile" },
  { to: "/compass", label: "My Compass", icon: Compass, desc: "Your reflection" },
  { to: "/hub", label: "Growth Hub", icon: Sprout, desc: "Resources for you" },
  { to: "/hub/articles", label: "Articles", icon: BookOpen, desc: "Read & listen" },
  { to: "/_authenticated/profile", label: "Profile", icon: UserCircle, desc: "Account & preferences" },
];

function StudentDashboard() {
  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Hi"
      subtitle="Your learning home — explore, reflect, and grow."
      items={ITEMS}
    />
  );
}