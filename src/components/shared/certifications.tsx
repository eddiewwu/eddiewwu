import { ExternalLink, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const certifications = [
  {
    title: "AWS Certified Developer – Associate",
    issuer: "Amazon Web Services",
    date: "Apr 2024",
    description: "Validation of technical expertise in developing and maintaining applications on AWS.",
    tags: ["AWS", "Developer"],
    link: "https://cp.certmetrics.com/amazon/en/public/verify/credential/469e04bc0dd244c0bc543cc9d2780f8e",
  },
  {
    title: "AWS Certified Solutions Architect – Associate",
    issuer: "Amazon Web Services",
    date: "Sept 2024",
    description: "Validation of technical expertise in developing and maintaining applications on AWS.",
    tags: ["AWS", "Solutions Architect"],
    link: "https://cp.certmetrics.com/amazon/en/public/verify/credential/0d950334eca3480786a8f5c40f3b1df7",
  }
];

export function CertificationSection() {
  return (
    <section className="py-12 space-y-8">
      <div className="flex items-center gap-2 mb-8">
        <Award className="w-6 h-6 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Certifications</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {certifications.map((cert, index) => (
          <Card key={index} className="flex flex-col transition-all hover:shadow-md border-muted/50">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{cert.title}</CardTitle>
                  <CardDescription className="text-left font-medium text-primary">
                    {cert.issuer}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="whitespace-nowrap flex gap-1">
                  <Calendar className="w-3 h-3" />
                  {cert.date}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {cert.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {cert.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] uppercase tracking-wider">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Button variant="ghost" size="sm" className="w-full mt-2 group border border-dashed hover:border-solid" asChild>
                <a href={cert.link} target="_blank" rel="noopener noreferrer">
                  Verify Credentials
                  <ExternalLink className="ml-2 w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}