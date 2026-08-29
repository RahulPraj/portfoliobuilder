import nodemailer from "nodemailer";

// ── Transporter ─────────────────────────────────────────────────────────────
// Using `service: "gmail"` instead of manual host/port so Nodemailer picks
// the correct TLS settings automatically.
//
// IMPORTANT — Gmail App Password setup:
//   1. Go to your Google Account → Security → enable 2-Step Verification.
//   2. Go to https://myaccount.google.com/apppasswords
//   3. Create a new App Password (name it anything, e.g. "portfolio-builder").
//   4. Copy the 16-character code (it appears WITH spaces, e.g. "abcd efgh ijkl mnop").
//   5. Paste it into SMTP_PASS in your .env file — keep the spaces OR remove them,
//      both work. Do NOT use your normal Gmail login password here.

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  return nodemailer.createTransport({
    service: "gmail",            // handles host + port + TLS automatically
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS.replace(/\s/g, ""), // strip spaces from app password if any
    },
  });
};

const transporter = createTransporter();

export const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log(`[email] SMTP not configured — skipping. to=${to} subject="${subject}"`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Portfolio Builder" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[email] ✅ Sent to ${to}: "${subject}"`);
  } catch (err) {
    console.error(`[email] ❌ Failed to send to ${to}:`, err.message);
    // Never throw — email failures must never crash the main request
  }
};

export const newAccountEmailToAdmin = (adminEmail, user) =>
  sendEmail({
    to: adminEmail,
    subject: "New account awaiting review — Portfolio Builder",
    html: `<p>${user.name} (${user.email}) just registered and their profile is pending approval.</p>`,
  });

export const accountApprovedEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: "Your account has been approved — Portfolio Builder",
    html: `<p>Hi ${user.name},</p><p>Your account is approved. You can now build and publish your portfolio.</p>`,
  });

export const portfolioApprovedEmail = (user, portfolio) => {
  const url = portfolio.slug
    ? `${process.env.CLIENT_URL}/p/${portfolio.slug}`
    : process.env.CLIENT_URL;
  return sendEmail({
    to: user.email,
    subject: "Your portfolio is approved and live — Portfolio Builder",
    html: `
      <p>Hi ${user.name},</p>
      <p>Great news — an admin reviewed and <strong>approved</strong> your portfolio. It is now live.</p>
      <p><a href="${url}" style="display:inline-block;padding:10px 20px;background:#5b5bf6;color:#fff;border-radius:999px;text-decoration:none">View my live portfolio</a></p>
      <p style="color:#888;font-size:12px">${url}</p>
    `,
  });
};

export const portfolioRejectedEmail = (user, portfolio) => {
  const url = `${process.env.CLIENT_URL}/dashboard`;
  return sendEmail({
    to: user.email,
    subject: "Your portfolio needs a few changes — Portfolio Builder",
    html: `
      <p>Hi ${user.name},</p>
      <p>An admin reviewed your portfolio and asked for a few changes before it can go live:</p>
      <blockquote style="border-left:3px solid #e8a63d;margin:12px 0;padding:8px 16px;color:#555">
        ${portfolio.approvalNote || "Please review your details and resubmit."}
      </blockquote>
      <p><a href="${url}" style="display:inline-block;padding:10px 20px;background:#12121a;color:#fff;border-radius:999px;text-decoration:none">Edit my portfolio</a></p>
    `,
  });
};

export const contactApprovalEmailToOwner = (owner, feedback, approveUrl, rejectUrl) =>
  sendEmail({
    to: owner.email,
    subject: "New contact request on your portfolio — Portfolio Builder",
    html: `
      <p>${feedback.visitorName} sent you a ${feedback.requestType} request.</p>
      <p>
        <a href="${approveUrl}">Approve &amp; release my contact info</a> &nbsp;|&nbsp;
        <a href="${rejectUrl}">Reject</a>
      </p>
      <p>This link expires in 48 hours and can only be used once.</p>
    `,
  });

export const contactDecisionEmailToVisitor = (feedback, approved, ownerContact) =>
  sendEmail({
    to: feedback.visitorEmail,
    subject: approved ? "Your request was approved — Portfolio Builder" : "Your request was declined",
    html: approved
      ? `<p>Good news — the portfolio owner approved your request.</p>
         <p>Contact: ${ownerContact.email}</p>
         <p>LinkedIn: ${ownerContact.linkedin || "(none on file)"}</p>`
      : `<p>The portfolio owner was not able to approve your request at this time.</p>`,
  });
