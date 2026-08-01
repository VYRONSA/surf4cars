import { classifyStatus, describeResponse, postJson } from "./http";
import type { EmailMessage, EmailProvider, SendOutcome } from "./types";

/** https://resend.com/docs/api-reference/emails/send-email */
export function createResendProvider(config: {
  readonly apiKey: string;
  readonly from: string;
}): EmailProvider {
  return {
    kind: "provider",
    name: "resend",
    async send(message: EmailMessage): Promise<SendOutcome> {
      const result = await postJson(
        "https://api.resend.com/emails",
        { Authorization: `Bearer ${config.apiKey}` },
        {
          from: config.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: [message.replyTo] } : {}),
        },
      );

      if ("timedOut" in result) return { kind: "transient", error: "provider timed out" };
      if ("networkError" in result) return { kind: "transient", error: result.networkError };

      if (result.status >= 200 && result.status < 300) {
        const id = (result.body as { id?: string } | null)?.id ?? null;
        return { kind: "sent", messageId: id, response: result.body };
      }

      return classifyStatus(result.status, describeResponse(result.body), result.body);
    },
  };
}
