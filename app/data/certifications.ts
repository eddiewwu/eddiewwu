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
    link: "https://cp.certmetrics.com/amazon/en/public/verify/credential/469e04bc0dd244c0bc543cc9d2780f8e",
  },
  {
    title: "AWS Certified Solutions Architect – Associate",
    issuer: "Amazon Web Services",
    date: "Sept 2024",
    link: "https://cp.certmetrics.com/amazon/en/public/verify/credential/0d950334eca3480786a8f5c40f3b1df7",
  },
];
