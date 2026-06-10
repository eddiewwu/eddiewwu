import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink } from "lucide-react";
import { Section } from "@/components/shared/section";
import { projects } from "@/data/projects";

export function ProjectsSection() {
  return (
    <Section eyebrow="Projects" title="Selected Work">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, index) => (
          <Card
            key={index}
            className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
          >
            <CardHeader>
              <CardTitle className="text-foreground text-xl">{project.title}</CardTitle>
              <CardDescription className="leading-relaxed">{project.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 flex-grow flex flex-col">
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
              </div>

              <div className="flex gap-3 mt-auto pt-4">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    <Github size={18} />
                    Code
                  </a>
                </Button>
                <Button className="flex-1" asChild>
                  <a href={project.liveDemo} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                    <ExternalLink size={18} />
                    Demo
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export default ProjectsSection;
