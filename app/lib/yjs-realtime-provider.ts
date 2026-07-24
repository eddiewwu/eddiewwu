import * as Y from "yjs";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
import { fromBase64, toBase64 } from "lib0/buffer";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export type ProviderStatus = "connecting" | "connected" | "disconnected";

/**
 * Yjs transport over Supabase Realtime broadcast.
 *
 * Unlike y-websocket there is no server-side peer holding the authoritative
 * document: clients sync off each other. A client joining an empty room
 * therefore starts from a blank document, which is the intended behaviour for
 * an ephemeral editor but is a real difference from the old Render backend.
 *
 * Channels are named `collab-<room>` and joined as private, so RLS on
 * realtime.messages decides who may read and write a room.
 *
 * Protocol (all payloads base64-encoded, since broadcast carries JSON):
 *   sync        -> { sv }     "I just joined, here is my state vector"
 *   sync-reply  -> { update } the diff the joiner is missing
 *   update      -> { update } an incremental local change
 *   awareness   -> { update } cursor / presence state
 */

const SYNC_TIMEOUT_MS = 1_500;
const AWARENESS_PING_MS = 15_000;
// Realtime's default ceiling is 256KB; base64 costs ~33% on top of the binary.
const MAX_PAYLOAD_BYTES = 180_000;

interface Options {
  supabase: SupabaseClient;
  room: string;
  doc: Y.Doc;
  awareness?: Awareness;
  /** Coalescing window for outgoing document updates. */
  flushInterval?: number;
}

export class SupabaseRealtimeProvider {
  readonly doc: Y.Doc;
  readonly awareness: Awareness;

  private channel: RealtimeChannel;
  private flushInterval: number;
  private pending: Uint8Array[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private awarenessTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  // Broadcasting before the channel joins silently falls back to REST delivery,
  // which is slower, deprecated, and noisy in the console. Everything outbound
  // waits for the join and local edits buffer until then.
  private joined = false;

  private _status: ProviderStatus = "connecting";
  private _synced = false;

  private statusListeners = new Set<(s: ProviderStatus) => void>();
  private syncedListeners = new Set<(v: boolean) => void>();

  constructor({ supabase, room, doc, awareness, flushInterval = 50 }: Options) {
    this.doc = doc;
    this.awareness = awareness ?? new Awareness(doc);
    this.flushInterval = flushInterval;

    // No colon in the name: Realtime topics are Phoenix topics, where `:` is
    // the separator, so an embedded colon risks being parsed as structure.
    this.channel = supabase.channel(`collab-${room}`, {
      config: {
        // Private channels are authorised by RLS on realtime.messages, so a
        // signed-out client cannot join a room.
        private: true,
        broadcast: { self: false, ack: false },
      },
    });

    this.channel
      .on("broadcast", { event: "sync" }, ({ payload }) =>
        this.onSyncRequest(payload)
      )
      .on("broadcast", { event: "sync-reply" }, ({ payload }) =>
        this.onSyncReply(payload)
      )
      .on("broadcast", { event: "update" }, ({ payload }) =>
        this.onRemoteUpdate(payload)
      )
      .on("broadcast", { event: "awareness" }, ({ payload }) =>
        this.onRemoteAwareness(payload)
      );

    this.doc.on("update", this.onLocalUpdate);
    this.awareness.on("update", this.onLocalAwareness);

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.onUnload);
    }

