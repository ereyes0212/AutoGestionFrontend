import { prisma } from "@/lib/prisma";

type SimpleRow = {
  titulo: string;
  createAtAdjusted: string; // ISO
};

export async function getNotasAgrupadasHoySimple(fecha?: string | Date): Promise<{
  meta: {
    nowServer: string;
    queryStartIso: string;
    queryEndIso: string;
    startLocalIso: string;
    endLocalIso: string;
    threshold14LocalIso: string;
    totalRaw: number;
    totalAfterFilter: number;
  };
  manana: SimpleRow[];
  tarde: SimpleRow[];
}> {
  const SHIFT_MS = 6 * 60 * 60 * 1000;

  let fechaBase: Date;
  if (fecha) {
    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [y, mm, dd] = fecha.split("-").map(Number);
      fechaBase = new Date(Date.UTC(y, mm - 1, dd, 6, 0, 0));
    } else {
      const d = fecha instanceof Date ? fecha : new Date(fecha);
      if (isNaN(d.getTime())) throw new Error("Fecha inválida: " + fecha);
      const shifted = new Date(d.getTime() - SHIFT_MS);
      const y = shifted.getUTCFullYear();
      const mo = shifted.getUTCMonth();
      const day = shifted.getUTCDate();
      fechaBase = new Date(Date.UTC(y, mo, day, 6, 0, 0));
    }
  } else {
    fechaBase = new Date();
  }

  const now = new Date();
  const startShifted = new Date(fechaBase.getTime() - SHIFT_MS);
  const endOfDayUTC = new Date(fechaBase.getTime() + 24 * 60 * 60 * 1000 - 1);
  const endShifted = new Date(endOfDayUTC.getTime() - SHIFT_MS);

  const startForQuery = new Date(startShifted.getTime() + SHIFT_MS);
  const endForQuery = new Date(endShifted.getTime() + SHIFT_MS);

  const queryStart = new Date(startForQuery.getTime() - SHIFT_MS);
  const queryEnd = new Date(endForQuery.getTime() + SHIFT_MS);

  const notasRaw = await prisma.nota.findMany({
    where: {
      createAt: { gte: queryStart, lte: queryEnd },
      estado: "FINALIZADA",
    },
    orderBy: { createAt: "asc" },
    select: {
      titulo: true,
      createAt: true,
    },
  });

  const notasAjustadas = notasRaw
    .map((n) => {
      const original = n.createAt ? new Date(n.createAt) : null;
      const createAtAdjusted = original ? new Date(original.getTime() - SHIFT_MS) : null;
      return { titulo: n.titulo ?? "Sin título", createAtAdjusted };
    })
    .filter((r) => r.createAtAdjusted !== null)
    .filter((r) => {
      const dt = r.createAtAdjusted as Date;
      return dt >= startShifted && dt <= endShifted;
    }) as { titulo: string; createAtAdjusted: Date }[];

  const threshold14 = new Date(startShifted);
  threshold14.setHours(14, 0, 0, 0);

  const manana = notasAjustadas
    .filter((n) => n.createAtAdjusted < threshold14)
    .map((n) => ({ titulo: n.titulo, createAtAdjusted: n.createAtAdjusted.toISOString() }));

  const tarde = notasAjustadas
    .filter((n) => n.createAtAdjusted >= threshold14)
    .map((n) => ({ titulo: n.titulo, createAtAdjusted: n.createAtAdjusted.toISOString() }));

  return {
    meta: {
      nowServer: now.toISOString(),
      queryStartIso: queryStart.toISOString(),
      queryEndIso: queryEnd.toISOString(),
      startLocalIso: startShifted.toISOString(),
      endLocalIso: endShifted.toISOString(),
      threshold14LocalIso: threshold14.toISOString(),
      totalRaw: notasRaw.length,
      totalAfterFilter: notasAjustadas.length,
    },
    manana,
    tarde,
  };
}
