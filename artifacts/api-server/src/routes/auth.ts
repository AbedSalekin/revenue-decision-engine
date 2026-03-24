/**
 * Auth routes — register, login, logout, and current user.
 * Passwords are hashed with bcrypt; sessions use JWTs sent in Authorization header.
 */

import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
} from "@workspace/api-zod";
import {
  hashPassword,
  comparePassword,
  signToken,
  requireAuth,
} from "../lib/auth";

const router: IRouter = Router();

/** POST /api/auth/register — create a new account */
router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, password, name } = parsed.data;

  // Check for duplicate email
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      name,
      passwordHash,
      demoMode: true, // new users start in demo mode
    })
    .returning();

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

/** POST /api/auth/login — authenticate and receive a token */
router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { email, password } = parsed.data;

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

/** POST /api/auth/logout — stateless JWT, just acknowledge */
router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

/** GET /api/auth/me — return current authenticated user */
router.get("/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
