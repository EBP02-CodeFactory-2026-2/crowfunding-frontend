"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { isAuthenticated, removeToken } from "@/lib/auth";
import { CONTRIBUTION_STATUS } from "@/lib/format";
import { downloadReceiptPdf, receiptRows } from "@/lib/receipt";
import type { ApiError, Receipt } from "@/types";

type View = "loading" | "ok" | "unavailable" | "forbidden" | "notfound" | "error";

export default function ReceiptPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<View>("loading");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    apiFetch<Receipt>(`/contributions/me/${id}/receipt`, {}, true)
      .then((data) => {
        if (cancelled) return;
        setReceipt(data);
        setView("ok");
      })
      .catch((e: ApiError) => {
        if (cancelled) return;
        if (e.status === 401) {
          removeToken();
          router.replace("/login");
          return;
        }
        if (e.status === 409) setView("unavailable");
        else if (e.status === 403) setView("forbidden");
        else if (e.status === 404) setView("notfound");
        else {
          setMessage(e.message);
          setView("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function handleDownload() {
    if (!receipt) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadReceiptPdf(receipt);
    } catch {
      setDownloadError("No se pudo generar el comprobante. Intenta de nuevo.");
    } finally {
      setDownloading(false);
    }
  }

  const badge = receipt ? CONTRIBUTION_STATUS[receipt.status] : null;

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
      <p className="text-sm font-semibold text-indigo-700">Mis aportes / Comprobante</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
        <h1 className="text-3xl font-extrabold text-gray-900">Comprobante de aporte</h1>
        {badge && (
          <span className={`inline-block px-3 py-1 text-sm font-bold border rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-base text-gray-700 mt-2">
        Consulta y descarga el comprobante de tu contribución.
      </p>

      <div className="grid gap-6 md:grid-cols-3 mt-6">
        <section className="md:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          {view === "loading" && <p className="text-base text-gray-700">Cargando comprobante...</p>}

          {view === "ok" && receipt && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detalle del comprobante</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-900">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800">
                      <th scope="col" className="px-4 py-3 font-semibold">Campo</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Información</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptRows(receipt).map(([label, value]) => (
                      <tr key={label} className="border-b border-gray-100">
                        <td className="px-4 py-3">{label}</td>
                        <td className="px-4 py-3 font-medium">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {downloadError && (
                <p role="alert" className="mt-4 bg-red-50 text-red-900 border border-red-300 rounded-lg p-3 text-sm">
                  {downloadError}
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {downloading ? "Generando..." : "Descargar comprobante"}
                </button>
                {backLink}
              </div>
            </>
          )}

          {view === "unavailable" && (
            <>
              <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-base font-bold text-red-900">
                  No hay comprobante disponible para este aporte
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  Solo los aportes aprobados cuentan con comprobante descargable.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  type="button"
                  disabled
                  className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-semibold cursor-not-allowed"
                >
                  Descargar comprobante
                </button>
                {backLink}
              </div>
            </>
          )}

          {(view === "forbidden" || view === "notfound" || view === "error") && (
            <>
              <div role="alert" className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-base font-bold text-red-900">
                  {view === "forbidden" && "No autorizado"}
                  {view === "notfound" && "El aporte no existe"}
                  {view === "error" && "No se pudo cargar el comprobante"}
                </p>
                <p className="text-sm text-gray-800 mt-1">
                  {view === "forbidden" && "Solo puedes consultar los comprobantes de tus propios aportes."}
                  {view === "notfound" && "Revisa el enlace o vuelve a tu historial de aportes."}
                  {view === "error" && message}
                </p>
              </div>
              <div className="mt-6">{backLink}</div>
            </>
          )}
        </section>

        <aside className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900">Información del comprobante</h2>
          <p className="text-sm text-gray-700 mt-3">
            Por seguridad, solo se muestran los últimos cuatro dígitos de la tarjeta.
          </p>
          <p className="text-sm text-gray-700 mt-3">
            Puedes guardar este documento como constancia del aporte.
          </p>
          <div className="bg-indigo-50 rounded-lg p-4 mt-4">
            <p className="text-sm font-bold text-indigo-900">Tus datos de pago</p>
            <p className="text-sm text-gray-800 mt-1">
              Solo puedes descargar comprobantes de tus propios aportes.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}