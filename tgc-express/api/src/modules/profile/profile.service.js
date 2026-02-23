const prisma = require("../../prisma/prisma");
const { safeProfile } = require("../../utils/safeTransform");

function normalizeText(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return value;
  const cleaned = value
    .map(item => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function computeOnboarding(profile) {
  const step1Done = Boolean(profile.intent);
  const step2Done = Boolean(
    profile.username &&
      profile.fullName &&
      profile.city &&
      profile.bio &&
      profile.bio.length <= 120
  );
  const step3Done =
    (profile.interests?.length || 0) > 0 && (profile.skills?.length || 0) > 0;

  if (!step1Done) return { onboardingStep: 0, isOnboarded: false };
  if (!step2Done) return { onboardingStep: 1, isOnboarded: false };
  if (!step3Done) return { onboardingStep: 2, isOnboarded: false };
  return { onboardingStep: 3, isOnboarded: true };
}

async function updateProfile(userId, data) {
  const current = await prisma.profile.findUnique({ where: { userId } });
  if (!current) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const patch = {};
  if ("intent" in data) patch.intent = data.intent || null;
  if ("avatarUrl" in data) patch.avatarUrl = data.avatarUrl || null;
  if ("username" in data) patch.username = normalizeText(data.username)?.toLowerCase() || null;
  if ("fullName" in data) patch.fullName = normalizeText(data.fullName);
  if ("city" in data) patch.city = normalizeText(data.city);
  if ("bio" in data) patch.bio = normalizeText(data.bio);
  if ("interests" in data) patch.interests = normalizeList(data.interests);
  if ("skills" in data) patch.skills = normalizeList(data.skills);
  if ("activeMode" in data) patch.activeMode = data.activeMode;

  const merged = {
    ...current,
    ...patch,
    interests: patch.interests ?? current.interests,
    skills: patch.skills ?? current.skills,
  };

  const onboarding = computeOnboarding(merged);

  let updated;
  try {
    updated = await prisma.profile.update({
      where: { userId },
      data: {
        ...patch,
        onboardingStep: onboarding.onboardingStep,
        isOnboarded: onboarding.isOnboarded,
      },
    });
  } catch (err) {
    if (err.code === "P2002" && Array.isArray(err.meta?.target)) {
      if (err.meta.target.includes("username")) {
        const conflict = new Error("Username is already taken");
        conflict.statusCode = 409;
        throw conflict;
      }
    }
    throw err;
  }

  return { profile: safeProfile(updated) };
}

module.exports = { updateProfile };
