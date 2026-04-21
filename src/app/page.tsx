"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthChange } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setChecking(false), 3000);
    const unsubscribe = onAuthChange((user) => {
      clearTimeout(timeout);
      if (user) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    });
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-36 h-36 bg-gray-700 rounded-full flex items-center justify-center shadow-lg border border-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-28 h-28 -translate-x-1 translate-y-2"
              >
                <path d="M20 4v20a12 12 0 0 0 24 0V4" />
                <line x1="20" y1="4" x2="20" y2="12" />
                <line x1="44" y1="4" x2="44" y2="12" />
                <path d="M32 36v8a8 8 0 0 0 16 0v-4" />
                <circle cx="48" cy="36" r="5" fill="white" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              HealthBud
            </h1>
            <p className="text-gray-300 text-lg font-medium">
              Te ajuda a seguir o tratamento médico
            </p>
          </div>

          {/* Features */}
          <div className="space-y-5 text-left bg-gray-700 rounded-2xl p-7 border border-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex-shrink-0 w-11 h-11 bg-gray-600 rounded-full flex items-center justify-center text-white text-base font-bold">1</span>
              <p className="text-white text-lg">Cadastre suas receitas medicas</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex-shrink-0 w-11 h-11 bg-gray-600 rounded-full flex items-center justify-center text-white text-base font-bold">2</span>
              <p className="text-white text-lg">Configure os horarios dos remedios</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex-shrink-0 w-11 h-11 bg-gray-600 rounded-full flex items-center justify-center text-white text-base font-bold">3</span>
              <p className="text-white text-lg">Receba lembretes na hora certa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="p-6 pb-10 w-full max-w-sm mx-auto space-y-3">
        <Link
          href="/signup"
          className="block w-full bg-blue-600 text-white rounded-xl p-4 text-lg font-bold text-center shadow-lg hover:bg-blue-500 transition-colors"
        >
          Criar Conta
        </Link>
        <Link
          href="/login"
          className="block w-full border-2 border-gray-500 text-white rounded-xl p-4 text-lg font-semibold text-center hover:bg-gray-800 transition-colors"
        >
          Ja tenho conta
        </Link>
      </div>
    </div>
  );
}
