import { Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  const socialLinks = [
    { icon: Github, href: "https://github.com/eddiewwu", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com/in/eddiewwu", label: "LinkedIn" },
    { icon: Mail, href: "mailto:eddiewwu@gmail.com", label: "Email" },
  ];

  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-8">
          <div className="flex gap-6">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={link.label}
                >
                  <Icon size={24} />
                </a>
              );
            })}
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Ed Wu. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
