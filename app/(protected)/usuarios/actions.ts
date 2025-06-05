"use server";

import { prisma } from "@/lib/prisma";
import { EmailService, MailPayload } from "@/lib/sendEmail";
import { generateUserCreatedEmailHtml } from "@/lib/templates/createUserEmail";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "crypto";
import { Usuario, UsuarioCreate, UsuarioUpdate } from "./type";

/**
 * Obtener todos los usuarios con rol y empleado
 */
export async function getUsuarios(): Promise<Usuario[]> {
  const records = await prisma.usuarios.findMany({
    include: {
      rol: { select: { id: true, nombre: true } },
      Empleados: { select: { id: true, nombre: true, apellido: true } },
    },
  });
  return records.map((r) => ({
    id: r.id,
    usuario: r.usuario,
    rol: r.rol?.nombre ?? "",
    rol_id: r.rol_id,
    empleado: r.Empleados
      ? `${r.Empleados.nombre} ${r.Empleados.apellido}`
      : "",
    empleado_id: r.empleado_id,
    activo: r.activo,
  }));
}

/**
 * Crear un nuevo usuario y enviar correo con contraseña temporal
 */
export async function createUsuario(data: UsuarioCreate): Promise<Usuario> {
  // 1️⃣ Generar contraseña aleatoria de 12 caracteres
  const tempPassword = randomBytes(9).toString("base64").slice(0, 12);

  // 2️⃣ Hashear la contraseña temporal
  const hashed = await bcrypt.hash(tempPassword, 10);

  // 3️⃣ Crear el usuario en la base de datos
  const newUser = await prisma.usuarios.create({
    data: {
      id: randomUUID(),
      usuario: data.usuario,
      rol_id: data.rol_id,
      empleado_id: data.empleado_id,
      contrasena: hashed,
      activo: true,
      DebeCambiarPassword: true,
    },
  });

  // 4️⃣ Obtener datos del empleado asociado
  const empleado = await prisma.empleados.findUnique({
    where: { id: data.empleado_id },
    select: { correo: true, nombre: true, apellido: true },
  });

  if (empleado?.correo) {
    // 5️⃣ Construir payload del correo usando sólo la plantilla HTML
    const html = generateUserCreatedEmailHtml(
      `${empleado.nombre} ${empleado.apellido}`,
      data.usuario,
      tempPassword
    );

    const mailPayload: MailPayload = {
      to: empleado.correo,
      subject: "Cuenta creada: contraseña temporal",
      html, // Sólo HTML de la plantilla, sin texto adicional
    };

    try {
      const emailService = new EmailService();
      await emailService.sendMail(mailPayload);
    } catch (err) {
      console.error("Error enviando correo al empleado:", err);
      // Opcional: manejar reintento o registro de fallo
    }
  }

  // 6️⃣ Devolver el usuario creado (sin contraseña)
  return {
    id: newUser.id,
    usuario: newUser.usuario,
    rol: "",
    rol_id: newUser.rol_id,
    empleado: empleado
      ? `${empleado.nombre} ${empleado.apellido}`
      : "",
    empleado_id: newUser.empleado_id,
    activo: newUser.activo,
  };
}

/**
 * Actualizar un usuario existente
 */
export async function updateUsuario(data: UsuarioUpdate): Promise<Usuario> {
  const updated = await prisma.usuarios.update({
    where: { id: data.id },
    data: {
      usuario: data.usuario,
      rol_id: data.rol_id,
      empleado_id: data.empleado_id,
      activo: data.activo,
    },
    include: {
      Empleados: { select: { nombre: true, apellido: true } },
    },
  });
  return {
    id: updated.id,
    usuario: updated.usuario,
    rol: "",
    rol_id: updated.rol_id,
    empleado: updated.Empleados
      ? `${updated.Empleados.nombre} ${updated.Empleados.apellido}`
      : "",
    empleado_id: updated.empleado_id,
    activo: updated.activo,
  };
}

/**
 * Obtener usuario por ID
 */
export async function getUsuarioById(id: string): Promise<Usuario | null> {
  const r = await prisma.usuarios.findUnique({
    where: { id },
    include: {
      rol: { select: { nombre: true } },
      Empleados: { select: { nombre: true, apellido: true } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    usuario: r.usuario,
    rol: r.rol?.nombre ?? "",
    rol_id: r.rol_id,
    empleado: r.Empleados
      ? `${r.Empleados.nombre} ${r.Empleados.apellido}`
      : "",
    empleado_id: r.empleado_id,
    activo: r.activo,
  };
}
