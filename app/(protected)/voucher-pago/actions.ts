"use server";



import ApiService from "@/lib/server";
import { RegistroPago } from "./type";
// import { ClienteElementSchema } from "./schema";

export async function getVoucherPagos() {
  try {
    const response = await ApiService.get<RegistroPago[]>("/VoucherPago/empleado");
    return response.data;
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    return [];
  }
}

export async function getVoucherPagoId(id: string) {
  try {
    const response = await ApiService.get<RegistroPago>(`/VoucherPago/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el tipo de deduccion:", error);
    return null;
  }
}


