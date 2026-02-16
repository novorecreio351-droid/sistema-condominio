/* eslint-disable no-unused-vars */
import { useTheme } from "../App";
import React, { useState, useEffect } from "react";
import { 
  Search, Plus, RotateCcw, FileText, Download
} from "lucide-react";

export default function Calendario() {
  const { theme } = useTheme();
  
  // Estados de Usuário e Dados
  const [currentUser, setCurrentUser] = useState({ nome: "Sistema" });
  const [unidades, setUnidades] = useState([]);
  
  // Estados de Filtro
  const [searchUnidade, setSearchUnidade] = useState("");
  const [filterBloco, setFilterBloco] = useState("Todos");
  const [filterOcupado, setFilterOcupado] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        if (parsedUser && parsedUser.nome) setCurrentUser(parsedUser);
      } catch (e) { console.error("Erro ao processar usuário", e); }
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const blocosDisponiveis = ["Todos", "1", "2", "3", "4", "5", "8"];

  return (
    <div style={pageContainer}>
      <style>{`
        .filter-pill { padding: 6px 12px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; cursor: pointer; font-size: 12px; font-weight: 500; color: ${theme.textSecondary}; transition: 0.2s; }
        .filter-pill.active { background: #3b82f6; color: white; border-color: #3b82f6; }
      `}</style>

      {/* HEADER */}
      <div style={{
        ...headerStyle, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between',
        gap: isMobile ? '20px' : '10px'
      }}>
        <div>
          <h1 style={{...titleStyle, color: theme.text}}>Unidades</h1>
          <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: theme.textSecondary }}>
            Logado como: <strong style={{ color: theme.text }}>{currentUser.nome}</strong>
          </p>
        </div>
        
        <div style={{
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          width: isMobile ? '100%' : 'auto'
        }}>
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => console.log("Excel")}>
            <Download size={18} color="#166534" /> Excel
          </button>
          
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => console.log("PDF")}>
            <FileText size={18} color="#b91c1c" /> PDF
          </button>
          
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => { setSearchUnidade(""); setFilterBloco("Todos"); setFilterOcupado("Todos"); setFilterStatus("Todos"); }}>
            <RotateCcw size={18} /> Redefinir
          </button>
          
          <button style={{...btnNew, flex: isMobile ? '1 1 100%' : 'none'}} onClick={() => console.log("Nova Unidade")}>
            <Plus size={18} /> Nova Unidade
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{...filterCard, backgroundColor: theme.mainBg, borderColor: theme.border}}>
        <div style={filterRow}>
            <div style={filterGroup}>
                <div style={{...searchContainer, backgroundColor: theme.bg, borderColor: theme.border}}>
                  <Search size={16} color={theme.textSecondary} />
                  <input type="text" placeholder="Unidade..." style={{...searchInput, color: theme.text}} value={searchUnidade} onChange={(e) => setSearchUnidade(e.target.value)} />
                </div>
                {blocosDisponiveis.map(b => (
                  <button 
                    key={b} 
                    className={`filter-pill ${filterBloco === b ? 'active' : ''}`} 
                    onClick={() => setFilterBloco(b)}
                  >
                    {b === "Todos" ? "Todos" : `B${b}`}
                  </button>
                ))}
            </div>
            <div style={{display:'flex', gap:'20px', flexWrap: 'wrap'}}>
                <div style={pillContainer}>
                    <span style={{...filterMiniLabel, color: theme.textSecondary}}>Ocupação:</span>
                    {["Todos", "Sim", "Não"].map(o => (
                      <button key={o} className={`filter-pill ${filterOcupado === o ? 'active' : ''}`} onClick={() => setFilterOcupado(o)}>{o}</button>
                    ))}
                </div>
                <div style={pillContainer}>
                    <span style={{...filterMiniLabel, color: theme.textSecondary}}>Status:</span>
                    {["Todos", "Adimplente", "Inadimplente"].map(s => (
                      <button key={s} className={`filter-pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s}</button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// ESTILOS MANTIDOS
const pageContainer = { padding: "20px", maxWidth: "1200px", width: "100%", margin: "0 auto" };
const headerStyle = { marginBottom: '24px' };
const titleStyle = { fontSize: '24px', fontWeight: '700', margin: 0 };
const btnNew = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const btnWhite = { border: '1px solid', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const filterCard = { padding: '15px 20px', borderRadius: '16px', border: '1px solid', marginBottom: '20px' };
const filterRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' };
const filterGroup = { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' };
const searchContainer = { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '8px', border: '1px solid' };
const searchInput = { border: 'none', background: 'none', padding: '8px 0', outline: 'none', fontSize: '13px' };
const pillContainer = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' };
const filterMiniLabel = { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' };