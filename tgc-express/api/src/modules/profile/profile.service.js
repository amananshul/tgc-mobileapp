const prisma = require("../../prisma/prisma");
const { safeProfile, safeUser } = require("../../utils/safeTransform");
const uploadService = require("../uploads/upload.service");

function normalizeText(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return value;
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function normalizeGrowthIntent(value) {
  if (!Array.isArray(value)) return value;
  return normalizeList(value).slice(0, 5);
}

function deriveLegacyIntent(growthIntent) {
  if (!Array.isArray(growthIntent)) return undefined;
  const firstLegacy = growthIntent.find((v) =>
    v === "LEARN" || v === "EARN" || v === "ENTERTAIN"
  );
  return firstLegacy || null;
}

function computeOnboarding(profile) {
  const step1Done = (profile.growthIntent?.length || 0) > 0 || Boolean(profile.intent);
  const shortBio = profile.shortBio || profile.bio || null;
  const step2Done = Boolean(
    profile.avatarPath &&
      profile.username &&
      profile.fullName &&
      profile.city &&
      shortBio &&
      shortBio.length <= 140
  );
  const step3Done =
    (profile.interests?.length || 0) > 0 && (profile.skills?.length || 0) > 0;

  if (!step1Done) return { onboardingStep: 0, isOnboarded: false };
  if (!step2Done) return { onboardingStep: 1, isOnboarded: false };
  if (!step3Done) return { onboardingStep: 2, isOnboarded: false };
  return { onboardingStep: 3, isOnboarded: true };
}

async function getProfileByUserId(userId) {
  const current = await prisma.profile.findUnique({ where: { userId } });
  if (!current) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }
  return current;
}

function buildProfilePatch(userId, data) {
  const patch = {};

  if ("intent" in data) patch.intent = data.intent || null;
  if ("growthIntent" in data) {
    const growthIntent = normalizeGrowthIntent(data.growthIntent);
    patch.growthIntent = growthIntent;
    if (!("intent" in data)) patch.intent = deriveLegacyIntent(growthIntent);
  }

  if ("avatarPath" in data) {
    uploadService.assertStoragePathMatchesPurpose({
      pathValue: data.avatarPath,
      purpose: "profile",
      userId,
    });
    patch.avatarPath = data.avatarPath || null;
  }

  if ("username" in data) patch.username = normalizeText(data.username)?.toLowerCase() || null;
  if ("fullName" in data) patch.fullName = normalizeText(data.fullName);
  if ("city" in data) patch.city = normalizeText(data.city);

  if ("shortBio" in data) {
    const shortBio = normalizeText(data.shortBio);
    patch.shortBio = shortBio;
    patch.bio = shortBio ? shortBio.slice(0, 120) : null;
  } else if ("bio" in data) {
    const bio = normalizeText(data.bio);
    patch.bio = bio ? bio.slice(0, 120) : null;
    patch.shortBio = bio ? bio.slice(0, 140) : null;
  }

  if ("interests" in data) patch.interests = normalizeList(data.interests);
  if ("skills" in data) patch.skills = normalizeList(data.skills);
  if ("activeMode" in data) patch.activeMode = data.activeMode;

  return patch;
}

async function persistProfileUpdate(userId, patch, { forceOnboardingComplete = false } = {}) {
  const current = await getProfileByUserId(userId);

  const merged = {
    ...current,
    ...patch,
    interests: patch.interests ?? current.interests,
    skills: patch.skills ?? current.skills,
    growthIntent: patch.growthIntent ?? current.growthIntent,
  };

  const onboarding = computeOnboarding(merged);
  const isOnboarded = forceOnboardingComplete ? true : onboarding.isOnboarded;
  const onboardingStep = forceOnboardingComplete ? 3 : onboarding.onboardingStep;

  let updatedProfile;
  let updatedUser;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.update({
        where: { userId },
        data: {
          ...patch,
          onboardingStep,
          isOnboarded,
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: { onboardingCompleted: isOnboarded },
      });

      return { profile, user };
    });

    updatedProfile = result.profile;
    updatedUser = result.user;
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

  const signedProfile = await uploadService.attachSignedUrlsToProfile(updatedProfile);
  return {
    user: safeUser(updatedUser),
    profile: safeProfile(signedProfile),
    onboardingCompleted: Boolean(updatedUser.onboardingCompleted),
  };
}

async function updateProfile(userId, data) {
  const patch = buildProfilePatch(userId, data);
  const result = await persistProfileUpdate(userId, patch);
  return { profile: result.profile, user: result.user };
}

async function saveOnboarding(userId, data) {
  const patch = buildProfilePatch(userId, data);

  const result = await persistProfileUpdate(userId, patch, {
    forceOnboardingComplete: true,
  });

  return {
    message: "Onboarding completed",
    user: result.user,
    profile: result.profile,
    onboardingCompleted: true,
  };
}

module.exports = { updateProfile, saveOnboarding };
