import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Determine if email configuration is present
const hasConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

let transporter = null;

if (hasConfig) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        secure: false, // true for port 465, false for 587 or others
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
} else {
    console.warn("\n=========================================================================");
    console.warn("⚠ PERINGATAN: Konfigurasi EMAIL_HOST, EMAIL_USER, dan EMAIL_PASS belum diatur.");
    console.warn("Pengiriman email nyata akan di-simulasikan lewat Log Konsol.");
    console.warn("=========================================================================\n");
}

/**
 * Sends an email using Nodemailer or falls back to console logging if config is missing.
 * 
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @returns {Promise<any>}
 */
export const sendEmail = async ({ to, subject, html }) => {
    if (transporter) {
        const mailOptions = {
            from: `"DoneRight" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email successfully sent to ${to}. Message ID: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`Failed to send email to ${to}:`, error.message);
            throw error; // Re-throw so callers can handle it
        }
    } else {
        // Fallback for local development if email creds aren't configured yet
        console.log("\n=========================================================================");
        console.log("📧 [SIMULASI PENGIRIMAN EMAIL]");
        console.log(`Kepada  : ${to}`);
        console.log(`Subjek  : ${subject}`);
        console.log("-------------------------------------------------------------------------");
        console.log("Isi HTML:");
        console.log(html);
        console.log("=========================================================================\n");
        return { messageId: "simulated-id" };
    }
};
