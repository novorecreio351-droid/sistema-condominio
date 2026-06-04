/* eslint-disable no-unused-vars */

import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "../App";
import {
  Users,
  CalendarCheck,
  AlertCircle,
  ShoppingCart,
  Loader2,
  CalendarDays,
  Bell,
  BarChart3,
  TrendingUp,
  PieChart,
  Building2,
  Flame,
  PartyPopper,
  Truck,
  Wallet,
  X
} from "lucide-react";
import { can } from "../auth/permissions";
import { sessionParam } from "../auth/session";

const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ROLES_ANALISE = ["Sindico", "Auxiliar Administrativo", "Desenvolvedor"];

// ===== Normalizadores (Sheets devolve datas/valores em formatos variados) =====
function normalizarDataAg(valor) {
  if (!valor) return "";
  const datePart = valor.toString().trim().split(" ")[0].split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  if (datePart.includes("/")) {
    const [d, m, y] = datePart.split("/");
    if (d && m && y) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return datePart;
}

function normalizarHoraAg(valor) {
  if (!valor) return "";
  const match = valor.toString().match(/(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return valor.toString().trim();
}

// Extrai {y, m} de "DD/MM/YYYY ...", "YYYY-MM-DD" ou ISO. null se inválida.
function parseAnoMes(d) {
  if (!d) return null;
  const s = d.toString().trim();
  if (s.includes("/")) {
    const partes = s.split("/");
    const mm = partes[1], rest = partes[2];
    const y = parseInt((rest || "").split(" ")[0], 10);
    const m = parseInt(mm, 10);
    return y && m ? { y, m } : null;
  }
  const iso = s.split("T")[0].split(" ")[0];
  const p = iso.split("-");
  if (p.length >= 2) {
    const y = parseInt(p[0], 10);
    const m = parseInt(p[1], 10);
    if (y && m) return { y, m };
  }
  return null;
}

// "R$ 1.250,00" | "1250,5" | 1250 -> número.
function parseValor(v) {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  let s = v.toString().replace(/[^\d,.-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

const fmtBRL = (n) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtBRLfull = (n) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pago = (v) => String(v || "").trim().toLowerCase().startsWith("s"); // "Sim"

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);

  // Dados crus (alimentam KPIs e gráficos)
  const [unidades, setUnidades] = useState([]);
  const [festas, setFestas] = useState([]);
  const [churras, setChurras] = useState([]);
  const [mudancas, setMudancas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [logs, setLogs] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [reservasAtivas, setReservasAtivas] = useState(0);

  // Notificações da agenda (sino)
  const [reunioesProximas, setReunioesProximas] = useState([]);

  const isAnalise = ROLES_ANALISE.includes(user?.cargo);
  const isConselheiro = user?.cargo === "Conselheiro";

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const normalizeText = (text) =>
    String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

  const handleVerDetalhes = (item) => {
    const tipo = String(item.tipo).toLowerCase();
    let acaoNecessaria = "";
    if (tipo.includes("festa")) acaoNecessaria = "verDetalhesFesta";
    else if (tipo.includes("churrasqueira")) acaoNecessaria = "verDetalhesChurrasqueira";
    else if (tipo.includes("mudança")) acaoNecessaria = "verDetalhesMudanca";

    if (!can(user, acaoNecessaria)) {
      alert("Você não tem permissão para ver detalhes desta reserva.");
      return;
    }

    let rota = "";
    if (tipo.includes("festa")) rota = "/festas";
    else if (tipo.includes("churrasqueira")) rota = "/churrasqueira";
    else if (tipo.includes("mudança")) rota = "/mudancas";
    if (rota) navigate(rota, { state: { openId: item.id } });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const reqs = [
          fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=UNIDADES${sessionParam()}`, { redirect: "follow" }).then(r => r.json()),
          fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=log${sessionParam()}`, { redirect: "follow" }).then(r => r.json()),
          fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=FESTAS${sessionParam()}`, { redirect: "follow" }).then(r => r.json()),
          fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=CHURRASQUEIRA${sessionParam()}`, { redirect: "follow" }).then(r => r.json()),
          fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=MUDANCAS${sessionParam()}`, { redirect: "follow" }).then(r => r.json()),
          // Compras só para cargos administrativos (o backend bloquearia mesmo assim)
          isAnalise
            ? fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=COMPRAS${sessionParam()}`, { redirect: "follow" }).then(r => r.json()).catch(() => [])
            : Promise.resolve([]),
        ];
        const [dataUnits, dataLogs, dataFestas, dataChurras, dataMudancas, dataCompras] = await Promise.all(reqs);

        setUnidades(Array.isArray(dataUnits) ? dataUnits : []);
        setFestas(Array.isArray(dataFestas) ? dataFestas : []);
        setChurras(Array.isArray(dataChurras) ? dataChurras : []);
        setMudancas(Array.isArray(dataMudancas) ? dataMudancas : []);
        setCompras(Array.isArray(dataCompras) ? dataCompras : []);

        const todasReservas = [
          ...(Array.isArray(dataFestas) ? dataFestas.map(f => ({ ...f, tipo: "Salão de Festas", data: f.data_reserva })) : []),
          ...(Array.isArray(dataChurras) ? dataChurras.map(c => ({ ...c, tipo: `Churrasqueira ${c.churrasqueira || ""}`, data: c.data_reserva })) : []),
          ...(Array.isArray(dataMudancas) ? dataMudancas.map(m => ({ ...m, tipo: "Mudança", data: m.data_mudanca })) : [])
        ];

        const agendados = todasReservas
          .filter(r => String(r.status).toLowerCase() === "agendado")
          .sort((a, b) => {
            const parseDate = (d) => {
              const s = String(d);
              if (s.includes("/")) {
                const [day, month, yearTime] = s.split("/");
                const year = yearTime.split(" ")[0];
                return new Date(year, month - 1, day).getTime();
              }
              return new Date(s).getTime();
            };
            return parseDate(a.data) - parseDate(b.data);
          });

        setUpcoming(agendados.slice(0, 4));
        setReservasAtivas(agendados.length);

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
        setTimeout(() => setLoading(false), 400);
      }
    }
    if (user?.nome) fetchData();
  }, [user]);

  // Agenda de hoje/amanhã (alimenta o sino de notificações)
  useEffect(() => {
    if (!user?.cargo || !ROLES_ANALISE.includes(user.cargo)) return;

    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const fmt = (d) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    const hojeStr = fmt(hoje);
    const amanhaStr = fmt(amanha);

    fetch(`${SHEETS_URL}?token=${TOKEN}&sheet=AGENDAMENTOS${sessionParam()}`, { redirect: "follow" })
      .then(r => r.json())
      .then(data => {
        const lista = (Array.isArray(data) ? data : [])
          .map(item => ({
            id: item.id || "",
            tipo: item.tipo || "Morador",
            nome: item.nome || item.NOME || "",
            data: normalizarDataAg(item.data || item.DATA),
            hora_inicio: normalizarHoraAg(item.hora_inicio || item.HORA_INICIO),
            assunto: item.assunto || item.ASSUNTO || "",
            status: item.status || item.STATUS || "",
          }))
          .filter(ag =>
            (ag.data === hojeStr || ag.data === amanhaStr) &&
            ag.status !== "Cancelado" && ag.status !== "Realizado"
          )
          .sort((a, b) => (a.data + a.hora_inicio).localeCompare(b.data + b.hora_inicio));
        setReunioesProximas(lista);
      })
      .catch(() => {});
  }, [user]);

  // ===== KPIs derivados =====
  const anoAtual = new Date().getFullYear();
  const kpis = useMemo(() => {
    const inadimplentes = unidades.filter(u => u.status === "Inadimplente").length;
    const ocupadas = unidades.filter(u => u.ocupado === "Sim").length;
    const comprasPendentes = compras.filter(c => String(c.status || "").toLowerCase() === "pendente").length;
    const receitaAno = [...festas, ...churras].reduce((acc, r) => {
      const am = parseAnoMes(r.data_reserva);
      if (am && am.y === anoAtual && pago(r.pago)) return acc + parseValor(r.valor_taxa);
      return acc;
    }, 0);
    return { inadimplentes, ocupadas, comprasPendentes, receitaAno };
  }, [unidades, compras, festas, churras]);

  return (
    <div style={{ padding: "10px", paddingTop: isMobile ? "55px" : "10px" }}>
      <style>{`
        @keyframes dashFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .dash-sec { animation: dashFadeUp .5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes dashBarGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .dash-bar { transform-box: fill-box; transform-origin: bottom; animation: dashBarGrow .55s cubic-bezier(.16,1,.3,1) both; }
        .dash-bar:hover { filter: brightness(1.15); }
        @keyframes dashDonutIn { from { stroke-dashoffset: 100; } }
        .dash-donut-seg { animation: dashDonutIn .8s cubic-bezier(.16,1,.3,1) both; }
        @keyframes dashPing { 0% { transform: scale(1); opacity: .7; } 80%, 100% { transform: scale(2.1); opacity: 0; } }
        .dash-ping { animation: dashPing 1.8s cubic-bezier(0,0,.2,1) infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinner-anim { animation: spin 1s linear infinite; }
        .dash-chip { transition: all .18s ease; cursor: pointer; }
        .dash-chip:hover { transform: translateY(-1px); }
        .dash-kpi { transition: transform .18s ease, box-shadow .18s ease; }
        .dash-kpi:hover { transform: translateY(-2px); }
      `}</style>

      {/* ===== Cabeçalho com sino de notificações ===== */}
      <div className="dash-sec" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: isMobile ? 20 : 28 }}>
        <Header user={user} theme={theme} isMobile={isMobile} />
        {isAnalise && (
          <NotificationBell
            theme={theme}
            isMobile={isMobile}
            notificacoes={reunioesProximas}
            onVerAgenda={() => navigate("/agendamento")}
          />
        )}
      </div>

      <div className="dash-sec" style={{ animationDelay: ".06s" }}>
        <Cards
          user={user}
          theme={theme}
          isMobile={isMobile}
          loading={loading}
          ocupadas={kpis.ocupadas}
          reservas={reservasAtivas}
          inadimplentes={kpis.inadimplentes}
          comprasPendentes={kpis.comprasPendentes}
          receitaAno={kpis.receitaAno}
          anoAtual={anoAtual}
          isAnalise={isAnalise}
        />
      </div>

      {/* ===== Relatórios (gráficos selecionáveis) ===== */}
      {isAnalise && (
        <div className="dash-sec" style={{ animationDelay: ".12s" }}>
          <AnalyticsPanel theme={theme} isMobile={isMobile} loading={loading} festas={festas} churras={churras} mudancas={mudancas} unidades={unidades} />
        </div>
      )}

      {!isConselheiro && (
        <div className="dash-sec" style={{ ...contentGrid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", animationDelay: ".18s" }}>
          <RecentActivities logs={logs} loading={loading} theme={theme} isMobile={isMobile} />
          <UpcomingBookings data={upcoming} loading={loading} theme={theme} isMobile={isMobile} onViewDetails={handleVerDetalhes} />
        </div>
      )}
    </div>
  );
}

