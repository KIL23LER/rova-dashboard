"""
polls.py — Rova Bot
نظام الاستطلاعات: إنشاء تصويتات تفاعلية
"""

import discord
from discord.ext import commands
from discord import app_commands
import time
import json
import secrets
from utils.dashboard_db import get_db

NUMBER_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]


class Polls(commands.Cog):
    """📊 نظام الاستطلاعات"""

    def __init__(self, bot):
        self.bot = bot

    # ── Create Poll ───────────────────────────────────────────────────────────

    @commands.hybrid_command(name="poll", aliases=["تصويت"], description="أنشئ استطلاعاً")
    @app_commands.describe(
        question="السؤال",
        options="الخيارات مفصولة بفاصلة (مثال: نعم,لا,ربما)"
    )
    async def poll(self, ctx, question: str, *, options: str = "نعم,لا"):
        opt_list = [o.strip() for o in options.split(",") if o.strip()][:10]
        if len(opt_list) < 2:
            await ctx.send("❌ أدخل خيارين على الأقل مفصولين بفاصلة.", ephemeral=True)
            return

        embed = discord.Embed(title=f"📊 {question}", color=0xa855f7,
                              timestamp=discord.utils.utcnow())
        description = "\n".join(f"{NUMBER_EMOJIS[i]} {opt}" for i, opt in enumerate(opt_list))
        embed.description = description
        embed.set_footer(text=f"بواسطة {ctx.author.display_name} • صوّت بالريأكشن")

        await ctx.defer()
        msg = await ctx.send(embed=embed)

        for i in range(len(opt_list)):
            await msg.add_reaction(NUMBER_EMOJIS[i])

        poll_id = secrets.token_hex(4)
        now = int(time.time())
        with get_db() as db:
            db.execute(
                "INSERT INTO polls (id, guild_id, channel_id, message_id, question, options, votes, created_at) VALUES (?,?,?,?,?,?,?,?)",
                (poll_id, str(ctx.guild.id), str(ctx.channel.id), str(msg.id),
                 question, json.dumps(opt_list, ensure_ascii=False), "{}", now)
            )

    # ── Quick Yes/No Poll ─────────────────────────────────────────────────────

    @commands.hybrid_command(name="quickpoll", aliases=["سريع"], description="استطلاع نعم/لا سريع")
    @app_commands.describe(question="السؤال")
    async def quickpoll(self, ctx, *, question: str):
        embed = discord.Embed(
            title=f"🗳️ {question}",
            color=0xa855f7,
            timestamp=discord.utils.utcnow()
        )
        embed.set_footer(text=f"بواسطة {ctx.author.display_name}")
        await ctx.defer()
        msg = await ctx.send(embed=embed)
        await msg.add_reaction("✅")
        await msg.add_reaction("❌")

    # ── End Poll ──────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="endpoll", description="أنهِ استطلاعاً وأظهر النتائج")
    @commands.has_permissions(manage_guild=True)
    @app_commands.describe(message_id="ID رسالة الاستطلاع")
    async def endpoll(self, ctx, message_id: str):
        try:
            msg = await ctx.channel.fetch_message(int(message_id))
        except Exception:
            await ctx.send("❌ لم أجد الرسالة.", ephemeral=True)
            return

        with get_db() as db:
            row = db.execute(
                "SELECT * FROM polls WHERE message_id=? AND guild_id=?",
                (message_id, str(ctx.guild.id))
            ).fetchone()

        if not row:
            await ctx.send("❌ لم أجد استطلاعاً لهذه الرسالة.", ephemeral=True)
            return

        poll = dict(row)
        options = json.loads(poll["options"])

        results = []
        for i, opt in enumerate(options):
            emoji = NUMBER_EMOJIS[i]
            reaction = discord.utils.get(msg.reactions, emoji=emoji)
            count = (reaction.count - 1) if reaction else 0
            results.append((opt, count))

        total = sum(r[1] for r in results)
        embed = discord.Embed(title=f"📊 نتائج: {poll['question']}", color=0x22c55e,
                              timestamp=discord.utils.utcnow())
        for opt, count in sorted(results, key=lambda x: x[1], reverse=True):
            pct = (count / total * 100) if total > 0 else 0
            bar = "█" * int(pct // 10) + "░" * (10 - int(pct // 10))
            embed.add_field(name=opt, value=f"`[{bar}]` {count} صوت ({pct:.1f}%)", inline=False)
        embed.set_footer(text=f"إجمالي الأصوات: {total}")

        await ctx.send(embed=embed)
        with get_db() as db:
            db.execute("UPDATE polls SET ended=1 WHERE message_id=?", (message_id,))


async def setup(bot): await bot.add_cog(Polls(bot))
