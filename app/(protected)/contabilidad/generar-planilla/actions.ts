"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import {
  PayrollImportPreview,
  VoucherDto
} from "./types";

type PayrollAdjustment = {
  nombre: string;
  categoria: "DEDUCCION" | "BONO";
  monto: number;
};

const normalizeDni = (value: string) => (value ?? "").replace(/-/g, "");

async function getOrCreateAjusteTipo(adjustment: PayrollAdjustment) {
  const existing = await prisma.ajusteTipo.findFirst({
    where: {
      nombre: adjustment.nombre,
      categoria: adjustment.categoria,
    },
  });

  if (existing) return existing;

  return prisma.ajusteTipo.create({
    data: {
      id: randomUUID(),
      nombre: adjustment.nombre,
      descripcion: "Creado automáticamente desde importación de planilla",
      categoria: adjustment.categoria,
      montoPorDefecto: 0,
      activo: true,
    },
  });
}

const buildAdjustments = (v: VoucherDto): PayrollAdjustment[] =>
  [
    { nombre: "Retención en la Fuente ISR", categoria: "DEDUCCION" as const, monto: v.retencionFuenteISR ?? 0 },
    { nombre: "Retención IHSS", categoria: "DEDUCCION" as const, monto: v.retencionIHSS ?? 0 },
    { nombre: "Retención RAP", categoria: "DEDUCCION" as const, monto: v.retencionRAP ?? 0 },
    { nombre: "Impuesto Personal Municipal", categoria: "DEDUCCION" as const, monto: v.impuestoPersonalMunicipal ?? 0 },
    { nombre: "Deducción por Anticipo de Salario", categoria: "DEDUCCION" as const, monto: v.deduccionAnticipoSalario ?? 0 },

    { nombre: "Reembolsos", categoria: "BONO" as const, monto: v.reembolsos ?? 0 },
    { nombre: "Retroactivo SM", categoria: "BONO" as const, monto: v.retroactivoSM ?? 0 },
    { nombre: "Bonos", categoria: "BONO" as const, monto: v.bonos ?? 0 },
    { nombre: "Feriados", categoria: "BONO" as const, monto: v.feriados ?? 0 },
  ].filter((item): item is PayrollAdjustment => Number(item.monto) > 0);

export async function previewPayrollImport(
  rows: Omit<VoucherDto, "empleadoId" | "detalles">[]
): Promise<PayrollImportPreview> {
  const empleados = await prisma.empleados.findMany({
    where: { activo: true },
    include: { Puesto: true },
  });

  const byDni = new Map(
    empleados.map((e) => [normalizeDni(e.numeroIdentificacion), e])
  );

  return {
    rows: rows.map((row, index) => {
      const empleado = byDni.get(normalizeDni(row.dni ?? ""));

      return {
        ...row,
        rowNumber: index + 1,
        dni: row.dni ?? "",
        puesto: row.puesto ?? "",
        oficina: row.oficina ?? "",
        metodoPago: row.metodoPago ?? "",
        retencionFuenteISR: row.retencionFuenteISR ?? 0,
        retencionIHSS: row.retencionIHSS ?? 0,
        retencionRAP: row.retencionRAP ?? 0,
        impuestoPersonalMunicipal: row.impuestoPersonalMunicipal ?? 0,
        deduccionAnticipoSalario: row.deduccionAnticipoSalario ?? 0,
        totalDeducciones: row.totalDeducciones ?? 0,
        reembolsos: row.reembolsos ?? 0,
        retroactivoSM: row.retroactivoSM ?? 0,
        bonos: row.bonos ?? 0,
        feriados: row.feriados ?? 0,

        empleadoId: empleado?.id ?? "",
        empleadoNombre: empleado
          ? `${empleado.nombre} ${empleado.apellido}`
          : row.empleadoNombre,

        empleadoPuesto: empleado?.Puesto?.Nombre ?? row.puesto ?? "",
        estado: empleado ? "VALIDO" : "ERROR",
        errores: empleado
          ? []
          : [`No se encontró un empleado activo con DNI ${row.dni || "vacío"}`],

        detalles: [],
      };
    }),
  };
}

export async function saveVouchers(vouchers: VoucherDto[]): Promise<string[]> {
  const createdIds: string[] = [];

  for (const v of vouchers) {
    if (!v.empleadoId)
      throw new Error(`El empleado ${v.empleadoNombre} no tiene empleadoId.`);

    const voucherId = randomUUID();

    const detalles = v.detalles?.length
      ? v.detalles
      : await Promise.all(
        buildAdjustments(v).map(async (a) => {
          const ajuste = await getOrCreateAjusteTipo(a);

          return {
            ajusteTipoId: ajuste.id,
            ajusteTipoNombre: ajuste.nombre,
            categoria: ajuste.categoria,
            montoPorDefecto: ajuste.montoPorDefecto.toString(),
            monto: a.monto.toString(),
          };
        })
      );

    await prisma.voucherPagos.create({
      data: {
        id: voucherId,
        empleadoId: v.empleadoId,
        diasTrabajados: v.diasTrabajados,
        salarioDiario: v.salarioDiario,
        salarioMensual: v.salarioMensual,
        netoPagar: v.netoPagar,
        fechaPago: new Date(v.fechaPago),
        observaciones: v.observaciones,

        retencionFuenteISR: v.retencionFuenteISR ?? 0,
        retencionIHSS: v.retencionIHSS ?? 0,
        retencionRAP: v.retencionRAP ?? 0,
        impuestoPersonalMunicipal: v.impuestoPersonalMunicipal ?? 0,
        deduccionAnticipoSalario: v.deduccionAnticipoSalario ?? 0,

        totalDeducciones:
          v.totalDeducciones ??
          detalles
            .filter((d) => d.categoria === "DEDUCCION")
            .reduce((s, d) => s + Number(d.monto), 0),

        reembolsos: v.reembolsos ?? 0,
        retroactivoSM: v.retroactivoSM ?? 0,
        bonos: v.bonos ?? 0,
        feriados: v.feriados ?? 0,
        metodoPago: v.metodoPago ?? "",

        DetalleVoucherPagos: {
          createMany: {
            data: detalles.map((d) => ({
              id: randomUUID(),
              ajusteTipoId: d.ajusteTipoId,
              monto: Number(d.monto),
            })),
          },
        },
      },
    });

    createdIds.push(voucherId);
  }

  return createdIds;
}