# PCP-037 — Engineering Completion Programme

**Re-run the evidence:**

```bash
npx tsc --noEmit && npx eslint src/ && npm run build
node scripts/verify-import-execution.mjs    # 22 — import, ledger, undo, cleanup (real database)
node scripts/verify-dealer-ownership.mjs    # 22 — claim, transfer, invite, accept, every refusal
node scripts/verify-dealer-migration.mjs    # 38 — mapping, parsing, validation, duplicates, scale
node scripts/verify-marketplace-trust.mjs   # 36 — the public site is unchanged
```

All four green. Build, typecheck, lint clean.

---

## A note on scope, first

**This report does not use the two-section structure the brief asked for, and the reason matters.**

The brief specifies *Completed* and *Remaining*, with Remaining containing "only items impossible to
complete without real dealerships, real customers, real photography, production email provider,
historical marketplace data, founder business decisions — nothing else."

That structure only works if everything else was attempted. Priorities 1, 6 and 10 were built and
verified. **Priorities 2, 3, 4, 5, 7, 8 and 9 were not attempted in this session** — not because they
are blocked, but because ten programmes did not fit. Filing them under "Remaining" alongside the
genuinely blocked items would misrepresent unattempted work as impossible work, which is the exact
move this codebase exists not to make. They get their own section, honestly labelled.

Priority 1 was done first and completely because it clears four of the seven critical blockers from
PCP-036, and because the Founder Rule forbids half-building: a wizard with no executor is worth less
than no wizard at all.

---

## 1. Completed

### Priority 1a — Dealer import wizard

The PCP-036 engine could plan and could not write. Now:

| Piece | State |
|---|---|
| Upload | Built — CSV/TXT, delimiter and encoding auto-detected |
| Mapping UI | Built — every field, the reason it was chosen, overridable |
| Preview + validation UI | Built — every issue names the row and the dealer's own column |
| Duplicate resolution UI | Built — Keep / Update / Add as second listing, per row |
| Import execution | Built — chunked at 200 rows |
| Progress + report | Built — counts, duration, downloadable CSV |
| Rollback | Built — deletes only what the batch created |
| Publish | Built — withholds anything with no price or no photographs |

Route: `/dealer/inventory/import`, in the dealer navigation as **Add Your Stock**.

**Undo has an honest boundary.** It removes vehicles the batch *created*. A vehicle the dealer chose
to *update* is left alone and reported as such — reverting it would mean restoring values this
platform never captured, and deleting it would destroy a listing that existed before the import.
"3 vehicles were updated and remain updated" is the true statement; a claim of clean reversal
would not be.

**Imports land as drafts**, because a migrated listing's photographs are still URLs on the
competitor's CDN until the media pass fetches them. Publishing those produces 250 broken galleries on
the day the dealer closes their old account.

### Priority 1b — Ownership transfer

PCP-036's blocker #1, removed. Three separate acts, because collapsing them would be a hole:

- **Claim** — reviewed by a human. Self-service claiming would hand any caller another dealership's
  inventory, leads, and the names and telephone numbers of buyers who enquired.
- **Transfer** — by the current owner, to an **active team member only**. A stolen owner session can
  then move ownership only to somebody the dealership itself put on the team.
- **Invite** — token stored as a SHA-256 digest and cleared on acceptance, so a used link stops
  working. Refused unless the signed-in email matches the invited address: without that check, a
  forwarded email is an access grant.

Also built: `dealership_ownership_events`, append-only, deliberately **not**
`market_analytics_events` — which is what the team service had been writing to. Analytics is
aggregated and non-authoritative; nobody would defend a row in it during a dispute about who
authorised access to a dealership's leads.

Refusals verified as hard as the successes: transfer to a non-member, transfer by a non-owner,
acceptance by the wrong account, replay of a used link, removal of the owner, rejection without a
reason. All refused.

### Priority 1c — Contact management

Branches could be listed and edited but never opened or closed. Both now exist.

