import { Router, type IRouter } from "express";
import { exchangeCode, getDiscordUser } from "../lib/discord.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

function getCallbackUri(): string {
  if (process.env.API_URL) {
    return `${process.env.API_URL.replace(/\/$/, "")}/api/auth/discord/callback`;
  }
  const base = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost:80"}`;
  return `${base}/api/auth/discord/callback`;
}

router.get("/auth/discord", (req, res): void => {
  const redirectUri = getCallbackUri();

  // Store the referer origin in state so we know where to redirect after OAuth
  let returnOrigin = process.env.DASHBOARD_URL ?? "";
  const referer = req.headers.referer;
  if (referer) {
    try {
      returnOrigin = new URL(referer).origin;
    } catch {}
  }
  const state = Buffer.from(JSON.stringify({ origin: returnOrigin })).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds",
    state,
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get("/auth/discord/callback", async (req, res): Promise<void> => {
  const code = req.query["code"] as string | undefined;
  const stateParam = req.query["state"] as string | undefined;

  if (!code) {
    res.redirect("/?error=no_code");
    return;
  }

  // Decode origin from state
  let redirectBase = process.env.DASHBOARD_URL ?? "";
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString());
      if (decoded.origin) redirectBase = decoded.origin;
    } catch {}
  }

  try {
    const redirectUri = getCallbackUri();
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
    res.redirect(`${redirectBase}/servers`);
  } catch (err) {
    logger.error({ err }, "OAuth2 callback error");
    const errBase = process.env.DASHBOARD_URL ?? "";
    res.redirect(`${errBase}/?error=auth_failed`);
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
