-- PRP-004 follow-up — the contact claim, and one piece of test data.
--
-- THE MISSING CLAIM
-- =================
-- `dealer:contact` has a verification policy and the highest customer impact on the platform — the
-- Onboarding Centre reports all 126 dealerships blocked on "Contact details verified" — and yet no contact
-- claim existed. The claims were migrated from `dealership_field_provenance`, which only ever tracked logo,
-- cover image, opening hours and address. Contact details had provenance nowhere.
--
-- That is the same shape as the opening-hours finding from PRP-001: the *data* was present (telephone,
-- whatsapp and email are columns on `dealerships`) and the *claim about it* was missing, so nothing could
-- record whether anyone had asserted or checked it. The bottleneck was visible in one console and
-- unrepresentable in another.
--
-- A contact claim is created for every dealership in `draft`. Draft is the honest state: nobody has asserted
-- anything, and all 126 currently hold NULL after the PCP-013A clean-up. It becomes verification work the
-- moment a dealer supplies a number, and until then the Onboarding Centre correctly calls it onboarding work.
--
-- Note that `contact` is deliberately one claim across three columns. "This dealership can be reached" is
-- what a customer understands; verifying a telephone number, a WhatsApp number and an email address as three
-- independent facts would be schema-shaped rather than claim-shaped.
--
--
-- THE TEST CLAIM
-- ==============
-- `claim-test-1` was created while proving the lifecycle transitions and could not be deleted afterwards:
-- its events are immutable, the delete cascades to them, and the trigger correctly refused. Immutability
-- propagates transitively, which was not designed for but is right — a claim with a history is a record, and
-- records are not disposable.
--
-- Removing it therefore requires the deliberate, reviewable act the design intends: drop the guard, delete,
-- restore the guard. Doing that here rather than by hand is the point — it leaves a migration in the history
-- rather than an untraceable change made against production at a console.

begin;

-- ── 1. Contact claims ─────────────────────────────────────────────────────────────────────────────────
insert into public.verification_claims (id, subject_kind, subject_id, claim_type, state)
select 'claim-dealer-' || d.id || '-contact', 'dealer', d.id, 'contact', 'draft'
from public.dealerships d
on conflict (subject_kind, subject_id, claim_type) do nothing;

insert into public.verification_claim_events (claim_id, from_state, to_state, actor_kind, actor_id, method, note)
select c.id, null, 'draft', 'system', 'prp004-migration', 'migration',
       'Contact claim created. No assertion yet — contact columns are NULL after the PCP-013A clean-up.'
from public.verification_claims c
where c.claim_type = 'contact'
  and not exists (select 1 from public.verification_claim_events e where e.claim_id = c.id);

-- ── 2. Remove the test claim ──────────────────────────────────────────────────────────────────────────
alter table public.verification_claim_events disable trigger verification_claim_events_immutable;

delete from public.verification_claims where subject_kind = 'test';

alter table public.verification_claim_events enable trigger verification_claim_events_immutable;

commit;
