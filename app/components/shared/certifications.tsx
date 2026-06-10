import { Award, ExternalLink } from "lucide-react";
import { Section } from "@/components/shared/section";
import { certifications } from "@/data/certifications";

export function CertificationSection() {
  return (
    <Section eyebrow="Credentials" title="Certifications">
      <div className="flex flex-wrap gap-3">
        {certifications.map((cert) => (
          <a
            key={cert.title}
            href={cert.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-primary"
          >
            <Award className="h-4 w-4 text-primary" />
            <span className="font-medium">{cert.title}</span>
            <span className="text-muted-foreground tabular-nums">{cert.date}</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        ))}
      </div>
    </Section>
  );
}
