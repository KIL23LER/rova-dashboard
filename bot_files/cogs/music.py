"""
music.py — Rova Bot
نظام الموسيقى الأساسي: تشغيل، إيقاف، قائمة تشغيل
ملاحظة: يتطلب ffmpeg و yt-dlp مثبتَين على السيرفر
"""

import discord
from discord.ext import commands
from discord import app_commands
import asyncio
import functools
from collections import deque

try:
    import yt_dlp
    YT_DLP_AVAILABLE = True
except ImportError:
    YT_DLP_AVAILABLE = False

YDL_OPTS = {
    'format': 'bestaudio/best',
    'noplaylist': True,
    'quiet': True,
    'no_warnings': True,
    'default_search': 'ytsearch',
    'source_address': '0.0.0.0',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'opus',
    }],
}

FFMPEG_OPTS = {
    'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
    'options': '-vn -bufsize 64k',
}


class MusicQueue:
    def __init__(self):
        self.queue: deque = deque()
        self.current = None
        self.loop = False


queues: dict[int, MusicQueue] = {}


def get_queue(guild_id: int) -> MusicQueue:
    if guild_id not in queues:
        queues[guild_id] = MusicQueue()
    return queues[guild_id]


async def fetch_source(query: str, loop=None):
    loop = loop or asyncio.get_event_loop()
    opts = YDL_OPTS.copy()
    with yt_dlp.YoutubeDL(opts) as ydl:
        func = functools.partial(ydl.extract_info, query, download=False)
        info = await loop.run_in_executor(None, func)
        if 'entries' in info:
            info = info['entries'][0]
        return {
            'url': info['url'],
            'title': info.get('title', 'غير معروف'),
            'duration': info.get('duration', 0),
            'thumbnail': info.get('thumbnail'),
            'webpage_url': info.get('webpage_url', ''),
        }


