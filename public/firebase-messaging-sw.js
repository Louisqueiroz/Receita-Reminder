// SW version marker — bump to force iOS/Safari to re-install.
// v3 (2026-04-19): persistent pending-navigation handoff via IndexedDB
const SW_VERSION = "v3-2026-04-19";

// Standard Web Push handler (iOS Safari, browsers without FCM)
// FCM payloads are handled below via onBackgroundMessage — skip them here to avoid duplicates.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    try {
      data = { title: event.data?.text() || "Receita Reminder" };
    } catch (e2) {
      data = { title: "Receita Reminder" };
    }
  }

  // FCM envelopes have a `from` field (sender ID) and wrap our fields under `data`.
  // Our raw Web Push payload has `title` at the top level. Skip FCM here.
  const isFcm = typeof data.from === "string" || (data.data && !data.title);
  if (isFcm) return;

  const title = data.title || "Receita Reminder";
  const body = data.body || "Hora do remedio!";
  const doseIds = data.doseIds || data.doseId || "";
  const firstId = doseIds.split(",")[0];

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: firstId ? `doses-${firstId}` : "general",
      renotify: true,
      data: { url: doseIds ? `/doses?ids=${doseIds}` : "/dashboard" },
    })
  );
});

// FCM background handler (Chrome, Firefox, Edge — not iOS Safari)
// Loaded after the push listener so iOS isn't blocked if this fails
try {
  importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

  firebase.initializeApp({
    apiKey: "AIzaSyA-hw51raR_QrhDlRicZ95YfkYp2-7QW7k",
    authDomain: "receita-reminder.firebaseapp.com",
    projectId: "receita-reminder",
    storageBucket: "receita-reminder.firebasestorage.app",
    messagingSenderId: "343254755915",
    appId: "1:343254755915:web:f0bba64bb62a44ce87fbce",
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("FCM background message received:", payload);

    const title = payload.data?.title || payload.notification?.title || "Receita Reminder";
    const body = payload.data?.body || payload.notification?.body || "Hora do remedio!";
    const doseIds = payload.data?.doseIds || payload.data?.doseId || "";
    const firstId = doseIds.split(",")[0];

    return self.registration.showNotification(title, {
      body: body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: firstId ? `doses-${firstId}` : "general",
      renotify: true,
      data: { url: doseIds ? `/doses?ids=${doseIds}` : "/dashboard" },
    });
  });
} catch (e) {
  console.warn("Firebase messaging not available in this browser, using standard Web Push only:", e);
}

function swOpenKvDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("receita-sw", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function swKvSet(key, value) {
  return swOpenKvDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(value, key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const relUrl = event.notification.data?.url || "/dashboard";
  const absUrl = new URL(relUrl, self.registration.scope).href;

  event.waitUntil((async () => {
    // Persist the target URL so the client can pick it up even when iOS
    // relaunches the PWA at start_url instead of honoring openWindow.
    try {
      await swKvSet("pendingNavigation", { url: relUrl, ts: Date.now() });
    } catch (e) {
      // best-effort
    }

    const clientList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    // If a live client exists, focus it and tell it to navigate.
    for (const client of clientList) {
      try {
        await client.focus();
        client.postMessage({ type: "SW_NAVIGATE", url: relUrl });
        return;
      } catch (e) {
        // try next client
      }
    }

    if (self.clients.openWindow) {
      try {
        await self.clients.openWindow(absUrl);
      } catch (e) {
        // no-op
      }
    }
  })());
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
