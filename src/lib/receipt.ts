import { CONTRIBUTION_STATUS, formatDateTime, formatMoney } from "@/lib/format";
import type { Receipt } from "@/types";

export function receiptRows(r: Receipt): [string, string][] {
  const t = r.transactionDetails;
  return [
    ["Número de transacción", t.referenceCode],
    ["Número de comprobante", r.receiptId],
    ["Fecha y hora", formatDateTime(t.processedAt)],
    ["Proyecto", r.projectName],
    ["Monto", formatMoney(r.amount)],
    ["Estado", CONTRIBUTION_STATUS[r.status].label],
    ["Medio de pago", t.paymentMethod.replace("SIMULATED_CARD", "Tarjeta simulada")],
  ];
}

// Quita espacios especiales que el PDF no sabe dibujar
const clean = (s: string) => s.replace(/[\u00A0\u202F]/g, " ");

export async function downloadReceiptPdf(r: Receipt): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FundDreams - Comprobante de aporte", 20, 25);

  doc.setFontSize(12);
  const rows = receiptRows(r);
  rows.forEach(([label, value], i) => {
    const y = 50 + i * 12;
    doc.setFont("helvetica", "bold");
    doc.text(clean(label), 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(clean(value), 80, y, { maxWidth: 110 });
  });

  doc.setFontSize(10);
  doc.text(
    clean(`Generado el ${formatDateTime(r.generatedAt)}`),
    20,
    50 + rows.length * 12 + 10
  );

  doc.save(`comprobante-${r.transactionDetails.referenceCode}.pdf`);
}