 
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, Search, Plus, Edit2, Trash2, X, Loader2, 
  ChevronLeft, ChevronRight, MoreVertical, Eye, DollarSign,
  FileText, Download, RotateCcw, CheckCircle2, AlertCircle, User, Paperclip, UploadCloud, ChevronDown, FileCheck
} from "lucide-react";
import { useTheme } from "../App";

// Bibliotecas para exportação
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";
const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;

// --- ESTILOS ---
const pageContainer = { padding: "20px", maxWidth: "1200px", margin: "0 auto" };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const titleStyle = { fontSize: '24px', fontWeight: '700', margin: 0 };

const btnNew = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const btnWhite = { border: '1px solid', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };

const filterCard = { padding: '15px 20px', borderRadius: '16px', border: '1px solid', marginBottom: '20px' };
const filterRow = { display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' };
const filterGroup = { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' };
const searchContainer = { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '8px', border: '1px solid' };
const searchInput = { border: 'none', background: 'none', padding: '8px 0', outline: 'none', fontSize: '13px' };

const pillContainer = { display: 'flex', alignItems: 'center', gap: '8px' };
const filterMiniLabel = { fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', opacity: 0.7 };

const tableCard = { borderRadius: '16px', border: '1px solid', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRow = { borderBottom: '1px solid' };
const thStyle = { textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' };
const tdStyle = { padding: '16px 24px', fontSize: '14px' };
const trStyle = { transition: '0.2s' };

const badgeGreen = { backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' };
const badgeRed = { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' };

const paginationFooter = { padding: '15px 24px', borderTop: '1px solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };


const actionBtnStyle = { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#ffffff' };

const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { padding: '24px', borderRadius: '20px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const labelStyle = { fontSize: '11px', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase', color: '#64748b' };
const viewBox = { padding: '12px', borderRadius: '12px', fontSize: '13px', border: '1px solid', lineHeight: '1.6' };
const fullScreenLoaderOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };
const loadingOverlay = { 
  position: 'fixed', 
  top: 0, 
  left: 0, 
  width: '100%', 
  height: '100%', 
  backgroundColor: 'rgba(15, 23, 42, 0.7)', // Azul escuro bem elegante com opacidade
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  zIndex: 1000,
};

const selectStyle = { 
  padding: '10px', 
  borderRadius: '8px', 
  border: '1px solid #e2e8f0', // Adicionei uma cor de borda padrão
  outline: 'none', 
  fontSize: '14px',
  width: '100%', // Geralmente labels em modais ocupam a largura total
  backgroundColor: 'white'
};

export default function Compras({ user }) {
  const { theme } = useTheme();

  // 1. ESTADOS DE DADOS E USUÁRIO
  const [currentUser, setCurrentUser] = useState({ nome: "Sistema" });
  const [compras, setCompras] = useState([]); 
  const [listaLocais, setListaLocais] = useState([]); 
  const [unidadesRaw, setUnidadesRaw] = useState([]);
  
  // 2. ESTADOS DE FILTROS E PAGINAÇÃO
  const [searchGeral, setSearchGeral] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("");
  const [searchFornecedor, setSearchFornecedor] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterCategoria, setFilterCategoria] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Estados dinâmicos
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState(["Todos"]);
  const [statusDisponiveis, setStatusDisponiveis] = useState(["Todos"]);

  // Estados do Modal e UI
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [arquivos, setArquivos] = useState([]);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);


  // Adicione estes estados dentro da função Compras
  const [showMenuId, setShowMenuId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [modalType, setModalType] = useState("add"); // "add" ou "edit"
  const menuRef = useRef(null);

 const [formData, setFormData] = useState({
  titulo_solicitacao: "",
  categoria: "",
  obs: "",
  valor: "",
  fornecedor: "",
  requer_aprovacao: "Sim",
  status: "Pendente",
  unidade: "",
  solicitado_data: new Date().toISOString().split('T')[0],
  comprado_data: ""
});

const [listaProdutos, setListaProdutos] = useState([]);
const [tempProduto, setTempProduto] = useState({ nome: "", qtd: 1 });

  // 3. VARIÁVEIS DE FILTRAGEM (Calculadas primeiro)
  
  // Filtro principal da tabela
  const dadosFiltrados = compras.filter(item => {
    const matchGeral = (item.titulo_solicitacao || "").toLowerCase().includes(searchGeral.toLowerCase()) || 
                       (item.produto || "").toLowerCase().includes(searchGeral.toLowerCase());
    const matchUnidade = filterUnidade === "" || (item.unidade || "").toLowerCase().includes(filterUnidade.toLowerCase());
    const matchFornecedor = (item.fornecedor || "").toLowerCase().includes(searchFornecedor.toLowerCase());
    const matchStatus = filterStatus === "Todos" || item.status === filterStatus;
    const matchCategoria = filterCategoria === "Todos" || item.categoria === filterCategoria;

    return matchGeral && matchUnidade && matchFornecedor && matchStatus && matchCategoria;
  });

  // 4. LÓGICA DE PAGINAÇÃO (Calculada após a filtragem)
  // Cálculo para paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dadosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dadosFiltrados.length / itemsPerPage);

  // Filtro do dropdown de unidades (Modal)
  const unidadesFiltradas = listaLocais.filter(local => 
    local.toLowerCase().includes(unitSearch.toLowerCase())
  );

  // 5. EFEITOS
  useEffect(() => {
    setCurrentPage(1);
  }, [searchGeral, filterUnidade, searchFornecedor, filterStatus, filterCategoria]);



  // 6. FUNÇÕES
  const extrairFiltrosDinâmicos = (dados) => {
    const cats = dados.map(item => item.categoria).filter(c => c && c.trim() !== "");
    setCategoriasDisponiveis(["Todos", ...new Set(cats)]);

    const sts = dados.map(item => item.status).filter(s => s && s.trim() !== "");
    setStatusDisponiveis(["Todos", ...new Set(sts)]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setArquivos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
  // Alteração na validação: agora checamos se há produtos na lista
  if (!formData.titulo_solicitacao || !formData.unidade || listaProdutos.length === 0) {
    return alert("Preencha Título, Unidade e adicione pelo menos um produto.");
  }

  setLoading(true);
  const isEditing = !!formData.id;
  const idGerado = isEditing ? formData.id : "COMP-" + Date.now();

  try {
    const payload = {
      token: TOKEN,
      // Sugestão: use uma action específica ou trate o array 'itens' no App Script
      action: isEditing ? "edit" : "add", 
      sheet: "COMPRAS",
      id: idGerado,
      user: currentUser?.nome || "Sistema",
      ...formData,
      // Removemos o campo 'produto' fixo e enviamos a nova lista
      itens: listaProdutos, 
      arquivos: arquivos
    };

    await fetch(API_URL, { 
      method: "POST", 
      mode: "no-cors", 
      body: JSON.stringify(payload) 
    });

    // Reset de estados após sucesso
    setShowModal(false);
    setListaProdutos([]); // Limpa a lista de produtos
    setFormData({
      titulo_solicitacao: "", 
      categoria: "", 
      obs: "", 
      valor: "",
      fornecedor: "", 
      requer_aprovacao: "Sim", 
      status: "Pendente", 
      unidade: "",
      solicitado_data: new Date().toISOString().split('T')[0], 
      comprado_data: ""
    });
    setArquivos([]);
    window.location.reload(); 

  } catch (error) {
    console.error("Erro crítico:", error);
    alert("Erro ao salvar os dados.");
  } finally {
    setLoading(false);
  }
};

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);

  // 1. Ativa o loading logo no início
  setLoading(true);

  const saved = localStorage.getItem("user");
  if (saved) {
    try {
      const parsedUser = JSON.parse(saved);
      if (parsedUser?.nome) {
        setCurrentUser(parsedUser);
        setFormData(prev => ({ ...prev, solicitado_por: parsedUser.nome }));
      }
    } catch (e) { console.error("Erro user:", e); }
  }

  const areasComuns = ["Portaria", "Área externa", "Piscina", "Salão de jogos", "Salão de festas", "Churrasqueira ch-a", "Churrasqueira ch-b", "Geral"];

  // 2. Criamos as promessas das duas chamadas
  const fetchUnidades = fetch(`${API_URL}?token=${TOKEN}&sheet=UNIDADES`, { method: "GET", redirect: "follow" })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        const blocosUnicos = [...new Set(data.map(item => item.bloco || item.BLOCO))]
          .filter(b => b)
          .map(b => `Bloco ${b}`)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setListaLocais([...areasComuns, ...blocosUnicos]);
      }
    })
    .catch(() => setListaLocais(areasComuns));

  const fetchCompras = fetch(`${API_URL}?token=${TOKEN}&sheet=COMPRAS`, { method: "GET", redirect: "follow" })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        setCompras(data);
        extrairFiltrosDinâmicos(data); 
      }
    })
    .catch(err => console.error("Erro ao buscar compras:", err));

  // 3. O Promise.all espera AMBAS terminarem
  Promise.all([fetchUnidades, fetchCompras])
    .finally(() => {
      // Pequeno delay de 300ms para garantir que o React renderizou os itens na tabela
      setTimeout(() => {
        setLoading(false);
      }, 300);
    });

  return () => window.removeEventListener('resize', handleResize);
}, []);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenuId(null);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

