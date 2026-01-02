import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollab } from '@/hooks/useCollab';
import type { UserProfile } from '@/types/auth';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hash } from 'lucide-react';

export const CollabEditor = ({ token, userProfile }: { token: string | null, userProfile: UserProfile | null }) => {
    const [roomInput, setRoomInput] = useState("");
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const { onEditorMount, users } = useCollab(token, userProfile, activeRoomId);

    const handleRoomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomInput.trim()) {
            setActiveRoomId(roomInput.trim()); // This "locks in" the room
        }
    };

    // Header stays constant - no more repetition!
    const Header = (
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance mb-8">
            The Ephemeral Collab Editor
        </h1>
    );

    // GUARD 1: Auth check
    if (!token) {
        return (
            <div className="p-10">
                {Header}
                <div className="flex justify-center">
                    <Card className="w-full max-w-[380px] p-6 shadow-lg">
                        <CardTitle>Please login to continue.</CardTitle>
                    </Card>
                </div>
            </div>
        );
    }

    // GUARD 2: Access check
    if (!activeRoomId) {
        return (
            <div className="p-10">
                {Header}
                <div className='flex items-center justify-center bg-background'>
                    <Card className="w-full max-w-md shadow-lg border-2 rounded-[2rem] justify-center"> {/* Extra round edges */}
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

    // THE HAPPY PATH: User is logged in and has access
    return (
        <div className="flex flex-col h-screen p-4">
            {Header}
            
            {/* Real-time User List - Bonus Feature! */}
            <div className="flex gap-2 mb-4 justify-center">
                Users Online: 
                {users.map((user, index) => (
                    <Avatar key={index} 
                    className="w-8 h-8 border-2 border-background rounded-full shadow-sm">
                        <AvatarImage src={user.avatar} className="rounded-full" />
                        <AvatarFallback className="rounded-full text-white text-[10px]" 
                            style={{ backgroundColor: user.color }}>
                            {user.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                ))}
            </div>

            <div className="border rounded-xl overflow-hidden shadow-2xl">
                <Editor
                    height="80vh"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    onMount={onEditorMount}
                    // Note: No 'value' or 'onChange' needed! Yjs handles the model.
                />
            </div>
        </div>
    );
};

export default CollabEditor;