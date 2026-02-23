const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const profileService = require('../profile/profile.service');

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const AVATARS_DIR = path.join(UPLOADS_ROOT, 'avatars');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function ensureUploadDirs() {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

function extFromMime(mime) {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return null;
}

function parseDataUri(imageData) {
  const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    const err = new Error('Invalid image data format');
    err.statusCode = 400;
    throw err;
  }

  const mime = match[1];
  const ext = extFromMime(mime);
  if (!ext) {
    const err = new Error('Unsupported image format');
    err.statusCode = 400;
    throw err;
  }

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > MAX_IMAGE_BYTES) {
    const err = new Error('Image is too large. Maximum size is 5MB');
    err.statusCode = 400;
    throw err;
  }

  return { bytes, ext };
}

async function fetchImageFromUrl(sourceUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    const err = new Error('Invalid source URL');
    err.statusCode = 400;
    throw err;
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    const err = new Error('Only http/https URLs are supported');
    err.statusCode = 400;
    throw err;
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    const err = new Error('Could not fetch image from URL');
    err.statusCode = 400;
    throw err;
  }

  const mime = response.headers.get('content-type')?.split(';')[0] || '';
  const ext = extFromMime(mime);
  if (!ext) {
    const err = new Error('URL must point to a jpeg/png/webp/gif image');
    err.statusCode = 400;
    throw err;
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);
  if (bytes.length > MAX_IMAGE_BYTES) {
    const err = new Error('Image is too large. Maximum size is 5MB');
    err.statusCode = 400;
    throw err;
  }

  return { bytes, ext };
}

function buildAvatarUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/media/avatars/${filename}`;
}

async function uploadAvatar({ userId, sourceUrl, imageData, req }) {
  ensureUploadDirs();

  const image = imageData
    ? parseDataUri(imageData)
    : await fetchImageFromUrl(sourceUrl);

  const hash = crypto.randomBytes(6).toString('hex');
  const filename = `avatar_${userId}_${Date.now()}_${hash}.${image.ext}`;
  const destination = path.join(AVATARS_DIR, filename);

  fs.writeFileSync(destination, image.bytes);

  const avatarUrl = buildAvatarUrl(req, filename);
  const { profile } = await profileService.updateProfile(userId, { avatarUrl });

  return {
    avatarUrl,
    profile,
  };
}

module.exports = {
  uploadAvatar,
  UPLOADS_ROOT,
};
