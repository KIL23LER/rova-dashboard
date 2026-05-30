import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

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
  `);
}
