export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { EmailService, MailPayload } from "@/lib/sendEmail";
import { generatePostsAnalyticsHtml } from "@/lib/templates/analyticViewsReport";
import { google } from "googleapis";
import type { NextRequest } from "next/server";

function getPropertyId(): string {
    const id = process.env.GA4_PROPERTY_ID;
    if (!id) throw new Error("Missing env GA4_PROPERTY_ID");
    return id;
}

/** devuelve SITE_BASE desde env y normaliza sin slash final */
function getSiteBase(): string {
    const base = process.env.SITE_BASE || process.env.WP_SITE_URL || process.env.SITE_URL;
    if (!base) throw new Error("Missing env SITE_BASE (ej: https://tiempo.hn)");
    return base.replace(/\/$/, "");
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

function normalizeSlug(pathOrSlug: string) {
    if (!pathOrSlug) return "";
    try {
        if (pathOrSlug.startsWith("http://") || pathOrSlug.startsWith("https://")) {
            const u = new URL(pathOrSlug);
            pathOrSlug = u.pathname;
        }
    } catch {
        // ignore
    }
    return pathOrSlug.replace(/^\/|\/$/g, "").trim();
}

/**
 * Limpia títulos raros como "[slug]slug" devolviendo solo "slug".
 */
function cleanTitle(raw: string) {
    if (!raw) return "";
    raw = String(raw).trim();
    if (raw.startsWith("[")) {
        const m = raw.match(/^\[([^\]]+)\](.*)$/);
        if (m) {
            const inner = m[1].trim();
            const rest = m[2].trim();
            if (!rest) return normalizeSlug(inner);
            if (rest === inner) return normalizeSlug(inner);
            if (normalizeSlug(rest) === normalizeSlug(inner)) return normalizeSlug(inner);
            return normalizeSlug(inner);
        }
    }
    const s = normalizeSlug(raw);
    const bracketStrip = s.replace(/\[.*?\]/g, "").trim();
    return normalizeSlug(bracketStrip || s);
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
    try {
        const PROPERTY_ID = getPropertyId();
        const SITE_BASE = getSiteBase();

        const url = req.nextUrl;
        const limit = Number(url.searchParams.get("limit") || "10");

        const emailsParam = url.searchParams.get("emails");
        if (!emailsParam)
            throw new Error("Debes enviar al menos un email como query param: ?emails=a@a.com,b@b.com");
        const emails = emailsParam.split(",").map((e) => e.trim()).filter(Boolean);

        // Rango: últimos 7 días completos (end = ayer, start = end - 6 días)
        const endDateObj = new Date(Date.now() - 24 * 60 * 60 * 1000); // ayer
        const startDateObj = new Date(endDateObj.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 días antes
        const startDate = ymd(startDateObj);
        const endDate = ymd(endDateObj);

        const analytics = await getAnalyticsClient();

        const resp = await analytics.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "pagePath" }],
                metrics: [{ name: "screenPageViews" }],
                limit: "10000",
                dimensionFilter: {
                    andGroup: {
                        expressions: [
                            {
                                filter: {
                                    fieldName: "pagePath",
                                    stringFilter: { matchType: "BEGINS_WITH", value: "/" },
                                },
                            },
                            {
                                notExpression: {
                                    filter: {
                                        fieldName: "pagePath",
                                        stringFilter: { matchType: "EXACT", value: "/" },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        });

        const rows = resp.data.rows || [];

        // construir items: si GA4 trae URL absoluta en pagePath (ej: startsWith http), usarla; si no, construir desde SITE_BASE
        const items: Array<{
            path: string;
            slug: string;
            title: string;
            views: number;
            url: string;
        }> = rows
            .map((r: any) => {
                const rawVal = r.dimensionValues?.[0]?.value ?? "";
                const views = Number(r.metricValues?.[0]?.value ?? 0);

                // si GA4 devolvió la URL completa (pageLocation), úsala directamente
                let absoluteUrl = "";
                if (/^https?:\/\//i.test(rawVal)) {
                    absoluteUrl = rawVal;
                }

                const rawSlug = normalizeSlug(rawVal);
                const cleanedTitle = cleanTitle(rawSlug);

                // Si analytics no devolvió url absoluta, construimos una correctamente
                if (!absoluteUrl && rawSlug) {
                    // encodear solo los segmentos, para NO convertir '/' a %2F
                    const encodedSegments = rawSlug
                        .split("/")
                        .map((seg) => encodeURIComponent(seg))
                        .join("/");
                    absoluteUrl = `${SITE_BASE}/${encodedSegments}`;
                }

                return { path: rawVal, slug: rawSlug, title: cleanedTitle, views, url: absoluteUrl };
            })
            .filter((i) => i.slug); // descartamos raíz y entradas vacías

        if (!items.length) {
            return new Response(
                JSON.stringify({
                    success: true,
                    startDate,
                    endDate,
                    count: 0,
                    mostViewed: [],
                    leastViewed: [],
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        const byViewsDesc = [...items].sort((a, b) => b.views - a.views);
        const byViewsAsc = [...items].sort((a, b) => a.views - b.views);

        const leastCandidates = byViewsAsc.filter((i) => i.views > 0);
        const leastViewed = leastCandidates.slice(0, limit).map((i) => ({
            id: null,
            title: i.title, // limpio
            slug: i.slug,
            link: i.slug, // para display
            url: i.url, // URL absoluta para el href (ya viene de analytics o la construimos correctamente)
            created_at: endDate,
            views: i.views,
        }));

        const mostViewed = byViewsDesc.slice(0, limit).map((i) => ({
            id: null,
            title: i.title,
            slug: i.slug,
            link: i.slug,
            url: i.url,
            created_at: endDate,
            views: i.views,
        }));

        const html = generatePostsAnalyticsHtml({
            date: `${startDate} → ${endDate}`,
            leastViewed,
            mostViewed,
        });

        const emailService = new EmailService();
        const results: { email: string; ok: boolean; error?: string }[] = [];

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];
            const mailPayload: MailPayload = {
                to: email,
                subject: `Reporte semanal de vistas ${startDate} - ${endDate}`,
                html,
            };

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
                startDate,
                endDate,
                count: items.length,
                leastViewed,
                mostViewed,
                sendResults: results,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("analyticsTopPages weekly error:", err);
        return new Response(JSON.stringify({ error: err.message || String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
