"""
birthday.py — Rova Bot
نظام أعياد الميلاد: تسجيل وتهنئة تلقائية
"""

import discord
from discord.ext import commands
from discord import app_commands
from discord.ext import tasks
import time
from datetime import datetime
from utils.dashboard_db import get_db

MONTHS_AR = {
    1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
    5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
    9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر"
}


def get_bday_config(guild_id: str) -> dict:
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO birthday_config (guild_id) VALUES (?)", (guild_id,))
        row = db.execute("SELECT * FROM birthday_config WHERE guild_id=?", (guild_id,)).fetchone()
    return dict(row) if row else {"enabled": 0, "channel_id": None, "message": "عيد ميلاد سعيد {user}! 🎂"}


class Birthday(commands.Cog):
    """🎂 نظام أعياد الميلاد"""

    def __init__(self, bot):
        self.bot = bot
        self.birthday_check.start()

    def cog_unload(self):
        self.birthday_check.cancel()

    # ── Set Birthday ──────────────────────────────────────────────────────────

    @commands.hybrid_command(name="setbirthday", aliases=["ميلادي"], description="سجّل تاريخ ميلادك")
    @app_commands.describe(day="اليوم (1-31)", month="الشهر (1-12)")
    async def setbirthday(self, ctx, day: int, month: int):
        if not (1 <= day <= 31) or not (1 <= month <= 12):
            await ctx.send("❌ تاريخ غير صالح. مثال: `/setbirthday 15 3`", ephemeral=True)
            return
        with get_db() as db:
            db.execute(
                "INSERT OR REPLACE INTO birthdays (guild_id, user_id, month, day) VALUES (?,?,?,?)",
                (str(ctx.guild.id), str(ctx.author.id), month, day)
            )
        await ctx.send(f"🎂 تم تسجيل ميلادك في **{day} {MONTHS_AR[month]}**!", ephemeral=True)

    # ── Remove Birthday ───────────────────────────────────────────────────────

    @commands.hybrid_command(name="removebirthday", aliases=["حذف-ميلادي"], description="احذف تاريخ ميلادك")
    async def removebirthday(self, ctx):
        with get_db() as db:
            db.execute("DELETE FROM birthdays WHERE guild_id=? AND user_id=?",
                       (str(ctx.guild.id), str(ctx.author.id)))
        await ctx.send("✅ تم حذف تاريخ ميلادك.", ephemeral=True)

    # ── Next Birthdays ────────────────────────────────────────────────────────

    @commands.hybrid_command(name="birthdays", aliases=["مواليد"], description="اعرض أعياد الميلاد القادمة")
    async def birthdays(self, ctx):
        now = datetime.utcnow()
        with get_db() as db:
            rows = db.execute(
                "SELECT user_id, month, day FROM birthdays WHERE guild_id=? ORDER BY month, day",
                (str(ctx.guild.id),)
            ).fetchall()

        if not rows:
            await ctx.send("🎂 لا يوجد أحد سجّل ميلاده بعد.")
            return

        upcoming = []
        for row in rows:
            r = dict(row)
            m = ctx.guild.get_member(int(r["user_id"]))
            if not m: continue
            bday = datetime(now.year, r["month"], min(r["day"], 28), 0, 0, 0)
            if bday < now:
                bday = datetime(now.year + 1, r["month"], min(r["day"], 28), 0, 0, 0)
            days_left = (bday - now).days
            upcoming.append((m.display_name, r["day"], r["month"], days_left))

        upcoming.sort(key=lambda x: x[3])
        embed = discord.Embed(title="🎂 أعياد الميلاد القادمة", color=0xf472b6)
        for name, day, month, days in upcoming[:10]:
            suffix = "اليوم! 🎉" if days == 0 else f"خلال {days} يوم"
            embed.add_field(name=f"🎂 {name}", value=f"{day} {MONTHS_AR[month]} — {suffix}", inline=False)
        await ctx.send(embed=embed)

    # ── Birthday Setup ────────────────────────────────────────────────────────

    @commands.hybrid_command(name="birthday-setup", description="[أدمن] إعداد نظام أعياد الميلاد")
    @commands.has_permissions(administrator=True)
    @app_commands.describe(channel="قناة التهنئة")
    async def birthday_setup(self, ctx, channel: discord.TextChannel):
        with get_db() as db:
            db.execute("INSERT OR IGNORE INTO birthday_config (guild_id) VALUES (?)", (str(ctx.guild.id),))
            db.execute(
                "UPDATE birthday_config SET enabled=1, channel_id=? WHERE guild_id=?",
                (str(channel.id), str(ctx.guild.id))
            )
        await ctx.send(f"✅ سيتم إرسال تهاني الميلاد في {channel.mention}!")

    # ── Background Check ──────────────────────────────────────────────────────

    @tasks.loop(hours=1)
    async def birthday_check(self):
        now = datetime.utcnow()
        today_month, today_day = now.month, now.day
        if now.hour != 9:
            return

        with get_db() as db:
            guilds_cfg = db.execute(
                "SELECT * FROM birthday_config WHERE enabled=1"
            ).fetchall()

        for cfg_row in guilds_cfg:
            cfg = dict(cfg_row)
            guild = self.bot.get_guild(int(cfg["guild_id"]))
            if not guild: continue
            channel = guild.get_channel(int(cfg["channel_id"])) if cfg.get("channel_id") else None
            if not channel: continue

            with get_db() as db:
                rows = db.execute(
                    "SELECT user_id FROM birthdays WHERE guild_id=? AND month=? AND day=?",
                    (cfg["guild_id"], today_month, today_day)
                ).fetchall()

            for row in rows:
                member = guild.get_member(int(row["user_id"]))
                if not member: continue
                msg = cfg.get("message", "عيد ميلاد سعيد {user}! 🎂").replace("{user}", member.mention)
                embed = discord.Embed(
                    title="🎂 عيد ميلاد سعيد!",
                    description=msg,
                    color=0xf472b6
                )
                embed.set_thumbnail(url=member.display_avatar.url)
                try:
                    await channel.send(embed=embed)
                except Exception:
                    pass

    @birthday_check.before_loop
    async def before_bday(self):
        await self.bot.wait_until_ready()


async def setup(bot): await bot.add_cog(Birthday(bot))
