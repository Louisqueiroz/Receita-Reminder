"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { uploadReceitaImage } from "@/lib/storage";
import AuthGuard from "@/components/AuthGuard";
import Nav from "@/components/Nav";
import ImageUploader from "@/components/ImageUploader";

export default function UploadReceitaPage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const pending = sessionStorage.getItem("pendingReceitaFiles");
    if (!pending) return;
    try {
      const arr: { name: string; type: string; data: string }[] =
        JSON.parse(pending);
      const files = arr.map((f) => {
        const [, base64] = f.data.split(",");
        const bin = atob(base64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new File([bytes], f.name, { type: f.type });
      });
      setImages(files);
    } catch {
      // ignore parse errors
    } finally {
      sessionStorage.removeItem("pendingReceitaFiles");
    }
  }, []);

  async function handleSubmit() {
    if (images.length === 0) return;

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      setStatus("Enviando fotos...");
      const imageUrls = await Promise.all(
        images.map((file, i) => uploadReceitaImage(file, i))
      );

      setStatus("Lendo sua receita...");
      const idToken = await user.getIdToken();
      const response = await fetch("/api/process-receita", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ imageUrls }),
      });

      if (!response.ok) throw new Error("Failed to process receita");
      const { medicines, rawText } = await response.json();

      setStatus("Salvando...");
      const prescriptionRef = await addDoc(collection(db, "prescriptions"), {
        userId: user.uid,
        imageUrls,
        rawText,
        uploadedAt: new Date(),
      });

      // Store extracted medicines in sessionStorage for the confirm page
      sessionStorage.setItem(
        "pendingMedicines",
        JSON.stringify({
          prescriptionId: prescriptionRef.id,
          medicines,
        })
      );

      router.push("/receita/confirm");
    } catch (err) {
      console.error(err);
      setStatus("Erro ao processar receita. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 pb-32">
        <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 pt-5 pb-8 rounded-b-3xl shadow-lg">
          <svg
            className="absolute right-2 top-4 opacity-90 pointer-events-none"
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            aria-hidden
          >
            <circle cx="95" cy="25" r="22" fill="white" fillOpacity="0.08" />
            <circle cx="25" cy="100" r="14" fill="white" fillOpacity="0.08" />
            <rect
              x="50"
              y="20"
              width="50"
              height="62"
              rx="4"
              fill="white"
              fillOpacity="0.95"
              transform="rotate(-8 75 51)"
            />
            <g transform="rotate(-8 75 51)" stroke="#6366f1" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round">
              <line x1="58" y1="34" x2="92" y2="34" />
              <line x1="58" y1="42" x2="86" y2="42" />
              <line x1="58" y1="50" x2="90" y2="50" />
              <line x1="58" y1="58" x2="82" y2="58" />
            </g>
            <g transform="translate(12 62)">
              <rect x="0" y="8" width="38" height="28" rx="4" fill="white" fillOpacity="0.95" />
              <rect x="12" y="4" width="14" height="6" rx="1" fill="white" fillOpacity="0.95" />
              <circle cx="19" cy="22" r="8" fill="#6366f1" fillOpacity="0.85" />
              <circle cx="19" cy="22" r="4" fill="white" />
            </g>
          </svg>

          <div className="relative">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1 text-white/90 text-sm mb-3 -ml-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Voltar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Voltar</span>
            </button>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-medium mb-4">
              <span className="px-2 py-1 rounded-full bg-white text-blue-700 font-semibold">
                1. Foto
              </span>
              <span>›</span>
              <span className="px-2 py-1 rounded-full bg-white/20">2. Confirmar</span>
              <span>›</span>
              <span className="px-2 py-1 rounded-full bg-white/20">3. Horários</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight max-w-[60%]">
              Nova Receita
            </h1>
            <p className="text-blue-100 text-sm mt-2 max-w-[60%]">
              Envie a foto e a gente cuida do resto
            </p>
          </div>
        </header>

        <main className="px-4 pt-6 space-y-4">
          <div className="bg-gray-700 rounded-2xl shadow-sm ring-1 ring-gray-600 p-5">
            <h2 className="font-semibold text-white">Dicas para uma boa foto</h2>
            <ul className="text-sm text-gray-200 space-y-1.5 mt-3">
              <li className="flex gap-2"><span className="text-blue-400">•</span> Boa iluminação, sem sombras</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> Enquadre a receita inteira</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> Mantenha o celular firme</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> Várias páginas? Adicione uma por vez</li>
            </ul>
          </div>

          <div className="bg-gray-700 rounded-2xl shadow-sm ring-1 ring-gray-600 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-300 font-semibold mb-3">
              Fotos da receita
            </p>
            <ImageUploader images={images} onImagesChange={setImages} />
          </div>

          {status && (
            <p className="text-center text-blue-600 font-medium">{status}</p>
          )}
        </main>

        <div className="fixed bottom-16 left-0 right-0 bg-gray-800/95 backdrop-blur border-t border-gray-700 p-4">
          <button
            onClick={handleSubmit}
            disabled={loading || images.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 text-lg font-semibold shadow-md disabled:opacity-50 active:scale-[0.99] transition"
          >
            {loading ? "Processando..." : "Enviar Receita"}
          </button>
        </div>

        <Nav />
      </div>
    </AuthGuard>
  );
}
