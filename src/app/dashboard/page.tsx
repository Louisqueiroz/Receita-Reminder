"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { requestNotificationPermission } from "@/lib/notifications";
import AuthGuard from "@/components/AuthGuard";
import Nav from "@/components/Nav";
import MedicineCard from "@/components/MedicineCard";
import type { Medicine } from "@/lib/types";

function useIOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);
    setIsIOS(ios);
    setIsStandalone(standalone);
  }, []);

  return { isIOS, isStandalone, showInstallGuide: isIOS && !isStandalone };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);
    setInstalled(standalone);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }

  return { canInstall: !!deferredPrompt && !installed, installed, promptInstall };
}

export default function DashboardPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const { isIOS, isStandalone, showInstallGuide } = useIOSInstallPrompt();
  const { canInstall, promptInstall } = useInstallPrompt();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      // Check if notifications are already granted (don't auto-prompt)
      if ("Notification" in window && Notification.permission === "granted") {
        requestNotificationPermission().then((granted) => {
          setNotifEnabled(granted);
        });
      } else {
        setNotifEnabled(false);
      }

      const q = query(
        collection(db, "medicines"),
        where("userId", "==", user.uid),
        where("active", "==", true)
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const meds = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Medicine[];
        setMedicines(meds);
        setLoading(false);
      });

      // Store for cleanup
      cleanupRef.current = unsubscribeSnapshot;
    });

    const cleanupRef = { current: () => {} };
    return () => {
      unsubscribeAuth();
      cleanupRef.current();
    };
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 pb-20">
        <header className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Meus Remedios</h1>
          <a
            href="/profile"
            aria-label="Meu perfil"
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </a>
        </header>

        <main className="p-4 space-y-3">
          {canInstall && (
            <button
              onClick={promptInstall}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 font-semibold shadow-md active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12" />
                <polyline points="7,10 12,15 17,10" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
              Adicionar à tela inicial
            </button>
          )}
          {showInstallGuide && (
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-blue-300">Instale o app para receber notificacoes</p>
              <ol className="text-sm text-gray-200 list-decimal list-inside space-y-1">
                <li>Toque no botao <strong>Compartilhar</strong> (icone de quadrado com seta para cima)</li>
                <li>Role para baixo e toque em <strong>&quot;Adicionar a Tela de Inicio&quot;</strong></li>
                <li>Toque em <strong>&quot;Adicionar&quot;</strong></li>
                <li>Abra o app pela Tela de Inicio</li>
              </ol>
            </div>
          )}
          {!notifEnabled && !showInstallGuide && (
            <button
              onClick={async () => {
                const granted = await requestNotificationPermission();
                setNotifEnabled(granted);
              }}
              className="w-full bg-yellow-500 text-white rounded-lg p-3 font-semibold"
            >
              Ativar Notificacoes
            </button>
          )}
          {loading && <p className="text-gray-500 text-center">Carregando...</p>}

          {!loading && medicines.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Nenhum remedio cadastrado</p>
              <a
                href="/receita/upload"
                className="bg-blue-600 text-white rounded-lg px-6 py-3 inline-block font-semibold"
              >
                Enviar Receita
              </a>
              <a
                href="/medicine/add"
                className="mt-3 block text-blue-600 font-semibold"
              >
                ou adicionar manualmente
              </a>
            </div>
          )}

          {!loading && medicines.length > 0 && (
            <a
              href="/medicine/add"
              className="block w-full border-2 border-dashed border-blue-300 text-blue-600 rounded-lg p-3 text-center font-semibold hover:bg-blue-50 transition-colors"
            >
              + Adicionar remedio manualmente
            </a>
          )}

          {medicines.map((med) => (
            <MedicineCard key={med.id} medicine={med} />
          ))}
        </main>

        <Nav />
      </div>
    </AuthGuard>
  );
}
