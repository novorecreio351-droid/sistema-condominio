 
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, Search, Plus, Edit2, Trash2, X, Loader2, 
  ChevronLeft, ChevronRight, MoreVertical, Eye, DollarSign,
  FileText, Download, RotateCcw, CheckCircle2, AlertCircle, User, Paperclip, UploadCloud, ChevronDown
} from "lucide-react";
import { useTheme } from "../App";

// Bibliotecas para exportação
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";
const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;

// --- ESTILOS ---
const btnWhite = { border: '1px solid', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const pageContainer = { padding: "20px", maxWidth: "1200px", margin: "0 auto" };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const titleStyle = { fontSize: '24px', fontWeight: '700', margin: 0 };
const btnNew = { color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const filterCard = { padding: '15px 20px', borderRadius: '16px', border: '1px solid', marginBottom: '20px' };
const searchContainer = { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '8px', border: '1px solid' };
const searchInput = { border: 'none', background: 'none', padding: '8px 0', outline: 'none', fontSize: '13px' };
const tableCard = { borderRadius: '16px', border: '1px solid', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' };
const thRow = { borderBottom: '1px solid' };
const tdStyle = { padding: '16px 24px', fontSize: '14px' };
const trStyle = { transition: '0.2s' };
const badgeGreen = { backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' };
const badgeRed = { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' };
const paginationFooter = { padding: '15px 24px', borderTop: '1px solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { padding: '24px', borderRadius: '20px', width: '90%' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const labelStyle = { fontSize: '11px', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase', color: '#64748b' };
const selectStyle = { padding: '10px', borderRadius: '8px', border: '1px solid', outline: 'none', fontSize: '14px' };
const viewBox = { padding: '12px', borderRadius: '12px', fontSize: '13px', border: '1px solid', lineHeight: '1.6' };
const fullScreenLoaderOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };

export default function Piscina({ user }) {
  const { theme } = useTheme();
  
  const [festas, setFestas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [uploads, setUploads] = useState([]); // Guardar os uploads brutos
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ nome: "Sistema" });
  
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFesta, setSelectedFesta] = useState(null);
  const [modalType, setModalType] = useState("add");
  const [showMenuId, setShowMenuId] = useState(null);
  const menuRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterDivergencia, setFilterDivergencia] = useState("Todos");
  const [filterData, setFilterData] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isMoradorCadastrado, setIsMoradorCadastrado] = useState(false);
  
  const [formData, setFormData] = useState({
  id_unidade: "",
  id_morador: "", // Pode ser vazio para "Avulso"
  nome: "",
  cpf: "", // Inicialize aqui
  nascimento: "",
  telefone: "",
  validade: "",
  status: "Ativo",
  obs: "",
  fotoBase64: "",    // Novo
  atestadoBase64: "" // Novo
});

  const [filterPeriodo, setFilterPeriodo] = useState({ inicio: "", fim: "" });
  const [filterPago, setFilterPago] = useState("Todos");
  

  const btnSaveStyles = {
    ...btnNew,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    width: '100%',
    justifyContent: 'center',
    marginTop: '10px',
    border: theme.isDark ? '1px solid #60a5fa' : 'none'
  };

  
const [sortConfig, setSortConfig] = useState([]); // Inicializa como array vazio
  // Funções de Máscara
const maskCPF = (v) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};
const maskRGPrivacy = (rg) => {
  if (!rg) return "";
  const clean = rg.replace(/\D/g, "");
  if (clean.length < 5) return rg; 
  // Exemplo: 12.***.***-X ou 12.***.*** (depende do tamanho)
  return `${clean.substring(0, 2)}.***.***-${clean.slice(-1)}`;
};

// Função para limpar o timestamp e mostrar apenas a data
const formatarDataExibicao = (dateStr) => {
  if (!dateStr) return "";
  // Pega apenas a parte antes do espaço ou do "T"
  const apenasData = dateStr.split(' ')[0].split('T')[0]; 
  
  // Se a data vier no formato YYYY-MM-DD, converte para DD/MM/YYYY
  if (apenasData.includes('-')) {
    const [year, month, day] = apenasData.split('-');
    return `${day}/${month}/${year}`;
  }
  return apenasData; // Retorna DD/MM/YYYY se já estiver correto
};

const [showUnitDropdown, setShowUnitDropdown] = useState(false);
const [unitSearch, setUnitSearch] = useState("");
const dropdownRef = useRef(null);

// Função para exibir o texto da unidade selecionada no seletor
const getUnitLabel = (id) => {
  const u = unidades.find(unit => unit.id.toString() === id.toString());
  return u ? `BLOCO ${u.bloco} - UNIDADE ${u.unidade}` : "Selecione a Unidade...";
};

// Filtro da lista de unidades baseado no que o usuário digita
// Filtro e Ordenação da lista de unidades
const unidadesFiltradas = unidades
  .filter(u => 
    u.bloco.toString().toLowerCase().includes(unitSearch.toLowerCase()) || 
    u.unidade.toString().toLowerCase().includes(unitSearch.toLowerCase())
  )
  .sort((a, b) => {
    // Primeiro ordena pelo Bloco
    const compareBloco = a.bloco.toString().localeCompare(b.bloco.toString(), undefined, { numeric: true });
    if (compareBloco !== 0) return compareBloco;
    
    // Se o bloco for igual, ordena pela Unidade
    return a.unidade.toString().localeCompare(b.unidade.toString(), undefined, { numeric: true });
  });

