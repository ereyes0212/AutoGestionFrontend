export interface DeduccionDetalle {
    id: string
    tipoDeduccionId: string
    tipoDeduccionNombre: string
    monto: number
}

export interface RegistroPago {
    id: string
    empleadoId: string
    empleadoNombre: string
    empleadoPuesto: string
    fechaPago: string
    diasTrabajados: number
    salarioDiario: number
    salarioMensual: number
    netoPagar: number
    observaciones: string
    detalles: DeduccionDetalle[]
}
