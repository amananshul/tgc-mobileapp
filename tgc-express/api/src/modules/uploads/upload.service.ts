import path from "path";
import { randomUUID } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import prisma from "../../prisma/prisma";
import env from "../../config/env";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const DEFAULT_UPLOAD_URL_EXPIRES_SEC = 300;
const DEFAULT_VIEW_URL_EXPIRES_SEC = 86400;

let supabaseClient: SupabaseClient | undefined;

function appError(message: string, statusCode = 500): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

function requireSupabaseConfig(): void {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey || !env.supabaseMediaBucket) {
    throw appError("Supabase storage is not configured", 500);
  }
}

function getSupabaseClient(): SupabaseClient {
  requireSupabaseConfig();
  if (!supabaseClient) {
    supabaseClient = createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabaseClient;
}

function normalizeSignedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = (env.supabaseUrl ?? "").replace(/\/+$/, "");
  if (!base) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function sanitizeFileName(originalFileName: unknown): string {
  const parsedName = path.basename(String(originalFileName ?? "file"));
  const cleaned = parsedName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "image";
}

function assertAllowedMimeType(mimeType: string): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw appError(
      `Unsupported mimeType. Allowed: ${Array.from(ALLOWED_IMAGE_MIME_TYPES).join(", ")}`,
      400
    );
  }
}

interface BuildStoragePathOptions {
  userId?: string;
  purpose: string;
  originalFileName: string;
  tribeId?: string;
}

function buildStoragePath({ userId, purpose, originalFileName, tribeId }: BuildStoragePathOptions): string {
  const fileName = sanitizeFileName(originalFileName);
  const objectName = `${randomUUID()}-${fileName}`;

  if (purpose === "profile") {
    if (!userId) throw appError("userId is required for profile upload path", 400);
    return `profile/${userId}/${objectName}`;
  }

  if (purpose === "event-cover") {
    if (!userId) throw appError("userId is required for event cover upload path", 400);
    return `event-cover/${userId}/${objectName}`;
  }

  if (!tribeId) {
    throw appError("tribeId is required for tribe uploads", 400);
  }

  if (purpose === "tribe-cover") {
    return `tribe-cover/${tribeId}/${objectName}`;
  }

  if (purpose === "tribe-post") {
    return `tribe-post/${tribeId}/${objectName}`;
  }

  throw appError("Invalid upload purpose", 400);
}

async function createSignedUploadUrl(
  pathValue: string,
  mimeType: string,
  expiresInSec = DEFAULT_UPLOAD_URL_EXPIRES_SEC
): Promise<{ uploadUrl: string; path: string }> {
  assertAllowedMimeType(mimeType);
  const storage = getSupabaseClient().storage.from(env.supabaseMediaBucket!);

  type UploadAttempt = () => Promise<unknown>;
  const attempts: UploadAttempt[] = [
    () => storage.createSignedUploadUrl(pathValue, { upsert: false, expiresIn: expiresInSec } as never),
    () => storage.createSignedUploadUrl(pathValue, { upsert: false } as never),
    () => storage.createSignedUploadUrl(pathValue as never, expiresInSec as never),
    () => storage.createSignedUploadUrl(pathValue as never),
  ];

  let response: unknown;
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const maybeResponse = await attempt() as Record<string, unknown> | null;
      if ((maybeResponse as { error?: unknown })?.error) {
        lastError = (maybeResponse as { error: unknown }).error;
        continue;
      }
      response = maybeResponse;
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!response && lastError) {
    throw appError((lastError as { message?: string })?.message ?? "Could not create signed upload URL", 500);
  }

  const resp = response as { error?: { message?: string }; data?: { signedUrl?: string; uploadUrl?: string; url?: string } } | null;
  if (resp?.error) {
    throw appError(resp.error.message ?? "Could not create signed upload URL", 500);
  }

  const signedUrl =
    resp?.data?.signedUrl ??
    resp?.data?.uploadUrl ??
    resp?.data?.url ??
    null;

  if (!signedUrl) {
    throw appError("Supabase did not return a signed upload URL", 500);
  }

  return {
    uploadUrl: normalizeSignedUrl(signedUrl)!,
    path: pathValue,
  };
}

