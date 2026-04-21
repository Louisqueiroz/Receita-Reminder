"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthChange, signOut, getUserProfile } from "@/lib/auth";
import AuthGuard from "@/components/AuthGuard";
import Nav from "@/components/Nav";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (u) => {
      setFirebaseUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
      }
    });
    return unsubscribe;
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch (err) {
      console.error(err);
      setSigningOut(false);
    }
  }

  const name = profile?.name || firebaseUser?.displayName || "";
  const email = profile?.email || firebaseUser?.email || "";
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 pb-24">
        <header className="bg-blue-600 text-white p-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-white/90 text-sm mb-2 -ml-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Voltar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Voltar</span>
          </button>
          <h1 className="text-xl font-bold">Meu Perfil</h1>
        </header>

        <main className="p-4 space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
            <div className="shrink-0 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-lg truncate">
                {name || "Sem nome"}
              </p>
              <p className="text-gray-400 text-sm truncate">{email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl p-4 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {signingOut ? "Saindo..." : "Sair"}
          </button>
        </main>

        <Nav />
      </div>
    </AuthGuard>
  );
}
