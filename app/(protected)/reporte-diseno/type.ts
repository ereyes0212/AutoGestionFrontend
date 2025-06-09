export type ReporteDiseño = {
    Id?: string;
    Empleado: string;
    TipoSeccion?: string;
    SeccionId: string;
    FechaRegistro: Date;
    PaginaInicio: number;
    PaginaFin: number;
    HoraInicio: string;   // "HH:MM:SS"
    HoraFin: string;      // "HH:MM:SS"
    Observacion?: string;
};
