// utils/sendEmail.js
import { BrevoClient } from "@getbrevo/brevo";
import dotenv from "dotenv";

// Ensure dotenv reads from project root even if this file is in /utils
dotenv.config({ path: "./src/.env" });


const apiKey = process.env.BREVO_API_KEY?.trim();
const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();

if (!apiKey) throw new Error("Missing BREVO_API_KEY in .env");
if (!senderEmail) throw new Error("Missing BREVO_SENDER_EMAIL in .env");

const client = new BrevoClient({ apiKey });

const sendEmail = async ({ email, subject, html, text }) => {
  try {
    if (!email) throw new Error("Missing recipient email");
    if (!subject) throw new Error("Missing subject");
    if (!html && !text) throw new Error("Missing email content (html or text)");

    const payload = {
      subject,
      sender: { name: "Weg Blog", email: senderEmail },
      to: [{ email }],
      ...(html ? { htmlContent: html } : {}),
      ...(text ? { textContent: text } : {}),
    };

    const res = await client.transactionalEmails.sendTransacEmail(payload);
    console.log("✅ Email sent via Brevo. Response:", res);
    return res;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.body?.message ||
      error?.body?.message ||
      error?.message;

    console.error("--- BREVO API ERROR ---");
    console.error("Message:", errorMessage);
    throw new Error(`Email failed: ${errorMessage}`);
  }
};

export default sendEmail;