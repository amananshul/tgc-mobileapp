import prisma from "../../prisma/prisma";
import { safeUser, safeProfile } from "../../utils/safeTransform";
import * as uploadService from "../uploads/upload.service";

function getProfileCompleteness(
  user: { phoneVerified?: boolean | null },
  profile: {
    growthIntent?: string[];
    intent?: string | null;
    username?: string | null;
    fullName?: string | null;
    city?: string | null;
    shortBio?: string | null;
    bio?: string | null;
    interests?: string[];
    skills?: string[];
  } | null
): number {
  if (!profile) return 0;
  const checks = [
    (profile.growthIntent?.length ?? 0) > 0 || !!profile.intent,
    !!profile.username,
    !!profile.fullName,
    !!profile.city,
    !!(profile.shortBio || profile.bio),
    (profile.interests?.length ?? 0) > 0,
    (profile.skills?.length ?? 0) > 0,
    !!user.phoneVerified,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function getUserById(userId: string): Promise<object> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }

  const profileCompleteness = getProfileCompleteness(user, user.profile);
  const karmaPoints = user.profile?.karmaPoints ?? 0;
  const signedProfile = await uploadService.attachSignedUrlsToProfile(user.profile);

  return {
    user: safeUser(user),
    profile: safeProfile(signedProfile),
    summary: {
      role: user.role,
      username: signedProfile?.username ?? null,
      avatarPath: signedProfile?.avatarPath ?? null,
      avatarUrl: signedProfile?.avatarUrl ?? null,
      karmaPoints,
      profileCompleteness,
      stats: {
        eventsAttended: 0,
        gigsDone: 0,
        connections: signedProfile?.interests?.length ?? 0,
      },
    },
  };
}

export { getUserById };
