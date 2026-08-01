import type { Metadata } from "next";

import {
  Alert,
  Badge,
  BodyMedium,
  BodySmall,
  Button,
  Caption,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  DisplayLarge,
  DisplayMedium,
  FormField,
  GlassSurface,
  Heading1,
  Heading2,
  Heading3,
  Input,
  Label,
  Overline,
  Progress,
  Radio,
  SearchInput,
  Select,
  Skeleton,
  Spinner,
  Textarea,
  Toggle,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Design System V2 — SURF4CARS",
  description:
    "The canonical reference for the SURF4CARS premium automotive component library.",
};

/**
 * Design System V2 showcase.
 *
 * This is the design reference for PCP-002B: every primitive rendered in each variant and state, so
 * a regression is visible rather than inferred. It composes the existing library rather than
 * redefining any component — nothing here is a bespoke style, and no colour is hardcoded.
 */

/** Section wrapper. Keeps the rhythm of the page in one place instead of at each call site. */
function Section({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[var(--color-border)] pt-12">
      <Overline className="text-[var(--color-primary-text)]">{title}</Overline>
      <Heading2 className="mt-2">{title}</Heading2>
      <BodySmall className="mt-2 max-w-2xl text-[var(--color-muted-foreground)]">
        {description}
      </BodySmall>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Labelled specimen. The label is what makes the page a reference rather than a demo. */
function Specimen({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Caption className="text-[var(--color-muted)]">{label}</Caption>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "text",
  "danger",
  "success",
] as const;

const BUTTON_SIZES = ["sm", "md", "lg", "xl"] as const;

const BADGE_VARIANTS = [
  "default",
  "primary",
  "success",
  "warning",
  "danger",
  "info",
  "outline",
] as const;

const ALERT_VARIANTS = ["default", "success", "warning", "danger", "info"] as const;

const CARD_VARIANTS = ["default", "elevated", "floating", "glass", "flat"] as const;

const GLASS_VARIANTS = ["subtle", "default", "strong", "card", "panel"] as const;

/** Every colour token that carries meaning, grouped as the palette is reasoned about. */
const PALETTE: readonly { readonly group: string; readonly tokens: readonly string[] }[] = [
  {
    group: "Brand",
    tokens: [
      "--color-primary",
      "--color-primary-hover",
      "--color-primary-active",
      "--color-primary-glow",
      "--color-accent",
    ],
  },
  {
    group: "Surface",
    tokens: [
      "--color-background",
      "--color-surface",
      "--color-surface-raised",
      "--color-surface-overlay",
      "--color-surface-sunken",
    ],
  },
  {
    group: "Status",
    tokens: [
      "--color-success",
      "--color-warning",
      "--color-danger",
      "--color-info",
      "--color-secondary",
    ],
  },
  {
    group: "Chart",
    tokens: [
      "--color-chart-1",
      "--color-chart-2",
      "--color-chart-3",
      "--color-chart-4",
      "--color-chart-5",
      "--color-chart-6",
    ],
  },
];

const SECTIONS = [
  ["palette", "Palette"],
  ["typography", "Typography"],
  ["buttons", "Buttons"],
  ["cards", "Cards"],
  ["forms", "Forms"],
  ["feedback", "Feedback"],
  ["glass", "Glass"],
  ["motion", "Motion"],
] as const;

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="pb-12">
        <Overline className="text-[var(--color-primary-text)]">SURF4CARS</Overline>
        <DisplayLarge className="mt-3">Design System V2</DisplayLarge>
        <BodyMedium className="mt-4 max-w-2xl text-[var(--color-muted-foreground)]">
          The canonical reference for the premium automotive component library. Every primitive is
          rendered here in each variant and state. If a screen needs something this page does not
          show, the primitive is missing — build it here first, then use it.
        </BodyMedium>
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Sections">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)] motion-hover hover:border-[var(--color-primary)] hover:text-[var(--color-foreground)]"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <div className="flex flex-col gap-16">
        <Section
          id="palette"
          title="Palette"
          description="Permanent dark identity. Red is the only primary action colour; blue is informational and must never carry a primary action. All 28 pairings are verified by scripts/audit-design-contrast.mjs."
        >
          <div className="flex flex-col gap-8">
            {PALETTE.map(({ group, tokens }) => (
              <div key={group} className="flex flex-col gap-3">
                <Caption className="text-[var(--color-muted)]">{group}</Caption>
                <div className="flex flex-wrap gap-3">
                  {tokens.map((token) => (
                    <div key={token} className="w-40">
                      <div
                        className="h-16 rounded-[var(--radius-lg)] border border-[var(--color-border)]"
                        style={{ background: `var(${token})` }}
                      />
                      <Caption className="mt-2 block break-all text-[var(--color-muted)]">
                        {token.replace("--color-", "")}
                      </Caption>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="typography"
          title="Typography"
          description="A single scale drives every screen. Display sizes are for hero moments only; body copy never uses a display weight."
        >
          <div className="flex flex-col gap-6">
            <DisplayLarge>Display Large — Find your next car</DisplayLarge>
            <DisplayMedium>Display Medium — 2 761 vehicles</DisplayMedium>
            <Heading1>Heading 1 — Marketplace</Heading1>
            <Heading2>Heading 2 — Dealer performance</Heading2>
            <Heading3>Heading 3 — Recent enquiries</Heading3>
            <BodyMedium>
              Body Medium — the default reading size for descriptions, specifications and long-form
              content across the marketplace and dealer console.
            </BodyMedium>
            <BodySmall className="text-[var(--color-muted-foreground)]">
              Body Small — secondary detail, helper text and metadata.
            </BodySmall>
            <Caption className="text-[var(--color-muted)]">
              Caption — timestamps, counts and table footnotes.
            </Caption>
            <Overline className="text-[var(--color-primary-text)]">
              Overline — section eyebrow
            </Overline>
          </div>
        </Section>

        <Section
          id="buttons"
          title="Buttons"
          description="Seven variants and four sizes. Primary is red and reserved for the single most important action on a screen."
        >
          <div className="flex flex-col gap-8">
            <Specimen label="Variants">
              {BUTTON_VARIANTS.map((variant) => (
                <Button key={variant} variant={variant}>
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </Button>
              ))}
            </Specimen>
            <Specimen label="Sizes">
              {BUTTON_SIZES.map((size) => (
                <Button key={size} size={size}>
                  Size {size}
                </Button>
              ))}
            </Specimen>
            <Specimen label="States">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
              <Button variant="outline" disabled>
                Disabled outline
              </Button>
            </Specimen>
          </div>
        </Section>

        <Section
          id="cards"
          title="Cards"
          description="Cards carry elevation, not decoration. Elevation communicates hierarchy — a floating card sits above the page, a flat card sits within it."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CARD_VARIANTS.map((variant) => (
              <Card key={variant} variant={variant}>
                <CardHeader>
                  <CardTitle>{variant}</CardTitle>
                  <CardDescription>Card variant &ldquo;{variant}&rdquo;</CardDescription>
                </CardHeader>
                <CardContent>
                  <BodySmall className="text-[var(--color-muted-foreground)]">
                    Elevation and border are driven entirely by tokens, so a palette change
                    propagates without touching this component.
                  </BodySmall>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          id="forms"
          title="Forms"
          description="Form controls use --color-border-interactive, which clears 3:1 against every surface. Structural borders deliberately do not."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-6">
              <FormField label="Full name" required htmlFor="ds-name">
                <Input id="ds-name" placeholder="Thandiwe Nkosi" />
              </FormField>
              <FormField
                label="Email address"
                htmlFor="ds-email"
                error="Enter a valid email address"
              >
                <Input id="ds-email" state="error" defaultValue="not-an-email" />
              </FormField>
              <FormField label="Province" htmlFor="ds-province" helperText="Used to rank nearby stock">
                <Select id="ds-province" defaultValue="gauteng">
                  <option value="gauteng">Gauteng</option>
                  <option value="western-cape">Western Cape</option>
                  <option value="kwazulu-natal">KwaZulu-Natal</option>
                </Select>
              </FormField>
              <FormField label="Search" htmlFor="ds-search">
                <SearchInput id="ds-search" placeholder="Search 2 761 vehicles" />
              </FormField>
            </div>
            <div className="flex flex-col gap-6">
              <FormField label="Notes" htmlFor="ds-notes">
                <Textarea id="ds-notes" rows={4} placeholder="Condition, service history…" />
              </FormField>
              <Specimen label="Selection controls">
                <Checkbox id="ds-check" label="Finance pre-approval" defaultChecked />
                <Radio id="ds-radio" name="ds-radio-group" label="Trade-in" defaultChecked />
                <Toggle id="ds-toggle" label="Publish immediately" defaultChecked />
              </Specimen>
              <Specimen label="Disabled">
                <Input placeholder="Disabled input" disabled />
              </Specimen>
            </div>
          </div>
        </Section>

        <Section
          id="feedback"
          title="Feedback"
          description="Status is always carried by more than colour alone — a label or icon accompanies every state so the meaning survives a colour-vision difference."
        >
          <div className="flex flex-col gap-8">
            <Specimen label="Badges">
              {BADGE_VARIANTS.map((variant) => (
                <Badge key={variant} variant={variant}>
                  {variant}
                </Badge>
              ))}
            </Specimen>
            <div className="flex flex-col gap-4">
              <Caption className="text-[var(--color-muted)]">Alerts</Caption>
              {ALERT_VARIANTS.map((variant) => (
                <Alert key={variant} variant={variant} title={`${variant} alert`}>
                  This is the {variant} alert treatment, used for inline messaging within a page.
                </Alert>
              ))}
            </div>
            <Specimen label="Progress">
              <div className="w-full max-w-md">
                <Progress value={68} label="Listing completeness" />
              </div>
            </Specimen>
            <Specimen label="Loading">
              <Spinner />
              <div className="flex w-64 flex-col gap-2">
                <Skeleton variant="text" className="h-4 w-3/4" />
                <Skeleton variant="text" className="h-4 w-1/2" />
                <Skeleton variant="rectangular" className="h-24 w-full" />
              </div>
            </Specimen>
          </div>
        </Section>

        <Section
          id="glass"
          title="Glass"
          description="Glass is structural, not ornamental: it belongs to surfaces that float above content — headers, sidebars, dialogs and overlays."
        >
          <div
            className="grid gap-6 rounded-[var(--radius-xl)] p-8 sm:grid-cols-2 lg:grid-cols-3"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-muted), var(--color-surface-raised))",
            }}
          >
            {GLASS_VARIANTS.map((variant) => (
              <GlassSurface
                key={variant}
                variant={variant}
                className="rounded-[var(--radius-lg)] p-6"
              >
                <Label>{variant}</Label>
                <BodySmall className="mt-2 text-[var(--color-muted-foreground)]">
                  Glass variant &ldquo;{variant}&rdquo; over a tinted backdrop.
                </BodySmall>
              </GlassSurface>
            ))}
          </div>
        </Section>

        <Section
          id="motion"
          title="Motion"
          description="Motion is centralised in src/styles/tokens/motion.css and applied through utility classes. Components never define their own durations, and every transition is disabled under prefers-reduced-motion."
        >
          <div className="flex flex-col gap-8">
            <Specimen label="Hover the specimens below">
              <div className="motion-card cursor-pointer rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 hover:-translate-y-1 hover:border-[var(--color-primary)]">
                <Label>motion-card</Label>
                <BodySmall className="mt-1 text-[var(--color-muted-foreground)]">
                  Lift on hover
                </BodySmall>
              </div>
              <div className="motion-hover cursor-pointer rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 hover:bg-[var(--color-hover)]">
                <Label>motion-hover</Label>
                <BodySmall className="mt-1 text-[var(--color-muted-foreground)]">
                  Surface tint
                </BodySmall>
              </div>
              <Button>motion-button</Button>
            </Specimen>
            <Alert variant="info" title="Reduced motion">
              All motion utilities collapse to no transition when the operating system requests
              reduced motion. Verify with the emulated <code>prefers-reduced-motion</code> setting
              rather than by inspection.
            </Alert>
          </div>
        </Section>
      </div>
    </main>
  );
}
