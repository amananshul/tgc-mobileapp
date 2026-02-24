const prisma = require("../../prisma/prisma");

function toTribePostResponse(post) {
  return {
    id: post.id,
    tribeId: post.tribeId,
    userId: post.userId,
    content: post.content,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    author: {
      username: post.user?.profile?.username || null,
      fullName: post.user?.profile?.fullName || null,
      avatarUrl: post.user?.profile?.avatarUrl || null,
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
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return { posts: posts.map(toTribePostResponse) };
}

async function createTribePost(tribeId, userId, data) {
  await ensureMember(tribeId, userId);

  const post = await prisma.tribePost.create({
    data: {
      tribeId,
      userId,
      content: data.content,
      imageUrl: data.imageUrl || null,
    },
    include: {
      user: {
        select: {
          profile: {
            select: {
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return { post: toTribePostResponse(post) };
}

module.exports = { listTribePosts, createTribePost };
