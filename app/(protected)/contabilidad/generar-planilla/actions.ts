// app/contabilidad/generar-planilla/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { AjusteTemplate, PayrollImportPreview, VoucherDto, VoucherTemplateResponse } from "./types";

type PayrollAdjustment = { nombre: string; categoria: "DEDUCCION" | "BONO"; monto: number };

const normalizeDni = (value: string) => value.replace(/-/g, "");

async function getOrCreateAjusteTipo(adjustment: PayrollAdjustment) {
  const existing = await prisma.ajusteTipo.findFirst({ where: { nombre: adjustment.nombre, categoria: adjustment.categoria } });
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

const buildAdjustments = (v: VoucherDto): PayrollAdjustment[] => [
  { nombre: "Retención en la Fuente ISR", categoria: "DEDUCCION", monto: v.retencionFuenteISR ?? 0 },
  { nombre: "Retención IHSS", categoria: "DEDUCCION", monto: v.retencionIHSS ?? 0 },
  { nombre: "Retención RAP", categoria: "DEDUCCION", monto: v.retencionRAP ?? 0 },
  { nombre: "Impuesto Personal Municipal", categoria: "DEDUCCION", monto: v.impuestoPersonalMunicipal ?? 0 },
  { nombre: "Deducción por Anticipo de Salario", categoria: "DEDUCCION", monto: v.deduccionAnticipoSalario ?? 0 },
  { nombre: "Reembolsos", categoria: "BONO", monto: v.reembolsos ?? 0 },
  { nombre: "Retroactivo SM", categoria: "BONO", monto: v.retroactivoSM ?? 0 },
  { nombre: "Bonos", categoria: "BONO", monto: v.bonos ?? 0 },
  { nombre: "Feriados", categoria: "BONO", monto: v.feriados ?? 0 },
].filter((item): item is PayrollAdjustment => Number(item.monto) > 0);

export async function previewPayrollImport(rows: Omit<VoucherDto, "empleadoId" | "detalles">[]): Promise<PayrollImportPreview> {
  const empleados = await prisma.empleados.findMany({
    where: { activo: true },
    include: { Puesto: true },
  });
  const byDni = new Map(empleados.map((e) => [normalizeDni(e.numeroIdentificacion), e]));

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
        empleadoNombre: empleado ? `${empleado.nombre} ${empleado.apellido}` : row.empleadoNombre,
        empleadoPuesto: empleado?.Puesto?.Nombre ?? row.puesto ?? "",
        estado: empleado ? "VALIDO" : "ERROR",
        errores: empleado ? [] : [`No se encontró un empleado activo con DNI ${row.dni || "vacío"}`],
        detalles: [],
      };
    }),
  };
}

export async function saveVouchers(vouchers: VoucherDto[]): Promise<string[]> {
  try {
    const createdIds: string[] = [];

    for (const v of vouchers) {
      if (!v.empleadoId) throw new Error(`El empleado ${v.empleadoNombre} no tiene empleadoId.`);
      const voucherId = randomUUID();
      const detalles = v.detalles?.length
        ? v.detalles
        : await Promise.all(buildAdjustments(v).map(async (a) => {
          const ajuste = await getOrCreateAjusteTipo(a);
          return {
            ajusteTipoId: ajuste.id,
            ajusteTipoNombre: ajuste.nombre,
            categoria: ajuste.categoria,
            montoPorDefecto: ajuste.montoPorDefecto.toString(),
            monto: a.monto.toString(),
          };
        }));

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
          totalDeducciones: v.totalDeducciones ?? detalles.filter((d) => d.categoria === "DEDUCCION").reduce((s, d) => s + Number(d.monto), 0),
          reembolsos: v.reembolsos ?? 0,
          retroactivoSM: v.retroactivoSM ?? 0,
          bonos: v.bonos ?? 0,
          feriados: v.feriados ?? 0,
          metodoPago: v.metodoPago ?? "",
          DetalleVoucherPagos: {
            createMany: {
              data: detalles.map((d) => ({ id: randomUUID(), ajusteTipoId: d.ajusteTipoId, monto: Number(d.monto) })),
            },
          },
        },
      });

      createdIds.push(voucherId);
    }

    return createdIds;
  } catch (error) {
    console.error("Error al guardar los vouchers:", error);
    throw error;
  }
}
/**
 * Dado un arreglo de voucherIds, envía los correos correspondientes
 * y retorna un objeto con dos arreglos: `sent` (IDs enviados con éxito)
 * y `failed` (IDs que fallaron).
 * Ahora se incluye `AjusteTipo` en lugar de `TipoDeducciones`.
 */
