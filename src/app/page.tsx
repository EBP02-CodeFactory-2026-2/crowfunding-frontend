"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";
import ProjectCard from "@/components/ProjectCard";
import RiskFilter, { RISK_OPTIONS, RiskLevel } from "@/components/RiskFilter";
import { apiFetch } from "@/lib/api";

function levelOf(tag?: string | null): RiskLevel | null {
  const t = (tag ?? "").toUpperCase();
  if (t.includes("ALT")) return "ALTO";
  if (t.includes("MED")) return "MEDIO";
  if (t.includes("BAJ")) return "BAJO";
  return null;
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<RiskLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = selected.length > 0 ? `?riskTag=${selected.join(",")}` : "";

    apiFetch<Project[]>(`/projects${query}`)
      .then((data) => {
        if (!cancelled) setProjects(data || []);
      })
      .catch(() => {
        if (!cancelled)
          setError("No se pudieron cargar los proyectos. Intenta de nuevo más tarde.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Solo proyectos activos; además verificamos la etiqueta por seguridad
  const visible = projects.filter((p) => {
    if (p.status !== "ACTIVE") return false;
    if (selected.length === 0) return true;
    const level = levelOf(p.riskTag);
    return level !== null && selected.includes(level);
  });

  const selectedNames = RISK_OPTIONS.filter((o) => selected.includes(o.value)).map((o) =>
    o.label.replace("Riesgo ", "").toLowerCase()
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 mt-10">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
        Descubre Proyectos Increíbles
      </h1>

      <div className="mb-6">
        <RiskFilter selected={selected} onChange={setSelected} />
        {selected.length > 0 && (
          <p className="text-base text-gray-700 mt-3">
            Estás viendo campañas de riesgo {selectedNames.join(" o ")}.
          </p>
        )}
      </div>

      <div aria-live="polite">
        {loading && (
          <p className="text-center mt-10 text-xl font-bold text-gray-600">
            Cargando proyectos...
          </p>
        )}

        {!loading && error && (
          <p role="alert" className="bg-red-50 text-red-900 border border-red-300 rounded-lg p-4 text-base">
            {error}
          </p>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="text-center p-10 bg-indigo-50 border border-indigo-200 rounded-xl">
            {selected.length > 0 ? (
              <>
                <p className="text-lg font-bold text-indigo-900">
                  No hay proyectos con esa etiqueta de riesgo
                </p>
                <p className="text-base text-gray-700 mt-1">
                  Selecciona otra etiqueta o limpia los filtros para descubrir más campañas.
                </p>
              </>
            ) : (
              <p className="text-lg text-gray-700">
                Aún no hay proyectos activos. ¡Sé el primero en lanzar uno!
              </p>
            )}
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}