const { createClient } = require("@supabase/supabase-js");
const prisma = require("../prisma/prisma");
const env = require("../config/env");

let supabaseAdmin;

function getSupabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    const err = new Error("Supabase auth is not configured");
    err.statusCode = 500;
    throw err;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return supabaseAdmin;
}

function normalizeEmail(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

function normalizePhone(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, "");
  return cleaned || null;
}

function fallbackEmailForSupabaseUser(supabaseUserId) {
  return `supabase.${supabaseUserId}@tgc.local`;
}

function getPhoneVerifiedFromSupabaseUser(user) {
  return Boolean(user?.phone_confirmed_at);
}

async function ensureLocalUserForSupabaseUser(supabaseUser) {
  const supabaseId = String(supabaseUser.id);
  const email = normalizeEmail(supabaseUser.email);
  const phone = normalizePhone(supabaseUser.phone);
  const phoneVerified = getPhoneVerifiedFromSupabaseUser(supabaseUser);

  let user = await prisma.user.findUnique({
    where: { supabaseId },
    include: { profile: true },
  });

  if (!user && email) {
    user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  if (!user && phone) {
    user = await prisma.user.findUnique({
      where: { phone },
      include: { profile: true },
    });
  }

  if (!user) {
    const createEmail = email || fallbackEmailForSupabaseUser(supabaseId);
    user = await prisma.user.create({
      data: {
        email: createEmail,
        supabaseId,
        passwordHash: "SUPABASE_AUTH_ONLY",
        phone,
        phoneVerified,
        profile: { create: {} },
      },
      include: { profile: true },
    });
    return user;
  }

  const patch = {};
  if (user.supabaseId !== supabaseId) patch.supabaseId = supabaseId;
  if (email && user.email !== email) patch.email = email;
  if (phone !== user.phone) patch.phone = phone;
  if (typeof phoneVerified === "boolean" && user.phoneVerified !== phoneVerified) {
    patch.phoneVerified = phoneVerified;
  }

  if (Object.keys(patch).length) {
    try {
      user = await prisma.user.update({
        where: { id: user.id },
        data: patch,
        include: { profile: true },
      });
    } catch (err) {
      // If email/phone conflicts because of legacy local data, at least persist the Supabase link.
      if (err?.code === "P2002") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            supabaseId,
            ...(typeof phoneVerified === "boolean" ? { phoneVerified } : {}),
          },
          include: { profile: true },
        });
      } else {
        throw err;
      }
    }
  }

  if (!user.profile) {
    const profile = await prisma.profile.create({
      data: { userId: user.id },
    });
    user.profile = profile;
  }

  return user;
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const localUser = await ensureLocalUserForSupabaseUser(data.user);

    req.user = {
      userId: localUser.id,
      supabaseUserId: data.user.id,
      email: localUser.email || null,
      phone: localUser.phone || null,
      role: localUser.role,
      onboardingCompleted: Boolean(localUser.onboardingCompleted),
    };
    req.supabaseUser = data.user;

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authMiddleware;
