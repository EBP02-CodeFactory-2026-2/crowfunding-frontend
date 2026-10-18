"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { LoginRequest, LoginResponse } from "@/types";
import Link from "next/link";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequest>({
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
      const data = await apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });


      if (data.accessToken) {
        setToken(data.accessToken);
      }

      router.push("/");
    } catch (err: any) {

      setError(
        err.message && err.message !== "Error inesperado en el servidor." 
          ? err.message 
          : "Correo o contraseña incorrectos. Verifica tus datos."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-2xl border-t-4 border-indigo-600">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Bienvenido de nuevo</h1>
        <p className="text-gray-500 mt-2">Inicia sesión para continuar en FundDreams.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
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
          className="mt-2 w-full bg-black text-white font-bold rounded-lg py-3 hover:bg-gray-800 transition-colors shadow-md disabled:opacity-50"
        >
          {loading ? "Iniciando sesión..." : "Ingresar"}
        </button>
      </form>
      
      <p className="text-sm mt-6 text-center text-gray-600">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-indigo-600 font-bold hover:underline transition-colors">
          Regístrate aquí
        </Link>
      </p>
    </main>
  );
}