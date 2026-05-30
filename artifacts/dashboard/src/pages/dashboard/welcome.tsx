import { useGetWelcomeConfig, useUpdateWelcomeConfig, getGetWelcomeConfigQueryKey, useGetLeaveConfig, useUpdateLeaveConfig, getGetLeaveConfigQueryKey, useGetGuild } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";

const welcomeFormSchema = z.object({
  enabled: z.boolean(),
  channelId: z.string().nullable().optional(),
  message: z.string().optional(),
  embedColor: z.string().optional(),
});

const leaveFormSchema = z.object({
  enabled: z.boolean(),
  channelId: z.string().nullable().optional(),
  message: z.string().optional(),
  embedColor: z.string().optional(),
});

export default function Welcome() {
  const { guildId } = useParams();
  const { data: guild, isLoading: isLoadingGuild } = useGetGuild(guildId!);
  const { data: welcomeConfig, isLoading: isLoadingWelcome } = useGetWelcomeConfig(guildId!);
  const { data: leaveConfig, isLoading: isLoadingLeave } = useGetLeaveConfig(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const textChannels = guild?.channels.filter(c => c.type === 0) || [];

  const welcomeForm = useForm<z.infer<typeof welcomeFormSchema>>({
    resolver: zodResolver(welcomeFormSchema),
    defaultValues: {
      enabled: false,
      channelId: "",
      message: "Welcome to the server, {user}!",
      embedColor: "#00ff00",
    },
  });

  const leaveForm = useForm<z.infer<typeof leaveFormSchema>>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      enabled: false,
      channelId: "",
      message: "{user} has left the server.",
      embedColor: "#ff0000",
    },
  });

  useEffect(() => {
    if (welcomeConfig) {
      welcomeForm.reset({
        enabled: welcomeConfig.enabled,
        channelId: welcomeConfig.channelId || "",
        message: welcomeConfig.message || "",
        embedColor: welcomeConfig.embedColor || "#000000",
      });
    }
  }, [welcomeConfig, welcomeForm]);

  useEffect(() => {
    if (leaveConfig) {
      leaveForm.reset({
        enabled: leaveConfig.enabled,
        channelId: leaveConfig.channelId || "",
        message: leaveConfig.message || "",
        embedColor: leaveConfig.embedColor || "#000000",
      });
    }
  }, [leaveConfig, leaveForm]);

  const updateWelcome = useUpdateWelcomeConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Welcome config saved" });
        queryClient.invalidateQueries({ queryKey: getGetWelcomeConfigQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error saving welcome config", variant: "destructive" })
    }
  });

  const updateLeave = useUpdateLeaveConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leave config saved" });
        queryClient.invalidateQueries({ queryKey: getGetLeaveConfigQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error saving leave config", variant: "destructive" })
    }
  });

  if (isLoadingWelcome || isLoadingLeave || isLoadingGuild) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome & Leave</h1>
        <p className="text-muted-foreground mt-1 text-lg">Customize messages sent when members join or leave.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Welcome Message</CardTitle>
            <CardDescription>Send a message when a user joins the server.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...welcomeForm}>
              <form onSubmit={welcomeForm.handleSubmit(v => updateWelcome.mutate({ guildId: guildId!, data: { ...v, channelId: v.channelId || null } }))} className="space-y-6">
                <FormField
                  control={welcomeForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Welcome Message</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {welcomeForm.watch("enabled") && (
                  <>
                    <FormField
                      control={welcomeForm.control}
                      name="channelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select a channel" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {textChannels.map(c => (
                                <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={welcomeForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Template</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} className="resize-none" />
                          </FormControl>
                          <FormDescription>Variables: {'{user}'}, {'{server}'}, {'{memberCount}'}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={welcomeForm.control}
                      name="embedColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Embed Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input type="color" {...field} className="w-16 p-1 h-10 cursor-pointer" />
                              <Input {...field} className="flex-1" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <Button type="submit" disabled={updateWelcome.isPending || !welcomeForm.formState.isDirty}>
                  <Save className="h-4 w-4 mr-2" /> Save Welcome Config
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Leave Message</CardTitle>
            <CardDescription>Send a message when a user leaves the server.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...leaveForm}>
              <form onSubmit={leaveForm.handleSubmit(v => updateLeave.mutate({ guildId: guildId!, data: { ...v, channelId: v.channelId || null } }))} className="space-y-6">
                <FormField
                  control={leaveForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Leave Message</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {leaveForm.watch("enabled") && (
                  <>
                    <FormField
                      control={leaveForm.control}
                      name="channelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select a channel" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {textChannels.map(c => (
                                <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={leaveForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Template</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} className="resize-none" />
                          </FormControl>
                          <FormDescription>Variables: {'{user}'}, {'{server}'}, {'{memberCount}'}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={leaveForm.control}
                      name="embedColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Embed Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input type="color" {...field} className="w-16 p-1 h-10 cursor-pointer" />
                              <Input {...field} className="flex-1" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <Button type="submit" disabled={updateLeave.isPending || !leaveForm.formState.isDirty}>
                  <Save className="h-4 w-4 mr-2" /> Save Leave Config
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
