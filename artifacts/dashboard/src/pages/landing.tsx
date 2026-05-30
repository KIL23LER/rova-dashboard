import { Button } from "@/components/ui/button";
import { useGetBotStats } from "@workspace/api-client-react";
import { Bot, Shield, Zap, Activity } from "lucide-react";

export default function Landing() {
  const { data: stats } = useGetBotStats();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30">
      {/* Nav */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-lg shadow-primary/20 shadow-lg">R</div>
          <span className="font-bold text-xl tracking-tight">Rova</span>
        </div>
        <Button asChild className="font-semibold shadow-md">
          <a href="/api/auth/discord">Login with Discord</a>
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        <section className="py-24 md:py-32 px-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 relative z-10">
            <Zap className="h-4 w-4" />
            <span>The ultimate server management tool</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6 relative z-10">
            Power up your Discord community with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">precision</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mb-10 relative z-10">
            A sleek, dark-themed control panel to configure every aspect of your bot in one place. No commands needed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 relative z-10">
            <Button size="lg" asChild className="text-base h-14 px-8 font-semibold shadow-lg shadow-primary/20">
              <a href="/api/auth/discord">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-14 px-8">
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 border-y border-border bg-card/30">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50">
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stats?.guildCount ? stats.guildCount.toLocaleString() : "..."}
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Servers</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stats?.memberCount ? (stats.memberCount / 1000000).toFixed(1) + "M" : "..."}
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Users</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stats?.commandCount ? stats.commandCount.toLocaleString() : "..."}
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Commands Executed</span>
            </div>
            <div className="flex flex-col items-center text-center px-4">
              <span className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {stats?.uptime || "..."}
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Uptime</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need, nothing you don't</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rova provides a comprehensive suite of tools to manage your server effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Advanced Moderation</h3>
              <p className="text-muted-foreground">
                Protect your server with automod, anti-nuke, anti-spam, and comprehensive logging. Keep your community safe effortlessly.
              </p>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Leveling System</h3>
              <p className="text-muted-foreground">
                Engage your members with a customizable XP and leveling system. Set custom level-up messages and roles.
              </p>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Custom Commands</h3>
              <p className="text-muted-foreground">
                Create custom text responses to common questions. Manage autoroles, giveaways, and ticket systems from the dashboard.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} Rova Dashboard. Built for Discord Administrators.</p>
      </footer>
    </div>
  );
}
