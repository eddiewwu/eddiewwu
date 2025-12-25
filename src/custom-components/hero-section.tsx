import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HeroSection() {
  return (
    <Card className="text-center border-0 shadow-none bg-transparent mb-12">
      <CardHeader className="space-y-6">
        <CardTitle className="text-5xl md:text-6xl font-bold tracking-tight">
          Hello! I'm Ed Wu
        </CardTitle>
        <CardDescription className="text-lg md:text-xl max-w-2xl mx-auto">
          Software Engineer passionate about building modern web applications with clean, efficient code.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
