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

        const emailsParam = req.nextUrl.searchParams.get("emails");
        if (!emailsParam) throw new Error("Debes enviar al menos un email como query param: ?emails=a@a.com,b@b.com");
        const emails = emailsParam.split(",").map(e => e.trim()).filter(Boolean);
        if (!emails.length) throw new Error("No se encontraron emails válidos");

        const analytics = await getAnalyticsClient();

        // Fechas: antier = hoy -2, antesAntier = hoy -3
        const antier = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const antesAntier = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const dateA = ymd(antesAntier); // día antes de antier (ej: 2025-08-17)
        const dateB = ymd(antier);      // antier (ej: 2025-08-18)

        const resp = await analytics.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate: dateA, endDate: dateB }],
                dimensions: [{ name: "date" }, { name: "country" }],
                metrics: [
                    { name: "screenPageViews" },
                    { name: "activeUsers" },
                    { name: "newUsers" }
                ],
                limit: 10000
            } as any
        });

        const rows = resp.data.rows || [];

        if (rows.length) {
            console.log("GA4 sample rows (first 5):", rows.slice(0, 5).map(r => ({
                dims: r.dimensionValues?.map((d: any) => d.value),
                mets: r.metricValues?.map((m: any) => m.value)
            })));
        } else {
            console.log("GA4: no rows returned");
        }

        const init = (d: string): AnalyticsData => ({
            page: "ALL",
            totalViews: 0,
            totalUsers: 0,
            totalNewUsers: 0,
            usaViews: 0,
            usaUsers: 0,
            usaUserPercent: 0,
            date: d
        });

        const map: Record<string, AnalyticsData> = { [dateA]: init(dateA), [dateB]: init(dateB) };

        rows.forEach(row => {
            const dims = row.dimensionValues || [];
            const mets = row.metricValues || [];

            const rawDate = dims[0]?.value ?? "";
            const date = normalizeGa4Date(String(rawDate));

            const country = dims[1]?.value ?? "";
            const views = Number(mets[0]?.value ?? 0);
            const activeUsers = Number(mets[1]?.value ?? 0);
            const newUsers = Number(mets[2]?.value ?? 0);

            if (!map[date]) map[date] = init(date);

            map[date].totalViews += views;
            map[date].totalUsers += activeUsers;
            map[date].totalNewUsers += newUsers;

            if (country === "United States") {
                map[date].usaViews += views;
                map[date].usaUsers += activeUsers;
            }
        });

        [dateA, dateB].forEach(d => {
            const obj = map[d];
            obj.usaUserPercent = obj.totalUsers ? Number(((obj.usaUsers / obj.totalUsers) * 100).toFixed(2)) : 0;
        });

        const dataA = map[dateA];
        const dataB = map[dateB];

        const html = generateAnalyticsReportHtml(dataA, dataB);

        // Envío secuencial: 1 correo cada 5 segundos
        const emailService = new EmailService();
        const results: { email: string, ok: boolean, error?: string }[] = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const mailPayload: MailPayload = {
                to: email,
                subject: `Reporte comparativo Analytics ${dataA.date} → ${dataB.date}`,
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

            // esperar 5s antes del siguiente (salta el sleep después del último)
            if (i < emails.length - 1) {
                await sleep(5000);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            sentTo: emails,
            dates: { earlier: dateA, later: dateB },
            analytics: { [dateA]: dataA, [dateB]: dataB },
            rowsCount: rows.length,
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
