"""
cogs/config.py — Rova Bot v4.0 ULTRA
أوامر إعداد كل شي من Discord مباشرة
"""

import json
import discord
from discord.ext import commands
from utils.dashboard_db import get_db


def ok(msg: str) -> discord.Embed:
    return discord.Embed(description=f"✅ {msg}", color=0x22C55E)


def err(msg: str) -> discord.Embed:
    return discord.Embed(description=f"❌ {msg}", color=0xEF4444)


def info(msg: str) -> discord.Embed:
    return discord.Embed(description=f"ℹ️ {msg}", color=0xA855F7)


def _ensure(table: str, guild_id: str):
    inserts = {
        "guild_config": "INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)",
        "welcome_config": "INSERT OR IGNORE INTO welcome_config (guild_id) VALUES (?)",
        "leave_config": "INSERT OR IGNORE INTO leave_config (guild_id) VALUES (?)",
        "logging_config": "INSERT OR IGNORE INTO logging_config (guild_id) VALUES (?)",
        "protection_config": "INSERT OR IGNORE INTO protection_config (guild_id) VALUES (?)",
        "leveling_config": "INSERT OR IGNORE INTO leveling_config (guild_id) VALUES (?)",
        "antinuke_config": "INSERT OR IGNORE INTO antinuke_config (guild_id) VALUES (?)",
        "ticket_config": "INSERT OR IGNORE INTO ticket_config (guild_id) VALUES (?)",
        "suggestion_config": "INSERT OR IGNORE INTO suggestion_config (guild_id) VALUES (?)",
    }
    with get_db() as db:
        db.execute(inserts[table], (guild_id,))


