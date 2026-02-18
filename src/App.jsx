/* eslint-disable react-hooks/exhaustive-deps */
 
/* eslint-disable react-refresh/only-export-components */
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import React, { useState, useEffect, createContext, useContext } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Unidades from "./pages/Unidades";
import Moradores from "./pages/Moradores"; 
import Vagas from "./pages/Vagas"; 
import Festas from "./pages/Festas";
import Churrasqueira from "./pages/Churrasqueira";
import SelecaoUsuario from "./pages/SelecaoUsuario";
import Mudancas from "./pages/Mudancas";
import Calendario from "./pages/Calendario";
import Compras from "./pages/Compras";
import Aprovacao from "./pages/Aprovacao";

// ================= CONTEXTO DE TEMA =================
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export default function App() {

  // ⏱️ tempo limite (2 horas)
  const TEMPO_LIMITE = 2 * 60 * 60 * 1000;

  // ================= USUÁRIO LOGADO =================
const [usuarioLogado, setUsuarioLogado] = useState(() => {
  // Alterado de localStorage para sessionStorage
  const salvo = sessionStorage.getItem("usuarioLogado"); 
  return salvo ? JSON.parse(salvo) : null;
});

  // ================= ABA ATIVA =================
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "Dashboard";
  });

  // ================= DARK MODE =================
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // ================= TEMA DINÂMICO =================
  const theme = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    mainBg: isDark ? "#1e293b" : "#ffffff",
    text: isDark ? "#f8fafc" : "#1e293b",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "#334155" : "#e2e8f0",
    isDark
  };

  // ================= SALVAR PREFERÊNCIAS =================
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
    localStorage.setItem("darkMode", isDark);
  }, [activeTab, isDark]);

  // ================= SALVAR USUÁRIO =================
  useEffect(() => {
  if (usuarioLogado) {
    // Agora salvando no sessionStorage
    sessionStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));
    sessionStorage.setItem("user", JSON.stringify(usuarioLogado));
    sessionStorage.setItem("ultimoAcesso", Date.now());
  } else {
    // Removendo do sessionStorage
    sessionStorage.removeItem("usuarioLogado");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("ultimoAcesso");
  }
}, [usuarioLogado]);

  const toggleTheme = () => setIsDark(!isDark);

const handleLogout = () => {
  setUsuarioLogado(null);
  setActiveTab("Dashboard");
  sessionStorage.clear(); // Opcional: limpa tudo do usuário ao deslogar
};

  // ================= ATUALIZA ATIVIDADE =================
const atualizarAtividade = () => {
  sessionStorage.setItem("ultimoAcesso", Date.now()); // Alterado para sessionStorage
};

  // ================= VERIFICA EXPIRAÇÃO =================
  useEffect(() => {
    if (!usuarioLogado) return;

    const verificarSessao = () => {
  // ALTERADO: de localStorage para sessionStorage
  const ultimoAcesso = sessionStorage.getItem("ultimoAcesso"); 
  if (!ultimoAcesso) return;

  const tempoParado = Date.now() - Number(ultimoAcesso);

  if (tempoParado > TEMPO_LIMITE) {
    alert("Sua sessão expirou. Faça login novamente.");
    handleLogout();
  }
};

    // verifica a cada 30s
    const interval = setInterval(verificarSessao, 30000);

    // eventos de interação
    const eventos = ["click", "mousemove", "keydown", "scroll", "touchstart"];

    eventos.forEach(evento =>
      window.addEventListener(evento, atualizarAtividade)
    );

    return () => {
      clearInterval(interval);
      eventos.forEach(evento =>
        window.removeEventListener(evento, atualizarAtividade)
      );
    };
  }, [usuarioLogado]);

  // ================= VERIFICA AO ABRIR O APP =================
  useEffect(() => {
    const ultimoAcesso = sessionStorage.getItem("ultimoAcesso"); 
  if (!ultimoAcesso) return;

  if (Date.now() - Number(ultimoAcesso) > TEMPO_LIMITE) {
    handleLogout();
  }
}, []);

  // 1. Não esqueça de importar no topo do arquivo:
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ================= APP PRINCIPAL COM ROTAS =================
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router> 
        {!usuarioLogado ? (
          <Routes>
            <Route path="/login" element={<SelecaoUsuario onSelectUser={setUsuarioLogado} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <div style={{ display: "flex", minHeight: "100vh", width: "100%", backgroundColor: theme.bg, color: theme.text }}>
            <Sidebar active={activeTab} setActive={setActiveTab} user={usuarioLogado} onLogout={handleLogout} />
            
            <main style={{ flex: 1, height: "100vh", overflowY: "auto", padding: "20px" }}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard user={usuarioLogado} />} />
                <Route path="/compras" element={<Compras user={usuarioLogado} />} />
                
                {/* Rotas restritas */}
                {usuarioLogado.cargo !== "Conselheiro" && (
                  <>
                    <Route path="/unidades" element={<Unidades />} />
                    <Route path="/moradores" element={<Moradores user={usuarioLogado} />} />
                    <Route path="/vagas" element={<Vagas user={usuarioLogado} />} />
                    <Route path="/festas" element={<Festas user={usuarioLogado} />} />
                    <Route path="/churrasqueira" element={<Churrasqueira user={usuarioLogado} />} />
                    <Route path="/mudancas" element={<Mudancas user={usuarioLogado} />} />
                    <Route path="/calendario" element={<Calendario user={usuarioLogado} />} />
                    <Route path="/aprovacao" element={<Aprovacao user={usuarioLogado} />} />
                  </>
                )}

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        )}
      </Router>
    </ThemeContext.Provider>
  );
}