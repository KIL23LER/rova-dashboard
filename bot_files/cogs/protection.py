"""
cogs/protection.py — Rova Bot v4.0 ULTRA
الحماية: antispam / antilink / antiraid / antimentions / badwords
"""

import re
import time
import discord
from discord.ext import commands
from utils.dashboard_db import get_protection_config

_spam_tracker: dict[tuple, list] = {}
_raid_tracker: dict[str, list] = {}


async def _punish(member: discord.Member, action: str, reason: str):
    try:
        if action == "ban":
            await member.ban(reason=reason)
        elif action == "kick":
            await member.kick(reason=reason)
        elif action == "timeout":
            until = discord.utils.utcnow() + __import__("datetime").timedelta(minutes=10)
            await member.timeout(until, reason=reason)
    except discord.Forbidden:
        pass


class Protection(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def _is_whitelisted(self, message: discord.Message, cfg: dict) -> bool:
        channel_id = str(message.channel.id)
        role_ids = {str(r.id) for r in message.author.roles}
        return (
            channel_id in cfg["whitelist_channels"]
            or bool(role_ids & set(cfg["whitelist_roles"]))
        )

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        if message.author.guild_permissions.administrator:
            return

        cfg = get_protection_config(str(message.guild.id))
        if not cfg:
            return
        if self._is_whitelisted(message, cfg):
            return

        now = time.time()

        # ── Anti-Spam ──────────────────────────────────────────────────────────
        if cfg["antispam_enabled"]:
            key = (str(message.guild.id), str(message.author.id))
            times = _spam_tracker.setdefault(key, [])
            times.append(now)
            _spam_tracker[key] = [t for t in times if now - t < cfg["antispam_seconds"]]
            if len(_spam_tracker[key]) >= cfg["antispam_messages"]:
                _spam_tracker[key] = []
                await message.delete()
                await _punish(message.author, cfg["antispam_action"], "Anti-Spam")
                return

        # ── Anti-Link ──────────────────────────────────────────────────────────
        if cfg["antilink_enabled"]:
            url_pattern = re.compile(r"https?://\S+|discord\.gg/\S+", re.IGNORECASE)
            urls = url_pattern.findall(message.content)
            whitelist = cfg["antilink_whitelist"]
            blocked = [u for u in urls if not any(w in u for w in whitelist)]
            if blocked:
                await message.delete()
                await message.channel.send(
                    f"{message.author.mention} ❌ الروابط ممنوعة هنا.", delete_after=5
                )
                return

        # ── Anti-Mentions ──────────────────────────────────────────────────────
        if cfg["antimentions_enabled"]:
            total_mentions = len(message.mentions) + len(message.role_mentions)
            if total_mentions >= cfg["antimentions_limit"]:
                await message.delete()
                await _punish(message.author, "timeout", "Anti-Mentions")
                return

        # ── Bad Words ──────────────────────────────────────────────────────────
        if cfg["badwords_enabled"] and cfg["badwords"]:
            content_lower = message.content.lower()
            if any(w.lower() in content_lower for w in cfg["badwords"]):
                await message.delete()
                await message.channel.send(
                    f"{message.author.mention} ❌ استخدام كلمات محظورة.", delete_after=5
                )
                return

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        cfg = get_protection_config(str(member.guild.id))
        if not cfg or not cfg["antiraid_enabled"]:
            return
        key = str(member.guild.id)
        now = time.time()
        times = _raid_tracker.setdefault(key, [])
        times.append(now)
        _raid_tracker[key] = [t for t in times if now - t < cfg["antiraid_seconds"]]
        if len(_raid_tracker[key]) >= cfg["antiraid_joins"]:
            _raid_tracker[key] = []
            await _punish(member, cfg["antiraid_action"], "Anti-Raid")


async def setup(bot: commands.Bot):
    await bot.add_cog(Protection(bot))
