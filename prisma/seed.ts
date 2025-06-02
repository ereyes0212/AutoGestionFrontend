import { PrismaClient } from "@/lib/generated/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // 1. Opcional: resetear datos
  const resetData = process.env.RESET_SEED === 'true';
  if (resetData) {
    await prisma.rolPermiso.deleteMany();
    await prisma.usuarios.deleteMany();
    await prisma.empleados.deleteMany();
    await prisma.puesto.deleteMany();
    await prisma.rol.deleteMany();
    await prisma.permiso.deleteMany();
    console.log("Datos anteriores eliminados");
  }

  // 2. Sembrar Permisos
  const permisosData = [
    // Empleados
    { nombre: "ver_empleados", descripcion: "Permiso para ver los empleados" },
    { nombre: "crear_empleados", descripcion: "Permiso para crear los empleados" },
    { nombre: "editar_empleado", descripcion: "Permiso para editar los empleados" },
    // Solicitudes
    { nombre: "ver_solicitudes", descripcion: "Permiso para ver las solicitudes" },
    { nombre: "ver_detalles_solicitudes", descripcion: "Permiso para ver las detalles de solicitudes" },
    { nombre: "crear_solicitudes", descripcion: "Permiso para crear las solicitudes" },
    // { nombre: "editar_empleado", descripcion: "Permiso para editar los empleados" },
    // Permisos
    { nombre: "ver_permisos", descripcion: "Permiso para ver los permisos" },
    { nombre: "ver_roles", descripcion: "Permiso para ver roles" },
    { nombre: "crear_roles", descripcion: "Permiso para crear roles" },
    { nombre: "editar_roles", descripcion: "Permiso para editar roles" },
    // Usuarios
    { nombre: "ver_usuarios", descripcion: "Permiso para ver usuarios" },
    { nombre: "crear_usuario", descripcion: "Permiso para crear usuarios" },
    { nombre: "editar_usuario", descripcion: "Permiso para editar usuarios" },
    // Tipo Deducciones
    { nombre: "ver_tipodeducciones", descripcion: "Permiso para ver tipo deducciones" },
    { nombre: "crear_tipodeducciones", descripcion: "Permiso para crear tipo deducciones" },
    { nombre: "editar_tipodeducciones", descripcion: "Permiso para editar tipo deducciones" },
    // Tipo Seccion
    { nombre: "ver_tipo_seccion", descripcion: "Permiso para ver tipo sección" },
    { nombre: "crear_tipo_seccion", descripcion: "Permiso para crear tipo sección" },
    { nombre: "editar_tipo_seccion", descripcion: "Permiso para editar tipo sección" },
    // Puestos
    { nombre: "ver_puestos", descripcion: "Permiso para ver puestos" },
    { nombre: "crear_puestos", descripcion: "Permiso para crear puestos" },
    { nombre: "editar_puestos", descripcion: "Permiso para editar puestos" },
    // Reporte diseño
    { nombre: "ver_reporte_diseno", descripcion: "Permiso para ver reporte de diseño" },
    { nombre: "crear_reporte_diseno", descripcion: "Permiso para crear reporte de diseño" },
    { nombre: "editar_reporte_diseno", descripcion: "Permiso para editar reporte de diseño" },
    // Contabilidad
    { nombre: "ver_contabilidad", descripcion: "Permiso para ver modulo de contabilidad" },
    { nombre: "ver_generar_planilla", descripcion: "Permiso para ver la pantalla de generar planilla" },
    // Voucher
    { nombre: "ver_voucher_pago", descripcion: "Permiso para ver los voucher de pago" },
    { nombre: "ver_detalle_voucher_pago", descripcion: "Permiso para ver la pantalla de detalle de voucher" },
    // Perfil
    { nombre: "ver_profile", descripcion: "Permiso para ver el perfil" },
  ];

  const permisoIds: string[] = [];
  for (const p of permisosData) {
    let permiso = await prisma.permiso.findUnique({ where: { nombre: p.nombre } });
    if (!permiso) {
      permiso = await prisma.permiso.create({
        data: {
          id: randomUUID(),
          nombre: p.nombre,
          descripcion: p.descripcion,
          activo: true,
        },
      });
      console.log(`Permiso creado: ${p.nombre}`);
    } else {
      console.log(`Permiso existente: ${p.nombre}`);
    }
    permisoIds.push(permiso.id);
  }

  // 3. Crear rol Administrador
  let adminRole = await prisma.rol.findUnique({ where: { nombre: "Administrador" } });
  if (!adminRole) {
    adminRole = await prisma.rol.create({
      data: {
        id: randomUUID(),
        nombre: "Administrador",
        descripcion: "Rol con acceso total al sistema",
        activo: true,
      },
    });
    console.log("Rol Administrador creado");
  } else {
    console.log("Rol Administrador existente");
  }

  // 4. Asignar permisos al rol
  const existingRolePermisos = await prisma.rolPermiso.findMany({ where: { rolId: adminRole.id } });
  const existingIds = new Set(existingRolePermisos.map(rp => rp.permisoId));
  for (const pid of permisoIds) {
    if (!existingIds.has(pid)) {
      await prisma.rolPermiso.create({ data: { rolId: adminRole.id, permisoId: pid } });
    }
  }
  console.log("Permisos asignados a Administrador");

  // 5. Crear Puesto
  let puesto = await prisma.puesto.findFirst({ where: { Nombre: "Gerente Recursos Humanos" } });
  if (!puesto) {
    puesto = await prisma.puesto.create({
      data: {
        Id: randomUUID(),
        Nombre: "Gerente Recursos Humanos",
        Descripcion: "Gerente de recursos humanos de diario tiempo",
        Activo: true,
        Created_at: new Date(),
        Updated_at: new Date(),
      },
    });
    console.log("Puesto creado");
  }

  // 6. Crear Empleado
  let empleado = await prisma.empleados.findFirst({ where: { correo: "marta.rapalo@tiempo.hn" } });
  if (!empleado) {
    empleado = await prisma.empleados.create({
      data: {
        id: randomUUID(),
        nombre: "Marta",
        apellido: "Rapalo",
        puesto_id: puesto.Id,
        correo: "marta.rapalo@tiempo.hn",
        FechaNacimiento: new Date(1999, 11, 2),
        Vacaciones: 10,
        genero: "Femenino",
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    console.log("Empleado Marta Rapalo creado");
  }

  // 7. Crear Usuario
  let usuario = await prisma.usuarios.findFirst({ where: { usuario: "marta.rapalo" } });
  if (!usuario) {
    usuario = await prisma.usuarios.create({
      data: {
        id: randomUUID(),

        usuario: "marta.rapalo",
        contrasena: await bcrypt.hash("marta.rapalo", 10),
        empleado_id: empleado.id,
        rol_id: adminRole.id,
        activo: true,
        DebeCambiarPassword: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    console.log("Usuario Marta Rapalo creado");
  }

  console.log("Seed completado exitosamente");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
