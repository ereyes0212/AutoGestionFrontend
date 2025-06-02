"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { VoucherDto, VoucherTemplateResponse } from "./types";

export async function getTemplate(): Promise<VoucherTemplateResponse> {
    try {
        // 1) Empleados activos
        const empleados = await prisma.empleados.findMany({
            where: { activo: true },
            orderBy: { nombre: "asc" },
        });

        const empleadosMapped = empleados.map(e => ({
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

        const tiposMapped = tipos.map(td => ({
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

export async function saveVouchers(vouchers: VoucherDto[]) {
    try {
        for (const v of vouchers) {
            const voucherId = randomUUID();

            // 1. Crear el voucher principal
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
                            data: v.detalles.map(d => ({
                                Id: randomUUID(),
                                TipoDeduccionId: d.tipoDeduccionId,
                                Monto: d.monto,
                                created_at: new Date(),
                            })),
                        },
                    },
                },
            });
        }
    } catch (error) {
        console.error("Error al guardar los vouchers:", error);
        throw error;
    }
}

