"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Project, ApiError } from "@/types";
import RiskLabel from "@/components/RiskLabel";

// Fila que devuelve GET /projects/me (solo usamos estos campos)
type MyProjectRow = {
  id: string;
  currentAmount?: number;
  backersCount?: number;
};

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

  async function handleSupport() {
    setThanks(false);

    if (!getToken()) {
      router.push("/login");
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
            paymentMethod: "CARD",
            nonce: crypto.randomUUID(),
          }),
        },
        true
      );
      const updated = await apiFetch<Project>(`/projects/${id}`);
      setProject(updated);
      setAmount("");
      setThanks(true);
    } catch (err) {
      setAmountError((err as ApiError).message || "No se pudo procesar el aporte.");
    } finally {
      setSupporting(false);
    }
  }

  if (loading)
    return <div className="text-center mt-20 font-bold text-gray-700">Cargando proyecto...</div>;
  if (!project)
    return <div className="text-center mt-20 text-gray-700">Proyecto no encontrado.</div>;

  const raised = project.currentAmount ?? 0;
  const goal = project.fundingGoal ?? 0;
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  return (
    <main className="max-w-4xl mx-auto p-8 mt-10 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-600 mb-10">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
        <h1 className="text-4xl font-extrabold text-gray-900">{project.title}</h1>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-900">
            {project.status}
          </span>
          {project.status === "ACTIVE" && <RiskLabel tag={project.riskTag} />}
        </div>
      </div>

      {project.imageUrl && (
        <img
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-72 object-cover rounded-xl mb-8"
        />
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

      {project.status === "ACTIVE" && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8">
          <h3 className="text-xl font-bold text-indigo-900 mb-4">Apoyar esta campaña</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 w-full">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ingresa tu aporte ($, mínimo 10.000)"
                className={`w-full p-3 border rounded-lg text-base outline-none focus:ring-2 focus:ring-indigo-500 ${
                  amountError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {amountError && (
                <p className="text-red-700 text-sm mt-1 font-semibold">{amountError}</p>
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
    </main>
  );
}