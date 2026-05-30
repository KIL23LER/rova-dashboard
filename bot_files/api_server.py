"""
api_server.py — Rova Bot v4.0 ULTRA
HTTP API Server يعمل داخل نفس عملية البوت
يشارك نفس قاعدة البيانات — يوفر كل endpoints للـ dashboard
"""

import asyncio
import json
import os
import secrets
import time
from typing import Optional

import aiohttp
import aiohttp_cors
from aiohttp import web

from utils.dashboard_db import get_db

# ─── Config ───────────────────────────────────────────────────────────────────

DISCORD_API   = "https://discord.com/api/v10"
CLIENT_ID     = os.environ.get("DISCORD_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("DISCORD_CLIENT_SECRET", "")
BOT_TOKEN     = os.environ.get("DISCORD_BOT_TOKEN", "")
API_PORT      = int(os.environ.get("SERVER_PORT") or os.environ.get("API_PORT") or "8080")
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "http://localhost:3000")
SESSION_COOKIE = "rova_sess"
IS_PROD        = os.environ.get("NODE_ENV") == "production"

# ─── Session helpers ──────────────────────────────────────────────────────────

def session_create(user: dict, access_token: str) -> str:
    token = secrets.token_hex(32)
    expires = int(time.time()) + 7 * 24 * 3600
    with get_db() as db:
        db.execute(
            "INSERT INTO sessions (token, user_json, access_token, expires_at) VALUES (?,?,?,?)",
            (token, json.dumps(user, ensure_ascii=False), access_token, expires),
        )
    return token

def session_get(token: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT user_json, access_token FROM sessions WHERE token=? AND expires_at>?",
            (token, int(time.time())),
        ).fetchone()
    if not row:
        return None
    return {"user": json.loads(row["user_json"]), "access_token": row["access_token"]}

def session_delete(token: str):
    with get_db() as db:
        db.execute("DELETE FROM sessions WHERE token=?", (token,))

# ─── Helpers ──────────────────────────────────────────────────────────────────

def json_resp(data, status: int = 200) -> web.Response:
    return web.Response(
        text=json.dumps(data, ensure_ascii=False),
        content_type="application/json",
        status=status,
    )

def require_auth(request: web.Request) -> Optional[dict]:
    # 1) Bearer token in Authorization header (cross-origin dashboard)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return session_get(auth_header[7:])
    # 2) Cookie fallback (same-origin)
    token = request.cookies.get(SESSION_COOKIE)
    return session_get(token) if token else None

def gid(request: web.Request) -> str:
    return request.match_info["guildId"]

def _self_url(request: web.Request) -> str:
    host   = request.headers.get("X-Forwarded-Host") or request.host
    scheme = request.headers.get("X-Forwarded-Proto", "https" if IS_PROD else "http")
    return f"{scheme}://{host}"

async def _discord(method: str, path: str, token: str, bot: bool = False) -> any:
    auth = f"Bot {token}" if bot else f"Bearer {token}"
    async with aiohttp.ClientSession() as s:
        async with s.request(method, f"{DISCORD_API}{path}", headers={"Authorization": auth}) as r:
            if not r.ok:
                return [] if r.status == 404 else None
            return await r.json()

def _patch(db, table: str, gid: str, body: dict, col_map: dict, json_cols: set = None):
    sets, vals = [], []
    for key, col in col_map.items():
        if key not in body:
            continue
        v = body[key]
        if json_cols and key in json_cols:
            v = json.dumps(v, ensure_ascii=False)
        elif isinstance(v, bool):
            v = 1 if v else 0
        sets.append(f"{col}=?")
        vals.append(v)
    if sets:
        db.execute(f"UPDATE {table} SET {','.join(sets)} WHERE guild_id=?", (*vals, gid))

def _ensure(db, table: str, guild_id: str) -> dict:
    db.execute(f"INSERT OR IGNORE INTO {table} (guild_id) VALUES (?)", (guild_id,))
    return dict(db.execute(f"SELECT * FROM {table} WHERE guild_id=?", (guild_id,)).fetchone() or {})

# ─── Auth ─────────────────────────────────────────────────────────────────────

