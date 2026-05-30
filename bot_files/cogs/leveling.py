"""
cogs/leveling.py — Rova Bot v4.0 ULTRA
نظام المستويات والـ XP متزامن مع لوحة التحكم
"""

import random
import time
import discord
from discord.ext import commands
from utils.dashboard_db import (
    get_leveling_config, get_user_xp, update_user_xp, get_leaderboard
)

_cooldowns: dict[tuple, float] = {}


def _xp_for_level(level: int) -> int:
    return 5 * (level ** 2) + 50 * level + 100


class Leveling(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        cfg = get_leveling_config(str(message.guild.id))
        if not cfg or not cfg["enabled"]:
            return

        key = (str(message.guild.id), str(message.author.id))
        now = time.time()
        if now - _cooldowns.get(key, 0) < cfg["cooldown_seconds"]:
            return
        _cooldowns[key] = now

        data = get_user_xp(str(message.guild.id), str(message.author.id))
        gained = random.randint(cfg["xp_min"], cfg["xp_max"])
        new_xp = data["xp"] + gained
        new_level = data["level"]
        new_messages = data["messages"] + 1

        leveled_up = False
        while new_xp >= _xp_for_level(new_level):
            new_xp -= _xp_for_level(new_level)
            new_level += 1
            leveled_up = True

        update_user_xp(str(message.guild.id), str(message.author.id), new_xp, new_level, new_messages)

        if leveled_up:
            channel = message.channel
            if cfg.get("levelup_channel"):
                ch = message.guild.get_channel(int(cfg["levelup_channel"]))
                if ch:
                    channel = ch
            msg_text = (cfg.get("levelup_message") or "مبروك {user}! وصلت للمستوى **{level}**")
            msg_text = msg_text.replace("{user}", message.author.mention).replace("{level}", str(new_level))
            embed = discord.Embed(description=msg_text, color=0xA855F7)
            embed.set_thumbnail(url=message.author.display_avatar.url)
            await channel.send(embed=embed)

    @commands.hybrid_command(name="rank", description="اعرض رتبتك ومستواك")
    async def rank(self, ctx: commands.Context, member: discord.Member = None):
        member = member or ctx.author
        cfg = get_leveling_config(str(ctx.guild.id))
        if not cfg or not cfg["enabled"]:
            return await ctx.send("❌ نظام المستويات غير مفعل.")
        data = get_user_xp(str(ctx.guild.id), str(member.id))
        needed = _xp_for_level(data["level"])
        embed = discord.Embed(title=f"رتبة {member.display_name}", color=0xA855F7)
        embed.add_field(name="المستوى", value=str(data["level"]))
        embed.add_field(name="XP", value=f"{data['xp']} / {needed}")
        embed.add_field(name="الرسائل", value=str(data["messages"]))
        embed.set_thumbnail(url=member.display_avatar.url)
        await ctx.send(embed=embed)

    @commands.hybrid_command(name="leaderboard", aliases=["lb"], description="أفضل 10 أعضاء")
    async def leaderboard(self, ctx: commands.Context):
        cfg = get_leveling_config(str(ctx.guild.id))
        if not cfg or not cfg["enabled"]:
            return await ctx.send("❌ نظام المستويات غير مفعل.")
        rows = get_leaderboard(str(ctx.guild.id), 10)
        if not rows:
            return await ctx.send("لا توجد بيانات بعد.")
        desc = ""
        for i, row in enumerate(rows, 1):
            member = ctx.guild.get_member(int(row["user_id"]))
            name = member.display_name if member else f"<@{row['user_id']}>"
            desc += f"**{i}.** {name} — المستوى {row['level']} ({row['xp']} XP)\n"
        embed = discord.Embed(title="🏆 لوحة المتصدرين", description=desc, color=0xA855F7)
        await ctx.send(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(Leveling(bot))
