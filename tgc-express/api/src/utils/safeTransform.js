function safeUser(user) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    role: user.role,
  };
}

function safeProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    intent: profile.intent,
    avatarPath: profile.avatarPath || null,
    avatarUrl: profile.avatarUrl || null,
    username: profile.username,
    fullName: profile.fullName,
    city: profile.city,
    bio: profile.bio,
    interests: profile.interests,
    skills: profile.skills,
    activeMode: profile.activeMode,
    onboardingStep: profile.onboardingStep,
    isOnboarded: profile.isOnboarded,
    karmaPoints: profile.karmaPoints,
  };
}

function safeTribe(tribe) {
  if (!tribe) return null;
  return {
    id: tribe.id,
    name: tribe.name,
    slug: tribe.slug,
    description: tribe.description,
    coverImagePath: tribe.coverImagePath || null,
    coverImageUrl: tribe.coverImageUrl || null,
    category: tribe.category,
    visibility: tribe.visibility,
    memberCount: tribe.memberCount,
    createdAt: tribe.createdAt,
  };
}

function safeTribeWithMembership(tribe, userId) {
  const base = safeTribe(tribe);
  if (!base) return null;
  const membership = tribe.members?.find((m) => m.userId === userId);
  return {
    ...base,
    isJoined: !!membership,
    memberRole: membership?.role || null,
  };
}

module.exports = { safeUser, safeProfile, safeTribe, safeTribeWithMembership };
