"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useUnsavedChanges } from "@/lib/useUnsavedChanges";
import { Project, ApiError } from "@/types";

type FormState = {
  title: string;
  description: string;
  imageUrl: string;
  fundingGoal: string;
  deadline: string;
};

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    imageUrl: "",
    fundingGoal: "",
    deadline: "",
  });
  const [status, setStatus] = useState<Project["status"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"save" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [original, setOriginal] = useState<{ fundingGoal: number | null; deadline: string | null }>({
    fundingGoal: null,
    deadline: null,
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    if (!id) return;
    apiFetch<Project>(`/projects/${id}`, {}, true)
      .then((p) => {
        setStatus(p.status);
        setOriginal({ fundingGoal: p.fundingGoal ?? null, deadline: p.deadline ?? null });
        setForm({
          title: p.title ?? "",
          description: p.description ?? "",
          imageUrl: p.imageUrl ?? "",
          fundingGoal: p.fundingGoal ? String(p.fundingGoal) : "",
          deadline: p.deadline ? p.deadline.slice(0, 10) : "",
        });
      })
      .catch(() => setError("No se pudo cargar el proyecto."))
      .finally(() => setLoading(false));
  }, [id, router]);

  useUnsavedChanges(isDirty);

  function update(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
    setIsDirty(true);
  }

  function describe(err: unknown, fallback: string) {
    const e = err as ApiError;
    if (e.status === 401 || e.status === 403) {
      return "Tu sesión no es válida o expiró, o no eres el dueño de este proyecto.";
    }
    const reason = e.details?.map((d) => d.issue).join(" ");
    return [e.message, reason].filter(Boolean).join(": ") || fallback;
  }

  const isActive = status === "ACTIVE";

  async function save(publish: boolean) {
    setError(null);

    if (isActive && (!form.title.trim() || !form.description.trim())) {
      setError("El título y la descripción no pueden quedar vacíos.");
      return;
    }
    if (publish && (!form.title.trim() || !form.description.trim() || !form.fundingGoal || !form.deadline)) {
      setError("Para publicar debes completar título, descripción, meta y fecha límite.");
      return;
    }

    setSaving(publish ? "publish" : "save");
    try {
      const payload: Record<string, unknown> = {};
      if (form.title.trim()) payload.title = form.title;
      if (form.description.trim()) payload.description = form.description;
      if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl;
      // En un proyecto activo la meta y el plazo no se pueden modificar: no se envían
      if (isActive) {
        // El backend responde 409 si no se reenvían la meta y el plazo sin cambios
        if (original.fundingGoal !== null) payload.fundingGoal = original.fundingGoal;
        if (original.deadline) payload.deadline = original.deadline;
      } else {
        if (form.fundingGoal) payload.fundingGoal = Number(form.fundingGoal);
        if (form.deadline) payload.deadline = new Date(form.deadline).toISOString();
      }

      const updated = await apiFetch<Project>(
        `/projects/${id}`,
        { method: "PUT", body: JSON.stringify(payload) },
        true
      );
      setIsDirty(false);

      if (isActive) {
        sessionStorage.setItem(
          "flash",
          `Proyecto actualizado con éxito${updated?.riskTag ? ` · ${updated.riskTag}` : ""}`
        );
        router.push("/projects/my-projects");
        return;
      }

      if (!publish) {
        sessionStorage.setItem("flash", "Borrador actualizado con éxito");
        router.push("/projects/my-projects");
        return;
      }

      try {
        await apiFetch(`/projects/${id}/publish`, { method: "POST" }, true);
        router.push(`/projects/${id}`);
      } catch (pubErr) {
        sessionStorage.setItem(
          "flash",
          `Se guardaron los cambios, pero no se pudo publicar: ${describe(pubErr, "error del servidor")}`
        );
        router.push("/projects/my-projects");
      }
    } catch (err) {
      setError(describe(err, "No se pudieron guardar los cambios."));
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <p className="text-center mt-20 font-bold text-gray-700">Cargando...</p>;

  if (status && status !== "DRAFT" && status !== "ACTIVE") {
    return (
      <main className="max-w-lg mx-auto mt-12 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-red-500 text-center">
        <p className="text-lg font-semibold text-gray-900 mb-6">
          Este proyecto ya no puede ser modificado
        </p>
        <Link href="/projects/my-projects" className="text-indigo-700 font-semibold hover:underline">
          ← Volver a mis proyectos
        </Link>
      </main>
    );
  }

  const inputCls =
    "border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-base disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed";
  const busy = saving !== null;

  return (
    <main className="max-w-lg mx-auto mt-12 mb-10 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-600">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
        {isActive ? "Editar proyecto" : "Editar borrador"}
      </h1>
      <p className="text-gray-700 mb-6 text-sm">
        {isActive
          ? "Puedes actualizar el título, la descripción y la imagen. El riesgo se recalculará al guardar."
          : "Actualiza los datos y guárdalos, o publica el proyecto directamente."}
      </p>

      <form onSubmit={(e) => e.preventDefault()} noValidate className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Título del proyecto *"
          value={form.title}
          onChange={(e) => update({ title: e.target.value })}
          className={inputCls}
        />
        <textarea
          placeholder="Descripción * (150+ caracteres mejoran el puntaje de riesgo)"
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          className={`${inputCls} min-h-28`}
        />
        <input
          type="url"
          placeholder="URL de imagen (opcional, mejora el puntaje)"
          value={form.imageUrl}
          onChange={(e) => update({ imageUrl: e.target.value })}
          className={inputCls}
        />
        <input
          type="number"
          placeholder="Meta de recaudación ($) *"
          value={form.fundingGoal}
          onChange={(e) => update({ fundingGoal: e.target.value })}
          className={inputCls}
          min={1}
          step="0.01"
          disabled={isActive}
        />
        <label className="text-sm text-gray-700">
          Fecha límite *
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => update({ deadline: e.target.value })}
            className={`${inputCls} w-full mt-1`}
            disabled={isActive}
          />
        </label>
        {isActive && (
          <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
            La meta y el plazo no pueden modificarse una vez el proyecto está activo
          </p>
        )}

        {error && (
          <p className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm font-semibold">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={busy}
            className="flex-1 bg-gray-200 text-gray-900 font-bold rounded-lg p-3 hover:bg-gray-300 disabled:opacity-50"
          >
            {saving === "save" ? "Guardando..." : "Guardar cambios"}
          </button>
          {!isActive && (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={busy}
              className="flex-1 bg-indigo-600 text-white font-bold rounded-lg p-3 hover:bg-indigo-700 shadow-md disabled:opacity-50"
            >
              {saving === "publish" ? "Publicando..." : "Guardar y publicar"}
            </button>
          )}
        </div>

        <Link href="/projects/my-projects" className="text-indigo-700 font-semibold hover:underline text-center">
          ← Cancelar
        </Link>
      </form>
    </main>
  );
}