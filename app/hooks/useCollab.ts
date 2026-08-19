import { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import type { editor } from "monaco-editor";
import type { UserProfile } from "@/types/auth";
import { api } from "@/lib/api";
import { wsOrigin } from "@/lib/origin";

export type ProviderStatus = "connecting" | "connected" | "disconnected";

const WS_URL = wsOrigin(
  import.meta.env.VITE_COLLAB_SERVER_URL,
  import.meta.env.PROD ? "wss://eddiewwu-backend.onrender.com" : "ws://localhost:8080"
);

const CURSOR_STYLE_ID = "yjs-cursor-styles";
const TICKET_RETRY_MS = 3_000;

/** CSS `content` is a string literal: a stray quote or backslash breaks out of it. */
function cssString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderCursorStyles(provider: WebsocketProvider) {
  const localId = provider.awareness.clientID;
  let element = document.getElementById(CURSOR_STYLE_ID);
  if (!element) {
    element = document.createElement("style");
    element.id = CURSOR_STYLE_ID;
    document.head.appendChild(element);
  }

  let css = "";
  provider.awareness.getStates().forEach((state, clientId) => {
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

/**
 * Collaborative editing over the Render-hosted y-websocket server.
 *
 * Connection is keyed on the site JWT rather than started from the editor's
 * mount callback. The JWT arrives asynchronously -- and slowly, when Render has
 * spun the backend down -- so starting from the mount would mean a room joined
 * before the exchange finished never connected at all.
 */
export const useCollab = (
  siteJwt: string | null,
  userProfile: UserProfile | null,
  activeRoomId: string | null
) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState<ProviderStatus>("connecting");
  const [editorInstance, setEditorInstance] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  // ── Connection lifecycle, keyed on the room and the token ─────────────────
  useEffect(() => {
    if (!siteJwt || !activeRoomId) return;

    const doc = new Y.Doc();
    let active = true;
    let current: WebsocketProvider | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // One handler owns both the roster and the cursor styles. The original
    // registered two competing awareness listeners that each called setUsers.
    const onAwarenessChange = () => {
      if (!current) return;
      const localId = current.awareness.clientID;
      setUsers(
        Array.from(current.awareness.getStates().entries())
          .filter(([clientId]) => clientId !== localId)
          .map(([, state]) => state.user as UserProfile | undefined)
          .filter((u): u is UserProfile => !!u?.name)
      );
      renderCursorStyles(current);
    };

    /**
     * Tickets are single-use: the one used to connect died the moment the
     * server accepted it. On any drop, pause auto-reconnect, mint a fresh
     * ticket, then resume -- otherwise the provider retries forever with a
     * spent ticket and every attempt 401s.
     */
    const refreshTicketAndReconnect = async () => {
      if (!active || !current) return;
      current.shouldConnect = false;
      try {
        const { ticket } = await api.wsTicket();
        if (!active || !current) return;
        current.params.ticket = ticket as string;
        current.connect();
      } catch (err) {
        console.error("WebSocket ticket refresh failed, retrying:", err);
        retryTimer = setTimeout(refreshTicketAndReconnect, TICKET_RETRY_MS);
      }
    };

    void (async () => {
      let ticket: string;
      try {
        ticket = (await api.wsTicket()).ticket as string;
      } catch (err) {
        console.error("WebSocket ticket fetch failed:", err);
        if (active) setStatus("disconnected");
        return;
      }
      if (!active) return;

      // The room id is the URL path because that is what the server keys docs
      // on; the ticket rides as a query param so it can be swapped between
      // connection attempts.
      const next = new WebsocketProvider(WS_URL, activeRoomId, doc, {
        params: { ticket },
      });
      current = next;
      setProvider(next);

      next.awareness.on("change", onAwarenessChange);
      next.on("status", ({ status: nextStatus }: { status: ProviderStatus }) =>
        setStatus(nextStatus)
      );
      next.on("connection-close", refreshTicketAndReconnect);
      next.on("connection-error", (err: unknown) =>
        console.error("WebSocket connection error:", err)
      );
    })();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      current?.awareness.off("change", onAwarenessChange);
      current?.destroy();
      current = null;
      doc.destroy();
      setProvider(null);
      setUsers([]);
      document.getElementById(CURSOR_STYLE_ID)?.remove();
    };
  }, [siteJwt, activeRoomId]);

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

  return { onEditorMount, users, status };
};
