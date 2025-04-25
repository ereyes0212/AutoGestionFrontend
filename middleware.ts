// /middleware.ts
import { getSession } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    // 1) Intenta recuperar la sesión (pasále la request si tu getSession lo admite)
    const session = await getSession();

    // 2) Si NO hay sesión, redirigí a "/" (login) y agregá ?redirect=<ruta>
    if (!session) {
        const loginUrl = new URL("/", req.url);
        // guardamos la ruta a la que intentaba entrar
        loginUrl.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(loginUrl);
    }

    // 3) Si hay sesión, continuá
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/configuracion-permisos/:path*",
        "/empleados/:path*",
        "/permisos/:path*",
        "/profile/:path*",
        "/roles/:path*",
        "/puestos/:path*",
        "/usuarios/:path*",
        "/solicitudes/:path*",
    ],
};
