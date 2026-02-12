/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Car, 
  Waves, 
  CalendarDays, 
  Flame, 
  Truck, 
  CircleDollarSign, 
  FileText, 
  ShoppingCart,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "../App"; 

export default function Sidebar({ active, setActive, user, onLogout }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Atualiza estado de mobile quando redimensiona
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderItem = (label, Icon) => {
    const isActive = active === label;
    const activeBg = theme.isDark ? "#0369a133" : "#e0f2fe";
    const activeText = theme.isDark ? "#38bdf8" : "#0369a1";
    const hoverBg = theme.isDark ? "#334155" : "#f1f5f9";

    return (
      <li
        key={label}
        onClick={() => { setActive(label); setMobileOpen(false); }} 
        style={{
          ...itemStyle,
          backgroundColor: isActive ? activeBg : "transparent",
          color: isActive ? activeText : theme.textSecondary,
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = hoverBg; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <span style={iconSpace}>
          <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
        </span>
        {label}
      </li>
    );
  };

  const inicial = user?.nome ? user.nome.charAt(0).toUpperCase() : "U";

  return (
    <>
      {/* BOTÃO HAMBURGER */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 2000 }}>
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            <span style={{ fontSize: '24px', color: theme.text }}>☰</span>
          </button>
        </div>
      )}

      {/* OVERLAY MOBILE */}
      {isMobile && mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 1400
          }}
        />
      )}

      {/* SIDEBAR */}
      <div style={{
        ...sidebarContainer,
        backgroundColor: theme.bg,
        borderRight: `1px solid ${theme.border}`,
        transform: isMobile ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
        position: isMobile ? "fixed" : "sticky",
        top: 0,
        zIndex: isMobile ? 1500 : "auto",
      }}>
        {/* LOGO */}
        <div style={{ ...logoContainer, backgroundColor: theme.isDark ? "#0369a133" : "#e0f2fe" }}>
          <span style={logoIconStyle}>
            <Building2 size={22} color={theme.isDark ? "#38bdf8" : "#0369a1"} />
          </span>
          <h2 style={{ ...logoText, color: theme.isDark ? "#38bdf8" : "#0369a1" }}>Novo Recreio</h2>
        </div>

        {/* NAVEGAÇÃO */}
        <nav style={navStyle}>
          <p style={categoryTitle}>Principal</p>
          <ul style={listStyle}>
            {renderItem("Dashboard", LayoutDashboard)}
            {renderItem("Unidades", Building2)}
            {renderItem("Moradores", Users)}
            {renderItem("Vagas", Car)}
            {renderItem("Piscina", Waves)}
          </ul>

          <p style={categoryTitle}>Agendamentos</p>
          <ul style={listStyle}>
            {renderItem("Salão de Festas", CalendarDays)}
            {renderItem("Churrasqueira", Flame)}
            {renderItem("Mudanças", Truck)}
          </ul>

          <p style={categoryTitle}>Gestão Financeira</p>
          <ul style={listStyle}>
            {renderItem("Inadimplentes", CircleDollarSign)}
            {renderItem("Notas", FileText)}
            {renderItem("Compras", ShoppingCart)}
          </ul>
        </nav>

        {/* PERFIL DO USUÁRIO */}
        <div style={userProfile} ref={menuRef}>
          {showUserMenu && (
            <div style={{ ...floatingMenu, backgroundColor: theme.mainBg, borderColor: theme.border }}>
              <div style={menuHeader}>
                <strong style={{ color: theme.text }}>{user?.nome}</strong>
                <span style={{ fontSize: '11px', color: theme.textSecondary }}>{user?.cargo}</span>
              </div>
              <hr style={{ ...divider, borderTop: `1px solid ${theme.border}` }} />
              
              <div 
                style={{ ...menuItem, color: theme.text }} 
                onClick={() => { toggleTheme(); setShowUserMenu(false); }}
              >
                {theme.isDark ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} />} 
                {theme.isDark ? "Modo Claro" : "Modo Escuro"}
              </div>

              <div style={{ ...menuItem, color: '#ef4444' }} onClick={onLogout}>
                <LogOut size={16} /> Sair do Sistema
              </div>
            </div>
          )}
          
          <div 
            style={{
              ...avatar, 
              backgroundColor: user?.id === 'josimar' ? '#16a34a' : '#3b82f6',
              cursor: 'pointer'
            }} 
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {inicial}
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= ESTILOS ================= */

const sidebarContainer = {
  width: "260px",
  height: "100vh",
  padding: "24px 16px",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  transition: "transform 0.3s ease",
  overflow: "hidden" // evita que a barra de scroll quebre o layout
};

const logoContainer = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 15px",
  borderRadius: "12px",
  marginBottom: "32px",
  transition: "all 0.3s ease"
};

const logoIconStyle = { display: "flex", alignItems: "center", justifyContent: "center" };
const logoText = { fontSize: "18px", fontWeight: "700", margin: 0 };

const navStyle = { 
  flex: 1,
  overflowY: "auto", // permite scroll vertical quando necessário
  paddingRight: "4px"
};

const categoryTitle = { fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: "600", letterSpacing: "0.5px", marginBottom: "12px", marginTop: "20px" };
const listStyle = { listStyle: "none", padding: 0, margin: 0 };
const itemStyle = { display: "flex", alignItems: "center", padding: "10px 12px", cursor: "pointer", borderRadius: "8px", fontSize: "14px", fontWeight: "500", transition: "all 0.2s", marginBottom: "4px" };
const iconSpace = { marginRight: "12px", display: "flex", alignItems: "center", justifyContent: "center" };

const userProfile = { 
  marginTop: "auto", 
  paddingTop: "20px", 
  position: "relative",
  display: "flex",
  justifyContent: "flex-start"
};

const avatar = {
  width: "40px",
  height: "40px",
  color: "white",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: "16px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
};

const floatingMenu = {
  position: "absolute",
  bottom: "70px",
  left: "0",
  width: "180px",
  borderRadius: "12px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
  border: "1px solid",
  padding: "8px",
  zIndex: 100
};

const menuHeader = { padding: "8px 12px", display: "flex", flexDirection: "column" };
const divider = { margin: "8px 0", border: "0" };
const menuItem = { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", fontSize: "13px", cursor: "pointer", borderRadius: "8px", transition: "0.2s" };
