import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Star, Trash2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "rova_token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function useReactionRoles(guildId: string) {
  return useQuery({
    queryKey: ["reactionroles", guildId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/reactionroles`, { headers: authHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!guildId,
  });
}

export default function ReactionRoles() {
  const params = useParams();
  const guildId = params.guildId as string;
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useReactionRoles(guildId);

  const deleteMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/reactionroles`, {
        method: "DELETE",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ messageId, emoji }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reactionroles", guildId] });
      toast({ title: "✅ تم الحذف" });
    },
    onError: () => toast({ title: "❌ خطأ في الحذف", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" /> أدوار الريأكشن
        </h1>
        <p className="text-muted-foreground mt-1">منح أدوار للأعضاء تلقائياً عند الضغط على إيموجي</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">كيفية الإضافة من الديسكورد:</p>
              <code className="block bg-muted px-3 py-2 rounded text-primary font-mono">
                /reactionrole &lt;message_id&gt; 🎮 @Gamer
              </code>
              <p className="text-muted-foreground">سيحصل الأعضاء الذين يضغطون 🎮 على دور @Gamer تلقائياً</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أدوار الريأكشن النشطة</CardTitle>
          <CardDescription>قائمة بكل ربط بين إيموجي ودور</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !data?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد أدوار ريأكشن بعد</p>
              <p className="text-sm mt-1">أضف من الديسكورد باستخدام <code className="bg-muted px-1 rounded">/reactionrole</code></p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.map((rr: any) => (
                <div key={`${rr.messageId}-${rr.emoji}`} className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{rr.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">دور: <code className="text-primary">{rr.roleId}</code></p>
                      <p className="text-xs text-muted-foreground">رسالة: <code>{rr.messageId}</code></p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate({ messageId: rr.messageId, emoji: rr.emoji })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>الأوامر المتاحة</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { cmd: "/reactionrole <msg_id> <emoji> <@دور>", desc: "أضف دور ريأكشن لرسالة" },
              { cmd: "/removerr <msg_id> <emoji>", desc: "احذف دور ريأكشن" },
              { cmd: "/listrr", desc: "اعرض كل أدوار الريأكشن" },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="p-3 bg-muted/50 rounded-lg border border-border flex justify-between items-center">
                <code className="text-sm text-primary font-mono">{cmd}</code>
                <span className="text-sm text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
