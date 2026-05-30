"""
cogs/moderation.py — Rova Bot v4.0 ULTRA
أوامر الإشراف: ban / kick / timeout / warn / warnings / clear
"""

import datetime
import discord
from discord.ext import commands
from utils.dashboard_db import add_warning, get_warnings, clear_warnings


def _embed(title: str, color: int, **fields) -> discord.Embed:
    e = discord.Embed(title=title, color=color)
    for k, v in fields.items():
        e.add_field(name=k, value=str(v), inline=True)
    return e


class Moderation(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.hybrid_command(name="ban", description="حظر عضو")
    @commands.has_permissions(ban_members=True)
    async def ban(self, ctx: commands.Context, member: discord.Member, *, reason: str = "لا يوجد سبب"):
        await member.ban(reason=f"{ctx.author}: {reason}")
        await ctx.send(embed=_embed("🔨 تم الحظر", 0xDC2626, العضو=str(member), السبب=reason))

    @commands.hybrid_command(name="unban", description="رفع الحظر")
    @commands.has_permissions(ban_members=True)
    async def unban(self, ctx: commands.Context, user_id: str, *, reason: str = "لا يوجد سبب"):
        user = discord.Object(id=int(user_id))
        await ctx.guild.unban(user, reason=f"{ctx.author}: {reason}")
        await ctx.send(embed=_embed("✅ رُفع الحظر", 0x16A34A, المعرف=user_id, السبب=reason))

    @commands.hybrid_command(name="kick", description="طرد عضو")
    @commands.has_permissions(kick_members=True)
    async def kick(self, ctx: commands.Context, member: discord.Member, *, reason: str = "لا يوجد سبب"):
        await member.kick(reason=f"{ctx.author}: {reason}")
        await ctx.send(embed=_embed("👢 تم الطرد", 0xF59E0B, العضو=str(member), السبب=reason))

    @commands.hybrid_command(name="timeout", description="إسكات عضو")
    @commands.has_permissions(moderate_members=True)
    async def timeout(self, ctx: commands.Context, member: discord.Member, minutes: int = 10, *, reason: str = "لا يوجد سبب"):
        until = discord.utils.utcnow() + datetime.timedelta(minutes=minutes)
        await member.timeout(until, reason=f"{ctx.author}: {reason}")
        await ctx.send(embed=_embed("🔇 تم الإسكات", 0x8B5CF6, العضو=str(member), المدة=f"{minutes} دقيقة", السبب=reason))

    @commands.hybrid_command(name="untimeout", description="رفع الإسكات")
    @commands.has_permissions(moderate_members=True)
    async def untimeout(self, ctx: commands.Context, member: discord.Member):
        await member.timeout(None)
        await ctx.send(embed=_embed("🔊 رُفع الإسكات", 0x22C55E, العضو=str(member)))

    @commands.hybrid_command(name="warn", description="تحذير عضو")
    @commands.has_permissions(moderate_members=True)
    async def warn(self, ctx: commands.Context, member: discord.Member, *, reason: str):
        wid = add_warning(str(ctx.guild.id), str(member.id), str(ctx.author.id), reason)
        await ctx.send(embed=_embed("⚠️ تحذير", 0xF59E0B, العضو=str(member), السبب=reason, رقم_التحذير=f"#{wid}"))

    @commands.hybrid_command(name="warnings", description="عرض تحذيرات عضو")
    @commands.has_permissions(moderate_members=True)
    async def warnings(self, ctx: commands.Context, member: discord.Member):
        warns = get_warnings(str(ctx.guild.id), str(member.id))
        if not warns:
            return await ctx.send(f"✅ {member.mention} لا يملك تحذيرات.")
        desc = "\n".join(f"**#{w['id']}** — {w['reason']} (<t:{w['created_at']}:R>)" for w in warns)
        embed = discord.Embed(title=f"تحذيرات {member.display_name}", description=desc, color=0xF59E0B)
        await ctx.send(embed=embed)

    @commands.hybrid_command(name="clearwarnings", description="مسح تحذيرات عضو")
    @commands.has_permissions(administrator=True)
    async def clearwarnings(self, ctx: commands.Context, member: discord.Member):
        clear_warnings(str(ctx.guild.id), str(member.id))
        await ctx.send(f"✅ تم مسح تحذيرات {member.mention}.")

    @commands.hybrid_command(name="clear", aliases=["purge"], description="حذف رسائل")
    @commands.has_permissions(manage_messages=True)
    async def clear(self, ctx: commands.Context, amount: int = 10):
        await ctx.channel.purge(limit=amount + 1)
        await ctx.send(f"🗑️ تم حذف **{amount}** رسالة.", delete_after=4)


async def setup(bot: commands.Bot):
    await bot.add_cog(Moderation(bot))
