"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { isAuthenticated, removeToken } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { ApiError, AppNotification } from "@/types";

const TYPE_INFO: Record<
  AppNotification["type"],
  { title: string; box: string; titleCls: string }
> = {
  PROJECT_FUNDED: {
    title: "¡La campaña finalizó con éxito!",
    box: "bg-green-50 border-green-300",
    titleCls: "text-green-900",
  },
  PROJECT_FAILED: {
    title: "Proyecto caducado: no alcanzó su meta",
    box: "bg-red-50 border-red-300",
    titleCls: "text-red-900",
  },
  REFUND_PROCESSED: {
    title: "Tu aporte fue reembolsado",
    box: "bg-blue-50 border-blue-300",
    titleCls: "text-blue-900",
  },
};

const DEFAULT_INFO = {
  title: "Nueva notificación",
  box: "bg-gray-50 border-gray-300",
  titleCls: "text-gray-900",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markError, setMarkError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    apiFetch<AppNotification[]>("/notifications/me", {}, true)
      .then((data) => {
        if (cancelled) return;
        const sorted = [...(data ?? [])].sort(
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
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function markAsRead(id: string) {
    setMarkError(null);
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PUT" }, true);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      setMarkError((e as ApiError).message || "No se pudo marcar como leída.");
    }
  }

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <p className="text-sm font-semibold text-indigo-700">Notificaciones / Cierre de campaña</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
        <h1 className="text-3xl font-extrabold text-gray-900">Notificaciones</h1>
        {unread > 0 && (
          <span className="inline-block px-3 py-1 text-sm font-bold border rounded-full bg-indigo-100 text-indigo-900 border-indigo-300">
            {unread} {unread === 1 ? "nueva" : "nuevas"}
          </span>
        )}
      </div>
      <p className="text-base text-gray-700 mt-2">
        Resultados de las campañas que creaste o apoyaste.
      </p>

      <div className="grid gap-6 md:grid-cols-3 mt-6">
        <section className="md:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          {loading && <p className="text-base text-gray-700">Cargando notificaciones...</p>}

          {!loading && error && (
            <p role="alert" className="bg-red-50 text-red-900 border border-red-300 rounded-lg p-4 text-base">
              {error}
            </p>
          )}

          {markError && (
            <p role="alert" className="bg-red-50 text-red-900 border border-red-300 rounded-lg p-3 text-sm mb-4">
              {markError}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-base font-bold text-indigo-900">No tienes notificaciones</p>
              <p className="text-sm text-gray-700 mt-1">
                Cuando una campaña que apoyaste o creaste se cierre, te avisaremos aquí.
              </p>
            </div>
          )}

          <ul className="space-y-4">
            {items.map((n) => {
              const info = TYPE_INFO[n.type] ?? DEFAULT_INFO;
              return (
                <li key={n.id} className={`rounded-xl border p-4 ${info.box}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={`text-lg font-bold ${info.titleCls}`}>{info.title}</p>
                    {!n.isRead && (
                      <span className="inline-block px-2 py-1 text-sm font-bold rounded-full bg-indigo-600 text-white">
                        Nueva
                      </span>
                    )}
                  </div>

                  <p className="text-base text-gray-900 mt-2">{n.message}</p>
                  <p className="text-sm text-gray-700 mt-1">{formatDateTime(n.createdAt)}</p>

                  {n.type === "PROJECT_FAILED" && (
                    <p className="text-sm text-gray-900 mt-3 font-semibold">
                      Tus aportes serán reembolsados. Consulta el estado de la devolución en el
                      historial de aportes.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    {n.type === "PROJECT_FUNDED" ? (
                      <Link
                        href="/"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Explorar campañas
                      </Link>
                    ) : (
                      <Link
                        href="/contributions"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Consultar mis aportes
                      </Link>
                    )}
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.id)}
                        className="border border-indigo-300 bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {items.length > 0 && (
            <p className="bg-indigo-50 text-gray-800 rounded-lg p-4 mt-6 text-sm">
              Información protegida: las alertas solo muestran el nombre del proyecto y montos
              totales; no exponen datos personales de otros patrocinadores.
            </p>
          )}
        </section>

        <aside className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900">Sobre estas notificaciones</h2>
          <p className="text-sm text-gray-700 mt-3">
            Recibes estos avisos por tu participación en cada proyecto.
          </p>
          <p className="text-sm text-gray-700 mt-3">
            Puedes marcarlas como leídas cuando ya las hayas revisado.
          </p>
          <div className="bg-indigo-50 rounded-lg p-4 mt-4">
            <p className="text-sm font-bold text-indigo-900">Tu privacidad</p>
            <p className="text-sm text-gray-800 mt-1">
              Estas alertas no muestran datos personales de otros patrocinadores.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}