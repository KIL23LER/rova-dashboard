"""
cogs/tickets.py — Rova Bot v4.0 ULTRA
نظام التذاكر من لوحة التحكم
"""

import uuid
import discord
from discord.ext import commands
from discord import ui
from utils.dashboard_db import get_ticket_config, create_ticket, close_ticket


class OpenTicketButton(ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @ui.button(label="📩 فتح تذكرة", style=discord.ButtonStyle.primary, custom_id="open_ticket")
    async def open_ticket(self, interaction: discord.Interaction, button: ui.Button):
        cfg = get_ticket_config(str(interaction.guild_id))
        if not cfg:
            return await interaction.response.send_message("❌ التذاكر غير مُعدَّة.", ephemeral=True)

        overwrites = {
            interaction.guild.default_role: discord.PermissionOverwrite(read_messages=False),
            interaction.user: discord.PermissionOverwrite(read_messages=True, send_messages=True),
        }
        if cfg.get("support_role"):
            role = interaction.guild.get_role(int(cfg["support_role"]))
            if role:
                overwrites[role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)

        ticket_id = str(uuid.uuid4())[:8]
        category = interaction.guild.get_channel(int(cfg["category_id"])) if cfg.get("category_id") else None
        channel = await interaction.guild.create_text_channel(
            f"ticket-{interaction.user.name}-{ticket_id}",
            overwrites=overwrites,
            category=category,
            topic=f"تذكرة {interaction.user} | ID: {ticket_id}"
        )
        create_ticket(ticket_id, str(interaction.guild_id), str(interaction.user.id), str(channel.id))

        embed = discord.Embed(
            title="🎫 تذكرة مفتوحة",
            description=f"مرحباً {interaction.user.mention}!\nاشرح مشكلتك وسيرد عليك الدعم قريباً.",
            color=0xA855F7
        )
        view = CloseTicketView(ticket_id)
        await channel.send(embed=embed, view=view)
        await interaction.response.send_message(f"✅ تم فتح تذكرتك: {channel.mention}", ephemeral=True)


class CloseTicketView(ui.View):
    def __init__(self, ticket_id: str):
        super().__init__(timeout=None)
        self.ticket_id = ticket_id

    @ui.button(label="🔒 إغلاق التذكرة", style=discord.ButtonStyle.danger, custom_id="close_ticket")
    async def close_ticket_btn(self, interaction: discord.Interaction, button: ui.Button):
        close_ticket(self.ticket_id)
        await interaction.channel.send("🔒 تم إغلاق التذكرة. ستُحذف القناة خلال 5 ثوانٍ.")
        await __import__("asyncio").sleep(5)
        await interaction.channel.delete()


class Tickets(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        bot.add_view(OpenTicketButton())

    @commands.hybrid_command(name="setup_tickets", description="إرسال لوحة فتح تذاكر في القناة الحالية")
    @commands.has_permissions(administrator=True)
    async def setup_tickets(self, ctx: commands.Context):
        cfg = get_ticket_config(str(ctx.guild.id))
        if not cfg:
            return await ctx.send("❌ لم يتم إعداد نظام التذاكر من لوحة التحكم بعد.")
        embed = discord.Embed(
            title="🎫 نظام التذاكر",
            description="اضغط على الزر أدناه لفتح تذكرة دعم.",
            color=0xA855F7
        )
        await ctx.send(embed=embed, view=OpenTicketButton())


async def setup(bot: commands.Bot):
    await bot.add_cog(Tickets(bot))
