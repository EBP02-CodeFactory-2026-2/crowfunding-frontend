import type { ContributionStatus } from "@/types";

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const CONTRIBUTION_STATUS: Record<
  ContributionStatus,
  { label: string; cls: string }
> = {
  COMPLETED: { label: "Aprobado", cls: "bg-green-100 text-green-900 border-green-300" },
  REFUNDED: { label: "Reembolsado", cls: "bg-blue-100 text-blue-900 border-blue-300" },
  CANCELLED: { label: "Fallido", cls: "bg-red-100 text-red-900 border-red-300" },
  PENDING: { label: "Pendiente", cls: "bg-yellow-100 text-yellow-900 border-yellow-400" },
};