async def auth_redirect(request: web.Request) -> web.Response:
    import base64
    origin = request.headers.get("Referer", DASHBOARD_URL)
    try:
        state = base64.urlsafe_b64encode(json.dumps({"origin": origin}).encode()).decode()
    except Exception:
        state = ""
    cb = f"{_self_url(request)}/api/auth/callback"
    url = (
        "https://discord.com/api/oauth2/authorize?"
        f"client_id={CLIENT_ID}&redirect_uri={cb}"
        f"&response_type=code&scope=identify+guilds&state={state}"
    )
    raise web.HTTPFound(url)

async def auth_callback(request: web.Request) -> web.Response:
    import base64
    code  = request.rel_url.query.get("code")
    state = request.rel_url.query.get("state", "")
    back  = DASHBOARD_URL
    if state:
        try:
            back = json.loads(base64.urlsafe_b64decode(state + "==").decode()).get("origin", DASHBOARD_URL)
        except Exception:
            pass
    if not code:
        raise web.HTTPFound(f"{back}/?error=no_code")

    cb = f"{_self_url(request)}/api/auth/callback"
    async with aiohttp.ClientSession() as s:
        async with s.post(
            f"{DISCORD_API}/oauth2/token",
            data={"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET,
                  "grant_type": "authorization_code", "code": code, "redirect_uri": cb},
        ) as r:
            if not r.ok:
                raise web.HTTPFound(f"{back}/?error=auth_failed")
            tokens = await r.json()

    at = tokens.get("access_token", "")
    user = await _discord("GET", "/users/@me", at)
    if not user:
        raise web.HTTPFound(f"{back}/?error=auth_failed")

    u = {"id": user["id"], "username": user["username"], "avatar": user.get("avatar"),
         "discriminator": user.get("discriminator", "0"), "globalName": user.get("global_name")}
    token = session_create(u, at)

    # Pass token via URL — cookies don't work cross-origin (HTTP API ↔ HTTPS dashboard)
    raise web.HTTPFound(f"{back}/servers?_token={token}")

async def auth_me(request: web.Request) -> web.Response:
    sess = require_auth(request)
    if not sess:
        return json_resp({"error": "Not authenticated"}, 401)
    return json_resp(sess["user"])

async def auth_logout(request: web.Request) -> web.Response:
    # Accept Bearer token (cross-origin) or cookie (same-origin)
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else request.cookies.get(SESSION_COOKIE)
    if token:
        session_delete(token)
    resp = json_resp({"ok": True})
    resp.del_cookie(SESSION_COOKIE, path="/")
    return resp

# ─── Guilds ───────────────────────────────────────────────────────────────────

async def guilds_list(request: web.Request) -> web.Response:
    sess = require_auth(request)
    if not sess:
        return json_resp({"error": "Not authenticated"}, 401)
    try:
        user_guilds = await _discord("GET", "/users/@me/guilds?with_counts=true", sess["access_token"]) or []
        bot_guilds  = await _discord("GET", "/users/@me/guilds", BOT_TOKEN, bot=True) or []
        bot_ids = {g["id"] for g in bot_guilds if isinstance(g, dict)}
        def has_manage(p):
            try: return bool(int(p) & 0x20)
            except: return False
        result = [
            {"id": g["id"], "name": g["name"], "icon": g.get("icon"),
             "botPresent": g["id"] in bot_ids, "memberCount": g.get("approximate_member_count", 0), "owner": g.get("owner", False)}
            for g in user_guilds if isinstance(g, dict) and (g.get("owner") or has_manage(str(g.get("permissions", 0))))
        ]
        return json_resp(result)
    except Exception as e:
        return json_resp({"error": str(e)}, 500)

async def guild_detail(request: web.Request) -> web.Response:
    if not require_auth(request):
        return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    channels = await _discord("GET", f"/guilds/{g}/channels", BOT_TOKEN, bot=True) or []
    roles    = await _discord("GET", f"/guilds/{g}/roles",    BOT_TOKEN, bot=True) or []
    ch = [{"id": c["id"], "name": c["name"], "type": c["type"]} for c in channels if isinstance(c, dict) and c.get("type") in (0,2,4,5,15)]
    ro = sorted([{"id": r["id"], "name": r["name"], "color": r.get("color",0)} for r in roles if isinstance(r, dict) and r.get("name") != "@everyone"], key=lambda x: x["id"], reverse=True)
    return json_resp({"id": g, "name": "", "icon": None, "channels": ch, "roles": ro})

