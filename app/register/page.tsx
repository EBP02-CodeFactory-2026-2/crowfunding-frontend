"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { RegisterRequest, RegisterResponse } from "@/types";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterRequest>({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch<RegisterResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      router.push("/login");
    } catch (err: any) {
      if (err.details && Array.isArray(err.details)) {
        const messages = err.details.map((d: any) => d.issue).join(" | ");
        setError(messages);
      } else {
        setError(err.message || "Ocurrió un error al registrarse. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-600">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Únete a FundDreams</h1>
        <p className="text-gray-500 mt-2">Crea tu cuenta para lanzar o apoyar proyectos.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-red-600 text-sm font-semibold">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-indigo-600 text-white font-bold rounded-lg py-3 hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>
      
      <p className="text-sm mt-6 text-center text-gray-600">
        ¿Ya tienes cuenta? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Inicia sesión aquí</Link>
      </p>
    </main>
  );
}