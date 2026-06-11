import { HeroSection } from "../components/shared/hero-section";
import { ContactSection } from "../components/shared/contact-section";
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
            <ContactSection />
        </div>
    )
}
