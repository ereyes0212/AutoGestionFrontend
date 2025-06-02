"use server";

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Usuario, UsuarioCreate, UsuarioUpdate } from './type';

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
  return records.map(r => ({
    id: r.id,
    usuario: r.usuario,
    rol: r.rol?.nombre ?? '',
    rol_id: r.rol_id,
    empleado: r.Empleados ? `${r.Empleados.nombre} ${r.Empleados.apellido}` : '',
    empleado_id: r.empleado_id,
    activo: r.activo,
  }));
}

/**
 * Crear un nuevo usuario
 */
export async function createUsuario(data: UsuarioCreate): Promise<Usuario> {
  const id = randomUUID();
  const newUser = await prisma.usuarios.create({
    data: {
      id,
      usuario: data.usuario,
      rol_id: data.rol_id,
      empleado_id: data.empleado_id,
      contrasena: await bcrypt.hash('pass.1234', 10),
      activo: true,
      DebeCambiarPassword: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return {
    id: newUser.id,
    usuario: newUser.usuario,
    rol: '',
    rol_id: newUser.rol_id,
    empleado: '',
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
      updated_at: new Date(),
    },
  });
  return {
    id: updated.id,
    usuario: updated.usuario,
    rol: '',
    rol_id: updated.rol_id,
    empleado: '',
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
    rol: r.rol?.nombre ?? '',
    rol_id: r.rol_id,
    empleado: r.Empleados ? `${r.Empleados.nombre} ${r.Empleados.apellido}` : '',
    empleado_id: r.empleado_id,
    activo: r.activo,
  };
}
