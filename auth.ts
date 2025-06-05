/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { TSchemaResetPassword, schemaResetPassword } from "./app/(public)/reset-password/schema";
import { schemaSignIn, type TSchemaSignIn } from "./lib/shemas";

const key = new TextEncoder().encode(process.env.AUTH_SECRET!);

// 1) Extendemos JWTPayload para nuestro payload
export interface UsuarioSesion extends JWTPayload {
    IdUser: string;
    User: string;
    Rol: string;
    IdRol: string;
    IdEmpleado: string;
    Permiso: string[];
    DebeCambiar: boolean;
    Puesto: string;
    PuestoId: string;
    // exp, iss, aud ya vienen de JWTPayload
}

// 2) Función para generar el JWT
export async function encrypt(payload: UsuarioSesion) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1 h from now")
        .sign(key);
}

// 3) Función para verificar y extraer el payload
export const decrypt = async (token: string): Promise<UsuarioSesion> => {
    const { payload } = await jwtVerify<JWTPayload>(token, key, {
        algorithms: ["HS256"],
    });

    const session: UsuarioSesion = {
        IdUser: payload.IdUser as string,
        User: payload.User as string,
        Rol: payload.Rol as string,
        IdRol: payload.IdRol as string,
        IdEmpleado: payload.IdEmpleado as string,
        Permiso: (payload.Permiso as string[]) || [],
        DebeCambiar: payload.DebeCambiar === true || payload.DebeCambiar === "True",
        Puesto: payload.Puesto as string,
        PuestoId: payload.PuestoId as string,
        exp: payload.exp as number,
        iss: payload.iss as string,
        aud: payload.aud as string,
    };

    return session;
};

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

    const sessionToken = tokenAD;
    const sessionData = await decrypt(sessionToken);
    const expires = new Date(sessionData.exp! * 1000);

    cookies().set("session", sessionToken, { expires, httpOnly: true });

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

    const sessionData = await decrypt(tokenAD);
    const expires = new Date(sessionData.exp! * 1000);

    cookies().set("session", tokenAD, { expires, httpOnly: true });

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

// 4) Definimos nuestro include para traer rol + permisos
const usuarioWithRolArgs = Prisma.validator<Prisma.UsuariosDefaultArgs>()({
    include: {
        rol: {
            include: {
                permisos: {
                    include: { permiso: true },
                },
            },
        },
        Empleados: {
            include: {
                Puesto: true, // Incluimos el puesto del empleado
            },
        },

    },
});

// 5) Tipo resultante que incluye las relaciones
type UsuarioConRol = Prisma.UsuariosGetPayload<typeof usuarioWithRolArgs>;

/**
 * Autenticación contra la BD, genera JWT con cargo y permisos.
 */

export async function getADAuthentication(
    username: string,
    password: string
): Promise<string | null> {
    try {
        // 1️⃣ Intentamos buscar al usuario con su rol y empleado (incluye puesto)
        const user: UsuarioConRol | null = await prisma.usuarios.findFirst({
            where: { usuario: username },
            include: {
                rol: {
                    include: {
                        permisos: {
                            include: { permiso: true },
                        },
                    },
                },
                Empleados: {
                    include: {
                        Puesto: true,
                    },
                },
            },
        });

        // 2️⃣ Si no existe o la contraseña no coincide, devolvemos null
        if (!user || !(await bcrypt.compare(password, user.contrasena))) {
            return null;
        }

        // 3️⃣ Extraemos los nombres de permisos
        const permisos = user.rol.permisos.map((rp) => rp.permiso.nombre);

        // 4️⃣ Construimos el payload para el JWT
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
            exp: Math.floor(Date.now() / 1000) + 3600,
            iss: "your-issuer",
            aud: "your-audience",
        };

        // 5️⃣ Encriptamos y devolvemos el token
        return encrypt(payload);
    } catch (err: unknown) {
        // Si hay un error de conexión a la BD (o cualquier otro), lo registramos
        console.error("Error en getADAuthentication:", err);
        // Devolvemos null para indicar que no fue posible autenticar
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
        // 1️⃣ Buscar al usuario por su username
        const existing = await prisma.usuarios.findFirst({
            where: { usuario: username },
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

        if (!existing) {
            return null;
        }

        // 2️⃣ Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3️⃣ Actualizar la contraseña y el flag DebeCambiarPassword
        const updated = await prisma.usuarios.update({
            where: { id: existing.id },
            data: {
                contrasena: hashedPassword,
                DebeCambiarPassword: false,
            },
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

        // 4️⃣ Volver a extraer permisos a partir del rol actualizado (aunque no cambien)
        const permisos = updated.rol.permisos.map((rp) => rp.permiso.nombre);

        // 5️⃣ Construir el payload con los mismos datos que getADAuthentication
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
            exp: Math.floor(Date.now() / 1000) + 3600,
            iss: "your-issuer",
            aud: "your-audience",
        };

        // 6️⃣ Encriptar y devolver el nuevo token
        return encrypt(payload);
    } catch (err: unknown) {
        console.error("Error en changePassword:", err);
        return null;
    }
}


export const getSessionUsuario = async (): Promise<UsuarioSesion | null> => {
    const session = cookies().get("session")?.value;
    if (!session) {
        return null;
    }
    return await decrypt(session);
};
