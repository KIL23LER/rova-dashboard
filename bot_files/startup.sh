#!/bin/bash
# ─── Rova Bot v5.0 ULTRA — WispByte / Pterodactyl ────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║      Rova Bot v5.0 ULTRA — Starting Up       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# إنشاء المجلدات المطلوبة
mkdir -p data logs

# تثبيت المكتبات
echo "[*] Installing Python dependencies..."
pip install -r requirements.txt -q --upgrade
echo "[✓] Dependencies ready"
echo ""

# التحقق من المتغيرات المطلوبة
MISSING=0
for VAR in DISCORD_BOT_TOKEN DISCORD_CLIENT_ID DISCORD_CLIENT_SECRET DASHBOARD_URL API_URL; do
    if [ -z "${!VAR}" ]; then
        echo "[ERROR] المتغير مفقود: $VAR"
        MISSING=1
    fi
done

if [ "$MISSING" -eq 1 ]; then
    echo ""
    echo "────────────────────────────────────────────"
    echo "  أضف المتغيرات الناقصة في:"
    echo "  WispByte → Startup → Variables"
    echo "────────────────────────────────────────────"
    exit 1
fi

echo "[✓] All environment variables found"
echo "[*] Starting Bot + API Server on port ${API_PORT:-8080}..."
echo ""

cd "$(dirname "$0")"
exec python bot.py
