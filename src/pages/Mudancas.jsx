 
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

export default function Festas({ user }) {
  const { theme } = useTheme();
  
  const [festas, setFestas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ nome: "Sistema" });
  
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFesta, setSelectedFesta] = useState(null);
  const [modalType, setModalType] = useState("add"); // "add" ou "edit"
  const [showMenuId, setShowMenuId] = useState(null);
  const menuRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isMoradorCadastrado, setIsMoradorCadastrado] = useState(false);
  
  const [formData, setFormData] = useState({
  id_unidade: "", morador: "", contato: "", data_mudanca: "",
  status: "Pendente", cpf: "", rg: "", 
  tipo: "Entrada", periodo: "Manhã", obs: "", data_fim: "" // Novos campos
});

const formatToInputDate = (dateStr) => {
  if (!dateStr) return "";
  
  // Se a data já estiver no formato ISO (YYYY-MM-DD...), apenas corta os primeiros 10 caracteres
  if (dateStr.includes("-") && dateStr.indexOf("-") === 4) {
    return dateStr.substring(0, 10);
  }

  // Se a data estiver no formato brasileiro (DD/MM/YYYY...)
  if (dateStr.includes("/")) {
    const parts = dateStr.split(" ")[0].split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return dateStr;
};

const [filterTipo, setFilterTipo] = useState("Todos");
const [filterPeriodoRapido, setFilterPeriodoRapido] = useState("Todos");

  const maskRGPrivacy = (rg) => {
  if (!rg) return "";
  const clean = rg.replace(/\D/g, "");
  if (clean.length < 5) return rg; 
  return `${clean.substring(0, 2)}.***.***-${clean.slice(-1)}`;
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
const unidadesFiltradas = unidades.filter(u => 
  u.bloco.toString().toLowerCase().includes(unitSearch.toLowerCase()) || 
  u.unidade.toString().toLowerCase().includes(unitSearch.toLowerCase())
);

  const [filterPeriodo, setFilterPeriodo] = useState({ inicio: "", fim: "" });
  const [filterTurno, setFilterTurno] = useState("Todos"); // Novo (Manhã/Tarde)

  const btnSaveStyles = {
    ...btnNew,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    width: '100%',
    justifyContent: 'center',
    marginTop: '10px',
    border: theme.isDark ? '1px solid #60a5fa' : 'none'
  };

  
const [sortConfig, setSortConfig] = useState([{ key: 'data_mudanca', direction: 'desc' }]);
  // Funções de Máscara
const maskCPF = (v) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const maskPhone = (v) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};




// Converte a data do banco (DD/MM/YYYY HH:mm) para o formato do input (YYYY-MM-DDTHH:mm)
const formatDateTimeForInput = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  if (dateTimeStr.includes('/') && dateTimeStr.includes(' ')) {
    const [date, time] = dateTimeStr.split(' ');
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}T${time}`;
  }
  return dateTimeStr.substring(0, 16);
};

  useEffect(() => {
  fetchData();
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);

  const handleClickOutside = (e) => {
    // Fecha o menu de ações (três pontinhos)
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenuId(null);
    }
    // NOVO: Fecha o seletor de unidades se clicar fora dele
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setShowUnitDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []); // Certifique-se de que não há nada sobrando aqui

  const fetchData = async () => {
  try {
    setLoadingInitial(true);
    
    // Adicionamos { method: "GET", redirect: "follow" } em cada chamada fetch
    const [resMudancas, resUnidades, resMoradores] = await Promise.all([
      fetch(`${API_URL}?token=${TOKEN}&sheet=MUDANCAS`, { method: "GET", redirect: "follow" }).then(r => r.json()),
      fetch(`${API_URL}?token=${TOKEN}&sheet=UNIDADES`, { method: "GET", redirect: "follow" }).then(r => r.json()),
      fetch(`${API_URL}?token=${TOKEN}&sheet=MORADORES`, { method: "GET", redirect: "follow" }).then(r => r.json()),
    ]);

    // IMPORTANTE: Salvar os dados da planilha MUDANCAS no estado festas
    setFestas(Array.isArray(resMudancas) ? resMudancas : []);
    
    // Ordenação das unidades para o dropdown
    const sortedUnidades = Array.isArray(resUnidades) ? [...resUnidades].sort((a, b) => {
      if (a.bloco !== b.bloco) return String(a.bloco).localeCompare(String(b.bloco), undefined, {numeric: true});
      return String(a.unidade).localeCompare(String(b.unidade), undefined, {numeric: true});
    }) : [];

    setUnidades(sortedUnidades);
    setMoradores(Array.isArray(resMoradores) ? resMoradores : []);

  } catch (error) { 
    console.error("Erro ao carregar dados (CORS/Redirect):", error); 
  } finally { 
    // Delay de 300ms para suavizar a transição do loading para a tabela
    setTimeout(() => {
      setLoadingInitial(false);
    }, 300);
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

const maskRG = (v) => {
  v = v.replace(/\D/g, ""); // Remove tudo que não é número
  if (v.length > 9) v = v.slice(0, 10); // Limita ao tamanho padrão de RG
  
  // Aplica a máscara 12.123.123-4
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4");
};

const [showExportModal, setShowExportModal] = useState(false);
const [selectedColumns, setSelectedColumns] = useState([
  { id: 'id_unidade', label: 'Unidade', selected: true },
  { id: 'morador', label: 'Morador', selected: true },
  { id: 'cpf', label: 'CPF', selected: true },
  { id: 'rg', label: 'RG', selected: true },
  { id: 'contato', label: 'Telefone', selected: true },
  { id: 'data_mudanca', label: 'Data', selected: true },
  { id: 'periodo', label: 'Período', selected: true }, // Antes era "Taxa"
  { id: 'tipo', label: 'Tipo', selected: true },       // Antes era "Pago"
  { id: 'status', label: 'Status', selected: true }
]);



const exportToExcel = () => {
  const colsAtivas = selectedColumns.filter(c => c.selected);

  const dadosParaExportar = dadosFiltrados.map(f => {
    const linha = {};
    const unit = unidades.find(u => u.id?.toString() === f.id_unidade?.toString());

    colsAtivas.forEach(col => {
      if (col.id === 'id_unidade') {
        linha["Unidade"] = unit ? `B${unit.bloco} - ${unit.unidade}` : f.id_unidade;
      } 
      else if (col.id === 'cpf') {
        linha["CPF"] = maskCPFPrivacy(f.cpf);
      } 
      else if (col.id === 'rg') {
        linha["RG"] = maskRGPrivacy(f.rg); // Aplica a máscara solicitada
      }
      else if (col.id === 'data_mudanca') {
        const data = f.data_mudanca?.split(' ')[0];
        linha["Data"] = data?.includes('-') ? data.split('-').reverse().join('/') : data;
      }
      else {
        linha[col.label] = f[col.id] || "";
      }
    });
    return linha;
  });

  const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mudanças");
  XLSX.writeFile(wb, "Relatorio_Mudancas.xlsx");
  setShowExportModal(false);
};

const handleToggleColumn = (id) => {
  setSelectedColumns(prev => prev.map(col => col.id === id ? { ...col, selected: !col.selected } : col));
};

const exportToPDF = () => {
  const doc = new jsPDF('l', 'mm', 'a4'); 
  const img = new Image(); 
  img.src = "/logo.png"; 

  // Função interna para a máscara (pode declarar fora se preferir)
  const maskCPFPrivacy = (cpf) => {
    if (!cpf) return "";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length < 11) return cpf;
    return `${clean.substring(0, 3)}.***.***-${clean.substring(9)}`;
  };

  const colsParaExportar = selectedColumns.filter(c => c.selected);
  const headers = colsParaExportar.map(c => c.label);
  
  const body = dadosFiltrados.map(f => colsParaExportar.map(c => {

    // 2. Tratamento específico para CPF (Máscara de Privacidade)
    if(c.id === 'cpf') return maskCPFPrivacy(f[c.id]);

    if(c.id === 'rg') return maskRGPrivacy(f[c.id]);

    // 3. Tratamento para UNIDADE (Para mostrar B1 - 101 em vez do ID)
    if(c.id === 'id_unidade') {
      const unit = unidades.find(u => u.id?.toString() === f.id_unidade?.toString());
      return unit ? `B${unit.bloco} - ${unit.unidade}` : f.id_unidade;
    }

    // 4. Tratamento para DATA
    if(c.id === 'data_mudanca') return f[c.id]?.replace('T', ' ') || "";

    return f[c.id] || "";
  }));

  const gerarPDF = (incluirLogo = false) => {
    doc.setDrawColor(34, 197, 94); 
    doc.setLineWidth(1.5); 
    doc.rect(5, 5, 287, 200);
    if (incluirLogo) doc.addImage(img, 'PNG', 113, 12, 70, 25);
    
    doc.setFontSize(18); 
    doc.setTextColor(30, 41, 59);
    doc.text("Relatório de Reservas - Salão de Festas", 148, incluirLogo ? 45 : 25, { align: "center" });

    autoTable(doc, {
      startY: incluirLogo ? 55 : 35,
      head: [headers],
      body: body,
      headStyles: { fillColor: [34, 197, 94], halign: 'center', textColor: [255, 255, 255] },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 10, right: 10 }
    });

    doc.save("Relatorio_Festas.pdf");
    setShowExportModal(false);
  };

  img.onload = () => gerarPDF(true); 
  img.onerror = () => gerarPDF(false);
};

  const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          // IMPORTANTE: O reader.result aqui já contém a informação se é PDF ou Imagem
          fotosNovas: [...(prev.fotosNovas || []), reader.result] 
        }));
      };
      reader.readAsDataURL(file);
    });
  }
};
const formatToInputDateTime = (dateStr) => {
  if (!dateStr) return "";

  try {
    const s = dateStr.toString().trim();

    // 1. Tratamento para formato brasileiro: "18/02/2026 15:15:59"
    if (s.includes('/')) {
      const [data, horaFull] = s.split(' ');
      const [d, m, y] = data.split('/');
      
      // Pega apenas os primeiros 5 caracteres da hora (HH:mm)
      const horaMinuto = horaFull ? horaFull.substring(0, 5) : "00:00";
      
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${horaMinuto}`;
    }

    // 2. Tratamento para formato ISO vindo da planilha: "2026-02-18 15:15:59"
    if (s.includes('-')) {
      const [data, horaFull] = s.replace('T', ' ').split(' ');
      const horaMinuto = horaFull ? horaFull.substring(0, 5) : "00:00";
      
      return `${data}T${horaMinuto}`;
    }

    return s;
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return "";
  }
};

  const handleSave = async () => {
  // 1. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
  if (!formData.id_unidade) return alert("O campo UNIDADE é obrigatório.");
  if (!formData.morador?.trim()) return alert("O campo NOME DO RESPONSÁVEL é obrigatório.");
  if (!formData.data_mudanca) return alert("O campo DATA INÍCIO é obrigatório.");
  if (!formData.data_fim) return alert("O campo DATA FIM é obrigatório."); // Validando o fim
  if (!formData.contato?.trim()) return alert("O campo TELEFONE CONTATO é obrigatório.");

  const idMoradorFinal = isMoradorCadastrado 
    ? moradores.find(m => m.nome === formData.morador)?.id 
    : "";

  // 2. LÓGICA DE VALIDAÇÃO DE CONFLITO (POR BLOCO NO DIA)
  const dataNovaISO = formData.data_mudanca.split("T")[0]; 
  const blocoNovo = formData.id_unidade.toString().charAt(0); 

  const conflito = festas.find(f => {
      if (!f.data_mudanca || f.status === "Cancelado") return false;

      const blocoExistente = f.id_unidade?.toString().charAt(0);
      let dataExistenteISO = "";

      // Normalização da data para comparação YYYY-MM-DD
      if (f.data_mudanca.includes('/')) {
          const [d, m, y] = f.data_mudanca.split(' ')[0].split('/');
          dataExistenteISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else {
          dataExistenteISO = f.data_mudanca.split(' ')[0];
      }

      return (
        dataExistenteISO === dataNovaISO && 
        blocoExistente === blocoNovo && 
        f.id?.toString() !== formData.id?.toString()
      );
  });

  if (conflito) {
      if (conflito.status === "Pendente") {
          const confirmar = window.confirm(`AVISO: O Bloco ${blocoNovo} já possui um agendamento PENDENTE (Unidade ${conflito.id_unidade}) para este dia. Deseja continuar?`);
          if (!confirmar) return; 
      } else {
          alert(`BLOQUEADO: O Bloco ${blocoNovo} já possui uma mudança com status ${conflito.status} neste dia.`);
          return;
      }
  }

  // 3. PROCESSO DE ENVIO
  setLoadingGlobal(true);
  
  const payload = { 
    token: TOKEN, 
    action: modalType === "add" ? "add" : "edit", 
    sheet: "MUDANCAS",
    id: modalType === "add" ? Date.now().toString() : formData.id.toString(),
    
    // Mapeamento exato das colunas do seu Google Sheets
    id_unidade: formData.id_unidade,
    id_morador: idMoradorFinal,
    morador: formData.morador,
    cpf: formData.cpf || "",
    rg: formData.rg || "",
    contato: formData.contato,
    periodo: formData.periodo || "Manhã",
    data_mudanca: formData.data_mudanca.replace("T", " "), // Formato amigável para a célula
    status: formData.status || "Pendente",
    tipo: formData.tipo || "Entrada",
    data_preenchimento: new Date().toLocaleString("pt-BR"),
    obs: formData.obs || "",
    data_fim: formData.data_fim.replace("T", " "), // Enviando o horário final
    user: user?.nome || "Sistema"
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    }); 
    
    const result = await response.json();
    
    if(result.status === "success" || result.success) {
      setShowModal(false);
      await fetchData(); 
      
      // Limpa o formulário incluindo o novo campo
      setFormData({
        id_unidade: "", morador: "", contato: "", data_mudanca: "", data_fim: "",
        status: "Pendente", cpf: "", rg: "", tipo: "Entrada", periodo: "Manhã", obs: "",
      });
    } else {
      alert("Erro: " + result.message);
    }
  } catch (error) { 
    console.error(error);
    alert("Erro ao conectar com a planilha."); 
  } finally { 
    setLoadingGlobal(false); 
  }
};
 const handleDelete = async (id) => {
  if (confirm("Deseja excluir esta mudança permanentemente?")) {
    setLoadingGlobal(true);

    try {
      // O ERRO ESTAVA AQUI: Mudamos de "FESTAS" para "MUDANCAS"
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          token: TOKEN,
          action: "delete",
          sheet: "MUDANCAS", // Nome idêntico ao que o Apps Script espera
          id: id.toString()
        })
      });

      // Sucesso: Atualiza os dados e fecha o menu
      setTimeout(() => {
        fetchData();
        setLoadingGlobal(false);
        setShowMenuId(null);
      }, 1000);

    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir o registro.");
      setLoadingGlobal(false);
    }
  }
};

  const handleMoradorSelect = (moradorId) => {
    const moradorObj = moradores.find(m => m.id.toString() === moradorId);
    if (moradorObj) {
        setFormData({ 
            ...formData, 
            morador: moradorObj.nome, 
            contato: moradorObj.telefone || "",
            cpf: moradorObj.cpf || "",
            rg: moradorObj.rg || ""
        });
    }
  };

  const toggleMoradorCadastrado = (checked) => {
    setIsMoradorCadastrado(checked);
    setFormData({ ...formData, morador: "", contato: "", cpf: "", rg: "" });
  };

  const handleEdit = (mudanca) => {
  setModalType("edit");
  
  // Verifica se o morador já tem ID para marcar o toggle corretamente
  setIsMoradorCadastrado(!!mudanca.id_morador);

  setFormData({
    ...mudanca,
    // Aplica a formatação nas duas datas para elas aparecerem nos inputs
    data_mudanca: formatToInputDateTime(mudanca.data_mudanca),
    data_fim: formatToInputDateTime(mudanca.data_fim),
    // Garante que campos opcionais não venham como undefined
    obs: mudanca.obs || "",
    cpf: mudanca.cpf || "",
    rg: mudanca.rg || ""
  });

  setShowModal(true);
  setShowMenuId(null); // Fecha o menu de opções (os três pontinhos)
};

  const formatCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const dadosFiltrados = React.useMemo(() => {
  // 1. FILTRAGEM
  let resultado = festas.filter(f => {
    // Filtro de Busca (Nome ou Unidade)
    const matchesSearch = 
        f.morador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id_unidade?.toString().includes(searchTerm);
    
    // Filtro de Status
    const matchesStatus = filterStatus === "Todos" || f.status === filterStatus;

    // Filtro de Tipo (Entrada / Saída)
    const matchesTipo = !filterTipo || filterTipo === "Todos" || f.tipo === filterTipo;

    // Filtro de Turno (Manhã / Tarde) - CORRIGIDO
    const matchesTurno = !filterTurno || filterTurno === "Todos" || f.periodo === filterTurno;

    // Helper para converter data brasileira para Objeto Date
    const parseDataSimples = (s) => {
        if (!s) return null;
        const [d, m, y] = s.split(" ")[0].split("/");
        return new Date(y, m - 1, d);
    };
    const dataFesta = parseDataSimples(f.data_mudanca);

    // Filtro de Período Customizado (Calendário)
    let matchesData = true;
    if (dataFesta && (filterPeriodo.inicio || filterPeriodo.fim)) {
        if (filterPeriodo.inicio) {
            const dataInic = new Date(filterPeriodo.inicio + "T00:00:00");
            if (dataFesta < dataInic) matchesData = false;
        }
        if (filterPeriodo.fim) {
            const dataFim = new Date(filterPeriodo.fim + "T23:59:59");
            if (dataFesta > dataFim) matchesData = false;
        }
    }

    // Filtro de Período Rápido
    let matchesRapido = true;
    if (filterPeriodoRapido && filterPeriodoRapido !== "Todos") {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        
        if (filterPeriodoRapido === "Hoje") {
            matchesRapido = dataFesta?.getTime() === hoje.getTime();
        } else if (filterPeriodoRapido === "Semana") {
            const seteDias = new Date();
            seteDias.setDate(hoje.getDate() + 7);
            matchesRapido = dataFesta >= hoje && dataFesta <= seteDias;
        } else if (filterPeriodoRapido === "Mes") {
            matchesRapido = dataFesta?.getMonth() === hoje.getMonth() && dataFesta?.getFullYear() === hoje.getFullYear();
        }
    }

    // ADICIONADO matchesTurno NO RETURN ABAIXO
    return matchesSearch && matchesStatus && matchesTipo && matchesData && matchesRapido && matchesTurno;
  });

  // 2. ORDENAÇÃO
  if (sortConfig.length === 0) {
    resultado.sort((a, b) => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const parseDateFull = (s) => {
        if (!s) return 0;
        try {
          const [d, m, yT] = s.split('/');
          const [year, time] = yT.split(' ');
          return new Date(`${year}-${m}-${d}T${time}`).getTime();
        } catch (e) { return 0; }
      };

      const timeA = parseDateFull(a.data_mudanca);
      const timeB = parseDateFull(b.data_mudanca);
      const estaNoPassadoA = timeA < hoje.getTime();
      const estaNoPassadoB = timeB < hoje.getTime();

      if (estaNoPassadoA !== estaNoPassadoB) return estaNoPassadoA ? 1 : -1;
      if (!estaNoPassadoA) return timeA - timeB;
      return timeB - timeA;
    });
  } else {
    resultado.sort((a, b) => {
      for (const { key, direction } of sortConfig) {
        let valA = a[key];
        let valB = b[key];

        if (key === 'data_mudanca') {
          const parseDate = (s) => {
            if (!s) return 0;
            const [d, m, yT] = s.split('/');
            const [year, time] = yT.split(' ');
            return new Date(`${year}-${m}-${d}T${time}`).getTime();
          };
          valA = parseDate(valA);
          valB = parseDate(valB);
        } else if (key === 'valor_taxa' || key === 'id_unidade') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = valA?.toString().toLowerCase() || "";
          valB = valB?.toString().toLowerCase() || "";
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  return resultado;
  // ADICIONADO filterTurno NAS DEPENDÊNCIAS ABAIXO
}, [festas, searchTerm, filterStatus, filterTipo, filterPeriodo, filterPeriodoRapido, filterTurno, sortConfig]);

// --- 3. RE-DECLARAÇÃO DAS VARIÁVEIS DE PAGINAÇÃO (Resolve os erros de undefined) ---
const totalPages = Math.ceil(dadosFiltrados.length / (itemsPerPage === "Todos" ? dadosFiltrados.length : itemsPerPage));

const handleSort = (key, isShiftPressed) => {
  setSortConfig(prev => {
    let newConfig = [...prev];
    const index = newConfig.findIndex(c => c.key === key);

    if (index > -1) {
      if (newConfig[index].direction === 'asc') {
        newConfig[index] = { key, direction: 'desc' };
      } else {
        newConfig.splice(index, 1);
      }
    } else {
      const newItem = { key, direction: 'asc' };
      newConfig = isShiftPressed ? [...newConfig, newItem] : [newItem];
    }
    return newConfig;
  });
};

const itensExibidos = React.useMemo(() => {
  if (itemsPerPage === "Todos") return dadosFiltrados;
  const start = (currentPage - 1) * itemsPerPage;
  return dadosFiltrados.slice(start, start + itemsPerPage);
}, [dadosFiltrados, currentPage, itemsPerPage]);



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
    <h1 style={{...titleStyle, color: theme.text}}>Reservas de Mudanças</h1>
    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: theme.textSecondary }}>Gestão de eventos do condomínio.</p>
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
  style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} 
  onClick={() => {
    setSearchTerm("");
    setFilterStatus("Todos");
    setFilterPeriodo({ inicio: "", fim: "" }); // Reseta o objeto de datas
    setFilterTurno("Todos");
    setFilterTipo("Todos")
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
    setFormData({
      id_unidade: "", 
      morador: "", 
      contato: "", 
      data_mudanca: "", 
      status: "Pendente", 
      cpf: "", 
      rg: "", 
      tipo: "Entrada", 
      periodo: "Manhã", 
      obs: ""
    }); 
    setShowModal(true); 
  }}
