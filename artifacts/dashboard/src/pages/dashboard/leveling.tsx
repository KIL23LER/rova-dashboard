import { useGetLevelingConfig, useUpdateLevelingConfig, getGetLevelingConfigQueryKey, useGetLeaderboard, useGetGuild } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";

const formSchema = z.object({
  enabled: z.boolean(),
  xpMin: z.coerce.number().min(1),
  xpMax: z.coerce.number().min(2),
  cooldownSeconds: z.coerce.number().min(1),
  levelupChannel: z.string().nullable().optional(),
  levelupMessage: z.string().optional(),
});

export default function Leveling() {
  const { guildId } = useParams();
  const { data: config, isLoading: isLoadingConfig } = useGetLevelingConfig(guildId!);
  const { data: leaderboard, isLoading: isLoadingLb } = useGetLeaderboard(guildId!);
  const { data: guild } = useGetGuild(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const textChannels = guild?.channels.filter(c => c.type === 0) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: false,
      xpMin: 15,
      xpMax: 25,
      cooldownSeconds: 60,
      levelupChannel: "",
      levelupMessage: "GG {user}, you advanced to level {level}!",
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled,
        xpMin: config.xpMin || 15,
        xpMax: config.xpMax || 25,
        cooldownSeconds: config.cooldownSeconds || 60,
        levelupChannel: config.levelupChannel || "",
        levelupMessage: config.levelupMessage || "GG {user}, you advanced to level {level}!",
      });
    }
  }, [config, form]);

  const updateConfig = useUpdateLevelingConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leveling settings saved" });
        queryClient.invalidateQueries({ queryKey: getGetLevelingConfigQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error saving settings", variant: "destructive" })
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateConfig.mutate({ guildId: guildId!, data: { ...values, levelupChannel: values.levelupChannel || null } });
  };

  if (isLoadingConfig || isLoadingLb) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leveling System</h1>
          <p className="text-muted-foreground mt-1 text-lg">Reward active members with XP and levels.</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={updateConfig.isPending || !form.formState.isDirty}>
          <Save className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <Form {...form}>
            <form className="space-y-6">
              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable System</FormLabel>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("enabled") && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="xpMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min XP / Msg</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="xpMax"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max XP / Msg</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="cooldownSeconds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cooldown (seconds)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="levelupChannel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level Up Channel</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Current channel" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Current Channel</SelectItem>
                                {textChannels.map(c => (
                                  <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        <div className="xl:col-span-2">
          <Card className="bg-card h-full">
            <CardHeader>
              <CardTitle>Leaderboard Preview</CardTitle>
              <CardDescription>Top 10 most active members in your server.</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard && leaderboard.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead className="text-right">Level</TableHead>
                      <TableHead className="text-right">XP</TableHead>
                      <TableHead className="text-right">Messages</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.slice(0, 10).map((entry, idx) => (
                      <TableRow key={entry.userId}>
                        <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{entry.userId}</TableCell>
                        <TableCell className="text-right font-bold">{entry.level}</TableCell>
                        <TableCell className="text-right">{entry.xp.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{entry.messages.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No activity recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
