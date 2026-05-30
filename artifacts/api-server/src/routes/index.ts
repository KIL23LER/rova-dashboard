import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import guildsRouter from "./guilds.js";
import settingsRouter from "./settings.js";
import botstatsRouter from "./botstats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(guildsRouter);
router.use(settingsRouter);
router.use(botstatsRouter);

export default router;
