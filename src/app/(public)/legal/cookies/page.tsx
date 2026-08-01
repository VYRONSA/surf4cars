import type { Metadata } from "next";

import { LegalList, LegalPage, LegalReview, LegalSection } from "@/features/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "What SURF4CARS stores in your browser, and why.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="3 August 2026"
      intro="What SURF4CARS stores in your browser, what each item is for, and how to remove it."
    >
      <LegalSection heading="What we store">
        <p>
          SURF4CARS uses a small number of cookies and browser storage entries. All of them are
          necessary for the site to work. We do not currently run advertising or third-party tracking
          cookies.
        </p>
        <LegalList
          items={[
            "A session cookie that keeps you signed in as you move between pages.",
            "A cookie recording which kind of account you signed in with, so the right portal loads.",
            "Browser storage holding your saved-vehicle context while you are signed in.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="What we do not store">
        <p>
          We do not place advertising cookies, cross-site tracking pixels, or social media trackers.
          Browsing the marketplace signed out leaves no marketing identifier behind.
        </p>
        <LegalReview>
          This section must be revisited the moment analytics or advertising is added. If it becomes
          untrue it is worse than having no policy — see the platform&rsquo;s own standard on
          convincing but wrong statements.
        </LegalReview>
      </LegalSection>

      <LegalSection heading="Managing cookies">
        <p>
          Every major browser lets you view and delete cookies for a site, and block them entirely.
          Blocking our session cookies will prevent you signing in, but browsing and enquiring will
          continue to work.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
