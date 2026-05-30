import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Heart, Calendar } from "lucide-react";
import { useGetGuild, getGetGuildQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "rova_token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function useBirthday(guildId: string) {
  return useQuery({
    queryKey: ["birthday", guildId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/birthday`, { headers: authHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!guildId,
  });
}

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function BirthdayPage() {
  const params = useParams();
  const guildId = params.guildId as string;
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useBirthday(guildId);
  const { data: guild } = useGetGuild(guildId, { query: { enabled: !!guildId, queryKey: getGetGuildQueryKey(guildId) } });

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const channels = (guild?.channels ?? []).filter((c: any) => c.type === 0);
  const currentEnabled = enabled ?? data?.enabled ?? false;
  const currentChannel = channelId ?? data?.channelId ?? "";
  const currentMessage = message ?? data?.message ?? "عيد ميلاد سعيد {user}! 🎂";

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/birthday`, {
        method: "PATCH",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ enabled: currentEnabled, channelId: currentChannel || null, message: currentMessage }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["birthday", guildId] });
      toast({ title: "✅ تم الحفظ" });
    },
    onError: () => toast({ title: "❌ خطأ", variant: "destructive" }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" /> أعياد الميلاد
        </h1>
        <p className="text-muted-foreground mt-1">تهنئة تلقائية بعيد الميلاد في قناة محددة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات التهنئة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border border-border">
            <div>
              <Label className="text-base font-semibold">تفعيل التهنئة التلقائية</Label>
              <p className="text-sm text-muted-foreground">يرسل البوت تهنئة لأعضاء عيد ميلادهم</p>
            </div>
            <Switch checked={currentEnabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label>قناة التهنئة</Label>
            <Select value={currentChannel} onValueChange={setChannelId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر قناة..." />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>#{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>رسالة التهنئة</Label>
            <Input
              value={currentMessage}
              onChange={e => setMessage(e.target.value)}
              placeholder="عيد ميلاد سعيد {user}! 🎂"
            />
            <p className="text-xs text-muted-foreground">استخدم <code className="bg-muted px-1 rounded">{"{user}"}</code> للإشارة للعضو</p>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Spinner className="h-4 w-4 mr-2" />}
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> أعياد الميلاد المسجّلة
          </CardTitle>
          <CardDescription>الأعضاء الذين سجّلوا تاريخ ميلادهم</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.birthdays?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد أحد سجّل ميلاده بعد</p>
              <p className="text-sm mt-1">استخدم <code className="bg-muted px-1 rounded">/setbirthday يوم شهر</code></p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.birthdays.map((b: any) => (
                <div key={b.userId} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
                  <span className="font-mono text-sm text-muted-foreground">{b.userId}</span>
                  <span className="text-sm font-medium">🎂 {b.day} {MONTHS_AR[b.month - 1]}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
