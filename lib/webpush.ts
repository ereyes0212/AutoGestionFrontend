import webpush from 'web-push';

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const adminEmail = process.env.VAPID_ADMIN_EMAIL;

  if (!publicKey || !privateKey || !adminEmail) {
    throw new Error('VAPID env vars are missing (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_ADMIN_EMAIL)');
  }

  webpush.setVapidDetails(`mailto:${adminEmail}`, publicKey, privateKey);
  configured = true;
}

export async function sendWebPushNotification(subscription: unknown, payload: string) {
  ensureConfigured();
  return webpush.sendNotification(subscription as any, payload);
}
