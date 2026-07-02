import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type { UserProfile } from '@/types/auth';
import { api } from '@/lib/api';

// Same missing-env fallback story as lib/api.ts — never undefined in a prod bundle.
const WS_URL =
  import.meta.env.VITE_COLLAB_SERVER_URL ||
  (import.meta.env.PROD ? 'wss://eddiewwu-backend.onrender.com' : 'ws://localhost:8080');

export const useCollab = (siteJwt: string | null, userProfile: UserProfile | null, activeRoomId: string | null) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const providerRef = useRef<WebsocketProvider | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);

    const onEditorMount = async (editor: any) => {
        if (!siteJwt || !activeRoomId) return;

        // 1. Get a single-use WebSocket ticket
        let ticket: string;
        try {
            const data = await api.wsTicket();
            ticket = data.ticket as string;
        } catch (err) {
            console.error('WebSocket ticket fetch error:', err);
            return;
        }

        // 2. Initialize the Yjs Doc
        const ydoc = new Y.Doc();

        // 3. Connect via ticket (not raw Firebase token). The room id becomes
        // the URL path (that's what the server keys docs on); the ticket rides
        // as a query param so it can be swapped out between connection attempts.
        const provider = new WebsocketProvider(WS_URL, activeRoomId, ydoc, {
            params: { ticket },
        });
        providerRef.current = provider;

        // Tickets are single-use: the one above died the moment the server
        // accepted it. On any drop, pause auto-reconnect, mint a fresh ticket,
        // then resume — otherwise the provider retries forever with a dead
        // ticket and every attempt 401s.
        const refreshTicketAndReconnect = async () => {
            if (providerRef.current !== provider) return; // destroyed
            provider.shouldConnect = false;
            try {
                const data = await api.wsTicket();
                if (providerRef.current !== provider) return;
                provider.params.ticket = data.ticket as string;
                provider.connect();
            } catch (err) {
                console.error('WebSocket ticket refresh failed, retrying in 3s:', err);
                setTimeout(refreshTicketAndReconnect, 3000);
            }
        };
        provider.on('connection-close', refreshTicketAndReconnect);

        // 4. Inject CSS for remote cursors
        provider.awareness.on('change', () => {
            const states = provider.awareness.getStates();
            const localId = provider.awareness.clientID;

            const onlineUsers = Array.from(states.entries())
                .map(([id, state]) => ({ clientId: id, ...state.user }))
                .filter((u: any) => u.name);
            setUsers(onlineUsers);

            let styleElement = document.getElementById('yjs-cursor-styles');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'yjs-cursor-styles';
                document.head.appendChild(styleElement);
            }

            let css = '';
            states.forEach((state, clientId) => {
                if (clientId === localId || !state.user) return;
                const { color, name } = state.user;
                css += `
                    .yRemoteSelection-${clientId} { background-color: ${color}33; }
                    .yRemoteSelectionHead-${clientId} {
                        border-left: ${color} solid 2px;
                        border-top: ${color} solid 2px;
                        border-bottom: ${color} solid 2px;
                    }
                    .yRemoteSelectionHead-${clientId}::after {
                        content: "${name}";
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
            styleElement.innerHTML = css;
        });

        // 5. Shared text + Monaco binding
        const ytext = ydoc.getText('monaco');
        bindingRef.current = new MonacoBinding(
            ytext,
            editor.getModel(),
            new Set([editor]),
            provider.awareness
        );

        // 6. Set local awareness (cursors / user list)
        if (userProfile) {
            provider.awareness.setLocalStateField('user', {
                name: userProfile.name,
                color: userProfile.color,
                avatar: userProfile.avatar,
            });
        }

        // 7. Track online users (excluding self)
        provider.awareness.on('change', () => {
            const states = provider.awareness.getStates();
            const localId = provider.awareness.clientID;
            const onlineUsers = Array.from(states.entries())
                .filter(([clientId]) => clientId !== localId)
                .map(([, state]) => state.user)
                .filter((u): u is UserProfile => !!u?.name);
            setUsers(onlineUsers);
        });

        provider.on('status', (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
            console.log(`WebSocket status: ${event.status}`);
            setStatus(event.status);
        });

        provider.on('connection-error', (error: unknown) => {
            console.error('WebSocket connection error:', error);
        });
    };

    useEffect(() => {
        return () => {
            bindingRef.current?.destroy();
            providerRef.current?.destroy();
            // Null the ref so the ticket-refresh handler knows to bail.
            bindingRef.current = null;
            providerRef.current = null;
        };
    }, []);

    return { onEditorMount, users, status };
};
