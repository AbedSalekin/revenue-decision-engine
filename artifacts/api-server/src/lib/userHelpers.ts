/**
 * Shared helpers for route handlers that operate on the authenticated user.
 * Centralises the "live Stripe vs demo" check and company type resolution
 * so the same logic is not duplicated across multiple route files.
 */

import type { CompanyType } from "../services/stripe/types";

type DbUser = Express.Request["user"];

/** Returns true when the user has connected Stripe and demo mode is off. */
export function isLiveMode(user: DbUser): boolean {
  return !user.demoMode && !!user.stripeConnected && !!user.stripeApiKey;
}

/** Returns the active company archetype for demo data generation. */
export function resolveCompanyType(user: DbUser): CompanyType {
  return (user.demoCompanyType as CompanyType) || "saas";
}
