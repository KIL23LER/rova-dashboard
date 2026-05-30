import { Router, type IRouter, type Request, type Response } from "express";
import { getDb, requireAuthMiddleware } from "../lib/botdb.js";

const router: IRouter = Router();

function guildId(req: Request): string {
  const id = req.params["guildId"];
  return Array.isArray(id) ? id[0]! : id!;
}

// ── General Settings ──────────────────────────────────────────────────────────
router.get("/guilds/:guildId/settings", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb();
  const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM guild_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, prefix: row?.prefix ?? "!" });
});

router.patch("/guilds/:guildId/settings", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb();
  const gid = guildId(req);
  const { prefix } = req.body as { prefix?: string };
  db.prepare("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)").run(gid);
  if (prefix !== undefined) db.prepare("UPDATE guild_config SET prefix=? WHERE guild_id=?").run(prefix, gid);
  const row = db.prepare("SELECT * FROM guild_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, prefix: row?.prefix ?? "!" });
});

// ── Welcome ───────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/welcome", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO welcome_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM welcome_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, channelId: row?.channel_id ?? null, message: row?.message ?? "مرحباً {user}!", embedColor: row?.embed_color ?? "#a855f7" });
});

router.patch("/guilds/:guildId/welcome", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { enabled, channelId, message, embedColor } = req.body as any;
  db.prepare("INSERT OR IGNORE INTO welcome_config (guild_id) VALUES (?)").run(gid);
  const u: string[] = []; const v: any[] = [];
  if (enabled !== undefined) { u.push("enabled=?"); v.push(enabled ? 1 : 0); }
  if (channelId !== undefined) { u.push("channel_id=?"); v.push(channelId); }
  if (message !== undefined) { u.push("message=?"); v.push(message); }
  if (embedColor !== undefined) { u.push("embed_color=?"); v.push(embedColor); }
  if (u.length) db.prepare(`UPDATE welcome_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const row = db.prepare("SELECT * FROM welcome_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, channelId: row?.channel_id ?? null, message: row?.message, embedColor: row?.embed_color });
});

// ── Leave ─────────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/leave", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO leave_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM leave_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, channelId: row?.channel_id ?? null, message: row?.message, embedColor: row?.embed_color });
});

router.patch("/guilds/:guildId/leave", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { enabled, channelId, message, embedColor } = req.body as any;
  db.prepare("INSERT OR IGNORE INTO leave_config (guild_id) VALUES (?)").run(gid);
  const u: string[] = []; const v: any[] = [];
  if (enabled !== undefined) { u.push("enabled=?"); v.push(enabled ? 1 : 0); }
  if (channelId !== undefined) { u.push("channel_id=?"); v.push(channelId); }
  if (message !== undefined) { u.push("message=?"); v.push(message); }
  if (embedColor !== undefined) { u.push("embed_color=?"); v.push(embedColor); }
  if (u.length) db.prepare(`UPDATE leave_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const row = db.prepare("SELECT * FROM leave_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, channelId: row?.channel_id ?? null, message: row?.message, embedColor: row?.embed_color });
});

// ── Logging ───────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/logging", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO logging_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM logging_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, channelId: row?.channel_id ?? null });
});

