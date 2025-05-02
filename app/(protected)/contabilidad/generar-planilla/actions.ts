// app/empleados/actions.ts
"use server";

import apiService from "../../../../lib/server";
import { VoucherDto, VoucherTemplateResponse } from "./types";

export async function getTemplate(): Promise<VoucherTemplateResponse> {
    try {
        const response = await apiService.get<VoucherTemplateResponse>(
            "/VoucherPago/template"
        );
        return response.data;
    } catch (error) {
        console.error("Error al obtener template:", error);
        // Devolver estructura vacía para no romper la UI
        return {
            empleados: [],
            tiposDeducciones: []
        };
    }
}

export async function saveVouchers(vouchers: VoucherDto[]) {
    // Enviar cada voucher al endpoint POST /api/VoucherPago
    for (const v of vouchers) {
        await apiService.post<VoucherDto>("/VoucherPago", v);
    }
}
