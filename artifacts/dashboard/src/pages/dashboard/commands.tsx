import { useGetCustomCommands, useCreateCustomCommand, useDeleteCustomCommand, getGetCustomCommandsQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MessageSquare } from "lucide-react";

const formSchema = z.object({
  trigger: z.string().min(1, "Trigger is required").max(32),
  response: z.string().min(1, "Response is required").max(2000),
});

export default function Commands() {
  const { guildId } = useParams();
  const { data: commands, isLoading } = useGetCustomCommands(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trigger: "",
      response: "",
    },
  });

  const createCmd = useCreateCustomCommand({
    mutation: {
      onSuccess: () => {
        toast({ title: "Command created" });
        queryClient.invalidateQueries({ queryKey: getGetCustomCommandsQueryKey(guildId!) });
        form.reset();
      },
      onError: () => toast({ title: "Error creating command", variant: "destructive" })
    }
  });

  const deleteCmd = useDeleteCustomCommand({
    mutation: {
      onSuccess: () => {
        toast({ title: "Command deleted" });
        queryClient.invalidateQueries({ queryKey: getGetCustomCommandsQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error deleting command", variant: "destructive" })
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createCmd.mutate({ guildId: guildId!, data: values });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-[400px] w-full max-w-5xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Commands</h1>
        <p className="text-muted-foreground mt-1 text-lg">Create text responses for specific triggers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        <Card className="bg-card lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Create Command</CardTitle>
            <CardDescription>Add a new text response.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="trigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Word</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. rules" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="response"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bot Response</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Read the rules in #rules!" rows={4} className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={createCmd.isPending} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Command
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Commands</CardTitle>
          </CardHeader>
          <CardContent>
            {commands && commands.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">Trigger</TableHead>
                    <TableHead className="w-1/2">Response Preview</TableHead>
                    <TableHead className="w-16 text-center">Uses</TableHead>
                    <TableHead className="w-16 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commands.map((cmd) => (
                    <TableRow key={cmd.trigger}>
                      <TableCell className="font-mono text-sm bg-muted/50 rounded px-2 py-1 inline-block m-1">{cmd.trigger}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[200px]">{cmd.response}</TableCell>
                      <TableCell className="text-center">{cmd.uses}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                          onClick={() => deleteCmd.mutate({ guildId: guildId!, trigger: cmd.trigger })} disabled={deleteCmd.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-lg border border-dashed flex flex-col items-center">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                <p>No custom commands yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
