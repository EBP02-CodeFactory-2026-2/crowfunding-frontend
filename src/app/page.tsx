import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold">CrowdFunding</h1>
      <p className="text-gray-500 max-w-md">
        Apoya proyectos o crea el tuyo propio. Financiación colectiva simple
        y transparente.
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="bg-black text-white rounded p-3 px-6"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="border border-black rounded p-3 px-6"
        >
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}