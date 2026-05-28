export const dynamic = "force-dynamic";

export async function GET() {
    return Response.json(
        {
            error: "Reporte deshabilitado",
            message: "El reporte semanal de vistas fue eliminado y ya no realiza llamados externos ni envía correos.",
        },
        { status: 410 },
    );
}
