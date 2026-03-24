/**
 * Stripe routes — connect Stripe, check connection status, toggle demo mode.
 * All routes require authentication.
 */

import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ConnectStripeBody, SetDemoModeBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

// All stripe routes require a logged-in user
router.use(requireAuth);

/** GET /api/stripe/status — check if Stripe is connected */
router.get("/status", async (req, res) => {
  const user = (req as any).user;
  res.json({
    connected: user.stripeConnected,
    accountName: user.stripeAccountName || null,
  });
});

/** GET /api/stripe/demo-mode — get current demo mode state */
router.get("/demo-mode", async (req, res) => {
  const user = (req as any).user;
  res.json({ demoMode: user.demoMode });
});

/** POST /api/stripe/demo-mode — toggle demo mode on/off */
router.post("/demo-mode", async (req, res) => {
  const parsed = SetDemoModeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const user = (req as any).user;
  const [updated] = await db
    .update(usersTable)
    .set({ demoMode: parsed.data.demoMode, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({ demoMode: updated.demoMode });
});

/** POST /api/stripe/connect — validate and save a Stripe API key */
router.post("/connect", async (req, res) => {
  const parsed = ConnectStripeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { apiKey } = parsed.data;

  // Validate the key by making a test API call to Stripe
  try {
    const stripe = new Stripe(apiKey, { apiVersion: "2025-03-31.basil" });
    const account = await stripe.accounts.retrieve();

    const user = (req as any).user;
    await db
      .update(usersTable)
      .set({
        stripeApiKey: apiKey,
        stripeConnected: true,
        stripeAccountName: account.business_profile?.name || account.id,
        demoMode: false, // disable demo mode when real Stripe is connected
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    res.json({
      success: true,
      message: `Connected to Stripe account: ${account.business_profile?.name || account.id}`,
    });
  } catch (err: any) {
    req.log.warn({ err }, "Stripe key validation failed");
    res.status(400).json({
      error: "Invalid Stripe API key. Please check your key and try again.",
    });
  }
});

export default router;
