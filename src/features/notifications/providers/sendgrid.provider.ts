import { classifyStatus, describeResponse, postJson } from "./http";
import type { EmailMessage, EmailProvider, SendOutcome } from "./types";

/** https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send */
export function createSendGridProvider(config: {
  readonly apiKey: string;
  readonly from: string;
}): EmailProvider {
  return {
    kind: "provider",
    name: "sendgrid",
    async send(message: EmailMessage): Promise<SendOutcome> {
      const result = await postJson(
        "https://api.sendgrid.com/v3/mail/send",
        { Authorization: `Bearer ${config.apiKey}` },
        {
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: config.from },
          subject: message.subject,
          content: [
            /* Order matters to SendGrid: plain text must come first, and a client that shows the
               last part it understands will show HTML because of it. */
            { type: "text/plain", value: message.text },
            { type: "text/html", value: message.html },
          ],
          ...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
        },
      );

      if ("timedOut" in result) return { kind: "transient", error: "provider timed out" };
      if ("networkError" in result) return { kind: "transient", error: result.networkError };

      if (result.status === 202) {
        /* SendGrid returns 202 with an empty body; the id is in a header we did not keep. Recording
           null is more honest than inventing one. */
        return { kind: "sent", messageId: null, response: { status: 202 } };
      }

      return classifyStatus(result.status, describeResponse(result.body), result.body);
    },
  };
}