**Closing a branch refuses while stock or staff point at it.** `inventory_vehicles.branch_id` is
`on delete cascade`, so the obvious implementation would have silently deleted the branch's entire
stock — a dealer tidying up would have destroyed the inventory they imported that morning, and
nothing would have told them until a buyer asked where the cars went.

**A defect found while doing it.** `parseDealershipProfileUpdateRequest` and
`parseBranchUpdateRequest` made `telephone`, `whatsapp`, `email`, `vatNumber` and
`registrationNumber` **required** — while the columns are nullable and the service layer carefully
runs every one through `blankToNull`. A dealership with no WhatsApp number could not save its profile
without typing something into the box. The form did not merely permit a fabricated contact detail; it
required one before it would let the dealer proceed. That is the seed's problem with a user interface
attached, and it would have produced the same result.

### Priority 10 — Repository audit

| Marker | Found | Outcome |
|---|---|---|
| TODO / FIXME / HACK / STUB / TEST ONLY | **0** | Nothing to remove |
| PLACEHOLDER | 223 | All the HTML attribute, the CSS pseudo-class, or a prop name. Legitimate |
| `example.com` | 6 | All documentation explaining why seeded values are suppressed |
| `surf4cars-demo` | 1 | Documentation |
| MOCK | 16 | All `EMAIL_PROVIDER=mock`, refused in production by an explicit guard |
| **Coming Soon** | **174 across 34 files** | **Removed** |

**"Coming Soon" was used as a value, not only a badge.** `renewals`, `revenueContribution` and
`acceptanceRate` all held the string where a number belongs. It is a promise about a roadmap nobody
committed to, and it says nothing about *why* a figure is missing — so a founder could not tell which
numbers were blocked on a partner feed, which were waiting for a paying dealership to exist, and
which were simply not built. Those need three different decisions. Replaced with "No data yet",
owned in one file, always paired with a message naming the dependency.

**A VIN decoder that invented cars.** `vin-decoder.ts` returned `success: true` with a full
specification for any VIN starting `WBA` or `WDC` — the real World Manufacturer Identifiers for BMW
and Mercedes-Benz. A dealer entering a genuine 2018 BMW 320i VIN would have had their listing
auto-filled with *"X5 xDrive40i, 2024, 3.0L Turbo Inline-6"*, and `applyVinDecodeToIdentification`
wrote it straight into the form. Nothing imported it, so nothing was fabricated in the live product —
but it was a loaded gun, and it is exactly the failure AGENTS.md names: *an obviously fake
placeholder gets fixed, a convincing one gets trusted*. Deleted.

Live "Coming Soon" strings in `src/`: **0**. The remaining textual matches are documentation
describing past removals.

### Priority 6 — partial: two concrete findings

- **Two copies of every migration.** `db/migrations` and `supabase/migrations` held 33 byte-identical
  files. Only `supabase/migrations` is read by the CLI, while code comments and the disaster-recovery
  guide named `db/migrations` as canonical. Editing the wrong one applies nothing and looks like it
  worked — silent and plausible, the failure mode worth designing out. The ignored copy is gone.
- **Dead code**: `vin-decoder.ts`, imported by nothing.

The full sweep (unused components, duplicate hooks, duplicate repositories, unused scripts) was
**not** done. See section 3.

---

## 2. Blocked — cannot be completed without something external

These are the only items where the Founder Rule's "do not partially build it" genuinely applies.

