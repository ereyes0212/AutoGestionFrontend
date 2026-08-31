"use client";

import { PedidoInsumo } from "@/app/(protected)/inventario/insumos/pedidos/types";
import { useEffect, useState } from "react";

/**
 * Genera el PDF del pedido para llevarlo a autorización, con el mismo
 * enfoque que los reportes de insumos (jsPDF + autoTable).
 */
export default function PedidoPrint({ pedido }: { pedido: PedidoInsumo }) {
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const generarPDF = async () => {
      try {
        const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);

        if (cancelado) return;

        const doc = new JsPDF({ orientation: "portrait" });

        doc.setFontSize(16);
        doc.text("Pedido de insumos", 14, 16);

        doc.setFontSize(12);
        doc.text(`#${pedido.numero}`, 196, 16, { align: "right" });

        doc.setFontSize(10);
        doc.text(`Ciudad: ${pedido.ciudadNombre}`, 14, 24);
        doc.text(`Fecha: ${pedido.fechaSolicitudLabel}`, 14, 29);
        doc.text(`Solicitado por: ${pedido.solicitadoPor}`, 14, 34);

        let cursorY = 40;
        if (pedido.observaciones) {
          const observaciones = doc.splitTextToSize(
            `Observaciones: ${pedido.observaciones}`,
            182
          );
          doc.text(observaciones, 14, cursorY);
          cursorY += observaciones.length * 5;
        }

        autoTable(doc, {
          startY: cursorY + 2,
          head: [["#", "Insumo", "Cantidad", "Stock actual", "Duró", "Observación"]],
          body: pedido.detalles.map((detalle, indice) => [
            String(indice + 1),
            detalle.insumoNombre,
            detalle.cantidadLabel,
            `${detalle.stockActual} (mín. ${detalle.stockMinimo})`,
            detalle.diasDesdePedidoAnterior !== null
              ? `${detalle.diasDesdePedidoAnterior} días (ped. #${detalle.pedidoAnteriorNumero})`
              : "Primera compra",
            detalle.observacion,
          ]),
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [41, 128, 185] },
          columnStyles: {
            0: { cellWidth: 10 },
            2: { cellWidth: 30 },
            3: { cellWidth: 28 },
            4: { cellWidth: 32 },
          },
        });

        const finalY =
          (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
          cursorY;

        doc.setFontSize(8);


        // Líneas de firma
        const firmaY = Math.min(finalY + 40, 260);
        doc.setDrawColor(0);
        doc.line(20, firmaY, 90, firmaY);
        doc.line(115, firmaY, 185, firmaY);

        doc.setFontSize(10);
        doc.text("Solicitado por", 55, firmaY + 5, { align: "center" });
        doc.text("Autorizado por", 150, firmaY + 5, { align: "center" });
        doc.setFontSize(9);
        doc.text(pedido.solicitadoPor, 55, firmaY + 11, { align: "center" });

        doc.save(`pedido_${pedido.numero}_${pedido.ciudadNombre}.pdf`);

        if (!cancelado) setListo(true);
      } catch (e) {
        console.error("Error al generar el PDF del pedido:", e);
        if (!cancelado) setError("No se pudo generar el PDF.");
      }
    };

    generarPDF();

    return () => {
      cancelado = true;
    };
  }, [pedido]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>
        {error ?? (listo ? `PDF del pedido #${pedido.numero} generado.` : "Generando PDF...")}
      </p>
    </div>
  );
}
