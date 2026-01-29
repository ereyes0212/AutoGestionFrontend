export const dynamic = "force-dynamic";

import { getReportesPorTurnoDia } from "@/app/(protected)/reporte-diseno/actions";
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// limpia caracteres problemáticos básicos
function cleanText(text: any) {
    return String(text ?? "").replace(/[\u202F\u00A0]/g, " ");
}

// reemplaza flechas y cualquier char fuera de 0-255 por un sustituto seguro
function sanitizeForPdf(text: string) {
    if (!text) return "";
    // reemplazamos flechas u otros símbolos por ASCII
    const s = text.replace(/→/g, "->").replace(/←/g, "<-");
    // sustituir cualquier char cuyo code > 255 (no encodable en WinAnsi) por '?'
    let out = "";
    for (let i = 0; i < s.length; i++) {
        const code = s.charCodeAt(i);
        out += code > 255 ? "?" : s[i];
    }
    return out;
}

// wrap simple de texto para pdf-lib
function wrapText(text: string, font: any, size: number, maxWidth: number) {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
        const testLine = line ? line + " " + word : word;
        if (font.widthOfTextAtSize(testLine, size) > maxWidth) {
            if (line) lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    }
    if (line) lines.push(line);
    return lines;
}

/**
 * Devuelve 'hoy' en Honduras en formato YYYY-MM-DD usando Intl.
 */
function hoyEnHondurasYYYYMMDD(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Tegucigalpa",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    return formatter.format(now); // "YYYY-MM-DD"
}

const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
    try {
        const raw = request.nextUrl.searchParams.get("fecha");
        const dateStr =
            raw && YYYYMMDD.test(raw) ? raw : hoyEnHondurasYYYYMMDD();

        // Turno: 8:00 AM del día seleccionado → 5:00 AM del día siguiente
        const startHour = 8;
        const endHour = 5;

        const registros = await getReportesPorTurnoDia(dateStr, startHour, endHour);

        // crear PDF
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();

        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let y = height - 60;

        // Título y fecha del día seleccionado (formateada en HN)
        const [year, month, day] = dateStr.split("-").map(Number);
        const fechaObj = new Date(year, month - 1, day);
        const fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        page.drawText("Reporte de Diseño", {
            x: 50,
            y,
            size: 18,
            font: titleFont,
            color: rgb(0.1, 0.2, 0.5),
        });
        y -= 26;

        const headerLine = sanitizeForPdf(`Día: ${fechaFormateada}`);
        page.drawText(headerLine, {
            x: 50,
            y,
            size: 10,
            font: bodyFont,
            color: rgb(0.3, 0.3, 0.3),
        });
        y -= 20;

        // Columnas: planificadas para evitar solapamiento. Observación será amplia.
        const colX = {
            idx: 50,           // N°
            empleado: 80,      // Empleado (columna estrecha)
            observ: 240,       // Observación (columna amplia y envolvente)
            // en la segunda línea usaremos estos:
            tipo: 80,          // Tipo (segunda fila, alineado con empleado)
            paginas: 260,      // Páginas (segunda fila)
            horas: 340,        // Horas (segunda fila)
        };

        // Encabezados
        const headerSize = 10;
        page.drawText("N°", { x: colX.idx, y, size: headerSize, font: titleFont });
        page.drawText("Empleado", { x: colX.empleado, y, size: headerSize, font: titleFont });
        page.drawText("Observación", { x: colX.observ, y, size: headerSize, font: titleFont });
        y -= 18;

        // Función para agregar nueva página cuando se quede sin espacio
        const ensureSpace = (needed: number) => {
            if (y - needed < 60) {
                page = pdfDoc.addPage();
                y = height - 60;
            }
        };

        // Ancho máximo para observación (desde colX.observ hasta margen derecho 50)
        const observMaxWidth = width - colX.observ - 50;

        // Render cada registro
        for (let i = 0; i < registros.length; i++) {
            const r = registros[i];
            // construimos texto resumido y sanitizamos para PDF
            const empleado = sanitizeForPdf(cleanText(r.Empleado));
            const observRaw = cleanText(r.Observacion ?? "");
            const observ = sanitizeForPdf(observRaw);
            const tipo = sanitizeForPdf(cleanText(r.TipoSeccion));
            const paginas = sanitizeForPdf(`${r.PaginaInicio ?? ""}-${r.PaginaFin ?? ""}`);
            const horas = sanitizeForPdf(`${r.HoraInicio ?? ""} - ${r.HoraFin ?? ""}`);

            // Preparar líneas de observación
            const obsLines = observ ? wrapText(observ, bodyFont, 9, observMaxWidth) : [];
            const obsHeight = obsLines.length * 11; // 11px por línea aprox
            // Altura total necesaria: primera línea (empleado/obs) + obsHeight + segunda fila (tipo/paginas/horas) + separaciones
            const needed = Math.max(12, obsHeight) + 12 + 8;

            ensureSpace(needed);

            // Primera línea: N° y Empleado y primera(s) líneas de Observación (empezando en observ column)
            page.drawText(String(i + 1), { x: colX.idx, y, size: 10, font: bodyFont });
            page.drawText(empleado, { x: colX.empleado, y, size: 10, font: bodyFont });

            // dibujar observación (puede ocupar varias líneas)
            if (obsLines.length > 0) {
                for (let li = 0; li < obsLines.length; li++) {
                    // si li == 0, dibujamos en la misma y; si li > 0, dibujamos abajo
                    page.drawText(obsLines[li], {
                        x: colX.observ,
                        y: y - 14 * li,
                        size: 9,
                        font: bodyFont,
                        color: rgb(0.2, 0.2, 0.2),
                    });
                }
            }

            // desplazamos Y hacia abajo por el espacio de las líneas de observación (si hay)
            const usedObsHeight = obsLines.length ? (obsLines.length * 14) : 14; // 14px por línea para dar espacio
            y -= usedObsHeight;

            // Segunda fila: Tipo / Páginas / Horas (alineadas bajo Empleado)
            page.drawText(`Tipo: ${tipo}`, { x: colX.tipo, y, size: 9, font: bodyFont, color: rgb(0.15, 0.15, 0.15) });
            page.drawText(`Pág: ${paginas}`, { x: colX.paginas, y, size: 9, font: bodyFont, color: rgb(0.15, 0.15, 0.15) });
            page.drawText(`Horas: ${horas}`, { x: colX.horas, y, size: 9, font: bodyFont, color: rgb(0.15, 0.15, 0.15) });

            // separación antes del siguiente registro
            y -= 16;
        }

        // Footer: generado y total
        const nowLocal = new Date().toLocaleString("es-ES", { timeZone: "America/Tegucigalpa" });
        ensureSpace(40);
        page.drawText(sanitizeForPdf(`Generado: ${nowLocal} | Total registros: ${registros.length}`), {
            x: 50,
            y: 40,
            size: 9,
            font: bodyFont,
            color: rgb(0.4, 0.4, 0.4),
        });

        const pdfBytes = await pdfDoc.save();
        const filename = `reporte-diseno-${dateStr}.pdf`;
        return new Response(new Uint8Array(pdfBytes), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (err: any) {
        console.error("Error generando PDF de reportes:", err);
        return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 });
    }
}
