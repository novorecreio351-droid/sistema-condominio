/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, createContext, useContext } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Unidades from "./pages/Unidades";
import Moradores from "./pages/Moradores"; 
import Vagas from "./pages/Vagas"; 
import Festas from "./pages/Festas"; // Importação da nova página
import SelecaoUsuario from "./pages/SelecaoUsuario";

// 1. Criação do Contexto de Tema
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const salvo = localStorage.getItem("usuarioLogado");
    return salvo ? JSON.parse(salvo) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "Dashboard";
  });

  // 2. Estado do Dark Mode
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Cores Dinâmicas
  const theme = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    mainBg: isDark ? "#1e293b" : "#ffffff",
    text: isDark ? "#f8fafc" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#334155" : "#e2e8f0",
    isDark
  };

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
    localStorage.setItem("darkMode", isDark);
  }, [activeTab, isDark]);

  useEffect(() => {
    if (usuarioLogado) {
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
      localStorage.setItem("user", JSON.stringify(usuarioLogado));
    } else {
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("user");
    }
  }, [usuarioLogado]);

  const toggleTheme = () => setIsDark(!isDark);
  
  const handleLogout = () => {
    setUsuarioLogado(null);
    setActiveTab("Dashboard");
  };

  if (!usuarioLogado) {
    return <SelecaoUsuario onSelectUser={(user) => setUsuarioLogado(user)} />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div style={{ ...appLayout, backgroundColor: theme.bg, color: theme.text }}>
        <Sidebar 
          active={activeTab} 
          setActive={setActiveTab} 
          user={usuarioLogado} 
          onLogout={handleLogout} 
        />

        <main style={mainContent}>
          {/* ROTEAMENTO DAS PÁGINAS */}
          {activeTab === "Dashboard" && <Dashboard user={usuarioLogado} />}
          {activeTab === "Unidades" && <Unidades />}
          {activeTab === "Moradores" && <Moradores user={usuarioLogado} />}
          {activeTab === "Vagas" && <Vagas user={usuarioLogado} />}
          {activeTab === "Festas" && <Festas user={usuarioLogado} />} 
        </main>
      </div>
    </ThemeContext.Provider>
  );
}

/* ================= ESTILOS ================= */
const appLayout = {
  display: "flex",
  minHeight: "100vh",
  width: "100%",
  transition: "background-color 0.3s ease",
};

const mainContent = {
  flex: 1,
  height: "100vh",
  overflowY: "auto",
  padding: "20px",
};