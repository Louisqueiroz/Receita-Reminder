"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PENDING_NAV_MAX_AGE_MS = 5 * 60 * 1000;
const POLL_WINDOW_MS = 5000;
const POLL_INTERVAL_MS = 400;

function openKvDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("receita-sw", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function consumePendingNavigation(): Promise<string | null> {
  if (typeof indexedDB === "undefined") return null;
  let db: IDBDatabase;
  try {
    db = await openKvDb();
  } catch {
    return null;
  }
  return new Promise<string | null>((resolve) => {
    const tx = db.transaction("kv", "readwrite");
    const store = tx.objectStore("kv");
    const getReq = store.get("pendingNavigation");
    getReq.onsuccess = () => {
      const entry = getReq.result as { url?: string; ts?: number } | undefined;
      if (entry && typeof entry.url === "string") {
        store.delete("pendingNavigation");
        const fresh = Date.now() - (entry.ts ?? 0) < PENDING_NAV_MAX_AGE_MS;
        resolve(fresh ? entry.url : null);
      } else {
        resolve(null);
      }
    };
    getReq.onerror = () => resolve(null);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  });
}

export default function SWNavigation() {
  const router = useRouter();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let navigated = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    const pollStart = Date.now();

    async function navigateTo(url: string) {
      if (navigated) return;
      navigated = true;
      if (pollTimer) clearTimeout(pollTimer);
      router.push(url);
    }

    async function checkPending() {
      if (navigated) return;
      const url = await consumePendingNavigation();
      if (url) {
        navigateTo(url);
        return;
      }
      if (Date.now() - pollStart < POLL_WINDOW_MS) {
        pollTimer = setTimeout(checkPending, POLL_INTERVAL_MS);
      }
    }

    checkPending();

    function onVisibility() {
      if (document.visibilityState === "visible") checkPending();
    }
    document.addEventListener("visibilitychange", onVisibility);

    function onMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.type !== "SW_NAVIGATE") return;
      const url = typeof data.url === "string" ? data.url : "/dashboard";
      navigateTo(url);
    }
    navigator.serviceWorker.addEventListener("message", onMessage);

    // Ensure the latest SW is active so the IDB handoff is in effect.
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) reg.update().catch(() => {});
    });

    return () => {
      if (pollTimer) clearTimeout(pollTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [router]);

  return null;
}
