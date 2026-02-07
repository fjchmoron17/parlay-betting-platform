import { AuthProvider, useAuth } from "./context/AuthContext";
import Admin from "./pages/Admin";
import HousePortal from "./pages/HousePortal";
import ConsultTicket from "./pages/ConsultTicket";
import AffiliateSignup from "./pages/AffiliateSignup";
import ResetPassword from "./pages/ResetPassword";
import LoginForm from "./components/LoginForm";

function AppContent() {
  const { isAuthenticated, isSuperAdmin, user, logout, loading } = useAuth();
  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");

  if (pathname.startsWith("/consulta-ticket") || view === "consulta-ticket") {
    return <ConsultTicket />;
  }

  if (pathname.startsWith("/afilia") || pathname.startsWith("/registro") || view === "afilia") {
    return <AffiliateSignup />;
  }

  if (pathname.startsWith("/reset") || pathname.startsWith("/recuperar") || view === "reset") {
    return <ResetPassword />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Cargando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Parlay Bets</h1>
              <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                👑 Super Admin
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>Sesión: {user?.username}</span>
              <button
                onClick={logout}
                className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </nav>
        <Admin />
      </div>
    );
  }

  // Casa de apuestas
  return <HousePortal />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

