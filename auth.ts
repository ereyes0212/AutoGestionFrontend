"use server";

import { type TSchemaSignIn, schemaSignIn } from "./lib/shemas";
import { type JWTPayload, SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
const key = new TextEncoder().encode(process.env.AUTH_SECRET);
interface UsuarioSesion  {
    IdUser:     string;
    User:       string;
    Rol:        string;
    IdRol:      string;
    IdEmpleado: string;
    Permiso:    string[];
    Puesto:     string;
    PuestoId:  string;
    exp:        number;
    iss:        string;
    aud:        string;
}


export async function encrypt(payload: JWTPayload | undefined) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1 h from now")
        .sign(key);
}
export const decrypt = async (input: string): Promise<UsuarioSesion> => {
    const { payload } = await jwtVerify<JWTPayload>(input, key, { algorithms: ["HS256"] });

    const usuarioSesion: UsuarioSesion = {
        IdUser: payload.IdUser as string,
        User: payload.User as string,
        IdEmpleado: payload.empleadoId as string,
        IdRol: payload.IdRol as string,
        Permiso: payload.Permiso as string[] || [],
        Puesto: payload.Puesto as string,
        PuestoId: payload.PuestoId as string,
        exp: payload.exp as number,
        aud: payload.aud as string,
        iss: payload.iss as string,
        Rol: payload.Rol as string,
    };

    return usuarioSesion;
};
export interface LoginResult {
    success?: string
    error?: string
    redirect?: string
  }
  
  // Ahora recibimos redirect aparte
  export const login = async (
    credentials: TSchemaSignIn,
    redirect: string
  ): Promise<LoginResult> => {
    const validated = schemaSignIn.safeParse(credentials)
    if (!validated.success) {
      return { error: "Usuario o contraseña inválidos" }
    }
  
    try {
      const { usuario, contrasena } = validated.data
      const tokenAD = await getADAuthentication(usuario, contrasena)
      if (!tokenAD) {
        return { error: "Usuario o contraseña inválidos" }
      }
  
      // Guardamos la cookie de sesión
      const session    = tokenAD
      const decrypted  = await decrypt(session)
      const expires    = new Date((decrypted.exp as number) * 1000)
      cookies().set("session", session, { expires, httpOnly: true })
  
      return {
        success:  "Login OK",
        redirect  // devolvemos el redirect que nos pasaron
      }
    } catch {
      return { error: "Error al iniciar sesión" }
    }
  }

export const getSession = async () => {
    const session = cookies().get("session")?.value;
    if (!session) {
        return null;
    }
    return await decrypt(session);
};

export const getSessionUsuario = async (): Promise<UsuarioSesion | null> => {
    const session = cookies().get("session")?.value;
    if (!session) {
        return null;
    }
    const usuario = await decrypt(session);
    return usuario; 
};


export const getSessionPermisos = async (): Promise<string[] | null> => {
    const session = cookies().get("session")?.value;
    if (!session) {
        return null;
    }
    const usuario = await decrypt(session);
    
    return usuario.Permiso; // Esto ahora debería ser correcto
};


const getADAuthentication = async (username: string, password: string) => {

    const url = `${process.env.URLLOGIN}`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        return null;
    }
    const { token } = await response.json();

    return token;
};
export const getToken = async () => {
    const token = cookies().get("session")?.value;
    if(!token){
        return ''
    }
    return token as string;
};

export const signOut = async () => {
    cookies().delete("session");
};


