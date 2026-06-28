import Link from "next/link";

import { SurfLogoLink } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Smartphone } from "@/components/ui/icons/registry";
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
            <SurfLogoLink variant="footer" />
            <Text variant="body-sm" tone="muted" className="mt-5 max-w-sm leading-[var(--leading-relaxed)]">
              South Africa&apos;s premium automotive technology platform — intelligent search,
              modern dealerships, and a marketplace built for what comes next.
            </Text>

            <div className="mt-7 space-y-5">
              <div>
                <Text variant="overline" tone="muted" className="mb-2.5 block">
                  Newsletter
                </Text>
                <div className="flex max-w-sm gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    disabled
                    aria-label="Newsletter email"
                    className="h-11 flex-1"
                  />
                  <Button variant="primary" size="md" disabled className="h-11 shrink-0">
                    Subscribe
                  </Button>
                </div>
                <Text variant="caption" tone="muted" className="mt-2">
                  Coming soon
                </Text>
              </div>

              <div>
                <Text variant="overline" tone="muted" className="mb-2.5 block">
                  App
                </Text>
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  className="h-11"
                  leftIcon={<Icon icon={Smartphone} size="sm" />}
                >
                  Download App
                </Button>
                <Text variant="caption" tone="muted" className="mt-2">
                  Coming soon
                </Text>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5 lg:gap-6">
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

          <nav aria-label="Social links">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {PUBLIC_SOCIAL_LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-label={link.label}
                    className="text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)] motion-nav"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
