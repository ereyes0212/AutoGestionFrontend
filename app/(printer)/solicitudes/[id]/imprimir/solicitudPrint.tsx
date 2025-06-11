'use client'

import { SolicitudPermiso } from "@/app/(protected)/solicitudes/type";
import { formatearFecha } from "@/lib/utils";
import jsPDF from "jspdf";
import { useEffect } from "react";

// Utilidad para centrar la imagen
function getCenteredCoords(pageWidth: number, pageHeight: number, imgWidth: number, imgHeight: number) {
    return {
        x: (pageWidth - imgWidth) / 2,
        y: (pageHeight - imgHeight) / 2,
    };
}

// Función para convertir la imagen pública a base64
async function getBase64FromUrl(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export default function ClientPrintView({ solicitud, usuario }: { solicitud: SolicitudPermiso; usuario: string }) {
    useEffect(() => {
        const generarPDF = async () => {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "pt",
                format: "letter"
            });

            // Cargar la imagen y centrarla
            const logoBase64 = await getBase64FromUrl("/logoTiempo.png");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgWidth = 400;
            const imgHeight = 400;
            const { x, y } = getCenteredCoords(pageWidth, pageHeight, imgWidth, imgHeight);

            if (logoBase64) {
                doc.addImage(
                    logoBase64,
                    "PNG",
                    x,
                    y,
                    imgWidth,
                    imgHeight,
                    undefined,
                    "NONE",
                    0.08 // opacity
                );
            }

            // Fecha y usuario
            doc.setFontSize(10);
            const now = new Date();
            const fechaHora = `${formatearFecha(now.toISOString())} - ${usuario}`;
            doc.text(fechaHora, 30, 30);

            // Encabezado
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("Medios Publicitarios S.A. de C.V.", 30, 60);
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");

            // Línea
            doc.setLineWidth(1);
            doc.setDrawColor(0, 0, 0);
            doc.line(30, 90, 580, 90);

            // Título
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("SOLICITUD DE VACACIONES", pageWidth / 2, 120, { align: "center" });

            // === MÓDULO 1: INFORMACIÓN PRINCIPAL ===
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            let yInfo = 150;
            const salto = 28;
            const left = 60;
            doc.setFont("helvetica", "bold");
            doc.text("Datos del empleado", left, yInfo - 8);
            doc.setFont("helvetica", "normal");
            yInfo += 10;
            doc.text(`Nombre del empleado:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${solicitud.nombreEmpleado}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;
            doc.text(`Puesto:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${solicitud.puesto}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;
            doc.text(`Fecha de solicitud:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${formatearFecha(solicitud.fechaSolicitud)}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;
            doc.text(`Periodo:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${solicitud.periodo}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;
            doc.text(`Días a gozar:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${solicitud.diasGozados || 0}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;
            doc.text(`Días restantes:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${solicitud.diasRestantes || 0}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;
            doc.text(`Fecha de goce de vacaciones:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${formatearFecha(solicitud.fechaInicio)}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;
            doc.text(`Fecha de fin de goce:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${formatearFecha(solicitud.fechaFin)}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;
            doc.text(`Fecha de presentacion:`, left, yInfo); doc.setFont("helvetica", "bold"); doc.text(`${formatearFecha(solicitud.fechaPresentacion || "")}`, left + 180, yInfo); doc.setFont("helvetica", "normal"); yInfo += salto;

            // Línea divisora después de fin de goce
            yInfo += salto + 10;
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.7);
            doc.line(left, yInfo, left + 420, yInfo);

            // === MÓDULO 2: ESTADO DE LA SOLICITUD ===
            const yEstado = yInfo + 40; // Bajamos un poco el bloque de estado
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.setDrawColor(0, 0, 0);
            doc.text("Estado de la solicitud:", left, yEstado);
            doc.rect(left + 140, yEstado - 10, 15, 15);
            if (solicitud.aprobado === true) doc.text("X", left + 144, yEstado + 2);
            doc.text("Aprobadas", left + 160, yEstado + 2);

            doc.rect(left + 250, yEstado - 10, 15, 15);
            if (solicitud.aprobado === false) doc.text("X", left + 254, yEstado + 2);
            doc.text("No Aprobadas", left + 270, yEstado + 2);

            // === SECCIÓN MOTIVO SOLO SI NO FUE APROBADA ===
            let yMotivo = yEstado + 50;
            if (solicitud.aprobado === false) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text("**En caso de no ser aprobadas el motivo es**", pageWidth / 2, yMotivo, { align: "center" });
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);

                // Buscar el primer comentario de las aprobaciones que tenga texto
                const motivo = (solicitud.aprobaciones || [])
                    .map(a => a.comentario)
                    .find(c => c && c.trim() !== "");

                if (motivo) {
                    doc.text(motivo, pageWidth / 2, yMotivo + 22, { align: "center", maxWidth: 480 });
                } else {
                    doc.text("Sin comentarios.", pageWidth / 2, yMotivo + 22, { align: "center" });
                }
                yMotivo += 40;
            }

            // === FIRMAS CENTRADAS Y SEPARADAS ===
            let yFirmas = (solicitud.aprobado === false ? yMotivo : yEstado + 50) + 40;
            const firmasWidth = 400;
            const firmasLeft = (pageWidth - firmasWidth) / 2;

            doc.setLineWidth(1);
            doc.setDrawColor(0, 0, 0);
            // Primera fila de firmas (más separadas)
            doc.line(firmasLeft, yFirmas, firmasLeft + 160, yFirmas); // Firma empleado
            doc.line(firmasLeft + 240, yFirmas, firmasLeft + 400, yFirmas); // Firma jefe inmediato
            doc.text("Firma del empleado", firmasLeft + 20, yFirmas + 18);
            doc.text("Firma del jefe inmediato", firmasLeft + 260, yFirmas + 18);

            // Segunda fila de firmas (más separadas)
            yFirmas += 60;
            doc.line(firmasLeft, yFirmas, firmasLeft + 160, yFirmas); // Firma gerente
            doc.line(firmasLeft + 240, yFirmas, firmasLeft + 400, yFirmas); // Firma abogada
            doc.text("Lic. Andrés E. Rosenthal Enamorado", firmasLeft + 5, yFirmas + 18);
            doc.setFontSize(10);
            doc.text("Gerente Administrativo", firmasLeft + 45, yFirmas + 32);
            doc.setFontSize(12);
            doc.text("Abog. Martha Julia Rápalo", firmasLeft + 245, yFirmas + 18);

            // Guardar el PDF
            doc.save(`solicitud_vacaciones_${solicitud.nombreEmpleado}.pdf`);
        };

        if (solicitud) generarPDF();
    }, [solicitud, usuario]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Generando PDF...</p>
        </div>
    );
}
