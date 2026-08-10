import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollab } from '@/hooks/useCollab';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/useAuthContext';

const statusLabel = {
    connecting: 'Connecting',
    connected: 'Connected',
    disconnected: 'Disconnected',
} as const;

const statusDot = {
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
} as const;

export const CollabEditor = () => {
    const { userProfile, siteJwt, loading, authError } = useAuth();
    const [roomInput, setRoomInput] = useState("");
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const { onEditorMount, users, status } = useCollab(
        siteJwt,
        userProfile,
        activeRoomId
    );

    const handleRoomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomInput.trim()) {
            setActiveRoomId(roomInput.trim());
        }
    };

    const Header = (
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance mb-8">
            The Ephemeral Collab Editor
        </h1>
    );

    // GUARD 1: Auth check. Being signed in is enough to get past this; the
    // site-JWT exchange that actually authorises the socket happens in the
    // background and surfaces through `status` below.
    if (loading || !userProfile) {
        return (
            <div className="p-10">
                {Header}
                <div className="flex justify-center">
                    <Card className="w-full max-w-[380px] p-6 shadow-lg space-y-3">
                        {loading ? (
                            <CardTitle>Checking your session…</CardTitle>
                        ) : authError ? (
                            <>
                                <CardTitle>Sign-in unavailable.</CardTitle>
                                <CardDescription className="text-destructive">
                                    {authError}
                                </CardDescription>
                            </>
                        ) : (
                            <>
                                <CardTitle>Please sign in with Google to continue.</CardTitle>
                                <CardDescription>
                                    Rooms are private to signed-in users.
                                </CardDescription>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    // GUARD 2: Room selection
    if (!activeRoomId) {
        return (
            <div className="p-10">
                {Header}
                <div className='flex items-center justify-center bg-background'>
                    <Card className="w-full max-w-md shadow-lg border-2 rounded-[2rem] justify-center">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold">Collaborate</CardTitle>
                            <CardDescription>
                                Enter a room number to start coding together.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRoomSubmit} className="space-y-4">
                                <div className="relative">
                                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="1"
                                        value={roomInput}
                                        onChange={(e) => setRoomInput(e.target.value)}
                                        className="pl-10 rounded-full border-muted-foreground/20 focus-visible:ring-primary"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full rounded-full font-semibold transition-all hover:scale-[1.02]"
                                    disabled={!roomInput.trim()}
                                >
                                    Join Room
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // THE HAPPY PATH
    return (
        <div className="flex flex-col h-screen p-4">
            {Header}

            <div className="flex items-center gap-4 mb-4 justify-center">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={cn('h-2 w-2 rounded-full', statusDot[status])} />
                    {statusLabel[status]}
                </span>

                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    Room #{activeRoomId}
                </span>

                <span className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Users online:</span>
                    {users.length === 0 ? (
                        <span className="text-sm text-muted-foreground">just you</span>
                    ) : (
                        users.map((user, index) => (
                            <Avatar key={index}
                                className="w-8 h-8 border-2 border-background rounded-full shadow-sm">
                                <AvatarImage src={user.avatar} className="rounded-full" />
                                <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full text-white text-[10px]"
                                    style={{ backgroundColor: user.color }}>
                                    {user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        ))
                    )}
                </span>
            </div>

            {status !== 'connected' && (
                <p className="mb-4 text-center text-xs text-muted-foreground">
                    The collab backend sleeps when idle, so the first connection can take
                    around 30 seconds to wake it.
                </p>
            )}

            <div className="border rounded-xl overflow-hidden shadow-2xl">
                <Editor
                    height="80vh"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    onMount={onEditorMount}
                />
            </div>
        </div>
    );
};

export default CollabEditor;
