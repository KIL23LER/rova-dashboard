"""
dashboard_db.py — Rova Bot v4.0 ULTRA
يقرأ جميع إعدادات لوحة التحكم من قاعدة البيانات SQLite
"""

import sqlite3
import json
import os
from typing import Optional

DB_PATH = os.environ.get("BOT_DB_PATH", os.path.join(os.getcwd(), "data", "rova.db"))


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# ─── Guild Config ─────────────────────────────────────────────────────────────

def get_prefix(guild_id: str) -> str:
    with get_db() as db:
        row = db.execute(
            "SELECT prefix FROM guild_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    return row["prefix"] if row else "!"


# ─── Welcome ──────────────────────────────────────────────────────────────────

def get_welcome_config(guild_id: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM welcome_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    return dict(row) if row else None


# ─── Leave ────────────────────────────────────────────────────────────────────

def get_leave_config(guild_id: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM leave_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    return dict(row) if row else None


# ─── Logging ──────────────────────────────────────────────────────────────────

def get_logging_config(guild_id: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM logging_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    return dict(row) if row else None


# ─── Auto-Roles ───────────────────────────────────────────────────────────────

def get_autoroles(guild_id: str, bot_only: bool = False) -> list[str]:
    with get_db() as db:
        if bot_only:
            rows = db.execute(
                "SELECT role_id FROM autoroles WHERE guild_id = ? AND bot_only = 1", (guild_id,)
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT role_id FROM autoroles WHERE guild_id = ? AND bot_only = 0", (guild_id,)
            ).fetchall()
    return [r["role_id"] for r in rows]


# ─── Protection ───────────────────────────────────────────────────────────────

def get_protection_config(guild_id: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM protection_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    if not row:
        return None
    data = dict(row)
    data["antilink_whitelist"] = json.loads(data.get("antilink_whitelist") or "[]")
    data["badwords"] = json.loads(data.get("badwords") or "[]")
    data["whitelist_channels"] = json.loads(data.get("whitelist_channels") or "[]")
    data["whitelist_roles"] = json.loads(data.get("whitelist_roles") or "[]")
    return data


# ─── Anti-Nuke ────────────────────────────────────────────────────────────────

def get_antinuke_config(guild_id: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM antinuke_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    if not row:
        return None
    data = dict(row)
    data["whitelist"] = json.loads(data.get("whitelist") or "[]")
    return data


# ─── Leveling ─────────────────────────────────────────────────────────────────

def get_leveling_config(guild_id: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM leveling_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    return dict(row) if row else None


def get_user_xp(guild_id: str, user_id: str) -> dict:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM xp_data WHERE guild_id = ? AND user_id = ?",
            (guild_id, user_id)
        ).fetchone()
    return dict(row) if row else {"xp": 0, "level": 0, "messages": 0}


def update_user_xp(guild_id: str, user_id: str, xp: int, level: int, messages: int):
    with get_db() as db:
        db.execute(
            """INSERT INTO xp_data (guild_id, user_id, xp, level, messages)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(guild_id, user_id)
               DO UPDATE SET xp=excluded.xp, level=excluded.level, messages=excluded.messages""",
            (guild_id, user_id, xp, level, messages)
        )


def get_leaderboard(guild_id: str, limit: int = 10) -> list[dict]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM xp_data WHERE guild_id = ? ORDER BY xp DESC LIMIT ?",
            (guild_id, limit)
        ).fetchall()
    return [dict(r) for r in rows]


# ─── Tickets ──────────────────────────────────────────────────────────────────

def get_ticket_config(guild_id: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM ticket_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    return dict(row) if row else None


def create_ticket(ticket_id: str, guild_id: str, user_id: str, channel_id: str):
    import time
    with get_db() as db:
        db.execute(
            """INSERT INTO tickets (ticket_id, guild_id, user_id, channel_id, status, created_at)
               VALUES (?, ?, ?, ?, 'open', ?)""",
            (ticket_id, guild_id, user_id, channel_id, int(time.time()))
        )
        db.execute(
            "UPDATE ticket_config SET ticket_count = ticket_count + 1 WHERE guild_id = ?",
            (guild_id,)
        )


def close_ticket(ticket_id: str):
    with get_db() as db:
        db.execute(
            "UPDATE tickets SET status = 'closed' WHERE ticket_id = ?", (ticket_id,)
        )


# ─── Suggestions ──────────────────────────────────────────────────────────────

def get_suggestion_config(guild_id: str) -> Optional[dict]:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM suggestion_config WHERE guild_id = ?", (guild_id,)
        ).fetchone()
    return dict(row) if row else None


# ─── Custom Commands ──────────────────────────────────────────────────────────

def get_custom_commands(guild_id: str) -> list[dict]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM custom_commands WHERE guild_id = ?", (guild_id,)
        ).fetchall()
    return [dict(r) for r in rows]


def increment_command_uses(guild_id: str, trigger: str):
    with get_db() as db:
        db.execute(
            "UPDATE custom_commands SET uses = uses + 1 WHERE guild_id = ? AND trigger = ?",
            (guild_id, trigger)
        )


# ─── Giveaways ────────────────────────────────────────────────────────────────

def get_active_giveaways(guild_id: str) -> list[dict]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM giveaways WHERE guild_id = ? AND ended = 0", (guild_id,)
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["entries"] = json.loads(d.get("entries") or "[]")
        d["winner_ids"] = json.loads(d.get("winner_ids") or "[]")
        result.append(d)
    return result


def join_giveaway(giveaway_id: str, user_id: str) -> bool:
    with get_db() as db:
        row = db.execute(
            "SELECT entries FROM giveaways WHERE id = ? AND ended = 0", (giveaway_id,)
        ).fetchone()
        if not row:
            return False
        entries = json.loads(row["entries"] or "[]")
        if user_id in entries:
            return False
        entries.append(user_id)
        db.execute(
            "UPDATE giveaways SET entries = ? WHERE id = ?",
            (json.dumps(entries), giveaway_id)
        )
    return True


def end_giveaway(giveaway_id: str, winner_ids: list[str]):
    with get_db() as db:
        db.execute(
            "UPDATE giveaways SET ended = 1, winner_ids = ? WHERE id = ?",
            (json.dumps(winner_ids), giveaway_id)
        )


# ─── Warnings ─────────────────────────────────────────────────────────────────

def add_warning(guild_id: str, user_id: str, moderator_id: str, reason: str) -> int:
    import time
    with get_db() as db:
        cursor = db.execute(
            "INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)",
            (guild_id, user_id, moderator_id, reason, int(time.time()))
        )
    return cursor.lastrowid


def get_warnings(guild_id: str, user_id: str) -> list[dict]:
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC",
            (guild_id, user_id)
        ).fetchall()
    return [dict(r) for r in rows]


def clear_warnings(guild_id: str, user_id: str):
    with get_db() as db:
        db.execute(
            "DELETE FROM warnings WHERE guild_id = ? AND user_id = ?",
            (guild_id, user_id)
        )


# ─── Economy ──────────────────────────────────────────────────────────────────

def get_economy(guild_id: str, user_id: str) -> dict:
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM economy WHERE guild_id = ? AND user_id = ?",
            (guild_id, user_id)
        ).fetchone()
    if not row:
        with get_db() as db:
            db.execute(
                "INSERT OR IGNORE INTO economy (guild_id, user_id) VALUES (?, ?)",
                (guild_id, user_id)
            )
        return {"wallet": 0, "bank": 500, "daily_last": 0, "work_last": 0, "rob_last": 0}
    return dict(row)


def update_economy(guild_id: str, user_id: str, **kwargs):
    if not kwargs:
        return
    cols = ", ".join(f"{k} = ?" for k in kwargs)
    vals = list(kwargs.values()) + [guild_id, user_id]
    with get_db() as db:
        db.execute(
            f"UPDATE economy SET {cols} WHERE guild_id = ? AND user_id = ?", vals
        )


# ─── Bot Stats ────────────────────────────────────────────────────────────────

def update_bot_stats(guild_count: int, member_count: int, command_count: int, uptime: str):
    with get_db() as db:
        db.execute("DELETE FROM bot_stats")
        db.execute(
            """INSERT INTO bot_stats (guild_count, member_count, command_count, uptime, updated_at)
               VALUES (?, ?, ?, ?, strftime('%s','now'))""",
            (guild_count, member_count, command_count, uptime)
        )
