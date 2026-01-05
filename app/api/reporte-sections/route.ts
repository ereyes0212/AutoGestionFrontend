export const dynamic = "force-dynamic";
// app/api/analytics-sections/route.ts
import { EmailService, MailPayload } from "@/lib/sendEmail";
import { generateAnalyticsReportHtmlSections, SectionReport } from "@/lib/templates/analyticReporteSections";
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

/* Calcula rangos: últimos 15 días completos (hasta ayer) y los 15 días previos */
const compute15DayRanges = (now: Date) => {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const laterStartDate = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 14);
    const earlierEndDate = new Date(laterStartDate.getFullYear(), laterStartDate.getMonth(), laterStartDate.getDate() - 1);
    const earlierStartDate = new Date(earlierEndDate.getFullYear(), earlierEndDate.getMonth(), earlierEndDate.getDate() - 14);

    return {
        earlier: { start: ymd(earlierStartDate), end: ymd(earlierEndDate) },
        later: { start: ymd(laterStartDate), end: ymd(end) }
    };
};

function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

// Secciones exactas que pediste (se filtra con pagePath CONTAINS `/${slug}/`)
const SECTIONS = [
    "sucesos",
    "honduras",
    "san-pedro-sula",
    "mundo",
    "escena",
    "noticias-de-usa",
    "cronometro",
    "riflazos",
    "salud",
    "de-mujeres",
    "color-politico",
    "maxima-velocidad",
    "juegos",
    "horoscopo",
    "voz-ciudadana",
    "opiniones",
    "la-entrevista",
    "catracho-ejemplar",
    "curiosas",
    "desde-el-muro",
    "videos"

];

// Helper para sumar vistas dentro de un rango filtrando por pagePath CONTAINS '/{section}/'
async function fetchViewsForSection(analytics: any, propertyId: string, startDate: string, endDate: string, sectionSlug: string) {
    const resp = await analytics.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "screenPageViews" }],
            dimensionFilter: {
                filter: {
                    fieldName: "pagePath",
                    stringFilter: {
                        matchType: "CONTAINS",
                        value: `/${sectionSlug}/`
                    }
                }
            },
            limit: 100000
        } as any
    });

    const rows = resp.data.rows || [];
    let totalViews = 0;
    rows.forEach((row: any) => {
        const mets = row.metricValues || [];
        const views = Number(mets[0]?.value ?? 0);
        totalViews += views;
    });

    return totalViews;
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

        const now = new Date();
        const ranges = compute15DayRanges(now);
        const previousStart = ranges.earlier.start;
        const previousEnd = ranges.earlier.end;
        const currentStart = ranges.later.start;
        const currentEnd = ranges.later.end;

        const sectionsData: SectionReport[] = []

        for (const section of SECTIONS) {
            const viewsEarlier = await fetchViewsForSection(
                analytics,
                propertyId,
                previousStart,
                previousEnd,
                section
            )

            await sleep(300) // pequeño delay para GA4

            const viewsLater = await fetchViewsForSection(
                analytics,
                propertyId,
                currentStart,
                currentEnd,
                section
            )

            const diff = viewsLater - viewsEarlier
            const diffPct =
                viewsEarlier === 0
                    ? viewsLater > 0 ? Infinity : 0
                    : ((viewsLater - viewsEarlier) / viewsEarlier) * 100

            sectionsData.push({
                section,
                earlierViews: viewsEarlier,
                laterViews: viewsLater,
                diff,
                diffPct
            })

            await sleep(500) // clave para no romper cuota
        }


        // Genera HTML (usa la plantilla standalone que te doy abajo)
        const html = generateAnalyticsReportHtmlSections({
            sections: sectionsData,
            earlierRange: `${previousStart} → ${previousEnd}`,
            laterRange: `${currentStart} → ${currentEnd}`
        });

        // Envío secuencial respetando tu flujo: 1 correo cada 5s, usando EmailService (misma clase que ya tenés)
        const emailService = new EmailService();
        const results: { email: string, ok: boolean, error?: string }[] = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const mailPayload: MailPayload = {
                to: email,
                subject: `Reporte comparativo de vistas por secciones ${previousStart} → ${currentEnd}`,
                html,
                text: `Reporte comparativo de vistas por secciones ${previousStart} → ${currentEnd}`
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
            sections: sectionsData,
            sendResults: results
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("GA4/sections/email error:", err);
        return new Response(JSON.stringify({ error: err.message || String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
