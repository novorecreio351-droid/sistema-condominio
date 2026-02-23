 
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
const [tempProduto, setTempProduto] = useState({ nome: "", qtd: 1, valor: "" });

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
  if (!formData.titulo_solicitacao || !formData.unidade || listaProdutos.length === 0) {
    return alert("Preencha Título, Unidade e adicione produtos.");
  }

  setLoading(true);
  const isEditing = !!formData.id;
  const idGerado = isEditing ? formData.id : "COMP-" + Date.now();

  // SEPARAÇÃO DE ARQUIVOS:
  // 1. Novos: Strings que começam com "data:image" ou "data:application/pdf"
  const novosArquivos = arquivos.filter(a => typeof a === 'string' && a.startsWith("data:"));
  
  // 2. Manter: Pegamos apenas os IDs (idUpload) dos arquivos que já existiam e continuam na lista
  const arquivosManter = arquivos
    .filter(a => a.isExisting)
    .map(a => a.idUpload);

  try {
    const valorTotal = listaProdutos.reduce((acc, curr) => acc + (Number(curr.valor) * Number(curr.qtd || 1)), 0);

    const payload = {
      token: TOKEN,
      action: isEditing ? "edit" : "add",
      sheet: "COMPRAS",
      id: idGerado,
      ...formData,
      valor: valorTotal,
      itens: listaProdutos.map(item => ({
        produto: item.nome,
        quantidade: item.qtd,
        valor: item.valor
      })),
      
      // Enviamos as duas listas para o App Script
      arquivos: novosArquivos, 
      arquivosManter: arquivosManter 
    };

    await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });

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

