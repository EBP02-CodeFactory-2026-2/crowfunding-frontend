"use client";

import { useEffect } from "react";

// Avisa antes de salir de una pantalla con cambios sin guardar.
export function useUnsavedChanges(
  isDirty: boolean,
  message = "Tienes cambios sin guardar. Si sales, se perderán. ¿Quieres salir de todas formas?"
) {
  useEffect(() => {
    if (!isDirty) return;

    // Cerrar la pestaña, recargar o escribir otra dirección
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Clic en cualquier enlace del sitio (barra de navegación, "Cancelar", etc.)
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest("a");
      if (!link || link.target === "_blank") return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [isDirty, message]);
}