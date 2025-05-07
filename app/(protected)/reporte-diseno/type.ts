export type ReporteDiseño = {
    id: string
    empleado: string
    tipoSeccion: string
    fechaRegistro: string // o Date, si lo parseas
    paginaInicio: string
    paginaFin: string
    horaInicio: string // o Date si lo conviertes
    horaFin: string // lo mismo
    observacion: string
}
