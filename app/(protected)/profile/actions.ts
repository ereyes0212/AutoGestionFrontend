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
    fechaIngreso: e.fechaIngreso ?? new Date(0), // Asegúrate de que 'fechaIngreso' tenga un valor por defecto
    profesion: e.profesion || "No especificada", // Asegúrate de que 'profesion' tenga un valor por defecto
    numeroIdentificacion: e.numeroIdentificacion || "No especificado", // Asegúrate de que 'numeroIdentificacion' tenga un valor por defecto
    departamentoDomicilio: e.departamentoDomicilio || "No especificado", // Asegúrate de que 'departamentoDomicilio' tenga un valor por defecto
    colonia: e.colonia || "No especificada", // Asegúrate de que 'colonia' tenga un valor por defecto
    ciudadDomicilio: e.ciudadDomicilio || "No especificada", // Asegúrate de que 'ciudadDomicilio' tenga un valor por defecto
    nombre: e.nombre,
    apellido: e.apellido,
    correo: e.correo,
    fechaNacimiento: e.FechaNacimiento ?? new Date(0),
    vacaciones: e.Vacaciones,
    genero: e.genero || "No especificado", // Asegúrate de que 'genero' tenga un valor por defecto
    activo: e.activo,
    usuario: e.Usuarios?.usuario ?? "Sin usuario", // Asegúrate de que 'usuario' tenga un valor por defecto
    usuario_id: e.Usuarios?.id ?? "", // Asegúrate de que 'usuario_id' exista en el modelo
    puesto_id: e.puesto_id,
    puesto: e.Puesto?.Nombre ?? "Sin Puesto", // Asegúrate de que 'puesto' tenga un valor por defecto
    jefe_id: e.jefe_id ?? "",
    jefe: e.Empleados ? `${e.Empleados.nombre} ${e.Empleados.apellido}` : "",
    telefono: e.telefono || "No especificado", // Asegúrate de que 'telefono' tenga un valor por defecto
    createAt: e.createAt ?? new Date(0), // Asegúrate de que 'createAt' tenga un valor por defecto
    updateAt: e.updateAt ?? new Date(0), // Asegúrate de que 'updateAt' tenga un valor por defecto
  };
}
