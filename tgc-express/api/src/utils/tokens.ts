import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import env from "../config/env";

interface TokenUser {
  id: string;
  email?: string | null;
}

function signAccessToken(user: TokenUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpires } as jwt.SignOptions
  );
}

function signRefreshToken(user: TokenUser): string {
  return jwt.sign(
    { userId: user.id },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpires } as jwt.SignOptions
  );
}

function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken };
