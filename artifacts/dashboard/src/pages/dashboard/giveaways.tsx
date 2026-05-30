import { useGetGiveaways, useGetGuild } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Clock, Users, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Giveaways() {
  const { guildId } = useParams();
  const { data: giveaways, isLoading } = useGetGiveaways(guildId!);
  const { data: guild } = useGetGuild(guildId!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    );
  }

  const getChannelName = (id: string) => {
    const channel = guild?.channels.find(c => c.id === id);
    return channel ? `#${channel.name}` : "Unknown Channel";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Giveaways</h1>
        <p className="text-muted-foreground mt-1 text-lg">Active and recent giveaways in your server.</p>
      </div>

      {giveaways && giveaways.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {giveaways.map((gw) => {
            const isEnded = gw.ended || gw.endsAt < Date.now();
            return (
              <Card key={gw.id} className={`bg-card overflow-hidden border-t-4 ${isEnded ? 'border-t-muted' : 'border-t-primary'}`}>
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <Gift className={isEnded ? "text-muted-foreground" : "text-primary"} />
                      {gw.prize}
                    </CardTitle>
                    {isEnded ? (
                      <span className="text-xs font-bold uppercase px-2 py-1 bg-muted text-muted-foreground rounded">Ended</span>
                    ) : (
                      <span className="text-xs font-bold uppercase px-2 py-1 bg-primary/20 text-primary border border-primary/30 rounded animate-pulse">Live</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Winners</span>
                      <span className="font-medium text-lg">{gw.winners}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Entries</span>
                      <span className="font-medium text-lg">{gw.entryCount || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 pt-3 border-t border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {isEnded ? "Ended" : "Ends"}
                      </span>
                      <span className="font-medium">
                        {isEnded 
                          ? new Date(gw.endsAt).toLocaleDateString() 
                          : formatDistanceToNow(gw.endsAt, { addSuffix: true })}
                        <span className="text-muted-foreground text-xs ml-2 font-normal">in {getChannelName(gw.channelId)}</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Gift className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Giveaways Found</h3>
            <p className="text-muted-foreground">Start a giveaway using bot commands in your server.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
