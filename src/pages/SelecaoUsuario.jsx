/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { UserCheck, ShieldCheck, ArrowRight, Building2, Lock, Loader2, ChevronLeft } from "lucide-react";

const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;
const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";

export default function SelecaoUsuario({ onSelectUser }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Busca os usuários da planilha ao carregar o componente
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const url = `${API_URL}?token=${TOKEN}&sheet=usuarios`;
        const response = await fetch(url);
        const data = await response.json();
        
        const usersFormatados = data.map(user => ({
          ...user,
          color: user.cargo?.toLowerCase().includes("síndico") ? "#16a34a" : "#3b82f6",
          bg: user.cargo?.toLowerCase().includes("síndico") ? "#f0fdf4" : "#eff6ff",
          icon: user.cargo?.toLowerCase().includes("síndico") ? <ShieldCheck size={32} /> : <UserCheck size={32} />
        }));

        setUsuarios(usersFormatados);
      } catch (err) {
        console.error("Erro ao carregar usuários:", err);
        setError("Não foi possível carregar a lista de usuários.");
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchUsuarios();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password || !selectedProfile || loading) return;

    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      token: TOKEN,
      action: "login",
      email: selectedProfile.email,
      senha: password
    });

    try {
      const url = `${API_URL}?${params.toString()}`;
      const response = await fetch(url, { method: "GET", mode: "cors", redirect: "follow" });
      const result = await response.json();

      if (result.success) {
        // --- AJUSTE CRUCIAL AQUI ---
        // Combinamos os dados do perfil (nome, cargo) com os dados vindos do login
        const usuarioCompleto = { ...selectedProfile, ...result.data };
        
        // Salvamos no LocalStorage para que outros componentes (como Unidades) saibam quem logou
        localStorage.setItem("user", JSON.stringify(usuarioCompleto));
        
        // Avisa o App.js que o usuário logou
        onSelectUser(usuarioCompleto);
      } else {
        setError(result.message || "Credenciais incorretas.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={40} className="spinner-anim" color="#3b82f6" />
          <p style={{ marginTop: "10px", color: "#64748b" }}>Carregando perfis...</p>
        </div>
        <style>{`.spinner-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={logoIconStyle}>
            <Building2 size={40} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: "10px 0" }}>
            Novo Recreio
          </h1>
          <p style={{ color: "#64748b", fontSize: "16px" }}>
            {selectedProfile ? "Digite sua senha" : "Selecione seu perfil"}
          </p>
        </div>

        {!selectedProfile ? (
          <div style={gridStyle}>
            {usuarios.length === 0 && !error && <p style={{textAlign: 'center'}}>Nenhum usuário encontrado.</p>}
            {usuarios.map((user, index) => (
              <div
                key={user.email || index}
                onMouseEnter={() => setHovered(user.email)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelectedProfile(user)}
                style={{
                  ...userCardStyle,
                  borderColor: hovered === user.email ? user.color : "#e2e8f0",
                  transform: hovered === user.email ? "translateY(-5px)" : "translateY(0)",
                  boxShadow: hovered === user.email ? `0 10px 20px -5px ${user.color}33` : "none",
                }}
              >
                <div style={{ ...iconWrapperStyle, backgroundColor: user.bg, color: user.color }}>
                  {user.icon}
                </div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>{user.nome}</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{user.cargo}</p>
                </div>
                <ArrowRight size={20} color={hovered === user.email ? user.color : "#cbd5e1"} style={{ transition: "0.3s" }} />
              </div>
            ))}
            {error && <p style={{...errorStyle, textAlign: 'center'}}>{error}</p>}
          </div>
        ) : (
          <form onSubmit={handleLogin} style={formStyle}>
            <div onClick={() => { setSelectedProfile(null); setPassword(""); setError(""); }} style={backButtonStyle}>
              <ChevronLeft size={16} /> Voltar para perfis
            </div>

            <div style={passwordCardStyle}>
              <div style={{ ...smallIconStyle, backgroundColor: selectedProfile.bg, color: selectedProfile.color }}>
                {selectedProfile.icon}
              </div>
              <p style={{ fontWeight: "600", marginBottom: "20px", color: "#1e293b" }}>
                Olá, {selectedProfile.nome}!
              </p>

              <div style={inputWrapperStyle}>
                <Lock size={18} color="#94a3b8" style={{ marginLeft: "12px" }} />
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  style={inputStyle}
                  required
                />
              </div>

              {error && <p style={errorStyle}>{error}</p>}

              <button type="submit" disabled={loading} style={{ ...submitButtonStyle, backgroundColor: selectedProfile.color, opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={20} className="spinner-anim" /> : "Entrar no Sistema"}
              </button>
            </div>
          </form>
        )}
        <p style={footerNote}>Sistema Interno de Gestão Condominial &copy; 2026</p>
      </div>
      <style>{`.spinner-anim { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ESTILOS
const containerStyle = { height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" };
const contentStyle = { width: "100%", maxWidth: "420px", padding: "20px" };
const logoIconStyle = { width: "70px", height: "70px", backgroundColor: "white", borderRadius: "20px", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" };
const gridStyle = { display: "flex", flexDirection: "column", gap: "16px" };
const userCardStyle = { backgroundColor: "white", padding: "18px", borderRadius: "16px", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", gap: "18px", cursor: "pointer", transition: "all 0.3s ease" };
const iconWrapperStyle = { width: "60px", height: "60px", borderRadius: "14px", display: "flex", justifyContent: "center", alignItems: "center" };
const formStyle = { display: "flex", flexDirection: "column", gap: "10px" };
const passwordCardStyle = { backgroundColor: "white", padding: "30px", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", textAlign: "center" };
const backButtonStyle = { display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "13px", cursor: "pointer", marginBottom: "10px", width: "fit-content" };
const smallIconStyle = { width: "50px", height: "50px", borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 15px auto" };
const inputWrapperStyle = { display: "flex", alignItems: "center", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "20px" };
const inputStyle = { border: "none", background: "none", padding: "14px", flex: 1, outline: "none", fontSize: "15px", color: "#1e293b" };
const submitButtonStyle = { width: "100%", padding: "14px", borderRadius: "12px", border: "none", color: "white", fontWeight: "700", fontSize: "15px", cursor: "pointer", display: "flex", justifyContent: "center" };
const errorStyle = { color: "#ef4444", fontSize: "13px", marginBottom: "15px", fontWeight: "500" };
const footerNote = { textAlign: "center", marginTop: "40px", fontSize: "12px", color: "#94a3b8" };