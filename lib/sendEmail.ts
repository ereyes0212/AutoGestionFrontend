import nodemailer from "nodemailer";

export async function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!,
        },
    });
}

export interface MailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private transporterPromise = getTransporter();

    async sendMail(payload: MailPayload) {
        const transporter = await this.transporterPromise;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM!,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
        });
    }
}
