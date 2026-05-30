"""
cogs/giveaways.py — Rova Bot v4.0 ULTRA
نظام الهدايا متزامن مع لوحة التحكم
"""

import random
import asyncio
import time
import discord
from discord.ext import commands, tasks
from discord import ui
from utils.dashboard_db import get_active_giveaways, join_giveaway, end_giveaway


class GiveawayJoinView(ui.View):
    def __init__(self, giveaway_id: str):
        super().__init__(timeout=None)
        self.giveaway_id = giveaway_id

    @ui.button(label="🎉 مشاركة", style=discord.ButtonStyle.success, custom_id="join_giveaway")
    async def join(self, interaction: discord.Interaction, button: ui.Button):
        joined = join_giveaway(self.giveaway_id, str(interaction.user.id))
        if joined:
            await interaction.response.send_message("✅ تم تسجيلك في الهدية!", ephemeral=True)
        else:
            await interaction.response.send_message("❌ أنت مسجل بالفعل.", ephemeral=True)


class Giveaways(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.check_giveaways.start()

    def cog_unload(self):
        self.check_giveaways.cancel()

    @tasks.loop(seconds=30)
    async def check_giveaways(self):
        now = int(time.time())
        for guild in self.bot.guilds:
            active = get_active_giveaways(str(guild.id))
            for gw in active:
                if gw["ends_at"] <= now:
                    await self._end_giveaway(guild, gw)

    async def _end_giveaway(self, guild: discord.Guild, gw: dict):
        channel = guild.get_channel(int(gw["channel_id"]))
        if not channel:
            return
        entries = gw["entries"]
        winners_count = min(gw["winners"], len(entries))
        if winners_count == 0:
            winner_ids = []
            desc = "😢 لا يوجد فائزون — لم يشارك أحد."
        else:
            winner_ids = random.sample(entries, winners_count)
            mentions = " ".join(f"<@{w}>" for w in winner_ids)
            desc = f"🎉 الفائزون: {mentions}\n**الجائزة:** {gw['prize']}"

        end_giveaway(gw["id"], winner_ids)
        embed = discord.Embed(title="🎊 انتهت الهدية!", description=desc, color=0xA855F7)
        try:
            if gw.get("message_id"):
                msg = await channel.fetch_message(int(gw["message_id"]))
                await msg.edit(embed=embed, view=None)
        except Exception:
            pass
        await channel.send(embed=embed)

    @check_giveaways.before_loop
    async def before_check(self):
        await self.bot.wait_until_ready()

    @commands.hybrid_command(name="gstart", description="ابدأ هدية يدوياً (للاختبار)")
    @commands.has_permissions(administrator=True)
    async def gstart(self, ctx: commands.Context, seconds: int, winners: int, *, prize: str):
        import uuid
        gid = str(uuid.uuid4())[:8]
        ends = int(time.time()) + seconds

        from utils.dashboard_db import get_db
        with get_db() as db:
            db.execute(
                "INSERT INTO giveaways (id, guild_id, channel_id, host_id, prize, winners, ends_at) VALUES (?,?,?,?,?,?,?)",
                (gid, str(ctx.guild.id), str(ctx.channel.id), str(ctx.author.id), prize, winners, ends)
            )

        embed = discord.Embed(
            title=f"🎉 {prize}",
            description=f"عدد الفائزين: **{winners}**\nتنتهي: <t:{ends}:R>",
            color=0xA855F7
        )
        msg = await ctx.send(embed=embed, view=GiveawayJoinView(gid))
        with get_db() as db:
            db.execute("UPDATE giveaways SET message_id = ? WHERE id = ?", (str(msg.id), gid))


async def setup(bot: commands.Bot):
    await bot.add_cog(Giveaways(bot))
