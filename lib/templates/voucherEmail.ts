import { VoucherDto } from "@/app/(protected)/contabilidad/generar-planilla/types";


export function generateVoucherEmailHtml(v: VoucherDto): string {
    const fecha = new Date(v.fechaPago).toLocaleDateString("es-HN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const detallesHtml = v.detalles
        .map(
            (d) => `
      <tr>
        <td style="padding: 6px 12px; border: 1px solid #ddd;">${d.tipoDeduccionNombre}</td>
        <td style="padding: 6px 12px; border: 1px solid #ddd;">L. ${Number(d.monto).toFixed(2)}</td>
      </tr>
    `
        )
        .join("");

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px;">
      <h2 style="text-align: center; color: #222;">Recibo de Pago</h2>

      <p><strong>Empleado ID:</strong> ${v.empleadoId}</p>
      <p><strong>Fecha de Pago:</strong> ${fecha}</p>
      <p><strong>Días Trabajados:</strong> ${v.diasTrabajados}</p>
      <p><strong>Salario Diario:</strong> L. ${v.salarioDiario.toFixed(2)}</p>
      <p><strong>Salario Mensual:</strong> L. ${v.salarioMensual.toFixed(2)}</p>
      <p><strong style="color: green;">Neto a Pagar:</strong> L. ${v.netoPagar.toFixed(2)}</p>

      <h3 style="margin-top: 20px;">Detalle de Deducciones</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 6px 12px; border: 1px solid #ddd;">Tipo</th>
            <th style="text-align: left; padding: 6px 12px; border: 1px solid #ddd;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${detallesHtml}
        </tbody>
      </table>

      <p><strong>Observaciones:</strong> ${v.observaciones || "Ninguna"}</p>
      <p style="color: #888; font-size: 12px;">Este es un correo automático, por favor no responder.</p>
    </div>
  `;
}
