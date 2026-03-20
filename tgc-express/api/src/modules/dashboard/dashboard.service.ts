import prisma from "../../prisma/prisma";
import { safeUser, safeProfile } from "../../utils/safeTransform";
import * as uploadService from "../uploads/upload.service";
import { getUpcomingEventsPreview } from "../events/events.service";

function getCompleteness(
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
  }
): number {
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

async function getDashboard(userId: string): Promise<object> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    throw Object.assign(new Error("Profile not found"), { statusCode: 404 });
  }

  const profile = user.profile;
  const signedProfile = await uploadService.attachSignedUrlsToProfile(profile);
  const completeness = getCompleteness(user, profile);
  const isHostMode = profile.activeMode === "HOST";
  const displayName =
    profile.fullName ??
    profile.username ??
    user.email?.split("@")[0] ??
    "Community Builder";

  const profileTitle = isHostMode ? "Host Profile" : "Community Profile";
  const dashboardSubtitle = isHostMode
    ? "Manage events, gigs, and approvals"
    : "Let's make today productive";

  const userTribes = await prisma.userTribe.findMany({
    where: { userId },
    include: { tribe: true },
    orderBy: { joinedAt: "desc" },
    take: 3,
  });

  const hasJoinedTribe = userTribes.length > 0;

  const registrationCount = await prisma.eventRegistration.count({ where: { userId } });
  const hasRegisteredEvent = registrationCount > 0;

  const upcomingEventsPreview = await getUpcomingEventsPreview(userId, profile.city ?? undefined);

  const hostEventCount = await prisma.event.count({
    where: { createdById: userId, isDeleted: false },
  });
  const hostTotalRegistrations = await prisma.eventRegistration.count({
    where: { event: { createdById: userId, isDeleted: false } },
  });

  const karmaLevel = Math.floor(profile.karmaPoints / 100) + 1;

  return {
    user: safeUser(user),
    profile: safeProfile(signedProfile),
    mode: profile.activeMode,
    profileCompleteness: completeness,
    welcome: {
      title: `Hi, ${displayName} 👋`,
      subtitle: dashboardSubtitle,
    },
    onboarding: {
      onboardingStep: profile.onboardingStep,
      isOnboarded: Boolean(user.onboardingCompleted || profile.isOnboarded),
      completeness,
    },
    profileSummary: {
      title: profileTitle,
      completionText: `Profile ${completeness}% complete`,
      level: karmaLevel,
    },
    nextActions: [
      {
        id: "join_tribe",
        title: "Join a Tribe",
        description: "Find people who share your vibe and goals.",
        done: hasJoinedTribe,
        accent: "lavender",
      },
      {
        id: "attend_event",
        title: "Attend an Event",
        description: "Show up, connect, and start building momentum.",
        done: hasRegisteredEvent,
        accent: "coral",
      },
      {
        id: "add_skill",
        title: "Add a Skill",
        description: "Show what you can offer to your community.",
        done: (profile.skills?.length ?? 0) > 0,
        accent: "mint",
      },
    ],
    nextBestActions: [
      {
        code: "join_tribe",
        title: "Join a Tribe",
        subtitle: "Find people who share your vibe and goals.",
        ctaRoute: "ExploreTribes",
      },
      {
        code: "attend_event",
        title: "Attend an Event",
        subtitle: "Show up, connect, and start building momentum.",
        ctaRoute: "ExploreEvents",
      },
      {
        code: "add_skill",
        title: "Add a Skill",
        subtitle: "Show what you can offer to your community.",
        ctaRoute: "Profile",
      },
    ],
    karma: {
      level: karmaLevel,
      points: profile.karmaPoints,
      pointsToNext: 100 - (profile.karmaPoints % 100),
      progress: profile.karmaPoints % 100,
    },
    karmaSummary: {
      karmaPoints: profile.karmaPoints,
      karmaLevel,
    },
    stats: {
      eventsAttended: registrationCount,
      gigsDone: 0,
      connections: Math.max(profile.interests?.length ?? 0, 0),
    },
    hostStats: {
      totalRsvps: hostTotalRegistrations,
      activeGigs: 0,
      pendingApprovals: 0,
      totalEventsCreated: hostEventCount,
    },
    upcomingEventsPreview,
    tribes: await Promise.all(
      userTribes.map(async (ut) => {
        const signedTribe = await uploadService.attachSignedUrlsToTribe(ut.tribe);
        return {
          id: signedTribe?.id,
          name: signedTribe?.name,
          slug: signedTribe?.slug,
          members: (signedTribe as Record<string, unknown>)?.memberCount,
          emoji: (signedTribe as Record<string, unknown>)?.emoji,
          coverImagePath: (signedTribe as Record<string, unknown>)?.coverImagePath,
          coverImageUrl: (signedTribe as Record<string, unknown>)?.coverImageUrl,
        };
      })
    ),
    tribesPreview: await Promise.all(
      userTribes.map(async (ut) => {
        const signedTribe = await uploadService.attachSignedUrlsToTribe(ut.tribe);
        return {
          id: signedTribe?.id,
          name: signedTribe?.name,
          slug: signedTribe?.slug,
          members: (signedTribe as Record<string, unknown>)?.memberCount,
          emoji: (signedTribe as Record<string, unknown>)?.emoji,
          coverImagePath: (signedTribe as Record<string, unknown>)?.coverImagePath,
          coverImageUrl: (signedTribe as Record<string, unknown>)?.coverImageUrl,
        };
      })
    ),
    hostModeCard: {
      title: user.role === "HOST" || user.role === "ADMIN" ? "Host Tools Ready" : "Become a Host",
      subtitle:
        user.role === "HOST" || user.role === "ADMIN"
          ? "Switch to HOST mode to manage your tribe community"
          : "Create events and earn while building your community",
      cta: user.role === "HOST" || user.role === "ADMIN" ? "Open Host Mode" : "Become Host",
      enabled: user.role === "HOST" || user.role === "ADMIN",
    },
    hostCtaUnlocked: user.role === "HOST" || user.role === "ADMIN",
  };
}

export { getDashboard };
