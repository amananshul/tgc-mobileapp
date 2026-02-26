function safeUser(user) {
  return {
    id: user.id,
    email: user.email || null,
    supabaseId: user.supabaseId || null,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    role: user.role,
    onboardingCompleted: Boolean(user.onboardingCompleted),
  };
}

function safeProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    intent: profile.intent,
    growthIntent: Array.isArray(profile.growthIntent) ? profile.growthIntent : [],
    avatarPath: profile.avatarPath || null,
    avatarUrl: profile.avatarUrl || null,
    username: profile.username,
    fullName: profile.fullName,
    city: profile.city,
    bio: profile.bio,
    shortBio: profile.shortBio || profile.bio || null,
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

function safeEventCreator(user) {
  if (!user) return null;
  const p = user.profile;
  return {
    id: user.id,
    fullName: p?.fullName || null,
    username: p?.username || null,
    avatarPath: p?.avatarPath || null,
  };
}

function safeEvent(e) {
  if (!e) return null;
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description || null,
    category: e.category,
    city: e.city,
    venueName: e.venueName || null,
    addressText: e.addressText || null,
    startAt: e.startAt,
    endAt: e.endAt || null,
    coverImageUrl: e.coverImageUrl || null,
    visibility: e.visibility,
    capacity: e.capacity || null,
    registrationCount: e.registrationCount,
    tribe: e.tribe
      ? { id: e.tribe.id, name: e.tribe.name, slug: e.tribe.slug }
      : null,
    createdBy: safeEventCreator(e.createdBy),
    createdAt: e.createdAt,
  };
}

function safeEventWithUserState(e, userId) {
  const base = safeEvent(e);
  if (!base) return null;
  const myReg = e.registrations?.find((r) => r.userId === userId);
  return {
    ...base,
    isRegistered: !!myReg,
    myPassCode: myReg?.passCode || null,
  };
}

function safePass(reg) {
  if (!reg) return null;
  return {
    id: reg.id,
    passCode: reg.passCode,
    status: reg.status,
    createdAt: reg.createdAt,
    event: reg.event
      ? {
          id: reg.event.id,
          title: reg.event.title,
          slug: reg.event.slug,
          startAt: reg.event.startAt,
          city: reg.event.city,
        }
      : null,
  };
}

module.exports = {
  safeUser,
  safeProfile,
  safeTribe,
  safeTribeWithMembership,
  safeEvent,
  safeEventWithUserState,
  safePass,
};
