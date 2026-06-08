"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: "#09090b", color: "#f4f4f5", fontFamily: "monospace", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px", textAlign: "center", padding: "16px" }}>
        <p style={{ fontSize: "11px", color: "#71717a" }}>global/error</p>
        <p style={{ color: "#f87171", fontSize: "14px", maxWidth: "640px", wordBreak: "break-all" }}>
          {error?.message ?? "Erro desconhecido"}
        </p>
        {error?.stack && (
          <pre style={{ fontSize: "11px", color: "#71717a", maxWidth: "640px", textAlign: "left", overflow: "auto", maxHeight: "192px", background: "#18181b", padding: "12px", borderRadius: "8px" }}>
            {error.stack}
          </pre>
        )}
        <button onClick={unstable_retry} style={{ padding: "8px 16px", background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