>
  <Plus size={18} /> Nova Mudança
</button>
  </div>
</div>

      <div style={{...filterCard, backgroundColor: theme.mainBg, borderColor: theme.border}}>
    <div style={{display:'flex', flexDirection: 'column', gap: '15px'}}>
        
        {/* LINHA 1: BUSCA E STATUS */}
        <div style={{display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: 'center'}}>
            <div style={{...searchContainer, backgroundColor: theme.bg, borderColor: theme.border, flex: 1}}>
                <Search size={16} color={theme.textSecondary} />
                <input type="text" placeholder="Buscar unidade ou morador..." style={{...searchInput, color: theme.text, width: '100%'}} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <div style={{display:'flex', gap:'8px', overflowX: 'auto', width: isMobile ? '100%' : 'auto', paddingBottom: isMobile ? '5px' : '0'}}>
                {["Todos", "Pendente", "Confirmado", "Realizado", "Cancelado"].map(s => (
                    <button key={s} className={`filter-pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s}</button>
                ))}
            </div>
        </div>

        {/* LINHA 2: TIPO, TURNO E PERÍODO */}
        <div style={{display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: 'center', borderTop: `1px solid ${theme.border}`, paddingTop: '15px'}}>
            
            {/* Filtro Tipo (Entrada/Saída) */}
            <div style={{display:'flex', gap:'8px'}}>
                {["Todos", "Entrada", "Saída"].map(t => (
                    <button key={t} className={`filter-pill ${filterTipo === t ? 'active' : ''}`} onClick={() => setFilterTipo(t)}>
                        {t === "Todos" ? "Tipo: Todos" : t}
                    </button>
                ))}
            </div>

            {/* Filtro Turno (Manhã/Tarde) */}
            <div style={{display:'flex', gap:'8px'}}>
                {["Todos", "Manhã", "Tarde"].map(turno => (
                    <button key={turno} className={`filter-pill ${filterTurno === turno ? 'active' : ''}`} onClick={() => setFilterTurno(turno)}>
                        {turno === "Todos" ? "Turno: Todos" : turno}
                    </button>
                ))}
            </div>

            {/* Calendário */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: isMobile ? 'center' : 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ ...searchContainer, backgroundColor: theme.bg, borderColor: theme.border, padding: '5px 10px', minWidth: isMobile ? '100%' : '140px' }}>
                    <Calendar size={14} color={theme.textSecondary} />
                    <input type="date" style={{ background:'none', border:'none', color: theme.text, fontSize:'12px', outline:'none', width: '100%' }} value={filterPeriodo.inicio} onChange={e => setFilterPeriodo({...filterPeriodo, inicio: e.target.value})} />
                </div>

                <span style={{color: theme.textSecondary, fontSize: '12px', display: isMobile ? 'none' : 'block'}}>até</span>

                <div style={{ ...searchContainer, backgroundColor: theme.bg, borderColor: theme.border, padding: '5px 10px', minWidth: isMobile ? '100%' : '140px' }}>
                    <Calendar size={14} color={theme.textSecondary} />
                    <input type="date" style={{ background:'none', border:'none', color: theme.text, fontSize:'12px', outline:'none', width: '100%' }} value={filterPeriodo.fim} onChange={e => setFilterPeriodo({...filterPeriodo, fim: e.target.value})} />
                </div>

                {(filterPeriodo.inicio || filterPeriodo.fim) && (
                    <RotateCcw size={16} cursor="pointer" color={theme.textSecondary} onClick={() => setFilterPeriodo({inicio: "", fim: ""})} />
                )}
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
  { label: "Unidade", key: "id_unidade" },
  { label: "Responsável", key: "morador" },
  { label: "Data", key: "data_mudanca" },
  { label: "Tipo", key: "tipo" },       // Alterado de 'Valor' para 'Tipo'
  { label: "Período", key: "periodo" }, // Alterado de 'Pago' para 'Período'
  { label: "Status", key: "status" }
].map((col) => {
      const config = sortConfig.find(c => c.key === col.key);
      return (
        <th 
          key={col.key}
          style={{...thStyle, color: theme.textSecondary, cursor: 'pointer', userSelect: 'none'}}
          onClick={(e) => handleSort(col.key, e.shiftKey)}
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
        const unit = unidades.find(u => u.id?.toString() === f.id_unidade?.toString());
        
        // Cores para Período
        const getPeriodoStyle = (periodo) => {
            if (periodo === "Manhã") return { backgroundColor: '#fef9c3', color: '#a16207' }; // Amarelo
            if (periodo === "Tarde") return { backgroundColor: '#ffedd5', color: '#9a3412' }; // Laranja
            return { backgroundColor: '#f3f4f6', color: '#374151' };
        };

        // Cores para Tipo de Mudança
        const getTipoStyle = (tipo) => {
            if (tipo === "Entrada") return { backgroundColor: '#dbeafe', color: '#1e40af' }; // Azul
            if (tipo === "Saída") return { backgroundColor: '#fee2e2', color: '#b91c1c' };   // Vermelho
            return { backgroundColor: '#f3f4f6', color: '#374151' };
        };

        // Cores para Status
        const getStatusStyle = (status) => {
            switch (status) {
                case 'Pendente': return { backgroundColor: '#f3f4f6', color: '#4b5563' }; // Cinza
                case 'Agendado': return { backgroundColor: '#e0e7ff', color: '#4338ca' }; // Indigo/Roxo
                case 'Realizado': return { backgroundColor: '#dcfce7', color: '#15803d' }; // Verde
                case 'Cancelado': return { backgroundColor: '#fee2e2', color: '#b91c1c' }; // Vermelho
                default: return { backgroundColor: '#f3f4f6', color: '#374151' };
            }
        };

        return (
            <tr key={f.id} style={{ ...trStyle, borderBottom: `1px solid ${theme.border}` }}>
                <td style={{ ...tdStyle, color: theme.text }}>
                    <strong>{unit ? `B${unit.bloco} - ${unit.unidade}` : f.id_unidade}</strong>
                </td>
                
                <td style={{ ...tdStyle, color: theme.text }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600' }}>{f.morador}</span>
                        {f.cpf && (
                            <span style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>
                                {maskCPFPrivacy(f.cpf)}
                            </span>
                        )}
                    </div>
                </td>

               <td style={{ ...tdStyle, color: theme.text }}>
                    {(() => {
                        const dataBruta = f.data_mudanca || f.data_reserva;
                        if (!dataBruta) return "-";

                        // Remove o " 00:00" ou qualquer coisa após o espaço
                        const apenasData = dataBruta.toString().split(' ')[0];

                        // Se a data vier no formato AAAA-MM-DD (ISO), inverte
                        if (apenasData.includes('-')) {
                            return apenasData.split('-').reverse().join('/');
                        }
                        
                        return apenasData; // Retorna DD/MM/AAAA
                    })()}
                </td>

                {/* Tipo de Mudança: Entrada/Saída */}
                <td style={tdStyle}>
                    <span style={{ ...badgeGreen, ...getTipoStyle(f.tipo) }}>
                        {f.tipo || "Entrada"}
                    </span>
                </td>

                {/* Período: Manhã/Tarde */}
                <td style={tdStyle}>
                    <span style={{ ...badgeGreen, ...getPeriodoStyle(f.periodo) }}>
                        {f.periodo || "Manhã"}
                    </span>
                </td>

                {/* Status: Pendente, Confirmado, Realizado, Cancelado */}
                <td style={tdStyle}>
                    <span style={{ ...badgeGreen, ...getStatusStyle(f.status) }}>
                        {f.status}
                    </span>
                </td>

                <td style={{ ...tdStyle, textAlign: 'right', position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
        
        {/* Ícone do Olho com Alerta de Obs */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Eye 
                size={18} 
                color="#3b82f6" 
                cursor="pointer" 
                onClick={() => { setSelectedFesta(f); setShowViewModal(true); }} 
            />
            {f.obs && f.obs.trim() !== "" && (
                <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-6px',
                    color: '#ef4444',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    lineHeight: '1',
                    textShadow: theme.isDark ? '0 0 2px #000' : '0 0 2px #fff'
                }}>
                    *
                </span>
            )}
        </div>

        <button onClick={() => setShowMenuId(showMenuId === f.id ? null : f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <MoreVertical size={20} color={theme.textSecondary} />
        </button>
    </div>
                    
                    {showMenuId === f.id && (
                        <div ref={menuRef} className="action-menu" style={{ right: '10px', top: '40px', zIndex: 100 }}>
                            <div className="menu-item" onClick={() => { 
    setModalType("edit"); 
    
    // Importante: define se o morador é cadastrado para habilitar/desabilitar campos
    setIsMoradorCadastrado(!!f.id_morador); 

    setFormData({
        ...f, 
        // Agora a função limpa os segundos automaticamente
        data_mudanca: formatToInputDateTime(f.data_mudanca),
        data_fim: formatToInputDateTime(f.data_fim),
        obs: f.obs || "" // Evita que o campo de observação venha como undefined
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
        <h3 style={{ margin: 0 }}>{modalType === "add" ? "Nova Mudança" : "Editar Mudança"}</h3>
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
          <label htmlFor="checkMorador" style={{ fontSize: '13px', cursor: 'pointer', margin: 0 }}>Morador Cadastrado?</label>
        </div>

        {isMoradorCadastrado && (
          <div>
            <label style={labelStyle}>Selecionar Morador</label>
            <select 
              style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
              onChange={e => handleMoradorSelect(e.target.value)}
            >
              <option value="">Escolha...</option>
              {moradores
                .filter(m => m.id_unidade?.toString() === formData.id_unidade?.toString())
                .map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
        )}

        {/* Nome do Responsável */}
        <div>
          <label style={labelStyle}>Nome do Responsável</label>
          <input 
            style={{...selectStyle, width:'100%', backgroundColor: isMoradorCadastrado ? theme.mainBg : theme.bg, color: theme.text, borderColor: theme.border, opacity: isMoradorCadastrado ? 0.7 : 1}} 
            value={formData.morador} 
            readOnly={isMoradorCadastrado}
            onChange={e => setFormData({...formData, morador: e.target.value})} 
          />
        </div>

        {/* CPF e RG */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div>
            <label style={labelStyle}>CPF</label>
            <input 
              style={{...selectStyle, width:'100%', backgroundColor: isMoradorCadastrado ? theme.mainBg : theme.bg, color: theme.text, borderColor: theme.border, opacity: isMoradorCadastrado ? 0.7 : 1}} 
              value={formData.cpf} 
              readOnly={isMoradorCadastrado}
              onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} 
            />
          </div>
          <div>
  <label style={labelStyle}>RG</label>
  <input 
    style={{
      ...selectStyle, 
      width:'100%', 
      backgroundColor: isMoradorCadastrado ? theme.mainBg : theme.bg, 
      color: theme.text, 
      borderColor: theme.border, 
      opacity: isMoradorCadastrado ? 0.7 : 1
    }} 
    value={formData.rg || ""} 
    readOnly={isMoradorCadastrado}
    placeholder="Ex: 00.000.000-0"
    // GARANTA QUE A LINHA ABAIXO ESTEJA ASSIM:
    onChange={e => setFormData({...formData, rg: maskRG(e.target.value)})} 
  />
</div>
        </div>

        {/* Seção de Horários (Início e Fim) */}
<div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom: '15px'}}>
  <div>
    <label style={labelStyle}>Início da Mudança</label>
    <input 
      type="datetime-local" 
      style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
      value={formData.data_mudanca} 
      onChange={e => setFormData({...formData, data_mudanca: e.target.value})} 
    />
  </div>
  <div>
    <label style={labelStyle}>Previsão de Término</label>
    <input 
      type="datetime-local" 
      style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
      value={formData.data_fim} 
      onChange={e => setFormData({...formData, data_fim: e.target.value})} 
    />
  </div>
</div>

{/* Seção de Contato (Linha Única ou Grid com outro campo) */}
<div style={{marginBottom: '15px'}}>
  <label style={labelStyle}>Telefone Contato</label>
  <input 
    style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
    value={formData.contato} 
    onChange={e => setFormData({...formData, contato: maskPhone(e.target.value)})} 
    placeholder="(00) 00000-0000"
  />
</div>

        {/* NOVOS CAMPOS: Tipo e Período */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div>
            <label style={labelStyle}>Tipo de Mudança</label>
            <select 
              style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
              value={formData.tipo || "Entrada"} 
              onChange={e => setFormData({...formData, tipo: e.target.value})}
            >
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Período</label>
            <select 
              style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
              value={formData.periodo || "Manhã"} 
              onChange={e => setFormData({...formData, periodo: e.target.value})}
            >
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <select 
            style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
            value={formData.status} 
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="Pendente">Pendente</option>
            <option value="Agendado">Agendado</option>
            <option value="Realizado">Realizado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        {/* NOVO CAMPO: Observações */}
<div>
  <label style={labelStyle}>Observações</label>
  <textarea 
    style={{
      ...selectStyle, 
      width:'100%', 
      backgroundColor: theme.bg, 
      color: theme.text, 
      borderColor: theme.border,
      minHeight: '80px',
      fontFamily: 'inherit',
      resize: 'vertical'
    }} 
    placeholder="Alguma observação importante sobre a mudança..."
    value={formData.obs || ""} 
    onChange={e => setFormData({...formData, obs: e.target.value})}
  />
</div>

        <button 
          style={{
            backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px', 
            borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '10px',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }} 
          onClick={handleSave}
          disabled={loadingGlobal}
        >
          {loadingGlobal ? <Loader2 className="animate-spin" size={18}/> : "Salvar Mudança"}
        </button>
      </div>
    </div>
  </div>
)}
      {/* MODAL VER MAIS - ATUALIZADO PARA MUDANÇAS */}
      {showViewModal && selectedFesta && (
        <div style={modalOverlay}>
          <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth:'450px', maxHeight: '90vh', overflowY: 'auto'}}>
            <div style={modalHeader}>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <Calendar color="#3b82f6"/> 
                <h3 style={{margin: 0}}>Detalhes da Mudança</h3>
              </div>
              <X onClick={() => setShowViewModal(false)} cursor="pointer"/>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              
              {/* Identificação da Unidade e Morador */}
              <div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}>
                <div style={{marginBottom: '8px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '4px'}}>
                  <strong style={{color: '#3b82f6'}}>
                    Unidade: {(() => {
                      const unit = unidades.find(u => u.id?.toString() === selectedFesta.id_unidade?.toString());
                      return unit ? `B${unit.bloco} - ${unit.unidade}` : selectedFesta.id_unidade;
                    })()}
                  </strong>
                </div>
                <strong>Responsável:</strong> {selectedFesta.morador} <br/>
                <strong>CPF:</strong> {selectedFesta.cpf || "N/D"} <br/>
                <strong>RG:</strong> {selectedFesta.rg || "N/D"} <br/>
                <strong>Contato:</strong> {selectedFesta.contato || "N/D"}
              </div>

              {/* Dados da Mudança (Horário Completo) */}
<div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}>
  <strong>Tipo / Sentido:</strong> {selectedFesta.tipo === 'Entrada' ? '⬆ Entrada' : '⬇ Saída'} <br/>
  
  {/* Horários sem o box de fundo */}
  <div style={{ marginTop: '10px' }}>
    <div style={{ marginBottom: '4px' }}>
      <strong style={{ fontSize: '13px' }}>Início:</strong> 
      <span style={{ color: theme.text, marginLeft: '5px' }}>
        {selectedFesta.data_mudanca || "-"}
      </span>
    </div>
    <div style={{ marginBottom: '4px' }}>
      <strong style={{ fontSize: '13px' }}>Fim:</strong> 
      <span style={{ color: theme.text, marginLeft: '5px' }}>
        {selectedFesta.data_fim || "Não informado"}
      </span>
    </div>
  </div>

  <div style={{ marginTop: '8px' }}>
    <strong>Período / Turno:</strong> {selectedFesta.periodo || "Não informado"}
  </div>
</div>

              {/* Status e Observações */}
<div style={{
  ...viewBox, 
  backgroundColor: theme.bg, 
  borderColor: theme.border,
  wordBreak: 'break-word', // Força a quebra de palavras muito longas
  overflowWrap: 'anywhere'  // Garante que o texto não escape do limite horizontal
}}>
  <span><strong>Status:</strong> {selectedFesta.status}</span>
  
  {selectedFesta.obs && (
    <div style={{
      marginTop: '8px', 
      paddingTop: '8px', 
      borderTop: `1px solid ${theme.border}`, 
      fontSize: '13px'
    }}>
      <strong>Observações:</strong>
      <div style={{ 
        marginTop: '4px', 
        whiteSpace: 'pre-wrap', // Preserva quebras de linha manuais
        color: theme.textSecondary,
        lineHeight: '1.4'
      }}>
        {selectedFesta.obs}
      </div>
    </div>
  )}
</div>

              <button 
                onClick={() => setShowViewModal(false)}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div> // FECHAMENTO DA DIV PRINCIPAL (PAGE CONTAINER)
  ); // FECHAMENTO DO RETURN
} // FECHAMENTO DA FUNCTION COMPONENTE