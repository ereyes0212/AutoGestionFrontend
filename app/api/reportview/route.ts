export const dynamic = "force-dynamic";

import { EmailService, MailPayload } from "@/lib/sendEmail";
import { generatePostsAnalyticsHtml } from "@/lib/templates/analyticViewsReport";
import { google } from "googleapis";
import type { NextRequest } from "next/server";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID!;
const SA_B64 = process.env.GA4_SA_B64!;
const WP_SITE_URL = process.env.WP_SITE_URL!;
const WP_USER = process.env.WP_API_USER!;
const WP_PASS = process.env.WP_API_APP_PASS!;

function loadServiceAccount() {
    const sa = JSON.parse(Buffer.from(SA_B64, "base64").toString("utf8"));
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

function ymd(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function chunkArray<T>(arr: T[], size = 200) {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

async function fetchWpPostsByDate(wpSiteUrl: string, date: string, perPage = 100, pathPrefix?: string) {
    const posts: Array<{ id: number; title: string; slug: string; link: string; date: string }> = [];
    let page = 1;
    const basicAuth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64");

    while (true) {
        const url = new URL(`${wpSiteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`);
        url.searchParams.set("after", `${date}T00:00:00`);
        url.searchParams.set("before", `${date}T23:59:59`);
        url.searchParams.set("per_page", String(perPage));
        url.searchParams.set("page", String(page));

        const res = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Basic ${basicAuth}`,
            },
            cache: "no-store",
        });

        if (!res.ok) throw new Error(`WP REST API error: ${res.status} ${res.statusText}`);

        const arr = await res.json();
        if (!Array.isArray(arr) || arr.length === 0) break;

        for (const p of arr) {
            const link = p.link || "";
            if (pathPrefix && !link.includes(pathPrefix)) continue;
            posts.push({
                id: p.id,
                title: (p.title && p.title.rendered) ? p.title.rendered : (p.title || ""),
                slug: p.slug || "",
                link,
                date: p.date || p.modified || "",
            });
        }

        if (arr.length < perPage) break;
        page += 1;
        if (page > 50) break;
    }

    return posts;
}

export async function GET(req: NextRequest) {
    try {
        const url = req.nextUrl;
        const dateParam = url.searchParams.get("date");
        const pathPrefix = url.searchParams.get("pathPrefix") || "";
        const limit = Number(url.searchParams.get("limit") || "10");

        // Query emails
        const emailsParam = url.searchParams.get("emails");
        if (!emailsParam) throw new Error("Debes enviar al menos un email como query param: ?emails=a@a.com,b@b.com");
        const emails = emailsParam.split(",").map(e => e.trim()).filter(Boolean);

        const antier = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        const date = dateParam || ymd(antier);

        const posts = await fetchWpPostsByDate(WP_SITE_URL, date, 100, pathPrefix);
        if (!posts.length) return new Response(JSON.stringify({ success: true, date, countCreated: 0, items: [] }), { status: 200, headers: { "Content-Type": "application/json" } });

        const analytics = await getAnalyticsClient();
        const values = posts.map(p => p.link);
        const chunks = chunkArray(values, 200);

        const gaMap: Record<string, number> = {};
        for (const chunk of chunks) {
            const resp = await analytics.properties.runReport({
                property: `properties/${PROPERTY_ID}`,
                requestBody: {
                    dateRanges: [{ startDate: date, endDate: date }],
                    dimensions: [{ name: "pageLocation" }],
                    metrics: [{ name: "screenPageViews" }],
                    limit: String(Math.max(1000, chunk.length)),
                    dimensionFilter: {
                        filter: {
                            fieldName: "pageLocation",
                            inListFilter: { values: chunk },
                        },
                    },
                },
            });

            const rows = resp.data.rows || [];
            rows.forEach((r: any) => {
                const loc = r.dimensionValues?.[0]?.value ?? "";
                const views = Number(r.metricValues?.[0]?.value ?? 0);
                gaMap[loc] = (gaMap[loc] ?? 0) + views;
            });
        }

        const itemsWithViews = posts.map(p => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            link: p.link,
            created_at: p.date,
            views: gaMap[p.link] ?? 0,
        }));

        const leastViewed = itemsWithViews.sort((a, b) => a.views - b.views).slice(0, limit);
        const mostViewed = itemsWithViews.sort((a, b) => b.views - a.views).slice(0, limit);

        // Generar HTML usando tu función
        const html = generatePostsAnalyticsHtml({ date, leastViewed, mostViewed });

        // Enviar email
        const emailService = new EmailService();
        await Promise.all(emails.map(email => {
            const mailPayload: MailPayload = {
                to: email,
                subject: `Reporte de posts - ${date}`,
                html
            };
            return emailService.sendMail(mailPayload);
        }));

        return new Response(JSON.stringify({
            success: true,
            date,
            countCreated: posts.length,
            leastViewed,
            mostViewed,
            sentTo: emails
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("newPostsLeastViews error:", err);
        return new Response(JSON.stringify({ error: err.message || String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
