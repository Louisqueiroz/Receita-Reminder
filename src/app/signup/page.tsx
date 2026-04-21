"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { signUpWithEmail } from "@/lib/auth";

function errorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/email-already-in-use":
        return "Este email ja esta cadastrado.";
      case "auth/invalid-email":
        return "Email invalido.";
      case "auth/weak-password":
        return "Senha muito fraca. Use ao menos 6 caracteres.";
      case "auth/network-request-failed":
        return "Erro de conexao. Tente novamente.";
    }
  }
  return "Erro ao criar conta. Tente novamente.";
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    setError("");

    if (password.length < 6) {
      setError("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas nao coincidem.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Criar Conta</h1>
        <p className="text-gray-300 text-base mt-1">Cadastre-se para comecar</p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm bg-gray-700 border border-gray-600 rounded-3xl px-6 pt-8 pb-8 shadow-xl">
        {error && (
          <p className="text-red-400 mb-4 text-sm text-center bg-red-500/10 border border-red-500/30 rounded-xl p-3">{error}</p>
        )}

        <div className="w-full max-w-sm mx-auto space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Nome</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-gray-500 bg-gray-800 text-white rounded-xl p-4 text-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
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
              autoComplete="new-password"
              placeholder="Ao menos 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-500 bg-gray-800 text-white rounded-xl p-4 text-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Confirmar senha</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border-2 border-gray-500 bg-gray-800 text-white rounded-xl p-4 text-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleSignup}
            disabled={loading || !name || !email || !password || !confirm}
            className="w-full bg-blue-600 text-white rounded-xl p-4 text-lg font-bold disabled:opacity-40 shadow-lg hover:bg-blue-700 transition-colors"
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
          <p className="text-center text-sm text-gray-400 pt-2">
            Ja tem conta?{" "}
            <a href="/login" className="text-blue-400 font-semibold">Entrar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
