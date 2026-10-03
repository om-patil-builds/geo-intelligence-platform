/**
 * Gmail Dispatcher Service
 * Handles template variable interpolation, Gmail SMTP verification, and email sending
 */

let nodemailerModule = null;

const getNodemailer = async () => {
  if (!nodemailerModule) {
    try {
      nodemailerModule = (await import("nodemailer")).default;
    } catch {
      throw new Error(
        "Nodemailer is not installed. Please run 'npm install nodemailer' in the server directory."
      );
    }
  }
  return nodemailerModule;
};

/**
 * Interpolate template variables: {businessName}, {website}, {recipientEmail}, etc.
 */
export const interpolateTemplate = (template = "", context = {}) => {
  if (!template || typeof template !== "string") return "";

  const replacements = {
    businessName: context.businessName || "Business Owner",
    website: context.website || "your website",
    recipientEmail: context.recipientEmail || context.email || "",
    email: context.recipientEmail || context.email || "",
    senderName: context.senderName || "",
  };

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(replacements, key)
      ? replacements[key]
      : match;
  });
};

/**
 * Create a verified Gmail SMTP transporter
 */
export const createGmailTransporter = async (email, appPassword) => {
  const nodemailer = await getNodemailer();
  const cleanPassword = String(appPassword || "").replace(/\s+/g, "");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email.trim().toLowerCase(),
      pass: cleanPassword,
    },
  });
};

/**
 * Verify Gmail credentials against Google SMTP
 */
export const verifyGmailAccount = async (email, appPassword) => {
  if (!email || !appPassword) {
    throw new Error("Both Gmail address and 16-character App Password are required");
  }

  const transporter = await createGmailTransporter(email, appPassword);
  return await transporter.verify();
};

/**
 * Send an email using an authenticated transporter
 */
export const sendEmailMessage = async ({
  transporter,
  fromEmail,
  senderName,
  toEmail,
  subject,
  htmlBody,
  textBody,
}) => {
  const fromFormatted = senderName ? `"${senderName}" <${fromEmail}>` : fromEmail;

  return await transporter.sendMail({
    from: fromFormatted,
    to: toEmail,
    subject: subject || "Business Inquiry",
    text: textBody,
    html: htmlBody || textBody.replace(/\n/g, "<br>"),
  });
};

export default {
  interpolateTemplate,
  createGmailTransporter,
  verifyGmailAccount,
  sendEmailMessage,
};