router.patch("/guilds/:guildId/logging", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { enabled, channelId } = req.body as any;
  db.prepare("INSERT OR IGNORE INTO logging_config (guild_id) VALUES (?)").run(gid);
  const u: string[] = []; const v: any[] = [];
  if (enabled !== undefined) { u.push("enabled=?"); v.push(enabled ? 1 : 0); }
  if (channelId !== undefined) { u.push("channel_id=?"); v.push(channelId); }
  if (u.length) db.prepare(`UPDATE logging_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const row = db.prepare("SELECT * FROM logging_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, channelId: row?.channel_id ?? null });
});

// ── Protection ────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/protection", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO protection_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM protection_config WHERE guild_id=?").get(gid) as any;
  res.json({
    guildId: gid, antispamEnabled: !!row?.antispam_enabled, antispamMessages: row?.antispam_messages ?? 5,
    antispamSeconds: row?.antispam_seconds ?? 4, antispamAction: row?.antispam_action ?? "timeout",
    antilinkEnabled: !!row?.antilink_enabled, antilinkWhitelist: JSON.parse(row?.antilink_whitelist ?? "[]"),
    antiraidEnabled: !!row?.antiraid_enabled, antiraidJoins: row?.antiraid_joins ?? 8,
    antiraidSeconds: row?.antiraid_seconds ?? 10, antiraidAction: row?.antiraid_action ?? "kick",
    antimentionsEnabled: !!row?.antimentions_enabled, antimentionsLimit: row?.antimentions_limit ?? 5,
    badwordsEnabled: !!row?.badwords_enabled, badwords: JSON.parse(row?.badwords ?? "[]"),
  });
});

router.patch("/guilds/:guildId/protection", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const body = req.body as any;
  db.prepare("INSERT OR IGNORE INTO protection_config (guild_id) VALUES (?)").run(gid);
  const map: Record<string, string> = {
    antispamEnabled:"antispam_enabled", antispamMessages:"antispam_messages", antispamSeconds:"antispam_seconds",
    antispamAction:"antispam_action", antilinkEnabled:"antilink_enabled", antilinkWhitelist:"antilink_whitelist",
    antiraidEnabled:"antiraid_enabled", antiraidJoins:"antiraid_joins", antiraidSeconds:"antiraid_seconds",
    antiraidAction:"antiraid_action", antimentionsEnabled:"antimentions_enabled", antimentionsLimit:"antimentions_limit",
    badwordsEnabled:"badwords_enabled", badwords:"badwords",
  };
  const u: string[] = []; const v: any[] = [];
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) {
      u.push(`${col}=?`);
      const val = body[k];
      v.push(typeof val === "boolean" ? (val ? 1 : 0) : Array.isArray(val) ? JSON.stringify(val) : val);
    }
  }
  if (u.length) db.prepare(`UPDATE protection_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const row = db.prepare("SELECT * FROM protection_config WHERE guild_id=?").get(gid) as any;
  res.json({
    guildId: gid, antispamEnabled: !!row?.antispam_enabled, antispamMessages: row?.antispam_messages,
    antispamSeconds: row?.antispam_seconds, antispamAction: row?.antispam_action,
    antilinkEnabled: !!row?.antilink_enabled, antilinkWhitelist: JSON.parse(row?.antilink_whitelist ?? "[]"),
    antiraidEnabled: !!row?.antiraid_enabled, antiraidJoins: row?.antiraid_joins,
    antiraidSeconds: row?.antiraid_seconds, antiraidAction: row?.antiraid_action,
    antimentionsEnabled: !!row?.antimentions_enabled, antimentionsLimit: row?.antimentions_limit,
    badwordsEnabled: !!row?.badwords_enabled, badwords: JSON.parse(row?.badwords ?? "[]"),
  });
});

// ── Anti-Nuke ─────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/antinuke", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO antinuke_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM antinuke_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, banThreshold: row?.ban_threshold ?? 3, kickThreshold: row?.kick_threshold ?? 3, channelThreshold: row?.channel_threshold ?? 3, roleThreshold: row?.role_threshold ?? 3, webhookThreshold: row?.webhook_threshold ?? 3, punishment: row?.punishment ?? "ban", whitelist: JSON.parse(row?.whitelist ?? "[]") });
});

