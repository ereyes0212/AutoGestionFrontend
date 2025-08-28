export const dynamic = "force-dynamic";

import { EmailService, MailPayload } from "@/lib/sendEmail";
import { AnalyticsData, generateAnalyticsReportHtml } from "@/lib/templates/analyticReport";
import { google } from "googleapis";
import type { NextRequest } from "next/server";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const SA_B64 = process.env.GA4_SA_B64;

function loadServiceAccount() {
    if (!SA_B64) throw new Error("GA4_SA_B64 no definido");
    const sa = JSON.parse(Buffer.from(SA_B64, "base64").toString("utf8"));
    if (!sa.client_email || !sa.private_key) throw new Error("Service account inválida");
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
    return sa;
}

async function getAnalyticsClient() {
    const sa = loadServiceAccount();
    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: sa.client_email, private_key: sa.private_key },
        scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    return google.analyticsdata({ version: "v1beta", auth });
}

/* helper: YYYY-MM-DD */
function ymd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/* Normaliza la date que viene de GA4: puede ser "20250817" o "2025-08-17" */
function normalizeGa4Date(raw: string) {
    if (!raw) return raw;
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return raw;
}

// helper para esperar (5 segundos)
function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
    try {
        if (!PROPERTY_ID) throw new Error("GA4_PROPERTY_ID no definido");
        const propertyId = PROPERTY_ID as string;

        const emailsParam = req.nextUrl.searchParams.get("emails");
        if (!emailsParam) throw new Error("Debes enviar al menos un email como query param: ?emails=a@a.com,b@b.com");
        const emails = emailsParam.split(",").map(e => e.trim()).filter(Boolean);
        if (!emails.length) throw new Error("No se encontraron emails válidos");

        const analytics = await getAnalyticsClient();

        const formatRangeLabel = (start: string, end: string) => `${start} → ${end}`;

        // Calcula los rangos: últimos 15 días completos (hasta ayer) y los 15 días anteriores inmediatamente antes
        const compute15DayRanges = (now: Date) => {
            // end = ayer (completo)
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            // laterStart = end - 14 días (para cubrir 15 días inclusive)
            const laterStartDate = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 14);
            // earlierEnd = day before laterStart
            const earlierEndDate = new Date(laterStartDate.getFullYear(), laterStartDate.getMonth(), laterStartDate.getDate() - 1);
            // earlierStart = earlierEnd - 14 días
            const earlierStartDate = new Date(earlierEndDate.getFullYear(), earlierEndDate.getMonth(), earlierEndDate.getDate() - 14);

            return {
                earlier: { start: ymd(earlierStartDate), end: ymd(earlierEndDate) },
                later: { start: ymd(laterStartDate), end: ymd(end) }
            };
        };

        const now = new Date();
        const ranges = compute15DayRanges(now);
        const previousStart = ranges.earlier.start;
        const previousEnd = ranges.earlier.end;
        const currentStart = ranges.later.start;
        const currentEnd = ranges.later.end;

        // helper para obtener datos agregados de GA4 en un rango
        const fetchAggregatedRange = async (startDate: string, endDate: string) => {
            const resp = await analytics.properties.runReport({
                property: `properties/${propertyId}`,
                requestBody: {
                    dateRanges: [{ startDate, endDate }],
                    dimensions: [{ name: "country" }],
                    metrics: [
                        { name: "screenPageViews" },
                        { name: "activeUsers" },
                        { name: "newUsers" }
                    ],
                    limit: 10000
                } as any
            });

            const rows = resp.data.rows || [];
            const totals = {
                page: "ALL",
                totalViews: 0,
                totalUsers: 0,
                totalNewUsers: 0,
                usaViews: 0,
                usaUsers: 0,
                usaUserPercent: 0,
                date: `${startDate}-${endDate}`
            } as AnalyticsData;

            rows.forEach((row: any) => {
                const dims = row.dimensionValues || [];
                const mets = row.metricValues || [];

                const country = dims[0]?.value ?? "";
                const views = Number(mets[0]?.value ?? 0);
                const activeUsers = Number(mets[1]?.value ?? 0);
                const newUsers = Number(mets[2]?.value ?? 0);

                totals.totalViews += views;
                totals.totalUsers += activeUsers;
                totals.totalNewUsers += newUsers;

                if (country === "United States") {
                    totals.usaViews += views;
                    totals.usaUsers += activeUsers;
                }
            });

            totals.usaUserPercent = totals.totalUsers ? Number(((totals.usaUsers / totals.totalUsers) * 100).toFixed(2)) : 0;
            return totals;
        };

        const earlier = await fetchAggregatedRange(previousStart, previousEnd);
        const later = await fetchAggregatedRange(currentStart, currentEnd);

        const html = generateAnalyticsReportHtml(earlier, later);

        // Envío secuencial: 1 correo cada 5 segundos
        const emailService = new EmailService();
        const results: { email: string, ok: boolean, error?: string }[] = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const mailPayload: MailPayload = {
                to: email,
                subject: `Reporte comparativo Analytics ${formatRangeLabel(earlier.date!, later.date!)}`,
                html
            };

            try {
                await emailService.sendMail(mailPayload);
                results.push({ email, ok: true });
                console.log(`Email enviado a ${email}`);
            } catch (sendErr: any) {
                console.error(`Error enviando a ${email}:`, sendErr);
                results.push({ email, ok: false, error: sendErr?.message || String(sendErr) });
            }

            if (i < emails.length - 1) {
                await sleep(5000);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            sentTo: emails,
            ranges: { earlier: { start: previousStart, end: previousEnd }, later: { start: currentStart, end: currentEnd } },
            analytics: { earlier, later },
            sendResults: results
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("GA4/email error:", err);
        return new Response(JSON.stringify({ error: err.message || String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