const converterLinkDrive = (url) => {
  if (!url) return null;

  // Extrai o ID
  const match = url.match(/[-\w]{25,}/);
  const fileId = match ? match[0] : null;

  if (fileId) {
    // Usamos o thumbnail com sz=w400 (mais estável) 
    // e adicionamos um timestamp para evitar cache travado
    const timestamp = new Date().getTime();
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400&t=${timestamp}`;
  }
  
  return url;
};

const maskPhone = (v) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};

const [filterChurrasqueira, setFilterChurrasqueira] = useState("Todos");


const fileInputRef = useRef(null); // Adicione isso logo abaixo dos outros useStates

// Converte a data do banco (DD/MM/YYYY HH:mm) para o formato do input (YYYY-MM-DDTHH:mm)
const formatDateTimeForInput = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  // Se vier com espaço (ex: 15/10/2023 14:00) ou com T (ISO)
  const separator = dateTimeStr.includes(' ') ? ' ' : 'T';
  const [datePart] = dateTimeStr.split(separator);
  
  if (datePart.includes('/')) {
    const [day, month, year] = datePart.split('/');
    return `${year}-${month}-${day}`;
  }
  return datePart;
};

  useEffect(() => {
    fetchData();
  
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
  
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenuId(null);
      }
  
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUnitDropdown(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

 const fetchData = async () => {
  try {
    setLoadingInitial(true);

    const [resPiscina, resUnidades, resMoradores, resUploads] = await Promise.all([
      fetch(`${API_URL}?token=${TOKEN}&sheet=PISCINA`, { method: "GET", redirect: "follow" }).then(r => r.json()),
      fetch(`${API_URL}?token=${TOKEN}&sheet=UNIDADES`, { method: "GET", redirect: "follow" }).then(r => r.json()),
      fetch(`${API_URL}?token=${TOKEN}&sheet=MORADORES`, { method: "GET", redirect: "follow" }).then(r => r.json()),
      fetch(`${API_URL}?token=${TOKEN}&sheet=UPLOADS_PISCINA`, { method: "GET", redirect: "follow" }).then(r => r.json()),
    ]);


    const listaRaw = Array.isArray(resPiscina) ? resPiscina : [];
    
    // Normalização para evitar problemas de Maiúsculas/Minúsculas
const dadosFormatados = listaRaw.map(item => {
  // Função interna para limpar "2026-02-27 00:00:00" para "2026-02-27"
  const limparData = (valor) => {
    if (!valor) return "";
    return String(valor).split(' ')[0].split('T')[0];
  };

  return {
    ...item,
    id: item.id || item.ID,
    nome: item.nome || item.Nome,
    id_unidade: item.id_unidade || item.ID_UNIDADE,
    nascimento: limparData(item.nascimento || item.NASCIMENTO),
    // Garantindo que a validade pegue a coluna correta (Coluna G ou validade_atestado)
    validade: limparData(item.validade_atestado || item.validade || item.VALIDADE_ATESTADO),
    // Mapeando o novo campo CPF
    cpf: item.cpf || item.CPF || "", 
    status: item.status || item.Status || "Ativo",
    obs: item.obs || item.OBS || ""
  };
}).filter(item => item.nome || item.id);


    setFestas(dadosFormatados); 
    setUnidades(Array.isArray(resUnidades) ? resUnidades : []);
    setMoradores(Array.isArray(resMoradores) ? resMoradores : []);
    
  } catch (error) { 
    console.error("ERRO CRÍTICO NO FETCH:", error); 
  } finally { 
    setLoadingInitial(false);
  }
};
  


const maskCPFPrivacy = (cpf) => {
  if (!cpf) return "";
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return cpf; // Retorna original se não tiver 11 dígitos
  
  // Pega os 3 primeiros e os 3 últimos (contando o dígito)
  // Formato: 123.***.***-20 (No seu exemplo 3 iniciais e 3 finais incluindo dígito)
  return `${cleanCPF.substring(0, 3)}.***.***-${cleanCPF.substring(9)}`;
};

const [showExportModal, setShowExportModal] = useState(false);
const [selectedColumns, setSelectedColumns] = useState([
  { id: 'id_unidade', label: 'Unidade', selected: true },
  { id: 'nome', label: 'Nome', selected: true },
  { id: 'nascimento', label: 'Nascimento', selected: true },
  { id: 'telefone', label: 'Telefone', selected: true },
  { id: 'validade_atestado', label: 'Validade Atestado', selected: true },
  { id: 'data_cadastro', label: 'Data Cadastro', selected: true },
  { id: 'obs', label: 'Obs', selected: true },
  { id: 'cpf', label: 'CPF', selected: true },
  { id: 'status', label: 'Status', selected: true }
]);

const exportToExcel = () => {
  // 1. Filtra apenas as colunas marcadas como 'selected: true'
  const colsAtivas = selectedColumns.filter(c => c.selected);

  const dadosParaExportar = dadosFiltrados.map(f => {
    const linha = {};

    // 2. Monta o objeto dinamicamente
    colsAtivas.forEach(col => {
      if (col.id === 'id_unidade') {
        // Pega o label "BLOCO 5 - UNIDADE 206" e transforma em "B5-206"
        const labelCompleto = getUnitLabel(f.id_unidade);
        linha["Unidade"] = labelCompleto
          .replace(/BLOCO\s*/gi, 'B')      // Troca BLOCO por B
          .replace(/UNIDADE\s*/gi, '')    // Remove a palavra UNIDADE
          .replace(/\s*-\s*/g, '-')       // Garante que o traço não tenha espaços
          .trim();
      } 
      else if (col.id === 'cpf') {
        linha["CPF"] = maskCPFPrivacy(f.cpf);
      } 
      else if (['nascimento', 'validade_atestado', 'data_cadastro'].includes(col.id)) {
        let valorData = f[col.id] || "-";
        
        // Se vier com data e hora (Timestamp), pega apenas a parte da data
        if (typeof valorData === 'string' && valorData.includes(' ')) {
          valorData = valorData.split(' ')[0];
        }
        
        linha[col.label] = valorData;
      }
      else {
        linha[col.label] = f[col.id] || "";
      }
    });

    return linha;
  });

  const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Piscina");
  XLSX.writeFile(wb, "Relatorio_Piscina.xlsx");
  if (typeof setShowExportModal === 'function') setShowExportModal(false);
};

const handleToggleColumn = (id) => {
  setSelectedColumns(prev => prev.map(col => col.id === id ? { ...col, selected: !col.selected } : col));
};

const exportToPDF = () => {
  const doc = new jsPDF('l', 'mm', 'a4'); 
  const img = new Image(); 
  img.src = "/logo.png"; 

  const maskCPFPrivacy = (cpf) => {
    if (!cpf) return "";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length < 11) return cpf;
    return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
  };

  const colsParaExportar = selectedColumns.filter(c => c.selected);
  const headers = colsParaExportar.map(c => c.label);
  
  const body = dadosFiltrados.map(f => colsParaExportar.map(c => {
    // 1. Tratamento para UNIDADE (Formato B5-206)
    // Se o seu ID for 'id_unidade' ou 'unidade_id', ajuste aqui:
    if(c.id === 'id_unidade' || c.id === 'unidade_id') {
      const labelCompleto = getUnitLabel(f.id_unidade || f.unidade_id);
      return labelCompleto
        .replace(/BLOCO\s*/gi, 'B')      // Troca BLOCO por B
        .replace(/UNIDADE\s*/gi, '')    // Remove a palavra UNIDADE
        .replace(/\s*-\s*/g, '-')       // Remove espaços no traço
        .trim();
    }

    // 2. Tratamento para CPF (Máscara)
    if(c.id === 'cpf') return maskCPFPrivacy(f[c.id]);

    // 3. Tratamento para DATAS (Remove Timestamp / Horas)
    // Verifica se é um dos campos de data da sua planilha
    if(['data_cadastro', 'validade_atestado', 'nascimento', 'data_reserva'].includes(c.id)) {
      const valorData = f[c.id];
      if (!valorData) return "-";
      // Corta no primeiro espaço para ignorar o horário
      return valorData.toString().split(' ')[0];
    }

    return f[c.id] || "";
  }));

  const gerarPDF = (incluirLogo = false) => {
    doc.setDrawColor(34, 197, 94); 
    doc.setLineWidth(1.5); 
    doc.rect(5, 5, 287, 200);
    if (incluirLogo) doc.addImage(img, 'PNG', 113, 12, 70, 25);
    
    doc.setFontSize(18); 
    doc.setTextColor(30, 41, 59);
    doc.text("Relatório de Cadastro - Piscina", 148, incluirLogo ? 45 : 25, { align: "center" });

    autoTable(doc, {
      startY: incluirLogo ? 55 : 35,
      head: [headers],
      body: body,
      headStyles: { fillColor: [34, 197, 94], halign: 'center', textColor: [255, 255, 255] },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 10, right: 10 }
    });

    doc.save("Relatorio_Piscina.pdf");
    setShowExportModal(false);
  };

  img.onload = () => gerarPDF(true); 
  img.onerror = () => gerarPDF(false);
};
  // Função Robusta para buscar a foto (usada dentro e fora do fetchData)
  const getFotoFestaInterno = (festaId, listaDeUploads) => {
  if (!festaId || !listaDeUploads || !listaDeUploads.length) return null;
  
  const upload = listaDeUploads.find(up => {
    const idVinculo = up.id_festa || up.ID_FESTA || up.Id_Festa;
    return idVinculo?.toString() === festaId?.toString(); // O erro de digitação fesaId foi corrigido no bloco anterior, use festaId
  });

  if (!upload) return null;

  const urlRaw = upload.url_drive || upload.URL_DRIVE || upload.url;
  
  // Se for link do Google Drive, tenta converter para link de visualização direta (thumbnail)
  if (urlRaw && urlRaw.includes("drive.google.com")) {
    const fileId = urlRaw.match(/[-\w]{25,}/); // Extrai o ID do arquivo da URL
    return fileId ? `https://lh3.googleusercontent.com/u/0/d/${fileId}` : urlRaw;
  }

  return urlRaw;
};

