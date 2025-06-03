// app/contabilidad/generar-planilla/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { VoucherDto, VoucherTemplateResponse } from "./types";

/**
 * Guarda un arreglo de VoucherDto y retorna los IDs generados de cada voucher.
 */
export async function saveVouchers(vouchers: VoucherDto[]): Promise<string[]> {
    try {
        const createdIds: string[] = [];

        for (const v of vouchers) {
            const voucherId = randomUUID();

            await prisma.voucherPagos.create({
                data: {
                    Id: voucherId,
                    EmpleadoId: v.empleadoId,
                    DiasTrabajados: v.diasTrabajados,
                    SalarioDiario: v.salarioDiario,
                    SalarioMensual: v.salarioMensual,
                    NetoPagar: v.netoPagar,
                    FechaPago: new Date(v.fechaPago),
                    Observaciones: v.observaciones,
                    created_at: new Date(),
                    DetalleVoucherPagos: {
                        createMany: {
                            data: v.detalles.map((d) => ({
                                Id: randomUUID(),
                                TipoDeduccionId: d.tipoDeduccionId,
                                Monto: Number(d.monto),
                                created_at: new Date(),
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
                where: { Id: id },
                include: {
                    DetalleVoucherPagos: {
                        select: {
                            TipoDeducciones: {
                                select: { Id: true, Nombre: true },
                            },
                            Monto: true,
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
            const detalles: {
                tipoDeduccionId: string;
                tipoDeduccionNombre: string;
                monto: string;
            }[] = voucher.DetalleVoucherPagos.map((d) => ({
                tipoDeduccionId: d.TipoDeducciones.Id,
                tipoDeduccionNombre: d.TipoDeducciones.Nombre,
                monto: d.Monto.toString(),
            }));

            const vDto: VoucherDto = {
                empleadoId: voucher.EmpleadoId,
                empleadoNombre: `${voucher.Empleados.nombre} ${voucher.Empleados.apellido}`,
                fechaPago: voucher.FechaPago.toISOString(),
                diasTrabajados: voucher.DiasTrabajados,
                salarioDiario: Number(voucher.SalarioDiario),
                salarioMensual: Number(voucher.SalarioMensual),
                netoPagar: Number(voucher.NetoPagar),
                observaciones: voucher.Observaciones || "",
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
 * Obtiene el template inicial para el formulario (empleados + tipos de deducción).
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

        // 2) Tipos de deducción activos
        const tipos = await prisma.tipoDeducciones.findMany({
            where: { Activo: true },
            orderBy: { Nombre: "asc" },
        });

        const tiposMapped = tipos.map((td) => ({
            id: td.Id,
            nombre: td.Nombre,
            descripcion: td.Descripcion ?? "",
            activo: td.Activo,
        }));

        return {
            empleados: empleadosMapped,
            tiposDeducciones: tiposMapped,
        };
    } catch (error) {
        console.error("Error al obtener el template:", error);
        return {
            empleados: [],
            tiposDeducciones: [],
        };
    }
}
