import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar } from "lucide-react";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { AvatarImage } from "../ui/avatar";

const workExperience = [
  {
    avatar: "https://goodneighborcenter.statefarm.com/images/globals/sf-logo-nav.svg",
    company: "State Farm",
    position: "Software Engineer",
    duration: "Jun 2024 - Present",
    responsibilities: [
      "Migrated 40+ Java enterprise applications from a legacy platform to AWS using Terraform and Kubernetes.",
      "Implemented connection pooling and introduced a caching layer across 10+ services, reducing query execution times from 45s to under 1s and P50 latency from 450ms to 200ms.",
      "Led migration of GitLab CI pipelines to GitLab CI Component Pipelines across 40+ applications, cutting pipeline execution time from 20 minutes to under 10 minutes.",
      "Developed 3 shared API library packages in Node.js and Java, adopted by 40+ applications, reducing code duplication by 30% and improving maintainability across 2 other teams.",
      "Built a wiki-style developer portal in Python using Dockerized images to standardize onboarding and development workflows for 20+ engineers, saving 3 hours/week in repetitive setup tasks."
    ]
  }
];

export function WorkSection() {
  return (
    <section className="w-full py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
            <Briefcase size={36} />
            Work Experience
          </h2>
        </div>

        <div className="space-y-6">
          {workExperience.map((job, index) => (
            <Card key={index} className="transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4"> 
                      <Avatar className="h-12 w-12 shrink-0"> {/* Added size and shrink-0 */}
                        <AvatarImage src={job.avatar} className="object-contain" />
                        <AvatarFallback>{job.company[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="text-left">
                        <CardTitle className="text-foreground text-2xl">{job.position}</CardTitle>
                        <CardDescription className="text-base mt-1">{job.company}</CardDescription>
                      </div>
                    </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar size={16} />
                    {job.duration}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-foreground font-semibold mb-3 text-left">Key Responsibilities:</h4>
                  <ul className="space-y-2 text-left">
                    {job.responsibilities.map((responsibility, i) => (
                      <li key={i} className="text-muted-foreground flex items-start gap-3">
                        <span>• {responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WorkSection;
