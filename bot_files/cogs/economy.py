"""
economy.py — Rova Bot
نظام اقتصادي متكامل: عملة، يومي، عمل، سرقة، بنك، متجر
"""

import discord
from discord.ext import commands
from discord import app_commands
import time
import random
from utils.dashboard_db import get_economy, update_economy, get_db

CURRENCY = "🪙"
DAILY_AMOUNT = 500
WORK_MIN, WORK_MAX = 100, 400
ROB_MIN_WALLET = 100
ROB_COOLDOWN = 3600
WORK_COOLDOWN = 3600
DAILY_COOLDOWN = 86400


def fmt(n): return f"{n:,}"


class Economy(commands.Cog):
    """💰 نظام الاقتصاد"""

    def __init__(self, bot): self.bot = bot

    def ensure(self, guild_id, user_id):
        eco = get_economy(str(guild_id), str(user_id))
        return eco

    # ── Balance ───────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="balance", aliases=["bal", "رصيد"], description="اعرض رصيدك")
    @app_commands.describe(member="العضو المراد عرض رصيده")
    async def balance(self, ctx, member: discord.Member = None):
        target = member or ctx.author
        eco = self.ensure(ctx.guild.id, target.id)
        embed = discord.Embed(title=f"💰 رصيد {target.display_name}", color=0xa855f7)
        embed.add_field(name="المحفظة", value=f"{CURRENCY} {fmt(eco['wallet'])}", inline=True)
        embed.add_field(name="البنك", value=f"{CURRENCY} {fmt(eco['bank'])}", inline=True)
        embed.add_field(name="الإجمالي", value=f"{CURRENCY} {fmt(eco['wallet'] + eco['bank'])}", inline=False)
        embed.set_thumbnail(url=target.display_avatar.url)
        await ctx.send(embed=embed)

    # ── Daily ─────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="daily", aliases=["يومي"], description="احصل على مكافأتك اليومية")
    async def daily(self, ctx):
        eco = self.ensure(ctx.guild.id, ctx.author.id)
        now = int(time.time())
        diff = now - eco.get("daily_last", 0)
        if diff < DAILY_COOLDOWN:
            rem = DAILY_COOLDOWN - diff
            h, m = divmod(rem // 60, 60)
            await ctx.send(f"⏳ انتظر **{h}س {m}د** قبل المطالبة باليومي.", ephemeral=True)
            return
        new_wallet = eco["wallet"] + DAILY_AMOUNT
        update_economy(str(ctx.guild.id), str(ctx.author.id), wallet=new_wallet, daily_last=now)
        embed = discord.Embed(
            title="🎁 مكافأة يومية!",
            description=f"حصلت على {CURRENCY} **{fmt(DAILY_AMOUNT)}**!\nرصيدك الآن: {CURRENCY} **{fmt(new_wallet)}**",
            color=0x22c55e
        )
        await ctx.send(embed=embed)

    # ── Work ──────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="work", aliases=["شغل"], description="اعمل واحصل على عملة")
    async def work(self, ctx):
        eco = self.ensure(ctx.guild.id, ctx.author.id)
        now = int(time.time())
        diff = now - eco.get("work_last", 0)
        if diff < WORK_COOLDOWN:
            rem = WORK_COOLDOWN - diff
            h, m = divmod(rem // 60, 60)
            await ctx.send(f"⏳ استرح قليلاً، عد بعد **{h}س {m}د**.", ephemeral=True)
            return
        jobs = ["مبرمج", "طبيب", "محامي", "مهندس", "معلم", "مصمم", "سائق", "طباخ"]
        job = random.choice(jobs)
        earned = random.randint(WORK_MIN, WORK_MAX)
        new_wallet = eco["wallet"] + earned
        update_economy(str(ctx.guild.id), str(ctx.author.id), wallet=new_wallet, work_last=now)
        await ctx.send(f"💼 عملت كـ **{job}** وكسبت {CURRENCY} **{fmt(earned)}**! رصيدك: {CURRENCY} **{fmt(new_wallet)}**")

    # ── Rob ───────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="rob", aliases=["سرقة"], description="حاول سرقة عضو آخر")
    @app_commands.describe(member="العضو المراد سرقته")
    async def rob(self, ctx, member: discord.Member):
        if member == ctx.author:
            await ctx.send("❌ لا يمكنك سرقة نفسك!", ephemeral=True); return
        eco_self = self.ensure(ctx.guild.id, ctx.author.id)
        eco_target = self.ensure(ctx.guild.id, member.id)
        now = int(time.time())
        diff = now - eco_self.get("rob_last", 0)
        if diff < ROB_COOLDOWN:
            rem = ROB_COOLDOWN - diff
            h, m = divmod(rem // 60, 60)
            await ctx.send(f"⏳ انتظر **{h}س {m}د** قبل السرقة مجددا.", ephemeral=True); return
        if eco_target["wallet"] < ROB_MIN_WALLET:
            await ctx.send(f"❌ {member.mention} ليس لديه ما يكفي للسرقة.", ephemeral=True); return
        update_economy(str(ctx.guild.id), str(ctx.author.id), rob_last=now)
        if random.random() < 0.45:
            fine = random.randint(50, 200)
            new_wallet = max(0, eco_self["wallet"] - fine)
            update_economy(str(ctx.guild.id), str(ctx.author.id), wallet=new_wallet)
            await ctx.send(f"🚔 فُضحت أثناء السرقة! دفعت غرامة {CURRENCY} **{fmt(fine)}**.")
        else:
            stolen = random.randint(50, min(eco_target["wallet"] // 2, 500))
            update_economy(str(ctx.guild.id), str(ctx.author.id), wallet=eco_self["wallet"] + stolen)
            update_economy(str(ctx.guild.id), str(member.id), wallet=eco_target["wallet"] - stolen)
            await ctx.send(f"💰 نجحت! سرقت {CURRENCY} **{fmt(stolen)}** من {member.mention}!")

    # ── Deposit / Withdraw ────────────────────────────────────────────────────

    @commands.hybrid_command(name="deposit", aliases=["إيداع", "dep"], description="أودع في البنك")
    @app_commands.describe(amount="المبلغ أو 'all'")
    async def deposit(self, ctx, amount: str):
        eco = self.ensure(ctx.guild.id, ctx.author.id)
        if amount.lower() in ("all", "كل"):
            amt = eco["wallet"]
        else:
            try: amt = int(amount)
            except: await ctx.send("❌ أدخل مبلغاً صحيحاً أو 'all'.", ephemeral=True); return
        if amt <= 0 or amt > eco["wallet"]:
            await ctx.send("❌ مبلغ غير صالح.", ephemeral=True); return
        update_economy(str(ctx.guild.id), str(ctx.author.id),
                       wallet=eco["wallet"] - amt, bank=eco["bank"] + amt)
        await ctx.send(f"🏦 أودعت {CURRENCY} **{fmt(amt)}** في البنك.")

    @commands.hybrid_command(name="withdraw", aliases=["سحب", "wd"], description="اسحب من البنك")
    @app_commands.describe(amount="المبلغ أو 'all'")
    async def withdraw(self, ctx, amount: str):
        eco = self.ensure(ctx.guild.id, ctx.author.id)
        if amount.lower() in ("all", "كل"):
            amt = eco["bank"]
        else:
            try: amt = int(amount)
            except: await ctx.send("❌ أدخل مبلغاً صحيحاً أو 'all'.", ephemeral=True); return
        if amt <= 0 or amt > eco["bank"]:
            await ctx.send("❌ مبلغ غير صالح.", ephemeral=True); return
        update_economy(str(ctx.guild.id), str(ctx.author.id),
                       bank=eco["bank"] - amt, wallet=eco["wallet"] + amt)
        await ctx.send(f"💵 سحبت {CURRENCY} **{fmt(amt)}** من البنك.")

    # ── Give ──────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="give", aliases=["تحويل"], description="حول عملة لعضو آخر")
    @app_commands.describe(member="المستقبل", amount="المبلغ")
    async def give(self, ctx, member: discord.Member, amount: int):
        if member == ctx.author or amount <= 0:
            await ctx.send("❌ طلب غير صالح.", ephemeral=True); return
        eco = self.ensure(ctx.guild.id, ctx.author.id)
        if amount > eco["wallet"]:
            await ctx.send("❌ رصيد غير كافٍ.", ephemeral=True); return
        eco_t = self.ensure(ctx.guild.id, member.id)
        update_economy(str(ctx.guild.id), str(ctx.author.id), wallet=eco["wallet"] - amount)
        update_economy(str(ctx.guild.id), str(member.id), wallet=eco_t["wallet"] + amount)
        await ctx.send(f"✅ حولت {CURRENCY} **{fmt(amount)}** إلى {member.mention}!")

    # ── Leaderboard ───────────────────────────────────────────────────────────

    @commands.hybrid_command(name="richest", aliases=["أغنى", "eco-top"], description="أغنى الأعضاء")
    async def richest(self, ctx):
        with get_db() as db:
            rows = db.execute(
                "SELECT user_id, wallet+bank as total FROM economy WHERE guild_id=? ORDER BY total DESC LIMIT 10",
                (str(ctx.guild.id),)
            ).fetchall()
        if not rows:
            await ctx.send("📊 لا توجد بيانات اقتصادية بعد."); return
        embed = discord.Embed(title=f"💰 أغنى أعضاء {ctx.guild.name}", color=0xf59e0b)
        medals = ["🥇", "🥈", "🥉"]
        for i, row in enumerate(rows):
            m = ctx.guild.get_member(int(row["user_id"]))
            name = m.display_name if m else f"مستخدم #{row['user_id']}"
            prefix = medals[i] if i < 3 else f"`{i+1}`"
            embed.add_field(name=f"{prefix} {name}", value=f"{CURRENCY} {fmt(row['total'])}", inline=False)
        await ctx.send(embed=embed)

    # ── Admin: Add/Remove ─────────────────────────────────────────────────────

    @commands.hybrid_command(name="addmoney", description="[أدمن] أضف عملة لعضو")
    @commands.has_permissions(administrator=True)
    @app_commands.describe(member="العضو", amount="المبلغ")
    async def addmoney(self, ctx, member: discord.Member, amount: int):
        eco = self.ensure(ctx.guild.id, member.id)
        update_economy(str(ctx.guild.id), str(member.id), wallet=eco["wallet"] + amount)
        await ctx.send(f"✅ أضفت {CURRENCY} **{fmt(amount)}** لـ {member.mention}.")

    @commands.hybrid_command(name="removemoney", description="[أدمن] احذف عملة من عضو")
    @commands.has_permissions(administrator=True)
    @app_commands.describe(member="العضو", amount="المبلغ")
    async def removemoney(self, ctx, member: discord.Member, amount: int):
        eco = self.ensure(ctx.guild.id, member.id)
        new = max(0, eco["wallet"] - amount)
        update_economy(str(ctx.guild.id), str(member.id), wallet=new)
        await ctx.send(f"✅ حذفت {CURRENCY} **{fmt(amount)}** من {member.mention}.")


async def setup(bot): await bot.add_cog(Economy(bot))
