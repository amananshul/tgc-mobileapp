const prisma = require("../../prisma/prisma");
const { safeUser, safeProfile } = require("../../utils/safeTransform");

function getCompleteness(user, profile) {
  const checks = [
    !!profile.intent,
    !!profile.username,
    !!profile.fullName,
    !!profile.city,
    !!profile.bio,
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

  // Compute karma level from real points
  const karmaLevel = Math.floor(profile.karmaPoints / 100) + 1;

  return {
    user: safeUser(user),
    profile: safeProfile(profile),
    mode: profile.activeMode,
    profileCompleteness: completeness,
    welcome: {
      title: `Hi, ${displayName} 👋`,
      subtitle: dashboardSubtitle,
    },
    onboarding: {
      onboardingStep: profile.onboardingStep,
      isOnboarded: profile.isOnboarded,
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
        done: false,
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
        ctaRoute: null,
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
      eventsAttended: 0,
      gigsDone: 0,
      connections: Math.max(profile.interests?.length || 0, 0),
    },
    hostStats: {
      totalRsvps: 0,
      activeGigs: 0,
      pendingApprovals: 0,
    },
    tribes: userTribes.map((ut) => ({
      id: ut.tribe.id,
      name: ut.tribe.name,
      slug: ut.tribe.slug,
      members: ut.tribe.memberCount,
      emoji: ut.tribe.emoji,
    })),
    tribesPreview: userTribes.map((ut) => ({
      id: ut.tribe.id,
      name: ut.tribe.name,
      slug: ut.tribe.slug,
      members: ut.tribe.memberCount,
      emoji: ut.tribe.emoji,
    })),
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
