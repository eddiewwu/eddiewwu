import "./index.css";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { Header } from "./components/layout/header";
import { Footer } from "./components/layout/footer";
import { Home } from "./pages/Home";
import { AuthCallback } from "./pages/auth-callback";
import { useAuth } from "./hooks/useAuth";

export function App() {
  const { user, logout } = useAuth();

  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Header user={user} onLogout={logout} />

          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              {/* <Route path="/login" element={<LoginPage />} /> */}
              
              {/* OAuth callback routes */}
              <Route path="/auth/callback/google" element={<AuthCallback />} />
              
              {/* Protected routes */}
              {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
              
              {/* 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        <Footer />
      </ThemeProvider>
    </Router>
  );
}

export default App;
