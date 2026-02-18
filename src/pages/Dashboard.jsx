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

const TOKEN = import.meta.env.VITE_SHEETS_TOKEN; 
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";

export default function Dashboard({ user }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ inadimplentes: 0, moradores: 0, reservas: 0 });
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  const normalizeText = (text) => 
    String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [resUnits, resLogs, resFestas, resChurras, resMudancas] = await Promise.all([
  fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=UNIDADES`, { method: "GET", redirect: "follow" }),
  fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=log`, { method: "GET", redirect: "follow" }),
  fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=FESTAS`, { method: "GET", redirect: "follow" }),
  fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=CHURRASQUEIRA`, { method: "GET", redirect: "follow" }),
  fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=MUDANCAS`, { method: "GET", redirect: "follow" })
]);

        const dataUnits = await resUnits.json();
        const dataLogs = await resLogs.json();
        const festas = await resFestas.json();
        const churras = await resChurras.json();
        const mudancas = await resMudancas.json();

        if (Array.isArray(dataUnits)) {
          const inad = dataUnits.filter(u => u.status === "Inadimplente").length;
          const morad = dataUnits.filter(u => u.ocupado === "Sim").length;
          setStats(prev => ({ ...prev, inadimplentes: inad, moradores: morad }));
        }

        const todasReservas = [
          ...(Array.isArray(festas) ? festas.map(f => ({ ...f, tipo: "Salão de Festas", data: f.data_reserva })) : []),
          ...(Array.isArray(churras) ? churras.map(c => ({ ...c, tipo: `Churrasqueira ${c.churrasqueira || ""}`, data: c.data_reserva })) : []),
          ...(Array.isArray(mudancas) ? mudancas.map(m => ({ ...m, tipo: "Mudança", data: m.data_mudanca })) : [])
        ];

        // ORDENAÇÃO CORRIGIDA PARA FORMATO DD/MM/YYYY
        const agendados = todasReservas
          .filter(r => String(r.status).toLowerCase() === "agendado")
          .sort((a, b) => {
            const parseDate = (d) => {
                const s = String(d);
                if (s.includes('/')) {
                    const [day, month, yearTime] = s.split('/');
                    const year = yearTime.split(' ')[0];
                    return new Date(year, month - 1, day).getTime();
                }
                return new Date(s).getTime();
            };
            return parseDate(a.data) - parseDate(b.data);
          });

        setUpcoming(agendados.slice(0, 4));
        setStats(prev => ({ ...prev, reservas: agendados.length }));

        if (Array.isArray(dataLogs)) {
          const userNomeNormalizado = normalizeText(user?.nome);
          const filteredLogs = dataLogs
            .filter(log => {
              const logUsuarioNormalizado = normalizeText(log.usuario);
              const modulo = String(log.modulo || "").toUpperCase();
              return logUsuarioNormalizado === userNomeNormalizado && modulo !== "LOGIN" && modulo !== "SISTEMA";
            })
            .reverse() 
            .slice(0, 4);
          setLogs(filteredLogs);
        }
      } catch (error) {
  console.error("Erro dashboard:", error);
} finally {
  // O loading só sai da tela quando TUDO terminar ou falhar
  setTimeout(() => setLoading(false), 500);
}
    }
    if (user?.nome) fetchData();
  }, [user]);

  return (
  <div style={{ padding: "10px" }}>
    <Header user={user} theme={theme} />
    
    <Cards 
      user={user} // Passe o user para o componente Cards
      theme={theme}
      inadimplentes={loading ? "..." : stats.inadimplentes} 
      moradores={loading ? "..." : stats.moradores}
      reservas={loading ? "..." : stats.reservas}
    />

    {/* Só mostra as listas detalhadas se NÃO for Conselheiro */}
    {user?.cargo !== "Conselheiro" && (
      <div style={contentGrid}>
        <RecentActivities logs={logs} loading={loading} theme={theme} />
        <UpcomingBookings data={upcoming} loading={loading} theme={theme} />
      </div>
    )}
  </div>
);
}

const CardLoading = () => {
  const { theme } = useTheme();
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '40px 0',
      gap: '10px'
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .inner-loader { animation: spin 1s linear infinite; }
      `}</style>
      <Loader2 className="inner-loader" size={30} color="#3b82f6" strokeWidth={1.5} />
      <span style={{ fontSize: '12px', color: theme.textSecondary }}>Atualizando dados...</span>
    </div>
  );
};

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

