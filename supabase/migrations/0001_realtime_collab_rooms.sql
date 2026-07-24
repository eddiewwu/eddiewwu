-- Realtime authorization for the collab editor.
--
-- Private channels route every join/broadcast through RLS on
-- realtime.messages. Without these policies a private channel join is denied
-- by default, so the editor would sit on "Connecting" forever.
--
-- Scope: any signed-in user may join any `yjs:<room>` topic. Rooms are
-- ephemeral and unlisted, so the room name is the only secret. Tighten this
-- with a room membership table if that stops being good enough.

create policy "authenticated users can read collab room messages"
on realtime.messages
for select
to authenticated
using (
  realtime.topic() like 'yjs:%'
);

create policy "authenticated users can broadcast to collab rooms"
on realtime.messages
for insert
to authenticated
with check (
  realtime.topic() like 'yjs:%'
  and extension = 'broadcast'
);
