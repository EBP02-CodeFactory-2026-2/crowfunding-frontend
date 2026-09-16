"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { CreateProjectRequest, Project, ApiError } from "@/types";

export default function NewProjectPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [form, setForm] = useState<CreateProjectRequest>({
    title: "",
    description: "",
    imageUrl: "",
    fundingGoal: 0,
    deadline: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si no hay sesión iniciada, saca al usuario de esta pantalla
  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...form,
        deadline: new Date(form.deadline).toISOString(),
      };

      const created = await apiFetch<Project>(
        "/projects",
        { method: "POST", body: JSON.stringify(payload) },
        true // <- aquí se activa el envío del token
      );

      router.push(`/projects/${created.id}`);
    } catch (err) {
      const apiError = err as ApiError;

      if (apiError.status === 401) {
        setError("Tu sesión expiró. Inicia sesión de nuevo.");
      } else if (apiError.details) {
        setError(apiError.details.map((d) => d.issue).join(" "));
      } else {
        setError(apiError.message || "Ocurrió un error al crear el proyecto.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) return null; // evita un parpadeo del formulario antes de redirigir

  return (
    <main className="max-w-lg mx-auto mt-12 p-6">
      <h1 className="text-2xl font-bold mb-6">Crear proyecto</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Título del proyecto"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="border rounded p-2"
          required
        />
        <textarea
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border rounded p-2 min-h-24"
          required
        />
        <input
          type="url"
          placeholder="URL de imagen (opcional)"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          className="border rounded p-2"
        />
        <input
          type="number"
          placeholder="Meta de recaudación ($)"
          value={form.fundingGoal || ""}
          onChange={(e) =>
            setForm({ ...form, fundingGoal: Number(e.target.value) })
          }
          className="border rounded p-2"
          min={1}
          step="0.01"
          required
        />
        <label className="text-sm text-gray-600">
          Fecha límite
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="border rounded p-2 w-full mt-1"
            required
          />
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Publicar proyecto"}
        </button>
      </form>
    </main>
  );
}