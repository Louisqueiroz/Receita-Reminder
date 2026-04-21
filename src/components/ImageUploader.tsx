"use client";

import { useEffect, useMemo, useRef } from "react";

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

export default function ImageUploader({ images, onImagesChange }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () => images.map((f) => URL.createObjectURL(f)),
    [images]
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImagesChange([...images, ...Array.from(files)]);
    }
    e.target.value = "";
  }

  function removeImage(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {previews.map((preview, i) => (
            <div key={i} className="relative">
              <img
                src={preview}
                alt={`Receita pagina ${i + 1}`}
                className="w-full h-40 object-cover rounded-lg border"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-500 rounded-xl p-8 text-center text-gray-300 active:bg-gray-800"
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="mx-auto mb-2"
        >
          <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
        {images.length === 0
          ? "Tirar foto ou enviar arquivo"
          : "Adicionar mais fotos"}
      </button>
    </div>
  );
}