async function createSignedViewUrl(
  pathValue: string,
  expiresInSec = DEFAULT_VIEW_URL_EXPIRES_SEC
): Promise<{ url: string }> {
  const storage = getSupabaseClient().storage.from(env.supabaseMediaBucket!);
  const { data, error } = await storage.createSignedUrl(pathValue, expiresInSec);
  if (error) {
    throw appError(error.message ?? "Could not create signed view URL", 500);
  }
  if (!data?.signedUrl) {
    throw appError("Supabase did not return a signed view URL", 500);
  }

  return { url: normalizeSignedUrl(data.signedUrl)! };
}

async function maybeCreateSignedViewUrl(
  pathValue: string | null | undefined,
  expiresInSec = DEFAULT_VIEW_URL_EXPIRES_SEC
): Promise<string | null> {
  if (!pathValue) return null;
  try {
    const { url } = await createSignedViewUrl(pathValue, expiresInSec);
    return url;
  } catch {
    return null;
  }
}

interface ExpectedPrefixOptions {
  purpose: string;
  userId?: string;
  tribeId?: string;
}

function expectedPrefixForPath({ purpose, userId, tribeId }: ExpectedPrefixOptions): string {
  if (purpose === "profile") return `profile/${userId}/`;
  if (purpose === "event-cover") return `event-cover/${userId}/`;
  if (purpose === "tribe-cover") return `tribe-cover/${tribeId}/`;
  if (purpose === "tribe-post") return `tribe-post/${tribeId}/`;
  throw appError("Invalid upload purpose", 400);
}

interface AssertStoragePathOptions {
  pathValue: unknown;
  purpose: string;
  userId?: string;
  tribeId?: string;
}

function assertStoragePathMatchesPurpose({ pathValue, purpose, userId, tribeId }: AssertStoragePathOptions): void {
  if (pathValue == null) return;
  const value = String(pathValue).trim();
  if (!value) return;
  const expectedPrefix = expectedPrefixForPath({ purpose, userId, tribeId });
  if (!value.startsWith(expectedPrefix)) {
    throw appError(`Invalid ${purpose} path`, 400);
  }
}

function parseStoragePath(pathValue: string): { purpose: string; entityId: string; path: string } | null {
  const value = String(pathValue ?? "").trim();
  if (!value) return null;
  const [purpose, entityId] = value.split("/", 3);
  if (!purpose || !entityId) return null;
  return { purpose, entityId, path: value };
}

async function ensureCanViewPath(pathValue: string, userId: string): Promise<void> {
  const parsed = parseStoragePath(pathValue);
  if (!parsed) {
    throw appError("Invalid storage path", 400);
  }

  if (parsed.purpose === "profile") {
    return;
  }

  if (parsed.purpose === "tribe-cover") {
    const tribe = await prisma.tribe.findUnique({
      where: { id: parsed.entityId },
      select: { id: true, visibility: true },
    });
    if (!tribe) throw appError("Tribe not found", 404);
    if (tribe.visibility === "PUBLIC") return;

    const membership = await prisma.userTribe.findUnique({
      where: { userId_tribeId: { userId, tribeId: parsed.entityId } },
      select: { id: true },
    });
    if (!membership) throw appError("Forbidden", 403);
    return;
  }

  if (parsed.purpose === "tribe-post") {
    const membership = await prisma.userTribe.findUnique({
      where: { userId_tribeId: { userId, tribeId: parsed.entityId } },
      select: { id: true },
    });
    if (!membership) throw appError("Forbidden", 403);
    return;
  }

  throw appError("Invalid storage path", 400);
}

interface PresignUploadOptions {
  userId: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  tribeId?: string;
  fileSize?: number;
}

async function presignUpload({ userId, purpose, fileName, mimeType, tribeId, fileSize }: PresignUploadOptions): Promise<{ uploadUrl: string; path: string }> {
  assertAllowedMimeType(mimeType);
  if (typeof fileSize === "number" && fileSize > MAX_UPLOAD_BYTES) {
    throw appError(`File is too large. Max size is ${MAX_UPLOAD_BYTES} bytes`, 400);
  }

  if (purpose === "event-cover") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || !["HOST", "ADMIN"].includes(user.role)) {
      throw appError("Forbidden", 403);
    }
  }

  if (purpose === "tribe-post" || purpose === "tribe-cover") {
    if (!tribeId) throw appError("tribeId is required for tribe uploads", 400);

    const [tribe, membership] = await Promise.all([
      prisma.tribe.findUnique({
        where: { id: tribeId },
        select: { id: true },
      }),
      prisma.userTribe.findUnique({
        where: { userId_tribeId: { userId, tribeId } },
        select: { role: true },
      }),
    ]);

    if (!tribe) throw appError("Tribe not found", 404);

    if (purpose === "tribe-post" && !membership) {
      throw appError("Join this tribe before uploading post media", 403);
    }

    if (purpose === "tribe-cover") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const isAppPrivileged = user && ["HOST", "ADMIN"].includes(user.role);
      const isTribePrivileged =
        membership && ["OWNER", "MODERATOR"].includes(membership.role);
      if (!isAppPrivileged && !isTribePrivileged) {
        throw appError("Forbidden", 403);
      }
    }
  }

  const pathValue = buildStoragePath({
    userId,
    purpose,
    originalFileName: fileName,
    tribeId,
  });

  return createSignedUploadUrl(pathValue, mimeType, DEFAULT_UPLOAD_URL_EXPIRES_SEC);
}

