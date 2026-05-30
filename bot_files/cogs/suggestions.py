"""
cogs/suggestions.py — Rova Bot v4.0 ULTRA
نظام الاقتراحات من لوحة التحكم
"""

import discord
from discord.ext import commands
from utils.dashboard_db import get_suggestion_config


class Suggestions(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.hybrid_command(name="suggest", description="أرسل اقتراحاً للسيرفر")
    async def suggest(self, ctx: commands.Context, *, suggestion: str):
        cfg = get_suggestion_config(str(ctx.guild.id))
        if not cfg or not cfg["enabled"] or not cfg["channel_id"]:
            return await ctx.send("❌ نظام الاقتراحات غير مفعل أو غير مُعدَّ.", ephemeral=True)

        channel = ctx.guild.get_channel(int(cfg["channel_id"]))
        if not channel:
            return await ctx.send("❌ قناة الاقتراحات غير موجودة.", ephemeral=True)

        embed = discord.Embed(
            title="💡 اقتراح جديد",
            description=suggestion,
            color=0xA855F7
        )
        embed.set_author(name=str(ctx.author), icon_url=ctx.author.display_avatar.url)
        embed.set_footer(text=f"معرف المقترح: {ctx.author.id}")

        msg = await channel.send(embed=embed)
        await msg.add_reaction("✅")
        await msg.add_reaction("❌")

        if cfg.get("log_channel"):
            log_ch = ctx.guild.get_channel(int(cfg["log_channel"]))
            if log_ch:
                log_embed = discord.Embed(
                    description=f"اقتراح جديد من {ctx.author.mention}\n[اذهب للاقتراح]({msg.jump_url})",
                    color=0x6B7280
                )
                await log_ch.send(embed=log_embed)

        await ctx.send("✅ تم إرسال اقتراحك!", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Suggestions(bot))
