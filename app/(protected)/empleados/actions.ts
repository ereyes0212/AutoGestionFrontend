"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { Empleado, EmployeeImportDto } from "./type"; // Asegúrate de que `EmployeeImportDto` contenga todos los campos importados del Excel

/**
 * Obtiene todos los empleados con datos de puesto y jefe
 */
export async function getEmpleados(): Promise<Empleado[]> {
  const records = await prisma.empleados.findMany({
    include: {
      Usuarios: true,
      Puesto: true,
      Empleados: { select: { id: true, nombre: true, apellido: true } },
    },
  });

  return records.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    correo: r.correo,
    fechaNacimiento: r.FechaNacimiento ?? new Date(0),
    fechaIngreso: r.fechaIngreso ?? new Date(0),
    numeroIdentificacion: r.numeroIdentificacion,
    departamentoDomicilio: r.departamentoDomicilio ?? "",
    ciudadDomicilio: r.ciudadDomicilio ?? "",
    colonia: r.colonia ?? "",
    telefono: r.telefono ?? "",
    profesion: r.profesion ?? "",
    vacaciones: r.Vacaciones,
    genero: r.genero ?? "",
    activo: r.activo,
    usuario: r.Usuarios?.usuario ?? "Sin Usuario",
    puesto_id: r.puesto_id,
    jefe_id: r.jefe_id ?? undefined,
    jefe: r.Empleados ? `${r.Empleados.nombre} ${r.Empleados.apellido}` : "Sin Jefe",
    puesto: r.Puesto.Nombre,
  }));
}

/**
 * Empleados sin usuario asignado
 */
export async function getEmpleadosSinUsuario(): Promise<Empleado[]> {
  const records = await prisma.empleados.findMany({
    where: { Usuarios: null },
    include: { Puesto: true },
  });
  return records.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    correo: r.correo,
    fechaNacimiento: r.FechaNacimiento ?? new Date(0),
    fechaIngreso: r.fechaIngreso ?? new Date(0),
    numeroIdentificacion: r.numeroIdentificacion,
    departamentoDomicilio: r.departamentoDomicilio ?? "",
    ciudadDomicilio: r.ciudadDomicilio ?? "",
    colonia: r.colonia ?? "",
    telefono: r.telefono ?? "",
    profesion: r.profesion ?? "",
    vacaciones: r.Vacaciones,
    genero: r.genero ?? "",
    activo: r.activo,
    usuario: null,
    puesto_id: r.puesto_id,
    jefe_id: r.jefe_id ?? undefined,
    jefe: undefined,
    puesto: r.Puesto.Nombre,
  }));
}

/**
 * Obtener un empleado por ID
 */
