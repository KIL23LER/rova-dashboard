"""
info.py — Rova Bot
أوامر المعلومات: معلومات السيرفر، العضو، البوت، Avatar، بينغ
"""

import discord
from discord.ext import commands
from discord import app_commands
import time


class Info(commands.Cog):
    """📊 أوامر المعلومات"""

    def __init__(self, bot):
        self.bot = bot

    # ── Ping ──────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="ping", aliases=["بينغ"], description="اختبر سرعة البوت")
    async def ping(self, ctx):
        start = time.monotonic()
        msg = await ctx.send("🏓 جاري القياس...")
        latency = (time.monotonic() - start) * 1000
        ws = self.bot.latency * 1000
        embed = discord.Embed(title="🏓 Pong!", color=0xa855f7)
        embed.add_field(name="البوت", value=f"`{latency:.0f}ms`", inline=True)
        embed.add_field(name="WebSocket", value=f"`{ws:.0f}ms`", inline=True)
        await msg.edit(content=None, embed=embed)

    # ── Server Info ───────────────────────────────────────────────────────────

    @commands.hybrid_command(name="serverinfo", aliases=["سيرفر"], description="معلومات السيرفر")
    async def serverinfo(self, ctx):
        g = ctx.guild
        bots = sum(1 for m in g.members if m.bot)
        humans = g.member_count - bots
        embed = discord.Embed(title=f"📊 {g.name}", color=0xa855f7,
                              timestamp=discord.utils.utcnow())
        if g.icon: embed.set_thumbnail(url=g.icon.url)
        embed.add_field(name="👑 المالك", value=g.owner.mention if g.owner else "؟", inline=True)
        embed.add_field(name="🆔 ID", value=f"`{g.id}`", inline=True)
        embed.add_field(name="📅 تاريخ الإنشاء", value=f"<t:{int(g.created_at.timestamp())}:D>", inline=True)
        embed.add_field(name="👥 الأعضاء", value=f"البشر: {humans} | البوتات: {bots}", inline=True)
        embed.add_field(name="💬 القنوات", value=f"نصية: {len(g.text_channels)} | صوتية: {len(g.voice_channels)}", inline=True)
        embed.add_field(name="🎭 الأدوار", value=str(len(g.roles)), inline=True)
        embed.add_field(name="😀 الإيموجي", value=str(len(g.emojis)), inline=True)
        boost = g.premium_subscription_count
        embed.add_field(name="🚀 البوست", value=f"{boost} (مستوى {g.premium_tier})", inline=True)
        embed.set_footer(text=f"طلب بواسطة {ctx.author.display_name}")
        await ctx.send(embed=embed)

    # ── User Info ─────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="userinfo", aliases=["عضو"], description="معلومات عضو")
    @app_commands.describe(member="العضو المراد عرض معلوماته")
    async def userinfo(self, ctx, member: discord.Member = None):
        m = member or ctx.author
        roles = [r.mention for r in m.roles if r.name != "@everyone"]
        embed = discord.Embed(title=f"👤 {m.display_name}", color=m.color if m.color.value else 0xa855f7,
                              timestamp=discord.utils.utcnow())
        embed.set_thumbnail(url=m.display_avatar.url)
        embed.add_field(name="🆔 ID", value=f"`{m.id}`", inline=True)
        embed.add_field(name="🏷️ اسم المستخدم", value=str(m), inline=True)
        embed.add_field(name="🤖 بوت؟", value="نعم" if m.bot else "لا", inline=True)
        embed.add_field(name="📅 تاريخ الإنشاء", value=f"<t:{int(m.created_at.timestamp())}:D>", inline=True)
        embed.add_field(name="📥 انضم للسيرفر", value=f"<t:{int(m.joined_at.timestamp())}:D>" if m.joined_at else "؟", inline=True)
        embed.add_field(name="🎭 الأدوار", value=", ".join(roles[-5:]) if roles else "لا يوجد", inline=False)
        embed.set_footer(text=f"طلب بواسطة {ctx.author.display_name}")
        await ctx.send(embed=embed)

    # ── Avatar ────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="avatar", aliases=["صورة"], description="عرض صورة عضو")
    @app_commands.describe(member="العضو")
    async def avatar(self, ctx, member: discord.Member = None):
        m = member or ctx.author
        embed = discord.Embed(title=f"🖼️ صورة {m.display_name}", color=0xa855f7)
        embed.set_image(url=m.display_avatar.url)
        embed.add_field(name="روابط", value=f"[PNG]({m.display_avatar.replace(format='png').url}) | [JPG]({m.display_avatar.replace(format='jpg').url}) | [WEBP]({m.display_avatar.replace(format='webp').url})")
        await ctx.send(embed=embed)

    # ── Bot Info ──────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="botinfo", aliases=["بوت"], description="معلومات البوت")
    async def botinfo(self, ctx):
        import time as t
        elapsed = int(t.time() - self.bot.start_time)
        h, rem = divmod(elapsed, 3600)
        m2, s = divmod(rem, 60)
        embed = discord.Embed(title=f"🤖 {self.bot.user.name}", color=0xa855f7,
                              timestamp=discord.utils.utcnow())
        embed.set_thumbnail(url=self.bot.user.display_avatar.url)
        embed.add_field(name="🆔 ID", value=f"`{self.bot.user.id}`", inline=True)
        embed.add_field(name="🌐 السيرفرات", value=str(len(self.bot.guilds)), inline=True)
        embed.add_field(name="👥 الأعضاء", value=str(sum(g.member_count for g in self.bot.guilds)), inline=True)
        embed.add_field(name="⏱️ وقت التشغيل", value=f"{h}س {m2}د {s}ث", inline=True)
        embed.add_field(name="⚡ الأوامر", value=str(self.bot.command_count), inline=True)
        embed.add_field(name="🏓 بينغ", value=f"{self.bot.latency*1000:.0f}ms", inline=True)
        embed.add_field(name="🔧 الإصدار", value="v4.0 ULTRA", inline=True)
        await ctx.send(embed=embed)

    # ── Role Info ──────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="roleinfo", aliases=["دور"], description="معلومات دور")
    @app_commands.describe(role="الدور")
    async def roleinfo(self, ctx, role: discord.Role):
        embed = discord.Embed(title=f"🎭 {role.name}", color=role.color)
        embed.add_field(name="🆔 ID", value=f"`{role.id}`", inline=True)
        embed.add_field(name="🎨 اللون", value=str(role.color), inline=True)
        embed.add_field(name="👥 الأعضاء", value=str(len(role.members)), inline=True)
        embed.add_field(name="📌 قابل للذكر", value="نعم" if role.mentionable else "لا", inline=True)
        embed.add_field(name="🔒 إداري", value="نعم" if role.permissions.administrator else "لا", inline=True)
        embed.add_field(name="📅 تاريخ الإنشاء", value=f"<t:{int(role.created_at.timestamp())}:D>", inline=True)
        await ctx.send(embed=embed)


async def setup(bot): await bot.add_cog(Info(bot))