# ─── Settings ─────────────────────────────────────────────────────────────────

async def settings_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db:
        row = _ensure(db, "guild_config", g)
    return json_resp({"guildId": g, "prefix": row.get("prefix", "!")})

async def settings_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)", (g,))
        if "prefix" in body: db.execute("UPDATE guild_config SET prefix=? WHERE guild_id=?", (body["prefix"], g))
        row = dict(db.execute("SELECT * FROM guild_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId": g, "prefix": row.get("prefix", "!")})

async def welcome_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db: row = _ensure(db, "welcome_config", g)
    return json_resp({"guildId": g, "enabled": bool(row.get("enabled")), "channelId": row.get("channel_id"), "message": row.get("message"), "embedColor": row.get("embed_color", "#a855f7")})

async def welcome_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO welcome_config (guild_id) VALUES (?)", (g,))
        _patch(db, "welcome_config", g, body, {"enabled":"enabled","channelId":"channel_id","message":"message","embedColor":"embed_color"})
        row = dict(db.execute("SELECT * FROM welcome_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId": g, "enabled": bool(row.get("enabled")), "channelId": row.get("channel_id"), "message": row.get("message"), "embedColor": row.get("embed_color")})

async def leave_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db: row = _ensure(db, "leave_config", g)
    return json_resp({"guildId": g, "enabled": bool(row.get("enabled")), "channelId": row.get("channel_id"), "message": row.get("message"), "embedColor": row.get("embed_color", "#ef4444")})

async def leave_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO leave_config (guild_id) VALUES (?)", (g,))
        _patch(db, "leave_config", g, body, {"enabled":"enabled","channelId":"channel_id","message":"message","embedColor":"embed_color"})
        row = dict(db.execute("SELECT * FROM leave_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId": g, "enabled": bool(row.get("enabled")), "channelId": row.get("channel_id"), "message": row.get("message"), "embedColor": row.get("embed_color")})

async def logging_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db: row = _ensure(db, "logging_config", g)
    return json_resp({"guildId": g, "enabled": bool(row.get("enabled")), "channelId": row.get("channel_id")})

async def logging_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO logging_config (guild_id) VALUES (?)", (g,))
        _patch(db, "logging_config", g, body, {"enabled":"enabled","channelId":"channel_id"})
        row = dict(db.execute("SELECT * FROM logging_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId": g, "enabled": bool(row.get("enabled")), "channelId": row.get("channel_id")})

async def protection_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db: row = _ensure(db, "protection_config", g)
    return json_resp({"guildId":g,"antispamEnabled":bool(row.get("antispam_enabled")),"antispamMessages":row.get("antispam_messages",5),"antispamSeconds":row.get("antispam_seconds",4),"antispamAction":row.get("antispam_action","timeout"),"antilinkEnabled":bool(row.get("antilink_enabled")),"antilinkWhitelist":json.loads(row.get("antilink_whitelist") or "[]"),"antiraidEnabled":bool(row.get("antiraid_enabled")),"antiraidJoins":row.get("antiraid_joins",8),"antiraidSeconds":row.get("antiraid_seconds",10),"antiraidAction":row.get("antiraid_action","kick"),"antimentionsEnabled":bool(row.get("antimentions_enabled")),"antimentionsLimit":row.get("antimentions_limit",5),"badwordsEnabled":bool(row.get("badwords_enabled")),"badwords":json.loads(row.get("badwords") or "[]")})