class Config(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    # ─── Prefix ───────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="setprefix", description="تغيير بادئة البوت")
    @commands.has_permissions(administrator=True)
    async def setprefix(self, ctx: commands.Context, prefix: str):
        if len(prefix) > 5:
            return await ctx.send(embed=err("البادئة يجب أن تكون 5 أحرف أو أقل."))
        gid = str(ctx.guild.id)
        _ensure("guild_config", gid)
        with get_db() as db:
            db.execute("UPDATE guild_config SET prefix=? WHERE guild_id=?", (prefix, gid))
        await ctx.send(embed=ok(f"تم تغيير البادئة إلى `{prefix}`"))

    # ─── Welcome ──────────────────────────────────────────────────────────────

    @commands.group(name="welcome", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def welcome_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر الترحيب:**\n"
            "`!welcome on` — تفعيل\n"
            "`!welcome off` — تعطيل\n"
            "`!welcome channel #قناة` — تحديد القناة\n"
            "`!welcome message <نص>` — تغيير الرسالة\n"
            "`!welcome color #hex` — تغيير اللون\n\n"
            "متغيرات الرسالة: `{user}` `{server}` `{count}`"
        ))

    @welcome_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def welcome_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("welcome_config", gid)
        with get_db() as db:
            db.execute("UPDATE welcome_config SET enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل رسائل الترحيب."))

    @welcome_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def welcome_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("welcome_config", gid)
        with get_db() as db:
            db.execute("UPDATE welcome_config SET enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل رسائل الترحيب."))

    @welcome_group.command(name="channel")
    @commands.has_permissions(administrator=True)
    async def welcome_channel(self, ctx: commands.Context, channel: discord.TextChannel):
        gid = str(ctx.guild.id)
        _ensure("welcome_config", gid)
        with get_db() as db:
            db.execute("UPDATE welcome_config SET channel_id=? WHERE guild_id=?", (str(channel.id), gid))
        await ctx.send(embed=ok(f"قناة الترحيب: {channel.mention}"))

    @welcome_group.command(name="message")
    @commands.has_permissions(administrator=True)
    async def welcome_message(self, ctx: commands.Context, *, message: str):
        gid = str(ctx.guild.id)
        _ensure("welcome_config", gid)
        with get_db() as db:
            db.execute("UPDATE welcome_config SET message=? WHERE guild_id=?", (message, gid))
        await ctx.send(embed=ok(f"تم تغيير رسالة الترحيب:\n`{message}`"))

    @welcome_group.command(name="color")
    @commands.has_permissions(administrator=True)
    async def welcome_color(self, ctx: commands.Context, color: str):
        if not color.startswith("#") or len(color) != 7:
            return await ctx.send(embed=err("اكتب اللون بصيغة `#RRGGBB` مثل `#a855f7`"))
        gid = str(ctx.guild.id)
        _ensure("welcome_config", gid)
        with get_db() as db:
            db.execute("UPDATE welcome_config SET embed_color=? WHERE guild_id=?", (color, gid))
        await ctx.send(embed=ok(f"تم تغيير لون الترحيب إلى `{color}`"))

    # ─── Leave ────────────────────────────────────────────────────────────────

    @commands.group(name="leave", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def leave_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر الوداع:**\n"
            "`!leave on` — تفعيل\n"
            "`!leave off` — تعطيل\n"
            "`!leave channel #قناة` — تحديد القناة\n"
            "`!leave message <نص>` — تغيير الرسالة\n"
            "`!leave color #hex` — تغيير اللون"
        ))

    @leave_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def leave_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("leave_config", gid)
        with get_db() as db:
            db.execute("UPDATE leave_config SET enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل رسائل الوداع."))

    @leave_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def leave_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("leave_config", gid)
        with get_db() as db:
            db.execute("UPDATE leave_config SET enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل رسائل الوداع."))

    @leave_group.command(name="channel")
    @commands.has_permissions(administrator=True)
    async def leave_channel(self, ctx: commands.Context, channel: discord.TextChannel):
        gid = str(ctx.guild.id)
        _ensure("leave_config", gid)
        with get_db() as db:
            db.execute("UPDATE leave_config SET channel_id=? WHERE guild_id=?", (str(channel.id), gid))
        await ctx.send(embed=ok(f"قناة الوداع: {channel.mention}"))

    @leave_group.command(name="message")
    @commands.has_permissions(administrator=True)
    async def leave_message(self, ctx: commands.Context, *, message: str):
        gid = str(ctx.guild.id)
        _ensure("leave_config", gid)
        with get_db() as db:
            db.execute("UPDATE leave_config SET message=? WHERE guild_id=?", (message, gid))
        await ctx.send(embed=ok(f"تم تغيير رسالة الوداع:\n`{message}`"))

    @leave_group.command(name="color")
    @commands.has_permissions(administrator=True)
    async def leave_color(self, ctx: commands.Context, color: str):
        if not color.startswith("#") or len(color) != 7:
            return await ctx.send(embed=err("اكتب اللون بصيغة `#RRGGBB`"))
        gid = str(ctx.guild.id)
        _ensure("leave_config", gid)
        with get_db() as db:
            db.execute("UPDATE leave_config SET embed_color=? WHERE guild_id=?", (color, gid))
        await ctx.send(embed=ok(f"تم تغيير لون الوداع إلى `{color}`"))

    # ─── Logging ──────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="setlog", description="تفعيل/تعطيل سجل الأحداث")
    @commands.has_permissions(administrator=True)
    async def setlog(self, ctx: commands.Context, channel: discord.TextChannel = None):
        gid = str(ctx.guild.id)
        _ensure("logging_config", gid)
        if channel is None:
            with get_db() as db:
                db.execute("UPDATE logging_config SET enabled=0 WHERE guild_id=?", (gid,))
            return await ctx.send(embed=ok("تم تعطيل سجل الأحداث."))
        with get_db() as db:
            db.execute("UPDATE logging_config SET channel_id=?, enabled=1 WHERE guild_id=?", (str(channel.id), gid))
        await ctx.send(embed=ok(f"تم تفعيل سجل الأحداث في {channel.mention}"))

    # ─── Auto-Roles ───────────────────────────────────────────────────────────

    @commands.group(name="autorole", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def autorole_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر الرتب التلقائية:**\n"
            "`!autorole add @رتبة` — إضافة رتبة تلقائية\n"
            "`!autorole remove @رتبة` — إزالة رتبة تلقائية\n"
            "`!autorole list` — عرض الرتب"
        ))

    @autorole_group.command(name="add")
    @commands.has_permissions(administrator=True)
    async def autorole_add(self, ctx: commands.Context, role: discord.Role):
        gid = str(ctx.guild.id)
        with get_db() as db:
            db.execute("INSERT OR IGNORE INTO autoroles (guild_id, role_id, bot_only) VALUES (?,?,0)", (gid, str(role.id)))
        await ctx.send(embed=ok(f"تمت إضافة {role.mention} كرتبة تلقائية."))

    @autorole_group.command(name="remove")
    @commands.has_permissions(administrator=True)
    async def autorole_remove(self, ctx: commands.Context, role: discord.Role):
        gid = str(ctx.guild.id)
        with get_db() as db:
            db.execute("DELETE FROM autoroles WHERE guild_id=? AND role_id=?", (gid, str(role.id)))
        await ctx.send(embed=ok(f"تمت إزالة {role.mention} من الرتب التلقائية."))

    @autorole_group.command(name="list")
    @commands.has_permissions(administrator=True)
    async def autorole_list(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        with get_db() as db:
            rows = db.execute("SELECT role_id FROM autoroles WHERE guild_id=?", (gid,)).fetchall()
        if not rows:
            return await ctx.send(embed=info("لا توجد رتب تلقائية مضافة."))
        roles = []
        for r in rows:
            role = ctx.guild.get_role(int(r["role_id"]))
            roles.append(role.mention if role else f"`{r['role_id']}`")
        embed = discord.Embed(title="🔰 الرتب التلقائية", description="\n".join(roles), color=0xA855F7)
        await ctx.send(embed=embed)

    # ─── Leveling ─────────────────────────────────────────────────────────────

    @commands.group(name="leveling", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def leveling_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر المستويات:**\n"
            "`!leveling on` — تفعيل\n"
            "`!leveling off` — تعطيل\n"
            "`!leveling channel #قناة` — قناة إشعارات الترقية\n"
            "`!leveling message <نص>` — رسالة الترقية (`{user}` و `{level}`)\n"
            "`!leveling xp <min> <max>` — نطاق XP لكل رسالة\n"
            "`!leveling cooldown <ثواني>` — كولداون بين الرسائل"
        ))

    @leveling_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def leveling_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("leveling_config", gid)
        with get_db() as db:
            db.execute("UPDATE leveling_config SET enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل نظام المستويات."))

    @leveling_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def leveling_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("leveling_config", gid)
        with get_db() as db:
            db.execute("UPDATE leveling_config SET enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل نظام المستويات."))

    @leveling_group.command(name="channel")
    @commands.has_permissions(administrator=True)
    async def leveling_channel(self, ctx: commands.Context, channel: discord.TextChannel):
        gid = str(ctx.guild.id)
        _ensure("leveling_config", gid)
        with get_db() as db:
            db.execute("UPDATE leveling_config SET levelup_channel=? WHERE guild_id=?", (str(channel.id), gid))
        await ctx.send(embed=ok(f"قناة إشعارات الترقية: {channel.mention}"))

    @leveling_group.command(name="message")
    @commands.has_permissions(administrator=True)
    async def leveling_message(self, ctx: commands.Context, *, message: str):
        gid = str(ctx.guild.id)
        _ensure("leveling_config", gid)
        with get_db() as db:
            db.execute("UPDATE leveling_config SET levelup_message=? WHERE guild_id=?", (message, gid))
        await ctx.send(embed=ok(f"تم تغيير رسالة الترقية:\n`{message}`"))

    @leveling_group.command(name="xp")
    @commands.has_permissions(administrator=True)
    async def leveling_xp(self, ctx: commands.Context, min_xp: int, max_xp: int):
        if min_xp < 1 or max_xp < min_xp:
            return await ctx.send(embed=err("min يجب أن يكون أقل من max وكلاهما أكبر من 0"))
        gid = str(ctx.guild.id)
        _ensure("leveling_config", gid)
        with get_db() as db:
            db.execute("UPDATE leveling_config SET xp_min=?, xp_max=? WHERE guild_id=?", (min_xp, max_xp, gid))
        await ctx.send(embed=ok(f"نطاق XP: `{min_xp}` – `{max_xp}` لكل رسالة."))

    @leveling_group.command(name="cooldown")
    @commands.has_permissions(administrator=True)
    async def leveling_cooldown(self, ctx: commands.Context, seconds: int):
        if seconds < 1:
            return await ctx.send(embed=err("الكولداون يجب أن يكون ثانية أو أكثر."))
        gid = str(ctx.guild.id)
        _ensure("leveling_config", gid)
        with get_db() as db:
            db.execute("UPDATE leveling_config SET cooldown_seconds=? WHERE guild_id=?", (seconds, gid))
        await ctx.send(embed=ok(f"الكولداون: `{seconds}` ثانية."))

    # ─── Anti-Spam ────────────────────────────────────────────────────────────

    @commands.group(name="antispam", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def antispam_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر Anti-Spam:**\n"
            "`!antispam on` — تفعيل\n"
            "`!antispam off` — تعطيل\n"
            "`!antispam limit <رسائل> <ثواني>` — مثال: `!antispam limit 5 4`\n"
            "`!antispam action <timeout/kick/ban>` — نوع العقوبة"
        ))

    @antispam_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def antispam_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antispam_enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل Anti-Spam."))

    @antispam_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def antispam_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antispam_enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل Anti-Spam."))

    @antispam_group.command(name="limit")
    @commands.has_permissions(administrator=True)
    async def antispam_limit(self, ctx: commands.Context, messages: int, seconds: int):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antispam_messages=?, antispam_seconds=? WHERE guild_id=?", (messages, seconds, gid))
        await ctx.send(embed=ok(f"حد السبام: `{messages}` رسائل خلال `{seconds}` ثواني."))

    @antispam_group.command(name="action")
    @commands.has_permissions(administrator=True)
    async def antispam_action(self, ctx: commands.Context, action: str):
        if action not in ("timeout", "kick", "ban"):
            return await ctx.send(embed=err("الخيارات: `timeout` `kick` `ban`"))
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antispam_action=? WHERE guild_id=?", (action, gid))
        await ctx.send(embed=ok(f"عقوبة Anti-Spam: `{action}`"))

    # ─── Anti-Link ────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="antilink", description="تفعيل/تعطيل منع الروابط")
    @commands.has_permissions(administrator=True)
    async def antilink(self, ctx: commands.Context, toggle: str):
        if toggle not in ("on", "off"):
            return await ctx.send(embed=err("اكتب `on` أو `off`"))
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        val = 1 if toggle == "on" else 0
        with get_db() as db:
            db.execute("UPDATE protection_config SET antilink_enabled=? WHERE guild_id=?", (val, gid))
        await ctx.send(embed=ok(f"تم {'تفعيل' if val else 'تعطيل'} Anti-Link."))

    # ─── Anti-Raid ────────────────────────────────────────────────────────────

    @commands.group(name="antiraid", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def antiraid_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر Anti-Raid:**\n"
            "`!antiraid on` — تفعيل\n"
            "`!antiraid off` — تعطيل\n"
            "`!antiraid limit <انضمامات> <ثواني>` — مثال: `!antiraid limit 8 10`\n"
            "`!antiraid action <kick/ban>` — نوع العقوبة"
        ))

    @antiraid_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def antiraid_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antiraid_enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل Anti-Raid."))

    @antiraid_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def antiraid_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antiraid_enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل Anti-Raid."))

    @antiraid_group.command(name="limit")
    @commands.has_permissions(administrator=True)
    async def antiraid_limit(self, ctx: commands.Context, joins: int, seconds: int):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antiraid_joins=?, antiraid_seconds=? WHERE guild_id=?", (joins, seconds, gid))
        await ctx.send(embed=ok(f"حد الريد: `{joins}` انضمامات خلال `{seconds}` ثواني."))

    @antiraid_group.command(name="action")
    @commands.has_permissions(administrator=True)
    async def antiraid_action(self, ctx: commands.Context, action: str):
        if action not in ("kick", "ban"):
            return await ctx.send(embed=err("الخيارات: `kick` `ban`"))
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antiraid_action=? WHERE guild_id=?", (action, gid))
        await ctx.send(embed=ok(f"عقوبة Anti-Raid: `{action}`"))

    # ─── Anti-Mentions ────────────────────────────────────────────────────────

    @commands.group(name="antimentions", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def antimentions_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر Anti-Mentions:**\n"
            "`!antimentions on` — تفعيل\n"
            "`!antimentions off` — تعطيل\n"
            "`!antimentions limit <عدد>` — الحد الأقصى للمنشنات"
        ))

    @antimentions_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def antimentions_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antimentions_enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل Anti-Mentions."))

    @antimentions_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def antimentions_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antimentions_enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل Anti-Mentions."))

    @antimentions_group.command(name="limit")
    @commands.has_permissions(administrator=True)
    async def antimentions_limit(self, ctx: commands.Context, limit: int):
        if limit < 1:
            return await ctx.send(embed=err("الحد يجب أن يكون 1 أو أكثر."))
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET antimentions_limit=? WHERE guild_id=?", (limit, gid))
        await ctx.send(embed=ok(f"حد المنشنات: `{limit}` منشن لكل رسالة."))

    # ─── Bad Words ────────────────────────────────────────────────────────────

    @commands.group(name="badwords", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def badwords_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر Bad Words:**\n"
            "`!badwords on` — تفعيل\n"
            "`!badwords off` — تعطيل\n"
            "`!badwords add <كلمة>` — إضافة كلمة محظورة\n"
            "`!badwords remove <كلمة>` — إزالة كلمة\n"
            "`!badwords list` — عرض الكلمات المحظورة"
        ))

    @badwords_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def badwords_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET badwords_enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل فلتر الكلمات المحظورة."))

    @badwords_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def badwords_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            db.execute("UPDATE protection_config SET badwords_enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل فلتر الكلمات المحظورة."))

    @badwords_group.command(name="add")
    @commands.has_permissions(administrator=True)
    async def badwords_add(self, ctx: commands.Context, *, word: str):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            row = db.execute("SELECT badwords FROM protection_config WHERE guild_id=?", (gid,)).fetchone()
            words = json.loads(row["badwords"] or "[]") if row else []
            if word.lower() not in [w.lower() for w in words]:
                words.append(word.lower())
            db.execute("UPDATE protection_config SET badwords=? WHERE guild_id=?", (json.dumps(words), gid))
        await ctx.send(embed=ok(f"تمت إضافة `{word}` للكلمات المحظورة."))

    @badwords_group.command(name="remove")
    @commands.has_permissions(administrator=True)
    async def badwords_remove(self, ctx: commands.Context, *, word: str):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            row = db.execute("SELECT badwords FROM protection_config WHERE guild_id=?", (gid,)).fetchone()
            words = json.loads(row["badwords"] or "[]") if row else []
            words = [w for w in words if w.lower() != word.lower()]
            db.execute("UPDATE protection_config SET badwords=? WHERE guild_id=?", (json.dumps(words), gid))
        await ctx.send(embed=ok(f"تمت إزالة `{word}` من الكلمات المحظورة."))

    @badwords_group.command(name="list")
    @commands.has_permissions(administrator=True)
    async def badwords_list(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("protection_config", gid)
        with get_db() as db:
            row = db.execute("SELECT badwords FROM protection_config WHERE guild_id=?", (gid,)).fetchone()
        words = json.loads(row["badwords"] or "[]") if row else []
        if not words:
            return await ctx.send(embed=info("لا توجد كلمات محظورة."))
        embed = discord.Embed(title="🚫 الكلمات المحظورة", description="\n".join(f"`{w}`" for w in words), color=0xEF4444)
        await ctx.send(embed=embed)

    # ─── Anti-Nuke ────────────────────────────────────────────────────────────

    @commands.group(name="antinuke", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def antinuke_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر Anti-Nuke:**\n"
            "`!antinuke on` — تفعيل\n"
            "`!antinuke off` — تعطيل\n"
            "`!antinuke threshold <ban/kick/channel/role> <عدد>` — تحديد الحد\n"
            "`!antinuke punishment <ban/kick/strip>` — نوع العقوبة\n"
            "`!antinuke whitelist add @عضو` — إضافة للوايتليست\n"
            "`!antinuke whitelist remove @عضو` — إزالة من الوايتليست"
        ))

    @antinuke_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def antinuke_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("antinuke_config", gid)
        with get_db() as db:
            db.execute("UPDATE antinuke_config SET enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل Anti-Nuke. ⚠️ تأكد من إضافة الأدمنز الموثوقين للوايتليست!"))

    @antinuke_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def antinuke_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("antinuke_config", gid)
        with get_db() as db:
            db.execute("UPDATE antinuke_config SET enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل Anti-Nuke."))

    @antinuke_group.command(name="threshold")
    @commands.has_permissions(administrator=True)
    async def antinuke_threshold(self, ctx: commands.Context, type: str, count: int):
        cols = {"ban": "ban_threshold", "kick": "kick_threshold", "channel": "channel_threshold", "role": "role_threshold", "webhook": "webhook_threshold"}
        if type not in cols:
            return await ctx.send(embed=err("الأنواع: `ban` `kick` `channel` `role` `webhook`"))
        gid = str(ctx.guild.id)
        _ensure("antinuke_config", gid)
        with get_db() as db:
            db.execute(f"UPDATE antinuke_config SET {cols[type]}=? WHERE guild_id=?", (count, gid))
        await ctx.send(embed=ok(f"حد `{type}`: `{count}` عملية قبل العقوبة."))

    @antinuke_group.command(name="punishment")
    @commands.has_permissions(administrator=True)
    async def antinuke_punishment(self, ctx: commands.Context, punishment: str):
        if punishment not in ("ban", "kick", "strip"):
            return await ctx.send(embed=err("الخيارات: `ban` `kick` `strip`"))
        gid = str(ctx.guild.id)
        _ensure("antinuke_config", gid)
        with get_db() as db:
            db.execute("UPDATE antinuke_config SET punishment=? WHERE guild_id=?", (punishment, gid))
        await ctx.send(embed=ok(f"عقوبة Anti-Nuke: `{punishment}`"))

    @antinuke_group.group(name="whitelist", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def antinuke_whitelist(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("antinuke_config", gid)
        with get_db() as db:
            row = db.execute("SELECT whitelist FROM antinuke_config WHERE guild_id=?", (gid,)).fetchone()
        wl = json.loads(row["whitelist"] or "[]") if row else []
        if not wl:
            return await ctx.send(embed=info("الوايتليست فارغ."))
        members = []
        for uid in wl:
            m = ctx.guild.get_member(int(uid))
            members.append(m.mention if m else f"`{uid}`")
        embed = discord.Embed(title="✅ Whitelist Anti-Nuke", description="\n".join(members), color=0x22C55E)
        await ctx.send(embed=embed)

    @antinuke_whitelist.command(name="add")
    @commands.has_permissions(administrator=True)
    async def antinuke_wl_add(self, ctx: commands.Context, member: discord.Member):
        gid = str(ctx.guild.id)
        _ensure("antinuke_config", gid)
        with get_db() as db:
            row = db.execute("SELECT whitelist FROM antinuke_config WHERE guild_id=?", (gid,)).fetchone()
            wl = json.loads(row["whitelist"] or "[]") if row else []
            if str(member.id) not in wl:
                wl.append(str(member.id))
            db.execute("UPDATE antinuke_config SET whitelist=? WHERE guild_id=?", (json.dumps(wl), gid))
        await ctx.send(embed=ok(f"تمت إضافة {member.mention} للوايتليست."))

    @antinuke_whitelist.command(name="remove")
    @commands.has_permissions(administrator=True)
    async def antinuke_wl_remove(self, ctx: commands.Context, member: discord.Member):
        gid = str(ctx.guild.id)
        _ensure("antinuke_config", gid)
        with get_db() as db:
            row = db.execute("SELECT whitelist FROM antinuke_config WHERE guild_id=?", (gid,)).fetchone()
            wl = json.loads(row["whitelist"] or "[]") if row else []
            wl = [x for x in wl if x != str(member.id)]
            db.execute("UPDATE antinuke_config SET whitelist=? WHERE guild_id=?", (json.dumps(wl), gid))
        await ctx.send(embed=ok(f"تمت إزالة {member.mention} من الوايتليست."))

    # ─── Tickets ──────────────────────────────────────────────────────────────

    @commands.group(name="settickets", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def settickets_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر إعداد التذاكر:**\n"
            "`!settickets category #كاتيغوري` — كاتيغوري التذاكر الجديدة\n"
            "`!settickets support @رتبة` — رتبة الدعم\n"
            "`!settickets log #قناة` — قناة السجل\n"
            "ثم استخدم `!setup_tickets` لإرسال لوحة التذاكر."
        ))

    @settickets_group.command(name="category")
    @commands.has_permissions(administrator=True)
    async def settickets_category(self, ctx: commands.Context, category: discord.CategoryChannel):
        gid = str(ctx.guild.id)
        _ensure("ticket_config", gid)
        with get_db() as db:
            db.execute("UPDATE ticket_config SET category_id=? WHERE guild_id=?", (str(category.id), gid))
        await ctx.send(embed=ok(f"كاتيغوري التذاكر: **{category.name}**"))

    @settickets_group.command(name="support")
    @commands.has_permissions(administrator=True)
    async def settickets_support(self, ctx: commands.Context, role: discord.Role):
        gid = str(ctx.guild.id)
        _ensure("ticket_config", gid)
        with get_db() as db:
            db.execute("UPDATE ticket_config SET support_role=? WHERE guild_id=?", (str(role.id), gid))
        await ctx.send(embed=ok(f"رتبة الدعم: {role.mention}"))

    @settickets_group.command(name="log")
    @commands.has_permissions(administrator=True)
    async def settickets_log(self, ctx: commands.Context, channel: discord.TextChannel):
        gid = str(ctx.guild.id)
        _ensure("ticket_config", gid)
        with get_db() as db:
            db.execute("UPDATE ticket_config SET log_channel=? WHERE guild_id=?", (str(channel.id), gid))
        await ctx.send(embed=ok(f"قناة سجل التذاكر: {channel.mention}"))

    # ─── Suggestions ──────────────────────────────────────────────────────────

    @commands.group(name="setsuggestions", invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def setsuggestions_group(self, ctx: commands.Context):
        await ctx.send(embed=info(
            "**أوامر إعداد الاقتراحات:**\n"
            "`!setsuggestions on` — تفعيل\n"
            "`!setsuggestions off` — تعطيل\n"
            "`!setsuggestions channel #قناة` — قناة الاقتراحات\n"
            "`!setsuggestions log #قناة` — قناة السجل"
        ))

    @setsuggestions_group.command(name="on")
    @commands.has_permissions(administrator=True)
    async def setsuggestions_on(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("suggestion_config", gid)
        with get_db() as db:
            db.execute("UPDATE suggestion_config SET enabled=1 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تفعيل نظام الاقتراحات."))

    @setsuggestions_group.command(name="off")
    @commands.has_permissions(administrator=True)
    async def setsuggestions_off(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        _ensure("suggestion_config", gid)
        with get_db() as db:
            db.execute("UPDATE suggestion_config SET enabled=0 WHERE guild_id=?", (gid,))
        await ctx.send(embed=ok("تم تعطيل نظام الاقتراحات."))

    @setsuggestions_group.command(name="channel")
    @commands.has_permissions(administrator=True)
    async def setsuggestions_channel(self, ctx: commands.Context, channel: discord.TextChannel):
        gid = str(ctx.guild.id)
        _ensure("suggestion_config", gid)
        with get_db() as db:
            db.execute("UPDATE suggestion_config SET channel_id=? WHERE guild_id=?", (str(channel.id), gid))
        await ctx.send(embed=ok(f"قناة الاقتراحات: {channel.mention}"))

    @setsuggestions_group.command(name="log")
    @commands.has_permissions(administrator=True)
    async def setsuggestions_log(self, ctx: commands.Context, channel: discord.TextChannel):
        gid = str(ctx.guild.id)
        _ensure("suggestion_config", gid)
        with get_db() as db:
            db.execute("UPDATE suggestion_config SET log_channel=? WHERE guild_id=?", (str(channel.id), gid))
        await ctx.send(embed=ok(f"قناة سجل الاقتراحات: {channel.mention}"))

    # ─── Custom Commands ──────────────────────────────────────────────────────

    @commands.hybrid_command(name="addcmd", description="إضافة أمر مخصص")
    @commands.has_permissions(administrator=True)
    async def addcmd(self, ctx: commands.Context, trigger: str, *, response: str):
        gid = str(ctx.guild.id)
        with get_db() as db:
            db.execute(
                "INSERT OR REPLACE INTO custom_commands (guild_id, trigger, response, uses) VALUES (?,?,?,0)",
                (gid, trigger.lower(), response)
            )
        await ctx.send(embed=ok(f"تمت إضافة الأمر `{trigger}` ← `{response}`"))

    @commands.hybrid_command(name="removecmd", description="حذف أمر مخصص")
    @commands.has_permissions(administrator=True)
    async def removecmd(self, ctx: commands.Context, trigger: str):
        gid = str(ctx.guild.id)
        with get_db() as db:
            db.execute("DELETE FROM custom_commands WHERE guild_id=? AND trigger=?", (gid, trigger.lower()))
        await ctx.send(embed=ok(f"تم حذف الأمر `{trigger}`."))

    @commands.hybrid_command(name="listcmds", description="عرض الأوامر المخصصة")
    async def listcmds(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        with get_db() as db:
            rows = db.execute("SELECT trigger, response, uses FROM custom_commands WHERE guild_id=? ORDER BY uses DESC", (gid,)).fetchall()
        if not rows:
            return await ctx.send(embed=info("لا توجد أوامر مخصصة."))
        desc = "\n".join(f"`{r['trigger']}` ← {r['response'][:40]} *(استُخدم {r['uses']} مرة)*" for r in rows)
        embed = discord.Embed(title="🤖 الأوامر المخصصة", description=desc, color=0xA855F7)
        await ctx.send(embed=embed)

    # ─── Settings Overview ────────────────────────────────────────────────────

    @commands.hybrid_command(name="settings", description="عرض جميع الإعدادات الحالية")
    @commands.has_permissions(administrator=True)
    async def settings(self, ctx: commands.Context):
        gid = str(ctx.guild.id)
        with get_db() as db:
            gc = db.execute("SELECT prefix FROM guild_config WHERE guild_id=?", (gid,)).fetchone()
            wc = db.execute("SELECT enabled, channel_id FROM welcome_config WHERE guild_id=?", (gid,)).fetchone()
            lc = db.execute("SELECT enabled, channel_id FROM leave_config WHERE guild_id=?", (gid,)).fetchone()
            log = db.execute("SELECT enabled, channel_id FROM logging_config WHERE guild_id=?", (gid,)).fetchone()
            prot = db.execute("SELECT antispam_enabled, antilink_enabled, antiraid_enabled, antimentions_enabled, badwords_enabled FROM protection_config WHERE guild_id=?", (gid,)).fetchone()
            lvl = db.execute("SELECT enabled FROM leveling_config WHERE guild_id=?", (gid,)).fetchone()
            an = db.execute("SELECT enabled FROM antinuke_config WHERE guild_id=?", (gid,)).fetchone()
            sug = db.execute("SELECT enabled FROM suggestion_config WHERE guild_id=?", (gid,)).fetchone()
            ar = db.execute("SELECT COUNT(*) as cnt FROM autoroles WHERE guild_id=?", (gid,)).fetchone()
            cc = db.execute("SELECT COUNT(*) as cnt FROM custom_commands WHERE guild_id=?", (gid,)).fetchone()

        def ch(row, col):
            if not row:
                return None
            cid = row[col] if col in row.keys() else None
            if not cid:
                return None
            c = ctx.guild.get_channel(int(cid))
            return c.mention if c else f"`{cid}`"

        def tog(row, col="enabled"):
            if not row:
                return "⚫ غير مُعدّ"
            return "🟢 مفعّل" if row[col] else "🔴 معطّل"

        embed = discord.Embed(title=f"⚙️ إعدادات {ctx.guild.name}", color=0xA855F7)
        embed.add_field(name="البادئة", value=f"`{gc['prefix'] if gc else '!'}`", inline=True)
        embed.add_field(name="الترحيب", value=f"{tog(wc)} {ch(wc,'channel_id') or ''}", inline=True)
        embed.add_field(name="الوداع", value=f"{tog(lc)} {ch(lc,'channel_id') or ''}", inline=True)
        embed.add_field(name="السجل", value=f"{tog(log)} {ch(log,'channel_id') or ''}", inline=True)
        embed.add_field(name="المستويات", value=tog(lvl), inline=True)
        embed.add_field(name="Anti-Nuke", value=tog(an), inline=True)
        embed.add_field(name="الاقتراحات", value=tog(sug), inline=True)
        embed.add_field(name="الرتب التلقائية", value=f"`{ar['cnt'] if ar else 0}` رتبة", inline=True)
        embed.add_field(name="أوامر مخصصة", value=f"`{cc['cnt'] if cc else 0}` أمر", inline=True)
        if prot:
            prot_list = []
            if prot["antispam_enabled"]: prot_list.append("Anti-Spam")
            if prot["antilink_enabled"]: prot_list.append("Anti-Link")
            if prot["antiraid_enabled"]: prot_list.append("Anti-Raid")
            if prot["antimentions_enabled"]: prot_list.append("Anti-Mentions")
            if prot["badwords_enabled"]: prot_list.append("Bad Words")
            embed.add_field(name="الحماية المفعّلة", value=", ".join(prot_list) if prot_list else "لا شيء", inline=False)
        embed.set_footer(text="استخدم الأوامر أو الداشبورد لتغيير الإعدادات")
        await ctx.send(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(Config(bot))
