import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Home } from "@/pages/Home";
import Particles from "@/components/Particles";
import './App.css'
import { CollabEditor } from "./pages/CollabEditor";
import { useState } from "react";
import type { UserProfile } from "@/types/auth";
import { AuthProvider } from "@/context/useAuthContext";

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  return (
    // The main container needs to be 'relative' or 'fixed'
    <div className="relative min-h-screen w-full overflow-hidden">
      
      {/* BACKGROUND LAYER: The Dots */}
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

      {/* CONTENT LAYER: Everything Else */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <AuthProvider user={userProfile}>
          <Router>
            <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
              <Header onLogin={setToken} onUserProfile={setUserProfile} UserProfile={userProfile} />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/collaborate" element={<CollabEditor token={token} userProfile={userProfile} />} />
                  {/* <Route path="/collaborate" element={<CollabEditor roomId={1} />} /> */}
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
