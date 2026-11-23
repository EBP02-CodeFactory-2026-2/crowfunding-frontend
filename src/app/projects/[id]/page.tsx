"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { Project, ApiError } from "@/types";
import RiskLabel from "@/components/RiskLabel";

// Fila que devuelve GET /projects/me (solo usamos estos campos)
type MyProjectRow = {
  id: string;
  currentAmount?: number;
  backersCount?: number;
};

type ModalKind = "risk" | "closed" | "mustConfirm" | null;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  FUNDED: "Finalizado con éxito",
  FAILED: "Caducado",
  DELETED: "Eliminado",
};

const STATUS_CLS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ACTIVE: "bg-indigo-100 text-indigo-900",
  FUNDED: "bg-green-100 text-green-900",
  FAILED: "bg-red-100 text-red-900",
  DELETED: "bg-gray-100 text-gray-800",
};

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
      >
        <h2 id="modal-title" className="text-2xl font-extrabold text-red-900">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [supporting, setSupporting] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("SIMULATED_CARD");
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [myStats, setMyStats] = useState<{
    currentAmount: number;
    backersCount: number;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    apiFetch<Project>(`/projects/${id}`)
      .then((p) => setProject((p.status as string) === "DELETED" ? null : p))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  // Si el proyecto es del usuario con sesión iniciada, trae sus estadísticas
  useEffect(() => {
    if (!id || !getToken()) return;
    apiFetch<MyProjectRow[]>("/projects/me", {}, true)
      .then((mine) => {
        const row = (mine ?? []).find((p) => p.id === id);
        if (row) {
          setMyStats({
            currentAmount: row.currentAmount ?? 0,
            backersCount: row.backersCount ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [id]);

  const closeModal = () => setModal(null);

  function handleRiskSupportClick() {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setModal("risk");
  }

  function confirmRisk() {
    setRiskAccepted(true);
    setModal(null);
  }

  async function handleSupport() {
    setThanks(false);

    if (!getToken()) {
      router.push("/login");
      return;
    }

    const isHighRisk =
      project?.status === "ACTIVE" && /ALT|HIGH/i.test(project?.riskTag ?? "");
    if (isHighRisk && !riskAccepted) {
      setModal("mustConfirm");
      return;
    }

    const value = Number(amount);
    if (!value || value <= 0) {
      setAmountError("Por favor, ingresa un monto válido");
      return;
    }
    if (value < 10000) {
      setAmountError("El aporte mínimo es de $10.000");
      return;
    }

    setAmountError(null);
    setSupporting(true);
    try {
      await apiFetch(
        `/projects/${id}/contributions`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: value,
            paymentMethod,
            nonce: crypto.randomUUID(),
            riskWarningAccepted: riskAccepted,
          }),
        },
        true
      );
      const updated = await apiFetch<Project>(`/projects/${id}`);
      setProject(updated);
      setAmount("");
      setThanks(true);
    } catch (err) {
      const e = err as ApiError;

      // 403: puede ser proyecto cerrado u otra regla (por ejemplo, aportar al propio)
      if (e.status === 403) {
        try {
          const fresh = await apiFetch<Project>(`/projects/${id}`);
          setProject(fresh);
          if (fresh.status === "FUNDED" || fresh.status === "FAILED") {
            setModal("closed");
            return;
          }
        } catch {
          // si falla, mostramos el mensaje del servidor más abajo
        }
      }

      // 400 por no confirmar la advertencia de riesgo
      if (e.status === 400 && /advertencia/i.test(e.message ?? "")) {
        setRiskAccepted(false);
        setModal("mustConfirm");
        return;
      }

      setAmountError(e.message || "No se pudo procesar el aporte.");
    } finally {
      setSupporting(false);
    }
  }

  if (loading)
    return <div className="text-center mt-20 font-bold text-gray-700">Cargando proyecto...</div>;
  if (!project)
    return <div className="text-center mt-20 text-gray-700">Proyecto no encontrado.</div>;

  const status = project.status as string;
  const isClosed = status === "FUNDED" || status === "FAILED";
  const highRisk = status === "ACTIVE" && /ALT|HIGH/i.test(project.riskTag ?? "");

  const raised = project.currentAmount ?? 0;
  const goal = project.fundingGoal ?? 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  const closedOn = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No disponible";

  return (
    <main className="max-w-4xl mx-auto p-8 mt-10 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-600 mb-10">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
        <h1 className="text-4xl font-extrabold text-gray-900">{project.title}</h1>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              STATUS_CLS[status] ?? "bg-gray-100 text-gray-800"
            }`}
          >
            {STATUS_LABEL[status] ?? status}
          </span>
          {status === "ACTIVE" && <RiskLabel tag={project.riskTag} />}
        </div>
      </div>

      {project.imageUrl && (
        <img
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-72 object-cover rounded-xl mb-8"
        />
      )}

      {isClosed && (
        <section aria-label="Resultado de la campaña" className="mb-8">
          <div
            role="status"
            className={`rounded-xl border p-4 mb-4 ${
              status === "FUNDED"
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <p
              className={`text-lg font-bold ${
                status === "FUNDED" ? "text-green-900" : "text-red-900"
              }`}
            >
              {status === "FUNDED"
                ? "Proyecto finalizado: meta alcanzada"
                : "Proyecto caducado: no alcanzó su meta"}
            </p>
            <p className="text-sm text-gray-800 mt-1">
              {status === "FUNDED"
                ? "La campaña terminó automáticamente al completar su meta."
                : "La fecha límite llegó antes de completar la recaudación."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">Monto recaudado</p>
              <p className="text-xl font-extrabold text-gray-900">{formatMoney(raised)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">Meta</p>
              <p className="text-xl font-extrabold text-gray-900">{formatMoney(goal)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">Fecha de cierre</p>
              <p className="text-xl font-extrabold text-gray-900">{closedOn}</p>
            </div>
          </div>

          {status === "FAILED" && (
            <p className="text-base text-gray-800 mb-4">
              La campaña alcanzó el {Math.floor(progress)}% de la meta.
            </p>
          )}

          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4">
            <p className="text-base font-bold text-yellow-900">
              Esta campaña ya no recibe aportes
            </p>
            <p className="text-sm text-gray-800 mt-1">
              {status === "FUNDED"
                ? "Aportes deshabilitados; no se procesarán nuevos pagos."
                : "No se aceptan transacciones en proyectos caducados."}
            </p>
          </div>

          <button
            type="button"
            disabled
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold cursor-not-allowed"
          >
            Apoyar proyecto
          </button>
        </section>
      )}

      <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-100">
        <div className="flex justify-between text-lg font-bold text-gray-800 mb-2">
          <span>Recaudado: ${raised.toLocaleString()}</span>
          <span>Meta: ${goal.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-700 mt-2 text-right">
          {progress.toFixed(1)}% completado
        </p>
      </div>

      {myStats && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-amber-900 mb-3">
            Estadísticas de tu campaña{" "}
            <span className="text-sm font-normal">(solo las ves tú)</span>
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-gray-900">
                ${myStats.currentAmount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-700">Recaudado</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">
                {progress.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-700">De la meta</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">
                {myStats.backersCount}
              </p>
              <p className="text-sm text-gray-700">Aportantes</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Acerca de este proyecto</h2>
        <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Proyecto de riesgo alto: primero hay que confirmar la advertencia */}
      {highRisk && !riskAccepted && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-300 mb-8">
          <h3 className="text-xl font-bold text-red-900 mb-2">Antes de aportar</h3>
          <p className="text-base text-gray-800 mb-4">
            Este proyecto tiene un nivel de riesgo alto. Debes confirmar que conoces el
            riesgo para poder aportar.
          </p>
          <button
            type="button"
            onClick={handleRiskSupportClick}
            className="bg-green-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors shadow-md"
          >
            Apoyar
          </button>
        </div>
      )}

      {/* Formulario de aporte: riesgo medio/bajo directo; riesgo alto tras confirmar */}
      {status === "ACTIVE" && (!highRisk || riskAccepted) && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8">
          <h3 className="text-xl font-bold text-indigo-900 mb-4">Apoyar esta campaña</h3>
          {highRisk && riskAccepted && (
            <p className="text-sm font-semibold text-indigo-900 mb-3">
              Confirmaste que conoces el riesgo del proyecto.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
              <label htmlFor="paymentMethod" className="block text-sm font-semibold text-indigo-900 mb-1">
                Método de pago
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-base mb-3 bg-white text-gray-900"
              >
                <option value="SIMULATED_CARD">Tarjeta (simulada)</option>
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Monto del aporte"
                placeholder="Ingresa tu aporte ($, mínimo 10.000)"
                className={`w-full p-3 border rounded-lg text-base outline-none focus:ring-2 focus:ring-indigo-500 ${
                  amountError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {amountError && (
                <p role="alert" className="text-red-700 text-sm mt-1 font-semibold">
                  {amountError}
                </p>
              )}
              {thanks && (
                <p className="text-green-800 text-sm mt-1 font-semibold">
                  ¡Gracias por tu apoyo!
                </p>
              )}
            </div>
            <button
              onClick={handleSupport}
              disabled={supporting}
              className="bg-green-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-800 transition-colors shadow-md disabled:opacity-50"
            >
              {supporting ? "Procesando..." : "Apoyar"}
            </button>
          </div>
        </div>
      )}

      <Link href="/" className="text-indigo-700 font-semibold hover:underline">
        ← Volver
      </Link>

      {modal === "risk" && (
        <Modal title="Este proyecto tiene riesgo alto" onClose={closeModal}>
          <p className="text-base text-gray-800 mt-3">
            Antes de aportar, confirma que comprendes el riesgo. Puedes regresar al
            proyecto o confirmar que comprendes el riesgo.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              autoFocus
              onClick={closeModal}
              className="border border-indigo-300 text-indigo-700 px-5 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmRisk}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Entiendo el riesgo, continuar
            </button>
          </div>
        </Modal>
      )}

      {modal === "closed" && (
        <Modal title="Esta campaña ya no recibe aportes" onClose={closeModal}>
          <p className="text-base text-gray-800 mt-3">
            El proyecto ya está {project.status === "FUNDED" ? "finalizado" : "caducado"} y
            no es posible procesar tu aporte. No se realizó ningún cobro.
          </p>
          <div className="mt-6">
            <button
              type="button"
              autoFocus
              onClick={closeModal}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Volver al proyecto
            </button>
          </div>
        </Modal>
      )}

      {modal === "mustConfirm" && (
        <Modal title="Debes confirmar la advertencia de riesgo antes de aportar" onClose={closeModal}>
          <p className="text-base text-gray-800 mt-3">
            No puedes continuar con el aporte sin aceptar primero la advertencia de este
            proyecto.
          </p>
          <div className="mt-6">
            <button
              type="button"
              autoFocus
              onClick={closeModal}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Volver al proyecto
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}