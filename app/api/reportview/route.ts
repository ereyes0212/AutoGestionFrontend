export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { EmailService, MailPayload } from "@/lib/sendEmail";
import { generatePostsAnalyticsHtml } from "@/lib/templates/analyticViewsReport";
import { google } from "googleapis";
import type { NextRequest } from "next/server";

/** helpers para leer/validar envs en runtime */
function getSiteBase(): string {
    const wp = process.env.WP_SITE_URL;
    if (!wp) throw new Error("Missing env WP_SITE_URL");
    return wp.replace(/\/$/, "");
}

function getPropertyId(): string {
    const id = process.env.GA4_PROPERTY_ID;
    if (!id) throw new Error("Missing env GA4_PROPERTY_ID");
    return id;
}

function loadServiceAccount() {
    const saB64 = process.env.GA4_SA_B64;
    if (!saB64) throw new Error("Missing env GA4_SA_B64 (base64 service account)");
    let saObj: any;
    try {
        saObj = JSON.parse(Buffer.from(saB64, "base64").toString("utf8"));
    } catch (err) {
        throw new Error("GA4_SA_B64 is not valid base64 JSON: " + String(err));
    }
    if (!saObj.private_key || !saObj.client_email) {
        throw new Error("Service account JSON missing private_key or client_email");
    }
    saObj.private_key = saObj.private_key.replace(/\\n/g, "\n");
    return saObj;
}

async function getAnalyticsClient() {
    const sa = loadServiceAccount();
    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: sa.client_email, private_key: sa.private_key },
        scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
    return google.analyticsdata({ version: "v1beta", auth });
}

function ymd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function safePathFromLocation(loc: string) {
    try {
        const u = new URL(loc);
        let path = u.pathname;
        if (path === "/") return ""; // raíz excluida
        path = path.replace(/^\/|\/$/g, "");
        return path;
    } catch {
        return loc.replace(/^\/|\/$/g, "");
    }
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
    try {
        // validar envs aquí (errores claros si falta algo)
        const SITE_BASE = getSiteBase();
        const PROPERTY_ID = getPropertyId();

        const url = req.nextUrl;
        const dateParam = url.searchParams.get("date");
        const limit = Number(url.searchParams.get("limit") || "10");

        const emailsParam = url.searchParams.get("emails");
        if (!emailsParam)
            throw new Error(
                "Debes enviar al menos un email como query param: ?emails=a@a.com,b@b.com"
            );
        const emails = emailsParam.split(",").map((e) => e.trim()).filter(Boolean);

        const antier = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const date = dateParam || ymd(antier);

        const analytics = await getAnalyticsClient();

        const resp = await analytics.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate: date, endDate: date }],
                dimensions: [{ name: "pagePath" }],
                metrics: [{ name: "screenPageViews" }],
                limit: "10000",
                dimensionFilter: {
                    andGroup: {
                        expressions: [
                            {
                                filter: {
                                    fieldName: "pageLocation",
                                    stringFilter: { matchType: "BEGINS_WITH", value: SITE_BASE },
                                },
                            },
                            {
                                notExpression: {
                                    filter: {
                                        fieldName: "pageLocation",
                                        stringFilter: { matchType: "EXACT", value: `${SITE_BASE}/` },
                                    },
                                },
                            },
                            {
                                notExpression: {
                                    filter: {
                                        fieldName: "pageLocation",
                                        stringFilter: { matchType: "EXACT", value: SITE_BASE },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        });

        const rows = resp.data.rows || [];
        const items: Array<{ link: string; views: number; title: string }> = rows
            .map((r: any) => {
                const loc = r.dimensionValues?.[0]?.value ?? "";
                const views = Number(r.metricValues?.[0]?.value ?? 0);
                const title = safePathFromLocation(loc);
                return { link: loc, views, title };
            })
            .filter((i) => i.title);

        if (!items.length) {
            return new Response(
                JSON.stringify({ success: true, date, count: 0, mostViewed: [], leastViewed: [] }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        const byViewsDesc = [...items].sort((a, b) => b.views - a.views);
        const byViewsAsc = [...items].sort((a, b) => a.views - b.views);

        const leastCandidates = byViewsAsc.filter((i) => i.views > 0);
        const leastViewed = leastCandidates.slice(0, limit).map((i) => ({
            id: null,
            title: i.title,
            slug: i.title,
            link: i.link,
            created_at: date,
            views: i.views,
        }));

        const mostViewed = byViewsDesc.slice(0, limit).map((i) => ({
            id: null,
            title: i.title,
            slug: i.title,
            link: i.link,
            created_at: date,
            views: i.views,
        }));

        const html = generatePostsAnalyticsHtml({ date, leastViewed, mostViewed });

        // Envío secuencial: 1 email cada 5 segundos
        const emailService = new EmailService();
        const results: { email: string; ok: boolean; error?: string }[] = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const mailPayload: MailPayload = { to: email, subject: `Reporte de vistas - ${date}`, html };

            try {
                await emailService.sendMail(mailPayload);
                results.push({ email, ok: true });
                console.log(`Email enviado a ${email}`);
            } catch (sendErr: any) {
                console.error(`Error enviando a ${email}:`, sendErr);
                results.push({ email, ok: false, error: sendErr?.message || String(sendErr) });
            }

            if (i < emails.length - 1) await sleep(5000);
        }

        return new Response(
            JSON.stringify({
                success: true,
                date,
                count: items.length,
                leastViewed,
                mostViewed,
                sendResults: results,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("analyticsTopPages error:", err);
        return new Response(JSON.stringify({ error: err.message || String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
