"""
bot.py — Rova Bot v4.0 ULTRA
البوت الرئيسي + API Server في نفس العملية
"""

import asyncio
import os
import time

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

import discord
from discord.ext import commands, tasks
from utils.dashboard_db import update_bot_stats
import init_db
import api_server

TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
if not TOKEN:
    raise SystemExit("[ERROR] DISCORD_BOT_TOKEN غير موجود!\nأضفه في ملف .env أو في Variables بالـ panel.")

CLIENT_ID = os.environ.get("DISCORD_CLIENT_ID", "")

COGS = [
    "cogs.welcome",
    "cogs.autoroles",
    "cogs.leveling",
    "cogs.protection",
    "cogs.antinuke",
    "cogs.tickets",
    "cogs.suggestions",
    "cogs.giveaways",
    "cogs.custom_commands",
    "cogs.logging",
    "cogs.moderation",
    "cogs.config",
    "cogs.help",
]

intents = discord.Intents.all()


async def get_prefix(bot, message: discord.Message) -> str:
    if not message.guild:
        return "!"
    try:
        from utils.dashboard_db import get_prefix as _gp
        return _gp(str(message.guild.id))
    except Exception:
        return "!"


class RovaBot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix=get_prefix, intents=intents, help_command=None)
        self.start_time = time.time()
        self.command_count = 0

    async def setup_hook(self):
        for cog in COGS:
            try:
                await self.load_extension(cog)
                print(f"  ✓ {cog}")
            except Exception as e:
                print(f"  ✗ {cog}: {e}")
        try:
            await self.tree.sync()
            print("✓ Slash commands synced.")
        except Exception as e:
            print(f"✗ Slash sync failed: {e}")
        self.update_stats_loop.start()

    async def on_ready(self):
        print(f"\n{'─'*45}")
        print(f"  Rova Bot v4.0 ULTRA  ✓ Online")
        print(f"  User   : {self.user} ({self.user.id})")
        print(f"  Servers: {len(self.guilds)}")
        print(f"  Members: {sum(g.member_count for g in self.guilds)}")
        print(f"{'─'*45}\n")
        dashboard = os.environ.get("DASHBOARD_URL", "").rstrip("/") or "your-dashboard-url"
        await self.change_presence(
            activity=discord.Activity(
                type=discord.ActivityType.watching,
                name=f"{len(self.guilds)} servers | {dashboard}",
            )
        )

    async def on_command(self, ctx):
        self.command_count += 1

    async def on_command_error(self, ctx: commands.Context, error):
        if isinstance(error, commands.MissingPermissions):
            await ctx.send("❌ ليس لديك صلاحية لاستخدام هذا الأمر.", delete_after=5)
        elif isinstance(error, commands.MissingRequiredArgument):
            await ctx.send(f"❌ ناقص: `{error.param.name}`\nاستخدم `!help {ctx.command}` للمساعدة.", delete_after=8)
        elif isinstance(error, commands.BadArgument):
            await ctx.send("❌ قيمة خاطئة. تأكد من الأمر وحاول مجدداً.", delete_after=5)
        elif isinstance(error, commands.CommandNotFound):
            pass
        elif isinstance(error, commands.BotMissingPermissions):
            await ctx.send("❌ البوت لا يملك الصلاحيات الكافية لتنفيذ هذا الأمر.", delete_after=5)
        elif isinstance(error, commands.CheckFailure):
            await ctx.send("❌ لا يمكنك استخدام هذا الأمر.", delete_after=5)
        else:
            print(f"[ERROR] {ctx.command}: {error}")

    @tasks.loop(minutes=5)
    async def update_stats_loop(self):
        try:
            elapsed = int(time.time() - self.start_time)
            h, rem = divmod(elapsed, 3600)
            m, _ = divmod(rem, 60)
            update_bot_stats(
                guild_count=len(self.guilds),
                member_count=sum(g.member_count for g in self.guilds),
                command_count=self.command_count,
                uptime=f"{h}h {m}m",
            )
        except Exception as e:
            print(f"[WARN] Stats update failed: {e}")

    @update_stats_loop.before_loop
    async def before_stats(self):
        await self.wait_until_ready()


async def main():
    init_db.init()
    bot = RovaBot()
    await asyncio.gather(
        bot.start(TOKEN),
        api_server.run_api_server(),
    )


if __name__ == "__main__":
    asyncio.run(main())
