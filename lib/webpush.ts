// lib/webpush.ts
import webpush from 'web-push';

webpush.setVapidDetails(
    `mailto:${process.env.VAPID_ADMIN_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export default webpush;
