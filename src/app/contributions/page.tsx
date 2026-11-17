"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { isAuthenticated, removeToken } from "@/lib/auth";
import { CONTRIBUTION_STATUS, formatDateTime, formatMoney } from "@/lib/format";
import type { ApiError, Contribution } from "@/types";

type Filter = "ALL" | "COMPLETED" | "CANCELLED" | "REFUNDED";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "COMPLETED", label: "Aprobado" },
  { value: "CANCELLED", label: "Fallido" },
  { value: "REFUNDED", label: "Reembolsado" },
];

export default function MyContributionsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = filter === "ALL" ? "" : `?status=${filter}`;

    apiFetch<Contribution[]>(`/contributions/me${query}`, {}, true)
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setItems(sorted);
      })
      .catch((e: ApiError) => {
        if (cancelled) return;
        if (e.status === 401) {
          removeToken();
          router.replace("/login");
          return;
        }
        setError(e.status === 403 ? "No autorizado" : e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter, router]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <p className="text-sm font-semibold text-indigo-700">Mis aportes / Historial</p>
      <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Historial de aportes</h1>
      <p className="text-base text-gray-700 mt-2">
        Consulta tu historial y filtra las contribuciones por estado.
      </p>

      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mt-6">
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                filter === f.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-base text-gray-700">Cargando aportes...</p>}

        {!loading && error && (
          <p role="alert" className="bg-red-50 text-red-900 border border-red-300 rounded-lg p-4 text-base">
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-base font-bold text-indigo-900">
              {filter === "ALL"
                ? "Aún no has realizado aportes"
                : "No tienes aportes con este estado"}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {filter === "ALL"
                ? "Cuando realices un aporte, aparecerá aquí con su estado."
                : "Prueba con otro filtro para ver más aportes."}
            </p>
            {filter === "ALL" && (
              <Link
                href="/"
                className="inline-block mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Explorar proyectos
              </Link>
            )}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-900">
              <thead>
                <tr className="bg-gray-100 text-gray-800">
                  <th scope="col" className="px-4 py-3 font-semibold">Proyecto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Monto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha y hora</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const st = CONTRIBUTION_STATUS[c.status];
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/projects/${c.projectId}`)}
                      className="border-b border-gray-100 hover:bg-indigo-50 cursor-pointer"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/projects/${c.projectId}`}
                          className="font-semibold text-indigo-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.projectName}
                        </Link>
                      </td>
                      <td className="px-4 py-4">{formatMoney(c.amount)}</td>
                      <td className="px-4 py-4">{formatDateTime(c.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-sm font-bold border rounded-full ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="bg-indigo-50 text-gray-800 rounded-lg p-4 mt-6 text-sm">
          Este historial es privado y solo muestra los aportes asociados a tu cuenta.
          Selecciona un aporte para ver su proyecto.
        </p>
      </section>
    </main>
  );
}
