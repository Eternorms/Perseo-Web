"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 gap-4 text-center px-4">
      <p className="text-xs text-zinc-500 font-mono">root/error</p>
      <p className="text-red-400 text-sm font-mono max-w-2xl break-all">
        {error?.message ?? "Erro desconhecido"}
      </p>
      {error?.stack && (
        <pre className="text-xs text-zinc-500 max-w-2xl text-left overflow-auto max-h-48 bg-zinc-900 p-3 rounded">
          {error.stack}
        </pre>
      )}
      <button onClick={unstable_retry} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-500">
        Tentar novamente
      </button>
    </div>
  );
}
