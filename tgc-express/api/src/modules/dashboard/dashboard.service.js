const prisma = require("../../prisma/prisma");
const { safeUser, safeProfile } = require("../../utils/safeTransform");
const uploadService = require("../uploads/upload.service");
const { getUpcomingEventsPreview } = require("../events/events.service");

function getCompleteness(user, profile) {
  const checks = [
    (profile.growthIntent?.length || 0) > 0 || !!profile.intent,
    !!profile.username,
    !!profile.fullName,
    !!profile.city,
    !!(profile.shortBio || profile.bio),
    profile.interests?.length > 0,
    profile.skills?.length > 0,
    !!user.phoneVerified,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function getDashboard(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const profile = user.profile;
  const signedProfile = await uploadService.attachSignedUrlsToProfile(profile);
  const completeness = getCompleteness(user, profile);
  const isHostMode = profile.activeMode === "HOST";
  const displayName =
    profile.fullName ||
    profile.username ||
    user.email?.split("@")[0] ||
    "Community Builder";

  const profileTitle = isHostMode ? "Host Profile" : "Community Profile";
  const dashboardSubtitle = isHostMode
    ? "Manage events, gigs, and approvals"
    : "Let's make today productive";

  // Fetch user's joined tribes (top 3 for dashboard)
  const userTribes = await prisma.userTribe.findMany({
    where: { userId },
    include: { tribe: true },
    orderBy: { joinedAt: "desc" },
    take: 3,
  });

  const hasJoinedTribe = userTribes.length > 0;

  // Fetch registered events count for "attend_event" action
  const registrationCount = await prisma.eventRegistration.count({ where: { userId } });
  const hasRegisteredEvent = registrationCount > 0;

  // Upcoming events preview (next 3 based on tribe/city)
  const upcomingEventsPreview = await getUpcomingEventsPreview(userId, profile.city);

  // Host stats
  const hostEventCount = await prisma.event.count({
    where: { createdById: userId, isDeleted: false },
  });
  const hostTotalRegistrations = await prisma.eventRegistration.count({
    where: { event: { createdById: userId, isDeleted: false } },
  });

  // Compute karma level from real points
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
        done: profile.skills?.length > 0,
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
      connections: Math.max(profile.interests?.length || 0, 0),
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
          id: signedTribe.id,
          name: signedTribe.name,
          slug: signedTribe.slug,
          members: signedTribe.memberCount,
          emoji: signedTribe.emoji,
          coverImagePath: signedTribe.coverImagePath,
          coverImageUrl: signedTribe.coverImageUrl,
        };
      })
    ),
    tribesPreview: await Promise.all(
      userTribes.map(async (ut) => {
        const signedTribe = await uploadService.attachSignedUrlsToTribe(ut.tribe);
        return {
          id: signedTribe.id,
          name: signedTribe.name,
          slug: signedTribe.slug,
          members: signedTribe.memberCount,
          emoji: signedTribe.emoji,
          coverImagePath: signedTribe.coverImagePath,
          coverImageUrl: signedTribe.coverImageUrl,
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

module.exports = { getDashboard };
