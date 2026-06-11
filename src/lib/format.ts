/**
 * Formatação pt-BR via Intl — números de dashboard sempre exibidos com
 * a classe `num` (mono + tabular) no componente.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFmt = new Intl.NumberFormat("pt-BR");
const compactFmt = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function fmtCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return brl.format(value);
}

export function fmtCurrencyCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return brlCompact.format(value);
}

export function fmtNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return numberFmt.format(value);
}

export function fmtCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return compactFmt.format(value);
}

/** 0.1234 → "12,3%" quando `ofOne`; 12.34 → "12,3%" caso contrário. */
export function fmtPercent(value: number | null | undefined, opts?: { ofOne?: boolean; digits?: number }): string {
  if (value == null || Number.isNaN(value)) return "—";
  const v = opts?.ofOne ? value * 100 : value;
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: opts?.digits ?? 1 })}%`;
}

/** ROAS multiplicador: 3.42 → "3,42×" */
export function fmtRoas(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** "há 3 min", "há 2 h", "há 5 d" — para feeds e inbox. */
export function fmtRelative(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = now.getTime() - d.getTime();
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);
  const min = Math.round(abs / 60000);
  let txt: string;
  if (min < 1) txt = "agora";
  else if (min < 60) txt = `${min} min`;
  else if (min < 60 * 24) txt = `${Math.round(min / 60)} h`;
  else txt = `${Math.round(min / (60 * 24))} d`;
  if (txt === "agora") return txt;
  return future ? `em ${txt}` : `há ${txt}`;
}

/** Segundos → "38s" | "4m 12s" | "1h 03m" (tempo de resposta a lead). */
export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${String(rm).padStart(2, "0")}m`;
}

export function fmtMonth(iso: string): string {
  const d = new Date(`${iso.slice(0, 7)}-02T00:00:00`);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Iniciais para avatar: "Loja Vora" → "LV". */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
