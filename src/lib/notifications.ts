import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, deleteField } from "firebase/firestore";
import { getMessagingInstance } from "./firebase";
import { db, auth } from "./firebase";

let foregroundListenerSet = false;

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return isIOS;
}

function log(msg: string) {
  console.log(msg);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribePushAPI(registration: ServiceWorkerRegistration): Promise<boolean> {
  const vapidKey = process.env.NEXT_PUBLIC_WEBPUSH_VAPID_KEY;
  if (!vapidKey) {
    log("ERROR: No VAPID key configured");
    return false;
  }

  try {
    // Always get a fresh subscription (handles iOS token staleness)
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      log("No existing subscription, creating new one");
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    log("Web Push subscription obtained");

    // Always save/refresh the subscription in Firestore
    const user = auth.currentUser;
    if (user && subscription) {
      await setDoc(doc(db, "users", user.uid), {
        pushSubscription: JSON.parse(JSON.stringify(subscription)),
        fcmToken: deleteField(),
      }, { merge: true });
      log("Web Push subscription saved for user: " + user.uid);
    }

    return true;
  } catch (err) {
    log("Web Push subscribe failed: " + (err instanceof Error ? err.message : err));
    // If subscription failed, try unsubscribing first and re-subscribing
    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
        log("Unsubscribed stale subscription, retrying...");
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const user = auth.currentUser;
      if (user && subscription) {
        await setDoc(doc(db, "users", user.uid), {
          pushSubscription: JSON.parse(JSON.stringify(subscription)),
          fcmToken: deleteField(),
        }, { merge: true });
        log("Web Push subscription saved on retry for user: " + user.uid);
      }
      return true;
    } catch (retryErr) {
      log("ERROR: Web Push retry also failed: " + (retryErr instanceof Error ? retryErr.message : retryErr));
      return false;
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    log("ERROR: Notifications not supported in this browser");
    return false;
  }

  if (!("serviceWorker" in navigator)) {
    log("ERROR: Service workers not supported");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    log("ERROR: Notification permission denied: " + permission);
    return false;
  }

  try {
    log("Registering service worker...");
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    await navigator.serviceWorker.ready;
    log("Service worker ready");

    const isiOS = isIOSSafari();
    log("Platform: " + (isiOS ? "iOS Safari" : "other"));

    // On iOS, skip FCM entirely — go straight to Web Push API
    if (isiOS) {
      log("Using standard Web Push API for iOS");
      return await subscribePushAPI(registration);
    }

    // Non-iOS: Try FCM (works on Chrome, Firefox, Edge)
    const messaging = await getMessagingInstance();
    log("FCM messaging supported: " + (messaging ? "yes" : "no"));
    if (messaging) {
      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        log("FCM token obtained: " + (token ? "yes" : "no"));

        const user = auth.currentUser;
        if (user && token) {
          await setDoc(doc(db, "users", user.uid), {
            fcmToken: token,
            pushSubscription: deleteField(),
          }, { merge: true });
          log("FCM token saved for user: " + user.uid);
        }

        // Set up foreground notification listener
        if (!foregroundListenerSet) {
          foregroundListenerSet = true;
          onMessage(messaging, (payload) => {
            console.log("Foreground notification received:", payload);
            const title = payload.data?.title || payload.notification?.title;
            const body = payload.data?.body || payload.notification?.body;
            const doseIds = payload.data?.doseIds || payload.data?.doseId || "";
            const firstId = doseIds.split(",")[0];

            registration.showNotification(title || "Receita Reminder", {
              body: body || "Hora do remedio!",
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              tag: firstId ? `doses-${firstId}` : "general",
              data: { url: doseIds ? `/doses?ids=${doseIds}` : "/dashboard" },
              ...({ renotify: true } as object),
            });
          });
        }

        return true;
      } catch (fcmErr) {
        log("FCM failed, falling back to Web Push API: " + (fcmErr instanceof Error ? fcmErr.message : fcmErr));
      }
    }

    // Fallback: standard Web Push API
    log("Using standard Web Push API (fallback)");
    return await subscribePushAPI(registration);
  } catch (err) {
    log("ERROR: Failed to set up notifications: " + (err instanceof Error ? err.message : err));
    return false;
  }
}
