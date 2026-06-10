import { HeroSection } from "../components/shared/hero-section";
import { ContactForm } from "../components/shared/contact-form";
import { ProjectsSection } from "../components/shared/projects-section";
import { WorkSection } from "../components/shared/work-section";
import { CertificationSection } from "@/components/shared/certifications";

export function Home() {
    return (
        <div className="relative z-10">
            <HeroSection />
            <WorkSection />
            <CertificationSection />
            <ProjectsSection />
            <ContactForm />
        </div>
    )
}
