import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ContactUs from "./pages/ContactUs";

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            <span className="text-xl font-bold text-primary-dark">Parlay Bets</span>
          </Link>
          
          <div className="flex gap-6">
            <Link 
              to="/" 
              className={`font-semibold transition-colors ${
                location.pathname === "/" 
                  ? "text-primary-main" 
                  : "text-gray-600 hover:text-primary-main"
              }`}
            >
              🏠 Inicio
            </Link>
            <Link 
              to="/contact" 
              className={`font-semibold transition-colors ${
                location.pathname === "/contact" 
                  ? "text-primary-main" 
                  : "text-gray-600 hover:text-primary-main"
              }`}
            >
              📞 Contacto
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

