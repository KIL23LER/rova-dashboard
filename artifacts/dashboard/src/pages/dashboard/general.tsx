import { useGetGuildSettings, useUpdateGuildSettings, getGetGuildSettingsQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";

const formSchema = z.object({
  prefix: z.string().min(1, "Prefix is required").max(5, "Prefix must be 5 characters or less"),
});

export default function General() {
  const { guildId } = useParams();
  const { data: settings, isLoading } = useGetGuildSettings(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prefix: "!",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({ prefix: settings.prefix });
    }
  }, [settings, form]);

  const updateSettings = useUpdateGuildSettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Settings saved", description: "General settings have been updated successfully." });
        queryClient.invalidateQueries({ queryKey: getGetGuildSettingsQueryKey(guildId!) });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save settings. Please try again.", variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateSettings.mutate({ guildId: guildId!, data: values });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
        <p className="text-muted-foreground mt-1 text-lg">Basic configuration for the bot in your server.</p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Command Prefix</CardTitle>
          <CardDescription>
            The prefix used to trigger bot commands. Note: Slash commands (/) are always available and recommended.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prefix</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <Input {...field} className="bg-background max-w-[120px]" />
                        <Button 
                          type="submit" 
                          disabled={updateSettings.isPending || !form.formState.isDirty}
                        >
                          {updateSettings.isPending ? (
                            <span className="flex items-center gap-2">Saving...</span>
                          ) : (
                            <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Changes</span>
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Example: !help, ?help, -help
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
