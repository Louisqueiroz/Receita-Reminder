"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { signInWithEmail } from "@/lib/auth";

function errorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "Email invalido.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Email ou senha incorretos.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde e tente novamente.";
      case "auth/network-request-failed":
        return "Erro de conexao. Tente novamente.";
    }
  }
  return "Erro ao entrar. Tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      await signInWithEmail(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6">
      {/* Header */}
      <div className="flex flex-col items-center pb-6">
        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center shadow-lg mb-4 border border-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Bem-vindo de volta</h1>
        <p className="text-gray-300 text-base mt-1">Entre na sua conta</p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm bg-gray-700 border border-gray-600 rounded-3xl px-6 pt-8 pb-8 shadow-xl">
        {error && (
          <p className="text-red-400 mb-4 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl p-3">{error}</p>
        )}

        <div className="w-full max-w-sm mx-auto space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-500 bg-gray-800 text-white rounded-xl p-4 text-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Senha</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-500 bg-gray-800 text-white rounded-xl p-4 text-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 text-white rounded-xl p-4 text-lg font-bold disabled:opacity-40 shadow-lg hover:bg-blue-700 transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-center text-sm text-gray-400 pt-2">
            Nao tem conta?{" "}
            <a href="/signup" className="text-blue-400 font-semibold">Criar conta</a>
          </p>
        </div>
      </div>
    </div>
  );
}
