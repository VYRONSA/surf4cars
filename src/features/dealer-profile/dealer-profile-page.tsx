import Image from "next/image";
import Link from "next/link";

import { describeVerificationForOperations, isVerifiedDealer, type DealerVerificationStatus } from "@/domain/vehicle";
import { Icon } from "@/components/ui/icons";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ExternalLink,
} from "@/components/ui/icons/registry";
import { ProvenanceNote } from "@/components/ui/shared";
import { MediaAttribution } from "@/components/ui/media";
import { PREMIUM_IMAGES } from "@/config/images/premium-images";
import { HomeEditorialVehicleCard } from "@/features/marketplace/homepage/components/home-editorial-vehicle-card";
import { VehicleUnavailable } from "@/features/vehicle/components/vehicle-unavailable";
import type { DealerPublicProfile } from "@/features/dealer-profile/server/dealer-profile";

/**
 * The public dealer profile.
 *
 * A dealership microsite rather than a directory entry — and the last page a buyer reads before making
 * contact, which is why every claim on it is labelled with where it came from. "8 vehicles in stock" is
 * counted from live records; "Verified dealer" is something SURF4CARS checked at onboarding. Marking the
 * difference is the platform's actual differentiator: most automotive sites present every claim in one
 * confident voice, which teaches people to discount all of it.
 *
 * FOUR SECTIONS ARE MISSING ON PURPOSE
 * ====================================
 * Story, services, opening hours and years trading are all asked for, and none of them exists anywhere in
 * the dealerships table. Every one would have to be invented to fill. Inventing opening hours is the
 * clearest case: a buyer who drives to a closed forecourt on our word does not blame the record.
 *
 * So they render as "the dealer has not provided this yet", with the field named so the dealer knows what
 * to supply. The page is already shaped to receive them the moment the portal can write them — which is
 * the Phase 4 foundation, built by making the absence explicit rather than by building a portal.
 *
 * Photography comes from the premium media library's dealer slot, so approving a candidate on the creative
 * review board re-dresses every dealership at once, with no code change.
 */

export interface DealerProfilePageProps {
  readonly dealer: DealerPublicProfile;
}

function Stat({
  value,
  label,
  provenance,
}: {
  readonly value: string;
  readonly label: string;
  readonly provenance: React.ComponentProps<typeof ProvenanceNote>["kind"];
}) {
  return (
    <div>
      <p className="text-[length:var(--text-h3)] font-semibold tabular-nums tracking-[-0.02em] text-[var(--color-foreground)]">
        {value}
      </p>
      <p className="mt-1 text-[length:var(--text-caption)] uppercase tracking-[0.16em] text-[var(--color-muted)]">
        {label}
      </p>
      <ProvenanceNote kind={provenance} className="mt-2" />
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  readonly icon: typeof Phone;
  readonly label: string;
  readonly value: string | null;
  readonly href?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-[var(--color-border-subtle)] py-3.5 first:border-t-0 first:pt-0">
      <Icon icon={icon} aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--color-muted)]" />
      <div className="min-w-0 flex-1">
        <p className="text-[length:var(--text-caption)] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          {label}
        </p>
        {value ? (
          href ? (
            <a
              href={href}
              className="mt-0.5 block truncate text-[length:var(--text-body-sm)] text-[var(--color-foreground)] underline decoration-[var(--color-border-strong)] underline-offset-2 hover:decoration-[var(--color-primary)]"
            >
              {value}
            </a>
          ) : (
            <p className="mt-0.5 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]">{value}</p>
          )
        ) : (
          <p className="mt-0.5 text-[length:var(--text-body-sm)] italic text-[var(--color-muted)]">
            Not provided
          </p>
        )}
      </div>
    </div>
  );
}