const converterUrlDrive = (url) => {
  if (!url) return '';
  if (url.startsWith('data:image')) return url; 
  
  const match = url.match(/[-\w]{25,}/);
  const fileId = match ? match[0] : null;
  
  if (fileId) {
    // Esta é a URL oficial para miniaturas do Drive
    return `https://lh3.googleusercontent.com/u/0/d/${fileId}=w200-h200-p`;
    // Ou use a que já existe no seu código, mas garanta que o ID seja extraído:
    // return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`;
  }
  return url;
};
  // Atalho para usar a função com o state atual de uploads
  const getFotoFesta = (festaId) => getFotoFestaInterno(festaId, uploads);

  const handleFileChange = (e, campo) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [campo]: reader.result // Guarda o Base64 (data:image/jpeg;base64,...)
      }));
    };
    reader.readAsDataURL(file);
  }
};

const handleDeleteImage = async (uploadId) => {
  if (!confirm("Deseja remover este anexo permanentemente?")) return;

  setLoadingGlobal(true);

  try {
    // Não precisamos extrair o match aqui, o Script vai buscar na Coluna E da planilha
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors", 
      body: JSON.stringify({ 
        token: TOKEN, 
        action: "delete", 
        sheet: "UPLOADS_CHURRASQUEIRA", 
        id: uploadId.toString()
      })
    });

    // O tempo de espera para o Google processar
    setTimeout(() => {
      fetchData(); 
      setLoadingGlobal(false);
    }, 1500);

  } catch (error) {
    console.error("Erro ao excluir:", error);
    setLoadingGlobal(false);
  }
};

const getFotosFestaInterno = (festaId, listaDeUploads) => {
  if (!festaId || !listaDeUploads) return [];
  
  return listaDeUploads
    .filter(up => {
      const idVinculo = up.id_festa || up.ID_FESTA || up.Id_Festa;
      return idVinculo?.toString() === festaId?.toString();
    })
    .map(up => up.url_drive || up.URL_DRIVE || up.url);
};
const handleSave = async () => {
  // 1. Validação de campos obrigatórios
  if (!formData.id_unidade || !formData.nome || !formData.validade) {
    alert("Preencha Unidade, Nome e Validade.");
    return;
  }

  // --- NOVA TRAVA DE SEGURANÇA: LIMITE DE 5 ATIVOS POR UNIDADE ---
  if (modalType === "add") {
    // Filtra na lista atual quantos moradores desta unidade estão com status "Ativo"
    const ativosNaUnidade = festas.filter(f => 
      String(f.id_unidade) === String(formData.id_unidade) && 
      f.status === "Ativo"
    );

    if (ativosNaUnidade.length >= 5) {
      alert(
        `Não é possível cadastrar. A unidade ${formData.id_unidade} já atingiu o limite de 5 moradores com status 'Ativo'.\n\n` +
        `Para cadastrar um novo, altere o status de um morador antigo para 'Inativo'.`
      );
      return; // Interrompe o salvamento
    }
  }
  // --------------------------------------------------------------

  setLoadingGlobal(true);

  const payload = {
    token: TOKEN,
    action: modalType === "add" ? "add" : "edit",
    sheet: "PISCINA",
    id: modalType === "add" ? "SEQUENTIAL" : formData.id.toString(),
    data: {
      id_unidade: formData.id_unidade,
      id_morador: formData.id_morador || "AVULSO",
      nome: formData.nome,
      cpf: formData.cpf || "", 
      nascimento: formData.nascimento ? formData.nascimento.split("T")[0] : "",
      telefone: formData.telefone,
      validade_atestado: formData.validade ? formData.validade.split("T")[0] : "",
      status: formData.status || "Ativo",
      obs: formData.obs || "",
      fotoBase64: formData.fotoBase64,
      atestadoBase64: formData.atestadoBase64,
      id_foto_drive: formData.id_foto_drive || "",
      id_atestado_drive: formData.id_atestado_drive || ""
    }
  };

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    setTimeout(async () => {
      setShowModal(false);
      await fetchData();
      setLoadingGlobal(false);
    }, 2000);

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor.");
    setLoadingGlobal(false);
  }
};
 const handleDelete = async (id) => {
  if (confirm("Deseja excluir este cadastro? A foto e o atestado também serão removidos do Drive.")) {
    setLoadingGlobal(true);

    try {
      const payload = {
        token: TOKEN,
        action: "delete",
        sheet: "PISCINA",
        id: id.toString(),
        user: user?.nome || "Sistema"
      };

      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setTimeout(() => {
          fetchData();
          setLoadingGlobal(false);
          if (typeof setShowMenuId === "function") setShowMenuId(null);
        }, 500);
      } else {
        alert("Erro ao excluir: " + result.message);
        setLoadingGlobal(false);
      }

    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro na comunicação com o servidor.");
      setLoadingGlobal(false);
    }
  }
};

const handleMoradorSelect = (id) => {
  // Se o ID for vazio (opção "Escolha..."), limpa os campos incluindo o CPF
  if (!id) {
    setFormData(prev => ({ 
      ...prev, 
      id_morador: "", 
      nome: "", 
      telefone: "",
      cpf: "" // Adicionado limpeza do CPF
    }));
    return;
  }

  // Busca o morador na lista de moradores
  const moradorEncontrado = moradores.find(m => m.id?.toString() === id.toString());

  if (moradorEncontrado) {
    setFormData(prev => ({
      ...prev,
      id_morador: id,
      nome: moradorEncontrado.nome || "",
      // Tenta buscar o CPF tanto em minúsculo quanto maiúsculo
      cpf: moradorEncontrado.cpf || moradorEncontrado.CPF || "", 
      telefone: moradorEncontrado.telefone || moradorEncontrado.celular || ""
    }));
  }
};

