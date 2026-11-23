"use client";

export type RiskLevel = "ALTO" | "MEDIO" | "BAJO";

export const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "ALTO", label: "Riesgo Alto" },
  { value: "MEDIO", label: "Riesgo Medio" },
  { value: "BAJO", label: "Riesgo Bajo" },
];

export default function RiskFilter({
  selected,
  onChange,
}: {
  selected: RiskLevel[];
  onChange: (next: RiskLevel[]) => void;
}) {
  function toggle(value: RiskLevel) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  return (
    <div
      role="group"
      aria-label="Filtrar por etiqueta de riesgo"
      className="flex flex-wrap items-center gap-2"
    >
      {RISK_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={selected.includes(o.value)}
          onClick={() => toggle(o.value)}
          className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
            selected.includes(o.value)
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
          }`}
        >
          {o.label}
        </button>
      ))}

      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}