import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Use Alert component
import { LockKeyhole, AlertCircle } from "lucide-react";

export function SecretPassword({ onVerify }: { onVerify: () => void }) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Fix: Only clear error when 'password' changes, NOT when 'error' changes
    useEffect(() => {
        if (error) setError(null);
    }, [password, error]);

    const onSubmit = () => {
        const entered = password.trim();
        const secret = import.meta.env.VITE_SECRET_PASSWORD;
        
        if (entered === secret) {
            onVerify();
        } else {
            setError("Incorrect password. Please try again.");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && password) {
        onSubmit();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className={`w-full max-w-[380px] shadow-lg overflow-hidden border relative ${error ? 'border-t-destructive' : 'border-t-primary'}`}>
                <CardHeader className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${error ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                    <LockKeyhole className={`w-5 h-5 ${error ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    <CardTitle className="text-2xl font-bold">Private Session</CardTitle>
                </div>
                <CardDescription>
                    Please enter the secret password!
                </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                
                {/* shadcn Alert Component for the error */}
                {error && (
                    <Alert variant="destructive" className="py-2 px-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        {error}
                    </AlertDescription>
                    </Alert>
                )}
                </CardContent>

                <CardFooter>
                <Button 
                    className="w-full font-semibold" 
                    onClick={onSubmit}
                    disabled={!password}
                    variant={error ? "destructive" : "default"}
                >
                    Join Room
                </Button>
                </CardFooter>
            </Card>
        </div>
    );
}