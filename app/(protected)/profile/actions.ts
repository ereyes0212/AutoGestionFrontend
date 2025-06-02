"use server";

import { getSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Employee } from "./type"; // Asegúrate que este tipo tenga los campos que se muestran abajo

/**
 * Obtiene el perfil del empleado autenticado.
 */
export async function getProfile(): Promise<Employee | null> {
  const session = await getSession();
  const idEmpleado = session?.IdEmpleado;
  if (!idEmpleado) {
    console.error("Empleado no autenticado");
    return null;
  }

  // 2️⃣ Buscar en la BD el empleado con sus relaciones
  const e = await prisma.empleados.findFirst({
    where: { id: idEmpleado },
    include: {
      Usuarios: true,
      Puesto: true,
      Empleados: { select: { id: true, nombre: true, apellido: true } }, // relación “jefe”
    },
  });

  if (!e) {
    console.error("Empleado no encontrado");
    return null;
  }

  // 3️⃣ Mapear al tipo Employee que espera el frontend
  return {
    id: e.id,
    nombre: e.nombre,
    apellido: e.apellido,
    correo: e.correo,
    fechaNacimiento: e.FechaNacimiento ?? new Date(0),
    vacaciones: e.Vacaciones,
    genero: e.genero,
    activo: e.activo,
    usuario: e.Usuarios?.usuario ?? "",
    usuario_id: e.Usuarios?.id ?? "", // Asegúrate de que 'usuario_id' exista en el modelo
    puesto_id: e.puesto_id,
    puesto: e.Puesto?.Nombre ?? "",
    jefe_id: e.jefe_id ?? "",
    jefe: e.Empleados ? `${e.Empleados.nombre} ${e.Empleados.apellido}` : "",
  };
}
