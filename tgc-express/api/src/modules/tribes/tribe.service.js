const prisma = require("../../prisma/prisma");
const {
  safeTribe,
  safeTribeWithMembership,
} = require("../../utils/safeTransform");

async function createTribe(userId, data) {
  const existing = await prisma.tribe.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    const err = new Error("A tribe with this slug already exists");
    err.statusCode = 409;
    throw err;
  }

  const tribe = await prisma.$transaction(async (tx) => {
    const newTribe = await tx.tribe.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        emoji: data.emoji || "🌟",
        category: data.category || "general",
        visibility: data.visibility || "PUBLIC",
        memberCount: 1,
        createdById: userId,
      },
    });

    await tx.userTribe.create({
      data: {
        userId,
        tribeId: newTribe.id,
        role: "OWNER",
      },
    });

    return newTribe;
  });

  return { tribe: safeTribe(tribe) };
}

async function listTribes(userId, { search, category, page = 1, limit = 20 }) {
  const where = {
    visibility: "PUBLIC",
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(category && category !== "all" && { category }),
  };

  const [tribes, total] = await Promise.all([
    prisma.tribe.findMany({
      where,
      include: {
        members: {
          where: { userId },
          select: { userId: true, role: true },
        },
      },
      orderBy: { memberCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tribe.count({ where }),
  ]);

  return {
    tribes: tribes.map((t) => safeTribeWithMembership(t, userId)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getTribeBySlug(slug, userId) {
  const tribe = await prisma.tribe.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId },
        select: { userId: true, role: true },
      },
    },
  });

  if (!tribe) {
    const err = new Error("Tribe not found");
    err.statusCode = 404;
    throw err;
  }

  return { tribe: safeTribeWithMembership(tribe, userId) };
}

async function joinTribe(userId, tribeId) {
  const tribe = await prisma.tribe.findUnique({ where: { id: tribeId } });
  if (!tribe) {
    const err = new Error("Tribe not found");
    err.statusCode = 404;
    throw err;
  }

  const existing = await prisma.userTribe.findUnique({
    where: { userId_tribeId: { userId, tribeId } },
  });
  if (existing) {
    const err = new Error("Already a member of this tribe");
    err.statusCode = 409;
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.userTribe.create({
      data: { userId, tribeId, role: "MEMBER" },
    });

    const updatedTribe = await tx.tribe.update({
      where: { id: tribeId },
      data: { memberCount: { increment: 1 } },
    });

    const updatedProfile = await tx.profile.update({
      where: { userId },
      data: { karmaPoints: { increment: 20 } },
    });

    return { tribe: updatedTribe, karmaPoints: updatedProfile.karmaPoints };
  });

  return {
    message: "Joined tribe successfully",
    tribe: safeTribe(result.tribe),
    karmaPoints: result.karmaPoints,
  };
}

async function leaveTribe(userId, tribeId) {
  const membership = await prisma.userTribe.findUnique({
    where: { userId_tribeId: { userId, tribeId } },
  });
  if (!membership) {
    const err = new Error("Not a member of this tribe");
    err.statusCode = 404;
    throw err;
  }
  if (membership.role === "OWNER") {
    const err = new Error(
      "Owners cannot leave their tribe. Transfer ownership first."
    );
    err.statusCode = 400;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.userTribe.delete({
      where: { userId_tribeId: { userId, tribeId } },
    });
    await tx.tribe.update({
      where: { id: tribeId },
      data: { memberCount: { decrement: 1 } },
    });
  });

  return { message: "Left tribe successfully" };
}

async function getMyTribes(userId) {
  const memberships = await prisma.userTribe.findMany({
    where: { userId },
    include: { tribe: true },
    orderBy: { joinedAt: "desc" },
  });

  return {
    tribes: memberships.map((m) => ({
      ...safeTribe(m.tribe),
      memberRole: m.role,
      joinedAt: m.joinedAt,
    })),
  };
}

module.exports = {
  createTribe,
  listTribes,
  getTribeBySlug,
  joinTribe,
  leaveTribe,
  getMyTribes,
};
