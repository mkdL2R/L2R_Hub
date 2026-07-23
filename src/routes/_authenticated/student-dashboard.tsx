import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/student-dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard — L2R" }] }),
  component: StudentDashboardLayout,
});

function StudentDashboardLayout() {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-ivory">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <Link to="/" className="flex items-center gap-2">
                <img src={logoAsset.url} alt="L2R" className="h-8 w-8 rounded-lg object-cover" />
                <div className="leading-tight hidden sm:block">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">L2R Education Hub</div>
                  <div className="text-sm font-semibold">Student Dashboard</div>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile"><UserCircle className="h-4 w-4 mr-1.5" />Profile</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1.5" />Sign out
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}