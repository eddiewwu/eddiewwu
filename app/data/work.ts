export interface WorkExperience {
  avatar: string;
  company: string;
  position: string;
  duration: string;
  responsibilities: string[];
}

export const workExperience: WorkExperience[] = [
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
      "Built a wiki-style developer portal in Python using Dockerized images to standardize onboarding and development workflows for 20+ engineers, saving 3 hours/week in repetitive setup tasks.",
    ],
  },
];
