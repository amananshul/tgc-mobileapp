const prisma = require("../../prisma/prisma");
const uploadService = require("../uploads/upload.service");

async function toTribePostResponse(post) {
  const signed = await uploadService.attachSignedUrlsToTribePost(post);
  return {
    id: signed.id,
    tribeId: signed.tribeId,
    userId: signed.userId,
    content: signed.content,
    imagePath: signed.imagePath,
    imageUrl: signed.imageUrl,
    createdAt: signed.createdAt,
    author: {
      username: signed.author?.username || null,
      fullName: signed.author?.fullName || null,
      avatarPath: signed.author?.avatarPath || null,
      avatarUrl: signed.author?.avatarUrl || null,
    },
  };
}

async function ensureMember(tribeId, userId) {
  const tribe = await prisma.tribe.findUnique({
    where: { id: tribeId },
    select: { id: true },
  });

  if (!tribe) {
    const err = new Error("Tribe not found");
    err.statusCode = 404;
    throw err;
  }

  const membership = await prisma.userTribe.findUnique({
    where: { userId_tribeId: { userId, tribeId } },
    select: { id: true },
  });

  if (!membership) {
    const err = new Error("Join this tribe to access posts");
    err.statusCode = 403;
    throw err;
  }
}

async function listTribePosts(tribeId, userId) {
  await ensureMember(tribeId, userId);

  const posts = await prisma.tribePost.findMany({
    where: { tribeId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          profile: {
            select: {
              username: true,
              fullName: true,
              avatarPath: true,
            },
          },
        },
      },
    },
  });

  return { posts: await Promise.all(posts.map(toTribePostResponse)) };
}

async function createTribePost(tribeId, userId, data) {
  await ensureMember(tribeId, userId);

  uploadService.assertStoragePathMatchesPurpose({
    pathValue: data.imagePath,
    purpose: "tribe-post",
    tribeId,
  });

  const post = await prisma.tribePost.create({
    data: {
      tribeId,
      userId,
      content: data.content,
      imagePath: data.imagePath || null,
    },
    include: {
      user: {
        select: {
          profile: {
            select: {
              username: true,
              fullName: true,
              avatarPath: true,
            },
          },
        },
      },
    },
  });

  return { post: await toTribePostResponse(post) };
}

module.exports = { listTribePosts, createTribePost };
