import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Sparkles, BookOpen, Headphones, Download, Sprout, Shield, Home, LogOut, LogIn, Compass, Video, Tag, Search as SearchIcon, Bookmark } from "lucide-react";
import logoAsset from "@/assets/l2r-logo.jpg.asset.json";
import { useAuthUser, useUserRoles } from "@/lib/hub-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MascotScene, Mascot } from "@/components/mascots/MascotScene";

export const Route = createFileRoute("/hub")({
  head: () => ({
    meta: [
      { title: "Family Growth Hub — L2R Education Hub" },
      {
        name: "description",
        content:
          "A warm library of articles, podcasts and resources for parents, students and educators on the L2R journey.",
      },
      { property: "og:title", content: "Family Growth Hub" },
      {
        property: "og:description",
        content: "Trusted family learning library by L2R Education Hub.",
      },
    ],
  }),
  component: HubLayout,
});

const tabs = [
  { to: "/hub/featured", title: "Featured", icon: Sparkles },
  { to: "/hub/articles", title: "Articles", icon: BookOpen },
  { to: "/hub/podcasts", title: "Podcasts", icon: Headphones },
  { to: "/hub/videos", title: "Videos", icon: Video },
  { to: "/hub/downloads", title: "Downloads", icon: Download },
  { to: "/hub/categories", title: "Categories", icon: Tag },
  { to: "/hub/search", title: "Search", icon: SearchIcon },
  { to: "/hub/bookmarks", title: "Bookmarks", icon: Bookmark },
] as const;

function HubLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuthUser();
  const { isStaff } = useUserRoles(user?.id);
  const navigate = useNavigate();

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/hub/featured" });
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-sand/40 via-background to-sage/25">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <Link to="/" className="flex items-center gap-3 px-2 py-3">
              <img src={logoAsset.url} alt="L2R" className="h-9 w-9 rounded-xl object-cover shrink-0" />
              <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">L2R</span>
                <span className="text-sm font-semibold">Education Hub</span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigate</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/"><Home className="h-4 w-4" /><span>Home</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/compass"><Compass className="h-4 w-4" /><span>L2R Compass</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>
                <Sprout className="inline h-3 w-3 mr-1" /> Family Growth Hub
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {tabs.map((t) => (
                    <SidebarMenuItem key={t.to}>
                      <SidebarMenuButton asChild isActive={isActive(t.to)}>
                        <Link to={t.to}>
                          <t.icon className="h-4 w-4" />
                          <span>{t.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {isStaff && (
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/hub/admin")}>
                        <Link to="/hub/admin"><Shield className="h-4 w-4" /><span>Manage Content</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter>
            <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {user ? (
                <div className="space-y-2">
                  <div className="truncate">{user.email}</div>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </Button>
                </div>
              ) : (
                <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Link to="/auth"><LogIn className="h-3.5 w-3.5" /> Sign in</Link>
                </Button>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="relative flex-1 flex flex-col min-w-0">
          <MascotScene variant="hub" />
          <header className="sticky top-0 z-10 h-14 flex items-center gap-2 border-b border-border/60 bg-background/80 backdrop-blur px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sprout className="h-4 w-4 text-primary" />
              Family Growth Hub
              <Mascot shape="blob" tone="green" mood="smile" size={26} animate="sway" className="ml-1" />
            </div>
          </header>
          <main className="relative flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}