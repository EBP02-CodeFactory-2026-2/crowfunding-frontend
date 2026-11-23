"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { isAuthenticated, removeToken } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import type { ApiError, Project } from "@/types";

type MyProjectRow = { id: string; backersCount?: number };
type View = "loading" | "ok" | "notOwner" | "notClosed" | "notfound" | "error";

export default function ClosureReportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<View>("loading");
  const [message, setMessage] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [backers, setBackers] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const mine = await apiFetch<MyProjectRow[]>("/projects/me", {}, true);
        if (cancelled) return;

        const row = (mine ?? []).find((p) => p.id === id);
        if (!row) {
          setView("notOwner");
          return;
        }
        setBackers(row.backersCount ?? 0);

        const p = await apiFetch<Project>(`/projects/${id}`);
        if (cancelled) return;
        setProject(p);

        const st = p.status as string;
        setView(st === "FUNDED" || st === "FAILED" ? "ok" : "notClosed");
      } catch (e) {
        if (cancelled) return;
        const err = e as ApiError;
        if (err.status === 401) {
          removeToken();
          router.replace("/login");
          return;
        }
        if (err.status === 404) {
          setView("notfound");
          return;
        }
        setMessage(err.message);
        setView("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const funded = (project?.status as string) === "FUNDED";
  const raised = project?.currentAmount ?? 0;
  const goal = project?.fundingGoal ?? 0;
  const percent = goal > 0 ? Math.floor((raised / goal) * 100) : 0;
  const barWidth = Math.min(percent, 100);

  const closedOn = project?.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "No disponible";

  const backLink = (
    <Link
      href="/projects/my-projects"
      className="inline-block border border-indigo-300 text-indigo-700 px-5 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
    >
      Volver a mis proyectos
    </Link>
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <p className="text-sm font-semibold text-indigo-700">Mis proyectos / Reporte de cierre</p>
      <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Reporte de cierre</h1>
      <p className="text-base text-gray-700 mt-2">
        {view === "ok" && funded && "Resultados finales de la campaña que creaste."}
        {view === "ok" && !funded && "Resultados de una campaña que terminó sin financiarse."}
        {view !== "ok" && "Resumen del cierre de tu campaña."}
      </p>

      {view === "loading" && <p className="text-base text-gray-700 mt-6">Cargando reporte...</p>}

      {view !== "loading" && view !== "ok" && (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mt-6">
          <p role="alert" className="bg-yellow-50 text-yellow-900 border border-yellow-300 rounded-lg p-4 text-base font-bold">
            {view === "notOwner" && "No autorizado: solo el creador puede ver este reporte"}
            {view === "notClosed" &&
              "El reporte de cierre estará disponible cuando el proyecto finalice o caduque"}
            {view === "notfound" && "El proyecto no existe"}
            {view === "error" && (message || "No se pudo cargar el reporte")}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {view === "notClosed" && (
              <Link
                href={`/projects/${id}`}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Ver proyecto
              </Link>
            )}
            {backLink}
          </div>
        </section>
      )}

      {view === "ok" && project && (
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <section className="md:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
              <span
                className={`inline-block px-3 py-1 text-sm font-bold border rounded-full ${
                  funded
                    ? "bg-green-100 text-green-900 border-green-300"
                    : "bg-red-100 text-red-900 border-red-300"
                }`}
              >
                {funded ? "Finalizado con éxito" : "Caducado"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">{funded ? "Monto final" : "Monto recaudado"}</p>
                <p className="text-xl font-extrabold text-gray-900">{formatMoney(raised)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">{funded ? "Meta" : "Meta alcanzada"}</p>
                <p className="text-xl font-extrabold text-gray-900">
                  {funded ? formatMoney(goal) : `${percent}%`}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">Patrocinadores</p>
                <p className="text-xl font-extrabold text-gray-900">{backers}</p>
              </div>
            </div>

            <div
              className="w-full bg-gray-200 rounded-full h-3 mb-6"
              role="progressbar"
              aria-valuenow={barWidth}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Porcentaje de la meta alcanzado"
            >
              <div className="bg-indigo-600 h-3 rounded-full" style={{ width: `${barWidth}%` }} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-900">
                <thead>
                  <tr className="bg-gray-100 text-gray-800">
                    <th scope="col" className="px-4 py-3 font-semibold">Indicador</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">Fecha de cierre</td>
                    <td className="px-4 py-3 font-medium">{closedOn}</td>
                  </tr>
                  {!funded && (
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-3">Meta total</td>
                      <td className="px-4 py-3 font-medium">{formatMoney(goal)} COP</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">Resultado</td>
                    <td className="px-4 py-3 font-medium">
                      {funded ? "Meta alcanzada" : "No alcanzó la meta"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">Estado</td>
                    <td className="px-4 py-3 font-medium">
                      {funded ? "Finalizado con éxito" : "Caducado"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href={`/projects/${project.id}`}
                className="border border-indigo-300 text-indigo-700 px-5 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Volver al proyecto
              </Link>
              {backLink}
            </div>
          </section>

          <aside className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-900">Sobre el reporte</h2>
            <p className="text-sm text-gray-700 mt-3">
              {funded
                ? "Este proyecto terminó con éxito. Aquí puedes consultar la recaudación final y los datos de cierre."
                : "La campaña terminó sin alcanzar su meta. Aquí puedes consultar el resultado de la recaudación."}
            </p>
            <div className="bg-indigo-50 rounded-lg p-4 mt-4">
              <p className="text-sm font-bold text-indigo-900">
                {funded ? "Resultado final" : "Estado final"}
              </p>
              <p className="text-sm text-gray-800 mt-1">
                {funded
                  ? "El reporte resume el cierre de la campaña."
                  : "La campaña figura como Caducada."}
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}