/* ================= SINO DE NOTIFICAÇÕES (agenda) ================= */

function NotificationBell({ theme, isMobile, notificacoes, onVerAgenda }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, "0")}-${hoje.getDate().toString().padStart(2, "0")}`;
  const count = notificacoes.length;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Notificações da agenda"
        style={{
          position: "relative", width: 46, height: 46, borderRadius: 14,
          border: `1px solid ${theme.border}`, background: theme.mainBg,
          color: count > 0 ? "#3b82f6" : theme.textSecondary,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: open ? "0 8px 24px rgba(59,130,246,0.18)" : "none", transition: "box-shadow .2s ease"
        }}
      >
        <Bell size={20} />
        {count > 0 && (
          <>
            <span className="dash-ping" style={{ position: "absolute", top: 8, right: 9, width: 9, height: 9, borderRadius: "50%", background: "#ef4444" }} />
            <span style={{
              position: "absolute", top: -6, right: -6, minWidth: 20, height: 20, padding: "0 5px",
              borderRadius: 10, background: "#ef4444", color: "white", fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${theme.bg}`
            }}>{count}</span>
          </>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 54, right: 0, zIndex: 500,
          width: isMobile ? "calc(100vw - 40px)" : 380, maxWidth: 420,
          background: theme.mainBg, border: `1px solid ${theme.border}`, borderRadius: 18,
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)", overflow: "hidden",
          animation: "dashFadeUp .25s cubic-bezier(.16,1,.3,1) both"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarDays size={16} color="#3b82f6" />
              <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Agenda — hoje e amanhã</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textSecondary, display: "flex", padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto", padding: count ? 10 : 0 }}>
            {count === 0 ? (
              <div style={{ padding: "34px 20px", textAlign: "center", color: theme.textSecondary }}>
                <Bell size={28} style={{ opacity: 0.25, marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>Nenhum compromisso para hoje ou amanhã.</div>
              </div>
            ) : (
              notificacoes.map(ag => {
                const isHoje = ag.data === hojeStr;
                return (
                  <div key={ag.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 12px", borderRadius: 12, marginBottom: 6,
                    background: isHoje ? "#f59e0b14" : "#3b82f610",
                    border: `1px solid ${isHoje ? "#f59e0b40" : "#3b82f640"}`
                  }}>
                    <div style={{
                      background: isHoje ? "#f59e0b" : "#3b82f6", color: "white",
                      fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap"
                    }}>
                      {isHoje ? "Hoje" : "Amanhã"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ag.tipo} — {ag.nome}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textSecondary }}>
                        às {ag.hora_inicio}{ag.assunto ? ` · ${ag.assunto}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => { setOpen(false); onVerAgenda(); }}
            style={{ width: "100%", padding: "12px", background: "none", border: "none", borderTop: `1px solid ${theme.border}`, color: "#3b82f6", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Abrir agenda completa
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= PAINEL DE RELATÓRIOS (gráficos SVG) ================= */

const RELATORIOS = [
  { id: "receita", label: "Receita", Icon: Wallet },
  { id: "reservas", label: "Reservas", Icon: BarChart3 },
  { id: "status", label: "Status", Icon: PieChart },
  { id: "ocupacao", label: "Ocupação", Icon: Building2 },
];

function AnalyticsPanel({ theme, isMobile, loading, festas, churras, mudancas, unidades }) {
  const [relatorio, setRelatorio] = useState("receita");
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);

  // Anos com dados (para o seletor)
  const anos = useMemo(() => {
    const set = new Set([anoAtual]);
    [...festas, ...churras].forEach(r => { const am = parseAnoMes(r.data_reserva); if (am) set.add(am.y); });
    mudancas.forEach(m => { const am = parseAnoMes(m.data_mudanca); if (am) set.add(am.y); });
    return [...set].sort((a, b) => b - a).slice(0, 6);
  }, [festas, churras, mudancas]);

  // --- Receita mensal (pago = Sim), separada por origem ---
  const receita = useMemo(() => {
    const fest = Array(12).fill(0);
    const chur = Array(12).fill(0);
    festas.forEach(f => {
      const am = parseAnoMes(f.data_reserva);
      if (am && am.y === ano && pago(f.pago)) fest[am.m - 1] += parseValor(f.valor_taxa);
    });
    churras.forEach(c => {
      const am = parseAnoMes(c.data_reserva);
      if (am && am.y === ano && pago(c.pago)) chur[am.m - 1] += parseValor(c.valor_taxa);
    });
    const totalFest = fest.reduce((a, b) => a + b, 0);
    const totalChur = chur.reduce((a, b) => a + b, 0);
    return { fest, chur, totalFest, totalChur, total: totalFest + totalChur };
  }, [festas, churras, ano]);

  // --- Reservas por mês (contagem, empilhado por tipo) ---
  const reservasMes = useMemo(() => {
    const fest = Array(12).fill(0), chur = Array(12).fill(0), mud = Array(12).fill(0);
    festas.forEach(f => { const am = parseAnoMes(f.data_reserva); if (am && am.y === ano) fest[am.m - 1]++; });
    churras.forEach(c => { const am = parseAnoMes(c.data_reserva); if (am && am.y === ano) chur[am.m - 1]++; });
    mudancas.forEach(m => { const am = parseAnoMes(m.data_mudanca); if (am && am.y === ano) mud[am.m - 1]++; });
    return { fest, chur, mud, total: [...fest, ...chur, ...mud].reduce((a, b) => a + b, 0) };
  }, [festas, churras, mudancas, ano]);

  // --- Status das reservas do ano ---
  const statusDist = useMemo(() => {
    const cont = {};
    [...festas, ...churras].forEach(r => {
      const am = parseAnoMes(r.data_reserva);
      if (!am || am.y !== ano) return;
      const s = String(r.status || "Sem status").trim();
      const key = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      cont[key] = (cont[key] || 0) + 1;
    });
    const CORES = { "Agendado": "#3b82f6", "Realizado": "#16a34a", "Cancelado": "#ef4444", "Pendente": "#f59e0b" };
    const itens = Object.entries(cont)
      .sort((a, b) => b[1] - a[1])
      .map(([label, valor], i) => ({ label, valor, cor: CORES[label] || ["#8b5cf6", "#64748b", "#0ea5e9"][i % 3] }));
    return { itens, total: itens.reduce((a, b) => a + b.valor, 0) };
  }, [festas, churras, ano]);

  // --- Ocupação das unidades (sem recorte de ano) ---
  const ocupacao = useMemo(() => {
    const ocup = unidades.filter(u => u.ocupado === "Sim").length;
    const livres = Math.max(0, unidades.length - ocup);
    const inad = unidades.filter(u => u.status === "Inadimplente").length;
    return {
      itens: [
        { label: "Ocupadas", valor: ocup, cor: "#3b82f6" },
        { label: "Disponíveis", valor: livres, cor: "#64748b" },
      ],
      total: unidades.length,
      inad
    };
  }, [unidades]);

  const usaAno = relatorio !== "ocupacao";

  return (
    <div style={{
      background: theme.mainBg, border: `1px solid ${theme.border}`, borderRadius: 20,
      padding: isMobile ? 16 : 24, marginBottom: isMobile ? 20 : 28, position: "relative", overflow: "hidden"
    }}>
      {/* brilho decorativo no topo do painel */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #3b82f6, #8b5cf6 45%, #f59e0b)" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 12, flexDirection: isMobile ? "column" : "row", marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: theme.text, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={18} color="#3b82f6" /> Relatórios
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: theme.textSecondary }}>Escolha o gráfico que deseja visualizar.</p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Seletor de relatório */}
          <div style={{ display: "flex", gap: 6, background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 4, flexWrap: "wrap" }}>
            {RELATORIOS.map(r => {
              const ativo = relatorio === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  className="dash-chip"
                  onClick={() => setRelatorio(r.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                    borderRadius: 9, border: "none", fontSize: 12.5, fontWeight: 700,
                    background: ativo ? "#3b82f6" : "transparent",
                    color: ativo ? "white" : theme.textSecondary,
                    boxShadow: ativo ? "0 4px 12px rgba(59,130,246,0.35)" : "none"
                  }}
                >
                  <r.Icon size={14} /> {r.label}
                </button>
              );
            })}
          </div>

          {usaAno && (
            <select
              value={ano}
              onChange={e => setAno(parseInt(e.target.value, 10))}
              style={{ padding: "8px 10px", borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 13, fontWeight: 700, outline: "none", cursor: "pointer" }}
            >
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Loader2 className="spinner-anim" size={28} color="#3b82f6" />
        </div>
      ) : (
        <>
          {relatorio === "receita" && (
            <ChartReceita key={`rec-${ano}`} theme={theme} isMobile={isMobile} dados={receita} />
          )}
          {relatorio === "reservas" && (
            <ChartReservas key={`res-${ano}`} theme={theme} isMobile={isMobile} dados={reservasMes} />
          )}
          {relatorio === "status" && (
            <ChartDonut
              key={`st-${ano}`}
              theme={theme} isMobile={isMobile}
              titulo={`Status das reservas em ${ano}`}
              itens={statusDist.itens} total={statusDist.total}
              centroValor={statusDist.total} centroLabel="reservas"
            />
          )}
          {relatorio === "ocupacao" && (
            <ChartDonut
              key="ocp"
              theme={theme} isMobile={isMobile}
              titulo="Ocupação das unidades"
              itens={ocupacao.itens} total={ocupacao.total}
              centroValor={ocupacao.total ? `${Math.round((ocupacao.itens[0].valor / ocupacao.total) * 100)}%` : "0%"}
              centroLabel="ocupação"
              rodape={`${ocupacao.inad} unidade(s) inadimplente(s)`}
            />
          )}
        </>
      )}
    </div>
  );
}

// ---- Gráfico de barras agrupadas: receita Festas x Churrasqueira ----
function ChartReceita({ theme, isMobile, dados }) {
  const H = 210, W = 760, PAD = 8;
  const colW = (W - PAD * 2) / 12;
  const max = Math.max(1, ...dados.fest, ...dados.chur);
  const bw = Math.min(16, colW / 2 - 6);

  return (
    <div>
      <div style={{ display: "flex", gap: isMobile ? 12 : 26, flexWrap: "wrap", marginBottom: 14 }}>
        <ResumoValor theme={theme} cor="#3b82f6" Icon={PartyPopper} label="Salão de Festas" valor={fmtBRLfull(dados.totalFest)} />
        <ResumoValor theme={theme} cor="#f59e0b" Icon={Flame} label="Churrasqueira" valor={fmtBRLfull(dados.totalChur)} />
        <ResumoValor theme={theme} cor="#16a34a" Icon={Wallet} label="Total recebido" valor={fmtBRLfull(dados.total)} destaque />
      </div>

      <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
        <svg viewBox={`0 0 ${W} ${H + 26}`} style={{ width: "100%", minWidth: isMobile ? 560 : 0, display: "block" }}>
          {/* linhas-guia */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={PAD} x2={W - PAD} y1={H - H * f} y2={H - H * f} stroke={theme.border} strokeDasharray="4 5" strokeWidth="1" />
          ))}
          {MESES.map((m, i) => {
            const x = PAD + i * colW;
            const hF = (dados.fest[i] / max) * (H - 12);
            const hC = (dados.chur[i] / max) * (H - 12);
            return (
              <g key={m}>
                <rect className="dash-bar" style={{ animationDelay: `${i * 0.035}s` }}
                  x={x + colW / 2 - bw - 2} y={H - hF} width={bw} height={Math.max(hF, dados.fest[i] > 0 ? 3 : 0)} rx="4" fill="#3b82f6">
                  <title>{`${m}: Festas ${fmtBRLfull(dados.fest[i])}`}</title>
                </rect>
                <rect className="dash-bar" style={{ animationDelay: `${i * 0.035 + 0.05}s` }}
                  x={x + colW / 2 + 2} y={H - hC} width={bw} height={Math.max(hC, dados.chur[i] > 0 ? 3 : 0)} rx="4" fill="#f59e0b">
                  <title>{`${m}: Churrasqueira ${fmtBRLfull(dados.chur[i])}`}</title>
                </rect>
                <text x={x + colW / 2} y={H + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill={theme.textSecondary}>{m}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 11.5, color: theme.textSecondary }}>
        Considera apenas reservas com pagamento confirmado (Pago = Sim).
      </p>
    </div>
  );
}

// ---- Gráfico de barras empilhadas: reservas por mês ----
function ChartReservas({ theme, isMobile, dados }) {
  const H = 210, W = 760, PAD = 8;
  const colW = (W - PAD * 2) / 12;
  const totais = MESES.map((_, i) => dados.fest[i] + dados.chur[i] + dados.mud[i]);
  const max = Math.max(1, ...totais);
  const bw = Math.min(26, colW - 14);

  const LEG = [
    { label: "Salão de Festas", cor: "#3b82f6", Icon: PartyPopper },
    { label: "Churrasqueira", cor: "#f59e0b", Icon: Flame },
    { label: "Mudanças", cor: "#8b5cf6", Icon: Truck },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: isMobile ? 12 : 22, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        {LEG.map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: theme.textSecondary }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.cor, display: "inline-block" }} /> {l.label}
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: theme.text }}>{dados.total} reservas no ano</span>
      </div>

      <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
        <svg viewBox={`0 0 ${W} ${H + 26}`} style={{ width: "100%", minWidth: isMobile ? 560 : 0, display: "block" }}>
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={PAD} x2={W - PAD} y1={H - H * f} y2={H - H * f} stroke={theme.border} strokeDasharray="4 5" strokeWidth="1" />
          ))}
          {MESES.map((m, i) => {
            const x = PAD + i * colW + (colW - bw) / 2;
            const esc = (v) => (v / max) * (H - 12);
            const hF = esc(dados.fest[i]), hC = esc(dados.chur[i]), hM = esc(dados.mud[i]);
            let yCursor = H;
            const seg = (h, fill, label, valor, delayExtra) => {
              if (h <= 0) return null;
              yCursor -= h;
              return (
                <rect className="dash-bar" style={{ animationDelay: `${i * 0.035 + delayExtra}s` }}
                  x={x} y={yCursor} width={bw} height={h} rx="3" fill={fill}>
                  <title>{`${m}: ${label} — ${valor}`}</title>
                </rect>
              );
            };
            return (
              <g key={m}>
                {seg(hF, "#3b82f6", "Festas", dados.fest[i], 0)}
                {seg(hC, "#f59e0b", "Churrasqueira", dados.chur[i], 0.04)}
                {seg(hM, "#8b5cf6", "Mudanças", dados.mud[i], 0.08)}
                {totais[i] > 0 && (
                  <text x={x + bw / 2} y={yCursor - 6} textAnchor="middle" fontSize="11" fontWeight="800" fill={theme.text}>{totais[i]}</text>
                )}
                <text x={PAD + i * colW + colW / 2} y={H + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill={theme.textSecondary}>{m}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ---- Donut genérico (status / ocupação) ----
function ChartDonut({ theme, isMobile, titulo, itens, total, centroValor, centroLabel, rodape }) {
  const R = 15.9155; // raio cuja circunferência = 100 (facilita dasharray em %)
  let acumulado = 0;

  return (
    <div style={{ display: "flex", gap: isMobile ? 18 : 40, alignItems: "center", flexDirection: isMobile ? "column" : "row", padding: "6px 0" }}>
      <div style={{ position: "relative", width: isMobile ? 190 : 220, flexShrink: 0 }}>
        <svg viewBox="0 0 42 42" style={{ width: "100%", display: "block" }}>
          <circle cx="21" cy="21" r={R} fill="none" stroke={theme.border} strokeWidth="5.5" opacity="0.45" />
          {itens.map((it, i) => {
            const frac = total > 0 ? (it.valor / total) * 100 : 0;
            const offset = 25 - acumulado; // começa no topo
            acumulado += frac;
            if (frac <= 0) return null;
            return (
              <circle key={it.label} className="dash-donut-seg" style={{ animationDelay: `${i * 0.12}s` }}
                cx="21" cy="21" r={R} fill="none" stroke={it.cor} strokeWidth="5.5" strokeLinecap="butt"
                strokeDasharray={`${frac} ${100 - frac}`} strokeDashoffset={offset}>
                <title>{`${it.label}: ${it.valor}`}</title>
              </circle>
            );
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: theme.text, lineHeight: 1 }}>{centroValor}</span>
          <span style={{ fontSize: 11.5, color: theme.textSecondary, marginTop: 4 }}>{centroLabel}</span>
        </div>
      </div>

      <div style={{ flex: 1, width: "100%" }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 14.5, fontWeight: 800, color: theme.text }}>{titulo}</h4>
        {total === 0 ? (
          <p style={{ fontSize: 13, color: theme.textSecondary }}>Sem dados para exibir.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {itens.map(it => {
              const pct = total > 0 ? Math.round((it.valor / total) * 100) : 0;
              return (
                <div key={it.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, color: theme.text }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: it.cor, display: "inline-block" }} />
                      {it.label}
                    </span>
                    <span style={{ color: theme.textSecondary, fontWeight: 700 }}>{it.valor} · {pct}%</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 5, background: theme.bg, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: it.cor, transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {rodape && <p style={{ margin: "14px 0 0", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{rodape}</p>}
      </div>
    </div>
  );
}

function ResumoValor({ theme, cor, Icon, label, valor, destaque }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${cor}1c`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} color={cor} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: theme.textSecondary }}>{label}</div>
        <div style={{ fontSize: destaque ? 18 : 15, fontWeight: 800, color: destaque ? cor : theme.text, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
      </div>
    </div>
  );
}

/* ================= CABEÇALHO E KPIs ================= */

function Header({ user, theme, isMobile }) {
  const primeiroNome = user?.nome ? user.nome.split(" ")[0] : "Usuário";
  return (
    <div style={{ minWidth: 0 }}>
      <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: "800", color: theme.text, marginBottom: "5px", letterSpacing: "-0.02em" }}>
        Olá, {primeiroNome}! 👋
      </h1>
      <p style={{ color: theme.textSecondary, margin: 0 }}>
        Bem-vindo ao sistema. Você está logado como <strong>{user?.cargo || "Colaborador"}</strong>.
      </p>
    </div>
  );
}

