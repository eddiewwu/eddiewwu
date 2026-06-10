import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type { UserProfile } from '@/types/auth';

const API = import.meta.env.VITE_API_URL as string;
const WS_URL = import.meta.env.VITE_COLLAB_SERVER_URL as string;

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
            const res = await fetch(`${API}/api/auth/ws-ticket`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${siteJwt}` },
            });
            if (!res.ok) {
                console.error('Failed to obtain WebSocket ticket:', res.status);
                return;
            }
            const data = await res.json();
            ticket = data.ticket as string;
        } catch (err) {
            console.error('WebSocket ticket fetch error:', err);
            return;
        }

        // 2. Initialize the Yjs Doc
        const ydoc = new Y.Doc();

        // 3. Connect via ticket (not raw Firebase token)
        const provider = new WebsocketProvider(
            `${WS_URL}?ticket=${encodeURIComponent(ticket)}&roomId=${activeRoomId}`,
            activeRoomId,
            ydoc
        );

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

        providerRef.current = provider;

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
        };
    }, []);

    return { onEditorMount, users, status };
};
