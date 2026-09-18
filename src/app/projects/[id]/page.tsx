"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Project } from "@/types";

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
        setNotFound(true);
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