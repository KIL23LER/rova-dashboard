"""
cogs/logging.py — Rova Bot v4.0 ULTRA
تسجيل أحداث السيرفر من لوحة التحكم
"""

import discord
from discord.ext import commands
from utils.dashboard_db import get_logging_config


class Logging(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    async def _log(self, guild: discord.Guild, embed: discord.Embed):
        cfg = get_logging_config(str(guild.id))
        if not cfg or not cfg["enabled"] or not cfg["channel_id"]:
            return
        channel = guild.get_channel(int(cfg["channel_id"]))
        if channel:
            try:
                await channel.send(embed=embed)
            except discord.Forbidden:
                pass

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        embed = discord.Embed(title="📥 عضو انضم", color=0x22C55E)
        embed.set_author(name=str(member), icon_url=member.display_avatar.url)
        embed.add_field(name="المعرف", value=member.id)
        embed.add_field(name="الحساب أُنشئ", value=f"<t:{int(member.created_at.timestamp())}:R>")
        await self._log(member.guild, embed)

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        embed = discord.Embed(title="📤 عضو غادر", color=0xEF4444)
        embed.set_author(name=str(member), icon_url=member.display_avatar.url)
        embed.add_field(name="المعرف", value=member.id)
        await self._log(member.guild, embed)

    @commands.Cog.listener()
    async def on_member_ban(self, guild: discord.Guild, user: discord.User):
        embed = discord.Embed(title="🔨 عضو بُن", color=0xDC2626)
        embed.set_author(name=str(user), icon_url=user.display_avatar.url)
        embed.add_field(name="المعرف", value=user.id)
        await self._log(guild, embed)

    @commands.Cog.listener()
    async def on_member_unban(self, guild: discord.Guild, user: discord.User):
        embed = discord.Embed(title="✅ عضو رُفع عنه البان", color=0x16A34A)
        embed.set_author(name=str(user), icon_url=user.display_avatar.url)
        await self._log(guild, embed)

    @commands.Cog.listener()
    async def on_message_delete(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        embed = discord.Embed(title="🗑️ رسالة حُذفت", color=0xF59E0B)
        embed.set_author(name=str(message.author), icon_url=message.author.display_avatar.url)
        embed.add_field(name="القناة", value=message.channel.mention)
        if message.content:
            embed.add_field(name="المحتوى", value=message.content[:1000], inline=False)
        await self._log(message.guild, embed)

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.author.bot or not before.guild:
            return
        if before.content == after.content:
            return
        embed = discord.Embed(title="✏️ رسالة عُدِّلت", color=0x3B82F6)
        embed.set_author(name=str(before.author), icon_url=before.author.display_avatar.url)
        embed.add_field(name="قبل", value=before.content[:500] or "—", inline=False)
        embed.add_field(name="بعد", value=after.content[:500] or "—", inline=False)
        embed.add_field(name="القناة", value=before.channel.mention)
        await self._log(before.guild, embed)

    @commands.Cog.listener()
    async def on_guild_channel_create(self, channel: discord.abc.GuildChannel):
        embed = discord.Embed(title="📁 قناة أُنشئت", color=0x8B5CF6)
        embed.add_field(name="الاسم", value=channel.name)
        embed.add_field(name="النوع", value=str(channel.type))
        await self._log(channel.guild, embed)

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel):
        embed = discord.Embed(title="🗑️ قناة حُذفت", color=0xEF4444)
        embed.add_field(name="الاسم", value=channel.name)
        embed.add_field(name="النوع", value=str(channel.type))
        await self._log(channel.guild, embed)

    @commands.Cog.listener()
    async def on_guild_role_create(self, role: discord.Role):
        embed = discord.Embed(title="🎭 رتبة أُنشئت", color=role.color)
        embed.add_field(name="الاسم", value=role.name)
        await self._log(role.guild, embed)

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role: discord.Role):
        embed = discord.Embed(title="🗑️ رتبة حُذفت", color=0xEF4444)
        embed.add_field(name="الاسم", value=role.name)
        await self._log(role.guild, embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(Logging(bot))