const fetchItensCompra = async (idCompra) => {
  try {
    const response = await fetch(`${API_URL}?token=${TOKEN}&sheet=COMPRAS_PRODUTOS`, { method: "GET" });
    const data = await response.json();
    if (Array.isArray(data)) {
      // Filtra apenas os itens que pertencem a esta compra (ID_COMPRA é a segunda coluna)
      return data.filter(item => item.id_compra === idCompra || item.ID_COMPRA === idCompra).map(item => ({
        nome: item.produto || item.PRODUTO,
        qtd: item.quantidade || item.QUANTIDADE,
        valor: item.valor || item.VALOR
      }));
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    return [];
  }
};

const fetchAnexosCompra = async (idCompra) => {
  try {
    const response = await fetch(`${API_URL}?token=${TOKEN}&sheet=UPLOADS_COMPRAS`, { method: "GET" });
    const data = await response.json();
    
    if (Array.isArray(data)) {
      // Filtramos e retornamos um objeto com o ID da linha e a URL do arquivo
      return data
        .filter(item => String(item.ID_COMPRAS || item.id_compras).trim() === String(idCompra).trim())
        .map(item => ({
          idUpload: item.ID || item.id, // ID da Coluna A (UPC-...)
          url: item.URL_DRIVE || item.url_drive,
          isExisting: true 
        }));
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar anexos:", error);
    return [];
  }
};

const getGoogleDrivePreview = (file) => {
  // Se for nulo ou indefinido
  if (!file) return "";
  
  // Se for o objeto que criamos no fetch, extrai a propriedade .url
  // Senão, usa o próprio valor (caso seja uma string direta)
  const url = (typeof file === 'object' && file !== null) ? file.url : file;

  if (typeof url !== "string") return "";

  if (url.startsWith("data:")) return url;

  // Extrai o ID do arquivo de links /file/d/... ou ?id=...
  const fileIdMatch = url.match(/[-\w]{25,}/);
  if (fileIdMatch) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[0]}&sz=w200`;
  }
  return url;
};
useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenuId(null);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

const formatarDataParaInput = (dataString) => {
  if (!dataString) return "";
  try {
    const str = String(dataString).trim();
    if (str.includes("/")) {
      const apenasData = str.split(" ")[0]; // Remove o 00:00:00
      const [dia, mes, ano] = apenasData.split("/");
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    const d = new Date(dataString);
    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : "";
  } catch (e) { return ""; }
};

const handleEdit = async (compra) => {
  setLoading(true); // Começa o loading
  try {
    const [itens, anexos] = await Promise.all([
      fetchItensCompra(compra.id),
      fetchAnexosCompra(compra.id)
    ]);
    
    setSelectedCompra(compra);
    setFormData({ 
      ...compra,
      solicitado_data: formatarDataParaInput(compra.data_solicitacao || compra.solicitado_data) 
    });
    
    setListaProdutos(itens);
    setArquivos(anexos); 
    setModalType("edit");
    
    setShowMenuId(null); 
    
    // PRIMEIRO: Manda o modal abrir
    setShowModal(true);
    
    // SEGUNDO: Espera um micro-tempo para o React processar a abertura e só então tira o loading
    setTimeout(() => {
      setLoading(false);
    }, 100);

  } catch (error) {
    console.error("Erro ao carregar dados para edição:", error);
    alert("Erro ao carregar dados.");
    setLoading(false);
  }
};

const handleView = async (compra) => {
  setLoading(true);
  setShowMenuId(null);
  
  try {
    const [itens, anexos] = await Promise.all([
      fetchItensCompra(compra.id),
      fetchAnexosCompra(compra.id)
    ]);
    
    setSelectedCompra({ 
      ...compra, 
      itensRelacionados: itens,
      anexosRelacionados: anexos 
    });
    
    // PRIMEIRO: Ativa a visualização do modal
    setShowViewModal(true);
    
    // SEGUNDO: Só remove o loading após o comando de abrir o modal ser processado
    setTimeout(() => {
      setLoading(false);
    }, 100);

  } catch (error) {
    console.error("Erro ao carregar detalhes:", error);
    alert("Não foi possível carregar os detalhes.");
    setLoading(false);
  }
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

           {/* 1. SEÇÃO DE PRODUTOS DINÂMICOS (LARGURA TOTAL) */}
<div style={{ 
  border: `1px solid ${theme.border}`, 
  padding: '15px', 
  borderRadius: '12px', 
  backgroundColor: theme.bg,
  marginBottom: '15px' 
}}>
  <label style={labelStyle}>Itens da Compra</label>
  
  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-end' }}>
    <div style={{ flex: 3 }}>
      <input 
        style={{ ...selectStyle, width: '100%', backgroundColor: theme.mainBg, color: theme.text }} 
        placeholder="Produto"
        value={tempProduto.nome}
        onChange={(e) => setTempProduto({...tempProduto, nome: e.target.value})}
      />
    </div>
    <div style={{ flex: 0.8 }}>
      <input 
        type="number"
        style={{ ...selectStyle, width: '100%', backgroundColor: theme.mainBg, color: theme.text }} 
        placeholder="Qtd"
        value={tempProduto.qtd}
        onChange={(e) => setTempProduto({...tempProduto, qtd: e.target.value})}
      />
    </div>
    <div style={{ flex: 1.2 }}>
      <input 
        type="number"
        style={{ ...selectStyle, width: '100%', backgroundColor: theme.mainBg, color: theme.text }} 
        placeholder="Valor R$"
        value={tempProduto.valor}
        onChange={(e) => setTempProduto({...tempProduto, valor: e.target.value})}
      />
    </div>
    <button 
      onClick={() => {
        if(tempProduto.nome) {
          setListaProdutos([...listaProdutos, tempProduto]);
          setTempProduto({ nome: "", qtd: 1, valor: "" });
        }
      }}
      style={{ ...btnNew, padding: '10px', height: '42px' }}
    >
      <Plus size={18} />
    </button>
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '150px', overflowY: 'auto' }}>
    {listaProdutos.map((p, idx) => (
      <div key={idx} style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '8px', backgroundColor: theme.mainBg, borderRadius: '8px', fontSize: '13px' 
      }}>
        <div style={{ display: 'flex', gap: '10px', color: theme.text }}>
          <span style={{ fontWeight: '700' }}>{p.qtd}x</span>
          <span>{p.nome}</span>
          <span style={{ color: theme.textSecondary }}>- R$ {Number(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <Trash2 size={14} color="#ef4444" cursor="pointer" onClick={() => setListaProdutos(listaProdutos.filter((_, i) => i !== idx))} />
      </div>
    ))}
  </div>
</div>

{/* 2. CATEGORIA */}
<div style={{ marginBottom: '15px' }}>
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

{/* 3. GRID: DATA SOLICITAÇÃO E APROVAÇÃO */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
  <div>
    <label style={labelStyle}>Data da Solicitação</label>
    <input 
      type="date" 
      style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} 
      value={formData.solicitado_data} 
      onChange={e => setFormData({...formData, solicitado_data: e.target.value})} 
    />
  </div>
  <div>
    <label style={labelStyle}>Aprovação?</label>
    <select 
      style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} 
      value={formData.requer_aprovacao} 
      onChange={e => setFormData({...formData, requer_aprovacao: e.target.value})}
    >
      <option value="Sim">Sim</option>
      <option value="Não">Não</option>
    </select>
  </div>
</div>

{/* 4. FORNECEDOR (DE VOLTA AQUI) */}
<div style={{ marginBottom: '15px' }}>
  <label style={labelStyle}>Fornecedor</label>
  <input 
    style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} 
    value={formData.fornecedor} 
    onChange={e => setFormData({...formData, fornecedor: e.target.value})} 
  />
</div>

{/* 5. GRID: VALOR ESTIMADO E STATUS */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
  <div>
    <label style={labelStyle}>Valor Estimado Total</label>
    <input 
      type="number" 
      style={{ ...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }} 
      value={formData.valor} 
      onChange={e => setFormData({...formData, valor: e.target.value})} 
    />
  </div>
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
                {/* Seção de Visualização de Anexos Atualizada no Modal */}
<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
  {arquivos.map((file, idx) => {
    if (!file) return null;

    // Se for existente, usa a URL. Se for novo, usa o data (Base64).
    const isExisting = file.isExisting;
    const fileUrl = isExisting ? file.url : file; 
    
    // Lógica para identificar se é PDF
    const isPDF = typeof fileUrl === 'string' && 
                  (fileUrl.toLowerCase().includes("application/pdf") || fileUrl.toLowerCase().includes(".pdf"));

    // Lógica de Preview para Google Drive ou Base64
    const getPreviewUrl = (url) => {
      if (typeof url !== 'string') return '';
      if (url.startsWith('data:')) return url;
      const fileId = url.match(/[-\w]{25,}/);
      return fileId ? `https://drive.google.com/thumbnail?id=${fileId[0]}&sz=w200` : url;
    };

    return (
      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
        {isPDF ? (
          <div style={{ 
            width: '100%', height: '100%', borderRadius: '8px', 
            backgroundColor: '#fee2e2', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', border: `1px solid ${theme.border}`
          }}>
            <FileText size={24} color="#b91c1c" />
            <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 'bold' }}>PDF</span>
          </div>
        ) : (
          <img 
            src={getPreviewUrl(fileUrl)} 
            alt="Preview" 
            style={{ 
              width: '100%', height: '100%', borderRadius: '8px', 
              objectFit: 'cover', border: `1px solid ${theme.border}` 
            }} 
          />
        )}

        {/* BOTÃO X PARA DELETAR */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            // Remove do estado local. 
            // Nota: Para deletar do Drive permanentemente, você precisaria de uma action "delete_file" no AppScript.
            setArquivos(prev => prev.filter((_, i) => i !== idx));
          }}
          style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            border: '2px solid ' + theme.mainBg,
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
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
    cursor: loading ? 'not-allowed' : 'pointer', 
    marginTop: '10px',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px'
  }} 
  onClick={handleSave}
  disabled={loading} // Previne cliques duplos
