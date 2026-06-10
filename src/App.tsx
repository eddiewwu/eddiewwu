import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Home } from "@/pages/Home";
import { Blog } from "@/pages/Blog";
import Particles from "@/components/Particles";
import './App.css'
import { CollabEditor } from "./pages/CollabEditor";
import { AuthProvider } from "@/context/useAuthContext";

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
       <Particles
        particleColors={['#ffffff', '#ffffff']}
        particleCount={200}
        particleSpread={10}
        speed={0.1}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={false}
        disableRotation={false}
      />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <AuthProvider>
          <Router>
            <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/collaborate" element={<CollabEditor />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </ThemeProvider>
          </Router>
        </AuthProvider>
      </div>
    </div>
  );
}

export default App
