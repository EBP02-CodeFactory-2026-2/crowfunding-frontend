"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { isAuthenticated, removeToken } from "@/lib/auth";
import { CONTRIBUTION_STATUS, formatDateTime, formatMoney } from "@/lib/format";
import type { ApiError, Contribution, Project } from "@/types";

type View = "loading" | "ok" | "notfound" | "error";

const CAMPAIGN_LABEL: Record<string, string> = {
  ACTIVE: "Activa",
  FUNDED: "Finalizada",
  FAILED: "Caducada",
};

const RESULT_LABEL: Record<string, string> = {
  ACTIVE: "En curso",
  FUNDED: "Éxito",
  FAILED: "No alcanzó la meta",
};

export default function ContributionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<View>("loading");
  const [message, setMessage] = useState("");
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const list = await apiFetch<Contribution[]>("/contributions/me", {}, true);
        if (cancelled) return;

        const found = (list ?? []).find((c) => c.id === id);
        if (!found) {
          setView("notfound");
          return;
        }
        setContribution(found);

        try {
          const p = await apiFetch<Project>(`/projects/${found.projectId}`);
          if (!cancelled) setProject(p);
        } catch {
          // si el proyecto no carga, mostramos el aporte igualmente
        }

        if (!cancelled) setView("ok");
      } catch (e) {
        if (cancelled) return;
        const err = e as ApiError;
        if (err.status === 401) {
          removeToken();
          router.replace("/login");
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

  const badge = contribution ? CONTRIBUTION_STATUS[contribution.status] : null;
  const pStatus = (project?.status as string | undefined) ?? "";
  const refunded = contribution?.status === "REFUNDED";
  const cancelled = contribution?.status === "CANCELLED";
  const fundedNoRefund = !refunded && !cancelled && pStatus === "FUNDED";

  const backLink = (
    <Link
      href="/contributions"
      className="inline-block border border-indigo-300 text-indigo-700 px-5 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
    >
      Volver a mis aportes
    </Link>
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <p className="text-sm font-semibold text-indigo-700">Mis aportes / Detalle</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
        <h1 className="text-3xl font-extrabold text-gray-900">Detalle de mi aporte</h1>
        {badge && (
          <span className={`inline-block px-3 py-1 text-sm font-bold border rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>

      {view === "loading" && <p className="text-base text-gray-700 mt-6">Cargando aporte...</p>}

      {(view === "notfound" || view === "error") && (
        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mt-6">
          <p role="alert" className="bg-red-50 text-red-900 border border-red-300 rounded-lg p-4 text-base font-bold">
            {view === "notfound" ? "No encontramos este aporte en tu historial" : message}
          </p>
          <div className="mt-6">{backLink}</div>
        </section>
      )}

      {view === "ok" && contribution && (
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <section className="md:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detalle de tu aporte</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">Aporte</p>
                <p className="text-xl font-extrabold text-gray-900">{formatMoney(contribution.amount)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">Campaña</p>
                <p className="text-xl font-extrabold text-gray-900">
                  {CAMPAIGN_LABEL[pStatus] ?? "No disponible"}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">Resultado</p>
                <p className="text-xl font-extrabold text-gray-900">
                  {RESULT_LABEL[pStatus] ?? "No disponible"}
                </p>
              </div>
            </div>

            {refunded && (
              <div role="status" className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
                <p className="text-base font-bold text-blue-900">Tu aporte fue reembolsado</p>
                <p className="text-sm text-gray-800 mt-1">
                  El aporte figura como Reembolsado. No se realizará otra devolución por el
                  mismo pago.
                </p>
              </div>
            )}

            {fundedNoRefund && (
              <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
                <p className="text-base font-bold text-red-900">
                  Este proyecto fue financiado con éxito, el aporte no es reembolsable
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  La opción de reembolso no está disponible para este aporte.
                </p>
              </div>
            )}

            {!refunded && !cancelled && pStatus === "FAILED" && (
              <div role="status" className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                <p className="text-base font-bold text-yellow-900">
                  La campaña caducó: tu aporte será reembolsado
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  El reembolso es automático y puede tardar hasta 10 minutos. Recibirás una
                  notificación cuando se complete.
                </p>
              </div>
            )}

            {!refunded && !cancelled && pStatus === "ACTIVE" && (
              <div role="status" className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <p className="text-base font-bold text-indigo-900">La campaña sigue activa</p>
                <p className="text-sm text-gray-800 mt-1">
                  Si no alcanza su meta antes de la fecha límite, tu aporte será reembolsado
                  automáticamente.
                </p>
              </div>
            )}

            {cancelled && (
              <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
                <p className="text-base font-bold text-red-900">Este aporte no se completó</p>
                <p className="text-sm text-gray-800 mt-1">
                  Realizado el {formatDateTime(contribution.createdAt)}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {fundedNoRefund && (
                <button
                  type="button"
                  disabled
                  className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-semibold cursor-not-allowed"
                >
                  Solicitar reembolso
                </button>
              )}
              {!cancelled && (
                <Link
                  href={`/contributions/${contribution.id}/receipt`}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Ver comprobante
                </Link>
              )}
              <Link
                href={`/projects/${contribution.projectId}`}
                className="border border-indigo-300 text-indigo-700 px-5 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Ver proyecto
              </Link>
              {backLink}
            </div>
          </section>

          <aside className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-900">Información del aporte</h2>
            <p className="text-sm text-gray-700 mt-3">Proyecto: {contribution.projectName}</p>
            <p className="text-sm text-gray-700 mt-3">
              Realizado el {formatDateTime(contribution.createdAt)}
            </p>
            <p className="text-sm text-gray-700 mt-3">
              Los aportes de campañas exitosas no son reembolsables.
            </p>
            <div className="bg-indigo-50 rounded-lg p-4 mt-4">
              <p className="text-sm font-bold text-indigo-900">Aporte protegido</p>
              <p className="text-sm text-gray-800 mt-1">
                Solo tú puedes consultar los datos de tus aportes.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}