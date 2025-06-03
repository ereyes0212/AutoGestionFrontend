// types/voucher-template.ts

export interface EmpleadoTemplate {
    empleadoId: string;
    nombreCompleto: string;
    diasTrabajados: number;
    salarioDiario: number;
    salarioMensual: number;
    netoPagar: number;
}

export interface AjusteTemplate {
    id: string;
    nombre: string;
    descripcion: string;
    categoria: "DEDUCCION" | "BONO";
    montoPorDefecto: number;
    activo: boolean;
}

export interface VoucherTemplateResponse {
    empleados: EmpleadoTemplate[];
    ajustes: AjusteTemplate[];
}
// types/voucher.ts

export interface DetalleVoucherDto {
    ajusteTipoId: string;
    ajusteTipoNombre: string;
    categoria: "DEDUCCION" | "BONO";
    montoPorDefecto: string; // El valor por defecto del ajuste
    monto: string;           // El monto realmente aplicado en este voucher
}

export interface VoucherDto {
    empleadoId: string;
    fechaPago: string;       // ISO date, p.ej. "2025-04-30"
    diasTrabajados: number;
    salarioDiario: number;
    salarioMensual: number;
    netoPagar: number;
    observaciones: string;
    empleadoNombre: string;
    detalles: DetalleVoucherDto[];
}
