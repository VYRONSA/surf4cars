"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form";
import { submitVehicleEnquiry } from "@/features/vehicle/services/vehicle-enquiry.api";
import { cn } from "@/utils";

export function VehicleEnquiryPanel(props: {
  readonly vehicleId: string;
  readonly dealershipId: string;
  readonly dealerPhone: string;
  readonly dealerWhatsapp: string;
  readonly idPrefix?: string;
}) {
  const idPrefix = props.idPrefix ?? "buyer";
  const nameId = `${idPrefix}-name`;
  const phoneId = `${idPrefix}-phone`;
  const emailId = `${idPrefix}-email`;
  const messageId = `${idPrefix}-message`;

  const [mode, setMode] = useState<"contact" | "test-drive" | "finance">("contact");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("I’m interested in this vehicle.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function submit() {
    setError(null);
    setStatus(null);

    const formElement = formRef.current;
    const formData = formElement ? new FormData(formElement) : null;
    const namedNameControl = formElement?.elements.namedItem(nameId);
    const namedPhoneControl = formElement?.elements.namedItem(phoneId);
    const namedEmailControl = formElement?.elements.namedItem(emailId);
    const namedMessageControl = formElement?.elements.namedItem(messageId);

    const domNameValue =
      formElement?.querySelector<HTMLInputElement>(`#${nameId}`)?.value ??
      (namedNameControl instanceof HTMLInputElement || namedNameControl instanceof HTMLTextAreaElement
        ? namedNameControl.value
        : "");
    const domPhoneValue =
      formElement?.querySelector<HTMLInputElement>(`#${phoneId}`)?.value ??
      (namedPhoneControl instanceof HTMLInputElement || namedPhoneControl instanceof HTMLTextAreaElement
        ? namedPhoneControl.value
        : "");
    const domEmailValue =
      formElement?.querySelector<HTMLInputElement>(`#${emailId}`)?.value ??
      (namedEmailControl instanceof HTMLInputElement || namedEmailControl instanceof HTMLTextAreaElement
        ? namedEmailControl.value
        : "");
    const domMessageValue =
      formElement?.querySelector<HTMLTextAreaElement>(`#${messageId}`)?.value ??
      (namedMessageControl instanceof HTMLInputElement || namedMessageControl instanceof HTMLTextAreaElement
        ? namedMessageControl.value
        : "");

    const resolvedBuyerName = (
      buyerName ||
      String(formData?.get(nameId) ?? "") ||
      String(domNameValue)
    ).trim();
    const resolvedBuyerPhone = (
      buyerPhone ||
      String(formData?.get(phoneId) ?? "") ||
      String(domPhoneValue)
    ).trim();
    const resolvedBuyerEmail = (
      buyerEmail ||
      String(formData?.get(emailId) ?? "") ||
      String(domEmailValue)
    ).trim();
    const resolvedMessage = (
      message ||
      String(formData?.get(messageId) ?? "") ||
      String(domMessageValue)
    ).trim();

    if (!resolvedBuyerName || !resolvedBuyerPhone || !resolvedBuyerEmail) {
      setError("Please complete your name, phone, and email before sending an enquiry.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitVehicleEnquiry({
        vehicleId: props.vehicleId,
        dealershipId: props.dealershipId,
        buyerName: resolvedBuyerName,
        buyerEmail: resolvedBuyerEmail,
        buyerPhone: resolvedBuyerPhone,
        message: resolvedMessage || "I’m interested in this vehicle.",
        enquiryType: mode,
      });
      setStatus("Enquiry sent to the dealer.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit enquiry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="max-w-2xl space-y-5 rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/40 p-6 lg:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {/*
        The enquiry type is a choice between three, so it is drawn as a choice between three — a
        segmented control — rather than as one filled red button beside two outlined ones. At button
        weight the selected mode looked like the form's primary action, which sits at the bottom, and
        a buyer who pressed "Contact Dealer" expecting to send something got a state change.
      */}
      <div
        role="radiogroup"
        aria-label="What would you like to ask about?"
        className="inline-flex flex-wrap gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] p-1"
      >
        {(
          [
            { id: "contact", label: "General enquiry" },
            { id: "test-drive", label: "Test drive" },
            { id: "finance", label: "Finance" },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={mode === option.id}
            onClick={() => setMode(option.id)}
            className={cn(
              "motion-button rounded-[var(--radius-pill)] px-4 py-2 text-[length:var(--text-body-sm)] font-medium",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
              mode === option.id
                ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Your Name" htmlFor={nameId}>
          <Input id={nameId} name={nameId} value={buyerName} onChange={(event) => setBuyerName(event.target.value)} />
        </FormField>
        <FormField label="Phone" htmlFor={phoneId}>
          <Input id={phoneId} name={phoneId} value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} />
        </FormField>
      </div>

      <FormField label="Email" htmlFor={emailId}>
        <Input id={emailId} name={emailId} type="email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} />
      </FormField>

      <FormField label="Message" htmlFor={messageId}>
        <Textarea id={messageId} name={messageId} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} />
      </FormField>

      {/* Send first, then the alternatives — the reverse of the old order, which put two secondary
          links in front of the button the form exists to reach. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[11rem]">
          {isSubmitting ? "Sending…" : "Send enquiry"}
        </Button>
        <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          or{" "}
          <a href={`tel:${props.dealerPhone}`} className="motion-nav underline underline-offset-4 hover:text-[var(--color-foreground)]">
            call them
          </a>{" "}
          ·{" "}
          <a
            href={`https://wa.me/${props.dealerWhatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="motion-nav underline underline-offset-4 hover:text-[var(--color-foreground)]"
          >
            WhatsApp
          </a>
        </p>
      </div>

      {status && <p className="text-[length:var(--text-body-sm)] text-[var(--color-success)]">{status}</p>}
      {error && <p className="text-[length:var(--text-body-sm)] text-[var(--color-danger)]">{error}</p>}
    </form>
  );
}
