-- PRP-006 — durable rate limit windows
--
-- WHY THIS IS NOT IN MEMORY
-- =========================
-- `InMemoryRateLimitStore` is per-process. On a serverless host each invocation may be a fresh
-- instance, so an in-memory limit of ten allows ten *per instance* and the effective limit is
-- however many instances the platform decides to start. That is not a limit, it is a suggestion,
-- and it fails in the direction that costs money: the endpoint it protects is unauthenticated,
-- writes leads into dealers' CRMs, and now triggers outbound email against a paid provider and a
-- sender reputation that cannot be bought back.
--
-- WHY THE KEY IS HASHED
-- =====================
-- The natural key is `publicEnquiry:address:<ip>`. An IP address is personal information under
-- POPIA, and this table would otherwise be a log of who visited, retained indefinitely, for no
-- purpose beyond counting. The store hashes the key before it arrives, so counting still works and
-- the row cannot be read backwards into a person.
--
-- Nothing here is a fallback for the framework in `src/lib/security/rate-limit.ts` — it is the
-- store that framework was written to accept, supplied at last.

create table if not exists public.rate_limit_windows (
  -- sha256 of the caller key. Fixed width, no readable identity.
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

create index if not exists rate_limit_windows_reset_idx
  on public.rate_limit_windows (reset_at);

alter table public.rate_limit_windows enable row level security;
-- No policies. Only the service key counts requests; nothing in a browser needs to read or write
-- the thing that is limiting it.

/*
  One statement, so two concurrent requests cannot both read "9" and both be allowed.
  ==================================================================================
  Read-then-write in application code is exactly the race a rate limiter must not have — it is most
  likely to lose precisely when the endpoint is under the burst the limit exists to stop.

  The window is fixed rather than sliding. A caller can therefore send the limit at the end of one
  window and again at the start of the next; that is a known and acceptable property at these
  volumes, and it is worth saying out loud rather than implying a precision the implementation does
  not have.
*/
create or replace function public.rate_limit_hit(
  p_key text,
  p_window_ms bigint,
  p_now timestamptz
)
returns table (hit_count integer, window_reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Occasional opportunistic pruning. Cheap in aggregate, and it keeps a table nobody ever reads
  -- from growing without bound; a scheduled job for this would be plumbing for a housekeeping task.
  if random() < 0.01 then
    delete from public.rate_limit_windows where reset_at < p_now - interval '1 day';
  end if;

  return query
  insert into public.rate_limit_windows as w (key, count, reset_at)
  values (p_key, 1, p_now + make_interval(secs => p_window_ms / 1000.0))
  on conflict (key) do update
     set count = case when w.reset_at <= p_now then 1 else w.count + 1 end,
         reset_at = case
                      when w.reset_at <= p_now then p_now + make_interval(secs => p_window_ms / 1000.0)
                      else w.reset_at
                    end
  returning w.count, w.reset_at;
end;
$$;

revoke all on function public.rate_limit_hit(text, bigint, timestamptz) from public, anon, authenticated;
