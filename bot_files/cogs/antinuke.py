"""
cogs/antinuke.py — Rova Bot v4.0 ULTRA
الحماية من النيوك: بان / كيك / حذف قنوات / رتب / webhooks
"""

import time
import discord
from discord.ext import commands
from utils.dashboard_db import get_antinuke_config

_action_tracker: dict[tuple, list] = {}  # (guild_id, user_id, action) -> [timestamps]


def _track(guild_id: str, user_id: str, action: str, window: int = 10) -> int:
    key = (guild_id, user_id, action)
    now = time.time()
    times = _action_tracker.setdefault(key, [])
    times.append(now)
    _action_tracker[key] = [t for t in times if now - t < window]
    return len(_action_tracker[key])


async def _punish(guild: discord.Guild, user_id: int, punishment: str):
    member = guild.get_member(user_id)
    if not member:
        return
    try:
        if punishment == "ban":
            await guild.ban(member, reason="Anti-Nuke")
        elif punishment == "kick":
            await member.kick(reason="Anti-Nuke")
        elif punishment == "strip":
            roles = [r for r in member.roles if r.is_assignable()]
            await member.remove_roles(*roles, reason="Anti-Nuke: strip roles")
    except discord.Forbidden:
        pass


class Antinuke(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def _check(self, guild: discord.Guild, executor_id: int, cfg: dict) -> bool:
        if not cfg["enabled"]:
            return False
        if str(executor_id) in cfg["whitelist"]:
            return False
        if executor_id == guild.owner_id:
            return False
        return True

    async def _get_executor(self, guild: discord.Guild, action: discord.AuditLogAction):
        try:
            async for entry in guild.audit_logs(limit=1, action=action):
                return entry.user
        except discord.Forbidden:
            return None

    @commands.Cog.listener()
    async def on_member_ban(self, guild: discord.Guild, user: discord.User):
        cfg = get_antinuke_config(str(guild.id))
        if not cfg:
            return
        executor = await self._get_executor(guild, discord.AuditLogAction.ban)
        if not executor or not self._check(guild, executor.id, cfg):
            return
        count = _track(str(guild.id), str(executor.id), "ban")
        if count >= cfg["ban_threshold"]:
            await _punish(guild, executor.id, cfg["punishment"])

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        guild = member.guild
        cfg = get_antinuke_config(str(guild.id))
        if not cfg:
            return
        executor = await self._get_executor(guild, discord.AuditLogAction.kick)
        if not executor or not self._check(guild, executor.id, cfg):
            return
        count = _track(str(guild.id), str(executor.id), "kick")
        if count >= cfg["kick_threshold"]:
            await _punish(guild, executor.id, cfg["punishment"])

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel):
        guild = channel.guild
        cfg = get_antinuke_config(str(guild.id))
        if not cfg:
            return
        executor = await self._get_executor(guild, discord.AuditLogAction.channel_delete)
        if not executor or not self._check(guild, executor.id, cfg):
            return
        count = _track(str(guild.id), str(executor.id), "channel_delete")
        if count >= cfg["channel_threshold"]:
            await _punish(guild, executor.id, cfg["punishment"])

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role: discord.Role):
        guild = role.guild
        cfg = get_antinuke_config(str(guild.id))
        if not cfg:
            return
        executor = await self._get_executor(guild, discord.AuditLogAction.role_delete)
        if not executor or not self._check(guild, executor.id, cfg):
            return
        count = _track(str(guild.id), str(executor.id), "role_delete")
        if count >= cfg["role_threshold"]:
            await _punish(guild, executor.id, cfg["punishment"])


async def setup(bot: commands.Bot):
    await bot.add_cog(Antinuke(bot))
