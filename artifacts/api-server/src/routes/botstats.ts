import { Router, type IRouter } from "express";
import { getBotGuilds } from "../lib/discord.js";

const router: IRouter = Router();

const startTime = Date.now();

router.get("/bot/stats", async (_req, res): Promise<void> => {
  try {
    const botGuilds = await getBotGuilds();
    const uptimeMs = Date.now() - startTime;
    const hours = Math.floor(uptimeMs / 3600000);
    const minutes = Math.floor((uptimeMs % 3600000) / 60000);

    res.json({
      guildCount: botGuilds.size,
      memberCount: 0,
      commandCount: 105,
      uptime: `${hours}h ${minutes}m`,
    });
  } catch {
    res.json({ guildCount: 0, memberCount: 0, commandCount: 105, uptime: "0h 0m" });
  }
});

export default router;
