export interface AnalyticsData {
    page: string
    totalViews: number
    totalUsers: number
    totalNewUsers: number
    usaViews: number
    usaUsers: number
    usaUserPercent: number
    date?: string
}
export function generateAnalyticsReportHtml(data: AnalyticsData): string {
    const reportDate = data.date || new Date().toLocaleDateString("es-ES");
    const newUserPercent = data.totalUsers
        ? ((data.totalNewUsers / data.totalUsers) * 100).toFixed(1)
        : "0.0";
    const usaViewsPercent = data.totalViews
        ? ((data.usaViews / data.totalViews) * 100).toFixed(1)
        : "0.0";

    // Formateador: miles con coma, decimales con punto (ej. 23,012)
    const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

    return `
  <!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Reporte Analytics</title>
    <style>
      @media only screen and (max-width:600px) {
        .container { width:100% !important; padding:10px !important; }
        .metrics-table td { display:block !important; width:100% !important; padding:8px 0 !important; }
        .metric-card { width:100% !important; display:block !important; margin:0 !important; }
        .usa-grid td { display:block !important; width:100% !important; text-align:center !important; padding:10px 0 !important; }
        .details-row { display:block !important; margin-bottom:12px !important; border-bottom:1px solid #f3f4f6 !important; padding-bottom:8px !important; }
        .details-label { display:block !important; font-size:13px !important; color:#64748b !important; margin-bottom:6px !important; }
        .details-values { display:block !important; text-align:left !important; }
        .detail-value { display:inline-block !important; font-weight:700 !important; color:#0f172a !important; margin-right:12px !important; }
        .detail-percent { display:inline-block !important; color:#64748b !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#334155;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:20px 12px;">
      <tr><td align="center">
        <table class="container" role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e6eef3;max-width:600px;">
          
          <!-- Header -->
          <tr>
            <td style="padding:18px 20px;text-align:center;border-bottom:1px solid #edf2f7;">
              <h1 style="margin:0;font-size:20px;color:#0f172a">Reporte de Analytics</h1>
              <div style="margin-top:6px;color:#64748b;font-size:13px;">Fecha: ${reportDate} • Página: <strong style="color:#0f172a">${data.page}</strong></div>
            </td>
          </tr>

          <!-- Metrics -->
          <tr>
            <td style="padding:14px 12px;">
              <table class="metrics-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="width:33%;padding:6px 8px 6px 0;vertical-align:top;">
                    <div class="metric-card" style="background:#fafcff;border:1px solid #eef2f7;padding:12px;border-radius:6px;text-align:center;margin:0;box-sizing:border-box;max-width:100%;">
                      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:6px;">Vistas</div>
                      <div style="font-size:20px;font-weight:700;color:#0f172a;">${fmt(data.totalViews)}</div>
                    </div>
                  </td>
                  <td style="width:33%;padding:6px 8px;vertical-align:top;">
                    <div class="metric-card" style="background:#fafcff;border:1px solid #eef2f7;padding:12px;border-radius:6px;text-align:center;margin:0;box-sizing:border-box;max-width:100%;">
                      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:6px;">Usuarios</div>
                      <div style="font-size:20px;font-weight:700;color:#0f172a;">${fmt(data.totalUsers)}</div>
                    </div>
                  </td>
                  <td style="width:33%;padding:6px 0 6px 8px;vertical-align:top;">
                    <div class="metric-card" style="background:#fafcff;border:1px solid #eef2f7;padding:12px;border-radius:6px;text-align:center;margin:0;box-sizing:border-box;max-width:100%;">
                      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:6px;">Usuarios nuevos</div>
                      <div style="font-size:20px;font-weight:700;color:#0f172a;">${fmt(data.totalNewUsers)}</div>
                      <div style="font-size:12px;color:#64748b;margin-top:6px;">${newUserPercent}% del total</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- USA section (two columns with lateral padding for space-between) -->
          <tr>
            <td style="padding:0 12px 16px 12px;">
              <table class="usa-grid" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
                <tr>
                  <td style="padding:14px;border:1px solid #f1f5f9;border-radius:6px;">
                    <strong style="color:#0f172a;font-size:14px;">Tráfico desde Estados Unidos</strong>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                      <tr>
                        <!-- Left column: add right padding -->
                        <td style="padding:8px 12px 8px 0;vertical-align:top;width:50%;">
                          <div style="font-size:11px;color:#64748b;">Usuarios (USA)</div>
                          <div style="font-size:18px;font-weight:700;color:#0f172a;">${fmt(data.usaUsers)}</div>
                          <div style="font-size:12px;color:#64748b;">${data.usaUserPercent}% del total</div>
                        </td>

                        <!-- Right column: add left padding -->
                        <td style="padding:8px 0 8px 12px;vertical-align:top;width:50%;text-align:right;">
                          <div style="font-size:11px;color:#64748b;">Vistas (USA)</div>
                          <div style="font-size:18px;font-weight:700;color:#0f172a;">${fmt(data.usaViews)}</div>
                          <div style="font-size:12px;color:#64748b;">${usaViewsPercent}% de vistas</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

<tr>
  <td style="padding:0 12px 18px 12px;">
    <table class="details-table" role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border-collapse:collapse;background:#ffffff;">
      <thead>
        <tr>
          <th align="left" style="padding:12px 12px 10px 0;font-size:13px;color:#475569;border-bottom:1px solid #eef2f7;">Métrica</th>
          <th align="right" style="padding:12px 12px 10px 0;font-size:13px;color:#475569;border-bottom:1px solid #eef2f7;width:120px;">Valor</th>
          <th align="right" style="padding:12px 0 10px 0;font-size:13px;color:#475569;border-bottom:1px solid #eef2f7;width:90px;">%</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #eef2f7;">
          <td style="padding:12px 12px 12px 0;color:#334155;">Vistas Totales</td>
          <td align="right" style="padding:12px 12px 12px 0;font-weight:700;color:#0f172a;">${fmt(data.totalViews)}</td>
          <td align="right" style="padding:12px 0 12px 0;color:#64748b;">100%</td>
        </tr>

        <tr style="background:#fbfcfd;border-bottom:1px solid #eef2f7;">
          <td style="padding:12px 12px 12px 0;color:#334155;">Usuarios Totales</td>
          <td align="right" style="padding:12px 12px 12px 0;font-weight:700;color:#0f172a;">${fmt(data.totalUsers)}</td>
          <td align="right" style="padding:12px 0 12px 0;color:#64748b;">100%</td>
        </tr>

        <tr style="border-bottom:1px solid #eef2f7;">
          <td style="padding:12px 12px 12px 0;color:#334155;">Usuarios Nuevos</td>
          <td align="right" style="padding:12px 12px 12px 0;font-weight:700;color:#0f172a;">${fmt(data.totalNewUsers)}</td>
          <td align="right" style="padding:12px 0 12px 0;color:#64748b;">${newUserPercent}%</td>
        </tr>

        <tr style="background:#fbfcfd;border-bottom:1px solid #eef2f7;">
          <td style="padding:12px 12px 12px 0;color:#334155;">Usuarios USA</td>
          <td align="right" style="padding:12px 12px 12px 0;font-weight:700;color:#0f172a;">${fmt(data.usaUsers)}</td>
          <td align="right" style="padding:12px 0 12px 0;color:#64748b;">${data.usaUserPercent}%</td>
        </tr>

        <tr>
          <td style="padding:12px 12px 12px 0;color:#334155;">Vistas USA</td>
          <td align="right" style="padding:12px 12px 12px 0;font-weight:700;color:#0f172a;">${fmt(data.usaViews)}</td>
          <td align="right" style="padding:12px 0 12px 0;color:#64748b;">${usaViewsPercent}%</td>
        </tr>
      </tbody>
    </table>
  </td>
</tr>

          <!-- Footer -->
          <tr>
            <td style="padding:14px 20px 20px 20px;border-top:1px solid #edf2f7;text-align:center;color:#64748b;font-size:12px;">
              Reporte generado automáticamente • tiempo.hn
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}



