import { getSession } from "@/auth";
import { getEventosFactura } from "@/app/(protected)/facturas/actions";
import { downloadBufferFromS3 } from "@/lib/aws/s3";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_MARGIN = 40;
const TITLE_SIZE = 16;
const SUBTITLE_SIZE = 10;
const BODY_SIZE = 10;
const LINE_SPACING = 14;
const IMAGE_GAP = 14;

function wrapText(text: string, maxWidth: number, font: PDFFontLike, size: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

type PDFFontLike = {
  widthOfTextAtSize: (text: string, size: number) => number;
};


async function getEmpleadoFiltroLabel(empleadoId: string | undefined, empleadoNombreDesdeEventos?: string) {
  if (!empleadoId) return "todos";
  if (empleadoNombreDesdeEventos) return empleadoNombreDesdeEventos;

  const empleado = await prisma.empleados.findUnique({
    where: { id: empleadoId },
    select: { nombre: true, apellido: true },
  });

  if (!empleado) return empleadoId;
  return `${empleado.nombre} ${empleado.apellido}`;
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session?.Permiso.includes("ver_facturas") && !session?.Permiso.includes("ver_facturas_jefe")) {
      return new Response("No autorizado", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde") || undefined;
    const hasta = searchParams.get("hasta") || undefined;
    const empleadoId = searchParams.get("empleadoId") || undefined;

    const eventos = await getEventosFactura({ desde, hasta, empleadoId });
    const empleadoFiltroLabel = await getEmpleadoFiltroLabel(empleadoId, eventos[0]?.empleadoNombre);

    const pdfDoc = await PDFDocument.create();
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();
    let cursorY = height - PAGE_MARGIN;

    const ensureSpace = (requiredHeight: number) => {
      if (cursorY - requiredHeight < PAGE_MARGIN) {
        page = pdfDoc.addPage();
        ({ width, height } = page.getSize());
        cursorY = height - PAGE_MARGIN;
      }
    };

    const drawLine = (text: string, size = BODY_SIZE, color = rgb(0.15, 0.15, 0.15), font = bodyFont) => {
      ensureSpace(LINE_SPACING);
      page.drawText(text, { x: PAGE_MARGIN, y: cursorY, size, font, color });
      cursorY -= LINE_SPACING;
    };

    drawLine("Reporte de eventos de facturas", TITLE_SIZE, rgb(0, 0, 0), titleFont);
    drawLine(`Generado: ${new Date().toLocaleString("es-NI")}`, SUBTITLE_SIZE, rgb(0.35, 0.35, 0.35));
    drawLine(
      `Filtros: desde ${desde || "(sin filtro)"} | hasta ${hasta || "(sin filtro)"} | empleado ${empleadoFiltroLabel}`,
      SUBTITLE_SIZE,
      rgb(0.35, 0.35, 0.35),
    );
    cursorY -= 8;

    if (!eventos.length) {
      drawLine("No se encontraron eventos para los filtros seleccionados.");
    }

    for (const [index, evento] of eventos.entries()) {
      const blockTitle = `${index + 1}. ${evento.titulo}`;
      const maxTextWidth = width - PAGE_MARGIN * 2;
      const description = evento.descripcion?.trim() || "Sin descripción";

      ensureSpace(110);
      page.drawRectangle({
        x: PAGE_MARGIN,
        y: cursorY - 6,
        width: width - PAGE_MARGIN * 2,
        height: 1,
        color: rgb(0.86, 0.86, 0.86),
      });
      cursorY -= 20;

      drawLine(blockTitle, 12, rgb(0, 0, 0), titleFont);
      drawLine(`Empleado: ${evento.empleadoNombre}`);
      drawLine(`Fecha del evento: ${evento.fechaEventoLabel}`);
      if (evento.notaTitulo) drawLine(`Nota relacionada: ${evento.notaTitulo}`);

      const descriptionLines = wrapText(`Descripción: ${description}`, maxTextWidth, bodyFont, BODY_SIZE);
      for (const line of descriptionLines) drawLine(line);
      drawLine(`Archivos adjuntos: ${evento.archivos.length}`);
      cursorY -= 4;

      for (const archivo of evento.archivos) {
        const esImagen = archivo.archivoTipo.startsWith("image/");
        if (!esImagen) {
          drawLine(`• Archivo no imagen: ${archivo.archivoNombre} (${archivo.archivoTipo})`, 9, rgb(0.45, 0.15, 0.15));
          continue;
        }

        try {
          const { buffer, contentType } = await downloadBufferFromS3(archivo.archivoKey);
          const image = contentType.includes("png") ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer);

          const maxImageWidth = width - PAGE_MARGIN * 2;
          const maxImageHeight = 240;
          const scale = Math.min(maxImageWidth / image.width, maxImageHeight / image.height, 1);
          const imageWidth = image.width * scale;
          const imageHeight = image.height * scale;

          ensureSpace(imageHeight + 36);
          drawLine(`• ${archivo.archivoNombre}`, 9, rgb(0.1, 0.1, 0.1));
          page.drawImage(image, {
            x: PAGE_MARGIN,
            y: cursorY - imageHeight,
            width: imageWidth,
            height: imageHeight,
          });
          cursorY -= imageHeight + IMAGE_GAP;
        } catch {
          drawLine(`• No se pudo cargar la imagen: ${archivo.archivoNombre}`, 9, rgb(0.65, 0.1, 0.1));
        }
      }

      cursorY -= 8;
    }

    const bytes = await pdfDoc.save();
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-eventos-facturas-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando reporte de facturas", error);
    return new Response("Error generando el reporte", { status: 500 });
  }
}