    this.channel.subscribe((status, err) => {
      if (this.destroyed) return;
      // The error carries the server's reason for refusing the join (an RLS
      // denial reads as "Unauthorized"). Swallowing it makes a failed channel
      // indistinguishable from a slow one.
      if (err) console.error(`Realtime channel ${status}:`, err);
      if (status === "SUBSCRIBED") {
        this.joined = true;
        this.setStatus("connected");
        this.requestSync();
        // Edits made while the channel was still joining are buffered rather
        // than dropped, so peers still receive them.
        this.flush();
        this.startAwarenessPing();
      } else if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        this.joined = false;
        this.setStatus("disconnected");
      }
    });
  }

  // ── Public surface ────────────────────────────────────────────────────────

  get status(): ProviderStatus {
    return this._status;
  }

  get synced(): boolean {
    return this._synced;
  }

  onStatus(fn: (s: ProviderStatus) => void): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  onSynced(fn: (v: boolean) => void): () => void {
    this.syncedListeners.add(fn);
    return () => this.syncedListeners.delete(fn);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.flushTimer) clearTimeout(this.flushTimer);
    if (this.syncTimer) clearTimeout(this.syncTimer);
    if (this.awarenessTimer) clearInterval(this.awarenessTimer);
    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.onUnload);
    }

    this.doc.off("update", this.onLocalUpdate);
    this.awareness.off("update", this.onLocalAwareness);

    this.announceDeparture();
    this.joined = false;
    this.channel.unsubscribe();

    this.statusListeners.clear();
    this.syncedListeners.clear();
    this.setStatus("disconnected");
  }

  // ── Outgoing ──────────────────────────────────────────────────────────────

  private send(event: string, payload: Record<string, string>) {
    if (this.destroyed || !this.joined) return;
    this.channel.send({ type: "broadcast", event, payload });
  }

  private encode(bytes: Uint8Array, label: string): string | null {
    if (bytes.byteLength > MAX_PAYLOAD_BYTES) {
      console.error(
        `Yjs ${label} of ${bytes.byteLength} bytes exceeds the Realtime payload limit and was dropped.`
      );
      return null;
    }
    return toBase64(bytes);
  }

  private onLocalUpdate = (update: Uint8Array, origin: unknown) => {
    // Anything we applied from a peer comes back through here tagged with the
    // provider as origin; rebroadcasting it would loop.
    if (origin === this) return;
    this.pending.push(update);
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.flushInterval);
  };

  private flush() {
    // Keep buffering until the join lands; the SUBSCRIBED handler drains this.
    if (!this.joined || this.pending.length === 0) return;
    const merged = Y.mergeUpdates(this.pending);
    this.pending = [];
    const update = this.encode(merged, "update");
    if (update) this.send("update", { update });
  }

  private onLocalAwareness = (
    {
      added,
      updated,
      removed,
    }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ) => {
    if (origin === this) return;
    // Pre-join awareness changes need no buffering: the join handler broadcasts
    // the current local state wholesale.
    if (!this.joined) return;
    const changed = added.concat(updated, removed);
    if (changed.length === 0) return;
    const update = this.encode(
      encodeAwarenessUpdate(this.awareness, changed),
      "awareness update"
    );
    if (update) this.send("awareness", { update });
  };

  private requestSync() {
    const sv = this.encode(Y.encodeStateVector(this.doc), "state vector");
    if (sv) this.send("sync", { sv });
    this.broadcastLocalAwareness();

    // Nobody else in the room means nobody will answer. Treat the silence as
    // "synced against an empty room" rather than hanging on the loading state.
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.setSynced(true), SYNC_TIMEOUT_MS);
  }

  private broadcastLocalAwareness() {
    const update = this.encode(
      encodeAwarenessUpdate(this.awareness, [this.doc.clientID]),
      "awareness state"
    );
    if (update) this.send("awareness", { update });
  }

  private startAwarenessPing() {
    if (this.awarenessTimer) clearInterval(this.awarenessTimer);
    // Awareness entries expire on a timer; re-announcing keeps this client from
    // being pruned by peers and refreshes anyone who missed the initial state.
    this.awarenessTimer = setInterval(
      () => this.broadcastLocalAwareness(),
      AWARENESS_PING_MS
    );
  }

  private announceDeparture() {
    const clientId = this.doc.clientID;
    removeAwarenessStates(this.awareness, [clientId], this);
    if (!this.joined) return;
    const update = this.encode(
      encodeAwarenessUpdate(this.awareness, [clientId]),
      "departure"
    );
    if (update) {
      // Bypass `send`: destroyed is already true by the time this runs.
      this.channel.send({
        type: "broadcast",
        event: "awareness",
        payload: { update },
      });
    }
  }

  private onUnload = () => this.destroy();

  // ── Incoming ──────────────────────────────────────────────────────────────

  private onSyncRequest(payload: { sv?: string }) {
    if (!payload?.sv) return;
    try {
      const diff = Y.encodeStateAsUpdate(this.doc, fromBase64(payload.sv));
      const update = this.encode(diff, "sync reply");
      if (update) this.send("sync-reply", { update });
      // A new peer needs our cursor too, not just the document.
      this.broadcastLocalAwareness();
    } catch (err) {
      console.error("Failed to answer Yjs sync request:", err);
    }
  }

  private onSyncReply(payload: { update?: string }) {
    if (!payload?.update) return;
    try {
      Y.applyUpdate(this.doc, fromBase64(payload.update), this);
      this.setSynced(true);
    } catch (err) {
      console.error("Failed to apply Yjs sync reply:", err);
    }
  }

  private onRemoteUpdate(payload: { update?: string }) {
    if (!payload?.update) return;
    try {
      Y.applyUpdate(this.doc, fromBase64(payload.update), this);
    } catch (err) {
      console.error("Failed to apply Yjs update:", err);
    }
  }

  private onRemoteAwareness(payload: { update?: string }) {
    if (!payload?.update) return;
    try {
      applyAwarenessUpdate(this.awareness, fromBase64(payload.update), this);
    } catch (err) {
      console.error("Failed to apply awareness update:", err);
    }
  }

  // ── State ─────────────────────────────────────────────────────────────────

  private setStatus(next: ProviderStatus) {
    if (this._status === next) return;
    this._status = next;
    this.statusListeners.forEach((fn) => fn(next));
  }

  private setSynced(next: boolean) {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    if (this._synced === next) return;
    this._synced = next;
    this.syncedListeners.forEach((fn) => fn(next));
  }
}
