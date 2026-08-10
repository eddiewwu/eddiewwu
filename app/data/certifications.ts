export interface Certification {
  title: string;
  issuer: string;
  date: string;
  link: string;
}

export const certifications: Certification[] = [
  {
    title: "AWS Certified Developer – Associate",
    issuer: "Amazon Web Services",
    date: "Apr 2024",
    link: "https://www.credly.com/badges/de8a3671-dbab-430e-86d6-e4d95f164568",
  },
  {
    title: "AWS Certified Solutions Architect – Associate",
    issuer: "Amazon Web Services",
    date: "Sept 2024",
    link: "https://www.credly.com/badges/77fe8174-82a7-45d5-b83f-03294fe7f91d",
  },
  {
    title: "AWS Certified Solutions Architect – Professional",
    issuer: "Amazon Web Services",
    date: "Aug 2026",
    link: "https://www.credly.com/badges/5d87875a-4582-465d-9fbe-74b0d407b3f7",
  },
];
