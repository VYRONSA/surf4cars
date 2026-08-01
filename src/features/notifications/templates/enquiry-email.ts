import { env } from "@/config/env";

/**
 * The email a dealership receives when a buyer enquires.
 *
 * WHAT IT IS FOR
 * ==============
 * Getting somebody to ring a buyer back. Everything in it is subordinate to that, which is why the
 * telephone number is large and near the top rather than in a details table underneath a marketing
 * header. A dealer reading this on a phone forecourt-side should be able to act on it without
 * scrolling and without logging in to anything.
 *
 * WHY IT IS PLAIN
 * ===============
 * No hosted images, no web fonts, no background photograph of a car. Every one of those raises the
 * spam score, and an enquiry notification that lands in junk is indistinguishable from one that was
 * never sent. Inline styles and a table are ugly and they render the same in Outlook 2016 as in
 * Gmail, which matters more here than anywhere else on the platform.
 *
 * WHY REPLY-TO IS THE BUYER
 * =========================
 * A dealer's instinct is to hit reply. If that reaches a SURF4CARS no-reply mailbox the buyer never
 * hears back and both sides blame the other. The reply goes to the buyer directly; we are the
 * introduction, not the intermediary.
 */

export interface EnquiryEmailInput {
  readonly reference: string;
  readonly dealershipName: string | null;
  readonly buyerName: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly message: string;
  readonly enquiryType: string;
  readonly vehicleTitle: string;
  readonly vehiclePrice: string | null;
  readonly receivedAt: Date;
}

export interface RenderedEmail {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly replyTo: string;
}

/*
  The dealer portal link.
  ======================
  `/dealer/dashboard`, not `/dealer/leads`. The second is declared in the route configuration and has
  no page behind it — it renders a 404. This codebase has already published a Founder report in which
  all 76 dealer links were dead, and the lesson recorded in AGENTS.md was that a link is a claim about
  a destination. The dashboard exists and shows recent leads, so that is where this points until a
  lead centre is built.
*/
const DEALER_LEAD_CENTRE_PATH = "/dealer/dashboard";

const ENQUIRY_TYPE_LABEL: Record<string, string> = {
  contact: "General enquiry",
  "test-drive": "Test drive request",
  finance: "Finance enquiry",
};

/** Untrusted buyer input goes through this before it goes into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatReceivedAt(date: Date): string {
  /* Africa/Johannesburg explicitly. The server may be anywhere; the dealership is not, and "09:14"
     meaning a time in Virginia is worse than no time at all. */
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(date);
}

export function renderEnquiryEmail(input: EnquiryEmailInput): RenderedEmail {
  const typeLabel = ENQUIRY_TYPE_LABEL[input.enquiryType] ?? "Enquiry";
  const received = formatReceivedAt(input.receivedAt);
  const leadCentreUrl = `${env.appUrl.replace(/\/$/, "")}${DEALER_LEAD_CENTRE_PATH}`;

  /* The vehicle and the buyer's name, because that is what a dealer scans for in a list of forty
     unread messages. The reference is in the body, not the subject line, where it would push the
     vehicle past the preview cutoff on a phone. */
  const subject = `${typeLabel}: ${input.vehicleTitle} — ${input.buyerName}`;

  const text = [
    `${typeLabel.toUpperCase()} — SURF4CARS`,
    "",
    `Vehicle:    ${input.vehicleTitle}`,
    ...(input.vehiclePrice ? [`Price:      ${input.vehiclePrice}`] : []),
    `Received:   ${received}`,
    `Reference:  ${input.reference}`,
    "",
    "BUYER",
    `Name:       ${input.buyerName}`,
    `Telephone:  ${input.buyerPhone}`,
    `Email:      ${input.buyerEmail}`,
    "",
    "MESSAGE",
    input.message,
    "",
    `Open in SURF4CARS: ${leadCentreUrl}`,
    "",
    "Replying to this email replies directly to the buyer.",
  ].join("\n");

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:#111827;font-size:14px;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <tr><td style="padding:28px 28px 0 28px;">
    <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">SURF4CARS · ${escapeHtml(typeLabel)}</p>
    <h1 style="margin:0;font-size:20px;line-height:1.3;color:#111827;font-weight:600;">${escapeHtml(input.vehicleTitle)}</h1>
    ${input.vehiclePrice ? `<p style="margin:6px 0 0 0;font-size:15px;color:#374151;">${escapeHtml(input.vehiclePrice)}</p>` : ""}
  </td></tr>

  <!-- The number first. A dealer acting on this is picking up a telephone, not reading a record. -->
  <tr><td style="padding:24px 28px 0 28px;">
    <p style="margin:0 0 2px 0;font-size:13px;color:#6b7280;">${escapeHtml(input.buyerName)} would like to hear from you</p>
    <p style="margin:0;font-size:26px;font-weight:600;line-height:1.2;">
      <a href="tel:${escapeHtml(input.buyerPhone.replace(/[^\d+]/g, ""))}" style="color:#111827;text-decoration:none;">${escapeHtml(input.buyerPhone)}</a>
    </p>
    <p style="margin:6px 0 0 0;font-size:14px;">
      <a href="mailto:${escapeHtml(input.buyerEmail)}" style="color:#4b5563;">${escapeHtml(input.buyerEmail)}</a>
    </p>
  </td></tr>

  <tr><td style="padding:22px 28px 0 28px;">
    <div style="background:#f9fafb;border:1px solid #f0f0f1;border-radius:8px;padding:14px 16px;">
      <p style="margin:0;font-size:15px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escapeHtml(input.message)}</p>
    </div>
  </td></tr>

  <tr><td style="padding:22px 28px 0 28px;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${row("Received", received)}
      ${row("Reference", input.reference)}
      ${input.dealershipName ? row("Dealership", input.dealershipName) : ""}
    </table>
  </td></tr>

  <tr><td style="padding:24px 28px 28px 28px;">
    <a href="${escapeHtml(leadCentreUrl)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;">Open in SURF4CARS</a>
    <p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#9ca3af;">
      Replying to this email replies directly to ${escapeHtml(input.buyerName)}. Quote reference ${escapeHtml(input.reference)} if they call you first.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject, html, text, replyTo: input.buyerEmail };
}
