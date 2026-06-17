"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#100b08", color: "#f8efe3", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem", textAlign: "center" }}>
          <div style={{ maxWidth: "24rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Algo deu errado</h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#b8a692" }}>
              Recarregue a página. Se persistir, tente novamente em instantes.
            </p>
            <button
              onClick={reset}
              style={{ marginTop: "1.5rem", borderRadius: "0.75rem", background: "#f26a1f", color: "#fff", padding: "0.625rem 1.25rem", fontWeight: 600, border: "none" }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
