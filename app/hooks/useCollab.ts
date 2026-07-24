import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { MonacoBinding } from "y-monaco";
import type { editor } from "monaco-editor";
import type { UserProfile } from "@/types/auth";
import { supabase } from "@/lib/supabase";
import {
  SupabaseRealtimeProvider,
  type ProviderStatus,
} from "@/lib/yjs-realtime-provider";

const CURSOR_STYLE_ID = "yjs-cursor-styles";

/** CSS `content` is a string literal: a stray quote or backslash breaks out of it. */
function cssString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderCursorStyles(awareness: Awareness) {
  const localId = awareness.clientID;
  let element = document.getElementById(CURSOR_STYLE_ID);
  if (!element) {
    element = document.createElement("style");
    element.id = CURSOR_STYLE_ID;
    document.head.appendChild(element);
  }

  let css = "";
  awareness.getStates().forEach((state, clientId) => {
    if (clientId === localId || !state.user) return;
    const { color, name } = state.user as UserProfile;
    if (!color || !name) return;
    css += `
      .yRemoteSelection-${clientId} { background-color: ${color}33; }
      .yRemoteSelectionHead-${clientId} {
        border-left: ${color} solid 2px;
        border-top: ${color} solid 2px;
        border-bottom: ${color} solid 2px;
      }
      .yRemoteSelectionHead-${clientId}::after {
        content: "${cssString(name)}";
        background-color: ${color};
        position: absolute;
        top: -18px;
        left: -2px;
        font-size: 10px;
        padding: 0 4px;
        color: white;
        white-space: nowrap;
        border-radius: 2px;
        font-weight: bold;
      }
    `;
  });
  element.textContent = css;
}

export const useCollab = (
  accessToken: string | null,
  userProfile: UserProfile | null,
  activeRoomId: string | null
) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState<ProviderStatus>("connecting");
  const [synced, setSynced] = useState(false);

  const [editorInstance, setEditorInstance] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [provider, setProvider] = useState<SupabaseRealtimeProvider | null>(null);

  // ── Connection lifecycle, keyed on the room ───────────────────────────────
  useEffect(() => {
    if (!accessToken || !activeRoomId) return;

    const doc = new Y.Doc();
    const awareness = new Awareness(doc);
    let provider: SupabaseRealtimeProvider | null = null;
    let offStatus: (() => void) | undefined;
    let offSynced: (() => void) | undefined;
    let cancelled = false;

    // One handler owns both the roster and the cursor styles. The previous
    // version registered two competing listeners that each called setUsers.
    const onAwarenessChange = () => {
      const localId = awareness.clientID;
      setUsers(
        Array.from(awareness.getStates().entries())
          .filter(([clientId]) => clientId !== localId)
          .map(([, state]) => state.user as UserProfile | undefined)
          .filter((u): u is UserProfile => !!u?.name)
      );
      renderCursorStyles(awareness);
    };
    awareness.on("change", onAwarenessChange);

    // Realtime evaluates RLS against whatever token the socket carries. React
    // runs child effects before parent ones, so this effect fires before the
    // AuthProvider has pushed the session token down. Without awaiting it here
    // the channel joins as `anon` and every policy scoped to `authenticated`
    // denies it, which surfaces as a permanent "Disconnected".
    (async () => {
      await supabase.realtime.setAuth(accessToken);
      if (cancelled) return;

      const next = new SupabaseRealtimeProvider({
        supabase,
        room: activeRoomId,
        doc,
        awareness,
      });
      provider = next;
      setProvider(next);
      setStatus(next.status);
      setSynced(next.synced);
      offStatus = next.onStatus(setStatus);
      offSynced = next.onSynced(setSynced);
    })();

    return () => {
      cancelled = true;
      awareness.off("change", onAwarenessChange);
      offStatus?.();
      offSynced?.();
      provider?.destroy();
      awareness.destroy();
      doc.destroy();
      setProvider(null);
      setUsers([]);
      document.getElementById(CURSOR_STYLE_ID)?.remove();
    };
  }, [accessToken, activeRoomId]);

  // ── Local cursor identity ─────────────────────────────────────────────────
  useEffect(() => {
    if (!provider || !userProfile) return;
    provider.awareness.setLocalStateField("user", {
      name: userProfile.name,
      color: userProfile.color,
      avatar: userProfile.avatar,
    });
  }, [provider, userProfile]);

  // ── Monaco binding, once both the editor and the provider exist ───────────
  useEffect(() => {
    const model = editorInstance?.getModel();
    if (!provider || !editorInstance || !model) return;

    const binding = new MonacoBinding(
      provider.doc.getText("monaco"),
      model,
      new Set([editorInstance]),
      provider.awareness
    );
    return () => binding.destroy();
  }, [provider, editorInstance]);

  const onEditorMount = useCallback(
    (instance: editor.IStandaloneCodeEditor) => setEditorInstance(instance),
    []
  );

  return { onEditorMount, users, status, synced };
};