async def protection_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    cm = {"antispamEnabled":"antispam_enabled","antispamMessages":"antispam_messages","antispamSeconds":"antispam_seconds","antispamAction":"antispam_action","antilinkEnabled":"antilink_enabled","antilinkWhitelist":"antilink_whitelist","antiraidEnabled":"antiraid_enabled","antiraidJoins":"antiraid_joins","antiraidSeconds":"antiraid_seconds","antiraidAction":"antiraid_action","antimentionsEnabled":"antimentions_enabled","antimentionsLimit":"antimentions_limit","badwordsEnabled":"badwords_enabled","badwords":"badwords"}
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO protection_config (guild_id) VALUES (?)", (g,))
        _patch(db, "protection_config", g, body, cm, json_cols={"antilinkWhitelist","badwords"})
        row = dict(db.execute("SELECT * FROM protection_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId":g,"antispamEnabled":bool(row.get("antispam_enabled")),"antispamMessages":row.get("antispam_messages"),"antispamSeconds":row.get("antispam_seconds"),"antispamAction":row.get("antispam_action"),"antilinkEnabled":bool(row.get("antilink_enabled")),"antilinkWhitelist":json.loads(row.get("antilink_whitelist") or "[]"),"antiraidEnabled":bool(row.get("antiraid_enabled")),"antiraidJoins":row.get("antiraid_joins"),"antiraidSeconds":row.get("antiraid_seconds"),"antiraidAction":row.get("antiraid_action"),"antimentionsEnabled":bool(row.get("antimentions_enabled")),"antimentionsLimit":row.get("antimentions_limit"),"badwordsEnabled":bool(row.get("badwords_enabled")),"badwords":json.loads(row.get("badwords") or "[]")})

async def antinuke_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db: row = _ensure(db, "antinuke_config", g)
    return json_resp({"guildId":g,"enabled":bool(row.get("enabled")),"banThreshold":row.get("ban_threshold",3),"kickThreshold":row.get("kick_threshold",3),"channelThreshold":row.get("channel_threshold",3),"roleThreshold":row.get("role_threshold",3),"webhookThreshold":row.get("webhook_threshold",3),"punishment":row.get("punishment","ban"),"whitelist":json.loads(row.get("whitelist") or "[]")})

async def antinuke_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO antinuke_config (guild_id) VALUES (?)", (g,))
        _patch(db, "antinuke_config", g, body, {"enabled":"enabled","banThreshold":"ban_threshold","kickThreshold":"kick_threshold","channelThreshold":"channel_threshold","roleThreshold":"role_threshold","webhookThreshold":"webhook_threshold","punishment":"punishment","whitelist":"whitelist"}, json_cols={"whitelist"})
        row = dict(db.execute("SELECT * FROM antinuke_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId":g,"enabled":bool(row.get("enabled")),"banThreshold":row.get("ban_threshold"),"kickThreshold":row.get("kick_threshold"),"channelThreshold":row.get("channel_threshold"),"roleThreshold":row.get("role_threshold"),"webhookThreshold":row.get("webhook_threshold"),"punishment":row.get("punishment"),"whitelist":json.loads(row.get("whitelist") or "[]")})

async def leveling_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db: row = _ensure(db, "leveling_config", g)
    return json_resp({"guildId":g,"enabled":bool(row.get("enabled")),"xpMin":row.get("xp_min",15),"xpMax":row.get("xp_max",40),"cooldownSeconds":row.get("cooldown_seconds",60),"levelupChannel":row.get("levelup_channel"),"levelupMessage":row.get("levelup_message")})

async def leveling_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO leveling_config (guild_id) VALUES (?)", (g,))
        _patch(db, "leveling_config", g, body, {"enabled":"enabled","xpMin":"xp_min","xpMax":"xp_max","cooldownSeconds":"cooldown_seconds","levelupChannel":"levelup_channel","levelupMessage":"levelup_message"})
        row = dict(db.execute("SELECT * FROM leveling_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId":g,"enabled":bool(row.get("enabled")),"xpMin":row.get("xp_min"),"xpMax":row.get("xp_max"),"cooldownSeconds":row.get("cooldown_seconds"),"levelupChannel":row.get("levelup_channel"),"levelupMessage":row.get("levelup_message")})

async def leaderboard_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db:
        rows = db.execute("SELECT * FROM xp_data WHERE guild_id=? ORDER BY xp DESC LIMIT 20", (g,)).fetchall()
    return json_resp([{"userId": r["user_id"], "xp": r["xp"], "level": r["level"], "messages": r["messages"]} for r in rows])

