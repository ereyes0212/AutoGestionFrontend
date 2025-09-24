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

        // Función para renderizar tabla por grupo
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

            // Dibujar encabezado de tabla
            const headerHeight = 24;
            currentPage.drawRectangle({
                x: 50,
                y: y - 5,
                width: width - 100,
                height: headerHeight,
                color: rgb(0.85, 0.9, 1),
            });
            currentPage.drawText("N°", { x: 55, y, size: 12, font: titleFont, color: rgb(0.1, 0.2, 0.5) });
            currentPage.drawText("Título", { x: 85, y, size: 12, font: titleFont, color: rgb(0.1, 0.2, 0.5) });
            currentPage.drawText("Hora", { x: width - 100, y, size: 12, font: titleFont, color: rgb(0.1, 0.2, 0.5) });
            y -= headerHeight;

            const rowPadding = 6;
            const maxTitleWidth = width - 180;
            const rowSpacing = 8;

            notas.forEach((nota, index) => {
                const titleLines = wrapText(cleanText(nota.titulo ?? "Sin título"), bodyFont, 10, maxTitleWidth);
                const rowHeight = titleLines.length * 12 + rowPadding * 2;

                if (y - rowHeight < 60) {
                    currentPage = pdfDoc.addPage();
                    y = height - 60;

                    // Redibuja encabezado en nueva página
                    currentPage.drawRectangle({
                        x: 50,
                        y: y - 5,
                        width: width - 100,
                        height: headerHeight,
                        color: rgb(0.85, 0.9, 1),
                    });
                    currentPage.drawText("N°", { x: 55, y, size: 12, font: titleFont, color: rgb(0.1, 0.2, 0.5) });
                    currentPage.drawText("Título", { x: 85, y, size: 12, font: titleFont, color: rgb(0.1, 0.2, 0.5) });
                    currentPage.drawText("Hora", { x: width - 100, y, size: 12, font: titleFont, color: rgb(0.1, 0.2, 0.5) });
                    y -= headerHeight;
                }

                // Fondo alternado
                currentPage.drawRectangle({
                    x: 50,
                    y: y - rowHeight + rowPadding,
                    width: width - 100,
                    height: rowHeight,
                    color: index % 2 === 0 ? rgb(0.97, 0.98, 1) : rgb(1, 1, 1),
                });

                // Línea separadora
                currentPage.drawRectangle({
                    x: 50,
                    y: y - rowHeight + rowPadding,
                    width: width - 100,
                    height: 0.5,
                    color: rgb(0.7, 0.8, 0.9),
                });

                // Número
                currentPage.drawText(String(index + 1), { x: 55, y: y - 8, size: 10, font: bodyFont, color: rgb(0.2, 0.2, 0.2) });

                // Título con wrap
                titleLines.forEach((line, i) => {
                    currentPage.drawText(cleanText(line), { x: 85, y: y - 14 * i, size: 10, font: bodyFont, color: rgb(0.2, 0.2, 0.2) });
                });

                // Hora
                const horaStr = new Date(nota.createAtAdjusted).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                });
                currentPage.drawText(horaStr, { x: width - 100, y: y - 8, size: 10, font: bodyFont, color: rgb(0.2, 0.2, 0.2) });

                y -= rowHeight + rowSpacing;
            });

            y -= 20;
        };

        renderGroup("Notas de la mañana", manana);
        renderGroup("Notas de la tarde", tarde);

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
