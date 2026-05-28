export const dynamic = "force-dynamic";

export async function GET() {
    return Response.json(
        {
            error: "Reporte deshabilitado",
            message: "El reporte comparativo de Analytics fue eliminado y ya no realiza llamados a GA4 ni envía correos.",
        },
        { status: 410 },
    );
}
