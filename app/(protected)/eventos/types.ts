
import { Decimal } from "@/lib/generated/prisma/runtime/library";
import { Empleado } from "../empleados/type";

export type Evento = {
    id?: string;
    titulo: string;
    descripcion?: string;
    fecha: Date;
    ubicacion?: string;
    empleadoId: string;
    facturaAdjunta?: string;
    notaEnlace?: string;
    monto: Decimal;
    createAt?: Date;
    actualizadoAt?: Date;
    empleado?: Empleado;
    empleadoNombre?: string | null;

}
