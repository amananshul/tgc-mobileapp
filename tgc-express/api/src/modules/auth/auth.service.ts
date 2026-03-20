import prisma from "../../prisma/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "../../utils/tokens";
import { generateOtp, otpExpiryDate, TEST_OTP } from "../../utils/otp";
import { safeUser, safeProfile } from "../../utils/safeTransform";
import * as uploadService from "../uploads/upload.service";
import { JwtPayload } from "jsonwebtoken";

interface RegisterInput {
  identifier?: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
}

interface LoginInput {
  identifier?: string;
  email?: string;
  phone?: string;
  password: string;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, "");
  return cleaned.length ? cleaned : null;
}

function looksLikeEmail(value: unknown): boolean {
  return typeof value === "string" && value.includes("@");
}

function parseRegisterIdentity(input: RegisterInput): { email: string | null; phone: string | null } {
  const identifier = typeof input.identifier === "string" ? input.identifier.trim() : "";
  const explicitEmail = normalizeEmail(input.email);
  const explicitPhone = normalizePhone(input.phone);

  if (explicitEmail || explicitPhone) {
    return { email: explicitEmail, phone: explicitPhone };
  }

  if (!identifier) return { email: null, phone: null };
  if (looksLikeEmail(identifier)) {
    return { email: normalizeEmail(identifier), phone: null };
  }

  return { email: null, phone: normalizePhone(identifier) };
}

function parseLoginIdentity(input: LoginInput): { email: string | null; phone: string | null } {
  const identifier = typeof input.identifier === "string" ? input.identifier.trim() : "";
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  if (email) return { email, phone: null };
  if (phone) return { email: null, phone };

  if (!identifier) return { email: null, phone: null };
  if (looksLikeEmail(identifier)) {
    return { email: normalizeEmail(identifier), phone: null };
  }

  return { email: null, phone: normalizePhone(identifier) };
}

function fallbackEmailForPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `phone.${digits || Date.now()}@tgc.local`;
}

async function registerUser(payload: RegisterInput): Promise<object> {
  const { password } = payload;
  const { email: parsedEmail, phone } = parseRegisterIdentity(payload);
  const email = parsedEmail ?? (phone ? fallbackEmailForPhone(phone) : null);

  if (!email) {
    throw Object.assign(new Error("Provide a valid email or phone number"), { statusCode: 400 });
  }

  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists) {
    throw Object.assign(new Error("Email already in use"), { statusCode: 409 });
  }

  if (phone) {
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      throw Object.assign(new Error("Phone number already in use"), { statusCode: 409 });
    }
  }

  const passwordHash = await hashPassword(password);
  const otp = phone ? generateOtp() : null;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone,
      otpCode: otp ?? null,
      otpExpiry: otp ? otpExpiryDate() : null,
      profile: { create: {} },
    },
    include: { profile: true },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const signedProfile = await uploadService.attachSignedUrlsToProfile(user.profile);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: safeUser(user),
    profile: safeProfile(signedProfile),
    ...(otp ? { _testOtp: otp } : {}),
    message: otp
      ? `OTP sent to ${phone}. In test mode use: ${TEST_OTP}`
      : "Account created successfully",
  };
}

async function loginUser(payload: LoginInput): Promise<object> {
  const { password } = payload;
  const identity = parseLoginIdentity(payload);
  if (!identity.email && !identity.phone) {
    throw Object.assign(new Error("Phone number or email is required"), { statusCode: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(identity.email ? [{ email: identity.email }] : []),
        ...(identity.phone ? [{ phone: identity.phone }] : []),
      ],
    },
    include: { profile: true },
  });
  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const signedProfile = await uploadService.attachSignedUrlsToProfile(user.profile);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken,
    refreshToken,
    user: safeUser(user),
    profile: safeProfile(signedProfile),
  };
}

async function verifyOtp({ phone, otp }: { phone: string; otp: string }): Promise<object> {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw Object.assign(new Error("Phone number not registered"), { statusCode: 404 });
  }

  if (user.phoneVerified) {
    return { message: "Phone already verified", phoneVerified: true };
  }

  if (!user.otpCode || !user.otpExpiry) {
    throw Object.assign(new Error("No OTP found. Request a new one."), { statusCode: 400 });
  }

  if (new Date() > user.otpExpiry) {
    throw Object.assign(new Error("OTP has expired. Request a new one."), { statusCode: 400 });
  }

  if (user.otpCode !== otp) {
    throw Object.assign(new Error("Invalid OTP"), { statusCode: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { phoneVerified: true, otpCode: null, otpExpiry: null },
  });

  return { message: "Phone verified successfully", phoneVerified: true };
}

async function resendOtp({ phone }: { phone: string }): Promise<object> {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw Object.assign(new Error("Phone number not registered"), { statusCode: 404 });
  }

  if (user.phoneVerified) {
    throw Object.assign(new Error("Phone already verified"), { statusCode: 400 });
  }

  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: { otpCode: otp, otpExpiry: otpExpiryDate() },
  });

  return {
    message: `OTP resent to ${phone}. In test mode use: ${TEST_OTP}`,
    _testOtp: otp,
  };
}

async function refreshTokens({ refreshToken }: { refreshToken: string }): Promise<object> {
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), { statusCode: 401 });
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw Object.assign(new Error("Refresh token expired or revoked"), { statusCode: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    include: { profile: true },
  });
  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(newRefreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: safeUser(user),
    profile: safeProfile(await uploadService.attachSignedUrlsToProfile(user.profile)),
  };
}

async function logoutUser({ userId, refreshToken }: { userId: string; refreshToken?: string }): Promise<object> {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  } else {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  return { message: "Logged out successfully" };
}

export { registerUser, loginUser, verifyOtp, resendOtp, refreshTokens, logoutUser };