function Cards({ user, inadimplentes, moradores, reservas, theme }) {
  const isConselheiro = user?.cargo === "Conselheiro";
  return (
    <div style={cardsGrid}>
      <Card theme={theme} title="Unidades Ocupadas" value={moradores} Icon={Users} color="#3b82f6" />
      
      {/* Esconde Reservas se for Conselheiro */}
      {!isConselheiro && (
        <Card theme={theme} title="Reservas Ativas" value={reservas} Icon={CalendarCheck} color="#16a34a" />
      )}

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
    <div style={{ padding: "40px", textAlign: "center" }}>
      {/* CSS em linha para garantir a animação */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner-anim { animation: spin 1s linear infinite; }
      `}</style>
      <Loader2 className="spinner-anim" size={28} color="#3b82f6" />
    </div>
  ) : logs.length === 0 ? (
    <p style={{ textAlign: 'center', color: theme.textSecondary, padding: '20px', fontSize: '14px' }}>
      Nenhuma atividade recente.
    </p>
  ) : (
    logs.map((log, i) => (
      <div key={i} style={{ ...activityItem, borderBottom: i === logs.length - 1 ? 'none' : `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={getTagStyle(log.modulo)}>{log.modulo}</span>
          <span style={{ fontSize: '12px', color: theme.textSecondary }}>{formatTime(log.timestamp)}</span>
        </div>
        <div style={{ fontSize: '14px', color: theme.text, fontWeight: '500' }}>
          {log.descricao || `Ação realizada`}
        </div>
      </div>
    ))
  )}
  
  <button style={btnHistory}>Ver histórico completo</button>
</div>
  );
}

function UpcomingBookings({ data, loading, theme }) {
  return (
    <div style={{ ...sectionCard, backgroundColor: theme.mainBg, borderColor: theme.border }}>
      <h3 style={{ ...sectionTitle, color: theme.text }}>Próximos Agendamentos</h3>
      {loading ? (
        <div style={{ padding: "20px", textAlign: "center" }}><Loader2 className="spinner-anim" size={24} color="#3b82f6" /></div>
      ) : data.length === 0 ? (
        <p style={{ fontSize: "14px", color: theme.textSecondary }}>Nenhum agendamento ativo.</p>
      ) : (
        data.map((item, idx) => {
          const rawUnit = String(item.unidade_id || item.id_unidade || "");
          const cleanUnit = rawUnit.length > 3 ? rawUnit.slice(-3) : rawUnit;
          return (
            <Booking 
              key={idx} 
              theme={theme} 
              title={item.tipo} 
              desc={`B5 - ${cleanUnit} - ${item.morador || "Pendente"}`} 
              date={item.data} 
            />
          );
        })
      )}
    </div>
  );
}

function Booking({ title, desc, date, theme }) {
  const getSafeDate = (d) => {
    if (!d) return { day: "--", month: "--" };
    let dateObj;
    const s = String(d);

    if (s.includes('/')) {
        const [day, month, yearTime] = s.split('/');
        const year = yearTime.split(' ')[0];
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    } else {
        const dateStr = s.split('T')[0];
        const [year, month, day] = dateStr.split('-');
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    }

    return {
        day: dateObj.getDate().toString().padStart(2, '0'),
        month: dateObj.toLocaleString("pt-BR", { month: "short" }).toUpperCase().replace('.', '')
    };
  };

  const { day, month } = getSafeDate(date);

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