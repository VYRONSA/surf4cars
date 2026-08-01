-- PCP-030 — make unconfigured notifications recoverable
--
-- WHAT WAS WRONG
-- ==============
-- An enquiry that arrived while `EMAIL_PROVIDER` was unset was written as `not_configured` and then
-- ignored for ever. The queue only looked at `pending` and `retrying`, so configuring a provider an
-- hour later notified every enquiry from that moment on and none of the ones already waiting.
--
-- That is precisely the failure this programme exists to prevent, wearing a different hat. The lead
-- was never lost — it is durable and the dealer portal shows it — but nobody would ever be told
-- about it, and no screen said so. The Founder card would have shown a healthy row of sends while
-- the backlog sat underneath it, permanently invisible.
--
-- `not_configured` is a transient condition. Somebody sets the variable and it clears. Treating it
-- as terminal confused "we cannot send this yet" with "we will never send this".

drop index if exists public.enquiry_notifications_due_idx;

create index if not exists enquiry_notifications_due_idx
  on public.enquiry_notifications (next_attempt_at)
  where status in ('pending', 'retrying', 'not_configured');

-- Anything already recorded as unconfigured becomes due immediately, so the first sweep after a
-- provider is configured drains the backlog rather than starting from empty.
update public.enquiry_notifications
   set next_attempt_at = now()
 where status = 'not_configured'
   and next_attempt_at is null;
