import { Router, type IRouter } from "express";
import { exchangeCode, getDiscordUser } from "../lib/discord.js";
import { logger } from "../lib/logger.js";
import { sessionCreate, sessionGet, sessionDelete } from "../lib/botdb.js";

const router: IRouter = Router();

function getCallbackUri(): string {
  if (process.env.API_URL) {
    return `${process.env.API_URL.replace(/\/$/, "")}/api/auth/discord/callback`;
  }
  const base = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost:80"}`;
  return `${base}/api/auth/discord/callback`;
}

function getDashboardUrl(referer?: string): string {
  if (process.env.DASHBOARD_URL) return process.env.DASHBOARD_URL.replace(/\/$/, "");
  if (referer) {
    try { return new URL(referer).origin; } catch {}
  }
  return "";
}

router.get("/auth/discord", (req, res): void => {
  const redirectUri = getCallbackUri();
  const returnOrigin = getDashboardUrl(req.headers.referer);
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

  let redirectBase = process.env.DASHBOARD_URL?.replace(/\/$/, "") ?? "";
  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, "base64url").toString());
      if (decoded.origin) redirectBase = decoded.origin;
    } catch {}
  }

  if (!code) {
    res.redirect(`${redirectBase}/?error=no_code`);
    return;
  }

  try {
    const redirectUri = getCallbackUri();
    const tokens = await exchangeCode(code, redirectUri);
    const user = await getDiscordUser(tokens.access_token);

    const userObj = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      discriminator: user.discriminator,
      globalName: user.global_name,
    };

    // Store in both: cookie session AND SQLite token (for cross-origin dashboard)
    (req.session as any).user = userObj;
    (req.session as any).accessToken = tokens.access_token;

    const token = sessionCreate(userObj, tokens.access_token);
    req.log.info({ userId: user.id }, "User logged in");

    // Redirect with token in URL so cross-origin dashboards (Vercel) can use it
    res.redirect(`${redirectBase}/servers?_token=${token}`);
  } catch (err) {
    logger.error({ err }, "OAuth2 callback error");
    const errBase = process.env.DASHBOARD_URL?.replace(/\/$/, "") ?? "";
    res.redirect(`${errBase}/?error=auth_failed`);
  }
});

router.get("/auth/me", (req, res): void => {
  // Check Bearer token first (cross-origin dashboard)
  const authHeader = req.headers["authorization"] ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const sess = sessionGet(authHeader.slice(7));
    if (sess) { res.json(sess.user); return; }
  }
  // Fall back to cookie session
  const user = (req.session as any)?.user;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(user);
});

router.post("/auth/logout", (req, res): void => {
  const authHeader = req.headers["authorization"] ?? "";
  if (authHeader.startsWith("Bearer ")) {
    sessionDelete(authHeader.slice(7));
  }
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
