"""
fun.py — Rova Bot
أوامر ترفيهية: كرة 8، رمي عملة، نرد، مزاج، نكتة، اقتباس
"""

import discord
from discord.ext import commands
from discord import app_commands
import random


EIGHT_BALL = [
    "نعم بالتأكيد! ✅", "من المحتمل جداً ✅", "بكل تأكيد! ✅",
    "يبدو جيداً ✅", "نعم ✅", "الإشارات تقول نعم ✅",
    "لا أعلم الآن 🤔", "من الأفضل عدم الإخبار الآن 🤔", "ركز وجرب مجدداً 🤔",
    "لا تعتمد عليه ❌", "لا ❌", "من المشكوك فيه جداً ❌", "لا أعتقد ❌",
]

WOULD_YOU_RATHER = [
    ("تكون غنياً ولوحيد", "تكون فقيراً ومحاطاً بالأصدقاء"),
    ("تطير لكنك بطيء", "تجري بسرعة خارقة"),
    ("تعرف كل شيء", "تستطيع فعل أي شيء"),
    ("تعيش ١٠٠ سنة بصحة عادية", "تعيش ٥٠ سنة بصحة ممتازة"),
]

QUOTES = [
    "النجاح ليس نهاية، والفشل ليس قاتلاً، الشجاعة للاستمرار هي ما يهم. — تشرشل",
    "الحياة قصيرة جداً للاستيقاظ في الصباح مع الندم. — ستيف جوبز",
    "لا تقس نجاحك بما حققته، بل بما تغلبت عليه. — بوكر واشنطن",
    "الإبداع يربط ما يبدو غير مترابط. — ستيف جوبز",
    "كن التغيير الذي تريد رؤيته في العالم. — غاندي",
    "السعادة ليست حظاً، هي نتيجة الجهد.",
    "كل يوم هو فرصة جديدة لتكون أفضل.",
]


class Fun(commands.Cog):
    """🎮 أوامر ترفيهية"""

    def __init__(self, bot): self.bot = bot

    # ── 8ball ─────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="8ball", aliases=["ball"], description="اسأل كرة المجهول")
    @app_commands.describe(question="سؤالك")
    async def eight_ball(self, ctx, *, question: str):
        ans = random.choice(EIGHT_BALL)
        embed = discord.Embed(color=0x6366f1)
        embed.add_field(name="❓ السؤال", value=question, inline=False)
        embed.add_field(name="🎱 الإجابة", value=ans, inline=False)
        await ctx.send(embed=embed)

    # ── Coin Flip ─────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="flip", aliases=["عملة"], description="ارمِ عملة")
    async def flip(self, ctx):
        result = random.choice(["👑 وجه", "🔤 ظهر"])
        await ctx.send(f"🪙 **{result}!**")

    # ── Dice ──────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="roll", aliases=["نرد"], description="ارمِ نرد")
    @app_commands.describe(sides="عدد الأوجه (افتراضي 6)")
    async def roll(self, ctx, sides: int = 6):
        if sides < 2: sides = 6
        result = random.randint(1, sides)
        await ctx.send(f"🎲 نتيجة النرد ({sides} وجه): **{result}**")

    # ── RPS ───────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="rps", aliases=["حجر-ورق-مقص"], description="حجر ورق مقص")
    @app_commands.describe(choice="حجر أو ورق أو مقص")
    @app_commands.choices(choice=[
        app_commands.Choice(name="حجر 🪨", value="حجر"),
        app_commands.Choice(name="ورق 📄", value="ورق"),
        app_commands.Choice(name="مقص ✂️", value="مقص"),
    ])
    async def rps(self, ctx, choice: str):
        bot_choice = random.choice(["حجر", "ورق", "مقص"])
        emojis = {"حجر": "🪨", "ورق": "📄", "مقص": "✂️"}
        wins = {"حجر": "مقص", "ورق": "حجر", "مقص": "ورق"}
        if choice == bot_choice:
            result = "🤝 تعادل!"
        elif wins[choice] == bot_choice:
            result = "🎉 فزت!"
        else:
            result = "😢 خسرت!"
        await ctx.send(f"{emojis[choice]} أنت: **{choice}** | البوت: **{bot_choice}** {emojis[bot_choice]}\n**{result}**")

    # ── Would You Rather ──────────────────────────────────────────────────────

    @commands.hybrid_command(name="wyr", description="هل تفضل...؟")
    async def wyr(self, ctx):
        a, b = random.choice(WOULD_YOU_RATHER)
        embed = discord.Embed(title="🤔 هل تفضل...؟", color=0xf59e0b)
        embed.add_field(name="🅰️", value=a, inline=True)
        embed.add_field(name="🅱️", value=b, inline=True)
        msg = await ctx.send(embed=embed)
        await msg.add_reaction("🅰️")
        await msg.add_reaction("🅱️")

    # ── Quote ─────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="quote", aliases=["اقتباس"], description="اقتباس عشوائي ملهم")
    async def quote(self, ctx):
        q = random.choice(QUOTES)
        await ctx.send(f"💬 _{q}_")

    # ── Random Number ─────────────────────────────────────────────────────────

    @commands.hybrid_command(name="random", aliases=["عشوائي"], description="رقم عشوائي بين حدين")
    @app_commands.describe(minimum="الحد الأدنى", maximum="الحد الأقصى")
    async def random_num(self, ctx, minimum: int = 1, maximum: int = 100):
        if minimum >= maximum:
            await ctx.send("❌ الحد الأدنى يجب أن يكون أصغر من الأعلى.", ephemeral=True); return
        await ctx.send(f"🎲 رقم عشوائي بين **{minimum}** و **{maximum}**: **{random.randint(minimum, maximum)}**")

    # ── Meme ─────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="roast", aliases=["حرق"], description="احرق عضواً (بشكل ودي 😄)")
    @app_commands.describe(member="العضو")
    async def roast(self, ctx, member: discord.Member = None):
        target = member or ctx.author
        roasts = [
            f"{target.mention} دماغك أبطأ من إنترنت ٢٠٠٧! 😂",
            f"{target.mention} لو كان الغباء بطولة كنت الأول! 😂",
            f"{target.mention} طلعت من البيت وانسيت تاخذ دماغك! 😂",
            f"{target.mention} أنت التدليل الوحيد اللي بيفكر بصوت عالي! 😂",
        ]
        await ctx.send(random.choice(roasts))

    # ── PP Size (fun) ──────────────────────────────────────────────────────────

    @commands.hybrid_command(name="howcool", description="كيف انت كول؟ 😎")
    @app_commands.describe(member="العضو")
    async def howcool(self, ctx, member: discord.Member = None):
        target = member or ctx.author
        val = random.randint(0, 100)
        bar = "█" * (val // 10) + "░" * (10 - val // 10)
        await ctx.send(f"😎 **{target.display_name}** كوله:\n`[{bar}]` **{val}%**")


async def setup(bot): await bot.add_cog(Fun(bot))
