import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Coins, TrendingUp, Users } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "rova_token";

function useEconomy(guildId: string) {
  return useQuery({
    queryKey: ["economy", guildId],
    queryFn: async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/economy`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!guildId,
  });
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Economy() {
  const params = useParams();
  const guildId = params.guildId as string;
  const { data, isLoading } = useEconomy(guildId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" /> نظام الاقتصاد
        </h1>
        <p className="text-muted-foreground mt-1">
          عملة السيرفر — daily، work، rob، bank، متجر
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">أوامر متاحة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10+</div>
            <p className="text-xs text-muted-foreground mt-1">balance, daily, work, rob...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">أعضاء نشطون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Users className="h-5 w-5 text-primary" />
              {isLoading ? "..." : data?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">العملة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">🪙</div>
            <p className="text-xs text-muted-foreground mt-1">daily: 500 | work: 100-400</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> أغنى الأعضاء
          </CardTitle>
          <CardDescription>أعلى 20 عضو من حيث إجمالي الثروة</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !data?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد بيانات اقتصادية بعد</p>
              <p className="text-sm mt-1">استخدم <code className="bg-muted px-1 rounded">/daily</code> للبدء</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.map((entry: any, i: number) => (
                <div key={entry.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg w-8 text-center">{i < 3 ? MEDALS[i] : `#${i + 1}`}</span>
                    <div>
                      <p className="font-medium text-sm">مستخدم</p>
                      <p className="text-xs text-muted-foreground font-mono">{entry.userId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">🪙 {entry.total?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">محفظة: {entry.wallet?.toLocaleString()} | بنك: {entry.bank?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الأوامر المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { cmd: "/balance", desc: "عرض الرصيد" },
              { cmd: "/daily", desc: "مكافأة يومية 500🪙" },
              { cmd: "/work", desc: "اعمل 100-400🪙" },
              { cmd: "/rob", desc: "حاول السرقة" },
              { cmd: "/deposit", desc: "أودع في البنك" },
              { cmd: "/withdraw", desc: "اسحب من البنك" },
              { cmd: "/give", desc: "حول لعضو آخر" },
              { cmd: "/richest", desc: "أغنى الأعضاء" },
              { cmd: "/addmoney", desc: "[أدمن] أضف عملة" },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="p-2 rounded-md bg-muted/50 border border-border">
                <code className="text-xs text-primary font-mono">{cmd}</code>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
