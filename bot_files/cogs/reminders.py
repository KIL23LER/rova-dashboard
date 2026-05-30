"""
reminders.py — Rova Bot
نظام التذكيرات: ذكّرني بعد وقت معين
"""

import discord
from discord.ext import commands
from discord import app_commands
from discord.ext import tasks
import time
import re
from utils.dashboard_db import get_db


def parse_time(text: str) -> int:
    """تحويل نص الوقت (مثل 1h30m) إلى ثوانٍ"""
    pattern = r'(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?'
    m = re.match(pattern, text.strip())
    if not m: return 0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + s


def fmt_time(seconds: int) -> str:
    parts = []
    if seconds >= 86400: parts.append(f"{seconds//86400}يوم"); seconds %= 86400
    if seconds >= 3600: parts.append(f"{seconds//3600}س"); seconds %= 3600
    if seconds >= 60: parts.append(f"{seconds//60}د"); seconds %= 60
    if seconds: parts.append(f"{seconds}ث")
    return " ".join(parts) or "0ث"


class Reminders(commands.Cog):
    """⏰ نظام التذكيرات"""

    def __init__(self, bot):
        self.bot = bot
        self.check_reminders.start()

    def cog_unload(self):
        self.check_reminders.cancel()

    # ── Remind Me ─────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="remind", aliases=["ذكرني", "reminder"], description="ذكّرني بشيء بعد وقت")
    @app_commands.describe(
        when="متى؟ (مثل: 10m, 1h, 2h30m, 1d)",
        message="ماذا تريد أن تُذكَّر؟"
    )
    async def remind(self, ctx, when: str, *, message: str):
        seconds = parse_time(when)
        if seconds < 60:
            await ctx.send("❌ أقل وقت هو دقيقة واحدة. مثال: `10m`, `1h`, `2h30m`", ephemeral=True)
            return
        if seconds > 30 * 86400:
            await ctx.send("❌ أقصى وقت هو 30 يوم.", ephemeral=True)
            return

        remind_at = int(time.time()) + seconds
        with get_db() as db:
            db.execute(
                "INSERT INTO reminders (user_id, guild_id, channel_id, message, remind_at) VALUES (?,?,?,?,?)",
                (str(ctx.author.id), str(ctx.guild.id), str(ctx.channel.id), message, remind_at)
            )

        embed = discord.Embed(
            title="⏰ تم تعيين التذكير!",
            description=f"سأذكّرك بـ **{message}**",
            color=0xa855f7
        )
        embed.add_field(name="⏱️ بعد", value=fmt_time(seconds), inline=True)
        embed.add_field(name="📅 موعد التذكير", value=f"<t:{remind_at}:R>", inline=True)
        await ctx.send(embed=embed)

    # ── My Reminders ──────────────────────────────────────────────────────────

    @commands.hybrid_command(name="reminders", aliases=["تذكيراتي"], description="اعرض تذكيراتك")
    async def my_reminders(self, ctx):
        now = int(time.time())
        with get_db() as db:
            rows = db.execute(
                "SELECT * FROM reminders WHERE user_id=? AND guild_id=? AND done=0 AND remind_at>? ORDER BY remind_at ASC LIMIT 10",
                (str(ctx.author.id), str(ctx.guild.id), now)
            ).fetchall()

        if not rows:
            await ctx.send("📭 لا توجد تذكيرات نشطة.", ephemeral=True)
            return

        embed = discord.Embed(title="⏰ تذكيراتك", color=0xa855f7)
        for row in rows:
            r = dict(row)
            embed.add_field(
                name=f"#{r['id']} - <t:{r['remind_at']}:R>",
                value=r["message"][:100],
                inline=False
            )
        await ctx.send(embed=embed, ephemeral=True)

    # ── Cancel Reminder ───────────────────────────────────────────────────────

    @commands.hybrid_command(name="cancelreminder", aliases=["حذف-تذكير"], description="احذف تذكيراً")
    @app_commands.describe(reminder_id="رقم التذكير")
    async def cancel_reminder(self, ctx, reminder_id: int):
        with get_db() as db:
            db.execute(
                "UPDATE reminders SET done=1 WHERE id=? AND user_id=?",
                (reminder_id, str(ctx.author.id))
            )
        await ctx.send(f"✅ تم حذف التذكير #{reminder_id}.", ephemeral=True)

    # ── Background Task ───────────────────────────────────────────────────────

    @tasks.loop(seconds=30)
    async def check_reminders(self):
        now = int(time.time())
        with get_db() as db:
            rows = db.execute(
                "SELECT * FROM reminders WHERE done=0 AND remind_at<=?", (now,)
            ).fetchall()
            for row in rows:
                r = dict(row)
                try:
                    channel = self.bot.get_channel(int(r["channel_id"]))
                    if channel:
                        user = await self.bot.fetch_user(int(r["user_id"]))
                        embed = discord.Embed(
                            title="⏰ تذكير!",
                            description=r["message"],
                            color=0xa855f7,
                            timestamp=discord.utils.utcnow()
                        )
                        await channel.send(f"{user.mention}", embed=embed)
                except Exception:
                    pass
                db.execute("UPDATE reminders SET done=1 WHERE id=?", (r["id"],))

    @check_reminders.before_loop
    async def before_reminders(self):
        await self.bot.wait_until_ready()


async def setup(bot): await bot.add_cog(Reminders(bot))
