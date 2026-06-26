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

export async function previewPayrollImport(
  rows: any[]
): Promise<PayrollImportPreview> {
  const empleados = await prisma.empleados.findMany({
    where: { activo: true },
    include: { Puesto: true },
  });

  const byDni = new Map(
    empleados.map((e) => [normalizeDni(e.numeroIdentificacion), e])
  );

  console.log("📥 ROWS RAW:");
  console.log("Total filas:", rows.length);

  const parseMoney = (v: any) => {
    if (!v) return 0;
    if (typeof v === "number") return v;
    return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
  };

  /**
   * 🔥 FIX REAL: el row del Excel viene como ARRAY, no objeto confiable
   * y empieza en columna B → por eso shift(1)
   */
  const normalizeRow = (row: any) => {
    const values = Array.isArray(row)
      ? row
      : Object.values(row ?? {});

    console.log("🧪 RAW ROW VALUES:", values);

    const shifted = values.slice(1); // 👈 CLAVE: elimina columna A fantasma

    const normalized = {
      empleadoNombre: String(shifted[1] ?? "").trim(),
      dni: String(shifted[2] ?? "").trim(),
      puesto: String(shifted[3] ?? "").trim(),
      oficina: String(shifted[4] ?? "").trim(),
      diasTrabajados: Number(shifted[5] ?? 0),
      salarioDiario: Number(shifted[6] ?? 0),
      salarioMensual: Number(shifted[7] ?? 0),

      retencionFuenteISR: parseMoney(shifted[8]),
      retencionIHSS: parseMoney(shifted[9]),
      retencionRAP: parseMoney(shifted[10]),
      impuestoPersonalMunicipal: parseMoney(shifted[11]),
      deduccionAnticipoSalario: parseMoney(shifted[12]),
      totalDeducciones: parseMoney(shifted[13]),
      reembolsos: parseMoney(shifted[14]),
      retroactivoSM: parseMoney(shifted[15]),
      bonos: parseMoney(shifted[16]),
      feriados: parseMoney(shifted[17]),
      netoPagar: parseMoney(shifted[18]),
      metodoPago: String(shifted[19] ?? "").trim(),
    };

    console.log("🧾 ROW NORMALIZADA:", normalized);

    return normalized;
  };

  const normalizedRows = rows.map(normalizeRow);

  console.log("🧾 TOTAL NORMALIZADAS:", normalizedRows.length);

  let started = false;
  const validRows: any[] = [];

  for (const [i, row] of normalizedRows.entries()) {
    const dni = normalizeDni(row.dni);

    const digits = dni.replace(/\D/g, "");

    const isDni =
      /^\d{13}$/.test(digits) || /^\d{4,}-\d{4,}-\d{4,}$/.test(dni);

    console.log(
      `🔎 fila ${i} → dni: ${dni} | digits: ${digits} | válido: ${isDni}`
    );

    if (!started) {
      if (isDni) {
        console.log("🚀 INICIO DETECTADO EN FILA:", i);
        started = true;
      } else {
        continue;
      }
    }

    if (String(row.empleadoNombre).toUpperCase().includes("GRAN TOTAL")) {
      console.log("🛑 FIN DETECTADO (GRAN TOTAL)");
      break;
    }

    if (!isDni) continue;

    validRows.push(row);
  }

  console.log("✅ VALID ROWS FINAL:", validRows.length);

  return {
    rows: validRows.map((row, index) => {
      const dni = String(row.dni ?? "");
      const empleado = byDni.get(normalizeDni(dni));

      return {
        ...row,
        rowNumber: index + 1,

        empleadoId: empleado?.id ?? "",
        empleadoNombre: empleado
          ? `${empleado.nombre} ${empleado.apellido}`
          : row.empleadoNombre,

        empleadoPuesto: empleado?.Puesto?.Nombre ?? row.puesto,

        estado: empleado ? "VALIDO" : "ERROR",

        errores: empleado
          ? []
          : [`No se encontró empleado con DNI ${dni}`],

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
