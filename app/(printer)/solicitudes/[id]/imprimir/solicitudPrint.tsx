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

type Firma = {
    nombre: string;
    cargo?: string;
    firmaBase64?: string | null;
};

export default function ClientPrintView({
    solicitud,
    usuario,
    firmas,
}: {
    solicitud: SolicitudPermiso;
    usuario: string;
    firmas: Firma[];
}) {
    useEffect(() => {
        const generarPDF = async () => {
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "pt",
                format: "letter",
            });

            // Logo de fondo
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
                    0.08
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

            // === MÓDULO DATOS EMPLEADO ===
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            let yInfo = 150;
            const salto = 28;
            const left = 60;
            doc.setFont("helvetica", "bold");
            doc.text("Datos del empleado", left, yInfo - 8);
            doc.setFont("helvetica", "normal");

            yInfo += 10;
            doc.text(`Nombre del empleado:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${solicitud.nombreEmpleado}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            doc.text(`Puesto:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${solicitud.puesto}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            doc.text(`Fecha de solicitud:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${formatearFecha(solicitud.fechaSolicitud)}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            doc.text(`Periodo:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${solicitud.periodo}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            doc.text(`Días a gozar:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${solicitud.diasGozados || 0}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            doc.text(`Días restantes:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${solicitud.diasRestantes || 0}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            doc.text(`Fecha de goce de vacaciones:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${formatearFecha(solicitud.fechaInicio)}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            doc.text(`Fecha de fin de goce:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${formatearFecha(solicitud.fechaFin)}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            doc.text(`Fecha de presentacion:`, left, yInfo);
            doc.setFont("helvetica", "bold");
            doc.text(`${formatearFecha(solicitud.fechaPresentacion || "")}`, left + 180, yInfo);
            doc.setFont("helvetica", "normal");
            yInfo += salto;

            // Línea divisoria
            yInfo += salto + 10;
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.7);
            doc.line(left, yInfo, left + 420, yInfo);

            // === ESTADO DE LA SOLICITUD ===
            const yEstado = yInfo + 40;
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

            // Motivo si no fue aprobada
            let yMotivo = yEstado + 50;
            if (solicitud.aprobado === false) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text("**En caso de no ser aprobadas el motivo es**", pageWidth / 2, yMotivo, { align: "center" });
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);

                const motivo = (solicitud.aprobaciones || [])
                    .map((a) => a.comentario)
                    .find((c) => c && c.trim() !== "");

                if (motivo) {
                    doc.text(motivo, pageWidth / 2, yMotivo + 22, { align: "center", maxWidth: 480 });
                } else {
                    doc.text("Sin comentarios.", pageWidth / 2, yMotivo + 22, { align: "center" });
                }
                yMotivo += 40;
            }

            // === FIRMAS DINÁMICAS (2 en 2) ===
            const yFirmas = (solicitud.aprobado === false ? yMotivo : yEstado + 50) + 40;
            const colWidth = 200;
            const gap = 80;
            const startX = (pageWidth - (colWidth * 2 + gap)) / 2;
            const firmaImageHeight = 40; // Altura de la imagen de firma
            const espacioLineaFirma = 20; // Espacio entre firma y línea

            firmas.forEach((firma, index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const x1 = startX + col * (colWidth + gap);
                let y1 = yFirmas + row * 110; // Aumentamos el espacio vertical para incluir la imagen

                // Si hay imagen de firma, mostrarla centrada
                if (firma.firmaBase64) {
                    try {
                        // Calcular el ancho de la imagen manteniendo proporción
                        const firmaImageWidth = colWidth - 20; // Ancho con márgenes
                        const centerX = x1 + colWidth / 2; // Centro de la columna
                        const imageX = centerX - firmaImageWidth / 2; // Posición X para centrar

                        doc.addImage(
                            firma.firmaBase64,
                            "PNG",
                            imageX,
                            y1 - firmaImageHeight - espacioLineaFirma,
                            firmaImageWidth,
                            firmaImageHeight,
                            undefined,
                            "FAST"
                        );
                    } catch (error) {
                        console.error("Error al agregar imagen de firma:", error);
                    }
                }

                // Siempre dibujar la línea de firma (abajo de la imagen o solo la línea)
                const yLineaFirma = firma.firmaBase64 
                    ? y1 - espacioLineaFirma 
                    : y1 - espacioLineaFirma;
                doc.line(x1, yLineaFirma, x1 + colWidth, yLineaFirma);

                // Texto de nombre centrado
                doc.setFontSize(12);
                const nombreWidth = doc.getTextWidth(firma.nombre);
                const nombreX = x1 + (colWidth - nombreWidth) / 2;
                doc.text(firma.nombre, nombreX, y1 + 5);

                // Cargo centrado (si existe)
                if (firma.cargo) {
                    doc.setFontSize(10);
                    const cargoWidth = doc.getTextWidth(firma.cargo);
                    const cargoX = x1 + (colWidth - cargoWidth) / 2;
                    doc.text(firma.cargo, cargoX, y1 + 18);
                }
                doc.setFontSize(12);
            });

            // Guardar PDF
            doc.save(`solicitud_vacaciones_${solicitud.nombreEmpleado}.pdf`);
        };

        if (solicitud) generarPDF();
    }, [solicitud, usuario, firmas]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Generando PDF...</p>
        </div>
    );
}
