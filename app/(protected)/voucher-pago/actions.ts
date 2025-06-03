"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RegistroPago } from "./type";

export async function getVoucherPagos(): Promise<RegistroPago[]> {
  try {
    const records = await prisma.voucherPagos.findMany({
      orderBy: { fechaPago: "desc" },
      include: {

        Empleados: {
          include: {
            Puesto: true,
          }
        },
        DetalleVoucherPagos: {
          include: {
            AjusteTipo: true,
          },
        },
      },
    });

    return records.map(v => ({
      id: v.id,
      fechaPago: v.fechaPago.toISOString(),
      diasTrabajados: v.diasTrabajados,
      salarioDiario: Number(v.salarioDiario),
      salarioMensual: Number(v.salarioMensual),
      netoPagar: Number(v.netoPagar),
      observaciones: v.observaciones,
      empleadoId: v.Empleados.id,
      empleadoNombre: `${v.Empleados.nombre} ${v.Empleados.apellido}`,
      empleadoPuesto: v.Empleados.Puesto.Nombre || "",
      detalles: v.DetalleVoucherPagos.map(d => ({
        categoria: d.AjusteTipo.categoria, // "DEDUCCION" o "BONO"
        id: d.id,
        tipoDeduccionId: d.ajusteTipoId,
        tipoDeduccionNombre: d.AjusteTipo?.nombre || "",
        monto: Number(d.monto),
      })),
    }));
  } catch (error) {
    console.error("Error al obtener los vouchers:", error);
    return [];
  }
}
export async function getVoucherPagosByEmpleado(): Promise<RegistroPago[]> {
  const session = await getSession();
  const idEmp = session?.IdEmpleado;
  try {
    const records = await prisma.voucherPagos.findMany({
      where: { empleadoId: idEmp },
      orderBy: { fechaPago: "desc" },
      include: {

        Empleados: {
          include: {
            Puesto: true,
          }
        },
        DetalleVoucherPagos: {
          include: {
            AjusteTipo: true,
          },
        },
      },
    });

    return records.map(v => ({
      id: v.id,
      fechaPago: v.fechaPago.toISOString(),
      diasTrabajados: v.diasTrabajados,
      salarioDiario: Number(v.salarioDiario),
      salarioMensual: Number(v.salarioMensual),
      netoPagar: Number(v.netoPagar),
      observaciones: v.observaciones,
      empleadoId: v.Empleados.id,
      empleadoNombre: `${v.Empleados.nombre} ${v.Empleados.apellido}`,
      empleadoPuesto: v.Empleados.Puesto.Nombre || "",
      detalles: v.DetalleVoucherPagos.map(d => ({
        categoria: d.AjusteTipo.categoria, // "DEDUCCION" o "BONO"
        id: d.id,
        tipoDeduccionId: d.ajusteTipoId,
        tipoDeduccionNombre: d.AjusteTipo?.nombre || "",
        monto: Number(d.monto),
      })),
    }));
  } catch (error) {
    console.error("Error al obtener los vouchers:", error);
    return [];
  }
}

export async function getVoucherPagoId(id: string): Promise<RegistroPago | null> {
  try {
    const v = await prisma.voucherPagos.findUnique({
      where: { id: id },
      include: {

        Empleados: {
          include: {
            Puesto: true,
          }
        },
        DetalleVoucherPagos: {
          include: {
            AjusteTipo: true,
          },
        },
      },
    });

    if (!v) return null;

    return {
      id: v.id,
      fechaPago: v.fechaPago.toISOString(),
      diasTrabajados: v.diasTrabajados,
      salarioDiario: Number(v.salarioDiario),
      salarioMensual: Number(v.salarioMensual),
      netoPagar: Number(v.netoPagar),
      observaciones: v.observaciones,
      empleadoId: v.Empleados.id,
      empleadoNombre: `${v.Empleados.nombre} ${v.Empleados.apellido}`,
      empleadoPuesto: v.Empleados.Puesto?.Nombre || "",
      detalles: v.DetalleVoucherPagos.map(d => ({
        categoria: d.AjusteTipo.categoria, // "DEDUCCION" o "BONO"
        id: d.id,
        tipoDeduccionId: d.ajusteTipoId,
        tipoDeduccionNombre: d.AjusteTipo.nombre || "",
        monto: Number(d.monto),
      })),
    };
  } catch (error) {
    console.error("Error al obtener el voucher por ID:", error);
    return null;
  }
}