export async function sendVoucherEmails(voucherIds: string[]): Promise<{
  sent: string[];
  failed: string[];
}> {
  const { EmailService } = await import("@/lib/sendEmail");
  const { generateVoucherEmailHtml } = await import("@/lib/templates/voucherEmail");

  const sent: string[] = [];
  const failed: string[] = [];

  for (const id of voucherIds) {
    try {
      // 1) Obtener datos del voucher junto con detalles y el correo del empleado
      const voucher = await prisma.voucherPagos.findUnique({
        where: { id },
        include: {
          DetalleVoucherPagos: {
            select: {
              AjusteTipo: {
                select: { id: true, nombre: true, categoria: true, montoPorDefecto: true },
              },
              monto: true,
            },
          },
          Empleados: {
            select: { correo: true, nombre: true, apellido: true },
          },
        },
      });

      if (!voucher) {
        failed.push(id);
        continue;
      }

      const empleadoCorreo = voucher.Empleados?.correo;
      if (!empleadoCorreo) {
        failed.push(id);
        continue;
      }

      // 2) Mapear a VoucherDto
      const detalles = voucher.DetalleVoucherPagos.map((d) => ({
        ajusteTipoId: d.AjusteTipo.id,
        ajusteTipoNombre: d.AjusteTipo.nombre,
        categoria: d.AjusteTipo.categoria,           // "DEDUCCION" o "BONO"
        montoPorDefecto: d.AjusteTipo.montoPorDefecto.toString(),
        monto: d.monto.toString(),                    // monto real aplicado
      }));

      const vDto: VoucherDto = {
        empleadoId: voucher.empleadoId,
        empleadoNombre: `${voucher.Empleados.nombre} ${voucher.Empleados.apellido}`,
        fechaPago: voucher.fechaPago.toISOString(),
        diasTrabajados: voucher.diasTrabajados,
        salarioDiario: Number(voucher.salarioDiario),
        salarioMensual: Number(voucher.salarioMensual),
        netoPagar: Number(voucher.netoPagar),
        observaciones: voucher.observaciones || "",
        detalles,
      };

      // 3) Generar el HTML y enviar el correo
      const html = generateVoucherEmailHtml(vDto);
      const emailService = new EmailService();
      await emailService.sendMail({
        to: empleadoCorreo,
        subject: "Tu recibo de pago",
        html,
      });

      sent.push(id);
    } catch (error) {
      console.error(`Error enviando email para voucher ${id}:`, error);
      failed.push(id);
    }
  }

  return { sent, failed };
}

/**
 * Obtiene el template inicial para el formulario:
 * - Empleados activos
 * - Ajustes (bonos/deducciones) activos, incluyendo su montoPorDefecto
 */
export async function getTemplate(): Promise<VoucherTemplateResponse> {
  try {
    // 1) Empleados activos
    const empleados = await prisma.empleados.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    const empleadosMapped = empleados.map((e) => ({
      empleadoId: e.id,
      nombreCompleto: `${e.nombre} ${e.apellido}`,
      diasTrabajados: 0,
      salarioDiario: 0,
      salarioMensual: 0,
      netoPagar: 0,
    }));

    // 2) Ajustes activos (antes TipoDeducciones)
    const ajustes = await prisma.ajusteTipo.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    const ajustesMapped: AjusteTemplate[] = ajustes.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      descripcion: a.descripcion ?? "",
      categoria: a.categoria,               // "DEDUCCION" o "BONO"
      montoPorDefecto: a.montoPorDefecto.toNumber(), // convertir Decimal a number
      activo: a.activo,
    }));

    return {
      empleados: empleadosMapped,
      ajustes: ajustesMapped,
    };
  } catch (error) {
    console.error("Error al obtener el template:", error);
    return {
      empleados: [],
      ajustes: [],
    };
  }
}
