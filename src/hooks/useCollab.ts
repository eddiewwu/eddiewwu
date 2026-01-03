import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import type { UserProfile } from '@/types/auth';

export const useCollab = (token: string | null, userProfile: UserProfile | null, activeRoomId: string | null) => {
    const [users, setUsers] = useState<any[]>([]);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const providerRef = useRef<WebsocketProvider | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);

    const onEditorMount = (editor: any) => {
        // 1. Initialize the Yjs Doc (The Shared Mathematical State)
        const ydoc = new Y.Doc();

        // 2. Connect to the WebSocket Provider
        // Yjs handles the "Room" logic automatically via the second argument
        const provider = new WebsocketProvider(
            `wss://${import.meta.env.VITE_COLLAB_SERVER_URL}?token=${encodeURIComponent(token!)}&roomId=${activeRoomId}`,
            activeRoomId,
            ydoc
        );

        // 2. Dynamic CSS Injection for Remote Cursors
        provider.awareness.on('change', () => {
            const states = provider.awareness.getStates();
            const localId = provider.awareness.clientID;

            // Update the "Who's Online" list for the UI
            const onlineUsers = Array.from(states.entries())
                .map(([id, state]) => ({
                    clientId: id,
                    ...state.user
                }))
                .filter(u => u.name);
            setUsers(onlineUsers);

            // Inject CSS for remote cursors
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

        // 3. Define the Shared Text Type
        const ytext = ydoc.getText('monaco');

        // 4. Bind Yjs to the Monaco Editor
        // This replaces ALL your manual handleCursor and handleUpdate logic!
        bindingRef.current = new MonacoBinding(
            ytext,
            editor.getModel(),
            new Set([editor]),
            provider.awareness
        );

        console.log("UserProfile:", userProfile);
        // 5. Setup Awareness (Cursors and Usernames)
        provider.awareness.setLocalStateField('user', {
            name: userProfile.name,
            color: userProfile.color,
            avatar: userProfile.avatar
        });

        // Listen for user changes to update a "Who's Online" list
        provider.awareness.on('change', () => {
            const states = provider.awareness.getStates();
            const localId = provider.awareness.clientID;

            const onlineUsers = Array.from(states.entries())
                .filter(([clientId, _]) => clientId !== localId)
                .map(([_, state]) => state.user)
                .filter(user => user !== undefined);

            setUsers(onlineUsers);
        });

        provider.on('status', (event: any) => {
            console.log(`Web Socket Connection Status - ${event.status}`); // 'connecting', 'connected', or 'disconnected'
            setStatus(event.status);
        });

        provider.on('connection-error', (error: any) => {
            console.error("WebSocket failed to connect:", error);
        });
    };

    // IMPORTANT: Clean up when the component unmounts
    useEffect(() => {
        return () => {
            bindingRef.current?.destroy();
            providerRef.current?.destroy();
        };
    }, []);

    return { onEditorMount, users };
};