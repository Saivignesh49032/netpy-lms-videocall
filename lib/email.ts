import nodemailer from 'nodemailer';

// Shared HTML template generation
const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Organisation Admin',
  staff: 'Staff / Teacher',
  student: 'Student',
};

interface SendInviteEmailParams {
  toEmail: string;
  role: string;
  inviteUrl: string;
  invitedByName?: string;
  orgName?: string;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'about:blank';
    }
    return escapeHtml(url);
  } catch {
    return 'about:blank';
  }
}

/**
 * Creates a Nodemailer transporter using Gmail SMTP.
 * Use process.env.SMTP_USER and process.env.SMTP_PASSWORD (App Password).
 */
function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    console.error('SMTP configuration missing. Please add SMTP_USER and SMTP_PASSWORD to .env.local');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass, // This MUST be a 16-character Google App Password
    },
  });
}

export async function sendInviteEmail({
  toEmail,
  role,
  inviteUrl,
  invitedByName,
  orgName,
}: SendInviteEmailParams) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('Email delivery skipped: SMTP credentials not provided.');
  }

  const roleLabel = ROLE_LABEL[role] ?? role;
  const platformName = orgName ? `${orgName} on Netpy LMS` : 'Netpy LMS';

  const safeToEmail = escapeHtml(toEmail);
  const safeRoleLabel = escapeHtml(roleLabel);
  const safePlatformName = escapeHtml(platformName);
  const safeInviter = escapeHtml(invitedByName);
  const safeInviteUrl = sanitizeUrl(inviteUrl);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter', system-ui, -apple-system, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:48px 24px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
              <!-- Header Gradient -->
              <tr>
                <td style="background:linear-gradient(135deg, #059669 0%, #0d9488 100%);padding:48px 40px;text-align:center;">
                  <div style="background-color:rgba(255,255,255,0.15);width:64px;height:64px;border-radius:18px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:32px;">📹</span>
                  </div>
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.025em;">Netpy LMS</h1>
                  <p style="margin:8px 0 0;color:#a7f3d0;font-size:15px;font-weight:500;">Your high-performance learning environment</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:48px 48px 40px;">
                  <h2 style="margin:0 0 16px;font-size:24px;color:#0f172a;font-weight:700;letter-spacing:-0.025em;">You're invited!</h2>
                  
                  <p style="margin:0 0 24px;color:#475569;font-size:16px;line-height:1.6;">
                    ${safeInviter 
                      ? `<strong>${safeInviter}</strong> from <strong>${safePlatformName}</strong> has invited you` 
                      : `You have been invited to join <strong>${safePlatformName}</strong>`} 
                    to collaborate as a <span style="background-color:#f1f5f9;color:#0f172a;padding:2px 8px;border-radius:6px;font-weight:600;font-size:14px;">${safeRoleLabel}</span>.
                  </p>
                  
                  <p style="margin:0 0 32px;color:#475569;font-size:16px;line-height:1.6;">
                    Accept this invitation to complete your profile and access the platform. Please note that this secure link will expire in 72 hours.
                  </p>
                  
                  <!-- Button Area -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${safeInviteUrl}" style="background-color:#059669;color:#ffffff;display:inline-block;padding:16px 40px;font-size:16px;font-weight:600;text-decoration:none;border-radius:12px;box-shadow:0 4px 6px -1px rgba(5,150,105,0.2), 0 2px 4px -1px rgba(5,150,105,0.1);">
                          Accept Invitation →
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Divider -->
                  <div style="margin:40px 0;height:1px;background-color:#e2e8f0;"></div>
                  
                  <!-- Secondary Info -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
                        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.5;">
                          <strong>Security Note:</strong> This invitation was sent specifically to <span style="color:#0f172a;font-weight:500;">${safeToEmail}</span>. Access is strictly controlled.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Link Fallback -->
                  <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;word-break:break-all;text-align:center;">
                    Link not working? Copy and paste this into your browser:<br/>
                    <a href="${safeInviteUrl}" style="color:#059669;text-decoration:none;margin-top:8px;display:block;">${safeInviteUrl}</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color:#f1f5f9;padding:24px 48px;text-align:center;">
                  <p style="margin:0;font-size:13px;color:#64748b;">
                    © ${new Date().getFullYear()} Netpy LMS. Built for seamless learning.
                  </p>
                  <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">
                    If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  console.log(`[Email] Sending invitation to ${toEmail} via SMTP...`);

  return transporter.sendMail({
    from: `"Netpy LMS" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `You're invited to join ${platformName} as ${roleLabel}`,
    html,
  });
}

export async function sendMeetingScheduledEmail(toEmail: string, meeting: any) {
  const transporter = getTransporter();
  if (!transporter) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
            <tr><td style="background:linear-gradient(135deg, #059669 0%, #0d9488 100%);padding:48px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;">Netpy LMS</h1>
            </td></tr>
            <tr><td style="padding:48px;">
              <h2 style="color:#0f172a;margin:0 0 16px;">New Lecture Scheduled</h2>
              <p>Hello,</p>
              <p>A new lecture has been scheduled: <strong>${escapeHtml(meeting.title)}</strong></p>
              <ul>
                <li>Subject: ${escapeHtml(meeting.subject || 'N/A')}</li>
                <li>Module: ${escapeHtml(meeting.module || 'N/A')}</li>
                <li>Topic: ${escapeHtml(meeting.topic || 'N/A')}</li>
                <li>Date: ${escapeHtml(new Date(meeting.scheduled_at).toLocaleString())}</li>
                <li>Duration: ${escapeHtml(meeting.duration_minutes)} minutes</li>
              </ul>
              <table width="100%" align="center"><tr><td align="center">
                <a href="${sanitizeUrl(meeting.join_url)}" style="background-color:#059669;color:#fff;padding:16px 40px;text-decoration:none;border-radius:12px;display:inline-block;">Join Lecture</a>
              </td></tr></table>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"Netpy LMS" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `📅 New Lecture Scheduled: ${meeting.title}`,
    html,
  });
}

export async function sendMeetingCancelledEmail(toEmail: string, meeting: any, reason: string) {
  const transporter = getTransporter();
  if (!transporter) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"></head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter', sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 24px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
            <tr><td style="background:linear-gradient(135deg, #e11d48 0%, #be123c 100%);padding:48px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;">Lecture Cancelled</h1>
            </td></tr>
            <tr><td style="padding:48px;">
              <p>Hello,</p>
              <p>The lecture <strong>${escapeHtml(meeting.title)}</strong> has been cancelled.</p>
              <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
              <p>We apologize for any inconvenience caused.</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"Netpy LMS" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `❌ Lecture Cancelled: ${meeting.title}`,
    html,
  });
}
