import { useGetGuilds, useGetMe, useLogout } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getGuildIconUrl, getAvatarFallback } from "@/lib/discord";
import { LogOut, Plus, Server, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

export default function Servers() {
  const { data: guilds, isLoading } = useGetGuilds();
  const { data: user } = useGetMe();
  const logout = useLogout({ mutation: { onSuccess: () => setLocation("/") } });
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold">R</div>
            <span className="font-bold text-xl">Rova</span>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full p-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Select a Server</h1>
            <p className="text-muted-foreground">Choose a server to configure Rova bot.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="bg-card">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold shadow-sm">R</div>
          <span className="font-bold text-xl tracking-tight">Rova</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 py-1.5 px-3 rounded-full border border-border">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined} />
              <AvatarFallback>{getAvatarFallback(user?.username)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.globalName || user?.username}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => logout.mutate()} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Select a Server</h1>
          <p className="text-lg text-muted-foreground">Choose a server to configure Rova bot or invite it to a new one.</p>
        </div>

        {guilds?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No servers found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You don't seem to have administrator permissions in any Discord servers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guilds?.map((guild) => (
              <Card key={guild.id} className={`flex flex-col transition-all duration-200 ${guild.botPresent ? 'border-primary/50 shadow-md hover:shadow-primary/20 hover:border-primary' : 'opacity-80 hover:opacity-100'}`}>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                    <AvatarImage src={getGuildIconUrl(guild.id, guild.icon)} />
                    <AvatarFallback className="text-lg font-bold bg-muted">{getAvatarFallback(guild.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-base truncate" title={guild.name}>{guild.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      {guild.memberCount.toLocaleString()} members
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-4 pb-4">
                  {guild.botPresent ? (
                    <Link href={`/dashboard/${guild.id}`}>
                      <Button className="w-full font-semibold" variant="default">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Bot
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" className="w-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => window.open(`https://discord.com/api/oauth2/authorize?client_id=ROVA_CLIENT_ID&permissions=8&scope=bot%20applications.commands&guild_id=${guild.id}`, '_blank')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Bot
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
