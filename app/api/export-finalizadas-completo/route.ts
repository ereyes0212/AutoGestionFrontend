export const dynamic = "force-dynamic"; // Esto fuerza que la ruta siempre sea dinámica
import { getNotasAgrupadasHoySimple } from "@/app/(protected)/redaccion/actions";
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Función para limpiar caracteres incompatibles
function cleanText(text: string) {
    return text.replace(/[\u202F\u00A0]/g, " ");
}

export async function GET() {
    try {
        const { manana, tarde } = await getNotasAgrupadasHoySimple();
        const pdfDoc = await PDFDocument.create();
        let currentPage = pdfDoc.addPage();
        const { width, height } = currentPage.getSize();

        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let y = height - 60;

        // Título principal
        const fechaStr: string = new Date(
            Date.now() - 6 * 60 * 60 * 1000
        ).toLocaleDateString("es-ES", {
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
        y -= 30;

        // Función para wrap de texto
        const wrapText = (text: string, font: any, size: number, maxWidth: number) => {
            const words = text.split(" ");
            const lines: string[] = [];
            let line = "";
            words.forEach((word) => {
                const testLine = line ? line + " " + word : word;
                if (font.widthOfTextAtSize(testLine, size) > maxWidth) {
                    lines.push(line);
                    line = word;
                } else {
                    line = testLine;
                }
            });
            if (line) lines.push(line);
            return lines;
        };

        // Función para renderizar grupo
        const renderGroup = (
            title: string,
            notas: { titulo: string }[]
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
            y -= 20;

            const maxTitleWidth = width - 100;
            const rowSpacing = 12;

            notas.forEach((nota) => {
                const titleLines = wrapText(cleanText(nota.titulo ?? "Sin título"), bodyFont, 11, maxTitleWidth);
                const rowHeight = titleLines.length * 12;

                if (y - rowHeight < 60) {
                    currentPage = pdfDoc.addPage();
                    y = height - 60;
                }

                // Dibujar viñeta
                currentPage.drawText("•", {
                    x: 50,
                    y,
                    size: 12,
                    font: bodyFont,
                    color: rgb(0.1, 0.2, 0.5), // mismo azul que usabas antes
                });

                // Dibujar título
                titleLines.forEach((line, i) => {
                    currentPage.drawText(cleanText(line), {
                        x: 65, // desplazado a la derecha de la viñeta
                        y: y - 14 * i,
                        size: 11,
                        font: bodyFont,
                        color: rgb(0.1, 0.1, 0.1),
                    });
                });

                y -= rowHeight + rowSpacing;
            });

            y -= 15;
        };

        renderGroup("Notas de la mañana", manana);
        renderGroup("Notas de la tarde", tarde);

        // Footer ajustado con -6 horas
        const now = new Date();
        const adjusted = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const timestamp = adjusted.toLocaleString("es-ES");

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
