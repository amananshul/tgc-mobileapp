let expiredHandler: (() => void | Promise<void>) | null = null;

export function setAuthSessionExpiredHandler(handler: (() => void | Promise<void>) | null) {
  expiredHandler = handler;
}

export async function notifyAuthSessionExpired() {
  if (!expiredHandler) {
    return;
  }
  await expiredHandler();
}
