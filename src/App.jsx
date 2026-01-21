import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import HousePortal from "./pages/HousePortal";
import LoginForm from "./components/LoginForm";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'admin'

  // Si está autenticado, mostrar el portal de la casa
  if (isAuthenticated) {
    return <HousePortal />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Parlay Bets</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🎲 Apuestas
              </button>
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'admin'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                👔 Admin B2B
              </button>
              <button
                onClick={() => setCurrentView('login')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'login'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🏠 Portal Casa
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {currentView === 'home' && <Home />}
      {currentView === 'admin' && <Admin />}
      {currentView === 'login' && <LoginForm onSuccess={() => {}} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

