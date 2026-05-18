/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { Prisma } from '@/lib/generated/prisma';
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { TSchemaResetPassword, schemaResetPassword } from "./app/(public)/reset-password/schema";
import { schemaSignIn, type TSchemaSignIn } from "./lib/shemas";

const key = new TextEncoder().encode(process.env.AUTH_SECRET!);

// 1) Tipo de sesión compartido
import { decryptSessionToken, type UsuarioSesion } from "@/lib/session";

export type { UsuarioSesion };

// 2) Función para generar el JWT
export async function encrypt(payload: UsuarioSesion) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("6h") // <-- expiración de 6 horas
        // .setExpirationTime("10s") // <-- expiración de 10 segundos (para pruebas)
        .sign(key);
}

// 3) Función para verificar y extraer el payload
export const decrypt = decryptSessionToken;

export interface LoginResult {
    success?: string;
    error?: string;
    redirect?: string;
}

export interface UserChangePassword {
    username: string;
    newPassword: string;
}

// ------------------------------------------------------------------
// LOGIN usando AD (via BD con Prisma)
// ------------------------------------------------------------------
export const login = async (
    credentials: TSchemaSignIn,
    redirect: string
): Promise<LoginResult> => {
    const parsed = schemaSignIn.safeParse(credentials);
    if (!parsed.success) {
        return { error: "Usuario o contraseña inválidos" };
    }

    const { usuario, contrasena } = parsed.data;
    const tokenAD = await getADAuthentication(usuario, contrasena);
    if (!tokenAD) {
        return { error: "Usuario o contraseña inválidos" };
    }

    // Guardamos cookie por 6 horas
    const expires = new Date(Date.now() + 6 * 60 * 60 * 1000);
    // const expires = new Date(Date.now() + 10 * 1000);

    cookies().set("session", tokenAD, { expires, httpOnly: true, path: "/" });

    return { success: "Login OK", redirect };
};

// ------------------------------------------------------------------
// RESET PASSWORD
// ------------------------------------------------------------------
export const resetPassword = async (
    credentials: TSchemaResetPassword,
    username: string
): Promise<LoginResult> => {
    const parsed = schemaResetPassword.safeParse(credentials);
    if (!parsed.success) {
        return { error: "Error al cambiar la contraseña" };
    }

    const { confirmar } = parsed.data;
    const tokenAD = await changePassword(username, confirmar);
    if (!tokenAD) {
        return { error: "Error al cambiar la contraseña" };
    }

    // Guardamos cookie por 6 horas
    const expires = new Date(Date.now() + 6 * 60 * 60 * 1000);
    // const expires = new Date(Date.now() + 10 * 1000);
    cookies().set("session", tokenAD, { expires, httpOnly: true, path: "/" });

    return { success: "Contraseña cambiada con éxito" };
};

// ------------------------------------------------------------------
// SESSION HELPERS
// ------------------------------------------------------------------
export const getSession = async (): Promise<UsuarioSesion | null> => {
    const token = cookies().get("session")?.value;
    if (!token) return null;
    return await decrypt(token);
};

export const getSessionPermisos = async (): Promise<string[] | null> => {
    const sess = await getSession();
    return sess ? sess.Permiso : null;
};

export const signOut = async () => {
    cookies().delete("session");
};

// ------------------------------------------------------------------
// AUTH VIA DB (Prisma)
// ------------------------------------------------------------------
const usuarioWithRolArgs = Prisma.validator<Prisma.UsuariosDefaultArgs>()({
    include: {
        rol: {
            include: {
                permisos: { include: { permiso: true } },
            },
        },
        Empleados: {
            include: { Puesto: true },
        },
    },
});

type UsuarioConRol = Prisma.UsuariosGetPayload<typeof usuarioWithRolArgs>;

export async function getADAuthentication(
    username: string,
    password: string
): Promise<string | null> {
    try {
        const { prisma } = await import("@/lib/prisma");
        const user: UsuarioConRol | null = await prisma.usuarios.findFirst({
            where: { usuario: username },
            include: {
                rol: { include: { permisos: { include: { permiso: true } } } },
                Empleados: { include: { Puesto: true } },
            },
        });

        const bcrypt = (await import("bcryptjs")).default;
        if (!user || !(await bcrypt.compare(password, user.contrasena))) return null;

        const permisos = user.rol.permisos.map(rp => rp.permiso.nombre);

        const payload: UsuarioSesion = {
            IdUser: user.id,
            User: user.usuario,
            Rol: user.rol.nombre,
            IdRol: user.rol_id,
            IdEmpleado: user.empleado_id,
            Permiso: permisos,
            DebeCambiar: user.DebeCambiarPassword!,
            Puesto: user.Empleados?.Puesto?.Nombre ?? "",
            PuestoId: user.Empleados?.puesto_id ?? "",
            iss: "your-issuer",
            aud: "your-audience",
        };

        return encrypt(payload);
    } catch (err: unknown) {
        console.error("Error en getADAuthentication:", err);
        return null;
    }
}

// ------------------------------------------------------------------
// Cambio de contraseña con Prisma
// ------------------------------------------------------------------
export async function changePassword(
    username: string,
    newPassword: string
): Promise<string | null> {
    try {
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.usuarios.findFirst({
            where: { usuario: username },
            include: {
                rol: { include: { permisos: { include: { permiso: true } } } },
                Empleados: { include: { Puesto: true } },
            },
        });

        if (!existing) return null;

        const bcrypt = (await import("bcryptjs")).default;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updated = await prisma.usuarios.update({
            where: { id: existing.id },
            data: { contrasena: hashedPassword, DebeCambiarPassword: false },
            include: {
                rol: { include: { permisos: { include: { permiso: true } } } },
                Empleados: { include: { Puesto: true } },
            },
        });

        const permisos = updated.rol.permisos.map(rp => rp.permiso.nombre);

        const payload: UsuarioSesion = {
            IdUser: updated.id,
            User: updated.usuario,
            Rol: updated.rol.nombre,
            IdRol: updated.rol_id,
            IdEmpleado: updated.empleado_id,
            Permiso: permisos,
            DebeCambiar: updated.DebeCambiarPassword!,
            Puesto: updated.Empleados?.Puesto?.Nombre ?? "",
            PuestoId: updated.Empleados?.puesto_id ?? "",
            iss: "your-issuer",
            aud: "your-audience",
        };

        return encrypt(payload);
    } catch (err: unknown) {
        console.error("Error en changePassword:", err);
        return null;
    }
}

export const getSessionUsuario = async (): Promise<UsuarioSesion | null> => {
    const session = cookies().get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
};
