import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalReview, LegalSection } from "@/features/legal/legal-page";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach SURF4CARS.",
};

/**
 * Contact.
 *
 * Deliberately without a contact form. A form that posts nowhere is the failure this platform has
 * spent six programmes removing, and there is no inbox behind one yet. Until there is, the honest
 * page is the one that routes people to the channels that do work — the dealership for anything
 * about a vehicle, which is most of it.
 *
 * Every address below is marked for founder review rather than invented. Deriving a plausible
 * address from a business name is the specific mistake recorded in AGENTS.md, where three generated
 * domains resolved to live third-party businesses.
 */
export default function ContactPage() {
  return (
    <LegalPage
      title="Contact"
      updated="3 August 2026"
      intro="Most questions are about a specific vehicle, and the dealership selling it will answer those fastest. For everything else, here is how to reach us."
    >
      <LegalSection heading="About a vehicle">
        <p>
          Send an enquiry from the vehicle&rsquo;s page and it goes directly to the dealership that
          holds it. You will get a reference on screen — quote it if you call them before they call
          you.
        </p>
        <p>
          <Link
            href="/search"
            className="motion-nav underline underline-offset-4 hover:text-[var(--color-foreground)]"
          >
            Browse the marketplace
          </Link>
        </p>
      </LegalSection>

      <LegalSection heading="Listing your stock">
        <p>
          Dealerships can register directly. The process takes about ten minutes and asks for company
          registration details and one branch address.
        </p>
        <p>
          <Link
            href="/auth/sign-up/dealer"
            className="motion-nav underline underline-offset-4 hover:text-[var(--color-foreground)]"
          >
            Register a dealership
          </Link>
        </p>
      </LegalSection>

      <LegalSection heading="Privacy and data requests">
        <p>
          To ask what information we hold about you, to have it corrected, or to have it deleted,
          write to our Information Officer.
        </p>
        <LegalReview>
          Insert the Information Officer&rsquo;s name and email address. POPIA requires this person to
          be designated and registered with the Information Regulator before personal information is
          processed.
        </LegalReview>
      </LegalSection>

      <LegalSection heading="Company details">
        <LegalReview>
          Insert the registered company name, company registration number, VAT number if registered,
          registered physical address, and a general telephone number and email address. South African
          consumer protection law requires a supplier to publish these.
        </LegalReview>
        <p>
          There is deliberately no contact form on this page. One would post to an inbox that does not
          exist yet, and a form that silently discards a message is worse than no form at all.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
