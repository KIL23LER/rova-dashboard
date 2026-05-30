import { Link, useLocation, useParams } from "wouter";
import { useGetMe, useLogout, useGetGuild, getGetGuildQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Settings, 
  UserPlus, 
  ShieldAlert, 
  ShieldBan, 
  TrendingUp, 
  Ticket, 
  Lightbulb, 
  UserCheck, 
  TerminalSquare, 
  Gift, 
  FileText,
  LogOut,
  ChevronLeft,
  Menu
} from "lucide-react";
import { getGuildIconUrl, getAvatarFallback } from "@/lib/discord";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "General", href: "/general", icon: Settings },
  { label: "Welcome & Leave", href: "/welcome", icon: UserPlus },
  { label: "Moderation", href: "/moderation", icon: ShieldAlert },
  { label: "Anti-Nuke", href: "/antinuke", icon: ShieldBan },
  { label: "Leveling", href: "/leveling", icon: TrendingUp },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Suggestions", href: "/suggestions", icon: Lightbulb },
  { label: "Auto-Roles", href: "/autoroles", icon: UserCheck },
  { label: "Custom Commands", href: "/commands", icon: TerminalSquare },
  { label: "Giveaways", href: "/giveaways", icon: Gift },
  { label: "Logging", href: "/logging", icon: FileText },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const guildId = params.guildId as string;
  const { data: user } = useGetMe();
  const { data: guild } = useGetGuild(guildId, { query: { enabled: !!guildId, queryKey: getGetGuildQueryKey(guildId) } });
  const logout = useLogout({ mutation: { onSuccess: () => setLocation("/") } });
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <nav className="space-y-1 py-4">
      {NAV_ITEMS.map((item) => {
        const fullHref = `/dashboard/${guildId}${item.href}`;
        const isActive = location === fullHref;
        const Icon = item.icon;
        
        return (
          <Link key={item.label} href={fullHref} onClick={() => setMobileOpen(false)}>
            <div className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-colors cursor-pointer text-sm font-medium ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="h-5 w-5" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-card border-r-border">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">R</div>
                <span className="font-semibold">Rova Dashboard</span>
              </div>
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={getGuildIconUrl(guildId, guild?.icon)} />
                  <AvatarFallback>{getAvatarFallback(guild?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="font-medium text-sm truncate">{guild?.name || "Loading..."}</span>
                  <span className="text-xs text-muted-foreground truncate">Server Settings</span>
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(100vh-140px)]">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
             <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={getGuildIconUrl(guildId, guild?.icon)} />
                <AvatarFallback>{getAvatarFallback(guild?.name)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm truncate max-w-[120px]">{guild?.name || "Server"}</span>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 h-screen sticky top-0">
        <div className="p-5 flex items-center gap-3 border-b border-border">
          <Link href="/servers" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-primary rounded shadow-sm flex items-center justify-center text-primary-foreground font-bold text-sm">R</div>
            <span className="font-bold tracking-tight">Rova Bot</span>
          </div>
        </div>
        
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shadow-sm border border-border bg-muted">
              <AvatarImage src={getGuildIconUrl(guildId, guild?.icon)} />
              <AvatarFallback>{getAvatarFallback(guild?.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm truncate">{guild?.name || "Loading..."}</span>
              <span className="text-xs text-muted-foreground truncate">Dashboard</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <NavLinks />
        </div>
        
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined} />
                <AvatarFallback>{getAvatarFallback(user?.username)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{user?.globalName || user?.username}</span>
                <span className="text-xs text-muted-foreground">{user?.username}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout.mutate()} title="Logout" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-background">
        <div className="max-w-5xl mx-auto p-4 md:p-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
