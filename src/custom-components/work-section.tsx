import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar } from "lucide-react";

const workExperience = [
  {
    company: "State Farm",
    position: "Software Engineer",
    duration: "Jun 2024 - Present",
    description: "Software Engineer on the B2B Team responsible for customer-facing applications and internal tools.",
    responsibilities: [
      "Migrated 40+ Java enterprise applications from a legacy platform(Technical Platform) to AWS using Terraform and Kubernetes, enabling infrastructure automation and improving scalability within a 5 month timeframe.",
      "Developed 3 shared API library packages in Node.js and Java, adopted by 40+ applications, reducing code duplication by 30% and improving maintainability across 2 other teams.",
      "Reduced deployment times by up to 50% across 40+ applications by rewriting CI/CD scripts, streamlining template stages, and eliminating redundant jobs in GitLab, enabling teams to release features 2 times more frequently.",
      "Led 3 interns to develop a proof of concept consolidating 1,000+ accounts into single sign-on, reducing redundant logins by 90% and improving customer experience."
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
            <Card 
              key={index}
              className="transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-left">
                    <CardTitle className="text-foreground text-2xl">{job.position}</CardTitle>
                    <CardDescription className="text-base mt-1">{job.company}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar size={16} />
                    {job.duration}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-foreground text-left">{job.description}</p>
                
                <div>
                  <h4 className="text-foreground font-semibold mb-3 text-left">Key Responsibilities:</h4>
                  <ul className="space-y-2 text-left">
                    {job.responsibilities.map((responsibility, i) => (
                      <li key={i}
                        className="text-muted-foreground flex items-start gap-3"
                      >
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
