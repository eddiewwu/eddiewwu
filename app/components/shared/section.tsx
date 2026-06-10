import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, eyebrow, title, children, className }: SectionProps) {
  return (
    <section id={id} className={cn("w-full py-20", className)}>
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">{eyebrow}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-10">{title}</h2>
        {children}
      </div>
    </section>
  );
}
