import prisma from "../../prisma/prisma";
import * as uploadService from "../uploads/upload.service";

interface TribePostData {
  content: string;
  imagePath?: string;
}

interface TribePostRecord {
  id: string;
  tribeId: string;
  userId: string;
  content: string;
  imagePath?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
  user?: {
    profile?: {
      username?: string | null;
      fullName?: string | null;
      avatarPath?: string | null;
    } | null;
  } | null;
  author?: {
    username?: string | null;
    fullName?: string | null;
    avatarPath?: string | null;
    avatarUrl?: string | null;
  } | null;
  [key: string]: unknown;
}

async function toTribePostResponse(post: TribePostRecord): Promise<object> {
  const signed = (await uploadService.attachSignedUrlsToTribePost(post))!;
  return {
    id: signed.id,
    tribeId: signed.tribeId,
    userId: signed.userId,
    content: signed.content,
    imagePath: signed.imagePath,
    imageUrl: signed.imageUrl,
    createdAt: signed.createdAt,
    author: {
      username: (signed.author as Record<string, unknown>)?.username ?? null,
      fullName: (signed.author as Record<string, unknown>)?.fullName ?? null,
      avatarPath: (signed.author as Record<string, unknown>)?.avatarPath ?? null,
      avatarUrl: (signed.author as Record<string, unknown>)?.avatarUrl ?? null,
    },
  };
}

async function ensureMember(tribeId: string, userId: string): Promise<void> {
  const tribe = await prisma.tribe.findUnique({
    where: { id: tribeId },
    select: { id: true },
  });

  if (!tribe) {
    throw Object.assign(new Error("Tribe not found"), { statusCode: 404 });
  }

  const membership = await prisma.userTribe.findUnique({
    where: { userId_tribeId: { userId, tribeId } },
    select: { id: true },
  });

  if (!membership) {
    throw Object.assign(new Error("Join this tribe to access posts"), { statusCode: 403 });
  }
}

async function listTribePosts(tribeId: string, userId: string): Promise<object> {
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

  return { posts: await Promise.all(posts.map((p) => toTribePostResponse(p as unknown as TribePostRecord))) };
}

async function createTribePost(tribeId: string, userId: string, data: TribePostData): Promise<object> {
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
      imagePath: data.imagePath ?? null,
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

  return { post: await toTribePostResponse(post as unknown as TribePostRecord) };
}

export { listTribePosts, createTribePost };