export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  const r = await prisma.empleados.findUnique({
    where: { id },
    include: {
      Puesto: true,
      Empleados: { select: { nombre: true, apellido: true, id: true } },
      Usuarios: true,
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    apellido: r.apellido,
    correo: r.correo,
    fechaNacimiento: r.FechaNacimiento ?? new Date(0),
    fechaIngreso: r.fechaIngreso ?? new Date(0),
    numeroIdentificacion: r.numeroIdentificacion,
    departamentoDomicilio: r.departamentoDomicilio ?? "",
    ciudadDomicilio: r.ciudadDomicilio ?? "",
    colonia: r.colonia ?? "",
    telefono: r.telefono ?? "",
    profesion: r.profesion ?? "",
    vacaciones: r.Vacaciones,
    genero: r.genero ?? "",
    activo: r.activo,
    usuario: r.Usuarios?.usuario ?? null,
    puesto_id: r.puesto_id,
    jefe_id: r.jefe_id ?? undefined,
    jefe: r.Empleados ? `${r.Empleados.nombre} ${r.Empleados.apellido}` : undefined,
    puesto: r.Puesto.Nombre,
  };
}

/**
 * Crea un nuevo empleado
 */
export async function createEmpleado(data: Empleado): Promise<Empleado> {
  const id = data.id ?? randomUUID();
  const r = await prisma.empleados.create({
    data: {
      id,
      nombre: data.nombre,
      apellido: data.apellido,
      correo: data.correo,
      FechaNacimiento: data.fechaNacimiento,
      fechaIngreso: data.fechaIngreso,
      numeroIdentificacion: data.numeroIdentificacion,
      departamentoDomicilio: data.departamentoDomicilio,
      ciudadDomicilio: data.ciudadDomicilio,
      colonia: data.colonia,
      telefono: data.telefono,
      profesion: data.profesion,
      Vacaciones: data.vacaciones ?? 0,
      genero: data.genero,
      activo: data.activo ?? true,
      puesto_id: data.puesto_id,
      jefe_id: data.jefe_id,
    },
  });
  return getEmpleadoById(r.id) as Promise<Empleado>;
}

/**
 * Actualiza un empleado existente
 */
export async function updateEmpleado(
  id: string,
  data: Partial<Empleado>
): Promise<Empleado | null> {
  const r = await prisma.empleados.update({
    where: { id },
    data: {
      nombre: data.nombre,
      apellido: data.apellido,
      correo: data.correo,
      FechaNacimiento: data.fechaNacimiento,
      fechaIngreso: data.fechaIngreso,
      numeroIdentificacion: data.numeroIdentificacion,
      departamentoDomicilio: data.departamentoDomicilio,
      ciudadDomicilio: data.ciudadDomicilio,
      colonia: data.colonia,
      telefono: data.telefono,
      profesion: data.profesion,
      Vacaciones: data.vacaciones,
      genero: data.genero,
      activo: data.activo,
      puesto_id: data.puesto_id,
      jefe_id: data.jefe_id === "" ? null : data.jefe_id,
    },
  });
  return getEmpleadoById(r.id);
}

/**
 * Acción para importar puestos y empleados desde un array de datos del Excel.
 * Si el puesto ya existe, solo devuelve su id; si no, crea uno nuevo.
 * Para cada fila, crea el empleado mapeando todos los campos necesarios.
 */
export async function importEmpleadosFromExcel(
  rows: EmployeeImportDto[]
): Promise<void> {
  // 1) Extraer todos los nombres de puestos únicos del Excel
  const nombresPuestos = Array.from(
    new Set(rows.map((r) => r.cargo.trim()).filter((c) => c !== ""))
  );

  // 2) Buscar puestos existentes
  const puestosExistentes = await prisma.puesto.findMany({
    where: { Nombre: { in: nombresPuestos } },
  });
  const mapaPuestosExistentes = Object.fromEntries(
    puestosExistentes.map((p) => [p.Nombre, p.Id])
  );

  // 3) Crear los puestos que faltan
  const puestosParaCrear = nombresPuestos.filter(
    (nombre) => !(nombre in mapaPuestosExistentes)
  );
  for (const nombre of puestosParaCrear) {
    const nuevo = await prisma.puesto.create({
      data: {
        Id: randomUUID(),
        Nombre: nombre,
        Descripcion: "",
        Activo: true,
      },
    });
    mapaPuestosExistentes[nombre] = nuevo.Id;
  }

  // 4) Ahora, para cada fila del Excel, creamos el empleado asignando el puesto_id adecuado
  for (const r of rows) {
    const cargo = r.cargo.trim();
    const puestoId = mapaPuestosExistentes[cargo];

    // Omitir si no hay cargo válido. (Opcional: podrías arrojar un error o loguear)
    if (!puestoId) continue;

    // Verificar si ya existe un empleado con el mismo número de identificación o correo
    const existeEmpleado = await prisma.empleados.findFirst({
      where: {
        OR: [
          { numeroIdentificacion: r.numeroIdentificacion },
          { correo: r.email.trim() },
        ],
      },
    });
    if (existeEmpleado) {
      // Si ya existe, podrías actualizarlo en lugar de crear uno nuevo:
      await prisma.empleados.update({
        where: { id: existeEmpleado.id },
        data: {
          nombre: r.nombres.trim(),
          apellido: r.apellidos.trim(),
          FechaNacimiento: r.fechaNacimiento
            ? new Date(r.fechaNacimiento)
            : null,
          fechaIngreso: r.fechaIngreso
            ? new Date(r.fechaIngreso)
            : null,
          departamentoDomicilio: r.departamento.trim(),
          ciudadDomicilio: r.ciudad.trim(),
          colonia: r.colonia.trim(),
          telefono: r.telefono.trim(),
          profesion: r.profesion.trim(),
          Vacaciones: r.vacaciones ?? existeEmpleado.Vacaciones,
          genero: r.genero.trim(),
          activo: r.activo ?? existeEmpleado.activo,
          puesto_id: puestoId,
          jefe_id: r.jefe_id ?? null,
        },
      });
    } else {
      // Si no existe, lo creamos
      await prisma.empleados.create({
        data: {
          id: randomUUID(),
          nombre: r.nombres.trim(),
          apellido: r.apellidos.trim(),
          correo: r.email.trim(),
          numeroIdentificacion: r.numeroIdentificacion.trim(),
          FechaNacimiento: r.fechaNacimiento
            ? new Date(r.fechaNacimiento)
            : null,
          fechaIngreso: r.fechaIngreso
            ? new Date(r.fechaIngreso)
            : null,
          departamentoDomicilio: r.departamento.trim(),
          ciudadDomicilio: r.ciudad.trim(),
          colonia: r.colonia.trim(),
          telefono: r.telefono.trim(),
          profesion: r.profesion.trim(),
          Vacaciones: r.vacaciones ?? 0,
          genero: r.genero.trim(),
          activo: r.activo ?? true,
          puesto_id: puestoId,
          jefe_id: r.jefe_id ?? null,
        },
      });
    }
  }

  // Nota: Podrías envolver esto en una transacción si quieres asegurar atomicidad:
  // await prisma.$transaction([...]).
}
