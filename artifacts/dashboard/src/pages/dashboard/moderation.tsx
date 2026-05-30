import { useGetProtectionConfig, useUpdateProtectionConfig, getGetProtectionConfigQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  antispamEnabled: z.boolean().optional(),
  antispamMessages: z.coerce.number().min(1).optional(),
  antispamSeconds: z.coerce.number().min(1).optional(),
  antispamAction: z.string().optional(),
  antilinkEnabled: z.boolean().optional(),
  antiraidEnabled: z.boolean().optional(),
  antiraidJoins: z.coerce.number().min(1).optional(),
  antiraidSeconds: z.coerce.number().min(1).optional(),
  antiraidAction: z.string().optional(),
  antimentionsEnabled: z.boolean().optional(),
  antimentionsLimit: z.coerce.number().min(1).optional(),
  badwordsEnabled: z.boolean().optional(),
});

export default function Moderation() {
  const { guildId } = useParams();
  const { data: config, isLoading } = useGetProtectionConfig(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      antispamEnabled: false,
      antispamMessages: 5,
      antispamSeconds: 5,
      antispamAction: "mute",
      antilinkEnabled: false,
      antiraidEnabled: false,
      antiraidJoins: 10,
      antiraidSeconds: 10,
      antiraidAction: "kick",
      antimentionsEnabled: false,
      antimentionsLimit: 5,
      badwordsEnabled: false,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        antispamEnabled: config.antispamEnabled,
        antispamMessages: config.antispamMessages,
        antispamSeconds: config.antispamSeconds,
        antispamAction: config.antispamAction,
        antilinkEnabled: config.antilinkEnabled,
        antiraidEnabled: config.antiraidEnabled,
        antiraidJoins: config.antiraidJoins,
        antiraidSeconds: config.antiraidSeconds,
        antiraidAction: config.antiraidAction,
        antimentionsEnabled: config.antimentionsEnabled,
        antimentionsLimit: config.antimentionsLimit,
        badwordsEnabled: config.badwordsEnabled,
      });
    }
  }, [config, form]);

  const updateConfig = useUpdateProtectionConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Moderation settings saved" });
        queryClient.invalidateQueries({ queryKey: getGetProtectionConfigQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error saving moderation settings", variant: "destructive" })
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
          <h1 className="text-3xl font-bold tracking-tight">Moderation</h1>
          <p className="text-muted-foreground mt-1 text-lg">Automated protection for your server.</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={updateConfig.isPending || !form.formState.isDirty}>
          <Save className="h-4 w-4 mr-2" /> Save All
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Anti-Spam</CardTitle>
                    <CardDescription>Prevent users from sending too many messages.</CardDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="antispamEnabled"
                    render={({ field }) => (
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    )}
                  />
                </div>
              </CardHeader>
              {form.watch("antispamEnabled") && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="antispamMessages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Messages</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="antispamSeconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Within Seconds</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="antispamAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="delete">Delete Message</SelectItem>
                            <SelectItem value="mute">Mute User</SelectItem>
                            <SelectItem value="kick">Kick User</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Anti-Raid</CardTitle>
                    <CardDescription>Protect against sudden influx of bots or users.</CardDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="antiraidEnabled"
                    render={({ field }) => (
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    )}
                  />
                </div>
              </CardHeader>
              {form.watch("antiraidEnabled") && (
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="antiraidJoins"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Joins</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="antiraidSeconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Within Seconds</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="antiraidAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="kick">Kick Joiners</SelectItem>
                            <SelectItem value="ban">Ban Joiners</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Anti-Link</CardTitle>
                    <CardDescription>Automatically delete unauthorized links.</CardDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="antilinkEnabled"
                    render={({ field }) => (
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    )}
                  />
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Anti-Mentions</CardTitle>
                    <CardDescription>Prevent mass pinging of users/roles.</CardDescription>
                  </div>
                  <FormField
                    control={form.control}
                    name="antimentionsEnabled"
                    render={({ field }) => (
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    )}
                  />
                </div>
              </CardHeader>
              {form.watch("antimentionsEnabled") && (
                <CardContent className="pt-0">
                  <FormField
                    control={form.control}
                    name="antimentionsLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Mentions Per Message</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
