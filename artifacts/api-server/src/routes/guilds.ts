import { Router, type IRouter, type Request, type Response } from "express";
import { getUserGuilds, getBotGuilds, getGuildChannels, getGuildRoles } from "../lib/discord.js";
import { requireAuthMiddleware } from "../lib/botdb.js";

const router: IRouter = Router();

function hasManageGuild(permissions: string): boolean {
  const perms = BigInt(permissions);
  return (perms & BigInt(0x20)) !== BigInt(0);
}

router.get("/guilds", async (req, res): Promise<void> => {
  const sess = requireAuthMiddleware(req, res);
  if (!sess) return;

  try {
    const [userGuilds, botGuildIds] = await Promise.all([
      getUserGuilds(sess.accessToken),
      getBotGuilds(),
    ]);

    const result = userGuilds
      .filter((g) => g.owner || hasManageGuild(g.permissions))
      .map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        botPresent: botGuildIds.has(g.id),
        memberCount: g.approximate_member_count ?? 0,
        owner: g.owner,
      }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get guilds");
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
});

router.get("/guilds/:guildId", async (req, res): Promise<void> => {
  const sess = requireAuthMiddleware(req, res);
  if (!sess) return;

  const guildId = Array.isArray(req.params.guildId) ? req.params.guildId[0] : req.params.guildId;

  try {
    const [channels, roles] = await Promise.all([
      getGuildChannels(guildId),
      getGuildRoles(guildId),
    ]);

    res.json({
      id: guildId,
      name: "",
      icon: null,
      channels: channels
        .filter((c) => [0, 2, 4, 5, 15].includes(c.type))
        .map((c) => ({ id: c.id, name: c.name, type: c.type })),
      roles: roles
        .filter((r) => r.name !== "@everyone")
        .sort((a, b) => b.position - a.position)
        .map((r) => ({ id: r.id, name: r.name, color: r.color })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get guild detail");
    res.status(500).json({ error: "Failed to fetch guild detail" });
  }
});

export default router;
