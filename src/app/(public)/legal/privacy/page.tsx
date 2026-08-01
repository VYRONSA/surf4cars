import type { Metadata } from "next";

import { LegalList, LegalPage, LegalReview, LegalSection } from "@/features/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SURF4CARS collects, uses and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="3 August 2026"
      intro="This policy explains what personal information SURF4CARS collects, why we collect it, who we share it with, and the choices you have. It is written to be read."
    >
      <LegalReview>
        This policy has been drafted to reflect what the platform actually does, verified against the
        code. It has not been reviewed by a South African attorney, and the registered company name,
        registration number, physical address and Information Officer must be inserted before
        publication. POPIA requires a named Information Officer registered with the Information
        Regulator.
      </LegalReview>

      <LegalSection heading="Who we are">
        <p>
          SURF4CARS operates an online automotive marketplace in South Africa. We connect buyers with
          licensed motor dealerships. We do not sell vehicles ourselves and we are not party to any
          sale agreed between a buyer and a dealership.
        </p>
        <LegalReview>
          Insert the registered company name, registration number, registered address, and the name
          and contact details of the Information Officer.
        </LegalReview>
      </LegalSection>

      <LegalSection heading="What we collect">
        <p>When you send an enquiry about a vehicle, we collect:</p>
        <LegalList
          items={[
            "Your name, email address and telephone number.",
            "The message you write, and the vehicle and dealership it concerns.",
            "The date and time of the enquiry, and the page you sent it from.",
          ]}
        />
        <p>If you create an account, we also hold your email address and password credentials.</p>
        <p>
          We collect standard technical information that any website receives — your browser type and
          approximate location derived from your IP address — for security and to keep the service
          running.
        </p>
      </LegalSection>

      <LegalSection heading="Why we collect it">
        <p>
          Your enquiry exists to be answered. We pass it to the dealership responsible for the vehicle
          so that they can contact you. That is the purpose of the marketplace, and it is the primary
          reason we hold your information.
        </p>
        <p>
          We also use enquiry data in aggregate to understand which parts of the marketplace are
          useful, and to detect abuse.
        </p>
      </LegalSection>

      <LegalSection heading="Who we share it with">
        <p>
          <strong className="text-[var(--color-foreground)]">The dealership you enquired with.</strong>{" "}
          Your name, contact details and message are shared with that dealership so they can respond.
          They become responsible for how they use your information from that point, under their own
          privacy obligations.
        </p>
        <p>
          <strong className="text-[var(--color-foreground)]">Our service providers.</strong> We use
          Supabase for database and authentication hosting. Their servers are located outside South
          Africa, which means your information is transferred across borders.
        </p>
        <p>
          <strong className="text-[var(--color-foreground)]">Nobody else.</strong> We do not sell your
          personal information, and we do not pass it to third-party marketers.
        </p>
        <LegalReview>
          Confirm the hosting region and whether a cross-border transfer agreement is in place, as
          POPIA section 72 requires. Confirm the deployment host once chosen.
        </LegalReview>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Enquiries are retained so that a dealership can refer to them and so that we can resolve
          disputes about whether an enquiry was received.
        </p>
        <LegalReview>
          A specific retention period must be set — commonly two to five years for commercial
          enquiries. This should be a founder decision, then stated here as a number.
        </LegalReview>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>Under the Protection of Personal Information Act you may:</p>
        <LegalList
          items={[
            "Ask what personal information we hold about you.",
            "Ask us to correct information that is wrong or incomplete.",
            "Ask us to delete information we no longer have grounds to keep.",
            "Object to how we are using your information.",
            "Complain to the Information Regulator of South Africa.",
          ]}
        />
        <p>
          To exercise any of these, contact us using the details on our contact page. We will respond
          within a reasonable period and will not charge you for a first request.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Access to personal information is restricted to the systems and staff that need it.
          Connections to the site are encrypted in transit. Administrative areas of the platform
          require authentication and are not reachable by the public.
        </p>
        <p>
          No system is perfectly secure. If a breach occurs that is likely to affect you, we will
          notify you and the Information Regulator as POPIA requires.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If this policy changes materially we will update the date at the top of this page. Continued
          use of the marketplace after a change means you accept the revised policy.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
