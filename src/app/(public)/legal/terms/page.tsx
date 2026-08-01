import type { Metadata } from "next";

import { LegalList, LegalPage, LegalReview, LegalSection } from "@/features/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms on which SURF4CARS provides its automotive marketplace.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="3 August 2026"
      intro="These terms govern your use of the SURF4CARS marketplace. They set out what we do, what we do not do, and what you can rely on."
    >
      <LegalReview>
        Drafted against what the platform actually does. Not reviewed by a South African attorney.
        Company details, governing jurisdiction and the dealership agreement terms must be settled
        before publication.
      </LegalReview>

      <LegalSection heading="What SURF4CARS is">
        <p>
          SURF4CARS is a marketplace. We publish vehicle listings supplied by licensed motor
          dealerships and give buyers a way to find and enquire about them.
        </p>
        <p>
          <strong className="text-[var(--color-foreground)]">
            We are not the seller of any vehicle listed.
          </strong>{" "}
          Every sale is a contract between you and the dealership. We are not a party to it, we do
          not take payment for vehicles, and we do not hold stock.
        </p>
      </LegalSection>

      <LegalSection heading="What dealerships are responsible for">
        <p>
          The dealership that lists a vehicle is responsible for the accuracy of everything about it —
          price, mileage, specification, condition, service history and photography. They are also
          responsible for the vehicle&rsquo;s roadworthiness and their own compliance with the Consumer
          Protection Act and the National Credit Act.
        </p>
      </LegalSection>

      <LegalSection heading="What we are responsible for">
        <p>We take responsibility for the platform itself. Specifically, we:</p>
        <LegalList
          items={[
            "Verify that a dealership is a real, registered business before publishing its listings.",
            "Label any photograph that is illustrative rather than of the actual vehicle.",
            "Mark demonstration records clearly so they cannot be mistaken for live stock.",
            "Show you where a piece of information came from — the dealership, our checks, or a calculation.",
            "Deliver your enquiry to the dealership, and tell you honestly if we could not.",
          ]}
        />
        <p>
          We do not guarantee that a vehicle is available, that a price is current, or that a
          dealership will respond. Stock moves faster than any listing.
        </p>
      </LegalSection>

      <LegalSection heading="Estimates are not quotes">
        <p>
          Finance figures shown on the platform are calculated from inputs you provide and an assumed
          interest rate. They are illustrations, not offers of credit, and no bank has quoted them.
          Market comparisons are computed from vehicles listed on SURF4CARS at the time of viewing and
          are not a valuation.
        </p>
      </LegalSection>

      <LegalSection heading="Using the marketplace">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "Submit false contact details or enquiries you do not intend to follow up.",
            "Extract listings or photography in bulk, by any automated means.",
            "Attempt to gain access to areas of the platform not open to you.",
            "Use the platform to advertise, solicit or harass.",
          ]}
        />
        <p>We may suspend access where these terms are broken.</p>
      </LegalSection>

      <LegalSection heading="Accounts">
        <p>
          You are responsible for keeping your account credentials secure and for activity under your
          account. Tell us promptly if you believe your account has been used without your permission.
        </p>
      </LegalSection>

      <LegalSection heading="Content and photography">
        <p>
          Listing photography is supplied by dealerships or licensed by SURF4CARS. Where a photograph
          represents a make and model rather than the specific vehicle for sale, it is labelled
          &ldquo;Illustrative image&rdquo; in the frame. The SURF4CARS name, wordmark and site design
          remain ours.
        </p>
      </LegalSection>

      <LegalSection heading="Liability">
        <p>
          We provide the marketplace as it is. To the extent the law allows, we are not liable for
          loss arising from a transaction between you and a dealership, from the condition of a
          vehicle, or from a listing being inaccurate or out of date.
        </p>
        <p>Nothing here limits liability that cannot lawfully be limited.</p>
        <LegalReview>
          The limitation of liability must be reviewed against the Consumer Protection Act, which
          restricts what a supplier may exclude in South Africa.
        </LegalReview>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>These terms are governed by the law of the Republic of South Africa.</p>
        <LegalReview>Confirm the courts having jurisdiction, and the registered entity bound by these terms.</LegalReview>
      </LegalSection>
    </LegalPage>
  );
}
