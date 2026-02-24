const prisma = require("../../prisma/prisma");
const { hashPassword, comparePassword } = require("../../utils/password");
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require("../../utils/tokens");
const { generateOtp, otpExpiryDate, TEST_OTP } = require("../../utils/otp");
const { safeUser, safeProfile } = require("../../utils/safeTransform");
const uploadService = require("../uploads/upload.service");

function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

function normalizePhone(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, "");
  return cleaned.length ? cleaned : null;
}

function looksLikeEmail(value) {
  return typeof value === "string" && value.includes("@");
}

function parseRegisterIdentity(input) {
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

function parseLoginIdentity(input) {
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

function fallbackEmailForPhone(phone) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `phone.${digits || Date.now()}@tgc.local`;
}

async function registerUser(payload) {
  const { password } = payload;
  const { email: parsedEmail, phone } = parseRegisterIdentity(payload);
  const email = parsedEmail || (phone ? fallbackEmailForPhone(phone) : null);

  if (!email) {
    const err = new Error("Provide a valid email or phone number");
    err.statusCode = 400;
    throw err;
  }

  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }

  if (phone) {
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      const err = new Error("Phone number already in use");
      err.statusCode = 409;
      throw err;
    }
  }

  const passwordHash = await hashPassword(password);
  const otp = phone ? generateOtp() : null;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone,
      otpCode: otp || null,
      otpExpiry: otp ? otpExpiryDate() : null,
      profile: { create: {} },
    },
    include: { profile: true },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const signedProfile = await uploadService.attachSignedUrlsToProfile(user.profile);

  // Store hashed refresh token in DB
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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

async function loginUser(payload) {
  const { password } = payload;
  const identity = parseLoginIdentity(payload);
  if (!identity.email && !identity.phone) {
    const err = new Error("Phone number or email is required");
    err.statusCode = 400;
    throw err;
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
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
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

async function verifyOtp({ phone, otp }) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    const err = new Error("Phone number not registered");
    err.statusCode = 404;
    throw err;
  }

  if (user.phoneVerified) {
    return { message: "Phone already verified", phoneVerified: true };
  }

  if (!user.otpCode || !user.otpExpiry) {
    const err = new Error("No OTP found. Request a new one.");
    err.statusCode = 400;
    throw err;
  }

  if (new Date() > user.otpExpiry) {
    const err = new Error("OTP has expired. Request a new one.");
    err.statusCode = 400;
    throw err;
  }

  if (user.otpCode !== otp) {
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { phoneVerified: true, otpCode: null, otpExpiry: null },
  });

  return { message: "Phone verified successfully", phoneVerified: true };
}

async function resendOtp({ phone }) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    const err = new Error("Phone number not registered");
    err.statusCode = 404;
    throw err;
  }

  if (user.phoneVerified) {
    const err = new Error("Phone already verified");
    err.statusCode = 400;
    throw err;
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

async function refreshTokens({ refreshToken }) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.expiresAt < new Date()) {
    // If found but expired, clean it up
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    const err = new Error("Refresh token expired or revoked");
    err.statusCode = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true },
  });
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Rotate: delete old, create new
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

async function logoutUser({ userId, refreshToken }) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  } else {
    // Revoke all refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  return { message: "Logged out successfully" };
}

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  refreshTokens,
  logoutUser,
};
