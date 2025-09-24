import { getNotasAgrupadasHoySimple } from "@/app/(protected)/redaccion/actions";
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Función para limpiar caracteres incompatibles
function cleanText(text: string) {
    return text.replace(/[\u202F\u00A0]/g, " ");
}

export async function GET() {
    try {
        const { manana, tarde, meta } = await getNotasAgrupadasHoySimple();
        const pdfDoc = await PDFDocument.create();
        let currentPage = pdfDoc.addPage();
        const { width, height } = currentPage.getSize();

        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let y = height - 60;

        // Título principal
        const fechaStr = new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        currentPage.drawText(`Reporte de Notas Finalizadas`, {
            x: 50,
            y,
            size: 20,
            font: titleFont,
            color: rgb(0.1, 0.2, 0.5),
        });
        y -= 28;
        currentPage.drawText(`Fecha: ${fechaStr}`, {
            x: 50,
            y,
            size: 12,
            font: bodyFont,
            color: rgb(0.3, 0.3, 0.3),
        });
        y -= 40;

        // Función auxiliar para renderizar un grupo
        const renderGroup = (
            title: string,
            notas: { titulo: string; createAtAdjusted: string }[]
        ) => {
            if (y < 100) {
                currentPage = pdfDoc.addPage();
                y = height - 60;
            }

            // Encabezado del grupo
            currentPage.drawText(title, {
                x: 50,
                y,
                size: 14,
                font: titleFont,
                color: rgb(0.2, 0.2, 0.2),
            });
            y -= 25;

            notas.forEach((nota, index) => {
                if (y < 60) {
                    currentPage = pdfDoc.addPage();
                    y = height - 60;
                }

                const fecha = new Date(nota.createAtAdjusted).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                });

                currentPage.drawText(
                    `${index + 1}. ${cleanText(nota.titulo)} (${fecha})`,
                    {
                        x: 60,
                        y,
                        size: 11,
                        font: bodyFont,
                        color: rgb(0.1, 0.1, 0.1),
                    }
                );
                y -= 18;
            });

            y -= 20;
        };

        renderGroup("Notas de la mañana (00:00 - 13:59)", manana);
        renderGroup("Notas de la tarde (14:00 - 23:59)", tarde);

        // Footer
        const timestamp = new Date().toLocaleString("es-ES");
        currentPage.drawText(
            `Generado: ${timestamp} | Total: ${manana.length + tarde.length}`,
            { x: 50, y: 20, size: 9, font: bodyFont, color: rgb(0.4, 0.4, 0.4) }
        );

        const pdfBytes = await pdfDoc.save();
        return new Response(new Uint8Array(pdfBytes), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="reporte-notas-${new Date().toISOString().split("T")[0]}.pdf"`,
            },
        });
    } catch (err) {
        console.error("Error exportando PDF:", err);
        return NextResponse.json({ error: "Error generando PDF" }, { status: 500 });
    }
}
