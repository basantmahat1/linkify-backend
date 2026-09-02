import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import AuthSetting from "../models/AuthSetting.js";

// Configure Nodemailer transporter (Brevo SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Build the beautiful Linkify OTP email HTML
 */
function buildOtpHtml(name, otp, logoUrl = "") {
  const digits = otp.split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="width:44px;height:52px;text-align:center;font-size:28px;font-weight:700;font-family:'Inter',sans-serif;color:#1A0A0A;background:#FFF5F5;border:2px solid #FFD4D4;border-radius:10px;letter-spacing:0;">${d}</td>`
    )
    .join('<td style="width:8px"></td>');

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Linkify Logo" width="72" height="72" style="width:72px;height:72px;object-fit:contain;margin:0 auto 14px;display:block;" />`
    : `<div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:14px;margin:0 auto 14px;line-height:48px;font-size:22px;text-align:center;">🔗</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Satisfy&display=swap" rel="stylesheet">
  <title>Verify your email — Linkify</title>
</head>
<body style="margin:0;padding:0;background:#F8F4F4;font-family:'Inter','Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F4F4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(255,82,82,0.08);">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF5252,#ff8a80);padding:36px 32px 28px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    ${logoHtml}
                    <h1 style="margin:0;font-size:26px;font-weight:400;color:#FFFFFF;letter-spacing:1px;font-family:'Satisfy',cursive;">
                      Linkify
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 20px;">
              <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1A0A0A;font-family:'Inter',sans-serif;">
                Verify your email
              </h2>
              <p style="margin:0 0 28px;font-size:14px;color:#6B5252;line-height:1.6;font-family:'Inter',sans-serif;">
                Hi <strong style="color:#1A0A0A;">${name || "there"}</strong>,<br>
                Use the verification code below to continue to your Linkify account.
              </p>

              <!-- OTP Code -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  ${digitBoxes}
                </tr>
              </table>

              <!-- Expiry badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#FFF5F5,#FFE8E8);border-radius:20px;padding:8px 20px;">
                    <span style="font-size:12px;font-weight:600;color:#FF5252;font-family:'Inter',sans-serif;">
                      ⏱ This code expires in 5 minutes
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Safety note -->
              <p style="margin:0;font-size:13px;color:#9E8888;line-height:1.6;font-family:'Inter',sans-serif;">
                If you didn't request this code, you can safely ignore this email. Someone may have entered your email by mistake.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:linear-gradient(to right,transparent,#FFD4D4,transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6B5252;font-family:'Inter',sans-serif;">
                — Linkify
              </p>
              <p style="margin:0;font-size:11px;color:#BEA8A8;font-family:'Inter',sans-serif;">
                © ${new Date().getFullYear()} Linkify. All rights reserved.
              </p>
        </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send OTP verification email via Nodemailer
 */
export async function sendOtpEmail(to, name, otp) {
  try {
    // Fetch the email logo URL from DB (set by admin)
    const settings = await AuthSetting.findOne().lean();
    const logoUrl = settings?.emailLogo || "";

    const info = await transporter.sendMail({
      from: `"${env.brevo.senderName}" <${env.brevo.senderEmail}>`,
      to: to,
      subject: `${otp} is your Linkify verification code`,
      html: buildOtpHtml(name, otp, logoUrl),
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[email.service] Failed to send OTP email:", {
      to,
      message: error.message,
      code: error.code,
      response: error.response,
    });
    throw new Error("Failed to send verification email. Please try again.");
  }
}
