"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Project, ApiError } from "@/types";
import RiskLabel from "@/components/RiskLabel";

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    const f = sessionStorage.getItem("flash");
    if (f) {
      setFlash(f);
      sessionStorage.removeItem("flash");
    }
    apiFetch<Project[]>("/projects/me", {}, true)
      .then((data) =>
        setProjects((data ?? []).filter((p) => (p.status as string) !== "DELETED"))
      )
      .catch((e: ApiError) =>
        setError(`No se pudieron cargar tus proyectos (${e.status ?? "sin conexión"}).`)
      )
      .finally(() => setLoading(false));
  }, [router]);

  async function publish(p: Project) {
    setError(null);
    setPublishingId(p.id);
    try {
      const res = await apiFetch<Project>(`/projects/${p.id}/publish`, { method: "POST" }, true);
      setProjects((prev) =>
        prev.map((x) =>
          x.id === p.id ? { ...x, status: res.status, riskTag: res.riskTag ?? x.riskTag } : x
        )
      );
      setFlash("Proyecto publicado con éxito");
    } catch (e) {
      const err = e as ApiError;
      const reason = err.details?.map((d) => d.issue).join(" ");
      setError([err.message, reason].filter(Boolean).join(": ") || "No se pudo publicar el proyecto.");
    } finally {
      setPublishingId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await apiFetch(`/projects/${toDelete.id}`, { method: "DELETE" }, true);
      setProjects((prev) => prev.filter((p) => p.id !== toDelete.id));
    } catch (e) {
      setError((e as ApiError).message || "No se pudo eliminar el proyecto.");
    } finally {
      setToDelete(null);
    }
  }

  if (loading) return <p className="text-center mt-20 font-bold text-gray-600">Cargando...</p>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 mt-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Mis Proyectos</h1>
        <Link href="/projects/new" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">
          + Nuevo Proyecto
        </Link>
      </div>

      {flash && (
        <p className="bg-green-50 text-green-900 border border-green-200 rounded-lg p-3 mb-4 text-sm font-semibold">
          {flash}
        </p>
      )}
      {error && (
        <p className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 mb-4 text-sm font-semibold">
          {error}
        </p>
      )}

      {!error && projects.length === 0 && (
        <p className="text-gray-600 bg-gray-50 p-8 text-center rounded-xl">No has creado ningún proyecto aún.</p>
      )}

      <div className="grid gap-4">
        {projects.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-xl shadow-md border border-gray-100 flex flex-wrap justify-between items-center gap-4">
            <div>
              <Link href={`/projects/${p.id}`} className="text-xl font-bold text-gray-900 hover:text-indigo-700">
                {p.title}
              </Link>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                <span>Creado: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</span>
                <span>Fecha límite: {p.deadline ? new Date(p.deadline).toLocaleDateString() : "—"}</span>
                <span className="font-semibold text-indigo-700">{p.status}</span>
                {p.status === "ACTIVE" && <RiskLabel tag={p.riskTag} />}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              {p.status === "ACTIVE" && (
                <Link href={`/projects/${p.id}/edit`} className="text-indigo-700 font-semibold hover:underline">
                  Editar
                </Link>
              )}
              {p.status === "DRAFT" && (
                <>
                  <Link href={`/projects/${p.id}/edit`} className="text-indigo-700 font-semibold hover:underline">
                    Editar
                  </Link>
                  <button
                    onClick={() => publish(p)}
                    disabled={publishingId === p.id}
                    className="bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {publishingId === p.id ? "Publicando..." : "Publicar"}
                  </button>
                </>
              )}
              <button onClick={() => setToDelete(p)} className="text-red-700 font-semibold hover:underline">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {toDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar proyecto?</h2>
            <p className="text-gray-700 mb-6">Vas a eliminar "{toDelete.title}". Esta acción es definitiva.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setToDelete(null)} className="px-4 py-2 rounded-lg bg-gray-200 font-semibold text-gray-800">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-700 text-white font-semibold">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}