router.patch("/guilds/:guildId/antinuke", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req); const body = req.body as any;
  db.prepare("INSERT OR IGNORE INTO antinuke_config (guild_id) VALUES (?)").run(gid);
  const map: Record<string, string> = { enabled:"enabled", banThreshold:"ban_threshold", kickThreshold:"kick_threshold", channelThreshold:"channel_threshold", roleThreshold:"role_threshold", webhookThreshold:"webhook_threshold", punishment:"punishment", whitelist:"whitelist" };
  const u: string[] = []; const v: any[] = [];
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) { u.push(`${col}=?`); const val = body[k]; v.push(typeof val === "boolean" ? (val ? 1 : 0) : Array.isArray(val) ? JSON.stringify(val) : val); }
  }
  if (u.length) db.prepare(`UPDATE antinuke_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const row = db.prepare("SELECT * FROM antinuke_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, banThreshold: row?.ban_threshold, kickThreshold: row?.kick_threshold, channelThreshold: row?.channel_threshold, roleThreshold: row?.role_threshold, webhookThreshold: row?.webhook_threshold, punishment: row?.punishment, whitelist: JSON.parse(row?.whitelist ?? "[]") });
});

// ── Leveling ──────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/leveling", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO leveling_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM leveling_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, xpMin: row?.xp_min ?? 15, xpMax: row?.xp_max ?? 40, cooldownSeconds: row?.cooldown_seconds ?? 60, levelupChannel: row?.levelup_channel ?? null, levelupMessage: row?.levelup_message ?? "مبروك {user}! وصلت للمستوى **{level}**" });
});

router.patch("/guilds/:guildId/leveling", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req); const body = req.body as any;
  db.prepare("INSERT OR IGNORE INTO leveling_config (guild_id) VALUES (?)").run(gid);
  const map: Record<string, string> = { enabled:"enabled", xpMin:"xp_min", xpMax:"xp_max", cooldownSeconds:"cooldown_seconds", levelupChannel:"levelup_channel", levelupMessage:"levelup_message" };
  const u: string[] = []; const v: any[] = [];
  for (const [k, col] of Object.entries(map)) { if (body[k] !== undefined) { u.push(`${col}=?`); v.push(typeof body[k] === "boolean" ? (body[k] ? 1 : 0) : body[k]); } }
  if (u.length) db.prepare(`UPDATE leveling_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const row = db.prepare("SELECT * FROM leveling_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, xpMin: row?.xp_min, xpMax: row?.xp_max, cooldownSeconds: row?.cooldown_seconds, levelupChannel: row?.levelup_channel ?? null, levelupMessage: row?.levelup_message });
});

router.get("/guilds/:guildId/leaderboard", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const rows = db.prepare("SELECT * FROM xp_data WHERE guild_id=? ORDER BY xp DESC LIMIT 20").all(gid) as any[];
  res.json(rows.map((r) => ({ userId: r.user_id, xp: r.xp, level: r.level, messages: r.messages })));
});

// ── Tickets ───────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/tickets", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO ticket_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM ticket_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, panelChannel: row?.panel_channel ?? null, logChannel: row?.log_channel ?? null, supportRole: row?.support_role ?? null, categoryId: row?.category_id ?? null, ticketCount: row?.ticket_count ?? 0 });
});

router.patch("/guilds/:guildId/tickets", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { panelChannel, logChannel, supportRole, categoryId } = req.body as any;
  db.prepare("INSERT OR IGNORE INTO ticket_config (guild_id) VALUES (?)").run(gid);
  const u: string[] = []; const v: any[] = [];
  if (panelChannel !== undefined) { u.push("panel_channel=?"); v.push(panelChannel); }
  if (logChannel !== undefined) { u.push("log_channel=?"); v.push(logChannel); }
  if (supportRole !== undefined) { u.push("support_role=?"); v.push(supportRole); }
  if (categoryId !== undefined) { u.push("category_id=?"); v.push(categoryId); }
  if (u.length) db.prepare(`UPDATE ticket_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const row = db.prepare("SELECT * FROM ticket_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, panelChannel: row?.panel_channel ?? null, logChannel: row?.log_channel ?? null, supportRole: row?.support_role ?? null, categoryId: row?.category_id ?? null, ticketCount: row?.ticket_count ?? 0 });
});

// ── Suggestions ───────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/suggestions", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO suggestion_config (guild_id) VALUES (?)").run(gid);
  const row = db.prepare("SELECT * FROM suggestion_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, channelId: row?.channel_id ?? null, logChannel: row?.log_channel ?? null });
});

router.patch("/guilds/:guildId/suggestions", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { enabled, channelId, logChannel } = req.body as any;
  db.prepare("INSERT OR IGNORE INTO suggestion_config (guild_id) VALUES (?)").run(gid);
  const u: string[] = []; const v: any[] = [];
  if (enabled !== undefined) { u.push("enabled=?"); v.push(enabled ? 1 : 0); }
  if (channelId !== undefined) { u.push("channel_id=?"); v.push(channelId); }
  if (logChannel !== undefined) { u.push("log_channel=?"); v.push(logChannel); }
  if (u.length) db.prepare(`UPDATE suggestion_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const row = db.prepare("SELECT * FROM suggestion_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!row?.enabled, channelId: row?.channel_id ?? null, logChannel: row?.log_channel ?? null });
});

// ── Auto-roles ────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/autoroles", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const rows = db.prepare("SELECT * FROM autoroles WHERE guild_id=?").all(gid) as any[];
  res.json(rows.map((r) => ({ guildId: r.guild_id, roleId: r.role_id, botOnly: !!r.bot_only })));
});

