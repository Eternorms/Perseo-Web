"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#050608", color: "#EDEFF3", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 24 }}>
          <p style={{ fontWeight: 600 }}>Erro inesperado na aplicação.</p>
          <button
            onClick={reset}
            style={{ background: "#00FF41", color: "#04130A", border: 0, borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
          >
            Recarregar
          </button>
        </main>
      </body>
    </html>
  );
}
