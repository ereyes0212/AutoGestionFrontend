// types/voucher-template.ts
export interface EmpleadoTemplate {
    empleadoId: string
    nombreCompleto: string
    diasTrabajados: number
    salarioDiario: number
    salarioMensual: number
    netoPagar: number
}

export interface TipoDeduccionTemplate {
    id: string
    nombre: string
    activo: boolean
    descripcion: string
}

export interface VoucherTemplateResponse {
    empleados: EmpleadoTemplate[]
    tiposDeducciones: TipoDeduccionTemplate[]
}


// types/voucher.ts
export interface DetalleVoucherDto {
    tipoDeduccionId: string
    tipoDeduccionNombre: string
    monto: string
}

export interface VoucherDto {
    empleadoId: string
    fechaPago: string       // ISO date, p.ej. "2025-04-30"
    diasTrabajados: number
    salarioDiario: number
    salarioMensual: number
    netoPagar: number
    observaciones: string
    detalles: DetalleVoucherDto[]
}
