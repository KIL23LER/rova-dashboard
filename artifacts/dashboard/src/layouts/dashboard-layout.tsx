import { Link, useLocation, useParams } from "wouter";
import { useGetMe, useLogout, useGetGuild, getGetGuildQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Settings, UserPlus, ShieldAlert, ShieldBan,
  TrendingUp, Ticket, Lightbulb, UserCheck, TerminalSquare,
  Gift, FileText, LogOut, ChevronLeft, Menu, Coins, Mic2,
  Megaphone, Heart, Smile, Star, Bell, ChevronDown, ChevronRight
} from "lucide-react";
import { getGuildIconUrl, getAvatarFallback } from "@/lib/discord";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const NAV_SECTIONS = [
  {
    title: "عام",
    items: [
      { label: "نظرة عامة", href: "", icon: LayoutDashboard },
      { label: "الإعدادات", href: "/general", icon: Settings },
    ],
  },
  {
    title: "الأعضاء",
    items: [
      { label: "الترحيب والوداع", href: "/welcome", icon: UserPlus },
      { label: "الأدوار التلقائية", href: "/autoroles", icon: UserCheck },
      { label: "أدوار الريأكشن", href: "/reactionroles", icon: Star },
      { label: "أعياد الميلاد", href: "/birthday", icon: Heart },
    ],
  },
  {
    title: "الحماية",
    items: [
      { label: "الإشراف", href: "/moderation", icon: ShieldAlert },
      { label: "Anti-Nuke", href: "/antinuke", icon: ShieldBan },
      { label: "السجل", href: "/logging", icon: FileText },
    ],
  },
  {
    title: "المجتمع",
    items: [
      { label: "نظام المستويات", href: "/leveling", icon: TrendingUp },
      { label: "الاقتصاد", href: "/economy", icon: Coins },
      { label: "التذاكر", href: "/tickets", icon: Ticket },
      { label: "الاقتراحات", href: "/suggestions", icon: Lightbulb },
      { label: "السحوبات", href: "/giveaways", icon: Gift },
    ],
  },
  {
    title: "المحتوى",
    items: [
      { label: "البودكاست", href: "/podcast", icon: Mic2 },
      { label: "الإعلانات", href: "/announcements", icon: Megaphone },
      { label: "أوامر مخصصة", href: "/commands", icon: TerminalSquare },
    ],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const guildId = params.guildId as string;
  const { data: user } = useGetMe();
  const { data: guild } = useGetGuild(guildId, { query: { enabled: !!guildId, queryKey: getGetGuildQueryKey(guildId) } });
  const logout = useLogout({ mutation: { onSuccess: () => setLocation("/") } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsed(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const NavLinks = () => (
    <nav className="py-3 space-y-1">
      {NAV_SECTIONS.map((section) => {
        const isCollapsed = collapsed[section.title];
        return (
          <div key={section.title}>
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <span>{section.title}</span>
              {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {!isCollapsed && section.items.map((item) => {
              const fullHref = `/dashboard/${guildId}${item.href}`;
              const isActive = location === fullHref;
              const Icon = item.icon;
              return (
                <Link key={item.label} href={fullHref} onClick={() => setMobileOpen(false)}>
                  <div className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-md transition-all cursor-pointer text-sm font-medium ${isActive ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  const SidebarHeader = () => (
    <>
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
            <span className="text-xs text-muted-foreground">لوحة التحكم</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border flex flex-col">
              <SidebarHeader />
              <div className="flex-1 overflow-y-auto"><NavLinks /></div>
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined} />
                      <AvatarFallback>{getAvatarFallback(user?.username)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user?.globalName || user?.username}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => logout.mutate()} className="text-muted-foreground hover:text-destructive">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
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
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto">
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
            <Button variant="ghost" size="icon" onClick={() => logout.mutate()} title="تسجيل الخروج" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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
