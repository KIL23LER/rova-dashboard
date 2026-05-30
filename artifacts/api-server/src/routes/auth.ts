import { Router, type IRouter } from "express";
import { exchangeCode, getDiscordUser } from "../lib/discord.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

function getRedirectUri(req: import("express").Request): string {
  const base = process.env.DASHBOARD_URL ?? `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost:80"}`;
  return `${base}/api/auth/discord/callback`;
}

router.get("/auth/discord", (req, res): void => {
  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds",
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get("/auth/discord/callback", async (req, res): Promise<void> => {
  const code = req.query["code"] as string | undefined;
  if (!code) {
    res.redirect("/?error=no_code");
    return;
  }
  try {
    const redirectUri = getRedirectUri(req);
    const tokens = await exchangeCode(code, redirectUri);
    const user = await getDiscordUser(tokens.access_token);
    (req.session as any).user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      discriminator: user.discriminator,
      globalName: user.global_name,
    };
    (req.session as any).accessToken = tokens.access_token;
    req.log.info({ userId: user.id }, "User logged in");
    const dashboardBase = process.env.DASHBOARD_URL ?? "";
    res.redirect(`${dashboardBase}/servers`);
  } catch (err) {
    logger.error({ err }, "OAuth2 callback error");
    res.redirect("/?error=auth_failed");
  }
});

router.get("/auth/me", (req, res): void => {
  const user = (req.session as any)?.user;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(user);
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