async def tickets_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db: row = _ensure(db, "ticket_config", g)
    return json_resp({"guildId":g,"panelChannel":row.get("panel_channel"),"logChannel":row.get("log_channel"),"supportRole":row.get("support_role"),"categoryId":row.get("category_id"),"ticketCount":row.get("ticket_count",0)})

async def tickets_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO ticket_config (guild_id) VALUES (?)", (g,))
        _patch(db, "ticket_config", g, body, {"panelChannel":"panel_channel","logChannel":"log_channel","supportRole":"support_role","categoryId":"category_id"})
        row = dict(db.execute("SELECT * FROM ticket_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId":g,"panelChannel":row.get("panel_channel"),"logChannel":row.get("log_channel"),"supportRole":row.get("support_role"),"categoryId":row.get("category_id"),"ticketCount":row.get("ticket_count",0)})

async def suggestions_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db: row = _ensure(db, "suggestion_config", g)
    return json_resp({"guildId":g,"enabled":bool(row.get("enabled")),"channelId":row.get("channel_id"),"logChannel":row.get("log_channel")})

async def suggestions_patch(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO suggestion_config (guild_id) VALUES (?)", (g,))
        _patch(db, "suggestion_config", g, body, {"enabled":"enabled","channelId":"channel_id","logChannel":"log_channel"})
        row = dict(db.execute("SELECT * FROM suggestion_config WHERE guild_id=?", (g,)).fetchone())
    return json_resp({"guildId":g,"enabled":bool(row.get("enabled")),"channelId":row.get("channel_id"),"logChannel":row.get("log_channel")})

async def autoroles_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db:
        rows = db.execute("SELECT * FROM autoroles WHERE guild_id=?", (g,)).fetchall()
    return json_resp([{"guildId": r["guild_id"], "roleId": r["role_id"], "botOnly": bool(r["bot_only"])} for r in rows])

async def autoroles_post(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    rid = body.get("roleId")
    if not rid: return json_resp({"error": "roleId required"}, 400)
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO autoroles (guild_id, role_id, bot_only) VALUES (?,?,?)", (g, rid, 1 if body.get("botOnly") else 0))
    return json_resp({"ok": True}, 201)

async def autoroles_delete(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db:
        db.execute("DELETE FROM autoroles WHERE guild_id=? AND role_id=?", (g, request.match_info["roleId"]))
    return json_resp({"ok": True})

async def commands_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db:
        rows = db.execute("SELECT * FROM custom_commands WHERE guild_id=? ORDER BY uses DESC", (g,)).fetchall()
    return json_resp([{"guildId": r["guild_id"], "trigger": r["trigger"], "response": r["response"], "uses": r["uses"]} for r in rows])

async def commands_post(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request); body = await request.json()
    t, r = body.get("trigger"), body.get("response")
    if not t or not r: return json_resp({"error": "trigger and response required"}, 400)
    with get_db() as db:
        db.execute("INSERT OR REPLACE INTO custom_commands (guild_id, trigger, response, uses) VALUES (?,?,?,0)", (g, t, r))
    return json_resp({"guildId": g, "trigger": t, "response": r, "uses": 0}, 201)

async def commands_delete(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db:
        db.execute("DELETE FROM custom_commands WHERE guild_id=? AND trigger=?", (g, request.match_info["trigger"]))
    return json_resp({"ok": True})

async def giveaways_get(request: web.Request) -> web.Response:
    if not require_auth(request): return json_resp({"error": "Not authenticated"}, 401)
    g = gid(request)
    with get_db() as db:
        rows = db.execute("SELECT * FROM giveaways WHERE guild_id=? AND ended=0 ORDER BY ends_at ASC", (g,)).fetchall()
    return json_resp([{"id": r["id"], "guildId": r["guild_id"], "channelId": r["channel_id"], "hostId": r["host_id"], "prize": r["prize"], "winners": r["winners"], "endsAt": r["ends_at"], "ended": bool(r["ended"]), "entryCount": len(json.loads(r["entries"] or "[]"))} for r in rows])

async def bot_stats_get(_request: web.Request) -> web.Response:
    with get_db() as db:
        row = db.execute("SELECT * FROM bot_stats WHERE id=1").fetchone()
    if not row:
        return json_resp({"guildCount": 0, "memberCount": 0, "commandCount": 0, "uptime": "0h 0m"})
    return json_resp({"guildCount": row["guild_count"], "memberCount": row["member_count"], "commandCount": row["command_count"], "uptime": row["uptime"]})

async def health(_request: web.Request) -> web.Response:
    return json_resp({"ok": True, "service": "Rova Bot API"})

# ─── App setup ────────────────────────────────────────────────────────────────

def create_app() -> web.Application:
    app = web.Application()
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True, expose_headers="*",
            allow_headers="*", allow_methods=["GET","POST","PATCH","DELETE","OPTIONS"],
        )
    })

    routes = [
        ("GET",    "/api/health",                              health),
        ("GET",    "/api/auth/discord",                        auth_redirect),
        ("GET",    "/api/auth/callback",                       auth_callback),
        ("GET",    "/api/auth/discord/callback",               auth_callback),
        ("GET",    "/api/auth/me",                             auth_me),
        ("POST",   "/api/auth/logout",                         auth_logout),
        ("GET",    "/api/bot/stats",                           bot_stats_get),
        ("GET",    "/api/guilds",                              guilds_list),
        ("GET",    "/api/guilds/{guildId}",                    guild_detail),
        ("GET",    "/api/guilds/{guildId}/settings",           settings_get),
        ("PATCH",  "/api/guilds/{guildId}/settings",           settings_patch),
        ("GET",    "/api/guilds/{guildId}/welcome",            welcome_get),
        ("PATCH",  "/api/guilds/{guildId}/welcome",            welcome_patch),
        ("GET",    "/api/guilds/{guildId}/leave",              leave_get),
        ("PATCH",  "/api/guilds/{guildId}/leave",              leave_patch),
        ("GET",    "/api/guilds/{guildId}/logging",            logging_get),
        ("PATCH",  "/api/guilds/{guildId}/logging",            logging_patch),
        ("GET",    "/api/guilds/{guildId}/protection",         protection_get),
        ("PATCH",  "/api/guilds/{guildId}/protection",         protection_patch),
        ("GET",    "/api/guilds/{guildId}/antinuke",           antinuke_get),
        ("PATCH",  "/api/guilds/{guildId}/antinuke",           antinuke_patch),
        ("GET",    "/api/guilds/{guildId}/leveling",           leveling_get),
        ("PATCH",  "/api/guilds/{guildId}/leveling",           leveling_patch),
        ("GET",    "/api/guilds/{guildId}/leaderboard",        leaderboard_get),
        ("GET",    "/api/guilds/{guildId}/tickets",            tickets_get),
        ("PATCH",  "/api/guilds/{guildId}/tickets",            tickets_patch),
        ("GET",    "/api/guilds/{guildId}/suggestions",        suggestions_get),
        ("PATCH",  "/api/guilds/{guildId}/suggestions",        suggestions_patch),
        ("GET",    "/api/guilds/{guildId}/autoroles",          autoroles_get),
        ("POST",   "/api/guilds/{guildId}/autoroles",          autoroles_post),
        ("DELETE", "/api/guilds/{guildId}/autoroles/{roleId}", autoroles_delete),
        ("GET",    "/api/guilds/{guildId}/commands",           commands_get),
        ("POST",   "/api/guilds/{guildId}/commands",           commands_post),
        ("DELETE", "/api/guilds/{guildId}/commands/{trigger}", commands_delete),
        ("GET",    "/api/guilds/{guildId}/giveaways",          giveaways_get),
    ]
    # Group by path so each resource is added once (aiohttp_cors requirement)
    from collections import defaultdict
    by_path = defaultdict(list)
    for method, path, handler in routes:
        by_path[path].append((method, handler))

    for path, method_handlers in by_path.items():
        resource = cors.add(app.router.add_resource(path))
        for method, handler in method_handlers:
            cors.add(resource.add_route(method, handler))
    return app


async def run_api_server():
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", API_PORT)
    await site.start()
    print(f"[✓] API Server listening on port {API_PORT}")
    print(f"    Dashboard URL: {DASHBOARD_URL}")
