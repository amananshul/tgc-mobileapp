import { Prisma } from "@prisma/client";
import prisma from "../../prisma/prisma";
import { safeTribe, safeTribeWithMembership } from "../../utils/safeTransform";
import * as uploadService from "../uploads/upload.service";

interface CreateTribeInput {
  name: string;
  description?: string;
  coverImagePath?: string;
  category?: string;
  visibility?: string;
}

interface ListTribesFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

interface UpdateTribeInput {
  coverImagePath?: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = slugify(baseName);
  if (!slug || slug.length < 2) {
    slug = "tribe-" + Date.now();
  }

  let finalSlug = slug;
  let counter = 2;

  // eslint-disable-next-line no-constant-condition
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

async function createTribe(userId: string, data: CreateTribeInput): Promise<object> {
  const slug = await generateUniqueSlug(data.name);

  const tribe = await prisma.$transaction(async (tx) => {
    const newTribe = await tx.tribe.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        coverImagePath: data.coverImagePath ?? null,
        category: data.category ?? "general",
        visibility: (data.visibility ?? "PUBLIC") as Parameters<typeof tx.tribe.create>[0]["data"]["visibility"],
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

async function listTribes(userId: string, { search, category, page = 1, limit = 20 }: ListTribesFilters): Promise<object> {
  const where: Record<string, unknown> = {
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
      where: where as Prisma.TribeWhereInput,
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
    prisma.tribe.count({ where: where as Prisma.TribeWhereInput }),
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

async function getTribeBySlug(slug: string, userId: string): Promise<object> {
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
    throw Object.assign(new Error("Tribe not found"), { statusCode: 404 });
  }

  const signedTribe = await uploadService.attachSignedUrlsToTribe(tribe);
  return { tribe: safeTribeWithMembership(signedTribe, userId) };
}

async function joinTribe(userId: string, tribeId: string): Promise<object> {
  const tribe = await prisma.tribe.findUnique({ where: { id: tribeId } });
  if (!tribe) {
    throw Object.assign(new Error("Tribe not found"), { statusCode: 404 });
  }

  const existing = await prisma.userTribe.findUnique({
    where: { userId_tribeId: { userId, tribeId } },
  });
  if (existing) {
    throw Object.assign(new Error("Already a member of this tribe"), { statusCode: 409 });
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

async function leaveTribe(userId: string, tribeId: string): Promise<object> {
  const membership = await prisma.userTribe.findUnique({
    where: { userId_tribeId: { userId, tribeId } },
  });
  if (!membership) {
    throw Object.assign(new Error("Not a member of this tribe"), { statusCode: 404 });
  }
  if (membership.role === "OWNER") {
    throw Object.assign(
      new Error("Owners cannot leave their tribe. Transfer ownership first."),
      { statusCode: 400 }
    );
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

async function getMyTribes(userId: string): Promise<object> {
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
          ...safeTribe(signedTribe) as object,
          memberRole: m.role,
          joinedAt: m.joinedAt,
        };
      })
    ),
  };
}

async function updateTribe(userId: string, tribeId: string, data: UpdateTribeInput): Promise<object> {
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
    throw Object.assign(new Error("Tribe not found"), { statusCode: 404 });
  }

  const isAppPrivileged = user && ["HOST", "ADMIN"].includes(user.role);
  const isTribePrivileged = membership && ["OWNER", "MODERATOR"].includes(membership.role);
  if (!isAppPrivileged && !isTribePrivileged) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const patch: Record<string, unknown> = {};
  if ("coverImagePath" in data) {
    uploadService.assertStoragePathMatchesPurpose({
      pathValue: data.coverImagePath,
      purpose: "tribe-cover",
      tribeId,
    });
    patch.coverImagePath = data.coverImagePath ?? null;
  }

  const updated = await prisma.tribe.update({
    where: { id: tribeId },
    data: patch as Parameters<typeof prisma.tribe.update>[0]["data"],
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

export { createTribe, listTribes, getTribeBySlug, joinTribe, leaveTribe, getMyTribes, updateTribe };
