"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ClientUpload } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function MateriaisPage() {
  const [uploads, setUploads] = useState<ClientUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function load() {
    api.get<ClientUpload[]>("/api/client/uploads").then(setUploads);
  }

  useEffect(load, []);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_type", "campaign_material");
      if (notes) form.append("notes", notes);

      await fetch(`${BASE}/api/client/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      setNotes("");
      load();
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Enviar material</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Envie fotos, vídeos e arquivos para suas campanhas
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-zinc-700 hover:border-violet-600 rounded-xl px-6 py-10 text-center cursor-pointer transition-colors"
      >
        <p className="text-zinc-400 text-sm">
          {uploading ? "Enviando..." : "Arraste um arquivo ou clique para selecionar"}
        </p>
        <p className="text-zinc-600 text-xs mt-1">Máximo 50MB</p>
        <input ref={inputRef} type="file" className="hidden" onChange={onFileChange} />
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">
          Observação (opcional)
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: fotos para campanha de inverno"
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Upload history */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-white">Enviados anteriormente</h2>
          {uploads.map((u) => (
            <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
              <span className="text-xl">📎</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{u.filename}</p>
                {u.notes && <p className="text-xs text-zinc-500">{u.notes}</p>}
                <p className="text-xs text-zinc-600">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {u.drive_link && (
                <a
                  href={u.drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-400 hover:underline shrink-0"
                >
                  Ver
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
