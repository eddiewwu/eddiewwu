import { Section } from "@/components/shared/section";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { AvatarImage } from "../ui/avatar";
import { workExperience } from "@/data/work";

export function WorkSection() {
  return (
    <Section eyebrow="Experience" title="Work Experience">
      <div className="space-y-12 border-l border-border pl-6 ml-2">
        {workExperience.map((job, index) => (
          <div key={index} className="relative">
            <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={job.avatar} className="object-contain" />
                  <AvatarFallback>{job.company[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-foreground leading-tight">
                    {job.position}
                    <span className="text-muted-foreground font-normal"> · {job.company}</span>
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">{job.duration}</p>
            </div>
            <ul className="mt-4 space-y-2">
              {job.responsibilities.map((item, i) => (
                <li key={i} className="text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1.5 text-[8px]">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default WorkSection;