export function DealerProfilePage({ dealer }: DealerProfilePageProps) {
  const { contact } = dealer;
  const location = [contact.city, contact.province].filter(Boolean).join(", ");

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div className="relative aspect-[21/9] max-h-[30rem] w-full">
          <Image
            src={PREMIUM_IMAGES.dealers.profile}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,8,8,0.96)_0%,rgba(8,8,8,0.62)_38%,rgba(8,8,8,0.18)_78%)]"
          />
          <MediaAttribution mediaId="dealer-cover" />
        </div>

        <div className="relative mx-auto -mt-28 w-full max-w-[var(--container-2xl)] px-6 pb-10 sm:px-8 lg:-mt-32 lg:px-10">
          <div className="flex flex-wrap items-end gap-6">
            <span
              aria-hidden
              className="flex size-20 shrink-0 items-center justify-center rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[length:var(--text-h3)] font-semibold text-[var(--color-foreground)] lg:size-24"
            >
              {dealer.initials}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                {/*
                  Demonstration data, declared before anything else.

                  Placed ahead of the verified badge deliberately: a visitor needs to know what kind of
                  record they are reading before they read any claim it makes. Contact details on these rows
                  are platform-owned and reach nobody, but a demonstration dealership that looks like a real
                  one misleads exactly as effectively as a fabricated one.
                */}
                {dealer.isDemonstration && (
                  <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-warning-muted)] px-3 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-warning)]">
                    Demonstration listing
                  </span>
                )}
                {/* Only a real `verified` status earns this. It previously rendered whenever the
                    dealership had finished onboarding, which is all of them. */}
                {isVerifiedDealer(dealer.verificationStatus) && (
                  <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--color-success-muted)] px-3 py-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.14em] text-[var(--color-success)]">
                    <Icon icon={BadgeCheck} aria-hidden className="size-3.5" />
                    Verified dealer
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                    <Icon icon={MapPin} aria-hidden className="size-4" />
                    {location}
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-[length:var(--text-h1)] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--color-foreground)]">
                {dealer.name}
              </h1>
              {dealer.legalName && (
                <p className="mt-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted)]">
                  Trading as part of {dealer.legalName}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {contact.telephone && (
                <a
                  href={`tel:${contact.telephone.replace(/\s/g, "")}`}
                  className="motion-button inline-flex h-11 items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-5 text-[length:var(--text-button)] font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
                >
                  <Icon icon={Phone} aria-hidden className="size-4" />
                  Call dealer
                </a>
              )}
              <Link
                href={`/search?dealer=${encodeURIComponent(dealer.name)}`}
                className="motion-button inline-flex h-11 items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-interactive)] px-5 text-[length:var(--text-button)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-primary)]"
              >
                View all stock
                <Icon icon={ArrowRight} aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[var(--container-2xl)] space-y-16 px-6 pb-24 sm:px-8 lg:px-10 lg:space-y-20">
        {/* ── Trust ──────────────────────────────────────────────────────────────────────────── */}
        <section aria-labelledby="dealer-trust-heading">
          <h2 id="dealer-trust-heading" className="sr-only">
            About this dealership
          </h2>
          <div className="grid gap-8 border-y border-[var(--color-border)] py-8 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              value={dealer.vehiclesInStock.toLocaleString("en-ZA").replace(/,/g, " ")}
              label="Vehicles in stock"
              provenance="platform"
            />
            {/*
              "Unverified" was the false branch here, and it is as much of a claim as "Verified".
              It reads as a judgement SURF4CARS has made about a business, when the truth is that
              nobody has looked yet. The state is named plainly instead — this is the one customer
              surface where a buyer is specifically assessing the dealership, so silence would be
              withholding rather than restraint.
            */}
            <Stat
              value={describeVerificationForCustomerProfile(dealer.verificationStatus)}
              label="SURF4CARS verification"
              provenance={isVerifiedDealer(dealer.verificationStatus) ? "verified" : "platform"}
            />
            <Stat value={dealer.listedSince ?? "—"} label="On SURF4CARS since" provenance="platform" />
            <Stat
              value={dealer.businessType ? dealer.businessType.replace(/^\w/, (c) => c.toUpperCase()) : "—"}
              label="Business type"
              provenance="dealer"
            />
          </div>
        </section>

        {/* ── Story ──────────────────────────────────────────────────────────────────────────── */}
        <section aria-labelledby="dealer-story-heading">
          <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
            About
          </p>
          <h2
            id="dealer-story-heading"
            className="mt-3 text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]"
          >
            Who they are
          </h2>

          <div className="mt-6 max-w-3xl">
            {dealer.story ? (
              <p className="text-[length:var(--text-body-lg)] leading-relaxed text-[var(--color-muted-foreground)]">
                {dealer.story}
              </p>
            ) : (
              <VehicleUnavailable
                title={`${dealer.name} has not written a profile yet`}
                detail="Dealerships write their own introduction — what they specialise in, how long they have been trading, and why buyers choose them. SURF4CARS does not write it on their behalf, so this space stays empty until they do."
              />
            )}
          </div>
        </section>

        {/* ── Services ───────────────────────────────────────────────────────────────────────── */}
        <section aria-labelledby="dealer-services-heading">
          <h2
            id="dealer-services-heading"
            className="text-[length:var(--text-h3)] font-semibold tracking-[-0.015em] text-[var(--color-foreground)]"
          >
            Services
          </h2>
          <div className="mt-6">
            {dealer.services && dealer.services.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {dealer.services.map((service) => (
                  <li
                    key={service}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]"
                  >
                    {service}
                  </li>
                ))}
              </ul>
            ) : (
              <VehicleUnavailable
                title="Services have not been listed"
                detail="Finance, trade-ins, warranty, servicing and delivery vary by dealership, and this one has not confirmed which it offers. Rather than assume, we suggest asking directly — most dealers offer more than they think to list."
                action={
                  contact.telephone ? (
                    <a
                      href={`tel:${contact.telephone.replace(/\s/g, "")}`}
                      className="motion-button group inline-flex items-center gap-2 border-b border-[var(--color-primary)] pb-0.5 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-foreground)]"
                    >
                      Ask {dealer.name}
                      <Icon
                        icon={ArrowRight}
                        aria-hidden
                        className="size-4 transition-transform motion-hover group-hover:translate-x-0.5"
                      />
                    </a>
                  ) : undefined
                }
              />
            )}
          </div>
        </section>

        {/* ── Inventory ──────────────────────────────────────────────────────────────────────── */}
        {dealer.featured.length > 0 && (
          <section aria-labelledby="dealer-inventory-heading">
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
              <div>
                <p className="text-[length:var(--text-overline)] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Their floor
                </p>
                <h2
                  id="dealer-inventory-heading"
                  className="mt-3 text-[length:var(--text-h2)] font-semibold tracking-[-0.02em] text-[var(--color-foreground)]"
                >
                  Currently available
                </h2>
              </div>
              <ProvenanceNote kind="platform" label="Live stock, counted now" />
            </div>

            {/*
              One card, for the whole floor.
              =============================
              `featured` rendered as editorial cards and `inventory` as results cards, in two grids
              stacked with no heading between them — so a dealership with eight vehicles showed six in
              one visual language and two in another, and the two looked like a different kind of
              listing rather than the rest of the same list. Sunward Cars' floor was the proof: six
              clean cards, then two carrying finance estimates, fuel, transmission and a location.

              The split exists because `featured` is curated and `inventory` is the remainder. That is
              a real distinction in the data and no distinction at all to a visitor looking at one
              dealership's stock, so it stops being drawn.

              The lead card is still only used when there is enough stock to fill the row it creates.
              A lead spans two of three columns, so a dealership with one vehicle would otherwise
              render a single wide card beside a third of empty grid.
            */}
            <div className="mt-8 grid grid-cols-1 items-start gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {[...dealer.featured, ...dealer.inventory].map((listing, index) => (
                <HomeEditorialVehicleCard
                  key={listing.id}
                  listing={listing}
                  emphasis={index === 0 && dealer.featured.length >= 5 ? "lead" : "standard"}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Contact ────────────────────────────────────────────────────────────────────────── */}
        <section aria-labelledby="dealer-contact-heading" className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2
              id="dealer-contact-heading"
              className="text-[length:var(--text-h3)] font-semibold tracking-[-0.015em] text-[var(--color-foreground)]"
            >
              Contact
            </h2>
            <div className="mt-6">
              <ContactRow
                icon={Phone}
                label="Telephone"
                value={contact.telephone}
                href={contact.telephone ? `tel:${contact.telephone.replace(/\s/g, "")}` : undefined}
              />
              <ContactRow
                icon={MessageCircle}
                label="WhatsApp"
                value={contact.whatsapp}
                href={contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : undefined}
              />
              <ContactRow
                icon={Mail}
                label="Email"
                value={contact.email}
                href={contact.email ? `mailto:${contact.email}` : undefined}
              />
              <ContactRow
                icon={ExternalLink}
                label="Website"
                value={contact.website}
                href={contact.website ?? undefined}
              />
              <ContactRow
                icon={MapPin}
                label="Address"
                value={
                  [...contact.addressLines, location].filter(Boolean).join(", ") || null
                }
              />
            </div>
            <ProvenanceNote kind="dealer" className="mt-5" />
          </div>

          <div>
            <h2 className="text-[length:var(--text-h3)] font-semibold tracking-[-0.015em] text-[var(--color-foreground)]">
              Opening hours
            </h2>
            <div className="mt-6">
              {dealer.openingHours && dealer.openingHours.length > 0 ? (
                <dl className="text-[length:var(--text-body-sm)]">
                  {dealer.openingHours.map((entry) => (
                    <div
                      key={entry.day}
                      className="flex justify-between border-t border-[var(--color-border-subtle)] py-3 first:border-t-0 first:pt-0"
                    >
                      <dt className="text-[var(--color-muted-foreground)]">{entry.day}</dt>
                      <dd className="text-[var(--color-foreground)]">{entry.hours}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <VehicleUnavailable
                  title="Opening hours have not been confirmed"
                  detail="We would rather leave this blank than guess. Publishing hours a dealership has not given us is how a buyer ends up outside a closed forecourt on a Saturday morning."
                  action={
                    contact.telephone ? (
                      <span className="inline-flex items-center gap-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                        <Icon icon={Clock} aria-hidden className="size-4" />
                        Call ahead on {contact.telephone}
                      </span>
                    ) : undefined
                  }
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}


/**
 * The verification state, worded for a buyer rather than for an operator.
 *
 * Operations reads "Not assessed"; a buyer reads the same fact with the subject made explicit, so
 * the sentence is about what SURF4CARS has done rather than about the dealership's standing.
 */
function describeVerificationForCustomerProfile(status: DealerVerificationStatus): string {
  return status === "unknown" ? "Not yet assessed" : describeVerificationForOperations(status);
}
