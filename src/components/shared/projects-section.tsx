import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink, Folder } from "lucide-react";

const projects = [
  {
    title: "Personal Portfolio Website",
    description: "Wanted to learn more about Bun + Shadcn + Tailwind CSS, so I built my personal portfolio website from scratch using these technologies.",
    technologies: ["Typescript","React", "Bun", "Shadcn", "Tailwind CSS", "OAuth2.0"],
    github: "https://github.com/eddiewwu/eddiewwu",
    liveDemo: "https://eddiewwu.dev"
  }
];

export function ProjectsSection() {
  return (
    <section className="w-full py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
            <Folder size={36} />
            My Projects
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <CardHeader>
                <CardTitle className="text-foreground text-xl">{project.title}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 flex-grow flex flex-col">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Technologies:</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, i) => (
                      <span 
                        key={i}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-auto pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    asChild
                  >
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <Github size={18} />
                      Code
                    </a>
                  </Button>
                  <Button 
                    className="flex-1"
                    asChild
                  >
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
      </div>
    </section>
  );
}

export default ProjectsSection;
