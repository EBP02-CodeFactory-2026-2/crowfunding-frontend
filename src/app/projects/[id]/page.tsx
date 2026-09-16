"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Project } from "@/types";

// Mismo mock del listado, para poder probar el detalle sin backend
const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    title: "EcoBici Comunitaria",
    description:
      "Proyecto para fabricar bicicletas con materiales reciclados para la comunidad. Buscamos financiar herramientas, materiales y talleres de capacitación para jóvenes del barrio.",
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
      "Creación de un huerto comunitario para fomentar la seguridad alimentaria en el sector.",
    imageUrl: null,
    fundingGoal: 3000,
    currentAmount: 2900,
    deadline: "2026-11-15T23:59:59Z",
    status: "ACTIVE",
    createdAt: "2026-09-01T10:00:00Z",
  },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await apiFetch<Project>(`/projects/${id}`);
        setProject(data);
      } catch {
        const mock = MOCK_PROJECTS.find((p) => p.id === id);
        if (mock) {
          setProject(mock);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id]);

  if (loading) return <p className="text-center mt-20">Cargando...</p>;
  if (notFound || !project)
    return <p className="text-center mt-20">Proyecto no encontrado.</p>;

  const progress = Math.min(
    (project.currentAmount / project.fundingGoal) * 100,
    100
  );

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link href="/projects" className="text-sm underline">
        ← Volver al catálogo
      </Link>

      <img
        src={project.imageUrl || "https://placehold.co/800x400?text=CrowdFunding"}
        alt={project.title}
        className="w-full h-72 object-cover rounded-lg mt-4"
      />

      <h1 className="text-3xl font-bold mt-6">{project.title}</h1>
      <p className="text-gray-600 mt-2">{project.description}</p>

      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-black h-3 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2">
          <strong>${project.currentAmount.toLocaleString()}</strong> recaudados
          de ${project.fundingGoal.toLocaleString()} — meta:{" "}
          {new Date(project.deadline).toLocaleDateString()}
        </p>
      </div>

      <button className="bg-black text-white rounded p-3 px-6 mt-6">
        Contribuir a este proyecto
      </button>
    </main>
  );
}