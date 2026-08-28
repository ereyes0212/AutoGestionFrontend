import { getSession } from "@/auth";
import { downloadBufferFromS3, getPrivateInsumosBucketConfig } from "@/lib/aws/s3";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.IdUser) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (
    !session.Permiso.includes("ver_movimientos_insumo") &&
    !session.Permiso.includes("ver_insumos")
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const movimiento = await prisma.movimientoInsumo.findUnique({
    where: { id: params.id },
    select: { id: true, firmaKey: true },
  });

  if (!movimiento?.firmaKey) {
    return NextResponse.json({ error: "Firma no encontrada" }, { status: 404 });
  }

  const { buffer, contentType } = await downloadBufferFromS3(
    movimiento.firmaKey,
    getPrivateInsumosBucketConfig()
  );

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="firma-${movimiento.id}.png"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