class Music(commands.Cog):
    """🎵 نظام الموسيقى"""

    def __init__(self, bot):
        self.bot = bot

    def _not_available(self, ctx):
        return ctx.send("❌ مكتبة `yt-dlp` غير متوفرة. ثبّتها على السيرفر أولاً.", ephemeral=True)

    async def play_next(self, ctx):
        q = get_queue(ctx.guild.id)
        if not q.queue:
            q.current = None
            return
        track = q.queue.popleft()
        q.current = track
        try:
            source = discord.FFmpegOpusAudio(track['url'], **FFMPEG_OPTS)
            ctx.voice_client.play(source, after=lambda e: asyncio.run_coroutine_threadsafe(
                self.play_next(ctx), self.bot.loop))
            embed = discord.Embed(title="🎵 يُشغَّل الآن", description=f"[{track['title']}]({track['webpage_url']})", color=0xa855f7)
            if track.get('thumbnail'):
                embed.set_thumbnail(url=track['thumbnail'])
            dur = track.get('duration', 0)
            if dur:
                m, s = divmod(dur, 60)
                embed.add_field(name="⏱️ المدة", value=f"{m}:{s:02d}", inline=True)
            await ctx.send(embed=embed)
        except Exception as e:
            await ctx.send(f"❌ خطأ في التشغيل: {e}")

    # ── Join ──────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="join", aliases=["انضم"], description="انضم للقناة الصوتية")
    async def join(self, ctx):
        if not ctx.author.voice:
            await ctx.send("❌ أنت لست في قناة صوتية.", ephemeral=True); return
        vc = ctx.author.voice.channel
        if ctx.voice_client:
            await ctx.voice_client.move_to(vc)
        else:
            await vc.connect()
        await ctx.send(f"✅ انضممت إلى **{vc.name}**!", ephemeral=True)

    # ── Play ──────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="play", aliases=["شغل"], description="شغّل موسيقى من YouTube")
    @app_commands.describe(query="اسم الأغنية أو رابط YouTube")
    async def play(self, ctx, *, query: str):
        if not YT_DLP_AVAILABLE:
            await self._not_available(ctx); return

        if not ctx.author.voice:
            await ctx.send("❌ أنت لست في قناة صوتية.", ephemeral=True); return

        if not ctx.voice_client:
            await ctx.author.voice.channel.connect()

        await ctx.defer()
        try:
            track = await fetch_source(query, self.bot.loop)
        except Exception as e:
            await ctx.send(f"❌ فشل البحث: {e}"); return

        q = get_queue(ctx.guild.id)
        q.queue.append(track)

        if not ctx.voice_client.is_playing():
            await self.play_next(ctx)
        else:
            embed = discord.Embed(title="➕ أُضيف للقائمة", description=f"[{track['title']}]({track['webpage_url']})", color=0x6366f1)
            await ctx.send(embed=embed)

    # ── Skip ──────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="skip", aliases=["تخطى"], description="تخطَّ الأغنية الحالية")
    async def skip(self, ctx):
        if ctx.voice_client and ctx.voice_client.is_playing():
            ctx.voice_client.stop()
            await ctx.send("⏭️ تم التخطي.")
        else:
            await ctx.send("❌ لا يوجد شيء يُشغَّل.", ephemeral=True)

    # ── Pause / Resume ────────────────────────────────────────────────────────

    @commands.hybrid_command(name="pause", aliases=["إيقاف-مؤقت"], description="أوقف مؤقتاً")
    async def pause(self, ctx):
        if ctx.voice_client and ctx.voice_client.is_playing():
            ctx.voice_client.pause()
            await ctx.send("⏸️ تم الإيقاف المؤقت.")
        else:
            await ctx.send("❌ لا يوجد شيء يُشغَّل.", ephemeral=True)

    @commands.hybrid_command(name="resume", aliases=["استمرار"], description="استأنف التشغيل")
    async def resume(self, ctx):
        if ctx.voice_client and ctx.voice_client.is_paused():
            ctx.voice_client.resume()
            await ctx.send("▶️ تم استئناف التشغيل.")
        else:
            await ctx.send("❌ الموسيقى ليست موقوفة.", ephemeral=True)

    # ── Stop / Leave ──────────────────────────────────────────────────────────

    @commands.hybrid_command(name="stop", aliases=["وقف"], description="أوقف الموسيقى وامسح القائمة")
    async def stop(self, ctx):
        q = get_queue(ctx.guild.id)
        q.queue.clear()
        q.current = None
        if ctx.voice_client:
            ctx.voice_client.stop()
            await ctx.voice_client.disconnect()
        await ctx.send("⏹️ تم الإيقاف والخروج من القناة.")

    @commands.hybrid_command(name="leave", aliases=["غادر"], description="اطرد البوت من القناة الصوتية")
    async def leave(self, ctx):
        if ctx.voice_client:
            get_queue(ctx.guild.id).queue.clear()
            await ctx.voice_client.disconnect()
            await ctx.send("👋 غادرت القناة الصوتية.")
        else:
            await ctx.send("❌ أنا لست في قناة صوتية.", ephemeral=True)

    # ── Volume ────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="volume", aliases=["صوت"], description="ضبط مستوى الصوت (1-200)")
    @app_commands.describe(vol="مستوى الصوت (1-200)")
    async def volume(self, ctx, vol: int):
        if not (1 <= vol <= 200):
            await ctx.send("❌ الصوت بين 1 و200.", ephemeral=True); return
        if ctx.voice_client and hasattr(ctx.voice_client.source, 'volume'):
            ctx.voice_client.source.volume = vol / 100
            await ctx.send(f"🔊 تم ضبط الصوت على {vol}%.")
        else:
            await ctx.send("❌ لا يوجد شيء يُشغَّل.", ephemeral=True)

    # ── Queue ─────────────────────────────────────────────────────────────────

    @commands.hybrid_command(name="queue", aliases=["قائمة"], description="اعرض قائمة التشغيل")
    async def queue_list(self, ctx):
        q = get_queue(ctx.guild.id)
        embed = discord.Embed(title="🎵 قائمة التشغيل", color=0xa855f7)
        if q.current:
            embed.add_field(name="▶️ يُشغَّل الآن", value=q.current['title'], inline=False)
        if q.queue:
            tracks = list(q.queue)[:10]
            embed.add_field(name="⏭️ القادم",
                            value="\n".join(f"`{i+1}.` {t['title']}" for i, t in enumerate(tracks)),
                            inline=False)
        else:
            embed.description = "القائمة فارغة."
        await ctx.send(embed=embed)

    # ── Now Playing ───────────────────────────────────────────────────────────

    @commands.hybrid_command(name="nowplaying", aliases=["الآن", "np"], description="اعرض الأغنية الحالية")
    async def nowplaying(self, ctx):
        q = get_queue(ctx.guild.id)
        if not q.current:
            await ctx.send("❌ لا يوجد شيء يُشغَّل.", ephemeral=True); return
        t = q.current
        embed = discord.Embed(title="🎵 يُشغَّل الآن",
                              description=f"[{t['title']}]({t['webpage_url']})", color=0xa855f7)
        if t.get('thumbnail'):
            embed.set_thumbnail(url=t['thumbnail'])
        await ctx.send(embed=embed)


async def setup(bot): await bot.add_cog(Music(bot))
