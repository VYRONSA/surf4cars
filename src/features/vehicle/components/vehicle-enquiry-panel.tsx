"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/form";
import {
  EnquirySubmissionError,
  submitVehicleEnquiry,
} from "@/features/vehicle/services/vehicle-enquiry.api";
import { cn } from "@/utils";

export function VehicleEnquiryPanel(props: {
  readonly vehicleId: string;
  readonly dealershipId: string;
  /* Null when the dealership has no number on record — which today is all of them. Every consumer
     has to decide what to show instead, rather than being handed "+27" and rendering a dead link. */
  readonly dealerPhone: string | null;
  readonly dealerWhatsapp: string | null;
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
  /* The reference, not a boolean. A confirmation that cannot be quoted back to the dealership is
     just a colour change. */
  const [sent, setSent] = useState<{
    reference: string;
    duplicate: boolean;
    dealerNotified: boolean;
  } | null>(null);
  const [error, setError] = useState<{ message: string; retryable: boolean } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function submit() {
    setError(null);

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
      setError({
        message: "Please complete your name, phone and email before sending.",
        retryable: false,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitVehicleEnquiry({
        vehicleId: props.vehicleId,
        dealershipId: props.dealershipId,
        buyerName: resolvedBuyerName,
        buyerEmail: resolvedBuyerEmail,
        buyerPhone: resolvedBuyerPhone,
        message: resolvedMessage || "I’m interested in this vehicle.",
        enquiryType: mode,
      });
      /* Only reached when the server has committed the row — `persistEnquiry` throws otherwise, so
         there is no path where a buyer is told this and nothing was recorded. */
      setSent(result);
    } catch (err) {
      setError(
        err instanceof EnquirySubmissionError
          ? { message: err.message, retryable: err.retryable }
          : { message: "We could not send your enquiry.", retryable: true },
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
    Once it is in, the form goes.
    ============================
    A confirmation line under a still-editable form invites a second submission and leaves the buyer
    unsure whether the first one counted. Replacing the form with the reference is unambiguous, and
    the reference is the thing they will be asked for when they ring.
  */
  if (sent) {
    return (
      <div className="max-w-2xl rounded-[var(--radius-2xl)] border border-[var(--color-success)]/30 bg-[var(--color-success-muted)] p-6 lg:p-8">
        <p className="text-[length:var(--text-h5)] font-semibold text-[var(--color-foreground)]">
          {sent.duplicate ? "You have already sent this one." : "Your enquiry is in."}
        </p>
        {/*
          Two messages, and which one shows is decided by the server, not by this component.
          ===============================================================================
          The enquiry is recorded either way — nothing reaches this branch otherwise — but "the
          dealership has been emailed" is a separate claim from "the enquiry is saved", and it is
          only true when a provider accepted the message.

          The second wording is the one that costs something to write and is worth every word of it.
          A buyer told the dealer was notified stops chasing and waits. If nobody was actually told,
          that buyer waits for a call that will never come, and the platform has not merely failed
          quietly — it has talked them out of the thing that would have worked. Saying "we are still
          trying" keeps them holding the option to ring, which is why the telephone link below is
          not optional decoration in this state.
        */}
        <p className="mt-2 text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
          {sent.dealerNotified
            ? "The dealership has been sent your details and will be in touch. Quote this reference if you call them first."
            : props.dealerPhone
              ? "Your enquiry has been received and the dealership can see it in their dashboard. We are still working on getting a notification through to them, so it is worth calling if you would like an answer today."
              : "Your enquiry has been received and the dealership can see it in their dashboard. We are still working on getting a notification through to them."}
        </p>
        <p className="mt-5 font-mono text-[length:var(--text-h4)] font-semibold tracking-[0.08em] text-[var(--color-foreground)]">
          {sent.reference}
        </p>
        {props.dealerPhone && (
          <p className="mt-5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Prefer to speak now?{" "}
            <a href={`tel:${props.dealerPhone}`} className="motion-nav underline underline-offset-4 hover:text-[var(--color-foreground)]">
              Call the dealership
            </a>
            .
          </p>
        )}
      </div>
    );
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
        {/* Alternatives, only where they exist. This line used to offer "call them · WhatsApp"
            unconditionally, pointing at tel:+27 and wa.me/27 — the fallback every dealership hit. */}
        {(props.dealerPhone || props.dealerWhatsapp) && (
          <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            or{" "}
            {props.dealerPhone && (
              <a href={`tel:${props.dealerPhone}`} className="motion-nav underline underline-offset-4 hover:text-[var(--color-foreground)]">
                call them
              </a>
            )}
            {props.dealerPhone && props.dealerWhatsapp ? " · " : ""}
            {props.dealerWhatsapp && (
              <a
                href={`https://wa.me/${props.dealerWhatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="motion-nav underline underline-offset-4 hover:text-[var(--color-foreground)]"
              >
                WhatsApp
              </a>
            )}
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3"
        >
          <p className="text-[length:var(--text-body-sm)] text-[var(--color-danger)]">
            {error.message}
          </p>
          {/*
            The buyer's typing is still in the form — nothing is cleared on failure — so "try again"
            means pressing the button, not filling it in a second time. Saying so removes the doubt
            that makes people abandon.
          */}
          {error.retryable && (
            <p className="mt-1 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
              Your details are still here. Press Send enquiry to try again
              {props.dealerPhone ? ", or call the dealership on the number above" : ""}.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
