import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

function getAccessSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
}

function signAccessToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email }, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

function toSafeUser(user: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}): SafeUser {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export async function register(
  email: string,
  name: string,
  password: string,
): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("Email already registered", 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  return { user: toSafeUser(user), tokens: { accessToken, refreshToken } };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("Invalid email or password", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const accessToken = signAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);

  return { user: toSafeUser(user), tokens: { accessToken, refreshToken } };
}

export async function refresh(token: string): Promise<AuthTokens> {
  const record = await prisma.refreshToken.findUnique({ where: { token } });

  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.refreshToken.delete({ where: { id: record.id } });
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Rotation: delete old token, issue new pair
  await prisma.refreshToken.delete({ where: { id: record.id } });

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) throw new AppError("User not found", 401);

  const accessToken = signAccessToken(user);
  const newRefreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);
  return toSafeUser(user);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
}