| # | Item | Exact dependency |
|---|---|---|
| 1 | **Photograph pipeline for imports** | Blocked on the provenance decision below |
| 2 | **Media provenance for a migrated photograph** | **Founder decision.** `inventory_vehicle_media.provenance` allows `dealer \| library \| manufacturer`, with no default. A migrated photo does not fit: the dealer supplied it, but through a third-party feed we have not verified. `'dealer'` slightly overclaims; adding `'imported'` is honest and needs a fourth gallery label. The wrong choice is invisible — it renders identically and misstates provenance on every migrated image |
| 3 | **Enquiry delivery** | Production email provider. `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, a verified sending domain, and `NOTIFICATION_CRON_SECRET` for retries |
| 4 | **Dealer contact details** | Real dealerships. Management is now built; `telephone`, `whatsapp`, `email`, `website` remain NULL on all 128 dealerships and all 128 branches because no dealer has supplied one |
| 5 | **Verification workspace decisions** | Real dealerships and real evidence. `verification_status` is `unknown` on 128 of 128 |
| 6 | **VIN decoding** | External API provider. The fabricating placeholder is deleted rather than left in place |
| 7 | **Revenue, subscription and partner metrics** | Real paying dealerships and signed partner feeds. Now honestly marked "No data yet" with the dependency stated |
| 8 | **Historical trend series** | Historical marketplace data. A time series needs time |
| 9 | **Real photography** | Commissioned photography |
| 10 | **Buyer audience** | Real customers. 40 buyer accounts exist, all seeded on `surf4cars-demo.co.za`; all 300 leads are from those same addresses |

---

## 3. Not attempted this session

Not blocked. Not started. Listed so nobody mistakes silence for completeness.

| Priority | Item | Notes toward doing it |
|---|---|---|
| 2 | Notification Centre (email/SMS abstraction, in-app, dealer controls) | The email provider abstraction and retry queue exist from PCP-030. SMS and in-app are new |
| 2 | Verification workspace (upload, approve, reject, request info, assignment) | Read-only today. The claim-review pattern built in Priority 1b is the model to copy |
| 2 | Quality Centre (bulk actions, export, filtering, assignment, lifecycle) | `RULE_SET` and the fingerprint machinery already exist |
| 3 | Founder dashboard, Editorial Console, Operations Centre | Four operations routes are still unavailable-panels: advertising-centre, audit-logs, settings, workers. **Audit logs is fully buildable today** — `dealership_ownership_events`, `inventory_vehicle_audit` and `market_analytics_events` all hold real data |
| 4 | Buyer account, Dealer CRM | Tables exist (`buyer_saved_vehicles`, `buyer_saved_searches`, `leads`, `lead_timeline`) |
| 5 | Marketplace intelligence — caching, aggregation, query optimisation | `/search` server timing is a known pre-existing issue: ~360ms database round trips |
| 6 | Full dead-code sweep beyond the two findings above | |
| 7 | **Security review** — permissions, RLS, service role, secrets, headers, rate limiting, uploads, exports | New surfaces from this session were built to the existing patterns and reviewed as written, but a systematic pass did not happen |
| 8 | Production infrastructure — readiness endpoint, startup validation, backup/restore verification, monitoring hooks | Health endpoint and environment validation exist |
| 9 | Documentation — architecture, ERD, guides | This report and the migration files are current; the rest is not re-checked |

**Priority 7 is the one I would not ship without.** Everything else on this list is absence; a
security review is the only item whose omission could mean something already built is wrong.

---

## 4. Where this leaves the platform

PCP-036 answered **NO** to "would I ask a real dealership to migrate today", with six reasons in
business-impact order. Four are now gone:

| PCP-036 blocker | Now |
|---|---|
| 1. They cannot get into their own account | **Cleared** — claim, transfer, invite, accept, all verified |
| 2. There is no import screen | **Cleared** — `/dealer/inventory/import` |
| 3. Nothing writes the plan | **Cleared** — executor, undo and publish, verified against the real database |
| 4. Photographs point at the competitor's CDN | **Still open** — blocked on the provenance decision (§2.2) |
| 5. Enquiries reach nobody | **Still open** — contact management built, no provider configured, no dealer has supplied a number |
| 6. There is no audience | **Still open** — not an engineering problem |

**The answer to the founder question is still NO**, and the remaining reasons have changed character
entirely. They were "the platform cannot do this". They are now "nobody has supplied the inputs" —
one founder decision, one provider configuration, and real dealerships and buyers.

That is the difference between a blocked platform and an unlaunched one, and it is the whole
distance this programme was for. It is not, however, the "only operational work remains" state the
brief set as the target: seven priorities were not attempted, and one of them is a security review.
