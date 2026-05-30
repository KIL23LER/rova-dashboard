"""
cogs/autoroles.py — Rova Bot v4.0 ULTRA
إعطاء رتب تلقائية عند انضمام الأعضاء من لوحة التحكم
"""

import discord
from discord.ext import commands
from utils.dashboard_db import get_autoroles


class Autoroles(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        role_ids = get_autoroles(str(member.guild.id), bot_only=member.bot)
        if not role_ids:
            return
        roles = [
            member.guild.get_role(int(rid))
            for rid in role_ids
            if member.guild.get_role(int(rid))
        ]
        if roles:
            try:
                await member.add_roles(*roles, reason="Auto-role from dashboard")
            except discord.Forbidden:
                pass


async def setup(bot: commands.Bot):
    await bot.add_cog(Autoroles(bot))