const handleEdit = (compra) => {
  setSelectedCompra(compra);
  setFormData({ ...compra });
  setModalType("edit");
  setShowModal(true);
  setShowMenuId(null);
};

const handleView = (compra) => {
  setSelectedCompra(compra);
  setShowViewModal(true);
  setShowMenuId(null);
};

const handleGerarAprovacao = (item) => {
  const idSolicitacao = item.solicitacao; // Ex: C54004
  
  // Pega a URL base atual (http://localhost:5173 ou https://sistema-condominio-three.vercel.app)
  const base = window.location.origin;
  
  // Monta o link final
  const linkAprovacao = `${base}/aprovacao?id=${idSolicitacao}`;
  
  // Redireciona o usuário
  window.location.href = linkAprovacao;
};

const handleDelete = async (id) => {
  if (window.confirm("Deseja excluir esta compra permanentemente?")) {
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ 
          token: TOKEN, 
          action: "delete", 
          sheet: "COMPRAS", 
          id: id.toString() 
        })
      });
      // Recarregar os dados após excluir (fetchData() deve ser a sua função de busca)
      window.location.reload(); 
    } catch (error) {
      alert("Erro ao excluir.");
    } finally {
      setLoading(false);
      setShowMenuId(null);
    }
  }
  
};
const ActionMenuItem = ({ onClick, icon: Icon, label, color, theme }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '10px 16px',
        border: 'none',
        background: isHovered 
          ? (theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#06121f') 
          : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '14px',
        fontWeight: '500',
        color: color || theme.text,
        transition: 'all 0.2s ease',
        borderRadius: '8px' // Festas costuma usar bordas arredondadas nos itens
      }}
    >
      <Icon size={16} style={{ opacity: 0.8 }} />
      {label}
    </button>
  );
};

  // ... (JSX do return abaixo)

     return (
    <div style={pageContainer}>
      {/* --- LOADING GLOBAL --- */}
      {/* --- LOADING GLOBAL IGUAL A UNIDADES.JSX --- */}
{loading && (
  <div style={loadingOverlay}>
    <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .custom-loader { animation: spin 1s linear infinite; }
    `}</style>
    <div style={{ textAlign: 'center' }}>
      <Loader2 
        className="custom-loader" 
        size={50} // Tamanho exato do Unidades.jsx
        color="#3b82f6" 
      />
    </div>
  </div>
)}

      <style>{`
        .filter-pill { padding: 6px 12px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; cursor: pointer; font-size: 12px; font-weight: 500; color: ${theme.textSecondary}; transition: 0.2s; }
        .filter-pill.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .table-row-hover:hover { background-color: ${theme.isDark ? '#1e293b' : '#f8fafc'}; }
      `}</style>

      {/* 1. HEADER E BOTÕES */}
      <div style={{ ...headerStyle, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '20px' : '10px' }}>
        <div>
          <h1 style={{...titleStyle, color: theme.text}}>Compras</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: theme.textSecondary }}>Gerencie as compras do condomínio.</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: theme.textSecondary }}>Logado como: <strong style={{ color: theme.text }}>{currentUser.nome}</strong></p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => console.log("Excel")}>
            <Download size={18} color="#166534" /> Excel
          </button>
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => console.log("PDF")}>
            <FileText size={18} color="#b91c1c" /> PDF
          </button>
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => { setSearchGeral(""); setFilterUnidade(""); setFilterStatus("Todos"); setFilterCategoria("Todos"); }}>
            <RotateCcw size={18} /> Redefinir
          </button>
          <button style={{...btnNew, flex: isMobile ? '1 1 100%' : 'none'}} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nova Compra
          </button>
        </div>
      </div>

      {/* --- BLOCO DE FILTROS --- */}
      <div style={{...filterCard, backgroundColor: theme.mainBg, borderColor: theme.border, marginTop: '20px'}}>
        <div style={filterRow}>
          <div style={filterGroup}>
            <div style={{...searchContainer, backgroundColor: theme.bg, borderColor: theme.border, minWidth: isMobile ? '100%' : '250px'}}>
              <Search size={16} color={theme.textSecondary} />
              <input 
                type="text" 
                placeholder="Título ou produto..." 
                style={{...searchInput, color: theme.text, width: '100%'}} 
                value={searchGeral} 
                onChange={(e) => setSearchGeral(e.target.value)} 
              />
            </div>
          </div>

          <div style={{display:'flex', gap:'20px', flexWrap: 'wrap', alignItems: 'center', width: isMobile ? '100%' : 'auto'}}>
            <div style={pillContainer}>
              <span style={{...filterMiniLabel, color: theme.textSecondary}}>Categoria:</span>
              <select 
                style={{
                  padding: '6px 10px', borderRadius: '8px', fontSize: '12px', 
                  backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`,
                  outline: 'none', cursor: 'pointer'
                }}
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
              >
                {categoriasDisponiveis.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={pillContainer}>
              <span style={{...filterMiniLabel, color: theme.textSecondary}}>Unidade:</span>
              <select 
                style={{
                  padding: '6px 10px', borderRadius: '8px', fontSize: '12px', 
                  backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`,
                  outline: 'none', cursor: 'pointer'
                }}
                value={filterUnidade}
                onChange={(e) => setFilterUnidade(e.target.value)}
              >
                <option value="">Todas</option>
                {listaLocais.map((local, idx) => (
                  <option key={idx} value={local}>{local}</option>
                ))}
              </select>
            </div>

            <div style={pillContainer}>
              <span style={{...filterMiniLabel, color: theme.textSecondary}}>Status:</span>
              <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                {statusDisponiveis.map(s => (
                  <button 
                    key={s} 
                    className={`filter-pill ${filterStatus === s ? 'active' : ''}`} 
                    onClick={() => setFilterStatus(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABELA DE DADOS AJUSTADA --- */}
      <div style={{ 
        backgroundColor: theme.mainBg, 
        borderRadius: '16px', 
        border: `1px solid ${theme.border}`, 
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
  <tr style={{ 
    ...thRow, 
    borderColor: theme.border, 
    backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc'
  }}>
    <th style={{ ...thStyle, color: theme.textSecondary }}>NUM. SOLICITAÇÃO</th>
    <th style={{ ...thStyle, color: theme.textSecondary }}>SOLICITADO EM</th>
    <th style={{ ...thStyle, color: theme.textSecondary }}>TÍTULO / SOLICITAÇÃO</th>
    <th style={{ ...thStyle, color: theme.textSecondary }}>UNIDADE</th>
    <th style={{ ...thStyle, color: theme.textSecondary }}>VALOR</th>
    <th style={{ ...thStyle, color: theme.textSecondary }}>STATUS</th>
    <th style={{ ...thStyle, color: theme.textSecondary, textAlign: 'center' }}>AÇÕES</th>
  </tr>
</thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}`, transition: '0.2s' }} className="table-row-hover">
                  {/* Num.Solicitacao */}
<td style={tdStyle}>
  <span style={{
    fontWeight: '600', 
    fontSize: '14px', 
    color: theme.text // Alterado de textSecondary para text
  }}>
    #{item.solicitacao}
  </span>
</td>
                  
                  {/* Solicitado em */}
<td style={{ ...tdStyle, color: theme.text }}>
  {(() => {
    const rawData = item.solicitado_data;
    if (!rawData) return '-';

    // 1. Tenta converter direto (caso venha ISO)
    let dataObj = new Date(rawData);

    // 2. Se falhar, tenta converter o formato "DD/MM/YYYY HH:mm"
    if (isNaN(dataObj.getTime()) && typeof rawData === 'string') {
      const [data, hora] = rawData.split(' ');
      const [dia, mes, ano] = data.split('/');
      // Cria no formato YYYY-MM-DD (que o JS entende sempre)
      dataObj = new Date(`${ano}-${mes}-${dia}${hora ? 'T' + hora : ''}`);
    }

    // 3. Se ainda assim for inválida, loga e mostra erro
    if (isNaN(dataObj.getTime())) {
      console.error("Erro crítico na data:", rawData);
      return <span style={{ color: '#ef4444' }}>Erro de Data</span>;
    }

    return dataObj.toLocaleDateString('pt-BR');
  })()}
</td>
                  
                  {/* Titulo Solicitação */}
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: theme.text }}>
                      {item.titulo_solicitacao || "Sem Título"}
                    </div>
                  </td>

                  {/* Unidade */}
                  <td style={{ ...tdStyle, color: theme.text }}>{item.unidade}</td>

                  {/* Valor */}
                  <td style={{ ...tdStyle, color: theme.text, fontWeight: '600' }}>
                    {item.valor ? Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                  </td>
                  
                  {/* Status */}
                  <td style={tdStyle}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: item.status === 'Comprado' ? '#dcfce7' : item.status === 'Pendente' ? '#fef9c3' : '#f1f5f9',
                      color: item.status === 'Comprado' ? '#166534' : item.status === 'Pendente' ? '#854d0e' : '#475569'
                    }}>
                      {item.status}
                    </span>
                  </td>

                  {/* Ações */}
