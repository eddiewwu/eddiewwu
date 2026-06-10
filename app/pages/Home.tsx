import { HeroSection } from "../components/shared/hero-section";
import { ContactForm } from "../components/shared/contact-form";
import { ProjectsSection } from "../components/shared/projects-section";
import { WorkSection } from "../components/shared/work-section";
import { CertificationSection } from "@/components/shared/certifications";

export function Home() {
    return (
        <div className="container mx-auto p-8 text-center relative z-10">
            {/* Hero Section Component */}
            <HeroSection />

            {/* Work Section Component */}
            <WorkSection />

            {/* Certifications Section Component */}
            <CertificationSection />

            {/* Projects Section Component */}
            <ProjectsSection />

            {/* Contact Form Component */}
            <ContactForm />
      </div>
    )
}