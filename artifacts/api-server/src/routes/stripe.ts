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

router.use(requireAuth);

const VALID_COMPANY_TYPES = ["saas", "marketplace", "subscription"] as const;
type CompanyType = (typeof VALID_COMPANY_TYPES)[number];

/** GET /api/stripe/status — check if Stripe is connected */
router.get("/status", (req, res) => {
  const { user } = req;
  res.json({
    connected: user.stripeConnected,
    accountName: user.stripeAccountName || null,
  });
});

/** GET /api/stripe/demo-mode — get current demo mode state */
router.get("/demo-mode", (req, res) => {
  const { user } = req;
  res.json({
    demoMode: user.demoMode,
    companyType: user.demoCompanyType || "saas",
  });
});

/** POST /api/stripe/demo-mode — toggle demo mode on/off */
router.post("/demo-mode", async (req, res) => {
  const parsed = SetDemoModeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { user } = req;
  const [updated] = await db
    .update(usersTable)
    .set({ demoMode: parsed.data.demoMode, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    demoMode: updated.demoMode,
    companyType: updated.demoCompanyType || "saas",
  });
});

/** POST /api/stripe/demo-company — switch demo company archetype */
router.post("/demo-company", async (req, res) => {
  const { companyType } = req.body as { companyType: string };

  if (!VALID_COMPANY_TYPES.includes(companyType as CompanyType)) {
    res.status(400).json({ error: "companyType must be: saas | marketplace | subscription" });
    return;
  }

  const { user } = req;
  const [updated] = await db
    .update(usersTable)
    .set({ demoCompanyType: companyType, updatedAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json({
    demoMode: updated.demoMode,
    companyType: updated.demoCompanyType,
  });
});

/** POST /api/stripe/connect — validate and save a Stripe API key */
router.post("/connect", async (req, res) => {
  const parsed = ConnectStripeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { apiKey } = parsed.data;

  try {
    const stripe = new Stripe(apiKey, { apiVersion: "2025-03-31.basil" });
    const account = await stripe.accounts.retrieve();
    const accountName = account.business_profile?.name || account.id;

    const { user } = req;
    await db
      .update(usersTable)
      .set({
        stripeApiKey: apiKey,
        stripeConnected: true,
        stripeAccountName: accountName,
        demoMode: false,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    res.json({
      success: true,
      message: `Connected to Stripe account: ${accountName}`,
    });
  } catch (err: unknown) {
    req.log.warn({ err }, "Stripe key validation failed");
    res.status(400).json({
      error: "Invalid Stripe API key. Please check your key and try again.",
    });
  }
});

export default router;
