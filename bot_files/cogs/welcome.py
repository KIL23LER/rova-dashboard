"""
cogs/welcome.py — Rova Bot v4.0 ULTRA
رسائل الترحيب والوداع من لوحة التحكم
"""

import discord
from discord.ext import commands
from utils.dashboard_db import get_welcome_config, get_leave_config


def _format(msg: str, member: discord.Member) -> str:
    return (
        msg.replace("{user}", member.mention)
           .replace("{username}", str(member))
           .replace("{server}", member.guild.name)
           .replace("{count}", str(member.guild.member_count))
    )


class Welcome(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        cfg = get_welcome_config(str(member.guild.id))
        if not cfg or not cfg["enabled"] or not cfg["channel_id"]:
            return
        channel = member.guild.get_channel(int(cfg["channel_id"]))
        if not channel:
            return
        embed = discord.Embed(
            description=_format(cfg["message"], member),
            color=int(cfg["embed_color"].lstrip("#"), 16) if cfg.get("embed_color") else 0xA855F7,
        )
        embed.set_author(name=str(member), icon_url=member.display_avatar.url)
        embed.set_thumbnail(url=member.display_avatar.url)
        await channel.send(embed=embed)

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        cfg = get_leave_config(str(member.guild.id))
        if not cfg or not cfg["enabled"] or not cfg["channel_id"]:
            return
        channel = member.guild.get_channel(int(cfg["channel_id"]))
        if not channel:
            return
        embed = discord.Embed(
            description=_format(cfg["message"], member),
            color=int(cfg["embed_color"].lstrip("#"), 16) if cfg.get("embed_color") else 0xEF4444,
        )
        embed.set_author(name=str(member), icon_url=member.display_avatar.url)
        await channel.send(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(Welcome(bot))