router.post("/guilds/:guildId/autoroles", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { roleId, botOnly } = req.body as any;
  if (!roleId) { res.status(400).json({ error: "roleId required" }); return; }
  db.prepare("INSERT OR IGNORE INTO autoroles (guild_id,role_id,bot_only) VALUES (?,?,?)").run(gid, roleId, botOnly ? 1 : 0);
  res.status(201).json({ ok: true });
});

router.delete("/guilds/:guildId/autoroles/:roleId", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const rid = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
  db.prepare("DELETE FROM autoroles WHERE guild_id=? AND role_id=?").run(gid, rid);
  res.json({ ok: true });
});

// ── Custom Commands ───────────────────────────────────────────────────────────
router.get("/guilds/:guildId/commands", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const rows = db.prepare("SELECT * FROM custom_commands WHERE guild_id=? ORDER BY uses DESC").all(gid) as any[];
  res.json(rows.map((r) => ({ guildId: r.guild_id, trigger: r.trigger, response: r.response, uses: r.uses })));
});

router.post("/guilds/:guildId/commands", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { trigger, response } = req.body as any;
  if (!trigger || !response) { res.status(400).json({ error: "trigger and response required" }); return; }
  db.prepare("INSERT OR REPLACE INTO custom_commands (guild_id,trigger,response,uses) VALUES (?,?,?,0)").run(gid, trigger, response);
  res.status(201).json({ guildId: gid, trigger, response, uses: 0 });
});

router.delete("/guilds/:guildId/commands/:trigger", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const trigger = Array.isArray(req.params.trigger) ? req.params.trigger[0] : req.params.trigger;
  db.prepare("DELETE FROM custom_commands WHERE guild_id=? AND trigger=?").run(gid, trigger);
  res.json({ ok: true });
});

// ── Giveaways ─────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/giveaways", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const rows = db.prepare("SELECT * FROM giveaways WHERE guild_id=? AND ended=0 ORDER BY ends_at ASC").all(gid) as any[];
  res.json(rows.map((r) => ({ id: r.id, guildId: r.guild_id, channelId: r.channel_id, hostId: r.host_id, prize: r.prize, winners: r.winners, endsAt: r.ends_at, ended: !!r.ended, entryCount: JSON.parse(r.entries ?? "[]").length })));
});

// ── Economy ───────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/economy", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const rows = db.prepare("SELECT user_id, wallet, bank, wallet+bank as total FROM economy WHERE guild_id=? ORDER BY total DESC LIMIT 20").all(gid) as any[];
  res.json(rows.map((r) => ({ userId: r.user_id, wallet: r.wallet, bank: r.bank, total: r.total })));
});

// ── Reaction Roles ────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/reactionroles", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const rows = db.prepare("SELECT * FROM reaction_roles WHERE guild_id=?").all(gid) as any[];
  res.json(rows.map((r) => ({ guildId: r.guild_id, messageId: r.message_id, channelId: r.channel_id, emoji: r.emoji, roleId: r.role_id })));
});

