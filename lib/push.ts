import { buildPushPayload, type PushSubscription, type VapidKeys } from "@block65/webcrypto-web-push";
import { getEnv } from "./env";

export type PushSub = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendWebPush(
  subscription: PushSub,
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  const env = getEnv();
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys missing; skip push");
    return false;
  }

  try {
    const vapid: VapidKeys = {
      subject: env.VAPID_SUBJECT || "mailto:admin@example.com",
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY,
    };

    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      expirationTime: null,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const requestInit = await buildPushPayload(
      {
        data: JSON.stringify(payload),
        options: { ttl: 60, urgency: "high" },
      },
      pushSubscription,
      vapid,
    );

    const res = await fetch(subscription.endpoint, requestInit);
    return res.status >= 200 && res.status < 300;
  } catch (err) {
    console.error("push send failed", err);
    return false;
  }
}

export function getVapidPublicKey(): string {
  return getEnv().VAPID_PUBLIC_KEY || "";
}
