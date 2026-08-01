import Link from "next/link";

import { SurfWordmarkLink } from "@/components/brand";
import { Text } from "@/components/ui/typography";
import {
  PUBLIC_FOOTER_SECTIONS,
  PUBLIC_SOCIAL_LINKS,
} from "@/config/public";
import { cn } from "@/utils";

export interface PublicFooterProps {
  readonly className?: string;
}

export function PublicFooter({ className }: PublicFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)]",
        className,
      )}
      role="contentinfo"
    >
      <div className="mx-auto max-w-[var(--container-2xl)] px-4 py-12 lg:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          <div className="lg:col-span-4">
            {/* The typographic wordmark, as in the header. The footer was still rendering the
                legacy raster logo — a small bitmap on a pale background, which on a dark footer read
                as a broken image and disagreed with the mark at the top of the same page. */}
            <SurfWordmarkLink size="footer" />
            <Text variant="body-sm" tone="muted" className="mt-5 max-w-sm leading-[var(--leading-relaxed)]">
              South Africa&apos;s premium automotive technology platform — intelligent search,
              modern dealerships, and a marketplace built for what comes next.
            </Text>

            {/*
              The newsletter form and the app-download button have gone.
              =======================================================
              Both were `disabled`, and both carried the words "Coming soon" underneath — a dead email
              field with a dead red Subscribe button, and a dead button offering an application that
              does not exist. They were the last two "Coming soon" labels on any customer-facing page.

              A premium brand does not advertise what it has not built. The footer of a magazine does
              not contain a form nobody can submit; it contains where to go next, which is what the
              link columns beside this already are. When there is a newsletter, it earns a place back.
            */}
          </div>

          {/* Two columns, sitting right. The grid was `lg:grid-cols-5` for five sections; with two
              honest ones left it would have stranded them against the left edge of a wide column. */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-8 lg:grid-cols-4 lg:gap-6">
            {PUBLIC_FOOTER_SECTIONS.map((section) => (
              <div key={section.id}>
                <Text
                  variant="label"
                  as="h3"
                  className="mb-3 text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-foreground)]"
                >
                  {section.title}
                </Text>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        className="inline-flex py-0.5 text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] motion-nav"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[var(--color-border-subtle)] pt-6 sm:flex-row sm:items-center sm:justify-between lg:mt-12 lg:pt-8">
          <Text variant="body-sm" tone="muted">
            © {new Date().getFullYear()} SURF FOR CARS. All rights reserved.
          </Text>

          {/*
            Social accounts, rendered as links only where there is somewhere to go.
            =====================================================================
            All four `href`s are `#`. As anchors they looked and behaved like navigation: a hover
            underline, a pointer cursor, and a click that scrolls the page to the top — which reads
            as a broken site rather than as an account that does not exist yet. Plain text says the
            brand is on those platforms without promising a destination it cannot honour.

            They become links the moment the config carries a real URL, with no change here.
          */}
          <nav aria-label="Social accounts">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {PUBLIC_SOCIAL_LINKS.map((link) => (
                <li key={link.id}>
                  {link.href === "#" ? (
                    <span className="text-[length:var(--text-body-sm)] text-[var(--color-muted)]">
                      {link.label}
                    </span>
                  ) : (
                    <a
                      href={link.href}
                      className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] motion-nav"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
