const { nanoid } = require("nanoid");
const prisma = require("../../prisma/prisma");
const { safeEvent, safeEventWithUserState, safePass } = require("../../utils/safeTransform");
const uploadService = require("../uploads/upload.service");

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueEventSlug(title) {
  let base = slugify(title);
  if (!base || base.length < 2) base = "event";

  // try base first, then add random suffix
  let candidate = base;
  let existing = await prisma.event.findUnique({ where: { slug: candidate } });
  if (!existing) return candidate;

  // append short random suffix
  candidate = `${base}-${nanoid(6).toLowerCase()}`;
  return candidate;
}

// ─── Visibility check ─────────────────────────────────────────────────────────

async function canViewEvent(event, userId) {
  if (event.visibility === "PUBLIC") return true;

  if (event.createdById === userId) return true;
  const isCollab = event.collaborators?.some((c) => c.userId === userId);
  if (isCollab) return true;

  if (event.visibility === "TRIBE_ONLY" && event.tribeId) {
    const membership = await prisma.userTribe.findUnique({
      where: { userId_tribeId: { userId, tribeId: event.tribeId } },
    });
    return !!membership;
  }

  return false;
}

function looksLikeHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

async function attachSignedEventCover(event) {
  if (!event) return event;
  if (!event.coverImageUrl || looksLikeHttpUrl(event.coverImageUrl)) {
    return event;
  }

  const signed = await uploadService.maybeCreateSignedViewUrl(event.coverImageUrl);
  return {
    ...event,
    coverImageUrl: signed || null,
  };
}

async function attachSignedEventCovers(events) {
  return Promise.all((events || []).map(attachSignedEventCover));
}

function assertValidEventCoverPathIfStoragePath(userId, coverImageUrl) {
  if (!coverImageUrl || looksLikeHttpUrl(coverImageUrl)) return;
  uploadService.assertStoragePathMatchesPurpose({
    pathValue: coverImageUrl,
    purpose: "event-cover",
    userId,
  });
}

// ─── Service functions ────────────────────────────────────────────────────────

async function createEvent(userId, data) {
  // Validate startAt is in the future (allow 5 min buffer)
  const start = new Date(data.startAt);
  if (start < new Date(Date.now() - 5 * 60 * 1000)) {
    const err = new Error("startAt must be in the future");
    err.statusCode = 400;
    throw err;
  }

  if (data.endAt) {
    const end = new Date(data.endAt);
    if (end <= start) {
      const err = new Error("endAt must be after startAt");
      err.statusCode = 400;
      throw err;
    }
  }

  // If tribeId provided, check membership
  if (data.tribeId) {
    const membership = await prisma.userTribe.findUnique({
      where: { userId_tribeId: { userId, tribeId: data.tribeId } },
    });
    if (!membership) {
      const err = new Error("You must be a member of the tribe to create a tribe event");
      err.statusCode = 403;
      throw err;
    }
  }

  assertValidEventCoverPathIfStoragePath(userId, data.coverImageUrl);

  const slug = await generateUniqueEventSlug(data.title);

  const event = await prisma.$transaction(async (tx) => {
    const newEvent = await tx.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description || null,
        category: data.category || "OTHER",
        city: data.city,
        venueName: data.venueName || null,
        addressText: data.addressText || null,
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        coverImageUrl: data.coverImageUrl || null,
        visibility: data.visibility || "PUBLIC",
        capacity: data.capacity || null,
        tribeId: data.tribeId || null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, profile: { select: { fullName: true, username: true, avatarPath: true } } } },
        tribe: { select: { id: true, name: true, slug: true } },
        collaborators: true,
      },
    });

    // Karma +10 for creating an event
    await tx.profile.update({
      where: { userId },
      data: { karmaPoints: { increment: 10 } },
    });

    return newEvent;
  });

  const signedEvent = await attachSignedEventCover(event);
  return { event: safeEvent(signedEvent) };
}

