import { useGetGuild } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Hash, Shield, Users, Volume2 } from "lucide-react";

export default function Overview() {
  const { guildId } = useParams();
  const { data: guild, isLoading } = useGetGuild(guildId!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  const textChannels = guild?.channels.filter(c => c.type === 0).length || 0;
  const voiceChannels = guild?.channels.filter(c => c.type === 2).length || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-lg">Server statistics and quick information for {guild?.name}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Members</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">???</div>
            <p className="text-xs text-muted-foreground mt-1">Users in the server</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Text Channels</CardTitle>
            <Hash className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{textChannels}</div>
            <p className="text-xs text-muted-foreground mt-1">Active text channels</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Voice Channels</CardTitle>
            <Volume2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{voiceChannels}</div>
            <p className="text-xs text-muted-foreground mt-1">Active voice channels</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Roles</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{guild?.roles.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Server roles configured</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/30 border border-border rounded-lg p-8 text-center flex flex-col items-center justify-center">
        <h3 className="text-xl font-semibold mb-2">Welcome to Rova Dashboard</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Use the navigation menu on the left to configure the bot for your server. Every setting is instantly saved when changed.
        </p>
      </div>
    </div>
  );
}
