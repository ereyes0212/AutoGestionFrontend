// app/contabilidad/generar-planilla/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { AjusteTemplate, VoucherDto, VoucherTemplateResponse } from "./types";

/**
 * Guarda un arreglo de VoucherDto y retorna los IDs generados de cada voucher.
 * Ahora el detalle utiliza `ajusteTipoId` y el monto se toma de `d.monto`.
 */
export async function saveVouchers(vouchers: VoucherDto[]): Promise<string[]> {
    try {
        const createdIds: string[] = [];

        for (const v of vouchers) {
            const voucherId = randomUUID();

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
                    DetalleVoucherPagos: {
                        createMany: {
                            data: v.detalles.map((d) => ({
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
