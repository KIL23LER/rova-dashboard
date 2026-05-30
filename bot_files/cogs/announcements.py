"""
announcements.py — Rova Bot
نظام الإعلانات: إرسال إعلانات رسمية من الداش بورد أو الأوامر
"""

import discord
from discord.ext import commands
from discord import app_commands
import time
from utils.dashboard_db import get_db


class Announcements(commands.Cog):
    """📣 نظام الإعلانات"""

    def __init__(self, bot):
        self.bot = bot

    # ── Announce ──────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="announce", aliases=["إعلان"], description="أرسل إعلاناً")
    @commands.has_permissions(manage_guild=True)
    @app_commands.describe(
        channel="القناة",
        title="عنوان الإعلان",
        content="محتوى الإعلان",
        color="لون الإعلان (hex مثل #ff0000)"
    )
    async def announce(self, ctx, channel: discord.TextChannel, title: str, *, content: str, color: str = "#a855f7"):
        try:
            c = discord.Color(int(color.lstrip("#"), 16))
        except Exception:
            c = discord.Color(0xa855f7)

        embed = discord.Embed(title=f"📣 {title}", description=content, color=c,
                              timestamp=discord.utils.utcnow())
        embed.set_author(name=ctx.guild.name, icon_url=ctx.guild.icon.url if ctx.guild.icon else None)
        embed.set_footer(text=f"إعلان رسمي • بواسطة {ctx.author.display_name}")

        await channel.send(embed=embed)

        now = int(time.time())
        with get_db() as db:
            db.execute(
                "INSERT INTO announcements (guild_id, channel_id, title, content, color, sent_at) VALUES (?,?,?,?,?,?)",
                (str(ctx.guild.id), str(channel.id), title, content, color, now)
            )

        await ctx.send(f"✅ تم إرسال الإعلان في {channel.mention}!", ephemeral=True)

    # ── DM Announce ───────────────────────────────────────────────────────────

    @commands.hybrid_command(name="dmall", aliases=["dm-all"], description="[أدمن] أرسل رسالة لجميع الأعضاء")
    @commands.has_permissions(administrator=True)
    @app_commands.describe(title="العنوان", content="المحتوى")
    async def dmall(self, ctx, title: str, *, content: str):
        await ctx.defer()
        embed = discord.Embed(title=f"📣 {title}", description=content, color=0xa855f7,
                              timestamp=discord.utils.utcnow())
        embed.set_author(name=ctx.guild.name, icon_url=ctx.guild.icon.url if ctx.guild.icon else None)
        embed.set_footer(text=f"إعلان من {ctx.guild.name}")

        sent, failed = 0, 0
        for member in ctx.guild.members:
            if member.bot:
                continue
            try:
                await member.send(embed=embed)
                sent += 1
            except Exception:
                failed += 1

        result = discord.Embed(title="✅ اكتمل الإرسال", color=0x22c55e)
        result.add_field(name="✅ تم الإرسال", value=str(sent), inline=True)
        result.add_field(name="❌ فشل", value=str(failed), inline=True)
        await ctx.send(embed=result)

    # ── Embed Builder ─────────────────────────────────────────────────────────

    @commands.hybrid_command(name="embed", description="[مود] أرسل إيمبد مخصص")
    @commands.has_permissions(manage_messages=True)
    @app_commands.describe(channel="القناة", title="العنوان", content="المحتوى", color="اللون hex")
    async def embed_cmd(self, ctx, channel: discord.TextChannel, title: str, content: str, color: str = "#a855f7"):
        try:
            c = discord.Color(int(color.lstrip("#"), 16))
        except Exception:
            c = discord.Color(0xa855f7)
        embed = discord.Embed(title=title, description=content, color=c,
                              timestamp=discord.utils.utcnow())
        await channel.send(embed=embed)
        await ctx.send("✅ تم الإرسال.", ephemeral=True)

    # ── Announcement History ──────────────────────────────────────────────────

    @commands.hybrid_command(name="announcements", aliases=["الإعلانات"], description="اعرض الإعلانات الأخيرة")
    async def announcement_list(self, ctx):
        with get_db() as db:
            rows = db.execute(
                "SELECT * FROM announcements WHERE guild_id=? ORDER BY sent_at DESC LIMIT 5",
                (str(ctx.guild.id),)
            ).fetchall()
        if not rows:
            await ctx.send("📭 لا توجد إعلانات سابقة.")
            return
        embed = discord.Embed(title="📣 الإعلانات الأخيرة", color=0xa855f7)
        for row in rows:
            r = dict(row)
            embed.add_field(
                name=f"📣 {r.get('title', 'إعلان')}",
                value=f"{r['content'][:80]}... | <t:{r['sent_at']}:R>",
                inline=False
            )
        await ctx.send(embed=embed)


async def setup(bot): await bot.add_cog(Announcements(bot))