router.delete("/guilds/:guildId/reactionroles", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { messageId, emoji } = req.body as any;
  db.prepare("DELETE FROM reaction_roles WHERE guild_id=? AND message_id=? AND emoji=?").run(gid, messageId, emoji);
  res.json({ ok: true });
});

// ── Birthday ──────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/birthday", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO birthday_config (guild_id) VALUES (?)").run(gid);
  const cfg = db.prepare("SELECT * FROM birthday_config WHERE guild_id=?").get(gid) as any;
  const birthdays = db.prepare("SELECT * FROM birthdays WHERE guild_id=? ORDER BY month, day").all(gid) as any[];
  res.json({ guildId: gid, enabled: !!cfg?.enabled, channelId: cfg?.channel_id ?? null, message: cfg?.message ?? "عيد ميلاد سعيد {user}! 🎂", birthdays: birthdays.map(b => ({ userId: b.user_id, month: b.month, day: b.day })) });
});

router.patch("/guilds/:guildId/birthday", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { enabled, channelId, message } = req.body as any;
  db.prepare("INSERT OR IGNORE INTO birthday_config (guild_id) VALUES (?)").run(gid);
  const u: string[] = []; const v: any[] = [];
  if (enabled !== undefined) { u.push("enabled=?"); v.push(enabled ? 1 : 0); }
  if (channelId !== undefined) { u.push("channel_id=?"); v.push(channelId); }
  if (message !== undefined) { u.push("message=?"); v.push(message); }
  if (u.length) db.prepare(`UPDATE birthday_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const cfg = db.prepare("SELECT * FROM birthday_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!cfg?.enabled, channelId: cfg?.channel_id ?? null, message: cfg?.message });
});

// ── Podcast ───────────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/podcast", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  db.prepare("INSERT OR IGNORE INTO podcast_config (guild_id) VALUES (?)").run(gid);
  const cfg = db.prepare("SELECT * FROM podcast_config WHERE guild_id=?").get(gid) as any;
  const episodes = db.prepare("SELECT * FROM podcast_episodes WHERE guild_id=? ORDER BY created_at DESC LIMIT 10").all(gid) as any[];
  res.json({ guildId: gid, enabled: !!cfg?.enabled, roleId: cfg?.role_id ?? null, episodes: episodes.map(e => ({ id: e.id, title: e.title, content: e.content, sentAt: e.sent_at, createdAt: e.created_at })) });
});

router.patch("/guilds/:guildId/podcast", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const { enabled, roleId } = req.body as any;
  db.prepare("INSERT OR IGNORE INTO podcast_config (guild_id) VALUES (?)").run(gid);
  const u: string[] = []; const v: any[] = [];
  if (enabled !== undefined) { u.push("enabled=?"); v.push(enabled ? 1 : 0); }
  if (roleId !== undefined) { u.push("role_id=?"); v.push(roleId); }
  if (u.length) db.prepare(`UPDATE podcast_config SET ${u.join(",")} WHERE guild_id=?`).run(...v, gid);
  const cfg = db.prepare("SELECT * FROM podcast_config WHERE guild_id=?").get(gid) as any;
  res.json({ guildId: gid, enabled: !!cfg?.enabled, roleId: cfg?.role_id ?? null });
});

// ── Announcements ─────────────────────────────────────────────────────────────
router.get("/guilds/:guildId/announcements", (req, res): void => {
  if (!requireAuthMiddleware(req, res)) return;
  const db = getDb(); const gid = guildId(req);
  const rows = db.prepare("SELECT * FROM announcements WHERE guild_id=? ORDER BY sent_at DESC LIMIT 20").all(gid) as any[];
  res.json(rows.map(r => ({ id: r.id, guildId: r.guild_id, channelId: r.channel_id, title: r.title, content: r.content, color: r.color, sentAt: r.sent_at })));
});

export default router;