<td style={{ ...tdStyle, position: 'relative', textAlign: 'center' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
    
    {/* Ícone do Olhinho Azul */}
    <button 
      onClick={() => handleView(item)}
      style={{ 
        background: 'none', 
        border: 'none', 
        color: '#3b82f6', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        transition: 'opacity 0.2s'
      }}
      title="Ver Detalhes"
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
    >
      <Eye size={18} />
    </button>

    {/* Menu Três Pontinhos */}
    <button 
      onClick={() => setShowMenuId(showMenuId === item.id ? null : item.id)}
      style={{ 
        background: 'none', 
        border: 'none', 
        color: theme.textSecondary, 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '4px'
      }}
    >
      <MoreVertical size={18} />
    </button>
  </div>

  {/* Menu Suspenso com Hover */}
  {showMenuId === item.id && (
    <div ref={menuRef} style={{
      position: 'absolute', 
      right: '40px', 
      top: '0px', 
      backgroundColor: theme.mainBg,
      border: `1px solid ${theme.border}`, 
      borderRadius: '10px', 
      zIndex: 100, 
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
      minWidth: '150px', 
      padding: '4px 0',
      overflow: 'hidden'
    }}>

      {/* --- REGRA: Requer Aprovação "Sim" e Status "Pendente" --- */}
    {(item.requer_aprovacao?.toLowerCase() === "sim" && item.status === "Pendente") && (
      <ActionMenuItem 
        theme={theme} 
        icon={CheckCircle2} // Ícone de aprovação
        label="Aprovação" 
        color="#8b5cf6" // Roxo/Violeta para destaque
        onClick={() => handleGerarAprovacao(item)} 
      />
    )}
      <ActionMenuItem 
        theme={theme} 
        icon={Edit2} 
        label="Editar" 
        onClick={() => handleEdit(item)} 
      />
      <ActionMenuItem 
        theme={theme} 
        icon={Trash2} 
        label="Excluir" 
        color="#ef4444" 
        onClick={() => handleDelete(item.id)} 
      />
    </div>
  )}
</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: theme.textSecondary }}>
                    Nenhum dado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINAÇÃO ESTILO UNIDADES.JSX --- */}
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 24px',
  backgroundColor: theme.mainBg,
  borderTop: `1px solid ${theme.border}`,
  fontSize: '14px',
  flexWrap: isMobile ? 'column' : 'row',
  gap: isMobile ? '15px' : '0'
}}>
  {/* Seletor de Itens por Página */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ color: theme.textSecondary }}>Exibir:</span>
    <select
      value={itemsPerPage === dadosFiltrados.length ? 'all' : itemsPerPage}
      onChange={(e) => {
        const val = e.target.value;
        setItemsPerPage(val === 'all' ? dadosFiltrados.length : Number(val));
        setCurrentPage(1);
      }}
      style={{
        padding: '6px 10px',
        borderRadius: '8px',
        backgroundColor: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        outline: 'none',
        cursor: 'pointer'
      }}
    >
      <option value={10}>10</option>
      <option value={20}>20</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
      <option value="all">Todos</option>
    </select>
    <span style={{ color: theme.textSecondary }}>
      de <b>{dadosFiltrados.length}</b> registros
    </span>
  </div>

  {/* Controles de Navegação */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
    <button
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      disabled={currentPage === 1}
      style={{
        background: 'none',
        border: 'none',
        color: currentPage === 1 ? theme.textSecondary : theme.primary || '#3b82f6',
        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        opacity: currentPage === 1 ? 0.5 : 1
      }}
    >
      <ChevronLeft size={22} />
    </button>
    
    <span style={{ color: theme.text, fontWeight: '600' }}>
      {currentPage} / {totalPages || 1}
    </span>

    <button
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      disabled={currentPage === totalPages || totalPages === 0}
      style={{
        background: 'none',
        border: 'none',
        color: (currentPage === totalPages || totalPages === 0) ? theme.textSecondary : theme.primary || '#3b82f6',
        cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1
      }}
    >
      <ChevronRight size={22} />
    </button>
  </div>
</div>
</div>
    {/* <Tabela dados={dadosFiltrados} /> */}

    {/* --- INÍCIO DO MODAL DE SOLICITAÇÃO (LIMPO) --- */}
    {showModal && (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(15, 23, 42, 0.7)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: isMobile ? '10px' : '20px'
      }}>
        <div style={{ 
          backgroundColor: theme.mainBg, 
          width: '100%', 
          maxWidth: '550px', 
          maxHeight: '90vh', 
          borderRadius: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
            
            
            {/* Cabeçalho Fixo */}
            <div style={{ 
              padding: '20px', 
              borderBottom: `1px solid ${theme.border}`, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexShrink: 0 // Impede que o cabeçalho "suma" na rolagem
            }}>
              <h3 style={{ margin: 0, color: theme.text, fontSize: '18px' }}>Nova Solicitação</h3>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer', padding: '5px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo com Rolagem (Scroll) */}
            <div style={{ 
              padding: '20px', 
              overflowY: 'auto', // Ativa a rolagem vertical
              flex: 1, // Faz este bloco ocupar o espaço restante
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px' 
            }}>
              
              {/* Exemplo do campo de Unidade para manter a referência */}
              <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Unidade</label>
                <div 
                  onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                  style={{ ...selectStyle, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  {formData.unidade || "Selecione a unidade..."}
                  <ChevronDown size={16} />
                </div>
                {/* O dropdown da unidade continua aqui... */}
                {showUnitDropdown && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: theme.mainBg, border: `1px solid ${theme.border}`, borderRadius: '8px', zIndex: 1200, boxShadow: '0 8px 16px rgba(0,0,0,0.2)', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ padding: '8px' }}>
                            <input
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, outline: 'none' }}
                                placeholder="Buscar local..."
                                autoFocus
                                value={unitSearch}
                                onChange={(e) => setUnitSearch(e.target.value)}
                            />
                        </div>
                        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {unidadesFiltradas.map((u, idx) => (
                                <div
                                    key={idx}
                                    style={{ padding: '10px 15px', cursor: 'pointer', fontSize: '13px', borderBottom: `1px solid ${theme.border}` }}
                                    onClick={() => {
                                        setFormData({ ...formData, unidade: u });
                                        setShowUnitDropdown(false);
                                        setUnitSearch("");
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = theme.bg}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    {u}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>

              <div>
  <label style={labelStyle}>Título da Solicitação</label>
  <input 
    style={{ 
      ...selectStyle, 
      width: '100%', 
      backgroundColor: theme.bg, 
      color: theme.text, 
      borderColor: theme.border 
    }} 
    placeholder="Ex: Troca de lâmpadas do hall"
    value={formData.titulo_solicitacao} 
    onChange={(e) => setFormData({ ...formData, titulo_solicitacao: e.target.value })} 
  />
</div>

              {/* Grid Produto e Categoria */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* SEÇÃO DE PRODUTOS DINÂMICOS */}
<div style={{ border: `1px solid ${theme.border}`, padding: '15px', borderRadius: '12px', backgroundColor: theme.bg }}>
  <label style={labelStyle}>Itens da Compra</label>
  
  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
    <input 
      style={{ ...selectStyle, flex: 3, backgroundColor: theme.mainBg }} 
      placeholder="Nome do produto..."
      value={tempProduto.nome}
      onChange={(e) => setTempProduto({...tempProduto, nome: e.target.value})}
    />
    <input 
      type="number"
      style={{ ...selectStyle, flex: 1, backgroundColor: theme.mainBg }} 
      placeholder="Qtd"
      value={tempProduto.qtd}
      onChange={(e) => setTempProduto({...tempProduto, qtd: e.target.value})}
    />
    <button 
      onClick={() => {
        if(tempProduto.nome) {
          setListaProdutos([...listaProdutos, tempProduto]);
          setTempProduto({ nome: "", qtd: 1 });
        }
      }}
      style={{ ...btnNew, padding: '8px' }}
    >
      <Plus size={18} />
    </button>
  </div>

  {/* Lista de produtos adicionados */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    {listaProdutos.map((p, idx) => (
      <div key={idx} style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '8px', backgroundColor: theme.mainBg, borderRadius: '8px', fontSize: '13px' 
      }}>
        <span><strong>{p.qtd}x</strong> {p.nome}</span>
        <Trash2 
          size={14} 
          color="#ef4444" 
          cursor="pointer" 
          onClick={() => setListaProdutos(listaProdutos.filter((_, i) => i !== idx))} 
        />
      </div>
    ))}
  </div>
</div>
                <div>
                  <label style={labelStyle}>Categoria</label>
<select 
  style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} 
  value={formData.categoria} 
  onChange={e => setFormData({...formData, categoria: e.target.value})}
>
  <option value="">Selecione...</option>
  <option value="Administrativo">Administrativo</option>
  <option value="Elétrica">Elétrica</option>
  <option value="Equipamentos">Equipamentos</option>
  <option value="Hidráulica">Hidráulica</option>
  <option value="Jardinagem">Jardinagem</option>
  <option value="Limpeza">Limpeza</option>
  <option value="Manutenção">Manutenção</option>
  <option value="Obras">Obras</option>
  <option value="Piscina">Piscina</option>
  <option value="Segurança">Segurança</option>
  <option value="Outros">Outros</option>
</select>
                </div>
              </div>

              {/* Grid Valor e Aprovação */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Valor Estimado</label>
                  <input type="number" style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Aprovação?</label>
                  <select style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} value={formData.requer_aprovacao} onChange={e => setFormData({...formData, requer_aprovacao: e.target.value})}>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Fornecedor</label>
                <input style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} value={formData.fornecedor} onChange={e => setFormData({...formData, fornecedor: e.target.value})} />
              </div>

              {/* Grid de Datas */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
  <div>
    <label style={labelStyle}>Data da Solicitação</label>
    <input 
      type="date" 
      style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} 
      value={formData.solicitado_data} 
      onChange={e => setFormData({...formData, solicitado_data: e.target.value})} 
    />
  </div>

  {/* CAMPO CONDICIONAL: Só aparece se o status for "Comprado" */}
  {formData.status === "Comprado" && (
    <div>
      <label style={labelStyle}>Data da Compra</label>
      <input 
        type="date" 
        style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} 
        value={formData.comprado_data} 
        onChange={e => setFormData({...formData, comprado_data: e.target.value})} 
      />
    </div>
  )}
</div>

{/* Seletor de Status (Para você conseguir testar a aparição do campo acima) */}
<div>
  <label style={labelStyle}>Status</label>
  <select 
    style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} 
    value={formData.status} 
    onChange={e => setFormData({...formData, status: e.target.value})}
  >
    <option value="Pendente">Pendente</option>
    <option value="Em Cotação">Em Cotação</option>
    <option value="Comprado">Comprado</option>
    <option value="Cancelado">Cancelado</option>
  </select>
