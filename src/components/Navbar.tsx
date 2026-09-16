"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  function handleLogout() {
    clearToken();
    setIsLoggedIn(false);
    router.push("/login");
  }

  return (
    <nav className="flex justify-between items-center p-4 border-b">
      <Link href="/" className="font-bold text-lg">
        CrowdFunding
      </Link>

      <div className="flex gap-4 items-center text-sm">
        <Link href="/projects">Proyectos</Link>

        {isLoggedIn ? (
          <>
            <Link href="/projects/new">Crear proyecto</Link>
            <button onClick={handleLogout} className="underline">
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Registrarme</Link>
          </>
        )}
      </div>
    </nav>
  );
}