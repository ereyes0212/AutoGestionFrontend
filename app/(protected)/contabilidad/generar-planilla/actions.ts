"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { AjusteTemplate, PayrollImportPreview, VoucherDto, VoucherTemplateResponse } from "./types";

type PayrollAdjustment = { nombre: string; categoria: "DEDUCCION" | "BONO"; monto: number };

const normalizeDni = (value: string) => value.replace(/-/g, "");

async function getOrCreateAjusteTipo(adjustment: PayrollAdjustment) {
  const existing = await prisma.ajusteTipo.findFirst({
    where: { nombre: adjustment.nombre, categoria: adjustment.categoria },
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const parseMoney = (v: any): number => {
  if (!v && v !== 0) return 0;
  if (typeof v === "number") return v;
  return Number(String(v).replace(/[^\d.-]/g, "")) || 0;
};

/**
 * Lee un valor del array por índice de columna Excel (base 1).
 * Col A = 1, Col B = 2, Col C = 3 … etc.
 *
 * Estructura real del Excel:
 *   B(2)  N° correlativo
 *   C(3)  Nombre empleado
 *   D(4)  DNI              ← clave para buscar al empleado
 *   E(5)  Puesto
 *   F(6)  Oficina
 *   G(7)  Días trabajados
 *   H(8)  Salario diario
 *   I(9)  Salario mensual
 *   J(10) Retención ISR
 *   K(11) Retención IHSS
 *   L(12) Retención RAP
 *   M(13) Impuesto Personal Municipal
 *   N(14) Deducción anticipo salario
 *   O(15) Total deducciones
 *   P(16) Reembolsos
 *   Q(17) Retroactivo SM
 *   R(18) Bonos
 *   S(19) Feriados
 *   T(20) Neto a pagar
 *   U(21) Método de pago
 */
const normalizeRow = (row: any) => {
  // Aceptamos tanto arrays como objetos (por si cambia el cliente)
  const values: any[] = Array.isArray(row) ? row : Object.values(row ?? {});

  // col(n) lee la columna Excel n (base 1) → índice JS n-1
  const col = (n: number) => values[n - 1] ?? null;

  return {
    empleadoNombre: String(col(3) ?? "").trim(),
    dni: String(col(4) ?? "").trim(),   // ← DNI en col D
    puesto: String(col(5) ?? "").trim(),
    oficina: String(col(6) ?? "").trim(),
    diasTrabajados: Number(col(7) ?? 0),
    salarioDiario: parseMoney(col(8)),
    salarioMensual: parseMoney(col(9)),
    retencionFuenteISR: parseMoney(col(10)),
    retencionIHSS: parseMoney(col(11)),
    retencionRAP: parseMoney(col(12)),
    impuestoPersonalMunicipal: parseMoney(col(13)),
    deduccionAnticipoSalario: parseMoney(col(14)),
    totalDeducciones: parseMoney(col(15)),
    reembolsos: parseMoney(col(16)),
    retroactivoSM: parseMoney(col(17)),
    bonos: parseMoney(col(18)),
    feriados: parseMoney(col(19)),
    netoPagar: parseMoney(col(20)),
    metodoPago: String(col(21) ?? "").trim(),
  };
};

// ─── PREVIEW ─────────────────────────────────────────────────────────────────

export async function previewPayrollImport(
  rows: any[]   // arrays crudos de SheetJS (header:1, defval:null)
): Promise<PayrollImportPreview> {
  const empleados = await prisma.empleados.findMany({
    where: { activo: true },
    include: { Puesto: true },
  });

  const byDni = new Map(
    empleados.map((e) => [normalizeDni(e.numeroIdentificacion), e])
  );

  console.log("📥 Total filas recibidas:", rows.length);

  const validRows: ReturnType<typeof normalizeRow>[] = [];
  let started = false;

  for (const [i, rawRow] of rows.entries()) {
    const row = normalizeRow(rawRow);
    const dniRaw = row.dni;
    const dniClean = normalizeDni(dniRaw);
    const digits = dniClean.replace(/\D/g, "");

    // DNI hondureño: 13 dígitos o formato NNNN-NNNN-NNNNN
    const isDni =
      /^\d{13}$/.test(digits) ||
      /^\d{4}-\d{4}-\d{5}$/.test(dniRaw);

    console.log(`🔎 fila ${i + 1} → dni: "${dniRaw}" | válido: ${isDni}`);

    if (!started) {
      if (isDni) {
        started = true;
        console.log("🚀 Primera fila de datos detectada:", i + 1);
      } else {
        continue; // todavía estamos en filas de título/cabecera
      }
    }

    // Fin de datos: fila "GRAN TOTAL"
    if (row.empleadoNombre.toUpperCase().includes("GRAN TOTAL")) {
      console.log("🛑 Fin detectado (GRAN TOTAL) en fila", i + 1);
      break;
    }

    if (!isDni) continue; // fila vacía o subtotal intermedio

    validRows.push(row);
  }

  console.log("✅ Filas válidas:", validRows.length);

  return {
    rows: validRows.map((row, index) => {
      const empleado = byDni.get(normalizeDni(row.dni));
      return {
        ...row,
        rowNumber: index + 1,
        empleadoId: empleado?.id ?? "",
        empleadoNombre: empleado
          ? `${empleado.nombre} ${empleado.apellido}`
          : row.empleadoNombre,
        empleadoPuesto: empleado?.Puesto?.Nombre ?? row.puesto,
        estado: empleado ? "VALIDO" as const : "ERROR" as const,
        errores: empleado ? [] : [`No se encontró empleado con DNI ${row.dni}`],
        detalles: [],
        fechaPago: "",          // ← se asigna en el cliente al guardar
        observaciones: `Oficina: ${row.oficina}`,  // ← se genera aquí
      };
    }),
  };
}

// ─── SAVE ────────────────────────────────────────────────────────────────────

export async function saveVouchers(vouchers: VoucherDto[]): Promise<string[]> {
  try {
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
  } catch (error) {
    console.error("Error al guardar los vouchers:", error);
    throw error;
  }
}

// ─── SEND EMAILS ─────────────────────────────────────────────────────────────

export async function sendVoucherEmails(
  voucherIds: string[]
): Promise<{ sent: string[]; failed: string[] }> {
  const { EmailService } = await import("@/lib/sendEmail");
  const { generateVoucherEmailHtml } = await import("@/lib/templates/voucherEmail");

  const sent: string[] = [];
  const failed: string[] = [];

  for (const id of voucherIds) {
    try {
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

      if (!voucher || !voucher.Empleados?.correo) {
        failed.push(id);
        continue;
      }

      const detalles = voucher.DetalleVoucherPagos.map((d) => ({
        ajusteTipoId: d.AjusteTipo.id,
        ajusteTipoNombre: d.AjusteTipo.nombre,
        categoria: d.AjusteTipo.categoria,
        montoPorDefecto: d.AjusteTipo.montoPorDefecto.toString(),
        monto: d.monto.toString(),
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

      const html = generateVoucherEmailHtml(vDto);
      await new EmailService().sendMail({
        to: voucher.Empleados.correo,
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

// ─── TEMPLATE ────────────────────────────────────────────────────────────────

export async function getTemplate(): Promise<VoucherTemplateResponse> {
  try {
    const empleados = await prisma.empleados.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    const ajustes = await prisma.ajusteTipo.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
    });

    return {
      empleados: empleados.map((e) => ({
        empleadoId: e.id,
        nombreCompleto: `${e.nombre} ${e.apellido}`,
        diasTrabajados: 0,
        salarioDiario: 0,
        salarioMensual: 0,
        netoPagar: 0,
      })),
      ajustes: ajustes.map((a): AjusteTemplate => ({
        id: a.id,
        nombre: a.nombre,
        descripcion: a.descripcion ?? "",
        categoria: a.categoria,
        montoPorDefecto: a.montoPorDefecto.toNumber(),
        activo: a.activo,
      })),
    };
  } catch (error) {
    console.error("Error al obtener el template:", error);
    return { empleados: [], ajustes: [] };
  }
}