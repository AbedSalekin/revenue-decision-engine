/**
 * Authentication utilities — JWT signing/verification and password hashing.
 * Uses bcrypt for passwords and jsonwebtoken for session tokens.
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "ai-cfo-dev-secret-change-in-prod";
const SALT_ROUNDS = 10;

export interface AuthPayload {
  userId: number;
  email: string;
}

/** Hash a plain-text password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Compare a plain-text password against a stored hash */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Sign a JWT for the given user */
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/** Verify and decode a JWT — throws if invalid */
export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

/** Express middleware — attach req.user if a valid Bearer token is present */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);

    // Load the full user from DB so routes always get fresh data
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!users[0]) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    (req as any).user = users[0];
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
