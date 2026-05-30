"""
cogs/custom_commands.py — Rova Bot v4.0 ULTRA
الأوامر المخصصة من لوحة التحكم
"""

import discord
from discord.ext import commands
from utils.dashboard_db import get_custom_commands, increment_command_uses


class CustomCommands(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        content = message.content.strip()
        if not content:
            return

        cmds = get_custom_commands(str(message.guild.id))
        for cmd in cmds:
            trigger = cmd["trigger"].strip()
            if content.lower() == trigger.lower() or content.lower().startswith(trigger.lower() + " "):
                embed = discord.Embed(description=cmd["response"], color=0xA855F7)
                await message.channel.send(embed=embed)
                increment_command_uses(str(message.guild.id), cmd["trigger"])
                break


async def setup(bot: commands.Bot):
    await bot.add_cog(CustomCommands(bot))
