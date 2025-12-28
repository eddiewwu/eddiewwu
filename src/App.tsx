import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Home } from "@/pages/Home";
import './App.css'


function App() {

  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
          <Header />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                
                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          <Footer />
        </ThemeProvider>
    </Router>
  )
}

export default App
