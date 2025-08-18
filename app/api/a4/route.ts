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

export async function GET(req: NextRequest) {
    try {
        if (!PROPERTY_ID) throw new Error("GA4_PROPERTY_ID no definido");

        const emailsParam = req.nextUrl.searchParams.get("emails");
        if (!emailsParam) throw new Error("Debes enviar al menos un email como query param: ?emails=a@a.com,b@b.com");
        const emails = emailsParam.split(",").map(e => e.trim()).filter(Boolean);
        if (!emails.length) throw new Error("No se encontraron emails válidos");

        const analytics = await getAnalyticsClient();

        // Fecha de antier en formato YYYY-MM-DD
        const antier = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const antierStr = antier.toISOString().split("T")[0];
        console.log("🚀 ~ GET ~ antierStr:", antierStr)

        const resp = await analytics.properties.runReport({
            property: `properties/${PROPERTY_ID}`,
            requestBody: {
                dateRanges: [{ startDate: antierStr, endDate: antierStr }],
                dimensions: [{ name: "country" }],
                metrics: [
                    { name: "screenPageViews" },
                    { name: "activeUsers" },
                    { name: "newUsers" }
                ],
                limit: 1000
            } as any
        });

        const rows = resp.data.rows || [];

        let totalActiveUsers = 0;
        let totalViews = 0;
        let totalNewUsers = 0;
        let usaActiveUsers = 0;
        let usaViews = 0;

        rows.forEach(row => {
            const country = row.dimensionValues?.[0]?.value;
            const views = Number(row.metricValues?.[0]?.value ?? 0);
            const activeUsers = Number(row.metricValues?.[1]?.value ?? 0);
            const newUsers = Number(row.metricValues?.[2]?.value ?? 0);

            totalViews += views;
            totalActiveUsers += activeUsers;
            totalNewUsers += newUsers;

            if (country === "United States") {
                usaActiveUsers += activeUsers;
                usaViews += views;
            }
        });

        const usaUserPercent = totalActiveUsers ? (usaActiveUsers / totalActiveUsers) * 100 : 0;

        const analyticsData: AnalyticsData = {
            page: "ALL",
            totalViews,
            totalUsers: totalActiveUsers,
            totalNewUsers,
            usaViews,
            usaUsers: usaActiveUsers,
            usaUserPercent: Number(usaUserPercent.toFixed(2)),
            date: antierStr
        };

        const html = generateAnalyticsReportHtml(analyticsData);
        const emailService = new EmailService();

        await Promise.all(emails.map(email => {
            const mailPayload: MailPayload = {
                to: email,
                subject: `Reporte de Analytics ${analyticsData.date}`,
                html
            };
            return emailService.sendMail(mailPayload);
        }));

        return new Response(JSON.stringify({ success: true, sentTo: emails }), {
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
