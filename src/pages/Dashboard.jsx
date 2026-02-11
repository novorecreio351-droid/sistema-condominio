/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useTheme } from "../App";
import {
  Users,
  CalendarCheck,
  AlertCircle,
  ShoppingCart,
  FileText,
  Loader2,
  Clock
} from "lucide-react";

const TOKEN = "NOV0CR818"; 
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";

export default function Dashboard({ user }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ inadimplentes: 0, moradores: 0 });
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  // Função para limpar strings (remove acentos e espaços) para comparação segura
  const normalizeText = (text) => 
    String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [resUnits, resLogs] = await Promise.all([
          fetch(`${SHEETS_URL}?sheet=UNIDADES&token=${TOKEN}`),
          fetch(`${SHEETS_URL}?sheet=log&token=${TOKEN}`)
        ]);

        const dataUnits = await resUnits.json();
        const dataLogs = await resLogs.json();
        
        // Debug para você ver no F12 se os nomes estão batendo
        console.log("User Logado:", user?.nome);
        console.log("Logs Recebidos:", dataLogs);

        if (Array.isArray(dataUnits)) {
          const inad = dataUnits.filter(u => u.status === "Inadimplente").length;
          const morad = dataUnits.filter(u => u.ocupado === "Sim").length;
          setStats({ inadimplentes: inad, moradores: morad });
        }

        if (Array.isArray(dataLogs)) {
          const userNomeNormalizado = normalizeText(user?.nome);

          const filteredLogs = dataLogs
            .filter(log => {
              const logUsuarioNormalizado = normalizeText(log.usuario);
              const modulo = String(log.modulo || "").toUpperCase();
              
              // Filtra pelo seu usuário e esconde logs de sistema/login
              return logUsuarioNormalizado === userNomeNormalizado && 
                     modulo !== "LOGIN" && 
                     modulo !== "SISTEMA";
            })
            .reverse() 
            .slice(0, 4);
          
          setLogs(filteredLogs);
        }
      } catch (err) {
        console.error("Erro no Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    if (user?.nome) fetchData();
  }, [user]);

  return (
    <div style={{ padding: "10px" }}>
      <Header user={user} theme={theme} />
      
      <Cards 
        theme={theme}
        inadimplentes={loading ? "..." : stats.inadimplentes} 
        moradores={loading ? "..." : stats.moradores}
      />
      
      <div style={contentGrid}>
        <RecentActivities logs={logs} loading={loading} theme={theme} />
        <UpcomingBookings theme={theme} />
      </div>
    </div>
  );
}

/* ================= COMPONENTES DE INTERFACE ================= */