>
  {loading ? (
    <>
      <Loader2 className="custom-loader" size={18} />
      <span>Salvando...</span>
    </>
  ) : (
    "Salvar Solicitação"
  )}
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

        {/* Seção de Produtos dentro do Modal de Visualização */}
<div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border, padding: '12px', borderRadius: '8px' }}>
  <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Produtos da Solicitação:</strong>
  {selectedCompra.itensRelacionados && selectedCompra.itensRelacionados.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {selectedCompra.itensRelacionados.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '4px' }}>
          <span>{p.qtd}x {p.nome}</span>
          <span style={{ fontWeight: '600' }}>
            {Number(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      ))}
    </div>
  ) : (
    <span style={{ fontSize: '12px', color: theme.textSecondary }}>Nenhum item detalhado encontrado.</span>
  )}
</div>

        {/* Segundo Quadrado - Classificação */}
        <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border, padding: '12px', borderRadius: '8px' }}>
          <p><strong>Categoria:</strong> {selectedCompra.categoria}</p>
          <p><strong>Unidade:</strong> {selectedCompra.unidade}</p>
        </div>

        {/* Datas */}
        <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border }}>
    <strong>Solicitado em:</strong>  {(() => {
        const rawData = selectedCompra.solicitado_data;
        if (!rawData) return '-';
        // Se a data já estiver no formato brasileiro com hora, pegamos apenas a primeira parte
        if (typeof rawData === 'string' && rawData.includes('/')) {
            return rawData.split(' ')[0];
        }
        // Caso venha em formato ISO
        return new Date(rawData).toLocaleDateString('pt-BR');
    })()}
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

  {/* Visualização de Anexos no Ver Mais - CORRIGIDO */}
{selectedCompra.anexosRelacionados && selectedCompra.anexosRelacionados.length > 0 ? (
  <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border, marginTop: '10px' }}>
    <strong style={{ display: 'block', marginBottom: '8px' }}>Anexos:</strong>
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {selectedCompra.anexosRelacionados.map((anexo, idx) => {
        if (!anexo) return null;
        
        // Extrai a URL correta, seja o anexo um objeto ou uma string
        const fileUrl = typeof anexo === 'object' ? anexo.url : anexo;
        
        // GERANDO A URL DE MINIATURA
        const previewUrl = getGoogleDrivePreview(anexo);
        const isPDF = fileUrl && typeof fileUrl === 'string' && fileUrl.toLowerCase().includes('.pdf');

        return (
          <a key={idx} href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              width: '65px',
              height: '65px',
              borderRadius: '8px',
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.mainBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                color: theme.textSecondary,
                zIndex: 1 
              }}>
                <FileText size={20} color={isPDF ? "#b91c1c" : theme.textSecondary} />
                <span style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>
                  {isPDF ? "PDF" : "VER"}
                </span>
              </div>

              {!isPDF && (
                <img 
                  src={previewUrl} 
                  alt="Anexo"
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    zIndex: 2,
                    backgroundColor: theme.mainBg
                  }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
          </a>
        );
      })}
    </div>
  </div>
) : (
  <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border, marginTop: '10px', opacity: 0.7 }}>
    <span style={{ fontSize: '13px' }}>Nenhum anexo encontrado.</span>
  </div>
)}

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

  

  

  