function Cards({ user, theme, isMobile, loading, ocupadas, reservas, inadimplentes, comprasPendentes, receitaAno, anoAtual, isAnalise }) {
  const isConselheiro = user?.cargo === "Conselheiro";
  const v = (x) => (loading ? "…" : x);
  return (
    <div style={{ ...cardsGrid, gridTemplateColumns: isMobile ? "repeat(auto-fit, minmax(150px, 1fr))" : cardsGrid.gridTemplateColumns, gap: isMobile ? "12px" : cardsGrid.gap, marginBottom: isMobile ? "20px" : cardsGrid.marginBottom }}>
      <Card theme={theme} title="Unidades Ocupadas" value={v(ocupadas)} Icon={Users} color="#3b82f6" />
      {!isConselheiro && (
        <Card theme={theme} title="Reservas Ativas" value={v(reservas)} Icon={CalendarCheck} color="#16a34a" />
      )}
      <Card theme={theme} title="Inadimplentes" value={v(inadimplentes)} Icon={AlertCircle} color="#ef4444" />
      {isAnalise && (
        <Card theme={theme} title={`Receita ${anoAtual}`} value={v(fmtBRL(receitaAno))} Icon={Wallet} color="#0ea5e9" sub="festas + churrasqueira" />
      )}
      {isAnalise && (
        <Card theme={theme} title="Compras Pendentes" value={v(comprasPendentes)} Icon={ShoppingCart} color="#ea580c" />
      )}
    </div>
  );
}

