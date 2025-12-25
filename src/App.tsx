import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APITester } from "./APITester";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import { ThemeProvider } from "./components/theme-provider";
import { Header } from "./custom-components/header";
import { Footer } from "./custom-components/footer";
import { HeroSection } from "./custom-components/hero-section";
import { ContactForm } from "./custom-components/contact-form";
import { ProjectsSection } from "./custom-components/projects-section";
import { WorkSection } from "./custom-components/work-section";

export function App() {

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Header />
      <div className="container mx-auto p-8 text-center relative z-10">
        {/* Hero Section Component */}
        <HeroSection />

        {/* Work Section Component */}
        <WorkSection />

        {/* Projects Section Component */}
        <ProjectsSection />

        {/* Contact Form Component */}
        <ContactForm />
      </div>
      <Footer />
    </ThemeProvider>
  );
}

export default App;
