"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type IconProps = { active: boolean };

function PillIcon({ active }: IconProps) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect
        x="2.5"
        y="8.5"
        width="19"
        height="7"
        rx="3.5"
        transform="rotate(-35 12 12)"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <line x1="12" y1="6" x2="12" y2="18" transform="rotate(-35 12 12)" />
    </svg>
  );
}

function PlusIcon({ active }: IconProps) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function HistoryIcon({ active }: IconProps) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        d="M3.5 8a8.5 8.5 0 1 1-.5 5"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.15 : 0}
      />
      <polyline points="3,4 3,8 7,8" />
      <polyline points="12,7 12,12 15.5,14" />
    </svg>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [modalMounted, setModalMounted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openModal() {
    setModalMounted(true);
  }

  function closeModal() {
    setModalVisible(false);
  }

  useEffect(() => {
    if (!modalMounted) return;
    const id = requestAnimationFrame(() => setModalVisible(true));
    return () => cancelAnimationFrame(id);
  }, [modalMounted]);

  useEffect(() => {
    if (modalMounted && !modalVisible) {
      const t = setTimeout(() => setModalMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [modalMounted, modalVisible]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = await Promise.all(
      Array.from(files).map(async (f) => ({
        name: f.name,
        type: f.type,
        data: await fileToBase64(f),
      }))
    );
    sessionStorage.setItem("pendingReceitaFiles", JSON.stringify(arr));
    closeModal();
    router.push("/receita/upload");
  }

  const isReceitaActive = pathname.startsWith("/receita");
  const isRemediosActive = pathname.startsWith("/dashboard");
  const isHistoryActive = pathname.startsWith("/history");

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around py-2 px-4 safe-bottom z-30">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 text-xs ${
            isRemediosActive ? "text-blue-400 font-semibold" : "text-gray-400"
          }`}
        >
          <PillIcon active={isRemediosActive} />
          <span>Remedios</span>
        </Link>

        <button
          type="button"
          onClick={openModal}
          className={`flex flex-col items-center gap-0.5 text-xs ${
            isReceitaActive ? "text-blue-400 font-semibold" : "text-gray-400"
          }`}
        >
          <PlusIcon active={isReceitaActive} />
          <span>Nova Receita</span>
        </button>

        <Link
          href="/history"
          className={`flex flex-col items-center gap-0.5 text-xs ${
            isHistoryActive ? "text-blue-400 font-semibold" : "text-gray-400"
          }`}
        >
          <HistoryIcon active={isHistoryActive} />
          <span>Historico</span>
        </Link>
      </nav>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {modalMounted && (
        <div
          className={`fixed inset-0 z-40 flex items-end bg-black/60 transition-opacity duration-300 ${
            modalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeModal}
        >
          <div
            className={`w-full bg-gray-700 border-t border-gray-600 rounded-t-3xl p-5 space-y-3 safe-bottom transform transition-transform duration-300 ease-out ${
              modalVisible ? "translate-y-0" : "translate-y-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-12 h-1.5 bg-gray-500 rounded-full mb-2" />
            <h2 className="text-white font-semibold text-lg text-center mb-2">
              Nova Receita
            </h2>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 flex items-center gap-3 transition-colors"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              <span className="font-medium">Tire uma foto</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white rounded-xl p-4 flex items-center gap-3 transition-colors"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
              </svg>
              <span className="font-medium">Selecione um arquivo</span>
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="w-full text-gray-300 p-3"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
