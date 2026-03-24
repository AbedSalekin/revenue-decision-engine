import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import stripeRouter from "./stripe";
import dashboardRouter from "./dashboard";
import insightsRouter from "./insights";

const router: IRouter = Router();

// Health check (unauthenticated)
router.use(healthRouter);

// Auth routes — register, login, logout, me
router.use("/auth", authRouter);

// Stripe connection and demo mode
router.use("/stripe", stripeRouter);

// Dashboard financial metrics
router.use("/dashboard", dashboardRouter);

// AI insights
router.use("/insights", insightsRouter);

export default router;
