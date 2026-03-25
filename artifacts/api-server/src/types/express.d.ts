/**
 * Extends Express's Request interface so routes can access `req.user`
 * without casting to `any`. The user row is attached by the `requireAuth`
 * middleware defined in lib/auth.ts.
 */

import type { InferSelectModel } from "drizzle-orm";
import type { usersTable } from "@workspace/db";

type DbUser = InferSelectModel<typeof usersTable>;

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth middleware. Present on all authenticated routes. */
      user: DbUser;
    }
  }
}
