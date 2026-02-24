const prisma = require("../../prisma/prisma");
const { safeUser, safeProfile } = require("../../utils/safeTransform");

function getProfileCompleteness(user, profile) {
  if (!profile) return 0;
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

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const profileCompleteness = getProfileCompleteness(user, user.profile);
  const karmaPoints = user.profile?.karmaPoints || 0;

  return {
    user: safeUser(user),
    profile: safeProfile(user.profile),
    summary: {
      role: user.role,
      username: user.profile?.username || null,
      avatarUrl: user.profile?.avatarUrl || null,
      karmaPoints,
      profileCompleteness,
      stats: {
        eventsAttended: 0,
        gigsDone: 0,
        connections: user.profile?.interests?.length || 0,
      },
    },
  };
}

module.exports = { getUserById };
