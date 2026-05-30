import { useGetAntinukeConfig, useUpdateAntinukeConfig, getGetAntinukeConfigQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Save, ShieldBan } from "lucide-react";

const formSchema = z.object({
  enabled: z.boolean(),
  banThreshold: z.number().min(1).max(50),
  kickThreshold: z.number().min(1).max(50),
  channelThreshold: z.number().min(1).max(50),
  roleThreshold: z.number().min(1).max(50),
  webhookThreshold: z.number().min(1).max(50),
  punishment: z.string(),
});

export default function Antinuke() {
  const { guildId } = useParams();
  const { data: config, isLoading } = useGetAntinukeConfig(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: false,
      banThreshold: 3,
      kickThreshold: 3,
      channelThreshold: 3,
      roleThreshold: 3,
      webhookThreshold: 3,
      punishment: "ban",
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled,
        banThreshold: config.banThreshold || 3,
        kickThreshold: config.kickThreshold || 3,
        channelThreshold: config.channelThreshold || 3,
        roleThreshold: config.roleThreshold || 3,
        webhookThreshold: config.webhookThreshold || 3,
        punishment: config.punishment || "ban",
      });
    }
  }, [config, form]);

  const updateConfig = useUpdateAntinukeConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Anti-Nuke settings saved" });
        queryClient.invalidateQueries({ queryKey: getGetAntinukeConfigQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error saving anti-nuke settings", variant: "destructive" })
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateConfig.mutate({ guildId: guildId!, data: values });
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldBan className="h-8 w-8 text-destructive" /> Anti-Nuke
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Protect your server from rogue admins and hijacked accounts.</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={updateConfig.isPending || !form.formState.isDirty} variant={form.watch("enabled") ? "default" : "secondary"}>
          <Save className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <Card className="bg-card border-destructive/20 shadow-sm">
            <CardHeader className="bg-destructive/5 rounded-t-lg border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-destructive">Master Toggle</CardTitle>
                  <CardDescription>Enable or disable all anti-nuke protections.</CardDescription>
                </div>
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  )}
                />
              </div>
            </CardHeader>
            {form.watch("enabled") && (
              <CardContent className="pt-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <FormField
                      control={form.control}
                      name="banThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center pb-2">
                            <FormLabel>Max Bans</FormLabel>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider value={[field.value]} min={1} max={50} step={1} onValueChange={(val) => field.onChange(val[0])} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="kickThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center pb-2">
                            <FormLabel>Max Kicks</FormLabel>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider value={[field.value]} min={1} max={50} step={1} onValueChange={(val) => field.onChange(val[0])} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="channelThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center pb-2">
                            <FormLabel>Max Channel Deletions</FormLabel>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider value={[field.value]} min={1} max={50} step={1} onValueChange={(val) => field.onChange(val[0])} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-8">
                    <FormField
                      control={form.control}
                      name="roleThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center pb-2">
                            <FormLabel>Max Role Deletions</FormLabel>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider value={[field.value]} min={1} max={50} step={1} onValueChange={(val) => field.onChange(val[0])} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="webhookThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center pb-2">
                            <FormLabel>Max Webhook Creations</FormLabel>
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider value={[field.value]} min={1} max={50} step={1} onValueChange={(val) => field.onChange(val[0])} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="pt-2 border-t border-border mt-6">
                      <FormField
                        control={form.control}
                        name="punishment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Punishment for exceeding thresholds</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="ban">Ban User</SelectItem>
                                <SelectItem value="kick">Kick User</SelectItem>
                                <SelectItem value="remove_roles">Remove All Roles</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </form>
      </Form>
    </div>
  );
}
