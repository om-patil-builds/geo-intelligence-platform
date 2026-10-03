import axios from "axios";
import { formatWebUrl, normalizeDomain } from "./scrapingQueueService.js";

// Common file extensions that look like email addresses in assets (e.g. image@2x.png)
const IGNORED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".bmp",
  ".ico",
  ".css",
  ".js",
  ".woff",
  ".woff2",
  ".ttf",
  ".mp4",
  ".pdf",
];

// Domains that are third-party libraries, placeholders, or tracking platforms
const IGNORED_DOMAINS = [
  "example.com",
  "domain.com",
  "test.com",
  "yoursite.com",
  "yourcompany.com",
  "email.com",
  "sentry.io",
  "wixpress.com",
  "wordpress.org",
  "w.org",
  "schema.org",
  "cloudflare.com",
  "github.com",
  "google.com",
  "googleapis.com",
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "linkedin.com",
];

// Keywords indicating contact or about pages
const CONTACT_KEYWORDS = [
  "contact",
  "contactus",
  "contact-us",
  "about",
  "aboutus",
  "about-us",
  "reach",
  "reach-us",
  "touch",
  "get-in-touch",
  "support",
  "connect",
  "team",
  "help",
];

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; GeoIntelligenceBot/1.0)";

/**
 * Filter and sanitize raw email candidates
 */
export const sanitizeEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== "string") return null;

  let email = rawEmail.trim().toLowerCase();

  // Strip mailto: prefix if present
  if (email.startsWith("mailto:")) {
    email = email.replace(/^mailto:/, "").split("?")[0].trim();
  }

  // Strip any trailing punctuation
  email = email.replace(/[.,;:!?)]+$/, "");

  // Basic RFC regex validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return null;

  // Ignore invalid extensions (e.g. avatar@2x.png)
  if (IGNORED_EXTENSIONS.some((ext) => email.endsWith(ext))) return null;

  const domain = email.split("@")[1];
  if (!domain || IGNORED_DOMAINS.includes(domain)) return null;

  // Reject overly long or suspicious emails
  if (email.length < 6 || email.length > 100) return null;

  return email;
};

/**
 * Extract email addresses from raw HTML content
 */
export const extractEmailsFromHtml = (html, pageUrl) => {
  if (!html || typeof html !== "string") return [];

  const foundEmails = new Map();

  // 1. Extract from mailto: links (highest precision)
  const mailtoRegex = /href=["']mailto:([^"'\s?]+)[^"']*["']/gi;
  let match;
  while ((match = mailtoRegex.exec(html)) !== null) {
    const cleaned = sanitizeEmail(match[1]);
    if (cleaned && !foundEmails.has(cleaned)) {
      foundEmails.set(cleaned, { email: cleaned, sourcePage: pageUrl });
    }
  }

  // 2. Extract from raw text using regex
  const textEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  while ((match = textEmailRegex.exec(html)) !== null) {
    const cleaned = sanitizeEmail(match[0]);
    if (cleaned && !foundEmails.has(cleaned)) {
      foundEmails.set(cleaned, { email: cleaned, sourcePage: pageUrl });
    }
  }

  return Array.from(foundEmails.values());
};

/**
 * Find internal contact/about links from HTML
 */
export const discoverContactLinks = (html, baseUrl) => {
  const links = new Set();
  const baseDomain = normalizeDomain(baseUrl);
  if (!baseDomain || !html) return [];

  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]?.trim();
    const anchorText = (match[2] || "").toLowerCase();

    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("tel:")) {
      continue;
    }

    try {
      const resolved = new URL(href, baseUrl);
      // Ensure it is same domain
      if (normalizeDomain(resolved.href) !== baseDomain) continue;

      const pathAndText = `${resolved.pathname} ${anchorText}`.toLowerCase();
      const isContactLink = CONTACT_KEYWORDS.some((kw) => pathAndText.includes(kw));

      if (isContactLink && !resolved.pathname.match(/\.(pdf|jpg|png|zip|exe)$/i)) {
        links.add(resolved.origin + resolved.pathname);
      }
    } catch {
      // Invalid URL syntax, ignore
    }
  }

  // Common standard fallback contact paths
  const standardFallbacks = ["/contact", "/contact-us", "/about", "/about-us"];
  try {
    const origin = new URL(baseUrl).origin;
    for (const fb of standardFallbacks) {
      if (links.size >= 5) break;
      links.add(`${origin}${fb}`);
    }
  } catch {
    // ignore
  }

  return Array.from(links).slice(0, 4); // Max 4 contact subpages to scan
};

/**
 * Scrapes a single webpage with timeout and user-agent
 */
const fetchPageHtml = async (url, timeoutMs = 8000) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: timeoutMs,
      maxRedirects: 5,
      responseType: "text",
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.data;
  } catch {
    return null;
  }
};

/**
 * Main scraper engine for a website target:
 * 1. Fetches homepage
 * 2. Extracts homepage emails
 * 3. Discovers and crawls contact/about pages
 * 4. Aggregates and returns unique emails found
 */
export const scrapeWebsiteForEmails = async (rawWebsiteUrl) => {
  const formattedUrl = formatWebUrl(rawWebsiteUrl);
  if (!formattedUrl) {
    return { emails: [], pagesScanned: [], success: false, error: "Invalid website URL" };
  }

  const pagesScanned = [];
  const discoveredEmails = new Map();

  // Step 1: Fetch Homepage
  pagesScanned.push(formattedUrl);
  const homeHtml = await fetchPageHtml(formattedUrl);

  if (homeHtml) {
    const homeEmails = extractEmailsFromHtml(homeHtml, formattedUrl);
    homeEmails.forEach((item) => discoveredEmails.set(item.email, item));

    // Step 2: Discover and crawl contact subpages
    const contactLinks = discoverContactLinks(homeHtml, formattedUrl);

    for (const subPageUrl of contactLinks) {
      if (pagesScanned.includes(subPageUrl)) continue;

      pagesScanned.push(subPageUrl);
      const subHtml = await fetchPageHtml(subPageUrl, 6000);
      if (subHtml) {
        const subEmails = extractEmailsFromHtml(subHtml, subPageUrl);
        subEmails.forEach((item) => {
          if (!discoveredEmails.has(item.email)) {
            discoveredEmails.set(item.email, item);
          }
        });
      }
    }
  } else {
    // If homepage directly failed, try standard fallback /contact
    try {
      const origin = new URL(formattedUrl).origin;
      const fallbackUrl = `${origin}/contact`;
      pagesScanned.push(fallbackUrl);
      const fallbackHtml = await fetchPageHtml(fallbackUrl, 6000);
      if (fallbackHtml) {
        const emails = extractEmailsFromHtml(fallbackHtml, fallbackUrl);
        emails.forEach((item) => discoveredEmails.set(item.email, item));
      }
    } catch {
      // ignore
    }
  }

  const emails = Array.from(discoveredEmails.values());

  return {
    emails,
    pagesScanned,
    success: pagesScanned.length > 0,
    error: pagesScanned.length === 0 ? "Failed to connect to website" : null,
  };
};

export default scrapeWebsiteForEmails;
