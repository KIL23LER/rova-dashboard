import { useGetSuggestionsConfig, useUpdateSuggestionsConfig, getGetSuggestionsConfigQueryKey, useGetGuild } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";

const formSchema = z.object({
  enabled: z.boolean(),
  channelId: z.string().nullable().optional(),
  logChannel: z.string().nullable().optional(),
});

export default function Suggestions() {
  const { guildId } = useParams();
  const { data: config, isLoading: isLoadingConfig } = useGetSuggestionsConfig(guildId!);
  const { data: guild, isLoading: isLoadingGuild } = useGetGuild(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const textChannels = guild?.channels.filter(c => c.type === 0) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: false,
      channelId: "",
      logChannel: "",
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled,
        channelId: config.channelId || "",
        logChannel: config.logChannel || "",
      });
    }
  }, [config, form]);

  const updateConfig = useUpdateSuggestionsConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Suggestions settings saved" });
        queryClient.invalidateQueries({ queryKey: getGetSuggestionsConfigQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error saving settings", variant: "destructive" })
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateConfig.mutate({ 
      guildId: guildId!, 
      data: {
        enabled: values.enabled,
        channelId: values.channelId || null,
        logChannel: values.logChannel || null,
      } 
    });
  };

  if (isLoadingConfig || isLoadingGuild) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suggestions</h1>
        <p className="text-muted-foreground mt-1 text-lg">Allow members to submit ideas for your server.</p>
      </div>

      <Card className="bg-card max-w-2xl">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Set up the suggestions system channels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormField
                    control={form.control}
                    name="channelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suggestions Channel</FormLabel>
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
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logChannel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logs Channel (Decisions)</FormLabel>
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
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button type="submit" disabled={updateConfig.isPending || !form.formState.isDirty}>
                <Save className="h-4 w-4 mr-2" /> Save Config
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
