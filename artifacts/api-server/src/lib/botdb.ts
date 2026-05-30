import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DB_PATH = process.env.BOT_DB_PATH ?? path.join(process.cwd(), "data", "rova.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
CREATE TABLE IF NOT EXISTS guild_config (
    guild_id TEXT PRIMARY KEY,
    prefix   TEXT DEFAULT '!'
);
CREATE TABLE IF NOT EXISTS warnings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id     TEXT NOT NULL,
    user_id      TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason       TEXT,
    created_at   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS welcome_config (
    guild_id    TEXT PRIMARY KEY,
    channel_id  TEXT,
    message     TEXT DEFAULT 'مرحباً {user} في **{server}**! أنت العضو رقم **{count}**.',
    embed_color TEXT DEFAULT '#a855f7',
    enabled     INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS leave_config (
    guild_id    TEXT PRIMARY KEY,
    channel_id  TEXT,
    message     TEXT DEFAULT 'وداعاً {username}، غادر السيرفر.',
    embed_color TEXT DEFAULT '#ef4444',
    enabled     INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS logging_config (
    guild_id   TEXT PRIMARY KEY,
    channel_id TEXT,
    enabled    INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS autoroles (
    guild_id TEXT NOT NULL,
    role_id  TEXT NOT NULL,
    bot_only INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, role_id)
);
CREATE TABLE IF NOT EXISTS protection_config (
    guild_id              TEXT PRIMARY KEY,
    antispam_enabled      INTEGER DEFAULT 0,
    antispam_messages     INTEGER DEFAULT 5,
    antispam_seconds      INTEGER DEFAULT 4,
    antispam_action       TEXT DEFAULT 'timeout',
    antilink_enabled      INTEGER DEFAULT 0,
    antilink_whitelist    TEXT DEFAULT '[]',
    antiraid_enabled      INTEGER DEFAULT 0,
    antiraid_joins        INTEGER DEFAULT 8,
    antiraid_seconds      INTEGER DEFAULT 10,
    antiraid_action       TEXT DEFAULT 'kick',
    antimentions_enabled  INTEGER DEFAULT 0,
    antimentions_limit    INTEGER DEFAULT 5,
    badwords_enabled      INTEGER DEFAULT 0,
    badwords              TEXT DEFAULT '[]',
    whitelist_channels    TEXT DEFAULT '[]',
    whitelist_roles       TEXT DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS leveling_config (
    guild_id         TEXT PRIMARY KEY,
    enabled          INTEGER DEFAULT 0,
    xp_min           INTEGER DEFAULT 15,
    xp_max           INTEGER DEFAULT 40,
    cooldown_seconds INTEGER DEFAULT 60,
    levelup_channel  TEXT,
    levelup_message  TEXT DEFAULT 'مبروك {user}! وصلت للمستوى **{level}**'
);
CREATE TABLE IF NOT EXISTS xp_data (
    guild_id TEXT NOT NULL,
    user_id  TEXT NOT NULL,
    xp       INTEGER DEFAULT 0,
    level    INTEGER DEFAULT 0,
    messages INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
);
CREATE TABLE IF NOT EXISTS giveaways (
    id         TEXT PRIMARY KEY,
    guild_id   TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    host_id    TEXT NOT NULL,
    prize      TEXT NOT NULL,
    winners    INTEGER DEFAULT 1,
    entries    TEXT DEFAULT '[]',
    ends_at    INTEGER NOT NULL,
    ended      INTEGER DEFAULT 0,
    winner_ids TEXT DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS economy (
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    wallet     INTEGER DEFAULT 0,
    bank       INTEGER DEFAULT 500,
    daily_last INTEGER DEFAULT 0,
    work_last  INTEGER DEFAULT 0,
    rob_last   INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
);
CREATE TABLE IF NOT EXISTS ticket_config (
    guild_id       TEXT PRIMARY KEY,
    panel_channel  TEXT,
    log_channel    TEXT,
    support_role   TEXT,
    category_id    TEXT,
    panel_msg_id   TEXT,
    ticket_count   INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id  TEXT PRIMARY KEY,
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    status     TEXT DEFAULT 'open',
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS suggestion_config (
    guild_id    TEXT PRIMARY KEY,
    channel_id  TEXT,
    log_channel TEXT,
    enabled     INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS antinuke_config (
    guild_id           TEXT PRIMARY KEY,
    enabled            INTEGER DEFAULT 0,
    ban_threshold      INTEGER DEFAULT 3,
    kick_threshold     INTEGER DEFAULT 3,
    channel_threshold  INTEGER DEFAULT 3,
    role_threshold     INTEGER DEFAULT 3,
    webhook_threshold  INTEGER DEFAULT 3,
    punishment         TEXT DEFAULT 'ban',
    whitelist          TEXT DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS custom_commands (
    guild_id  TEXT NOT NULL,
    trigger   TEXT NOT NULL,
    response  TEXT NOT NULL,
    uses      INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, trigger)
);
CREATE TABLE IF NOT EXISTS bot_stats (
    id            INTEGER PRIMARY KEY CHECK (id=1),
    guild_count   INTEGER DEFAULT 0,
    member_count  INTEGER DEFAULT 0,
    command_count INTEGER DEFAULT 0,
    uptime        TEXT DEFAULT '0h 0m',
    updated_at    INTEGER DEFAULT (strftime('%s','now'))
);
INSERT OR IGNORE INTO bot_stats (id) VALUES (1);
CREATE TABLE IF NOT EXISTS sessions (
    token        TEXT PRIMARY KEY,
    user_json    TEXT NOT NULL,
    access_token TEXT NOT NULL,
    expires_at   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reaction_roles (
    guild_id   TEXT NOT NULL,
    message_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    emoji      TEXT NOT NULL,
    role_id    TEXT NOT NULL,
    PRIMARY KEY (guild_id, message_id, emoji)
);
CREATE TABLE IF NOT EXISTS birthday_config (
    guild_id   TEXT PRIMARY KEY,
    channel_id TEXT,
    message    TEXT DEFAULT 'عيد ميلاد سعيد {user}! 🎂',
    enabled    INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS birthdays (
    guild_id TEXT NOT NULL,
    user_id  TEXT NOT NULL,
    month    INTEGER NOT NULL,
    day      INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id)
);
CREATE TABLE IF NOT EXISTS polls (
    id         TEXT PRIMARY KEY,
    guild_id   TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    question   TEXT NOT NULL,
    options    TEXT NOT NULL,
    votes      TEXT NOT NULL DEFAULT '{}',
    ended      INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reminders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL,
    guild_id   TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message    TEXT NOT NULL,
    remind_at  INTEGER NOT NULL,
    done       INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS podcast_config (
    guild_id TEXT PRIMARY KEY,
    enabled  INTEGER DEFAULT 0,
    role_id  TEXT
);
CREATE TABLE IF NOT EXISTS podcast_episodes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    sent_at    INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS announcements (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    title      TEXT,
    content    TEXT NOT NULL,
    color      TEXT DEFAULT '#a855f7',
    sent_at    INTEGER NOT NULL
);
  `);
}

export function sessionCreate(user: object, accessToken: string): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  db.prepare(
    "INSERT OR REPLACE INTO sessions (token, user_json, access_token, expires_at) VALUES (?,?,?,?)"
  ).run(token, JSON.stringify(user), accessToken, expires);
  return token;
}

export function sessionGet(token: string): { user: any; accessToken: string } | null {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const row = db.prepare(
    "SELECT user_json, access_token FROM sessions WHERE token=? AND expires_at>?"
  ).get(token, now) as any;
  if (!row) return null;
  return { user: JSON.parse(row.user_json), accessToken: row.access_token };
}

export function sessionDelete(token: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token=?").run(token);
}

export function requireAuthMiddleware(req: any, res: any): { user: any; accessToken: string } | null {
  const authHeader = req.headers["authorization"] ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const sess = sessionGet(authHeader.slice(7));
    if (sess) return sess;
  }
  const sessionUser = (req.session as any)?.user;
  const sessionToken = (req.session as any)?.accessToken;
  if (sessionUser && sessionToken) return { user: sessionUser, accessToken: sessionToken };
  res.status(401).json({ error: "Not authenticated" });
  return null;
}
