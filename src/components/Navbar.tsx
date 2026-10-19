"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Verifica si hay sesión activa cada vez que cambiamos de ruta
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-md w-full sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight">
          FundDreams
        </Link>
        
        {/* Menú de navegación */}
        <div className="flex gap-4 items-center">
          <Link href="/" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
            Explorar
          </Link>
          
          {isLoggedIn ? (
            <>
              <Link href="/projects/my-projects" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Mis Proyectos
              </Link>
              <Link href="/projects/new" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Crear Proyecto
              </Link>
              <button 
                onClick={handleLogout}
                className="ml-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}