
import { getNotasFinalizadasHoy } from "@/app/(protected)/redaccion/actions";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
    try {
        const finalizadas = await getNotasFinalizadasHoy();
        // Convertimos los datos a un formato plano
        const rows = finalizadas.map((n) => ({

            Titulo: n.titulo ?? "",
            Descripcion: n.descripcion ?? "",
            Estado: n.estado,
            "Empleado Creador": n.empleadoCreador ?? "",
            "Empleado Asignado": n.empleadoAsignado ?? "",
            "Empleado Aprobador": n.empleadoAprobador ?? "",
        }));

        // Crear worksheet y workbook
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Notas Finalizadas - Hoy");

        // Escribir en buffer
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="notas-finalizadas-hoy.xlsx"`,
            },
        });
    } catch (err) {
        console.error("Error exportando Excel:", err);
        return NextResponse.json({ error: "Error generando Excel" }, { status: 500 });
    }
}
