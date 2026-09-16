"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Project } from "@/types";
import ProjectCard from "@/components/ProjectCard";

// Datos de ejemplo, para diseñar y probar sin backend disponible aún
const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    title: "EcoBici Comunitaria",
    description:
      "Proyecto para fabricar bicicletas con materiales reciclados para la comunidad.",
    imageUrl: null,
    fundingGoal: 5000,
    currentAmount: 1250,
    deadline: "2026-12-31T23:59:59Z",
    status: "ACTIVE",
    createdAt: "2026-09-05T12:30:00Z",
  },
  {
    id: "2",
    title: "Huerto Urbano Barrio Sur",
    description:
      "Creación de un huerto comunitario para fomentar la seguridad alimentaria.",
    imageUrl: null,
    fundingGoal: 3000,
    currentAmount: 2900,
    deadline: "2026-11-15T23:59:59Z",
    status: "ACTIVE",
    createdAt: "2026-09-01T10:00:00Z",
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await apiFetch<Project[]>("/projects");
        setProjects(data);
      } catch {
        // Si el backend no responde, mostramos datos de ejemplo
        setProjects(MOCK_PROJECTS);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (loading) return <p className="text-center mt-20">Cargando proyectos...</p>;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Campañas activas</h1>

      {usingMock && (
        <p className="text-sm text-amber-600 mb-4">
          Mostrando datos de ejemplo — el backend aún no está disponible.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </main>
  );
}