const toggleMoradorCadastrado = (checked) => {
  setIsMoradorCadastrado(checked);

  if (!checked) {
    setFormData(prev => ({
      ...prev,
      id_morador: "",
      nome: "",
      cpf: "",      // Limpa o CPF ao desmarcar
      telefone: ""
    }));
  }
};

  const formatCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const dadosFiltrados = React.useMemo(() => {
  // Criamos uma cópia para não mutar o estado original 'festas'
  let resultado = [...festas];

  resultado = resultado.filter(f => {
    // 1. Filtro de Busca
    const matchesSearch = 
        (f.nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.id_unidade?.toString().includes(searchTerm)) ||
        (f.id?.toString().includes(searchTerm));
    
    // 2. Filtro de Status
    const matchesStatus = filterStatus === "Todos" || f.status === filterStatus;

    // 3. Filtro de Validade/Atestado
    let matchesData = true;
    if (filterPeriodo?.inicio || filterPeriodo?.fim) {
        if (!f.validade_atestado) { // Verifique se o nome da chave é validade ou validade_atestado
          matchesData = false;
        } else {
          // Ajuste para datas no formato DD/MM/AAAA que vêm do Sheets
          const converterData = (dStr) => {
            if (dStr.includes('/')) {
              const [d, m, a] = dStr.split('/');
              return new Date(a, m - 1, d);
            }
            return new Date(dStr);
          };

          const dataValidade = converterData(f.validade_atestado);
          if (filterPeriodo.inicio) {
              if (dataValidade < new Date(filterPeriodo.inicio)) matchesData = false;
          }
          if (filterPeriodo.fim) {
              if (dataValidade > new Date(filterPeriodo.fim)) matchesData = false;
          }
        }
    }

    return matchesSearch && matchesStatus && matchesData;
  });

  // --- ORDENAÇÃO (Tratando sortConfig como Array) ---
  if (Array.isArray(sortConfig) && sortConfig.length > 0) {
    resultado.sort((a, b) => {
      for (const { key, direction } of sortConfig) {
        let valA = a[key] ?? "";
        let valB = b[key] ?? "";

        if (key === 'id' || key === 'id_unidade') {
          valA = Number(valA.toString().replace(/\D/g, '')) || 0;
          valB = Number(valB.toString().replace(/\D/g, '')) || 0;
        } else {
          valA = valA.toString().toLowerCase();
          valB = valB.toString().toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  return resultado;
}, [festas, searchTerm, filterStatus, filterPeriodo, sortConfig]);

// --- PAGINAÇÃO (Corrigida) ---
const totalPages = Math.ceil(dadosFiltrados.length / (itemsPerPage === "Todos" ? (dadosFiltrados.length || 1) : parseInt(itemsPerPage)));

const itensExibidos = React.useMemo(() => {
  if (itemsPerPage === "Todos") return dadosFiltrados;
  const limit = parseInt(itemsPerPage);
  const start = (currentPage - 1) * limit;
  return dadosFiltrados.slice(start, start + limit);
}, [dadosFiltrados, currentPage, itemsPerPage]);

const handleSort = (key) => {
  setSortConfig(prev => {
    const existing = prev.find(s => s.key === key);
    if (existing) {
      // Se já existe, inverte a ordem ou remove se for 'desc'
      if (existing.direction === 'asc') {
        return [{ key, direction: 'desc' }]; // Troca para desc
      }
      return []; // Se clicar a 3ª vez, limpa a ordenação
    }
    return [{ key, direction: 'asc' }]; // Nova ordenação
  });
};


  return (
    
    <div style={pageContainer}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .filter-pill { padding: 6px 12px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; cursor: pointer; font-size: 12px; color: ${theme.textSecondary}; transition: 0.2s; }
        .filter-pill.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .action-menu { 
    position: absolute; 
    right: 30px; 
    background: ${theme.mainBg}; 
    border: 1px solid ${theme.border}; 
    border-radius: 10px; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
    z-index: 100; 
    width: 180px; /* <--- Aumente aqui */
    padding: 5px; 
}
    .column-select-item { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  padding: 12px; 
  border-radius: 10px; 
  border: 1px solid ${theme.border}; 
  cursor: pointer; 
  transition: 0.2s; 
}
.column-select-item:hover {
  background: ${theme.bg};
}
.column-select-item.active { 
  border-color: #3b82f6; 
  background: #3b82f610; 
}

/* Evita que o texto pule linha e garante alinhamento */
.menu-item { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    padding: 10px 12px; 
    font-size: 13px; 
    cursor: pointer; 
    border-radius: 6px; 
    color: ${theme.text}; 
    white-space: nowrap; /* <--- ADICIONE ISSO: impede de pular linha */
}
        .menu-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; border-radius: 6px; color: ${theme.text}; }
        .menu-item:hover { background: ${theme.bg}; }
        .pagination-btn { background: none; border: 1px solid ${theme.border}; color: ${theme.text}; padding: 5px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; }
        .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      {/* Mova para cá, logo antes do final do componente */}
{showExportModal && (
  <div style={modalOverlay}>
    <div style={{ ...modalContent, backgroundColor: theme.mainBg, maxWidth: '500px' }}>
      <div style={modalHeader}>
        <h2 style={{ color: theme.text, margin: 0 }}>Exportar Relatório</h2>
        <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', color: theme.text, cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>
      
      <p style={{ color: theme.textSecondary, fontSize: '14px', marginBottom: '20px' }}>
        Selecione as colunas que deseja incluir no arquivo PDF:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {selectedColumns.map(col => (
          <div 
            key={col.id} 
            onClick={() => handleToggleColumn(col.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', 
              borderRadius: '10px', border: `1px solid ${col.selected ? '#3b82f6' : theme.border}`, 
              cursor: 'pointer', background: col.selected ? '#3b82f610' : 'transparent'
            }}
          >
            {col.selected ? <CheckCircle2 size={18} color="#3b82f6" /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1px solid ${theme.border}` }} />}
            <span style={{ color: theme.text, fontSize: '14px' }}>{col.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={exportToPDF} style={{ ...btnNew, flex: 1, backgroundColor: '#3b82f6', justifyContent: 'center' }}>
          <FileText size={18} /> PDF
        </button>
      </div>
    </div>
  </div>
)}
      

      {(loadingInitial || loadingGlobal) && (
        <div style={fullScreenLoaderOverlay}>
          <Loader2 className="animate-spin" color="#3b82f6" size={50} />
        </div>
      )}

      <div style={{...headerStyle, flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between'}}>
  <div>
    <h1 style={{...titleStyle, color: theme.text}}>Piscina</h1>
    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: theme.textSecondary }}>Gerencie o cadastro e acesso a piscina.</p>
    <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: theme.textSecondary }}>
            Logado como: <strong style={{ color: theme.text }}>
  {user?.nome || "Sistema"}
</strong>
          </p>
        
  </div>

  {/* Todos os botões em um único container flex */}
  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>


  
    <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={exportToExcel}>
      <Download size={18} color="#166534" /> Excel
    </button>
    
    <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => setShowExportModal(true)}>
      <FileText size={18} color="#b91c1c" /> PDF
    </button>
    
    <button 
  style={{
    ...btnWhite, 
    backgroundColor: theme.mainBg, 
    borderColor: theme.border, 
    color: theme.textSecondary, 
    flex: isMobile ? '1 1 auto' : 'none'
  }} 
  onClick={() => {
    setSearchTerm("");
    setFilterStatus("Todos");
    setFilterPago("Todos");
    setFilterChurrasqueira("Todos"); // <--- Adicionado aqui
    setFilterPeriodo({ inicio: "", fim: "" }); // Reseta o objeto de datas
    setFilterDivergencia("Todos");
    setCurrentPage(1); // Opcional: volta para a primeira página
  }}
>
  <RotateCcw size={18} /> Redefinir
</button>

    <button 
  style={{...btnNew, backgroundColor: '#3B82F6', flex: isMobile ? '1 1 100%' : 'none', justifyContent: 'center'}} 
  onClick={() => { 
    setModalType("add"); 
    setIsMoradorCadastrado(false); 
    
    // Inicializando todos os campos, incluindo os novos
    setFormData({
      id_unidade: "", 
      id_morador: "", 
      nome: "", 
      cpf: "",           // <-- ADICIONADO: CPF limpo para novo cadastro
      nascimento: "", 
      telefone: "", 
      validade: "", 
      status: "Ativo", 
      obs: "", 
      fotoBase64: "", 
      atestadoBase64: "",
      id_foto_drive: "",    // <-- ADICIONADO: Garantir que não venha lixo de edições anteriores
      id_atestado_drive: "" // <-- ADICIONADO: Garantir que não venha lixo de edições anteriores
    }); 
    
    setShowModal(true); 
  }}
>
  <Plus size={18} /> Novo Cadastro
</button>
  </div>
</div>

      <div style={{...filterCard, backgroundColor: theme.mainBg, borderColor: theme.border}}>
    <div style={{display:'flex', flexDirection: 'column', gap: '15px'}}>
        
        {/* LINHA 1: BUSCA POR UNIDADE/NOME */}
        <div style={{display:'flex', width: '100%'}}>
            <div style={{...searchContainer, backgroundColor: theme.bg, borderColor: theme.border, flex: 1}}>
                <Search size={16} color={theme.textSecondary} />
                <input 
                    type="text" 
                    placeholder="Buscar unidade, nome ou CPF..." 
                    style={{...searchInput, color: theme.text, width: '100%'}} 
                    value={searchTerm} 
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }} 
                />
            </div>
        </div>

        {/* LINHA 2: STATUS E VALIDADE JUNTOS */}
        <div style={{
            display:'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: '20px', 
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${theme.border}`,
            paddingTop: '15px'
        }}>
            
            {/* GRUPO STATUS */}
            <div style={{display:'flex', flexDirection: 'column', gap: '8px', flexShrink: 0}}>
                <span style={{fontSize: '10px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', marginLeft: '5px'}}>
                    Status
                </span>
                <div style={{display:'flex', gap:'6px'}}>
                    {["Todos", "Ativo", "Inativo", "Vencido"].map(s => (
                        <button 
                            key={s} 
                            className={`filter-pill ${filterStatus === s ? 'active' : ''}`} 
                            onClick={() => {
                                setFilterStatus(s);
                                setCurrentPage(1);
                            }}
                            style={{
                                whiteSpace: 'nowrap',
                                padding: '6px 12px',
                                fontSize: '12px'
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* GRUPO VALIDADE (Rótulo na frente das boxes) */}
            <div style={{
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', // Empilha só o título no mobile se não couber
                gap: '10px', 
                flex: 1, 
                alignItems: 'center',
                justifyContent: isMobile ? 'flex-start' : 'flex-end'
            }}>
                <span style={{
                    fontSize: '10px', 
                    fontWeight: '700', 
                    color: theme.textSecondary, 
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap' // Garante que o texto não quebre
                }}>
                    Validade:
                </span>

                <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap'}}>
                    <div style={{...searchContainer, backgroundColor: theme.bg, borderColor: theme.border, padding: '5px 8px', width: isMobile ? '120px' : '130px'}}>
                        <Calendar size={14} color={theme.textSecondary} />
                        <input 
                            type="date" 
                            style={{background:'none', border:'none', color: theme.text, fontSize:'12px', width: '100%', outline: 'none'}} 
                            value={filterPeriodo.inicio} 
                            onChange={e => {
                                setFilterPeriodo({...filterPeriodo, inicio: e.target.value});
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    
                    <span style={{color: theme.textSecondary, fontSize: '12px'}}>até</span>
                    
                    <div style={{...searchContainer, backgroundColor: theme.bg, borderColor: theme.border, padding: '5px 8px', width: isMobile ? '120px' : '130px'}}>
                        <Calendar size={14} color={theme.textSecondary} />
                        <input 
                            type="date" 
                            style={{background:'none', border:'none', color: theme.text, fontSize:'12px', width: '100%', outline: 'none'}} 
                            value={filterPeriodo.fim} 
                            onChange={e => {
                                setFilterPeriodo({...filterPeriodo, fim: e.target.value});
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    {(filterPeriodo.inicio || filterPeriodo.fim) && (
                        <RotateCcw 
                            size={16} 
                            style={{cursor: 'pointer', color: theme.textSecondary}} 
                            onClick={() => {
                                setFilterPeriodo({inicio: "", fim: ""});
                                setCurrentPage(1);
                            }} 
                        />
                    )}
                </div>
            </div>
        </div>
    </div>
</div>
      <div style={{...tableCard, backgroundColor: theme.mainBg, borderColor: theme.border}}>
        <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
                <thead>
                    <tr style={{...thRow, borderBottomColor: theme.border, backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc'}}>
    {[
      { label: "ID", key: "id" },
  { label: "Unidade", key: "id_unidade" },
  { label: "Nome", key: "nome" },
  { label: "Nascimento", key: "nascimento" },
  { label: "Telefone", key: "telefone" },
  { label: "Data Validade", key: "validade" },
  { label: "Status", key: "status" },
].map((col) => {
  const config = sortConfig.find(c => c.key === col.key);
  return (
  <th 
    key={col.key}
    style={{
      ...thStyle, 
      color: theme.textSecondary, 
      cursor: col.key !== 'acoes' ? 'pointer' : 'default', 
      userSelect: 'none'
    }}
    onClick={(e) => col.key !== 'acoes' && handleSort(col.key, e.shiftKey)}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {col.label}
      {config && (config.direction === 'asc' ? " ↑" : " ↓")}
    </div>
  </th>
);
    })}
    <th style={{...thStyle, textAlign: 'right', color: theme.textSecondary}}>Ações</th>
  </tr>
</thead>
                <tbody>
  {itensExibidos.map((f) => {
    // Busca os dados da unidade (Bloco e Número) para exibir amigavelmente
    const unit = unidades.find(u => u.id?.toString() === f.id_unidade?.toString());
    
    return (
      <tr key={f.id} style={{ ...trStyle, borderBottom: `1px solid ${theme.border}` }}>
        
        {/* Coluna ID */}
        <td style={{ ...tdStyle, color: theme.textSecondary, fontSize: '12px' }}>
          {f.id}
        </td>

        {/* Coluna Unidade */}
        <td style={{ ...tdStyle, color: theme.text, textAlign: 'left' }}>
          <strong>{unit ? `B${unit.bloco} - ${unit.unidade}` : f.id_unidade}</strong>
        </td>

       {/* Coluna Nome (com Foto de Perfil) */}
<td style={{ ...tdStyle, color: theme.text }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    {f.url_foto ? (
      <img 
        // AQUI ESTÁ A MUDANÇA: Chamando a função de conversão
        src={converterLinkDrive(f.url_foto)} 
        alt="Perfil" 
        style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          objectFit: 'cover', 
          border: `1px solid ${theme.border}` 
        }} 
        onError={(e) => {
          // Se falhar, substitui por um ícone de erro ou placeholder
          e.target.style.display = 'none';
        }}
      />
    ) : (
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: theme.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <User size={16} color={theme.textSecondary} />
      </div>
    )}
    <span style={{ fontWeight: '600' }}>{f.nome}</span>
  </div>
</td>

        {/* Coluna Nascimento */}
        <td style={{ ...tdStyle, color: theme.text }}>
          {f.nascimento ? f.nascimento.split('-').reverse().join('/') : "-"}
        </td>

        {/* Coluna Telefone */}
        <td style={{ ...tdStyle, color: theme.text }}>
          {f.telefone}
        </td>

        {/* Coluna Data Validade (Atestado) */}
        <td style={{ ...tdStyle, color: theme.text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {f.validade ? f.validade.split('-').reverse().join('/') : "-"}
            {/* Ícone de alerta se o atestado estiver vencido */}
            {f.validade && new Date(f.validade) < new Date() && (
              <AlertCircle size={14} color="#ef4444" title="Atestado Vencido" />
            )}
          </div>
        </td>


      {/* Coluna Status */}
<td style={tdStyle}>
  <span style={{
    ...badgeGreen, // Mantém suas propriedades de padding e border-radius
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '12px',
    // Lógica de cores baseada no texto do status
    backgroundColor: 
      f.status === 'Inativo' ? '#fee2e2' : 
      f.status === 'Ativo' ? '#dcfce7' : 
      '#fef9c3', // Amarelo para 'Vencido'
    color: 
      f.status === 'Inativo' ? '#b91c1c' : 
      f.status === 'Ativo' ? '#15803d' : 
      '#a16207'  // Marrom/Dourado para 'Vencido'
  }}>
    {f.status}
  </span>
</td>

        {/* --- COLUNA AÇÕES --- */}
        <td style={{ ...tdStyle, textAlign: 'right', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            
            {/* Container do Olho + Asterisco */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Eye 
                size={18} 
                color="#3b82f6" 
                style={{ cursor: 'pointer' }} 
                onClick={() => { setSelectedFesta(f); setShowViewModal(true); }} 
              />
              
              {/* Asterisco */}
              {((f.divergencia_local === "Sim" || f.divergencia_local === true) || (f.obs && (String(f.obs || "").trim()) !== "")) && (
                <span style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-8px',
                  color: '#ef4444',
                  fontWeight: 'bold',
                  fontSize: '20px',
                  pointerEvents: 'none'
                }}>
                  *
                </span>
              )}
            </div>

            {/* Menu de Opções */}
            <button 
              onClick={() => setShowMenuId(showMenuId === f.id ? null : f.id)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <MoreVertical size={20} color={theme.textSecondary} />
            </button>
          </div>
                                    {showMenuId === f.id && (
    <div ref={menuRef} className="action-menu" style={{ right: '10px', top: '40px' }}>

        <div style={{ height: '1px', backgroundColor: theme.border, margin: '4px 0' }} />

        <div className="menu-item" onClick={() => {
    setModalType("edit");

    // Função interna para converter qualquer formato de data para AAAA-MM-DD
    const paraInput = (valor) => {
        if (!valor) return "";
        // Se vier do Sheets como DD/MM/YYYY
        if (valor.includes('/')) {
            const [d, m, a] = valor.split(' ')[0].split('/');
            return `${a}-${m}-${d}`;
        }
        // Se vier como YYYY-MM-DD...
        return valor.split(' ')[0].split('T')[0];
    };

    setFormData({
        ...f,
        // Usando os nomes corretos das colunas da Piscina
        nascimento: paraInput(f.nascimento),
        validade: paraInput(f.validade) 
    });

    setShowModal(true);
    setShowMenuId(null);
}}>
            <Edit2 size={14} /> Editar
        </div>
        
        <div className="menu-item" style={{ color: '#ef4444' }} onClick={() => { handleDelete(f.id); setShowMenuId(null); }}>
            <Trash2 size={14} /> Excluir
        </div>
    </div>
)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

        <div style={{
  ...paginationFooter,
  borderTopColor: theme.border,
  backgroundColor: theme.mainBg,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}}>

  {/* ESQUERDA: Exibir + Contador */}
  <div style={{ 
    display: "flex", 
    alignItems: "center", 
    gap: "20px" 
  }}>
    
    {/* Seletor Exibir */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '13px', color: theme.textSecondary }}>
        Exibir:
      </span>
      <select 
        value={itemsPerPage} 
        onChange={(e) => {
          const val = e.target.value;
          setItemsPerPage(val === "Todos" ? "Todos" : Number(val));
          setCurrentPage(1);
        }}
        style={{
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid ' + theme.border,
          backgroundColor: theme.bg,
          color: theme.text,
          fontSize: '13px',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value="Todos">Todos</option>
      </select>
    </div>

    {/* Contador */}
    <div style={{ fontSize: '13px', color: theme.textSecondary }}>
      Exibindo <strong>{itensExibidos.length}</strong> de{" "}
      <strong>{dadosFiltrados.length}</strong> registros
    </div>

  </div>

  {/* DIREITA: Paginação */}
  {itemsPerPage !== "Todos" && (
    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
      <button 
        className="pagination-btn" 
        disabled={currentPage === 1} 
        onClick={() => setCurrentPage(c => c - 1)}
      >
        <ChevronLeft size={18}/>
      </button>

      <span style={{fontSize:'13px', color: theme.text}}>
        {currentPage} / {totalPages || 1}
      </span>

      <button 
        className="pagination-btn" 
        disabled={currentPage === totalPages || totalPages === 0} 
        onClick={() => setCurrentPage(c => c + 1)}
      >
        <ChevronRight size={18}/>
      </button>
    </div>
  )}

</div>

        </div>

    {showModal && (
  <div style={modalOverlay}>
    <div style={{ ...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '500px' }}>
      <div style={modalHeader}>
        <h3 style={{ margin: 0 }}>{modalType === "add" ? "Novo Cadastro Piscina" : "Editar Cadastro"}</h3>
        <X size={20} cursor="pointer" onClick={() => setShowModal(false)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '70vh', overflowY: 'auto', padding: '5px' }}>

        {/* Campo Unidade com Busca Flutuante */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <label style={labelStyle}>Unidade</label>
          <div
            style={{
              ...selectStyle,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: theme.bg,
              color: theme.text,
              borderColor: theme.border
            }}
            onClick={() => setShowUnitDropdown(!showUnitDropdown)}
          >
            <span>{formData.id_unidade ? getUnitLabel(formData.id_unidade) : "Selecione a unidade..."}</span>
            <ChevronDown size={16} />
          </div>

          {showUnitDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, width: '100%',
              backgroundColor: theme.mainBg, border: `1px solid ${theme.border}`,
              borderRadius: '8px', zIndex: 1200, boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              marginTop: '4px', overflow: 'hidden'
            }}>
              <div style={{ padding: '8px' }}>
                <input
                  style={{
                    width: '100%', padding: '8px', borderRadius: '6px',
                    border: `1px solid ${theme.border}`, backgroundColor: theme.bg,
                    color: theme.text, boxSizing: 'border-box', outline: 'none'
                  }}
                  placeholder="Digite o bloco ou apto..."
                  autoFocus
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                />
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {unidadesFiltradas.length > 0 ? (
                  unidadesFiltradas.map(u => (
                    <div
                      key={u.id}
                      style={{
                        padding: '10px 15px', cursor: 'pointer', fontSize: '14px',
                        borderBottom: `1px solid ${theme.border}`
                      }}
                      onClick={() => {
                        setFormData({ ...formData, id_unidade: u.id });
                        setShowUnitDropdown(false);
                        setUnitSearch("");
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = theme.bg}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      BLOCO {u.bloco} - UNIDADE {u.unidade}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', opacity: 0.7 }}>
                    Nenhuma unidade encontrada
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Checkbox Morador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: theme.bg }}>
          <input type="checkbox" id="checkMorador" checked={isMoradorCadastrado} onChange={e => toggleMoradorCadastrado(e.target.checked)} />
          <label htmlFor="checkMorador" style={{ fontSize: '13px', cursor: 'pointer' }}>Morador Cadastrado?</label>
        </div>

          {isMoradorCadastrado && (
  <div>
    <label style={labelStyle}>Selecionar Morador</label>
    <select 
      style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
      value={formData.id_morador || ""} // Adicione o value para manter sincronizado
      onChange={e => handleMoradorSelect(e.target.value)}
    >
      <option value="">Escolha...</option>
      {moradores
        .filter(m => m.id_unidade?.toString() === formData.id_unidade?.toString())
        .map(m => <option key={m.id} value={m.id}>{m.nome}</option>)
      }
    </select>
  </div>
)}

       {/* Nome, CPF e Telefone (Bloqueados se for morador cadastrado) */}
<div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
  {/* NOME */}
  <div>
    <label style={labelStyle}>Nome</label>
    <input 
      style={{ ...selectStyle, width: '100%', backgroundColor: isMoradorCadastrado ? theme.mainBg : theme.bg, color: theme.text, borderColor: theme.border, opacity: isMoradorCadastrado ? 0.7 : 1 }} 
      value={formData.nome} 
      readOnly={isMoradorCadastrado}
      onChange={e => setFormData({ ...formData, nome: e.target.value })} 
    />
  </div>

  {/* CPF (NOVO) */}
  <div>
    <label style={labelStyle}>CPF</label>
    <input 
      style={{ ...selectStyle, width: '100%', backgroundColor: isMoradorCadastrado ? theme.mainBg : theme.bg, color: theme.text, borderColor: theme.border, opacity: isMoradorCadastrado ? 0.7 : 1 }} 
      value={formData.cpf} 
      readOnly={isMoradorCadastrado}
      placeholder="000.000.000-00"
      onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })} // Se tiver função de máscara
    />
  </div>

  {/* TELEFONE */}
  <div>
    <label style={labelStyle}>Telefone</label>
    <input 
      style={{ ...selectStyle, width: '100%', backgroundColor: isMoradorCadastrado ? theme.mainBg : theme.bg, color: theme.text, borderColor: theme.border, opacity: isMoradorCadastrado ? 0.7 : 1 }} 
      value={formData.telefone} 
      readOnly={isMoradorCadastrado}
      onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })} 
    />
  </div>
</div>

        {/* Nascimento e Validade */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div>
            <label style={labelStyle}>Data Nascimento</label>
            <input 
              type="date"
              style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
              value={formData.nascimento} 
              onChange={e => setFormData({...formData, nascimento: e.target.value})} 
            />
          </div>
          <div>
            <label style={labelStyle}>Validade Atestado</label>
            <input 
              type="date"
              style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
              value={formData.validade} 
              onChange={e => setFormData({...formData, validade: e.target.value})} 
            />
          </div>
        </div>

        {/* Status */}
        <div style={{marginTop: '5px'}}>
          <label style={labelStyle}>Status de Acesso</label>
          <select 
            style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
            value={formData.status} 
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Vencido">Vencido</option>
          </select>
        </div>

        {/* SEÇÃO DE ARQUIVOS (FOTO E ATESTADO) */}
        <div style={{ marginTop: '10px' }}>
          <label style={labelStyle}>Documentação (Foto e Atestado)</label>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            
            {/* Preview Foto Perfil */}
<div style={{ textAlign: 'center' }}>
  <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
    
    {/* Círculo da Foto - Renderização Condicional */}
    <div style={{
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      border: `2px solid ${theme.border}`,
      boxShadow: theme.isDark ? '0 4px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
      backgroundColor: theme.bg, // Fundo padrão quando vazio
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* SE houver foto (Base64 ou URL), mostra a imagem */}
      {(formData.fotoBase64 || formData.url_foto) ? (
        <img 
          src={formData.fotoBase64 || formData.url_foto} 
          alt="Perfil" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      ) : (
        /* CASO CONTRÁRIO, mostra o círculo vazio com um ícone de usuário padrão */
        <User size={40} color={theme.textSecondary} style={{ opacity: 0.5 }} />
      )}
    </div>

    {/* Input de Arquivo Oculto */}
    <input 
      type="file" 
      id="upload-foto" 
      accept="image/*" 
      style={{display:'none'}} 
      onChange={(e) => handleFileChange(e, 'fotoBase64')} 
    />
    

    {/* Botão de Upload (Ícone de Nuvem) */}
    <label 
      htmlFor="upload-foto" 
      style={{ 
        position: 'absolute', 
        bottom: 0, 
        right: 0, 
        background: '#3b82f6', 
        color: 'white', 
        borderRadius: '50%', 
        padding: '7px', 
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
      }}
    >
      <UploadCloud size={16} />
    </label>
  </div>
  <span style={{fontSize: '10px', color: theme.textSecondary, marginTop: '6px', display: 'block'}}>
    Foto Perfil
  </span>
</div>

            {/* Preview Atestado (SEU CÓDIGO JÁ ESTAVA ASSIM) */}
    <div style={{ textAlign: 'center' }}>
       <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto' }}>
        <div style={{ width: '100px', height: '100px', backgroundColor: theme.bg, borderRadius: '8px', border: `2px dashed ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
           {formData.atestadoBase64 ? <CheckCircle2 color="#22c55e" /> : <FileText color={theme.textSecondary} />}
           <span style={{fontSize: '9px', marginTop: '5px'}}>{formData.atestadoBase64 ? "Carregado" : "Atestado"}</span>
        </div>
        <input type="file" id="upload-atestado" accept="image/*,application/pdf" style={{display:'none'}} onChange={(e) => handleFileChange(e, 'atestadoBase64')} />
        <label htmlFor="upload-atestado" style={{ position: 'absolute', bottom: -5, right: -5, background: '#3b82f6', color: 'white', borderRadius: '50%', padding: '5px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          <Plus size={14} />
        </label>
      </div>
      <span style={{fontSize: '10px', color: theme.textSecondary, marginTop: '5px', display: 'block'}}>Médico/PDF</span>
    </div>

  </div>
</div>
        {/* Observação (Sempre visível no cadastro da piscina) */}
        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Observações</label>
          <textarea 
            style={{
              ...selectStyle, 
              width:'100%', 
              backgroundColor: theme.bg, 
              color: theme.text, 
              borderColor: theme.border,
              minHeight: '60px',
              fontFamily: 'inherit',
              padding: '10px',
              borderRadius: '8px',
              resize: 'vertical'
            }} 
            placeholder=""
            value={formData.obs || ""} 
            onChange={e => setFormData({...formData, obs: e.target.value})}
          />
        </div>

        <button 
          style={{
            backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px', 
            borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '10px'
          }} 
          onClick={handleSave}
        >
          {loadingGlobal ? <Loader2 className="animate-spin" size={18}/> : "Salvar Cadastro"}
        </button>
      </div>
    </div>
  </div>
)}
      {/* MODAL VER MAIS - CORRIGIDO E ESTRUTURADO */}
      {showViewModal && selectedFesta && (
  <div style={modalOverlay}>
    <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth:'450px', maxHeight: '90vh', overflowY: 'auto'}}>
      <div style={modalHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
          <Calendar color="#3b82f6"/> 
          <h3 style={{margin: 0}}>Dados da Piscina</h3>
        </div>
        <X onClick={() => setShowViewModal(false)} cursor="pointer"/>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>

        {/* Cabeçalho com foto e identificação */}
<div style={{display:'flex', gap:'12px', alignItems:'center'}}>
  <div style={{width:72, height:72, borderRadius:10, overflow:'hidden', border:`1px solid ${theme.border}`, display:'flex', alignItems:'center', justifyContent:'center', background: theme.bg}}>
    {selectedFesta.fotoBase64 || selectedFesta.url_foto ? (
      <img 
        // USANDO A FUNÇÃO QUE VOCÊ CONFIRMOU QUE FUNCIONA:
        src={selectedFesta.fotoBase64 || converterLinkDrive(selectedFesta.url_foto)} 
        alt="Foto" 
        style={{width:'100%', height:'100%', objectFit:'cover'}} 
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    ) : (
      <User size={34} color={theme.textSecondary} />
    )}
  </div>
  <div>
    <div style={{fontSize:14, fontWeight:700, color: theme.text}}>{selectedFesta.nome || "-"}</div>
    <div style={{fontSize:12, color: theme.textSecondary}}>ID: {selectedFesta.id || "-"}</div>
    <div style={{fontSize:12, color: theme.textSecondary}}>{selectedFesta.id_unidade ? getUnitLabel(selectedFesta.id_unidade) : "-"}</div>
  </div>
</div>

        {/* Dados pessoais / cadastro */}
<div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}>
  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
    {/* NOME (Movido para dentro do grid se preferir, ou mantido no cabeçalho) */}
    <div><strong>Nascimento:</strong><br/>{selectedFesta.nascimento ? formatarDataExibicao(selectedFesta.nascimento) : "-"}</div>
    
    {/* CPF ADICIONADO AQUI */}
    <div>
  <strong>CPF:</strong><br/>
  {/* Chamando a nova função maskCPFPrivacy */}
  {selectedFesta?.cpf ? maskCPFPrivacy(selectedFesta.cpf) : "-"}
</div>
    <div><strong>Telefone:</strong><br/>{selectedFesta.telefone || "-"}</div>
    
    <div><strong>Validade Atestado:</strong><br/>{selectedFesta.validade ? formatarDataExibicao(selectedFesta.validade) : "-"}</div>
    
    <div><strong>Status:</strong><br/>
      <span style={{
        display:'inline-block', padding:'4px 8px', borderRadius:8, fontWeight:700,
        backgroundColor: selectedFesta.status === 'Ativo' ? '#dcfce7' : selectedFesta.status === 'Inativo' ? '#fee2e2' : '#fef9c3',
        color: selectedFesta.status === 'Ativo' ? '#15803d' : selectedFesta.status === 'Inativo' ? '#b91c1c' : '#a16207'
      }}>{selectedFesta.status || '-'}</span>
    </div>
  </div>

  {/* Sinaliza atestado vencido */}
  {selectedFesta.validade && new Date(selectedFesta.validade) < new Date() && (
    <div style={{marginTop:10, color:'#ef4444', fontWeight:700, display:'flex', alignItems:'center', gap:8}}>
      <AlertCircle size={16} /> Atestado vencido
    </div>
  )}
</div>

        {/* Observações */}
        <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border }}>
  <strong style={{ color: theme.text }}>Observações</strong>
  <div 
    style={{ 
      marginTop: 6, 
      color: theme.textSecondary, 
      whiteSpace: 'pre-wrap', 
      // --- Adicione estas linhas para evitar que o texto vaze ---
      wordBreak: 'break-word', 
      overflowWrap: 'break-word',
      fontSize: '0.9rem',
      lineHeight: '1.4'
    }}
  >
    {selectedFesta.obs || "-"}
  </div>
</div>

        {/* Atestado / Documento */}
<div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}>
  <strong>Atestado / Documento</strong>
  <div style={{marginTop:8, display:'flex', gap:10, alignItems:'center'}}>
    {selectedFesta.atestadoBase64 ? (
      <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
        <CheckCircle2 color="#22c55e" />
        <small style={{color: theme.textSecondary}}>Atestado carregado (não salvo)</small>
      </div>
    ) : (selectedFesta.url_atestado || selectedFesta.id_atestado_drive) ? (
      <div style={{display:'flex', flexDirection:'column', gap: 5}}>
        <a 
          href={selectedFesta.url_atestado || `https://drive.google.com/uc?id=${selectedFesta.id_atestado_drive}`} 
          target="_blank" 
          rel="noreferrer" 
          style={{color: '#3b82f6', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4}}
        >
          <FileText size={16}/> Abrir Atestado
        </a>
      </div>
    ) : (
      <div style={{color: theme.textSecondary}}>Nenhum atestado anexado</div>
    )}
  </div>
</div>

{/* Container da Carteirinha */}
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
  
  <div id="carteirinha-piscina" style={{
    width: '100%',
    maxWidth: '500px', 
    aspectRatio: '1011 / 639', 
    backgroundImage: 'url("/template.jpg")', // Busca direto na public
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    fontFamily: 'sans-serif',
    color: '#000' 
  }}>

    {/* FOTO (Ajustada para o box da esquerda) */}
    <div style={{ 
      position: 'absolute', 
      top: '20%', 
      left: '7.5%', 
      width: '28.5%', 
      height: '58%', 
      borderRadius: '25px',
      overflow: 'hidden'
    }}>
      {selectedFesta.url_foto ? (
        <img 
          src={converterLinkDrive(selectedFesta.url_foto)} 
          alt="Foto" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      ) : (
        <div style={{ background: '#eee', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={40} color="#999" />
        </div>
      )}
    </div>

    {/* NOME (Formatado para Nome e Primeiro Sobrenome) */}
<div style={{ position: 'absolute', top: '23%', left: '37.8%', fontSize: '0.8rem', fontWeight: '800' }}>
  {selectedFesta.nome ? (
    selectedFesta.nome.split(" ").slice(0, 2).join(" ")
  ) : "-"}
</div>

    {/* NASCIMENTO (Embaixo do título NASCIMENTO) */}
    <div style={{ position: 'absolute', top: '40%', left: '37.8%', fontSize: '0.8rem', fontWeight: '600' }}>
      {selectedFesta.nascimento ? formatarDataExibicao(selectedFesta.nascimento) : "-"}
    </div>

    {/* UNIDADE (Formatado para sair apenas 5-206) */}
<div style={{ position: 'absolute', top: '55%', left: '37.8%', fontSize: '0.8rem', fontWeight: '600' }}>
  {selectedFesta.id_unidade ? (
    getUnitLabel(selectedFesta.id_unidade)
      .replace(/BLOCO\s*|UNIDADE\s*/gi, '') // Remove as palavras BLOCO e UNIDADE
      .replace(/\s*-\s*/g, '-')             // Remove espaços em volta do traço
      .trim()                                // Limpa espaços nas pontas
  ) : "-"}
</div>

    {/* TELEFONE (Embaixo do título TELEFONE) */}
    <div style={{ position: 'absolute', top: '70.5%', left: '37.8%', fontSize: '0.8rem', fontWeight: '600' }}>
      {selectedFesta.telefone || "-"}
    </div>

    {/* VALIDADE (Embaixo do título VALIDADE) */}
    <div style={{ position: 'absolute', top: '55.5%', left: '68.2%', fontSize: '0.8rem', fontWeight: 'bold', color: '#cc0000' }}>
      {selectedFesta.validade ? formatarDataExibicao(selectedFesta.validade) : "-"}
    </div>

    {/* ID (Na frente do ID) */}
    <div style={{ position: 'absolute', bottom: '-0.2%', right: '3%', fontSize: '0.7rem', fontWeight: '600', color: '#095f34' }}>
      {selectedFesta.id || "000"}
    </div>

  </div>
</div>

      </div>
    </div>
  </div>
)}
    </div>
  );
}