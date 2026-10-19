"use client";

import { useEffect, useState } from "react";
import { Project } from "@/types";
import ProjectCard from "@/components/ProjectCard";
import { apiFetch } from "@/lib/api"; 

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await apiFetch<Project[]>("/api/v1/projects");
        setProjects(data || []);
      } catch (error) {
        console.error("Error cargando proyectos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');

  if (loading) {
    return <div className="text-center mt-20 text-xl font-bold text-gray-600">Cargando proyectos...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 mt-10">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">Descubre Proyectos Increíbles</h1>
      
      {activeProjects.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg">Aún no hay proyectos activos. ¡Sé el primero en lanzar uno!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </main>
  );
}