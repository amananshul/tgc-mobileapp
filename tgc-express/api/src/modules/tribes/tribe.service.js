const prisma = require("../../prisma/prisma");
const {
  safeTribe,
  safeTribeWithMembership,
} = require("../../utils/safeTransform");
const uploadService = require("../uploads/upload.service");

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(baseName) {
  let slug = slugify(baseName);
  if (!slug || slug.length < 2) {
    slug = "tribe-" + Date.now();
  }

  let finalSlug = slug;
  let counter = 2;

  while (true) {
    const existing = await prisma.tribe.findUnique({
      where: { slug: finalSlug },
    });
    if (!existing) break;
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  return finalSlug;
}

async function createTribe(userId, data) {
  const slug = await generateUniqueSlug(data.name);

  const tribe = await prisma.$transaction(async (tx) => {
    const newTribe = await tx.tribe.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        coverImagePath: data.coverImagePath || null,
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

  const signedTribe = await uploadService.attachSignedUrlsToTribe(tribe);
  return { tribe: safeTribe(signedTribe) };
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

  const signedTribes = await uploadService.attachSignedUrlsToTribes(tribes);

  return {
    tribes: signedTribes.map((t) => safeTribeWithMembership(t, userId)),
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

  const signedTribe = await uploadService.attachSignedUrlsToTribe(tribe);
  return { tribe: safeTribeWithMembership(signedTribe, userId) };
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

  const signedTribe = await uploadService.attachSignedUrlsToTribe(result.tribe);

  return {
    message: "Joined tribe successfully",
    tribe: safeTribe(signedTribe),
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
    tribes: await Promise.all(
      memberships.map(async (m) => {
        const signedTribe = await uploadService.attachSignedUrlsToTribe(m.tribe);
        return {
          ...safeTribe(signedTribe),
          memberRole: m.role,
          joinedAt: m.joinedAt,
        };
      })
    ),
  };
}

async function updateTribe(userId, tribeId, data) {
  const [user, membership, tribe] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
    prisma.userTribe.findUnique({
      where: { userId_tribeId: { userId, tribeId } },
      select: { role: true },
    }),
    prisma.tribe.findUnique({
      where: { id: tribeId },
    }),
  ]);

  if (!tribe) {
    const err = new Error("Tribe not found");
    err.statusCode = 404;
    throw err;
  }

  const isAppPrivileged = user && ["HOST", "ADMIN"].includes(user.role);
  const isTribePrivileged = membership && ["OWNER", "MODERATOR"].includes(membership.role);
  if (!isAppPrivileged && !isTribePrivileged) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  const patch = {};
  if ("coverImagePath" in data) {
    uploadService.assertStoragePathMatchesPurpose({
      pathValue: data.coverImagePath,
      purpose: "tribe-cover",
      tribeId,
    });
    patch.coverImagePath = data.coverImagePath || null;
  }

  const updated = await prisma.tribe.update({
    where: { id: tribeId },
    data: patch,
    include: {
      members: {
        where: { userId },
        select: { userId: true, role: true },
      },
    },
  });

  const signedTribe = await uploadService.attachSignedUrlsToTribe(updated);
  return { tribe: safeTribeWithMembership(signedTribe, userId) };
}

module.exports = {
  createTribe,
  listTribes,
  getTribeBySlug,
  joinTribe,
  leaveTribe,
  getMyTribes,
  updateTribe,
};
