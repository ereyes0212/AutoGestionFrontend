"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RegistroPago } from "./type";

export async function getVoucherPagos(): Promise<RegistroPago[]> {
  try {
    const records = await prisma.voucherPagos.findMany({
      orderBy: { FechaPago: "desc" },
      include: {

        Empleados: {
          include: {
            Puesto: true,
          }
        },
        DetalleVoucherPagos: {
          include: {
            TipoDeducciones: true,
          },
        },
      },
    });

    return records.map(v => ({
      id: v.Id,
      fechaPago: v.FechaPago.toISOString(),
      diasTrabajados: v.DiasTrabajados,
      salarioDiario: Number(v.SalarioDiario),
      salarioMensual: Number(v.SalarioMensual),
      netoPagar: Number(v.NetoPagar),
      observaciones: v.Observaciones,
      empleadoId: v.Empleados.id,
      empleadoNombre: `${v.Empleados.nombre} ${v.Empleados.apellido}`,
      empleadoPuesto: v.Empleados.Puesto.Nombre || "",
      detalles: v.DetalleVoucherPagos.map(d => ({
        id: d.Id,
        tipoDeduccionId: d.TipoDeduccionId,
        tipoDeduccionNombre: d.TipoDeducciones?.Nombre || "",
        monto: Number(d.Monto),
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
      where: { EmpleadoId: idEmp },
      orderBy: { FechaPago: "desc" },
      include: {

        Empleados: {
          include: {
            Puesto: true,
          }
        },
        DetalleVoucherPagos: {
          include: {
            TipoDeducciones: true,
          },
        },
      },
    });

    return records.map(v => ({
      id: v.Id,
      fechaPago: v.FechaPago.toISOString(),
      diasTrabajados: v.DiasTrabajados,
      salarioDiario: Number(v.SalarioDiario),
      salarioMensual: Number(v.SalarioMensual),
      netoPagar: Number(v.NetoPagar),
      observaciones: v.Observaciones,
      empleadoId: v.Empleados.id,
      empleadoNombre: `${v.Empleados.nombre} ${v.Empleados.apellido}`,
      empleadoPuesto: v.Empleados.Puesto.Nombre || "",
      detalles: v.DetalleVoucherPagos.map(d => ({
        id: d.Id,
        tipoDeduccionId: d.TipoDeduccionId,
        tipoDeduccionNombre: d.TipoDeducciones?.Nombre || "",
        monto: Number(d.Monto),
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
      where: { Id: id },
      include: {

        Empleados: {
          include: {
            Puesto: true,
          }
        },
        DetalleVoucherPagos: {
          include: {
            TipoDeducciones: true,
          },
        },
      },
    });

    if (!v) return null;

    return {
      id: v.Id,
      fechaPago: v.FechaPago.toISOString(),
      diasTrabajados: v.DiasTrabajados,
      salarioDiario: Number(v.SalarioDiario),
      salarioMensual: Number(v.SalarioMensual),
      netoPagar: Number(v.NetoPagar),
      observaciones: v.Observaciones,
      empleadoId: v.Empleados.id,
      empleadoNombre: `${v.Empleados.nombre} ${v.Empleados.apellido}`,
      empleadoPuesto: v.Empleados.Puesto?.Nombre || "",
      detalles: v.DetalleVoucherPagos.map(d => ({
        id: d.Id,
        tipoDeduccionId: d.TipoDeduccionId,
        tipoDeduccionNombre: d.TipoDeducciones.Nombre || "",
        monto: Number(d.Monto),
      })),
    };
  } catch (error) {
    console.error("Error al obtener el voucher por ID:", error);
    return null;
  }
}
