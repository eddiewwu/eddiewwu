import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { SecretPassword } from '@/components/shared/secret-password';
import { Card, CardTitle } from '@/components/ui/card';

export const CollabEditor = ({token} : {token: string | null}) => {
    const [hasAccess, setHasAccess] = useState(false);
    const socketRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        // 1. Initialize WebSocket with JWT token in query param
        const url = `ws://${import.meta.env.VITE_COLLAB_SERVER_URL}/ws/?token=${token}`;
        socketRef.current = new WebSocket(url);

        socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Logic to update the editor without causing an infinite loop
        if (data.type === "UPDATE" && data.userId !== "me") {
            // This is where you'll eventually put CRDT merge logic
            console.log("Remote update received:", data.content);
        }
        };

        return () => socketRef.current.close();
    }, [token]);

    const handleEditorChange = (value, event) => {
        // 2. Send the change to the server
        if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
            type: "UPDATE",
            content: value,
            // In a real app, send "diffs" or "deltas", not the whole string
        }));
        }
    };

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className={`w-full max-w-[380px] shadow-lg overflow-hidden border relative`}>
                    <CardTitle className="text-foreground text-xl">Please login to continue.</CardTitle>
                </Card>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <SecretPassword onVerify={() => setHasAccess(true)}/>
        )
    }

    return (
        <Editor
            height="90vh"
            defaultLanguage="javascript"
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={(editor) => (editorRef.current = editor)}
            />
    );
};

export default CollabEditor;