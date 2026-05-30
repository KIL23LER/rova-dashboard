import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Megaphone, Clock } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "rova_token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function useAnnouncements(guildId: string) {
  return useQuery({
    queryKey: ["announcements", guildId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/guilds/${guildId}/announcements`, { headers: authHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!guildId,
  });
}

export default function Announcements() {
  const params = useParams();
  const guildId = params.guildId as string;
  const { data, isLoading } = useAnnouncements(guildId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> نظام الإعلانات
        </h1>
        <p className="text-muted-foreground mt-1">أرسل إعلانات رسمية للقنوات أو لجميع الأعضاء بالخاص</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>إعلان في قناة</CardTitle>
            <CardDescription>أمر البوت في الديسكورد</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg border border-border font-mono text-sm text-primary">
              /announce #قناة "العنوان" المحتوى
            </div>
            <p className="text-sm text-muted-foreground">يرسل إيمبد احترافي في القناة المختارة مع تسجيله في السجلات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إرسال للجميع (DM)</CardTitle>
            <CardDescription>أمر يتطلب صلاحية أدمن</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg border border-border font-mono text-sm text-primary">
              /dmall "العنوان" المحتوى
            </div>
            <p className="text-sm text-muted-foreground">يرسل رسالة مباشرة لجميع أعضاء السيرفر بالخاص</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إيمبد مخصص</CardTitle>
            <CardDescription>لصلاحية المودريتر</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg border border-border font-mono text-sm text-primary">
              /embed #قناة "العنوان" المحتوى #ff0000
            </div>
            <p className="text-sm text-muted-foreground">أرسل إيمبد بلون مخصص في أي قناة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل الإعلانات</CardTitle>
            <CardDescription>عرض الإعلانات السابقة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg border border-border font-mono text-sm text-primary">
              /announcements
            </div>
            <p className="text-sm text-muted-foreground">يعرض آخر 5 إعلانات في السيرفر</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> الإعلانات الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !data?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد إعلانات بعد</p>
              <p className="text-sm mt-1">استخدم <code className="bg-muted px-1 rounded">/announce</code> لإرسال أول إعلان</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((ann: any) => (
                <div key={ann.id} className="p-4 rounded-lg border border-border bg-muted/30"
                  style={{ borderLeft: `4px solid ${ann.color || "#a855f7"}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {ann.title && <p className="font-semibold">📣 {ann.title}</p>}
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(ann.sentAt * 1000).toLocaleDateString("ar")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