function Card({ title, value, Icon, color, theme, sub }) {
  return (
    <div className="dash-kpi" style={{ ...cardBase, backgroundColor: theme.mainBg, borderColor: theme.border }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ color: theme.textSecondary, fontSize: "13px", fontWeight: "600", margin: 0 }}>{title}</p>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <h2 style={{ fontSize: "24px", marginTop: "10px", marginBottom: 0, color: theme.text, fontWeight: "800", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</h2>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 11, color: theme.textSecondary }}>{sub}</p>}
    </div>
  );
}

/* ================= LISTAS (atividades e próximos agendamentos) ================= */

function RecentActivities({ logs, loading, theme, isMobile }) {
  const formatTime = (dateString) => {
    if (!dateString) return "Recentemente";
    try {
      const [datePart, timePart] = dateString.split(" ");
      const [day, month, year] = datePart.split("/");
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
    const base = { fontSize: "11px", padding: "3px 10px", borderRadius: "6px", fontWeight: "700", textTransform: "uppercase" };
    const m = String(modulo).toUpperCase();
    if (m === "UNIDADES") return { ...base, backgroundColor: "#eff6ff", color: "#3b82f6" };
    if (m === "FINANCEIRO") return { ...base, backgroundColor: "#f0fdf4", color: "#16a34a" };
    if (m === "RESERVAS") return { ...base, backgroundColor: "#fef3c7", color: "#d97706" };
    return { ...base, backgroundColor: theme.bg, color: theme.textSecondary };
  };

  return (
    <div style={{ ...sectionCard, padding: isMobile ? "18px" : sectionCard.padding, backgroundColor: theme.mainBg, borderColor: theme.border }}>
      <h3 style={{ ...sectionTitle, margin: isMobile ? "0 0 18px 0" : sectionTitle.margin, color: theme.text }}>Atividades Recentes</h3>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Loader2 className="spinner-anim" size={28} color="#3b82f6" />
        </div>
      ) : logs.length === 0 ? (
        <p style={{ textAlign: "center", color: theme.textSecondary, padding: "20px", fontSize: "14px" }}>
          Nenhuma atividade recente.
        </p>
      ) : (
        logs.map((log, i) => (
          <div key={i} style={{ ...activityItem, borderBottom: i === logs.length - 1 ? "none" : `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={getTagStyle(log.modulo)}>{log.modulo}</span>
              <span style={{ fontSize: "12px", color: theme.textSecondary }}>{formatTime(log.timestamp)}</span>
            </div>
            <div style={{ fontSize: "14px", color: theme.text, fontWeight: "500" }}>
              {log.descricao || `Ação realizada`}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function UpcomingBookings({ data, loading, theme, onViewDetails, isMobile }) {
  return (
    <div style={{ ...sectionCard, padding: isMobile ? "18px" : sectionCard.padding, backgroundColor: theme.mainBg, borderColor: theme.border }}>
      <h3 style={{ ...sectionTitle, margin: isMobile ? "0 0 18px 0" : sectionTitle.margin, color: theme.text }}>Próximos Agendamentos</h3>
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
              onView={() => onViewDetails(item)}
            />
          );
        })
      )}
    </div>
  );
}

function Booking({ title, desc, date, theme, onView }) {
  const getSafeDate = (d) => {
    if (!d) return { day: "--", month: "--" };
    let dateObj;
    const s = String(d);
    if (s.includes("/")) {
      const [day, month, yearTime] = s.split("/");
      const year = yearTime.split(" ")[0];
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    } else {
      const dateStr = s.split("T")[0];
      const [year, month, day] = dateStr.split("-");
      dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    }
    return {
      day: dateObj.getDate().toString().padStart(2, "0"),
      month: dateObj.toLocaleString("pt-BR", { month: "short" }).toUpperCase().replace(".", "")
    };
  };

  const { day, month } = getSafeDate(date);

  return (
    <div style={{ ...bookingCard, backgroundColor: theme.bg, borderColor: theme.border }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px", minWidth: 0 }}>
        <div style={{ ...dateBadge, backgroundColor: theme.mainBg, borderColor: theme.border }}>
          <div style={{ fontSize: "10px", color: "#3b82f6", fontWeight: "800" }}>{month}</div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: theme.text }}>{day}</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <strong style={{ fontSize: "14px", color: theme.text }}>{title}</strong>
          <p style={{ fontSize: "12px", color: theme.textSecondary, marginTop: "2px" }}>{desc}</p>
        </div>
      </div>
      <button style={btnDetails} onClick={onView}>Detalhes</button>
    </div>
  );
}

/* ================= ESTILOS ================= */

const cardsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "20px", marginBottom: "30px" };
const cardBase = { padding: "20px", borderRadius: "16px", border: "1px solid" };
const contentGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" };
const sectionCard = { padding: "24px", borderRadius: "20px", border: "1px solid", position: "relative" };
const sectionTitle = { margin: "0 0 25px 0", fontSize: "18px", fontWeight: "700" };
const activityItem = { paddingBottom: "18px", marginBottom: "18px" };
const bookingCard = { padding: "15px", borderRadius: "14px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, border: "1px solid" };
const dateBadge = { borderRadius: "10px", padding: "8px 10px", textAlign: "center", minWidth: "52px", border: "1px solid", flexShrink: 0 };
const btnDetails = { backgroundColor: "transparent", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "12px", fontWeight: "600", flexShrink: 0 };