</div>

              <div>
                <label style={labelStyle}>Observações</label>
                <textarea style={{ ...selectStyle, width: '100%', height: '60px', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} value={formData.obs} onChange={e => setFormData({...formData, obs: e.target.value})} />
              </div>

              {/* Seção de Anexos */}
              <div>
                <label style={labelStyle}>Anexos</label>
                <div 
                  onClick={() => fileInputRef.current.click()}
                  style={{ border: `2px dashed ${theme.border}`, padding: '15px', borderRadius: '12px', textAlign: 'center', backgroundColor: theme.bg, cursor: 'pointer' }}
                >
                  <UploadCloud size={24} style={{ color: theme.textSecondary, marginBottom: '5px' }} />
                  <span style={{ fontSize: '12px', display: 'block' }}>Clique para anexar</span>
                  <input 
  type="file" 
  ref={fileInputRef} 
  hidden 
  multiple 
  accept="image/*,.pdf" // Aceita imagens e PDFs
  onChange={handleFileChange} 
/>
                </div>
                {/* Seção de Visualização de Anexos Atualizada */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {arquivos.map((base64, idx) => {
                    // Verifica se o conteúdo é um PDF pelo prefixo do Base64
                    const isPDF = base64.startsWith("data:application/pdf");
                    
                    return (
                      <div key={idx} style={{ position: 'relative' }}>
                        {isPDF ? (
                          // Visualização para PDF
                          <div style={{ 
                            width: '60px', height: '60px', borderRadius: '8px', 
                            backgroundColor: '#fee2e2', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}` 
                          }}>
                            <FileText size={24} color="#b91c1c" />
                          </div>
                        ) : (
                          // Visualização para Imagens (JPEG, PNG, JPG)
                          <img 
                            src={base64} 
                            style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${theme.border}` }} 
                            alt="preview" 
                          />
                        )}
                        
                        {/* Botão para remover o arquivo da lista antes de salvar */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setArquivos(arquivos.filter((_, i) => i !== idx));
                          }}
                          style={{ 
                            position: 'absolute', top: '-6px', right: '-6px', 
                            background: '#ef4444', color: 'white', borderRadius: '50%', 
                            border: '2px solid white', width: '20px', height: '20px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                style={{ 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  marginTop: '10px',
                  flexShrink: 0 
                }} 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Salvar Solicitação"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIM DO MODAL --- */}

      {showViewModal && selectedCompra && (
  <div style={modalOverlay}>
    <div style={{ ...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '500px' }}>
      <div style={modalHeader}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
          Solicitação #{selectedCompra.solicitacao}
        </h2>
        <button 
  onClick={() => setShowViewModal(false)} 
  style={{ 
    background: 'none', 
    border: 'none', 
    color: theme.text,
    cursor: 'pointer', // Adiciona o ponteiro de "mãozinha"
    display: 'flex', 
    alignItems: 'center', 
    padding: '5px',
    transition: 'opacity 0.2s' 
  }}
  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
>
  <X size={20} />
</button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Primeiro Quadrado - Informações Principais */}
        <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border, padding: '12px', borderRadius: '8px' }}>
          <p><strong>Título / Solicitação:</strong> {selectedCompra.titulo_solicitacao}</p>
          <p><strong>Produto:</strong> {selectedCompra.produto}</p>
          <p><strong>Fornecedor:</strong> {selectedCompra.fornecedor}</p>
          <p><strong>Valor:</strong> R${selectedCompra.valor}</p>
        </div>

        {/* Segundo Quadrado - Classificação */}
        <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border, padding: '12px', borderRadius: '8px' }}>
          <p><strong>Categoria:</strong> {selectedCompra.categoria}</p>
          <p><strong>Unidade:</strong> {selectedCompra.unidade}</p>
        </div>

        {/* Datas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border }}>
                <strong>Solicitado em:</strong>  {selectedCompra.solicitado_data?.split(' ')[0]}
            </div>
            <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border }}>
                <strong>Comprado em:</strong> {selectedCompra.comprado_data}
            </div>
        </div>

        {/* Detalhes de Controle */}
        <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border }}>
          <p><strong>Solicitado por:</strong> {selectedCompra.solicitado_por}</p>
          <p><strong>Requer Aprovação:</strong> {selectedCompra.requer_aprovacao}</p>
        </div>

        {/* Quadrado do Status - Proporcional à Tabela */}
