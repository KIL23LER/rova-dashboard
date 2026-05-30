"""
podcast.py — Rova Bot
نظام البودكاست: إرسال حلقات بودكاست للأعضاء عبر الخاص (DM)
"""

import discord
from discord.ext import commands
from discord import app_commands
import time
from utils.dashboard_db import get_db


def get_podcast_config(guild_id: str) -> dict:
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO podcast_config (guild_id) VALUES (?)", (guild_id,))
        row = db.execute("SELECT * FROM podcast_config WHERE guild_id=?", (guild_id,)).fetchone()
    return dict(row) if row else {"enabled": 0, "role_id": None}


class Podcast(commands.Cog):
    """🎙️ نظام البودكاست"""

    def __init__(self, bot):
        self.bot = bot

    # ── Publish Episode ───────────────────────────────────────────────────────

    @commands.hybrid_command(name="podcast", description="أرسل حلقة بودكاست للأعضاء بالخاص")
    @commands.has_permissions(manage_guild=True)
    @app_commands.describe(title="عنوان الحلقة", content="محتوى الحلقة")
    async def podcast(self, ctx, title: str, *, content: str):
        cfg = get_podcast_config(str(ctx.guild.id))
        if not cfg.get("enabled"):
            await ctx.send("❌ نظام البودكاست غير مفعل. فعله من لوحة التحكم.", ephemeral=True)
            return

        await ctx.defer()

        members = []
        role_id = cfg.get("role_id")
        if role_id:
            role = ctx.guild.get_role(int(role_id))
            members = [m for m in role.members if not m.bot] if role else []
        else:
            members = [m for m in ctx.guild.members if not m.bot]

        embed = discord.Embed(
            title=f"🎙️ {title}",
            description=content,
            color=0xa855f7,
            timestamp=discord.utils.utcnow()
        )
        embed.set_author(name=ctx.guild.name, icon_url=ctx.guild.icon.url if ctx.guild.icon else None)
        embed.set_footer(text=f"بودكاست من {ctx.guild.name}")

        sent, failed = 0, 0
        for member in members:
            try:
                await member.send(embed=embed)
                sent += 1
            except Exception:
                failed += 1

        now = int(time.time())
        with get_db() as db:
            db.execute(
                "INSERT INTO podcast_episodes (guild_id, title, content, sent_at, created_at) VALUES (?,?,?,?,?)",
                (str(ctx.guild.id), title, content, now, now)
            )

        result_embed = discord.Embed(
            title="✅ تم إرسال البودكاست",
            color=0x22c55e
        )
        result_embed.add_field(name="العنوان", value=title, inline=False)
        result_embed.add_field(name="تم الإرسال", value=f"✅ {sent}", inline=True)
        result_embed.add_field(name="فشل الإرسال", value=f"❌ {failed}", inline=True)
        await ctx.send(embed=result_embed)

    # ── List Episodes ─────────────────────────────────────────────────────────

    @commands.hybrid_command(name="episodes", description="اعرض حلقات البودكاست السابقة")
    async def episodes(self, ctx):
        with get_db() as db:
            rows = db.execute(
                "SELECT * FROM podcast_episodes WHERE guild_id=? ORDER BY created_at DESC LIMIT 10",
                (str(ctx.guild.id),)
            ).fetchall()
        if not rows:
            await ctx.send("📻 لا توجد حلقات بودكاست بعد.")
            return
        embed = discord.Embed(title="📻 حلقات البودكاست", color=0xa855f7)
        for row in rows:
            ep = dict(row)
            date = f"<t:{ep['created_at']}:R>"
            embed.add_field(
                name=f"🎙️ {ep['title']}",
                value=f"{ep['content'][:100]}{'...' if len(ep['content']) > 100 else ''}\n{date}",
                inline=False
            )
        await ctx.send(embed=embed)

    # ── Config ────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="podcast-setup", description="[أدمن] إعداد البودكاست")
    @commands.has_permissions(administrator=True)
    @app_commands.describe(role="الدور الذي سيستقبل البودكاست (اتركه فارغاً للكل)")
    async def podcast_setup(self, ctx, role: discord.Role = None):
        with get_db() as db:
            db.execute("INSERT OR IGNORE INTO podcast_config (guild_id) VALUES (?)", (str(ctx.guild.id),))
            db.execute(
                "UPDATE podcast_config SET enabled=1, role_id=? WHERE guild_id=?",
                (str(role.id) if role else None, str(ctx.guild.id))
            )
        target = role.mention if role else "جميع الأعضاء"
        await ctx.send(f"✅ تم تفعيل البودكاست! سيُرسل لـ {target}.")

    @commands.hybrid_command(name="podcast-disable", description="[أدمن] تعطيل البودكاست")
    @commands.has_permissions(administrator=True)
    async def podcast_disable(self, ctx):
        with get_db() as db:
            db.execute("UPDATE podcast_config SET enabled=0 WHERE guild_id=?", (str(ctx.guild.id),))
        await ctx.send("✅ تم تعطيل البودكاست.")


async def setup(bot): await bot.add_cog(Podcast(bot))
