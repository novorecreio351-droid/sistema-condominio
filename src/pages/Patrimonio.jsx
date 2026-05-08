import React from "react";
import { useTheme } from "../App";
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  MapPin, 
  BarChart3, 
  Search, 
  Plus, 
  Filter,
  Monitor,
  Printer,
  Armchair,
  Truck,
  ShieldCheck,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Patrimonio() {
  const { theme } = useTheme();


  return (
    <div style={{ padding: "20px", backgroundColor: theme.bg }}>
      {/* HEADER SECTION */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", color: theme.text }}>
            Inventário de Patrimônio
          </h1>
          <p style={{ color: theme.textSecondary, fontSize: "14px" }}>
            Gerencie e monitore os ativos fixos da sua organização em tempo real.
          </p>
        </div>
        <button style={btnPrimary}>
          <Plus size={18} />
          ADICIONAR NOVO ATIVO
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={statsGrid}>
        <div style={{ ...cardBase, backgroundColor: theme.mainBg, borderColor: theme.border }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: theme.textSecondary }}>VALOR TOTAL EM ATIVOS</span>
            <BarChart3 size={18} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", margin: "10px 0", color: theme.text }}>
            R$ 1.240.500,00
          </h2>
          <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>
            ↗ +4.2% <span style={{ color: theme.textSecondary, fontWeight: "400" }}>em relação ao mês anterior</span>
          </span>
        </div>

        <div style={{ ...cardBase, backgroundColor: theme.mainBg, borderColor: theme.border, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <StatItem label="ATIVOS TOTAIS" value="1.248" color={theme.text} />
            <StatItem label="EM MANUTENÇÃO" value="12" color="#ef4444" />
            <StatItem label="ARMAZENADOS" value="42" color={theme.textSecondary} />
        </div>
      </div>

      {/* FILTERS AREA */}
      <div style={{ ...filtersContainer, backgroundColor: theme.mainBg, borderColor: theme.border }}>
        <div style={searchWrapper}>
          <Search size={18} color={theme.textSecondary} style={{ marginLeft: '12px' }} />
          <input 
            type="text" 
            placeholder="Filtrar por nome ou ID..." 
            style={{ ...inputSearch, color: theme.text }}
          />
        </div>
        <select style={{ ...selectStyle, backgroundColor: theme.bg, color: theme.text }}>
          <option>Todas Categorias</option>
        </select>
        <select style={{ ...selectStyle, backgroundColor: theme.bg, color: theme.text }}>
          <option>Todos Status</option>
        </select>
        <select style={{ ...selectStyle, backgroundColor: theme.bg, color: theme.text }}>
          <option>Localização</option>
        </select>
        <button style={btnFilterClear}>LIMPAR</button>
      </div>

      {/* TABLE */}
      <div style={{ ...tableWrapper, backgroundColor: theme.mainBg, border: `1px solid ${theme.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}`, textAlign: "left" }}>
              <th style={thStyle}>ID DO ATIVO</th>
              <th style={thStyle}>NOME</th>
              <th style={thStyle}>CATEGORIA</th>
              <th style={thStyle}>LOCALIZAÇÃO</th>
              <th style={thStyle}>STATUS</th>
              <th style={thStyle}>DATA AQUISIÇÃO</th>
              <th style={thStyle}>VALOR</th>
              <th style={{ ...thStyle, textAlign: "center" }}>AÇÕES</th>
            </tr>
          </thead>
          
        </table>

        {/* PAGINATION */}
        <div style={paginationStyle}>
          <span style={{ fontSize: "13px", color: theme.textSecondary }}>Exibindo 1-5 de 1.248 itens registrados</span>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <button style={btnPage}><ChevronLeft size={16}/></button>
            <button style={{ ...btnPage, backgroundColor: "#0f172a", color: "#fff" }}>1</button>
            <button style={btnPage}>2</button>
            <button style={btnPage}>3</button>
            <span style={{ color: theme.textSecondary }}>...</span>
            <button style={btnPage}>250</button>
            <button style={btnPage}><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Componentes Auxiliares Internos */

function StatItem({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '5px' }}>{label}</p>
      <h3 style={{ fontSize: '22px', fontWeight: '700', color: color }}>{value}</h3>
    </div>
  );
}

function TableRow({ id, nome, categoria, local, status, data, valor, theme }) {
  const getStatusStyle = (s) => {
    const base = { padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700" };
    if (s === "ATIVO") return { ...base, backgroundColor: "#f0fdf4", color: "#16a34a" };
    if (s === "MANUTENÇÃO") return { ...base, backgroundColor: "#fffbeb", color: "#d97706" };
    return { ...base, backgroundColor: "#f1f5f9", color: "#475569" };
  };

  return (
    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
      <td style={tdStyle}><span style={{ fontWeight: "600" }}>{id}</span></td>
      <td style={tdStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ padding: "8px", backgroundColor: theme.bg, borderRadius: "8px" }}><Icon size={16} color={theme.textSecondary}/></div>
          <span style={{ fontWeight: "500", color: theme.text }}>{nome}</span>
        </div>
      </td>
      <td style={tdStyle}>{categoria}</td>
      <td style={tdStyle}>{local}</td>
      <td style={tdStyle}><span style={getStatusStyle(status)}>{status}</span></td>
      <td style={tdStyle}>{data}</td>
      <td style={tdStyle}><span style={{ fontWeight: "600" }}>{valor}</span></td>
      <td style={{ ...tdStyle, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <Eye size={16} color={theme.textSecondary} style={{ cursor: 'pointer' }} />
            <Edit2 size={16} color={theme.textSecondary} style={{ cursor: 'pointer' }} />
        </div>
      </td>
    </tr>
  );
}

/* Estilos */

const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" };
const btnPrimary = { backgroundColor: "#0f172a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" };
const statsGrid = { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px", marginBottom: "25px" };
const cardBase = { padding: "24px", borderRadius: "12px", border: "1px solid" };
const filtersContainer = { padding: "15px", borderRadius: "12px", border: "1px solid", display: "flex", gap: "12px", marginBottom: "20px", alignItems: "center" };
const searchWrapper = { display: "flex", alignItems: "center", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", flex: 1 };
const inputSearch = { border: "none", background: "none", padding: "10px", outline: "none", width: "100%", fontSize: "14px" };
const selectStyle = { padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", cursor: "pointer", minWidth: "150px" };
const btnFilterClear = { background: "none", border: "none", color: "#64748b", fontWeight: "600", fontSize: "12px", cursor: "pointer", marginLeft: "10px" };
const tableWrapper = { borderRadius: "12px", overflow: "hidden" };
const thStyle = { padding: "15px", fontSize: "11px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", backgroundColor: "#f8fafc" };
const tdStyle = { padding: "15px", fontSize: "13px", color: "#475569" };
const paginationStyle = { padding: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9" };
const btnPage = { width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", cursor: "pointer", fontSize: "13px" };