<div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <strong style={{ fontSize: '13px' }}>Status:</strong>
    <span style={{
      padding: '4px 10px', // Mesmo padding da sua tabela
      borderRadius: '20px',
      fontSize: '12px',      // Mesma fonte da sua tabela
      fontWeight: '700',
      backgroundColor: 
        selectedCompra.status === 'Comprado' ? '#dcfce7' : 
        selectedCompra.status === 'Pendente' ? '#fef9c3' : 
        selectedCompra.status === 'Cancelado' ? '#fee2e2' : '#f1f5f9',
      color: 
        selectedCompra.status === 'Comprado' ? '#166534' : 
        selectedCompra.status === 'Pendente' ? '#854d0e' : 
        selectedCompra.status === 'Cancelado' ? '#b91c1c' : '#475569'
    }}>
      {selectedCompra.status}
    </span>
  </div>
</div>

        {/* Observações */}
        {selectedCompra.obs && (
          <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border }}>
            <strong>Observações:</strong>
            <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap', color: theme.textSecondary, fontSize: '14px' }}>
              {selectedCompra.obs}
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={() => setShowViewModal(false)} 
        style={{ ...btnNew, width: '100%', marginTop: '20px', justifyContent: 'center' }}
      >
        Fechar
      </button>
    </div>
  </div>
)}
    </div>
  );
}

  

  

  