async function deleteStoragePath(pathValue: string | null | undefined): Promise<void> {
  if (!pathValue) return;
  try {
    const storage = getSupabaseClient().storage.from(env.supabaseMediaBucket!);
    await storage.remove([pathValue]);
  } catch {
    console.warn("[deleteStoragePath] Failed to delete old file:", pathValue);
  }
}

interface ProfileLike {
  avatarPath?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
}

async function attachSignedUrlsToProfile<T extends ProfileLike>(profile: T | null | undefined): Promise<(T & { avatarUrl: string | null }) | null> {
  if (!profile) return null;
  return {
    ...profile,
    avatarPath: profile.avatarPath ?? null,
    avatarUrl: await maybeCreateSignedViewUrl(profile.avatarPath ?? null),
  };
}

interface TribeLike {
  coverImagePath?: string | null;
  coverImageUrl?: string | null;
  [key: string]: unknown;
}

async function attachSignedUrlsToTribe<T extends TribeLike>(tribe: T | null | undefined): Promise<(T & { coverImageUrl: string | null }) | null> {
  if (!tribe) return null;
  return {
    ...tribe,
    coverImagePath: tribe.coverImagePath ?? null,
    coverImageUrl: await maybeCreateSignedViewUrl(tribe.coverImagePath ?? null),
  };
}

async function attachSignedUrlsToTribes<T extends TribeLike>(tribes: T[]): Promise<(T & { coverImageUrl: string | null })[]> {
  return Promise.all((tribes ?? []).map(attachSignedUrlsToTribe)) as Promise<(T & { coverImageUrl: string | null })[]>;
}

interface TribePostLike {
  id: string;
  tribeId: string;
  userId: string;
  content: string;
  imagePath?: string | null;
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

async function attachSignedUrlsToTribePost(post: TribePostLike | null | undefined): Promise<TribePostLike & { imageUrl: string | null; author: Record<string, unknown> } | null> {
  if (!post) return null;

  const authorAvatarPath = post.user?.profile?.avatarPath ?? post.author?.avatarPath ?? null;
  const [imageUrl, authorAvatarUrl] = await Promise.all([
    maybeCreateSignedViewUrl(post.imagePath ?? null),
    maybeCreateSignedViewUrl(authorAvatarPath),
  ]);

  const author: Record<string, unknown> = post.author
    ? {
        ...post.author,
        avatarPath: authorAvatarPath,
        avatarUrl: authorAvatarUrl,
      }
    : {
        username: post.user?.profile?.username ?? null,
        fullName: post.user?.profile?.fullName ?? null,
        avatarPath: authorAvatarPath,
        avatarUrl: authorAvatarUrl,
      };

  return {
    ...post,
    imagePath: post.imagePath ?? null,
    imageUrl,
    author,
  };
}

async function attachSignedUrlsToTribePosts(posts: TribePostLike[]): Promise<unknown[]> {
  return Promise.all((posts ?? []).map(attachSignedUrlsToTribePost));
}

export {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  DEFAULT_UPLOAD_URL_EXPIRES_SEC,
  DEFAULT_VIEW_URL_EXPIRES_SEC,
  buildStoragePath,
  createSignedUploadUrl,
  createSignedViewUrl,
  maybeCreateSignedViewUrl,
  assertStoragePathMatchesPurpose,
  ensureCanViewPath,
  presignUpload,
  deleteStoragePath,
  attachSignedUrlsToProfile,
  attachSignedUrlsToTribe,
  attachSignedUrlsToTribes,
  attachSignedUrlsToTribePost,
  attachSignedUrlsToTribePosts,
};
