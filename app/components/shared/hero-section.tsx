import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";

const socials = [
  { icon: Github, href: "https://github.com/eddiewwu", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/in/eddiewwu", label: "LinkedIn" },
  { icon: Mail, href: "mailto:eddiewwu@gmail.com", label: "Email" },
];

export function HeroSection() {
  return (
    <section className="w-full min-h-[70vh] flex items-center">
      <div className="max-w-5xl mx-auto px-6 w-full py-24">
        <p className="text-sm uppercase tracking-[0.2em] text-primary mb-4">Software Engineer</p>
        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-foreground">
          Hello! I'm <span className="text-primary">Ed Wu</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl">
          I build modern web applications with clean, efficient code — currently
          engineering cloud infrastructure and developer tooling at State Farm.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button size="lg" asChild>
            <a href="#contact">Get in touch</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/blog">Read the blog</Link>
          </Button>
          <div className="flex items-center gap-4 sm:ml-4">
            {socials.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon size={22} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
