import { useGetTicketsConfig, useUpdateTicketsConfig, getGetTicketsConfigQueryKey, useGetGuild } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
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
  panelChannel: z.string().nullable().optional(),
  logChannel: z.string().nullable().optional(),
  supportRole: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export default function Tickets() {
  const { guildId } = useParams();
  const { data: config, isLoading: isLoadingConfig } = useGetTicketsConfig(guildId!);
  const { data: guild, isLoading: isLoadingGuild } = useGetGuild(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const textChannels = guild?.channels.filter(c => c.type === 0) || [];
  const categories = guild?.channels.filter(c => c.type === 4) || [];
  const roles = guild?.roles || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      panelChannel: "",
      logChannel: "",
      supportRole: "",
      categoryId: "",
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        panelChannel: config.panelChannel || "",
        logChannel: config.logChannel || "",
        supportRole: config.supportRole || "",
        categoryId: config.categoryId || "",
      });
    }
  }, [config, form]);

  const updateConfig = useUpdateTicketsConfig({
    mutation: {
      onSuccess: () => {
        toast({ title: "Ticket settings saved" });
        queryClient.invalidateQueries({ queryKey: getGetTicketsConfigQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error saving settings", variant: "destructive" })
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateConfig.mutate({ 
      guildId: guildId!, 
      data: {
        panelChannel: values.panelChannel || null,
        logChannel: values.logChannel || null,
        supportRole: values.supportRole || null,
        categoryId: values.categoryId || null,
      } 
    });
  };

  if (isLoadingConfig || isLoadingGuild) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-[500px] w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground mt-1 text-lg">Configure the ticket system for member support.</p>
      </div>

      <Card className="bg-card max-w-2xl">
        <CardHeader>
          <CardTitle>Ticket System Settings</CardTitle>
          <CardDescription>Select channels and roles to manage support tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="panelChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Panel Channel</FormLabel>
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category for New Tickets</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Team Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map(r => (
                          <SelectItem key={r.id} value={r.id} style={{ color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : 'inherit' }}>
                            @{r.name}
                          </SelectItem>
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
                    <FormLabel>Transcript / Log Channel</FormLabel>
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

              <Button type="submit" disabled={updateConfig.isPending || !form.formState.isDirty}>
                <Save className="h-4 w-4 mr-2" /> Save Tickets Config
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
