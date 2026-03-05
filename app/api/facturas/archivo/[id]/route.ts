import { getSession } from "@/auth";
import { downloadBufferFromS3 } from "@/lib/aws/s3";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.IdEmpleado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const archivo = await prisma.eventoFacturaArchivo.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      archivoKey: true,
      archivoNombre: true,
      archivoTipo: true,
      evento: {
        select: {
          empleadoId: true,
        },
      },
    },
  });

  if (!archivo) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const puedeVerTodas = session.Permiso.includes("ver_facturas_jefe");
  if (!puedeVerTodas && archivo.evento.empleadoId !== session.IdEmpleado) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { buffer, contentType } = await downloadBufferFromS3(archivo.archivoKey);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(archivo.archivoNombre)}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
