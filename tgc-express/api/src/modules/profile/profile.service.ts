import { Prisma } from "@prisma/client";
import prisma from "../../prisma/prisma";
import { safeProfile, safeUser } from "../../utils/safeTransform";
import * as uploadService from "../uploads/upload.service";

interface ProfileData {
  intent?: string | null;
  growthIntent?: string[];
  avatarPath?: string | null;
  username?: string | null;
  fullName?: string | null;
  city?: string | null;
  bio?: string | null;
  shortBio?: string | null;
  interests?: string[];
  skills?: string[];
  activeMode?: string;
  [key: string]: unknown;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return value as string | null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeList(value: unknown): string[] | unknown {
  if (!Array.isArray(value)) return value;
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function normalizeGrowthIntent(value: unknown): string[] | unknown {
  if (!Array.isArray(value)) return value;
  return (normalizeList(value) as string[]).slice(0, 5);
}

function deriveLegacyIntent(growthIntent: unknown): string | null | undefined {
  if (!Array.isArray(growthIntent)) return undefined;
  const firstLegacy = (growthIntent as string[]).find((v) =>
    v === "LEARN" || v === "EARN" || v === "ENTERTAIN"
  );
  return firstLegacy ?? null;
}

function computeOnboarding(profile: {
  growthIntent?: string[];
  intent?: string | null;
  avatarPath?: string | null;
  username?: string | null;
  fullName?: string | null;
  city?: string | null;
  shortBio?: string | null;
  bio?: string | null;
  interests?: string[];
  skills?: string[];
}): { onboardingStep: number; isOnboarded: boolean } {
  const step1Done = (profile.growthIntent?.length ?? 0) > 0 || Boolean(profile.intent);
  const shortBio = profile.shortBio ?? profile.bio ?? null;
  const step2Done = Boolean(
    profile.avatarPath &&
      profile.username &&
      profile.fullName &&
      profile.city &&
      shortBio &&
      shortBio.length <= 140
  );
  const step3Done =
    (profile.interests?.length ?? 0) > 0 && (profile.skills?.length ?? 0) > 0;

  if (!step1Done) return { onboardingStep: 0, isOnboarded: false };
  if (!step2Done) return { onboardingStep: 1, isOnboarded: false };
  if (!step3Done) return { onboardingStep: 2, isOnboarded: false };
  return { onboardingStep: 3, isOnboarded: true };
}

async function getProfileByUserId(userId: string) {
  const current = await prisma.profile.findUnique({ where: { userId } });
  if (!current) {
    throw Object.assign(new Error("Profile not found"), { statusCode: 404 });
  }
  return current;
}

function buildProfilePatch(userId: string, data: ProfileData): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if ("intent" in data) patch.intent = data.intent ?? null;
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
    patch.avatarPath = data.avatarPath ?? null;
  }

  if ("username" in data) patch.username = normalizeText(data.username)?.toLowerCase() ?? null;
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

async function persistProfileUpdate(
  userId: string,
  patch: Record<string, unknown>,
  { forceOnboardingComplete = false } = {}
): Promise<object> {
  const current = await getProfileByUserId(userId);

  const oldAvatarPath =
    "avatarPath" in patch &&
    patch.avatarPath &&
    patch.avatarPath !== current.avatarPath
      ? current.avatarPath
      : null;

  const merged = {
    ...current,
    ...patch,
    interests: (patch.interests as string[] | undefined) ?? current.interests,
    skills: (patch.skills as string[] | undefined) ?? current.skills,
    growthIntent: (patch.growthIntent as string[] | undefined) ?? current.growthIntent,
  };

  const onboarding = computeOnboarding(merged as Parameters<typeof computeOnboarding>[0]);
  const isOnboarded = forceOnboardingComplete ? true : onboarding.isOnboarded;
  const onboardingStep = forceOnboardingComplete ? 3 : onboarding.onboardingStep;

  let updatedProfile;
  let updatedUser;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.update({
        where: { userId },
        data: {
          ...(patch as Prisma.ProfileUpdateInput),
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
    const prismaErr = err as Prisma.PrismaClientKnownRequestError;
    if (prismaErr?.code === "P2002" && Array.isArray((prismaErr.meta as Record<string, unknown>)?.target)) {
      const target = (prismaErr.meta as Record<string, string[]>).target;
      if (target.includes("username")) {
        throw Object.assign(new Error("Username is already taken"), { statusCode: 409 });
      }
    }
    throw err;
  }

  if (oldAvatarPath) {
    uploadService.deleteStoragePath(oldAvatarPath).catch(() => {});
  }

  const signedProfile = await uploadService.attachSignedUrlsToProfile(updatedProfile);
  return {
    user: safeUser(updatedUser),
    profile: safeProfile(signedProfile),
    onboardingCompleted: Boolean(updatedUser.onboardingCompleted),
  };
}

async function updateProfile(userId: string, data: ProfileData): Promise<object> {
  const patch = buildProfilePatch(userId, data);
  const result = await persistProfileUpdate(userId, patch) as { profile: object; user: object };
  return { profile: result.profile, user: result.user };
}

async function saveOnboarding(userId: string, data: ProfileData): Promise<object> {
  const patch = buildProfilePatch(userId, data);

  const result = await persistProfileUpdate(userId, patch, {
    forceOnboardingComplete: true,
  }) as { profile: object; user: object };

  return {
    message: "Onboarding completed",
    user: result.user,
    profile: result.profile,
    onboardingCompleted: true,
  };
}

export { updateProfile, saveOnboarding };