function Header({ user, theme }) {
  const primeiroNome = user?.nome ? user.nome.split(' ')[0] : "Usuário";
  return (
    <div style={{ marginBottom: "30px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "700", color: theme.text, marginBottom: "5px" }}>
        Olá, {primeiroNome}! 👋
      </h1>
      <p style={{ color: theme.textSecondary }}>
        Bem-vindo ao sistema. Você está logado como <strong>{user?.cargo || "Colaborador"}</strong>.
      </p>
    </div>
  );
}

function Cards({ inadimplentes, moradores, theme }) {
  return (
    <div style={cardsGrid}>
      <Card theme={theme} title="Unidades Ocupadas" value={moradores} Icon={Users} color="#3b82f6" />
      <Card theme={theme} title="Reservas Ativas" value="12" Icon={CalendarCheck} color="#16a34a" />
      <Card theme={theme} title="Inadimplentes" value={inadimplentes} Icon={AlertCircle} color="#ef4444" />
      <Card theme={theme} title="Compras Pendentes" value="5" Icon={ShoppingCart} color="#ea580c" />
      <Card theme={theme} title="Notas Fiscais" value="14" Icon={FileText} color="#7c3aed" />
    </div>
  );
}

function Card({ title, value, Icon, color, theme }) {
  return (
    <div style={{ ...cardBase, backgroundColor: theme.mainBg, borderColor: theme.border }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: theme.textSecondary, fontSize: "13px", fontWeight: "600" }}>{title}</p>
        <Icon size={18} color={color} />
      </div>
      <h2 style={{ fontSize: "26px", marginTop: "10px", color: theme.text, fontWeight: "700" }}>{value}</h2>
    </div>
  );
}

/* ================= ATIVIDADES RECENTES (ESTILO IMAGEM) ================= */
function RecentActivities({ logs, loading, theme }) {
  
  const formatTime = (dateString) => {
    if (!dateString) return "Recentemente";
    try {
        const [datePart, timePart] = dateString.split(' ');
        const [day, month, year] = datePart.split('/');
        const formattedDate = new Date(`${year}-${month}-${day}T${timePart}`);
        
        const now = new Date();
        const diffInMs = now - formattedDate;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        
        if (isNaN(diffInHours)) return dateString;
        if (diffInHours < 1) return "Agora mesmo";
        if (diffInHours < 24) return `Há ${diffInHours} horas`;
        if (diffInHours < 48) return "Ontem";
        return datePart;
    } catch (e) { return "Recentemente"; }
  };

  const getTagStyle = (modulo) => {
    const base = { fontSize: '11px', padding: '3px 10px', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase' };
    const m = String(modulo).toUpperCase();
    if (m === "UNIDADES") return { ...base, backgroundColor: '#eff6ff', color: '#3b82f6' }; 
    if (m === "FINANCEIRO") return { ...base, backgroundColor: '#f0fdf4', color: '#16a34a' };
    if (m === "RESERVAS") return { ...base, backgroundColor: '#fef3c7', color: '#d97706' };
    return { ...base, backgroundColor: theme.bg, color: theme.textSecondary };
  };

  return (
    <div style={{ ...sectionCard, backgroundColor: theme.mainBg, borderColor: theme.border }}>
      <h3 style={{ ...sectionTitle, color: theme.text }}>Atividades Recentes</h3>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}><Loader2 className="spinner-anim" size={28} color="#3b82f6" /></div>
      ) : logs.length === 0 ? (
        <p style={{ textAlign: 'center', color: theme.textSecondary, padding: '20px', fontSize: '14px' }}>Nenhuma atividade recente para seu usuário.</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} style={{ ...activityItem, borderBottom: i === logs.length -1 ? 'none' : `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={getTagStyle(log.modulo)}>{log.modulo}</span>
              <span style={{ fontSize: '12px', color: theme.textSecondary }}>{formatTime(log.timestamp)}</span>
            </div>
            <div style={{ fontSize: '14px', color: theme.text, fontWeight: '500', lineHeight: '1.4' }}>
              {log.descricao || `Ação realizada`}
            </div>
          </div>
        ))
      )}

      <button style={btnHistory}>Ver histórico completo</button>
    </div>
  );
}

function UpcomingBookings({ theme }) {
  return (
    <div style={{ ...sectionCard, backgroundColor: theme.mainBg, borderColor: theme.border }}>
      <h3 style={{ ...sectionTitle, color: theme.text }}>Próximos Agendamentos</h3>
      <Booking theme={theme} title="Salão de Festas" desc="Apto 302 - Evento Social" date="2026-03-15" />
      <Booking theme={theme} title="Mudança - Entrada" desc="Apto 115 - Bloco B" date="2026-03-16" />
    </div>
  );
}

function Booking({ title, desc, date, theme }) {
  const bookingDate = new Date(date);
  const month = bookingDate.toLocaleString("pt-BR", { month: "short" }).toUpperCase().replace('.', '');
  const day = bookingDate.getDate() + 1;

  return (
    <div style={{ ...bookingCard, backgroundColor: theme.bg, borderColor: theme.border }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <div style={{ ...dateBadge, backgroundColor: theme.mainBg, borderColor: theme.border }}>
          <div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "800" }}>{month}</div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: theme.text }}>{day}</div>
        </div>
        <div>
          <strong style={{ fontSize: "14px", color: theme.text }}>{title}</strong>
          <p style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>{desc}</p>
        </div>
      </div>
      <button style={btnDetails}>Detalhes</button>
    </div>
  );
}

/* ================= OBJETOS DE ESTILO ================= */
const cardsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" };
const cardBase = { padding: "20px", borderRadius: "16px", border: "1px solid", transition: "0.2s" };
const contentGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" };
const sectionCard = { padding: "24px", borderRadius: "20px", border: "1px solid", position: "relative" };
const sectionTitle = { margin: "0 0 25px 0", fontSize: "18px", fontWeight: "700" };
const activityItem = { paddingBottom: "18px", marginBottom: "18px" };
const btnHistory = { width: "100%", background: "none", border: "none", color: "#3b82f6", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginTop: "10px" };
const bookingCard = { padding: "15px", borderRadius: "14px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid" };
const dateBadge = { borderRadius: "10px", padding: "8px 10px", textAlign: "center", minWidth: "52px", border: "1px solid" };
const btnDetails = { backgroundColor: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "12px", fontWeight: "600" };