import { Resend } from "resend";
import dotenv from "dotenv";
import { Language } from "../types";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_CLIENT_URL = "https://www.app.listali.co.il";
const CLIENT_URL = (process.env.CLIENT_URL ?? DEFAULT_CLIENT_URL).replace(/\/$/, "");

const EMAIL_FROM_VERIFICATION = "Listali <hello@listali.co.il>";
const EMAIL_FROM_INVITE = "Listali <invite@listali.co.il>";

export type InviteType = "friend" | "official";

const COLORS = {
  primary: "#0B57D0",
  softBg: "#EEF4FF",
  cardBg: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
  muted2: "#9CA3AF",
  linkBg: "#F9FAFB",
  shadow: "0 8px 24px rgba(0,0,0,0.04)",
} as const;

function getDir(language: Language) {
  return language === "en" ? ("ltr" as const) : ("rtl" as const);
}

function ensureSafeClientUrl(url: string) {
  if (!url || url.includes("localhost") || url.startsWith("http://")) return DEFAULT_CLIENT_URL;
  return url.replace(/\/$/, "");
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function wrapEmail(opts: {
  dir: "rtl" | "ltr";
  brandTitle: string;
  brandSubtitle: string;
  headline: string;
  bodyHtml: string;
  footer: string;
}) {
  const { dir, brandTitle, brandSubtitle, headline, bodyHtml, footer } = opts;
  const textAlign = dir === "rtl" ? "right" : "left";

  return `
<div dir="${dir}" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;line-height:1.7;color:${COLORS.text};text-align:${textAlign};background:${COLORS.softBg};padding:24px;">
  <div style="background:${COLORS.cardBg};border-radius:18px;box-shadow:${COLORS.shadow};overflow:hidden;">
    <div style="padding:22px 22px 14px 22px;">
      <div style="font-size:20px;font-weight:700;color:${COLORS.primary};">${escapeHtml(brandTitle)}</div>
      <div style="font-size:13px;color:${COLORS.muted};margin-top:2px;">${escapeHtml(brandSubtitle)}</div>
    </div>

    <div style="padding:0 22px 22px 22px;">
      <h2 style="margin:10px 0 12px 0;font-size:20px;">${escapeHtml(headline)}</h2>
      ${bodyHtml}
    </div>
  </div>

  <div style="margin-top:14px;text-align:center;font-size:12px;color:${COLORS.muted};">
    ${escapeHtml(footer)} ·
    <a href="${DEFAULT_CLIENT_URL}" style="color:${COLORS.muted};text-decoration:none;">listali.co.il</a>
  </div>
</div>
`;
}

function primaryButton(href: string, label: string) {
  return `
<div style="margin:18px 0;">
  <a href="${escapeHtml(href)}"
     style="display:inline-block;background:${COLORS.primary};color:#FFFFFF;padding:13px 20px;border-radius:14px;font-weight:700;text-decoration:none;">
    ${escapeHtml(label)}
  </a>
</div>`;
}

function linkBox(label: string, url: string) {
  return `
<div style="margin-top:18px;background:${COLORS.linkBg};border:1px solid ${COLORS.border};border-radius:12px;padding:12px;">
  <div style="font-size:12px;color:${COLORS.muted};margin-bottom:6px;">${escapeHtml(label)}</div>
  <div style="font-size:12px;word-break:break-all;color:${COLORS.primary};">${escapeHtml(url)}</div>
</div>`;
}

function codeBox(label: string, code: string) {
  return `
<div style="margin:16px 0;background:${COLORS.linkBg};border:1px solid ${COLORS.border};border-radius:12px;padding:14px;">
  <div style="font-size:12px;color:${COLORS.muted};margin-bottom:6px;">${escapeHtml(label)}</div>
  <div style="font-size:22px;font-weight:800;letter-spacing:1px;color:${COLORS.text};">${escapeHtml(code)}</div>
</div>`;
}

export async function sendEmailVerification(
  to: string,
  token: string,
  username: string,
  language: Language = "he"
) {
  const dir = getDir(language);
  const clientUrl = ensureSafeClientUrl(CLIENT_URL);

  const verificationUrl = `${clientUrl}/${language}/auth/verify-email?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(to)}`;

  const t =
    language === "en"
      ? {
          subject: "Verify your email for Listali",
          brandSubtitle: "Shared shopping lists, simple and fast",
          headline: "One last step — confirm your email",
          hi: (name: string) => `Hi ${name},`,
          p1: "You signed up for Listali. To make sure this email is yours, please confirm it.",
          p2: "It takes a second — just click below:",
          cta: "Verify email address",
          fallback: "If the button doesn’t work, copy and paste this link:",
          ignore: "If you didn't request this, you can safely ignore this email.",
          footer: "The Listali Team",
        }
      : {
          subject: "אימות כתובת האימייל שלך ב-Listali",
          brandSubtitle: "רשימות קניות משותפות, פשוט וקל",
          headline: "רק עוד צעד קטן, ונכנסים ל-Listali",
          hi: (name: string) => `היי ${name},`,
          p1: "נרשמת ל-Listali, ונשאר רק לאשר שזו באמת כתובת האימייל שלך.",
          p2: "זה לוקח שנייה — פשוט לוחצים כאן:",
          cta: "אימות כתובת האימייל",
          fallback: "אם הכפתור לא נפתח, אפשר להעתיק ולהדביק את הקישור:",
          ignore: "אם זה הגיע אליך בטעות — אין צורך לעשות כלום, אפשר פשוט להתעלם.",
          footer: "צוות Listali",
        };

  const text = [
    t.hi(username),
    "",
    t.p1,
    t.p2,
    verificationUrl,
    "",
    t.ignore,
    "",
    t.footer,
  ].join("\n");

  const bodyHtml = `
<p style="margin:0 0 12px 0;">${escapeHtml(t.hi(username))}</p>
<p style="margin:0 0 14px 0;color:#374151;">${escapeHtml(t.p1)}</p>
<p style="margin:0 0 8px 0;color:#374151;">${escapeHtml(t.p2)}</p>
${primaryButton(verificationUrl, t.cta)}
${linkBox(t.fallback, verificationUrl)}
<p style="margin:16px 0 0 0;font-size:12px;color:${COLORS.muted};">${escapeHtml(t.ignore)}</p>
`;

  const html = wrapEmail({
    dir,
    brandTitle: "Listali",
    brandSubtitle: t.brandSubtitle,
    headline: t.headline,
    bodyHtml,
    footer: t.footer,
  });

  return await resend.emails.send({
    from: EMAIL_FROM_VERIFICATION,
    to,
    subject: t.subject,
    text,
    html,
  });
}

export async function sendGroupInviteEmail(params: {
  to: string;
  code: string;
  inviterName?: string;
  groupName?: string;
  language?: Language;
  isNewUser?: boolean;
  inviteType?: InviteType;
}) {
  const {
    to,
    code,
    inviterName = "חבר",
    groupName,
    language = "he",
    isNewUser = false,
    inviteType = "friend",
  } = params;

  const dir = getDir(language);
  const clientUrl = ensureSafeClientUrl(CLIENT_URL);

  const actionUrl = isNewUser
    ? `${clientUrl}/${language}/auth/register?inviteCode=${encodeURIComponent(code)}`
    : `${clientUrl}/${language}/dashboard/groups/join?code=${encodeURIComponent(code)}`;

  const isHebrew = language !== "en";
  const nameSafe = inviterName?.trim() ? inviterName.trim() : isHebrew ? "חבר" : "a friend";
  const groupSafe = groupName?.trim() ? groupName.trim() : isHebrew ? "קבוצת קניות" : "shopping group";

  const t = (() => {
    if (isHebrew) {
      if (inviteType === "official") {
        return {
          subject: `קוד הצטרפות לקבוצת ${groupSafe} ב-Listali`,
          brandSubtitle: "הזמנה רשמית להצטרפות לקבוצה",
          headline: "הזמנה לקבוצה קיימת",
          intro: `הוזמנת להצטרף לקבוצת "${groupSafe}" ב-Listali.`,
          hint: "כדי להצטרף, השתמש בקוד הבא או לחץ על הכפתור.",
          codeLabel: "קוד הצטרפות",
          cta: isNewUser ? "להרשמה והצטרפות" : "להצטרפות לקבוצה",
          fallback: "קישור חלופי:",
          ignore: "אם לא ציפית לקבל הזמנה, אפשר להתעלם מהמייל.",
          footer: "צוות Listali",
        };
      }
      return {
        subject: "הוזמנת להצטרף לקבוצת קניות ב-Listali",
        brandSubtitle: "רשימות קניות משותפות, פשוט וקל",
        headline: "הוזמנת להצטרף לקבוצה",
        intro: `${nameSafe} הזמין אותך להצטרף לקבוצת קניות ב-Listali.`,
        hint: "בקבוצה אחת אפשר לנהל יחד רשימת קניות אחת — כולם רואים עדכונים בזמן אמת.",
        codeLabel: "קוד הצטרפות",
        cta: isNewUser ? "להרשמה והצטרפות" : "הצטרפות לקבוצה",
        fallback: "אם הכפתור לא נפתח, אפשר להעתיק את הקישור:",
        ignore: "אם ההזמנה לא מוכרת לך, אפשר להתעלם מהמייל.",
        footer: "צוות Listali",
      };
    }

    // EN
    if (inviteType === "official") {
      return {
        subject: `Join code for ${groupSafe} on Listali`,
        brandSubtitle: "Official invitation to join a group",
        headline: "Invitation to an existing group",
        intro: `You were invited to join the "${groupSafe}" group on Listali.`,
        hint: "Use the code below or click the button to join.",
        codeLabel: "Join code",
        cta: isNewUser ? "Sign up & join" : "Join group",
        fallback: "Alternative link:",
        ignore: "If you weren’t expecting this invitation, you can safely ignore this email.",
        footer: "The Listali Team",
      };
    }

    return {
      subject: "You’ve been invited to a Listali shopping group",
      brandSubtitle: "Shared shopping lists, simple and fast",
      headline: "You’re invited to join a group",
      intro: `${nameSafe} invited you to join a shopping group on Listali.`,
      hint: "Manage one shared list together — everyone sees updates in real time.",
      codeLabel: "Join code",
      cta: isNewUser ? "Sign up & join" : "Join group",
      fallback: "If the button doesn’t work, copy and paste this link:",
      ignore: "If you don’t recognize this invitation, you can ignore this email.",
      footer: "The Listali Team",
    };
  })();

  const text = [
    t.intro,
    t.hint ? `\n${t.hint}` : "",
    "",
    `${t.codeLabel}: ${code}`,
    "",
    `${t.cta}: ${actionUrl}`,
    "",
    t.ignore,
    "",
    t.footer,
  ]
    .filter(Boolean)
    .join("\n");

  const bodyHtml = `
<p style="margin:0 0 12px 0;">${escapeHtml(t.intro)}</p>
<p style="margin:0 0 14px 0;color:#374151;">${escapeHtml(t.hint)}</p>
${codeBox(t.codeLabel, code)}
${primaryButton(actionUrl, t.cta)}
${linkBox(t.fallback, actionUrl)}
<p style="margin:16px 0 0 0;font-size:12px;color:${COLORS.muted};">${escapeHtml(t.ignore)}</p>
`;

  const html = wrapEmail({
    dir,
    brandTitle: "Listali",
    brandSubtitle: t.brandSubtitle,
    headline: t.headline,
    bodyHtml,
    footer: t.footer,
  });

  return await resend.emails.send({
    from: EMAIL_FROM_INVITE,
    to,
    subject: t.subject,
    text,
    html,
  });
}
