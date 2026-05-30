"""
cogs/help.py — Rova Bot v4.0 ULTRA
أمر !help شامل وجميل
"""

import discord
from discord.ext import commands


class Help(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.hybrid_command(name="help", description="عرض جميع الأوامر")
    async def help(self, ctx: commands.Context, *, category: str = None):
        color = 0xA855F7

        if category:
            category = category.lower()
            embeds = {
                "moderation": self._mod_embed(color),
                "mod": self._mod_embed(color),
                "config": self._config_embed(color),
                "اعدادات": self._config_embed(color),
                "leveling": self._level_embed(color),
                "مستويات": self._level_embed(color),
                "giveaway": self._give_embed(color),
                "هدايا": self._give_embed(color),
                "tickets": self._ticket_embed(color),
                "تذاكر": self._ticket_embed(color),
                "suggestions": self._suggest_embed(color),
                "اقتراحات": self._suggest_embed(color),
            }
            embed = embeds.get(category)
            if not embed:
                return await ctx.send(f"❌ الفئة غير موجودة. الفئات: `moderation` `config` `leveling` `giveaway` `tickets` `suggestions`")
            return await ctx.send(embed=embed)

        embed = discord.Embed(
            title="📖 Rova Bot — قائمة الأوامر",
            description="استخدم `!help [فئة]` لعرض تفاصيل أي فئة.\nكل الأوامر تشتغل أيضاً كـ Slash `/`",
            color=color,
        )
        embed.set_thumbnail(url=self.bot.user.display_avatar.url if self.bot.user else discord.Embed.Empty)

        embed.add_field(
            name="🛡️ الإشراف — `!help moderation`",
            value="`ban` `unban` `kick` `timeout` `untimeout` `warn` `warnings` `clearwarnings` `clear`",
            inline=False,
        )
        embed.add_field(
            name="⚙️ الإعدادات — `!help config`",
            value="`setprefix` `welcome` `leave` `setlog` `autorole` `leveling` `antispam` `antilink` `antiraid` `antimentions` `badwords` `antinuke` `settickets` `setsuggestions` `addcmd` `removecmd` `listcmds` `settings`",
            inline=False,
        )
        embed.add_field(
            name="⭐ المستويات — `!help leveling`",
            value="`rank` `leaderboard`",
            inline=False,
        )
        embed.add_field(
            name="🎉 الهدايا — `!help giveaway`",
            value="`gstart`",
            inline=False,
        )
        embed.add_field(
            name="🎫 التذاكر — `!help tickets`",
            value="`setup_tickets`",
            inline=False,
        )
        embed.add_field(
            name="💡 الاقتراحات — `!help suggestions`",
            value="`suggest`",
            inline=False,
        )
        embed.set_footer(text="Rova Bot v4.0 ULTRA • الإعدادات أيضاً من الداشبورد")
        await ctx.send(embed=embed)

    def _mod_embed(self, color):
        e = discord.Embed(title="🛡️ أوامر الإشراف", color=color)
        cmds = [
            ("!ban @عضو [سبب]", "حظر عضو من السيرفر"),
            ("!unban [ID] [سبب]", "رفع حظر عضو"),
            ("!kick @عضو [سبب]", "طرد عضو من السيرفر"),
            ("!timeout @عضو [دقائق] [سبب]", "إسكات عضو مؤقتاً (افتراضي 10 دقائق)"),
            ("!untimeout @عضو", "رفع الإسكات عن عضو"),
            ("!warn @عضو [سبب]", "إعطاء تحذير لعضو"),
            ("!warnings @عضو", "عرض تحذيرات عضو"),
            ("!clearwarnings @عضو", "مسح جميع تحذيرات عضو"),
            ("!clear [عدد]", "حذف رسائل من القناة (افتراضي 10)"),
        ]
        for cmd, desc in cmds:
            e.add_field(name=f"`{cmd}`", value=desc, inline=False)
        return e

    def _config_embed(self, color):
        e = discord.Embed(title="⚙️ أوامر الإعدادات", color=color)
        cmds = [
            ("!setprefix <بادئة>", "تغيير بادئة البوت"),
            ("!welcome <on/off/channel/message/color>", "إعداد رسالة الترحيب"),
            ("!leave <on/off/channel/message/color>", "إعداد رسالة الوداع"),
            ("!setlog <#قناة / off>", "تفعيل/تعطيل سجل الأحداث"),
            ("!autorole <add/remove/list> [@رتبة]", "إدارة الرتب التلقائية"),
            ("!leveling <on/off/channel/message>", "إعداد نظام المستويات"),
            ("!antispam <on/off/limit/action>", "إعداد الحماية من السبام"),
            ("!antilink <on/off>", "تفعيل/تعطيل منع الروابط"),
            ("!antiraid <on/off/limit/action>", "إعداد الحماية من الريد"),
            ("!antimentions <on/off/limit>", "إعداد حد المنشنات"),
            ("!badwords <on/off/add/remove/list>", "إدارة الكلمات المحظورة"),
            ("!antinuke <on/off/threshold/punishment/whitelist>", "إعداد الحماية من النيوك"),
            ("!settickets <category/support/log> [قيمة]", "إعداد نظام التذاكر"),
            ("!setsuggestions <on/off/channel/log> [قيمة]", "إعداد نظام الاقتراحات"),
            ("!addcmd <trigger> <رد>", "إضافة أمر مخصص"),
            ("!removecmd <trigger>", "حذف أمر مخصص"),
            ("!listcmds", "عرض الأوامر المخصصة"),
            ("!settings", "عرض جميع الإعدادات الحالية"),
        ]
        for cmd, desc in cmds:
            e.add_field(name=f"`{cmd}`", value=desc, inline=False)
        return e

    def _level_embed(self, color):
        e = discord.Embed(title="⭐ أوامر المستويات", color=color)
        e.add_field(name="`!rank [@عضو]`", value="عرض رتبتك أو رتبة عضو آخر", inline=False)
        e.add_field(name="`!leaderboard` / `!lb`", value="عرض لوحة المتصدرين (أفضل 10)", inline=False)
        e.set_footer(text="يجب تفعيل نظام المستويات أولاً: !leveling on")
        return e

    def _give_embed(self, color):
        e = discord.Embed(title="🎉 أوامر الهدايا", color=color)
        e.add_field(name="`!gstart [ثواني] [فائزين] [جائزة]`", value="بدء هدية يدوياً\nمثال: `!gstart 60 1 نيترو`", inline=False)
        e.set_footer(text="الهدايا الرئيسية تُنشأ من الداشبورد")
        return e

    def _ticket_embed(self, color):
        e = discord.Embed(title="🎫 أوامر التذاكر", color=color)
        e.add_field(name="`!setup_tickets`", value="إرسال لوحة فتح التذاكر في القناة الحالية", inline=False)
        e.add_field(name="`!settickets category #قناة`", value="تحديد الكاتيغوري لتذاكر جديدة", inline=False)
        e.add_field(name="`!settickets support @رتبة`", value="تحديد رتبة الدعم", inline=False)
        e.add_field(name="`!settickets log #قناة`", value="تحديد قناة لوج التذاكر", inline=False)
        return e

    def _suggest_embed(self, color):
        e = discord.Embed(title="💡 أوامر الاقتراحات", color=color)
        e.add_field(name="`!suggest [نص]`", value="إرسال اقتراح للسيرفر", inline=False)
        e.add_field(name="`!setsuggestions on`", value="تفعيل نظام الاقتراحات", inline=False)
        e.add_field(name="`!setsuggestions off`", value="تعطيل نظام الاقتراحات", inline=False)
        e.add_field(name="`!setsuggestions channel #قناة`", value="تحديد قناة الاقتراحات", inline=False)
        e.add_field(name="`!setsuggestions log #قناة`", value="تحديد قناة لوج الاقتراحات", inline=False)
        return e


async def setup(bot: commands.Bot):
    await bot.add_cog(Help(bot))
