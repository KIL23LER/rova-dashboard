import { useGetAutoroles, useAddAutorole, useRemoveAutorole, getGetAutorolesQueryKey, useGetGuild } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Shield, Bot } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Autoroles() {
  const { guildId } = useParams();
  const { data: autoroles, isLoading: isLoadingAR } = useGetAutoroles(guildId!);
  const { data: guild, isLoading: isLoadingGuild } = useGetGuild(guildId!);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState("");
  const [botOnly, setBotOnly] = useState(false);

  const addRole = useAddAutorole({
    mutation: {
      onSuccess: () => {
        toast({ title: "Role added" });
        queryClient.invalidateQueries({ queryKey: getGetAutorolesQueryKey(guildId!) });
        setSelectedRole("");
      },
      onError: () => toast({ title: "Error adding role", variant: "destructive" })
    }
  });

  const removeRole = useRemoveAutorole({
    mutation: {
      onSuccess: () => {
        toast({ title: "Role removed" });
        queryClient.invalidateQueries({ queryKey: getGetAutorolesQueryKey(guildId!) });
      },
      onError: () => toast({ title: "Error removing role", variant: "destructive" })
    }
  });

  if (isLoadingAR || isLoadingGuild) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-[400px] w-full max-w-4xl" />
      </div>
    );
  }

  const handleAdd = () => {
    if (!selectedRole) return;
    addRole.mutate({ guildId: guildId!, data: { roleId: selectedRole, botOnly } });
  };

  const getRoleInfo = (id: string) => guild?.roles.find(r => r.id === id);
  const unassignedRoles = guild?.roles.filter(r => !autoroles?.some(ar => ar.roleId === r.id)) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auto-Roles</h1>
        <p className="text-muted-foreground mt-1 text-lg">Automatically assign roles to members or bots when they join.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl">
        <Card className="bg-card lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Add New Rule</CardTitle>
            <CardDescription>Select a role to assign automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedRoles.map(r => (
                    <SelectItem key={r.id} value={r.id} style={{ color: r.color ? `#${r.color.toString(16).padStart(6, '0')}` : 'inherit' }}>
                      @{r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2 border rounded-lg p-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="bot-mode" className="text-sm font-medium">Assign to Bots Only</Label>
                <span className="text-xs text-muted-foreground">If disabled, assigned to humans.</span>
              </div>
              <Switch id="bot-mode" checked={botOnly} onCheckedChange={setBotOnly} />
            </div>

            <Button onClick={handleAdd} disabled={!selectedRole || addRole.isPending} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Auto-Role
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Auto-Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {autoroles && autoroles.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {autoroles.map((ar) => {
                    const role = getRoleInfo(ar.roleId);
                    return (
                      <TableRow key={ar.roleId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {role?.color && (
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `#${role.color.toString(16).padStart(6, '0')}` }} />
                            )}
                            <span className="font-medium">{role ? `@${role.name}` : ar.roleId}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ar.botOnly ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                              <Bot className="w-3 h-3" /> Bots Only
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted px-2.5 py-1 rounded-full border border-border">
                              <Shield className="w-3 h-3 text-muted-foreground" /> Humans
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                            onClick={() => removeRole.mutate({ guildId: guildId!, roleId: ar.roleId })} disabled={removeRole.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                <p>No auto-roles configured.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
