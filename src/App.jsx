import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Customers from "./components/Customers";
import Policies from "./components/Policies";
import Agencies from "./components/Agencies";
import InsuranceCompanies from "./components/InsuranceCompanies";
import Accounts from "./components/Accounts";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("role") || null;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) {
      setIsLoggedIn(false);
      setUserRole(null);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        navigate('/login');
      }
    } else {
      setIsLoggedIn(true);
      setUserRole(role);
    }
  }, [navigate]);

  const handleLogin = (token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setIsLoggedIn(true);
    setUserRole(role);
    navigate("/customers");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/login");
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Korumalı route bileşeni
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <div className="App">
      <header>
        <div className="header-content">
          <h1>Sigorta Acentesi</h1>
          {isLoggedIn && (
            <button className="menu-toggle" onClick={toggleMenu}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}
        </div>
        {isLoggedIn ? (
          <nav className={menuOpen ? "active" : ""}>
            <Link to="/accounts">
              <span className="nav-icon">💰</span>
              Finansal İşlemler
            </Link>
            <Link to="/customers">
              <span className="nav-icon">👥</span>
              Müşteriler
            </Link>
            <Link to="/policies">
              <span className="nav-icon">📝</span>
              Poliçeler
            </Link>
            <Link to="/agencies">
              <span className="nav-icon">🏢</span>
              Acenteler
            </Link>
            <Link to="/insurance-companies">
              <span className="nav-icon">🏪</span>
              Sigorta Şirketleri
            </Link>
            <button onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              Çıkış
            </button>
          </nav>
        ) : (
          <nav>
            <Link to="/login">Giriş</Link>
            <Link to="/register">Kayıt</Link>
          </nav>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Customers  />
              </ProtectedRoute>
            }
          />
          <Route
            path="/policies"
            element={
              <ProtectedRoute>
                <Policies  />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agencies"
            element={
              <ProtectedRoute>
                <Agencies  />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insurance-companies"
            element={
              <ProtectedRoute>
                <InsuranceCompanies  />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <Accounts  />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={<Navigate to={isLoggedIn ? "/accounts" : "/login"} />}
          />
        </Routes>
      </main>

      <footer>
        <p>© 2024 Sigorta Acentesi Yazılımı</p>
      </footer>
    </div>
  );
}

export default App;
