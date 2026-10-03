import { google } from "googleapis";
import EmailAccount from "../models/EmailAccount.js";
import { encryptText, decryptText } from "../utils/cryptoUtils.js";

const DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

/**
 * Returns Google OAuth2 client with current credentials
 */
export const getOAuth2Client = (customRedirectUri = null) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  const redirectUri =
    customRedirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    `${serverUrl}/api/email/oauth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in environment variables."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

/**
 * Generates the Google OAuth 2.0 authorization URL
 * Accepts either:
 *   getAuthorizationUrl({ userId, returnUrl, clientOrigin })
 *   OR
 *   getAuthorizationUrl(userId, returnUrl, clientOrigin)
 */
export const getAuthorizationUrl = (userIdOrOptions, maybeReturnUrl, maybeClientOrigin) => {
  const oauth2Client = getOAuth2Client();

  let userId;
  let returnUrl = "/campaigns";
  let clientOrigin = null;

  if (typeof userIdOrOptions === "object" && userIdOrOptions !== null) {
    userId = userIdOrOptions.userId;
    returnUrl = userIdOrOptions.returnUrl || "/campaigns";
    clientOrigin = userIdOrOptions.clientOrigin || null;
  } else {
    userId = userIdOrOptions;
    returnUrl = maybeReturnUrl || "/campaigns";
    clientOrigin = maybeClientOrigin || null;
  }

  if (!userId) {
    throw new Error("userId is required to generate Google OAuth authorization URL");
  }

  const statePayload = Buffer.from(
    JSON.stringify({
      userId: String(userId),
      returnUrl: String(returnUrl),
      clientOrigin: clientOrigin ? String(clientOrigin) : null,
      timestamp: Date.now(),
    })
  ).toString("base64url");

  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Essential to receive refresh_token
    prompt: "consent", // Force consent so Google always issues refresh_token
    scope: DEFAULT_SCOPES,
    state: statePayload,
  });
};

/**
 * Exchanges authorization code from callback for tokens and retrieves user profile
 */
export const handleOAuthCallback = async (code) => {
  const oauth2Client = getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Retrieve user email and profile info from Google
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: profile } = await oauth2.userinfo.get();

  return {
    tokens,
    profile,
  };
};

/**
 * Obtains an authenticated Gmail client for an EmailAccount, automatically refreshing expired tokens
 */
export const getAuthenticatedGmailClient = async (account) => {
  // If account is just an ID or missing encryptedRefreshToken, fetch from DB
  let accountDoc = account;
  if (!accountDoc?.encryptedRefreshToken) {
    accountDoc = await EmailAccount.findById(account._id || account).select(
      "+encryptedRefreshToken +accessToken"
    );
  }

  if (!accountDoc) {
    throw new Error("Email account not found");
  }

  const oauth2Client = getOAuth2Client();

  let accessToken = accountDoc.accessToken;
  const isExpired = !accountDoc.tokenExpiry || new Date(accountDoc.tokenExpiry) <= new Date(Date.now() + 60000);

  // Check if we need to refresh access token
  if (!accessToken || isExpired) {
    if (!accountDoc.encryptedRefreshToken) {
      throw new Error("No refresh token stored for this account. Please reconnect Gmail.");
    }

    try {
      const decryptedRefreshToken = decryptText(accountDoc.encryptedRefreshToken);
      oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken });

      const tokenResponse = await oauth2Client.getAccessToken();
      accessToken = tokenResponse.token;

      // Update in database
      accountDoc.accessToken = accessToken;
      accountDoc.tokenExpiry = new Date(Date.now() + 3500 * 1000); // ~1 hour
      accountDoc.isConnected = true;
      accountDoc.lastError = null;
      await accountDoc.save();
    } catch (refreshErr) {
      const isRevoked =
        refreshErr.message?.includes("invalid_grant") ||
        refreshErr.response?.data?.error === "invalid_grant";

      if (isRevoked) {
        accountDoc.isConnected = false;
        accountDoc.lastError = "Google access was revoked or expired. Please reconnect your account.";
        await accountDoc.save();
        const err = new Error("GMAIL_AUTH_REVOKED");
        err.statusCode = 401;
        throw err;
      }

      throw refreshErr;
    }
  } else {
    oauth2Client.setCredentials({ access_token: accessToken });
  }

  return google.gmail({ version: "v1", auth: oauth2Client });
};

/**
 * Builds standard RFC 2822 email and encodes to Base64URL
 */
const buildRfc2822RawMessage = ({ from, to, subject, htmlBody, textBody, inReplyTo, references }) => {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const encodedSubject = `=?utf-8?B?${Buffer.from(subject || "").toString("base64")}?=`;

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    headers.push(`References: ${references}`);
  }

  let body = "";
  if (htmlBody && textBody) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(textBody).toString("base64"),
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from(htmlBody).toString("base64"),
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    const isHtml = Boolean(htmlBody);
    headers.push(`Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=utf-8`);
    headers.push("Content-Transfer-Encoding: base64");
    body = Buffer.from(htmlBody || textBody || "").toString("base64");
  }

  const rawString = `${headers.join("\r\n")}\r\n\r\n${body}`;
  return Buffer.from(rawString).toString("base64url");
};

/**
 * Reusable sendEmail service using official Gmail API
 */
export const sendEmail = async ({
  emailAccount,
  to,
  subject,
  htmlBody,
  textBody,
  threadId,
  inReplyTo,
  references,
}) => {
  if (!emailAccount) {
    throw new Error("Email account is required to send emails via Gmail API");
  }
  if (!to) {
    throw new Error("Recipient email address (to) is required");
  }

  const senderName = emailAccount.senderName || emailAccount.email;
  const from = senderName ? `"${senderName}" <${emailAccount.email}>` : emailAccount.email;

  const raw = buildRfc2822RawMessage({
    from,
    to,
    subject: subject || "Business Inquiry",
    htmlBody: htmlBody || (textBody ? textBody.replace(/\n/g, "<br/>") : ""),
    textBody: textBody || "",
    inReplyTo,
    references,
  });

  const gmail = await getAuthenticatedGmailClient(emailAccount);

  const requestBody = { raw };
  if (threadId) {
    requestBody.threadId = threadId;
  }

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody,
  });

  return {
    messageId: response.data.id,
    threadId: response.data.threadId,
    labelIds: response.data.labelIds || [],
  };
};

/**
 * Interpolates template variables: {businessName}, {website}, {recipientEmail}, {senderName}
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

export default {
  getOAuth2Client,
  getAuthorizationUrl,
  handleOAuthCallback,
  getAuthenticatedGmailClient,
  sendEmail,
  interpolateTemplate,
};
