#!/bin/bash
# ─── Rova Bot v4.0 ULTRA — WispByte / Pterodactyl ────────────────────────────

echo "╔══════════════════════════════════════════╗"
echo "║   Rova Bot v4.0 ULTRA — Starting Up     ║"
echo "╚══════════════════════════════════════════╝"

mkdir -p data logs

echo "[*] Installing dependencies..."
pip install -r requirements.txt -q --upgrade
echo "[✓] Dependencies ready"

MISSING=0
for VAR in DISCORD_BOT_TOKEN DISCORD_CLIENT_ID DISCORD_CLIENT_SECRET; do
    if [ -z "${!VAR}" ]; then
        echo "[ERROR] Missing required variable: $VAR"
        MISSING=1
    fi
done
if [ "$MISSING" -eq 1 ]; then
    echo ""
    echo "Set the above variables in the Startup tab → Variables section."
    exit 1
fi

echo "[✓] Environment OK"
echo "[*] Starting Bot + API Server on port ${API_PORT:-8080}..."
echo ""

cd "$(dirname "$0")"
exec python bot.py
