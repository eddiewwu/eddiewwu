-- Replaces the 0001 policies with the simplest thing that can work.
--
-- 0001 gated on `realtime.topic() like 'yjs:%'`, which coupled two unknowns:
-- whether the token reaches Realtime as `authenticated`, and whether the topic
-- filter matches. This drops the topic predicate so a failure means the token,
-- full stop. Tighten again once the channel is joining (see the bottom).

drop policy if exists "authenticated users can read collab room messages"
  on realtime.messages;
drop policy if exists "authenticated users can broadcast to collab rooms"
  on realtime.messages;

create policy "authenticated users can read realtime messages"
on realtime.messages
for select
to authenticated
using ( true );

create policy "authenticated users can write realtime messages"
on realtime.messages
for insert
to authenticated
with check ( true );

-- Scope: any signed-in user can read and write any Realtime topic in this
-- project. That is acceptable only because nothing else here uses Realtime.
--
-- Once the editor connects, narrow both policies back down by replacing the
-- `true` predicates with:
--
--   (select realtime.topic()) like 'collab-%'
--
-- and, on the insert policy, `and extension = 'broadcast'`.