async function listEvents(userId, filters) {
  const { search, category, city, tribeId, dateFilter = "all", page = 1, limit = 20 } = filters;

  const now = new Date();
  let dateWhere = { startAt: { gte: now } };

  if (dateFilter === "today") {
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    dateWhere = { startAt: { gte: now, lte: todayEnd } };
  } else if (dateFilter === "weekend") {
    const day = now.getDay();
    const daysToFriday = day <= 5 ? 5 - day : 0;
    const friday = new Date(now);
    friday.setDate(now.getDate() + daysToFriday);
    friday.setHours(0, 0, 0, 0);
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);
    const start = day > 5 ? now : friday;
    dateWhere = { startAt: { gte: start, lte: sunday } };
  } else if (dateFilter === "week") {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    dateWhere = { startAt: { gte: now, lte: weekEnd } };
  }

  const where = {
    isDeleted: false,
    ...dateWhere,
    ...(category && { category }),
    ...(city && { city: { contains: city, mode: "insensitive" } }),
    ...(tribeId && { tribeId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { venueName: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        createdBy: { select: { id: true, profile: { select: { fullName: true, username: true, avatarPath: true } } } },
        tribe: { select: { id: true, name: true, slug: true } },
        collaborators: { select: { userId: true } },
        registrations: { where: { userId }, select: { userId: true, passCode: true, status: true } },
      },
      orderBy: { startAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  // Filter by visibility
  const visible = [];
  for (const e of events) {
    const ok = await canViewEvent(e, userId);
    if (ok) visible.push(e);
  }

  const signedVisible = await attachSignedEventCovers(visible);

  return {
    events: signedVisible.map((e) => safeEventWithUserState(e, userId)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getEventBySlug(userId, slug) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { id: true, profile: { select: { fullName: true, username: true, avatarPath: true } } } },
      tribe: { select: { id: true, name: true, slug: true } },
      collaborators: { select: { userId: true, role: true } },
      registrations: { where: { userId }, select: { userId: true, passCode: true, status: true } },
    },
  });

  if (!event || event.isDeleted) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  const visible = await canViewEvent(event, userId);
  if (!visible) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  const signedEvent = await attachSignedEventCover(event);
  return { event: safeEventWithUserState(signedEvent, userId) };
}

async function registerForEvent(userId, eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      collaborators: { select: { userId: true } },
      registrations: { where: { userId }, select: { userId: true } },
    },
  });

  if (!event || event.isDeleted) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  const visible = await canViewEvent(event, userId);
  if (!visible) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  if (event.registrations.length > 0) {
    const err = new Error("Already registered for this event");
    err.statusCode = 409;
    throw err;
  }

  if (event.capacity != null && event.registrationCount >= event.capacity) {
    const err = new Error("Event is full");
    err.statusCode = 409;
    throw err;
  }

  const passCode = `TGC-${nanoid(8).toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    const registration = await tx.eventRegistration.create({
      data: { eventId, userId, passCode },
      include: { event: { select: { id: true, title: true, slug: true, startAt: true, city: true } } },
    });

    await tx.event.update({
      where: { id: eventId },
      data: { registrationCount: { increment: 1 } },
    });

    await tx.profile.update({
      where: { userId },
      data: { karmaPoints: { increment: 5 } },
    });

    return registration;
  });

  return { registration: safePass(result) };
}

async function unregisterFromEvent(userId, eventId) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (!registration) {
    const err = new Error("Not registered for this event");
    err.statusCode = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventRegistration.delete({
      where: { eventId_userId: { eventId, userId } },
    });
    await tx.event.update({
      where: { id: eventId },
      data: { registrationCount: { decrement: 1 } },
    });
  });

  return { message: "Unregistered successfully" };
}

async function getMyEvents(userId) {
  const [createdEvents, registrations] = await Promise.all([
    prisma.event.findMany({
      where: { createdById: userId, isDeleted: false },
      include: {
        tribe: { select: { id: true, name: true, slug: true } },
        collaborators: { select: { userId: true } },
        registrations: { where: { userId }, select: { userId: true, passCode: true, status: true } },
        createdBy: { select: { id: true, profile: { select: { fullName: true, username: true, avatarPath: true } } } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.eventRegistration.findMany({
      where: { userId, event: { isDeleted: false } },
      include: {
        event: {
          include: {
            createdBy: { select: { id: true, profile: { select: { fullName: true, username: true, avatarPath: true } } } },
            tribe: { select: { id: true, name: true, slug: true } },
            collaborators: { select: { userId: true } },
            registrations: { where: { userId }, select: { userId: true, passCode: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    created: (await attachSignedEventCovers(createdEvents)).map((e) =>
      safeEventWithUserState(e, userId)
    ),
    registered: await Promise.all(
      registrations.map(async (r) => ({
        ...safePass(r),
        event: safeEventWithUserState(await attachSignedEventCover(r.event), userId),
      }))
    ),
  };
}

async function updateEvent(userId, eventId, data) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { collaborators: { select: { userId: true } } },
  });

  if (!event || event.isDeleted) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  const isCreator = event.createdById === userId;
  const isCollab = event.collaborators.some((c) => c.userId === userId);
  if (!isCreator && !isCollab) {
    const err = new Error("Forbidden: not event creator or collaborator");
    err.statusCode = 403;
    throw err;
  }

  if (data.startAt && data.endAt) {
    if (new Date(data.endAt) <= new Date(data.startAt)) {
      const err = new Error("endAt must be after startAt");
      err.statusCode = 400;
      throw err;
    }
  }

  if ("coverImageUrl" in data && data.coverImageUrl) {
    assertValidEventCoverPathIfStoragePath(userId, data.coverImageUrl);
  }

  const patch = {};
  const fields = ["title", "description", "category", "city", "venueName", "addressText", "coverImageUrl", "visibility", "tribeId", "capacity"];
  for (const f of fields) {
    if (f in data) patch[f] = data[f];
  }
  if (data.startAt) patch.startAt = new Date(data.startAt);
  if (data.endAt !== undefined) patch.endAt = data.endAt ? new Date(data.endAt) : null;

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: patch,
    include: {
      createdBy: { select: { id: true, profile: { select: { fullName: true, username: true, avatarPath: true } } } },
      tribe: { select: { id: true, name: true, slug: true } },
      collaborators: { select: { userId: true } },
      registrations: { where: { userId }, select: { userId: true, passCode: true, status: true } },
    },
  });

  const signedUpdated = await attachSignedEventCover(updated);
  return { event: safeEventWithUserState(signedUpdated, userId) };
}

async function deleteEvent(userId, eventId, userRole) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });

  if (!event || event.isDeleted) {
    const err = new Error("Event not found");
    err.statusCode = 404;
    throw err;
  }

  const isCreator = event.createdById === userId;
  const isAdmin = userRole === "ADMIN";
  if (!isCreator && !isAdmin) {
    const err = new Error("Forbidden: only the creator or an admin can delete this event");
    err.statusCode = 403;
    throw err;
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { isDeleted: true, deletedAt: new Date(), deletedById: userId },
  });

  return { message: "Event deleted" };
}

async function getUpcomingEventsPreview(userId, city) {
  const now = new Date();

  // Fetch user's tribes
  const userTribes = await prisma.userTribe.findMany({
    where: { userId },
    select: { tribeId: true },
  });
  const tribeIds = userTribes.map((ut) => ut.tribeId);

  const orClauses = [{ visibility: "PUBLIC" }];
  if (tribeIds.length) {
    orClauses.push({ visibility: "TRIBE_ONLY", tribeId: { in: tribeIds } });
  }
  orClauses.push({ createdById: userId });

  const where = {
    isDeleted: false,
    startAt: { gte: now },
    OR: orClauses,
    ...(city && { city: { contains: city, mode: "insensitive" } }),
  };

  const events = await prisma.event.findMany({
    where,
    include: {
      tribe: { select: { id: true, name: true, slug: true } },
      registrations: { where: { userId }, select: { userId: true, passCode: true, status: true } },
      createdBy: { select: { id: true, profile: { select: { fullName: true, username: true } } } },
      collaborators: { select: { userId: true } },
    },
    orderBy: { startAt: "asc" },
    take: 3,
  });

  return (await attachSignedEventCovers(events)).map((e) => safeEventWithUserState(e, userId));
}

module.exports = {
  createEvent,
  listEvents,
  getEventBySlug,
  registerForEvent,
  unregisterFromEvent,
  getMyEvents,
  updateEvent,
  deleteEvent,
  getUpcomingEventsPreview,
};
