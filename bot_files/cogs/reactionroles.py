"""
reactionroles.py — Rova Bot
نظام الأدوار بالريأكشن: إضافة/حذف دور عند الضغط على إيموجي
"""

import discord
from discord.ext import commands
from discord import app_commands
from utils.dashboard_db import get_db


def get_reaction_roles(guild_id: str) -> list:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM reaction_roles WHERE guild_id=?", (guild_id,)
        ).fetchall()
    return [dict(r) for r in rows]


class ReactionRoles(commands.Cog):
    """🎭 أدوار الريأكشن"""

    def __init__(self, bot):
        self.bot = bot

    # ── Add Reaction Role ─────────────────────────────────────────────────────

    @commands.hybrid_command(name="reactionrole", aliases=["rr"], description="أضف دور ريأكشن لرسالة")
    @commands.has_permissions(manage_roles=True)
    @app_commands.describe(
        message_id="ID الرسالة",
        emoji="الإيموجي",
        role="الدور"
    )
    async def reactionrole(self, ctx, message_id: str, emoji: str, role: discord.Role):
        try:
            msg = await ctx.channel.fetch_message(int(message_id))
        except Exception:
            await ctx.send("❌ لم أجد الرسالة في هذه القناة.", ephemeral=True)
            return

        with get_db() as db:
            db.execute(
                "INSERT OR REPLACE INTO reaction_roles (guild_id, message_id, channel_id, emoji, role_id) VALUES (?,?,?,?,?)",
                (str(ctx.guild.id), message_id, str(ctx.channel.id), emoji, str(role.id))
            )

        try:
            await msg.add_reaction(emoji)
        except Exception:
            await ctx.send("❌ إيموجي غير صالح.", ephemeral=True)
            return

        await ctx.send(f"✅ سيحصل على دور {role.mention} كل من يضغط {emoji} على الرسالة!", ephemeral=True)

    # ── Remove Reaction Role ──────────────────────────────────────────────────

    @commands.hybrid_command(name="removerr", description="احذف دور ريأكشن")
    @commands.has_permissions(manage_roles=True)
    @app_commands.describe(message_id="ID الرسالة", emoji="الإيموجي")
    async def removerr(self, ctx, message_id: str, emoji: str):
        with get_db() as db:
            db.execute(
                "DELETE FROM reaction_roles WHERE guild_id=? AND message_id=? AND emoji=?",
                (str(ctx.guild.id), message_id, emoji)
            )
        await ctx.send(f"✅ تم حذف دور الريأكشن.", ephemeral=True)

    # ── List Reaction Roles ───────────────────────────────────────────────────

    @commands.hybrid_command(name="listrr", description="اعرض أدوار الريأكشن")
    @commands.has_permissions(manage_roles=True)
    async def listrr(self, ctx):
        rows = get_reaction_roles(str(ctx.guild.id))
        if not rows:
            await ctx.send("📭 لا توجد أدوار ريأكشن.", ephemeral=True)
            return
        embed = discord.Embed(title="🎭 أدوار الريأكشن", color=0xa855f7)
        for r in rows[:20]:
            role = ctx.guild.get_role(int(r["role_id"]))
            role_name = role.mention if role else f"دور محذوف ({r['role_id']})"
            embed.add_field(
                name=f"{r['emoji']} ← {role_name}",
                value=f"رسالة: `{r['message_id']}`",
                inline=False
            )
        await ctx.send(embed=embed, ephemeral=True)

    # ── Events ────────────────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        if payload.member and payload.member.bot:
            return
        await self._handle_reaction(payload, add=True)

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
        await self._handle_reaction(payload, add=False)

    async def _handle_reaction(self, payload: discord.RawReactionActionEvent, add: bool):
        emoji = str(payload.emoji)
        with get_db() as db:
            row = db.execute(
                "SELECT role_id FROM reaction_roles WHERE guild_id=? AND message_id=? AND emoji=?",
                (str(payload.guild_id), str(payload.message_id), emoji)
            ).fetchone()
        if not row:
            return

        guild = self.bot.get_guild(payload.guild_id)
        if not guild:
            return

        role = guild.get_role(int(row["role_id"]))
        if not role:
            return

        if add:
            member = payload.member or await guild.fetch_member(payload.user_id)
        else:
            try:
                member = await guild.fetch_member(payload.user_id)
            except Exception:
                return

        try:
            if add:
                await member.add_roles(role, reason="Reaction Role")
            else:
                await member.remove_roles(role, reason="Reaction Role")
        except Exception:
            pass


async def setup(bot): await bot.add_cog(ReactionRoles(bot))
