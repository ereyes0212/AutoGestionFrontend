import { decryptSessionToken } from "@/lib/session";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const token = req.cookies.get("session")?.value;
    const session = token ? await decryptSessionToken(token) : null;

    if (!session) {
        const loginUrl = new URL("/", req.url);
        loginUrl.searchParams.set("redirect", pathname + search);
        return NextResponse.redirect(loginUrl);
    }

    if (session.DebeCambiar && pathname !== "/reset-password") {
        return NextResponse.redirect(new URL("/reset-password", req.url));
    }

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
        "/reset-password",
    ],
};
