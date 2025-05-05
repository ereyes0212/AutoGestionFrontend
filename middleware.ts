// middleware.ts
import { getSession } from "@/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    // Recupera la sesión
    const session = await getSession();

    // Si no hay sesión, manda al login
    if (!session) {
        const loginUrl = new URL("/", req.url);
        loginUrl.searchParams.set("redirect", pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    if (session.DebeCambiar && pathname !== "/reset-password") {
        return NextResponse.redirect(new URL("/reset-password", req.url));
    }

    // En cualquier otro caso, deja pasar
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
        "/voucher-pago/:path*",
        // incluye reset-password para que no lo intercepte el middleware
        "/reset-password",
    ],
};
