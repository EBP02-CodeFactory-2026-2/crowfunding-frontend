"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useUnsavedChanges } from "@/lib/useUnsavedChanges";
import { CreateProjectRequest, Project, ApiError } from "@/types";

type Mode = "DRAFT" | "ACTIVE";

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
  const [loadingMode, setLoadingMode] = useState<Mode | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push("/login");
    else setCheckingAuth(false);
  }, [router]);

  useUnsavedChanges(isDirty);

  function update(patch: Partial<CreateProjectRequest>) {
    setForm((f) => ({ ...f, ...patch }));
    setIsDirty(true);
  }

  async function save(mode: Mode) {
    setError(null);

    if (mode === "ACTIVE") {
      if (!form.title.trim() || !form.description.trim() || !form.fundingGoal || !form.deadline) {
        setError("Para publicar debes completar título, descripción, meta y fecha límite.");
        return;
      }
    } else if (!form.title.trim()) {
      setError("Ponle al menos un título al borrador.");
      return;
    } 

    setLoadingMode(mode);
    try {
      const payload: Record<string, unknown> = {};
      if (form.title.trim()) payload.title = form.title;
      if (form.description.trim()) payload.description = form.description;
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.fundingGoal) payload.fundingGoal = form.fundingGoal;
      if (form.deadline) payload.deadline = new Date(form.deadline).toISOString();


      const created = await apiFetch<Project>(
        "/projects",
        { method: "POST", body: JSON.stringify(payload) },
        true
      );
      setIsDirty(false);

      if (mode === "DRAFT") {
        sessionStorage.setItem("flash", "Borrador guardado con éxito");
        router.push("/projects/my-projects");
        return;
      }


      try {
        await apiFetch(`/projects/${created.id}/publish`, { method: "POST" }, true);
        router.push(`/projects/${created.id}`);
      } catch (pubErr) {
        const e = pubErr as ApiError;
        const reason = e.details?.map((d) => d.issue).join(" ");
        sessionStorage.setItem(
          "flash",
          `Se guardó como borrador, pero no se pudo publicar: ${[e.message, reason].filter(Boolean).join(": ") || "error del servidor"}`
        );
        router.push("/projects/my-projects");
      }
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401 || apiError.status === 403) {
        setError("Tu sesión no es válida o expiró. Cierra sesión e inicia de nuevo.");
      } else if (apiError.message?.includes("integridad")) {
        setError(
          "El servidor aún no acepta borradores incompletos. Completa título, descripción, meta y fecha límite para guardarlo."
        );
      } else if (apiError.details) {
        setError(apiError.details.map((d) => d.issue).join(" "));
      } else {
        setError(apiError.message || "Ocurrió un error al guardar el proyecto.");
      }
    } finally {
      setLoadingMode(null);
    }
  }

  if (checkingAuth) return null;

  const inputCls =
    "border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 text-base";
  const busy = loadingMode !== null;

  return (
    <main className="max-w-lg mx-auto mt-12 mb-10 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-600">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Lanza tu proyecto</h1>
      <p className="text-gray-700 mb-6 text-sm">
        Guárdalo como borrador para seguir después, o publícalo ahora.
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
          value={form.fundingGoal || ""}
          onChange={(e) => update({ fundingGoal: Number(e.target.value) })}
          className={inputCls}
          min={1}
          step="0.01"
        />
        <label className="text-sm text-gray-700">
          Fecha límite *
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => update({ deadline: e.target.value })}
            className={`${inputCls} w-full mt-1`}
          />
        </label>

        {error && (
          <p className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm font-semibold">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            type="button"
            onClick={() => save("DRAFT")}
            disabled={busy}
            className="flex-1 bg-gray-200 text-gray-900 font-bold rounded-lg p-3 hover:bg-gray-300 disabled:opacity-50"
          >
            {loadingMode === "DRAFT" ? "Guardando..." : "Guardar como borrador"}
          </button>
          <button
            type="button"
            onClick={() => save("ACTIVE")}
            disabled={busy}
            className="flex-1 bg-indigo-600 text-white font-bold rounded-lg p-3 hover:bg-indigo-700 shadow-md disabled:opacity-50"
          >
            {loadingMode === "ACTIVE" ? "Publicando..." : "Publicar ahora"}
          </button>
        </div>
      </form>
    </main>
  );
}