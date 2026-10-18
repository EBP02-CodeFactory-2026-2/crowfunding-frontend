type Level = "alto" | "medio" | "bajo";

function levelFrom(tag?: string | null, score?: number | null): Level | null {
  if (tag) {
    const t = tag.toUpperCase();
    if (t.includes("ALT") || t.includes("HIGH")) return "alto";
    if (t.includes("MED")) return "medio";
    if (t.includes("BAJ") || t.includes("LOW")) return "bajo";
  }
  if (score !== undefined && score !== null) {
    if (score <= 1) return "alto";
    if (score <= 5) return "medio";
    return "bajo";
  }
  return null;
}

const STYLES: Record<Level, { label: string; cls: string }> = {
  alto: { label: "Riesgo Alto", cls: "bg-red-100 text-red-900 border-red-300" },
  medio: { label: "Riesgo Medio", cls: "bg-yellow-100 text-yellow-900 border-yellow-400" },
  bajo: { label: "Riesgo Bajo", cls: "bg-green-100 text-green-900 border-green-300" },
};

export default function RiskLabel({
  tag,
  score,
}: {
  tag?: string | null;
  score?: number | null;
}) {
  const level = levelFrom(tag, score);
  if (!level) return null;
  const { label, cls } = STYLES[level];

  return (
    <span className={`inline-block px-3 py-1 text-sm font-bold border rounded-full ${cls}`}>
      {label}
    </span>
  );
}