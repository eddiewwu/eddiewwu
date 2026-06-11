import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";

export function ContactSection() {
  return (
    <Section id="contact" eyebrow="Contact" title="Get in touch">
      <div className="space-y-6 max-w-xl">
        <p className="text-muted-foreground">
          Have a question, an idea, or just want to say hi? Drop me an email
          and I'll get back to you soon.
        </p>
        <Button size="lg" asChild>
          <a href="mailto:eddiewwu@gmail.com" className="inline-flex items-center gap-2">
            <Mail size={18} />
            eddiewwu@gmail.com
          </a>
        </Button>
        <div className="flex items-center gap-4">
          <a href="https://github.com/eddiewwu" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
            className="text-muted-foreground hover:text-foreground transition-colors">
            <Github size={20} />
          </a>
          <a href="https://linkedin.com/in/eddiewwu" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
            className="text-muted-foreground hover:text-foreground transition-colors">
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </Section>
  );
}
