import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Mic2, Radio, Send, Clock } from "lucide-react";
import { useGetGuild, getGetGuildQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "rova_token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function usePodcast(guildId: string) {
  return useQuery({
    queryKey: ["podcast", guildId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/podcast`, { headers: authHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!guildId,
  });
}

export default function Podcast() {
  const params = useParams();
  const guildId = params.guildId as string;
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = usePodcast(guildId);
  const { data: guild } = useGetGuild(guildId, { query: { enabled: !!guildId, queryKey: getGetGuildQueryKey(guildId) } });

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);

  const roles = guild?.roles ?? [];
  const currentEnabled = enabled ?? data?.enabled ?? false;
  const currentRole = roleId ?? data?.roleId ?? "all";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/podcast`, {
        method: "PATCH",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ enabled: currentEnabled, roleId: currentRole === "all" ? null : currentRole }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["podcast", guildId] });
      toast({ title: "✅ تم الحفظ", description: "تم حفظ إعدادات البودكاست." });
    },
    onError: () => toast({ title: "❌ خطأ", description: "فشل الحفظ.", variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic2 className="h-6 w-6 text-primary" /> نظام البودكاست
        </h1>
        <p className="text-muted-foreground mt-1">أرسل حلقات بودكاست للأعضاء مباشرة بالخاص (DM)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات البودكاست</CardTitle>
          <CardDescription>حدد من يستقبل البودكاست</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border">
            <div>
              <Label className="text-base font-semibold">تفعيل البودكاست</Label>
              <p className="text-sm text-muted-foreground">السماح بإرسال حلقات بودكاست للأعضاء</p>
            </div>
            <Switch checked={currentEnabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label>الجمهور المستهدف</Label>
            <Select value={currentRole} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر دوراً..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 جميع الأعضاء</SelectItem>
                {roles.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>@{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">اختر دوراً محدداً أو اتركه لجميع الأعضاء</p>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5 text-primary" /> كيفية الإرسال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-2">
            <p className="font-mono text-sm text-primary">/podcast "عنوان الحلقة" محتوى الحلقة</p>
            <p className="text-sm text-muted-foreground">يرسل البوت الحلقة تلقائياً للأعضاء المختارين بالخاص (DM)</p>
          </div>
          <div className="p-4 bg-muted/40 rounded-lg border border-border">
            <p className="font-mono text-sm text-primary">/episodes</p>
            <p className="text-sm text-muted-foreground mt-1">عرض الحلقات السابقة</p>
          </div>
        </CardContent>
      </Card>

      {data?.episodes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> الحلقات السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.episodes.map((ep: any) => (
                <div key={ep.id} className="p-4 bg-muted/40 rounded-lg border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">🎙️ {ep.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ep.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                      {new Date(ep.createdAt * 1000).toLocaleDateString("ar")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
