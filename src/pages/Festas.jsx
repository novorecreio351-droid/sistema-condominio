/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, Search, Plus, Edit2, Trash2, X, Loader2, 
  ChevronLeft, ChevronRight, MoreVertical, Eye, DollarSign,
  FileText, Download, RotateCcw, CheckCircle2, AlertCircle, User, Paperclip, UploadCloud
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
  const [uploads, setUploads] = useState([]); // Guardar os uploads brutos
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFesta, setSelectedFesta] = useState(null);
  const [modalType, setModalType] = useState("add");
  const [showMenuId, setShowMenuId] = useState(null);
  const menuRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isMoradorCadastrado, setIsMoradorCadastrado] = useState(false);
  
  const [formData, setFormData] = useState({
    unidade_id: "", morador: "", contato: "", data_reserva: "",
    valor_taxa: "", pago: "Não", status: "Pendente", cpf: "", convidados: "",
    foto: "" 
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
  
const [sortConfig, setSortConfig] = useState([]); // Array para suportar múltiplos filtros [{key, direction}]
  // Funções de Máscara
const maskCPF = (v) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const verificarEAtualizarStatus = async (listaFestas) => {
  const agora = new Date();

  // Filtra apenas festas que precisam ser atualizadas
  const festasParaAtualizar = listaFestas.filter(f => {
    if (f.status !== "Agendado") return false;

    // Converte "DD/MM/YYYY HH:mm" para objeto Date
    const [datePart, timePart] = f.data_reserva.split(' ');
    const [day, month, year] = datePart.split('/');
    const dataFesta = new Date(`${year}-${month}-${day}T${timePart || '00:00'}`);

    return agora > dataFesta;
  });

  // Se houver festas para atualizar, envia para o backend
  for (const festa of festasParaAtualizar) {
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          token: TOKEN,
          action: "edit",
          sheet: "FESTAS",
          ...festa,
          status: "Realizado"
        }),
      });
      console.log(`Status da festa ${festa.id} atualizado para Realizado.`);
    } catch (err) {
      console.error("Erro ao atualizar status automático:", err);
    }
  }

  // Se houve atualizações, recarrega os dados (opcional, dependendo da sua necessidade de refresh)
  if (festasParaAtualizar.length > 0) {
    // Evite chamar fetchData() aqui para não criar loop infinito; 
    // em vez disso, atualize o estado local ou controle com uma flag.
  }
};

const maskPhone = (v) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
};



const fileInputRef = useRef(null); // Adicione isso logo abaixo dos outros useStates

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
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoadingInitial(true);
      const [resFestas, resUnidades, resMoradores, resUploads] = await Promise.all([
        fetch(`${API_URL}?token=${TOKEN}&sheet=FESTAS`).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=UNIDADES`).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=MORADORES`).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=UPLOADS_FESTAS`).then(r => r.json()),
      ]);

      const listaFestas = Array.isArray(resFestas) ? resFestas : [];
      const listaUploads = Array.isArray(resUploads) ? resUploads : [];
      
      setUploads(listaUploads);

      // Mapeia as festas vinculando a foto na carga inicial para facilitar a listagem
      const festasComUpload = listaFestas.map(f => {
        const fotoUrl = getFotoFestaInterno(f.id, listaUploads);
        return { ...f, foto: fotoUrl };
      });

      setFestas(festasComUpload);

      // ... dentro da função fetchData()
    verificarEAtualizarStatus(festasComUpload); // Adicione esta linha

      const sortedUnidades = Array.isArray(resUnidades) ? [...resUnidades].sort((a, b) => {
        if (a.bloco !== b.bloco) return String(a.bloco).localeCompare(String(b.bloco), undefined, {numeric: true});
        return String(a.unidade).localeCompare(String(b.unidade), undefined, {numeric: true});
      }) : [];

      setUnidades(sortedUnidades);
      setMoradores(Array.isArray(resMoradores) ? resMoradores : []);
    } catch (error) { console.error(error); }
    finally { setLoadingInitial(false); }
  };
  const gerarContratoPDF = (f) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // 1. LOGO
    try {
        doc.addImage('/logo.png', 'PNG', pageWidth / 2 - 30, 10, 60, 30);
    } catch (e) {
        console.error("Erro ao carregar logo");
    }

    // 2. TÍTULOS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CONTRATO DE LOCAÇÃO E TERMO DE RESPONSABILIDADE", pageWidth / 2, 75, { align: "center" });
    doc.setFontSize(12);
    doc.text("SALÃO DE FESTAS - CONDOMÍNIO NOVO RECREIO", pageWidth / 2, 83, { align: "center" });

    // 3. LÓGICA DA UNIDADE
    const uniStr = f.unidade_id.toString();
    const bloco = uniStr.charAt(0);
    const unidadeNum = uniStr.substring(1);
    const unidadeFormatada = `Bloco ${bloco} Unidade ${unidadeNum}`;

    // 4. TEXTO PRINCIPAL
    doc.setFontSize(11);
    let currentY = 105; 
    let currentX = margin;

    const escrever = (texto, negrito = false) => {
        doc.setFont("helvetica", negrito ? "bold" : "normal");
        if (currentX + doc.getTextWidth(texto) > pageWidth - margin) {
            currentY += 7;
            currentX = margin;
        }
        doc.text(texto, currentX, currentY);
        currentX += doc.getTextWidth(texto);
    };

    escrever("Eu, ");
    escrever(f.morador.toUpperCase(), true);
    escrever(" , residente no ");
    escrever(unidadeFormatada, true);
    escrever(", portador do CPF nº ");
    escrever(f.cpf || '________________', true);
    escrever(" e contato ");
    escrever(f.contato || '________________', true);
    escrever(" solicito a reserva do Salão de Festas para o dia: ");
    escrever(f.data_reserva.split(' ')[0], true);

    // 5. CLÁUSULAS E CONDIÇÕES
    currentY += 25;
    doc.setFont("helvetica", "bold");
    doc.text("CLÁUSULAS E CONDIÇÕES:", margin, currentY);
    
    currentY += 12;
    const clausulas = [
        { n: "1.", t: "NORMAS: Comprometo-me a respeitar integralmente as normas de conduta e o regimento interno." },
        { n: "2.", t: "MULTAS: O descumprimento de regras ou ruídos excessivos acarretará em multa imediata." },
        { n: "3.", t: "TAXA: Estou ciente do pagamento da taxa de locação no valor de R$ " + (f.valor_taxa || "50.00") + "." },
        { n: "4.", t: "DANOS: Assumo total responsabilidade por danos causados ao espaço ou mobiliário." }
    ];

    clausulas.forEach(item => {
        doc.setFont("helvetica", "bold");
        doc.text(item.n, margin, currentY);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(item.t, pageWidth - margin - 15);
        doc.text(lines, margin + 8, currentY);
        currentY += (lines.length * 6) + 6;
    });

    // --- DATA (AGORA LOGO ABAIXO DAS CLÁUSULAS, SEM IR PARA O FIM DA PÁGINA) ---
    currentY += 15;
    const dataAtual = new Date();
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const dataFormatada = `Rio de Janeiro, ${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}.`;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(dataFormatada, pageWidth / 2, currentY, { align: "center" });

    // --- ASSINATURAS (BEM EMBAIXO MESMO) ---
    const footerY = 270; // Quase no final da folha

    doc.setLineWidth(0.5);
    doc.line(margin, footerY, 90, footerY); 
    doc.line(120, footerY, pageWidth - margin, footerY);

    doc.setFont("helvetica", "bold");
    doc.text("NOVO RECREIO", 55, footerY + 5, { align: "center" });
    doc.text(f.morador.toUpperCase().substring(0, 30), 155, footerY + 5, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Administração", 55, footerY + 10, { align: "center" });
    doc.text("Morador Responsável", 155, footerY + 10, { align: "center" });

    doc.save(`Contrato_${f.unidade_id}_${f.morador}.pdf`);
};

const gerarContratoVazio = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // 1. LOGO
    try {
        doc.addImage('/logo.png', 'PNG', pageWidth / 2 - 30, 10, 60, 30);
    } catch (e) {
        console.error("Erro ao carregar logo");
    }

    // 2. TÍTULOS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CONTRATO DE LOCAÇÃO E TERMO DE RESPONSABILIDADE", pageWidth / 2, 75, { align: "center" });
    doc.setFontSize(12);
    doc.text("SALÃO DE FESTAS - CONDOMÍNIO NOVO RECREIO", pageWidth / 2, 83, { align: "center" });

    // 4. TEXTO PRINCIPAL (COM LACUNAS)
    doc.setFontSize(11);
    let currentY = 105; 
    let currentX = margin;

    const escrever = (texto, negrito = false) => {
        doc.setFont("helvetica", negrito ? "bold" : "normal");
        if (currentX + doc.getTextWidth(texto) > pageWidth - margin) {
            currentY += 7;
            currentX = margin;
        }
        doc.text(texto, currentX, currentY);
        currentX += doc.getTextWidth(texto);
    };

    escrever("Eu, ");
    escrever("________________________________________", true);
    escrever(" , residente no ");
    escrever("Bloco ____ Unidade ____", true);
    escrever(", portador do CPF nº ");
    escrever("____________________", true);
    escrever(" e contato ");
    escrever("____________________", true);
    escrever(" solicito a reserva do Salão de Festas para o dia: ");
    escrever("____/____/________", true);

    // 5. CLÁUSULAS E CONDIÇÕES
    currentY += 25;
    doc.setFont("helvetica", "bold");
    doc.text("CLÁUSULAS E CONDIÇÕES:", margin, currentY);
    
    currentY += 12;
    const clausulas = [
        { n: "1.", t: "NORMAS: Comprometo-me a respeitar integralmente as normas de conduta e o regimento interno." },
        { n: "2.", t: "MULTAS: O descumprimento de regras ou ruídos excessivos acarretará em multa imediata." },
        { n: "3.", t: "TAXA: Estou ciente do pagamento da taxa de locação no valor de R$ ________." },
        { n: "4.", t: "DANOS: Assumo total responsabilidade por danos causados ao espaço ou mobiliário." }
    ];

    clausulas.forEach(item => {
        doc.setFont("helvetica", "bold");
        doc.text(item.n, margin, currentY);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(item.t, pageWidth - margin - 15);
        doc.text(lines, margin + 8, currentY);
        currentY += (lines.length * 6) + 6;
    });

    // --- DATA ---
    currentY += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Rio de Janeiro, ____ de ________________ de 2026.", pageWidth / 2, currentY, { align: "center" });

    // --- ASSINATURAS ---
    const footerY = 270;
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, 90, footerY); 
    doc.line(120, footerY, pageWidth - margin, footerY);

    doc.setFont("helvetica", "bold");
    doc.text("NOVO RECREIO", 55, footerY + 5, { align: "center" });
    doc.text("ASSINATURA DO MORADOR", 155, footerY + 5, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Administração", 55, footerY + 10, { align: "center" });
    doc.text("Morador Responsável", 155, footerY + 10, { align: "center" });

    doc.save(`Modelo_Contrato_Vazio.pdf`);
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
  { id: 'data_reserva', label: 'Data', selected: true },
  { id: 'unidade_id', label: 'Unidade', selected: true },
  { id: 'morador', label: 'Morador', selected: true },
  { id: 'cpf', label: 'CPF', selected: true }, // Nova coluna adicionada
  { id: 'contato', label: 'Telefone', selected: true },
  { id: 'valor_taxa', label: 'Taxa', selected: true },
  { id: 'pago', label: 'Pago', selected: true },
  { id: 'status', label: 'Status', selected: true }
]);

const exportToExcel = () => {
  // 1. Filtra apenas as colunas que estão marcadas como 'selected: true' no modal
  const colsAtivas = selectedColumns.filter(c => c.selected);

  const dadosParaExportar = dadosFiltrados.map(f => {
    const linha = {};

    // 2. Monta o objeto dinamicamente baseado nas colunas selecionadas
    colsAtivas.forEach(col => {
      if (col.id === 'unidade_id') {
        const unit = unidades.find(u => u.id?.toString() === f.unidade_id?.toString());
        linha["Unidade"] = unit ? `B${unit.bloco} - ${unit.unidade}` : f.unidade_id;
      } 
      else if (col.id === 'cpf') {
        linha["CPF"] = maskCPFPrivacy(f.cpf);
      } 
      else if (col.id === 'morador') {
        linha["Responsável"] = f.morador;
      }
      else if (col.id === 'data_reserva') {
        linha["Data da Reserva"] = f.data_reserva?.replace('T', ' ');
      }
      else if (col.id === 'valor_taxa') {
        linha["Valor da Taxa"] = Number(f.valor_taxa || 0);
      }
      else {
        // Para as demais colunas (contato, pago, status, etc)
        // Usa o label que você definiu no estado selectedColumns
        linha[col.label] = f[col.id] || "";
      }
    });

    return linha;
  });

  // 3. Gera a planilha
  const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reservas");
  XLSX.writeFile(wb, "Relatorio_Festas.xlsx");
  
  setShowExportModal(false); // Fecha o modal após baixar
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
    // 1. Tratamento específico para VALOR
    if(c.id === 'valor_taxa') return formatCurrency(f[c.id]);

    // 2. Tratamento específico para CPF (Máscara de Privacidade)
    if(c.id === 'cpf') return maskCPFPrivacy(f[c.id]);

    // 3. Tratamento para UNIDADE (Para mostrar B1 - 101 em vez do ID)
    if(c.id === 'unidade_id') {
      const unit = unidades.find(u => u.id?.toString() === f.unidade_id?.toString());
      return unit ? `B${unit.bloco} - ${unit.unidade}` : f.unidade_id;
    }

    // 4. Tratamento para DATA
    if(c.id === 'data_reserva') return f[c.id]?.replace('T', ' ') || "";

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
  
  // Se for PDF, não usamos o link de "picture", retornamos o original ou o preview
  if (url.toLowerCase().includes(".pdf")) {
    const match = url.match(/[-\w]{25,}/);
    return match ? `https://drive.google.com/file/d/${match[0]}/view` : url;
  }

  const match = url.match(/[-\w]{25,}/);
  const fileId = match ? match[0] : null;

  if (fileId) {
    // Formato de miniatura para imagens
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`;
  }
  
  return url;
};

  // Atalho para usar a função com o state atual de uploads
  const getFotoFesta = (festaId) => getFotoFestaInterno(festaId, uploads);

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
        sheet: "UPLOADS_FESTAS", 
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
  // 1. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
  // Verifica se os campos essenciais estão preenchidos antes de qualquer processamento
  if (!formData.unidade_id) {
    alert("O campo UNIDADE é obrigatório.");
    return;
  }
  if (!formData.morador || formData.morador.trim() === "") {
    alert("O campo NOME DO RESPONSÁVEL é obrigatório.");
    return;
  }
  if (!formData.cpf || formData.cpf.trim() === "") {
    alert("O campo CPF é obrigatório.");
    return;
  }
  if (!formData.contato || formData.contato.trim() === "") {
    alert("O campo TELEFONE CONTATO é obrigatório.");
    return;
  }
  if (!formData.data_reserva) {
    alert("O campo DATA E HORA INÍCIO é obrigatório.");
    return;
  }
  if (!formData.valor_taxa || formData.valor_taxa.toString().trim() === "") {
    alert("O campo TAXA é obrigatório.");
    return;
  }

  // 2. LÓGICA DE VALIDAÇÃO DE CONFLITO (Existente no seu código)
  const dataNova = formData.data_reserva.split("T")[0]; 
  
  const conflito = festas.find(f => {
      const dataExistente = formatDateTimeForInput(f.data_reserva).split("T")[0];
      return dataExistente === dataNova && f.id !== formData.id && f.status !== "Cancelado";
  });

  if (conflito) {
      if (conflito.status === "Agendado") {
          alert(`BLOQUEADO: Já existe um agendamento CONFIRMADO para o dia ${conflito.data_reserva.split(" ")[0]}.`);
          return; 
      }

      if (conflito.status === "Pendente") {
          const confirmar = window.confirm(`AVISO: Já existe uma reserva PENDENTE para este dia. Deseja cadastrar mesmo assim?`);
          if (!confirmar) return; 
      }
  }

  // 3. PROCESSO DE ENVIO
  setLoadingGlobal(true); // ATIVA O LOADING
  
  const payload = { 
    token: TOKEN, 
    action: modalType === "add" ? "add" : "edit", 
    sheet: "FESTAS", 
    uploadSheet: "UPLOADS_FESTAS",
    id: modalType === "add" ? Date.now().toString() : formData.id.toString(),
    ...formData,
    fotosNovas: formData.fotosNovas || [] 
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    }); 
    
    const result = await response.json();
    
    if(result.success) {
      setFormData(prev => ({...prev, fotosNovas: []}));
      setShowModal(false);
      // Aguarda o fetchData terminar para garantir que a lista esteja atualizada
      await fetchData(); 
    } else {
      alert("Erro: " + result.message);
    }
  } catch (error) { 
    console.error(error);
    alert("Erro ao salvar os dados."); 
  } finally { 
    // Desliga o loader sempre, independente de sucesso ou erro
    setLoadingGlobal(false); 
  }
};

  const handleDelete = async (id) => {
    if (confirm("Excluir esta reserva e TODOS os seus anexos permanentemente?")) {
      setLoadingGlobal(true);

      try {
        // 1. Identifica quais anexos no estado 'uploads' pertencem a esta festa
        const anexosParaDeletar = uploads.filter(up => {
          const idVinculo = up.id_festa || up.ID_FESTA;
          return idVinculo?.toString() === id?.toString();
        });

        // 2. Cria as promessas de exclusão para os arquivos (planilha UPLOADS_FESTAS)
        const promessasAnexos = anexosParaDeletar.map(anexo =>
          fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
              token: TOKEN,
              action: "delete",
              sheet: "UPLOADS_FESTAS",
              id: (anexo.id || anexo.ID).toString()
            })
          })
        );

        // 3. Cria a promessa de exclusão da reserva (planilha FESTAS)
        const promessaFesta = fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({
            token: TOKEN,
            action: "delete",
            sheet: "FESTAS",
            id: id.toString()
          })
        });

        // 4. Executa todas as exclusões (arquivos + reserva)
        await Promise.all([...promessasAnexos, promessaFesta]);

        // 5. Sucesso: Atualiza os dados e fecha o menu
        setTimeout(() => {
          fetchData();
          setLoadingGlobal(false);
          if (typeof setShowMenuId === "function") setShowMenuId(null);
        }, 1000);

      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir a reserva e seus anexos.");
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
            cpf: moradorObj.cpf || ""
        });
    }
  };

  const toggleMoradorCadastrado = (checked) => {
    setIsMoradorCadastrado(checked);
    setFormData({ ...formData, morador: "", contato: "", cpf: "" });
  };

  const formatCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const dadosFiltrados = React.useMemo(() => {
  // --- MANTÉM SEUS FILTROS ORIGINAIS ---
  let resultado = festas.filter(f => {
    const matchesSearch = 
        f.morador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.unidade_id?.toString().includes(searchTerm);
    
    const matchesStatus = filterStatus === "Todos" || f.status === filterStatus;
    const matchesPago = filterPago === "Todos" || f.pago === filterPago;

    let matchesData = true;
    if (filterPeriodo.inicio || filterPeriodo.fim) {
        const [d, m, y] = f.data_reserva.split(" ")[0].split("/");
        const dataFesta = new Date(y, m - 1, d);
        
        if (filterPeriodo.inicio) {
            const dataInic = new Date(filterPeriodo.inicio + "T00:00:00");
            if (dataFesta < dataInic) matchesData = false;
        }
        if (filterPeriodo.fim) {
            const dataFim = new Date(filterPeriodo.fim + "T23:59:59");
            if (dataFesta > dataFim) matchesData = false;
        }
    }
    return matchesSearch && matchesStatus && matchesPago && matchesData;
  });

  // --- APLICA A NOVA ORDENAÇÃO ---
  if (sortConfig.length > 0) {
    resultado.sort((a, b) => {
      for (const { key, direction } of sortConfig) {
        let valA = a[key];
        let valB = b[key];

        if (key === 'data_reserva') {
          const parseDate = (s) => {
            if (!s) return 0;
            const [d, m, yT] = s.split('/');
            const [year, time] = yT.split(' ');
            return new Date(`${year}-${m}-${d}T${time}`).getTime();
          };
          valA = parseDate(valA);
          valB = parseDate(valB);
        } else if (key === 'valor_taxa' || key === 'unidade_id') {
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
}, [festas, searchTerm, filterStatus, filterPago, filterPeriodo, sortConfig]);

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
    <h1 style={{...titleStyle, color: theme.text}}>Reservas de Salão</h1>
    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: theme.textSecondary }}>Gestão de eventos do condomínio.</p>
  </div>

  {/* Todos os botões em um único container flex */}
  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>

    <button 
    style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} 
    onClick={gerarContratoVazio}
  >
    <FileText size={18} color="#3b82f6" /> Contrato
  </button>
  
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
    setFilterPago("Todos");
    setFilterPeriodo({ inicio: "", fim: "" }); // Reseta o objeto de datas
    setCurrentPage(1); // Opcional: volta para a primeira página
  }}
>
  <RotateCcw size={18} /> Redefinir
</button>

    <button style={{...btnNew, backgroundColor: '#10b981', flex: isMobile ? '1 1 100%' : 'none', justifyContent: 'center'}} onClick={() => { 
      setModalType("add"); 
      setIsMoradorCadastrado(false); 
      setFormData({unidade_id: "", morador: "", contato: "", data_reserva: "", valor_taxa: "", pago: "Não", status: "Pendente", cpf: "", convidados: "", foto: ""}); 
      setShowModal(true); 
    }}>
      <Plus size={18} /> Nova Reserva
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
                {["Todos", "Pendente", "Agendado", "Realizado", "Cancelado"].map(s => (
                    <button key={s} className={`filter-pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s}</button>
                ))}
            </div>
        </div>

        {/* LINHA 2: PAGO E PERÍODO */}
        <div style={{display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: 'center', borderTop: `1px solid ${theme.border}`, paddingTop: '15px'}}>
            
            {/* Filtro Pago (Estilo Pill) */}
            <div style={{display:'flex', gap:'8px'}}>
                {["Todos", "Sim", "Não"].map(p => (
                    <button 
                        key={p} 
                        className={`filter-pill ${filterPago === p ? 'active' : ''}`} 
                        onClick={() => setFilterPago(p)}
                    >
                        {p === "Todos" ? "Pagamento: Todos" : p === "Sim" ? "Pago" : "Não Pago"}
                    </button>
                ))}
            </div>

            {/* Filtro Período (Estilo Search Container) */}
<div style={{
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    flex: 1, 
    justifyContent: isMobile ? 'center' : 'flex-end',
    flexWrap: 'wrap' // 1. ESSENCIAL: Permite que os campos pulem de linha se não couberem
}}>
    <div style={{
        ...searchContainer, 
        backgroundColor: theme.bg, 
        borderColor: theme.border, 
        padding: '5px 10px', 
        minWidth: isMobile ? '100%' : '150px', // 2. Ocupa tudo no mobile
        flex: isMobile ? 1 : 'none'
    }}>
        <Calendar size={14} color={theme.textSecondary} />
        <input 
            type="date" 
            style={{
                background:'none', 
                border:'none', 
                color: theme.text, 
                fontSize:'12px', 
                outline:'none',
                width: '100%' // Garante que o input use o espaço do container
            }} 
            value={filterPeriodo.inicio} 
            onChange={e => setFilterPeriodo({...filterPeriodo, inicio: e.target.value})}
        />
    </div>

    <span style={{color: theme.textSecondary, fontSize: '12px', display: isMobile ? 'none' : 'block'}}>até</span>
    {/* No mobile, o "até" pode atrapalhar o layout, se quiser manter use display: block */}

    <div style={{
        ...searchContainer, 
        backgroundColor: theme.bg, 
        borderColor: theme.border, 
        padding: '5px 10px', 
        minWidth: isMobile ? '100%' : '150px', // 3. Ocupa tudo no mobile
        flex: isMobile ? 1 : 'none'
    }}>
        <Calendar size={14} color={theme.textSecondary} />
        <input 
            type="date" 
            style={{
                background:'none', 
                border:'none', 
                color: theme.text, 
                fontSize:'12px', 
                outline:'none',
                width: '100%'
            }} 
            value={filterPeriodo.fim} 
            onChange={e => setFilterPeriodo({...filterPeriodo, fim: e.target.value})}
        />
    </div>

    {(filterPeriodo.inicio || filterPeriodo.fim) && (
        <RotateCcw 
            size={16} 
            cursor="pointer" 
            color={theme.textSecondary} 
            onClick={() => setFilterPeriodo({inicio: "", fim: ""})} 
            style={{ marginLeft: isMobile ? 'auto' : '0' }}
        />
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
      { label: "Unidade", key: "unidade_id" },
      { label: "Morador", key: "morador" },
      { label: "Data/Hora", key: "data_reserva" },
      { label: "Valor", key: "valor_taxa" },
      { label: "Pago", key: "pago" },
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
                        const unit = unidades.find(u => u.id?.toString() === f.unidade_id?.toString());
                        return (
                            <tr key={f.id} style={{ ...trStyle, borderBottom: `1px solid ${theme.border}` }}>
                                <td style={{ ...tdStyle, color: theme.text }}><strong>{unit ? `B${unit.bloco} - ${unit.unidade}` : f.unidade_id}</strong></td>
                                <td style={{ ...tdStyle, color: theme.text }}>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={{ fontWeight: '600' }}>{f.morador}</span>
    {f.cpf && (
      <span style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>
        {f.cpf}
      </span>
    )}
  </div>
</td>
                                <td style={{ ...tdStyle, color: theme.text }}>{f.data_reserva?.replace('T', ' ')}</td>
                                <td style={{ ...tdStyle, color: theme.text }}>{formatCurrency(f.valor_taxa)}</td>
                                <td style={tdStyle}>
                                    <span style={f.pago === "Sim" ? badgeGreen : badgeRed}>
                                        {f.pago === "Sim" ? "Sim" : "Não"}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        ...badgeGreen, 
                                        backgroundColor: f.status === 'Cancelado' ? '#fee2e2' : f.status === 'Realizado' ? '#dcfce7' : f.status === 'Pendente' ? '#fef9c3' : '#e0e7ff',
                                        color: f.status === 'Cancelado' ? '#b91c1c' : f.status === 'Realizado' ? '#15803d' : f.status === 'Pendente' ? '#a16207' : '#4338ca'
                                    }}>
                                        {f.status}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right', position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                        <Eye size={18} color="#3b82f6" cursor="pointer" onClick={() => { setSelectedFesta(f); setShowViewModal(true); }} />
                                        <button onClick={() => setShowMenuId(showMenuId === f.id ? null : f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <MoreVertical size={20} color={theme.textSecondary} />
                                        </button>
                                    </div>
                                    {showMenuId === f.id && (
    <div ref={menuRef} className="action-menu" style={{ right: '10px', top: '40px' }}>
        {/* BOTÃO GERAR CONTRATO */}
        <div className="menu-item" onClick={() => { 
            gerarContratoPDF(f); 
            setShowMenuId(null); 
        }}>
            <FileText size={14} color="#3b82f6" /> Gerar Contrato
        </div>

        <div style={{ height: '1px', backgroundColor: theme.border, margin: '4px 0' }} />

        <div className="menu-item" onClick={() => { 
            setModalType("edit"); 
            
            // Formatando a data antes de enviar para o formulário
            setFormData({
                ...f, 
                foto: getFotoFesta(f.id),
                data_reserva: formatDateTimeForInput(f.data_reserva) 
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
    <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '500px'}}>
      <div style={modalHeader}>
        <h3>{modalType === "add" ? "Nova Reserva" : "Editar Reserva"}</h3>
        <X size={20} cursor="pointer" onClick={() => setShowModal(false)} />
      </div>
      
      <div style={{display:'flex', flexDirection:'column', gap:'15px', maxHeight: '70vh', overflowY: 'auto', padding: '5px'}}>
        {/* Campo Unidade */}
        <div>
          <label style={labelStyle}>Unidade</label>
          <select style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
                  value={formData.unidade_id} 
                  onChange={e => setFormData({...formData, unidade_id: e.target.value})}>
            <option value="">Selecione a Unidade...</option>
            {unidades.map(u => <option key={u.id} value={u.id}>B{u.bloco} - {u.unidade}</option>)}
          </select>
        </div>

        {/* Checkbox Morador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '8px', backgroundColor: theme.bg }}>
          <input type="checkbox" id="checkMorador" checked={isMoradorCadastrado} onChange={e => toggleMoradorCadastrado(e.target.checked)} />
          <label htmlFor="checkMorador" style={{ fontSize: '13px', cursor: 'pointer' }}>Morador Cadastrado?</label>
        </div>

        {isMoradorCadastrado && (
          <div>
            <label style={labelStyle}>Selecionar Morador</label>
            <select style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
                    onChange={e => handleMoradorSelect(e.target.value)}>
              <option value="">Escolha...</option>
              {moradores.filter(m => m.id_unidade?.toString() === formData.unidade_id?.toString())
                        .map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
        )}

        {/* Nome e CPF */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div>
            <label style={labelStyle}>Nome do Responsável</label>
            <input 
              style={{...selectStyle, width:'100%', backgroundColor: isMoradorCadastrado ? theme.mainBg : theme.bg, color: theme.text, borderColor: theme.border, opacity: isMoradorCadastrado ? 0.7 : 1}} 
              value={formData.morador} 
              readOnly={isMoradorCadastrado}
              onChange={e => setFormData({...formData, morador: e.target.value})} 
            />
          </div>
          <div>
            <label style={labelStyle}>CPF</label>
            <input 
              style={{...selectStyle, width:'100%', backgroundColor: isMoradorCadastrado ? theme.mainBg : theme.bg, color: theme.text, borderColor: theme.border, opacity: isMoradorCadastrado ? 0.7 : 1}} 
              value={formData.cpf} 
              readOnly={isMoradorCadastrado}
              /* APLICANDO MÁSCARA CPF */
              onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} 
            />
          </div>
        </div>

        {/* Data e Telefone */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div>
            <label style={labelStyle}>Data e Hora (Início)</label>
            <input type="datetime-local" style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.data_reserva} onChange={e => setFormData({...formData, data_reserva: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Telefone Contato</label>
            <input 
              style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} 
              value={formData.contato} 
              /* APLICANDO MÁSCARA TELEFONE */
              onChange={e => setFormData({...formData, contato: maskPhone(e.target.value)})} 
            />
          </div>
        </div>

        {/* Taxa e Convidados */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div>
            <label style={labelStyle}>Taxa (R$)</label>
            <input type="number" style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.valor_taxa} onChange={e => setFormData({...formData, valor_taxa: e.target.value})} />
          </div>
          <div>
            <label style={labelStyle}>Convidados (Qtd)</label>
            <input type="number" style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.convidados} onChange={e => setFormData({...formData, convidados: e.target.value})} />
          </div>
        </div>

        {/* Pago e Status */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div>
            <label style={labelStyle}>Pago?</label>
            <select style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.pago} onChange={e => setFormData({...formData, pago: e.target.value})}>
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={{...selectStyle, width:'100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Pendente">Pendente</option>
              <option value="Agendado">Agendado</option>
              <option value="Realizado">Realizado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        {/* SEÇÃO DE ANEXOS / IMAGENS */}
        <div style={{ marginTop: '10px' }}>
          <label style={labelStyle}>Arquivos / Comprovantes</label>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '10px', marginBottom: '10px' }}>
            
            {/* Fotos Salvas */}
            {uploads
              .filter(up => (up.id_festa || up.ID_FESTA)?.toString() === formData.id?.toString())
              .map((f, idx) => (
                <div key={`saved-${idx}`} style={{ position: 'relative' }}>
                  <img 
                    src={converterUrlDrive(f.url_drive || f.url)} 
                    style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px', border: `1px solid ${theme.border}` }}
                    alt="Comprovante"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/90?text=Erro"; }}
                  />
                  <button 
                    onClick={() => handleDeleteImage(f.id || f.ID)}
                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                  >
                    <X size={12} />
                  </button>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', fontSize: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', textAlign: 'center', borderRadius: '0 0 10px 10px' }}>Salvo</div>
                </div>
              ))}

            {/* Fotos Novas (Preview antes de salvar) */}
            {formData.fotosNovas?.map((base64, idx) => (
              <div key={`new-${idx}`} style={{ position: 'relative' }}>
                <img 
                  src={base64} 
                  style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #3b82f6' }} 
                />
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, fotosNovas: prev.fotosNovas.filter((_, i) => i !== idx) }))}
                  style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ border: `2px dashed ${theme.border}`, padding: '15px', borderRadius: '12px', textAlign: 'center', backgroundColor: theme.bg }}>
            <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
  <UploadCloud size={24} color={theme.textSecondary} />
  <span style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>
    Adicionar arquivos
  </span>
    <input
    type="file"
    multiple
    accept="image/*,application/pdf"
    onChange={handleFileChange}
    style={{ display: 'none' }}
    id="file-upload"  /* O id deve ser exatamente igual ao htmlFor do label */
  />
</label>
          </div>
        </div>

        <button 
          style={{
            backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px', 
            borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '10px'
          }} 
          onClick={handleSave}
        >
          {loadingGlobal ? <Loader2 className="animate-spin" size={18}/> : "Salvar Mudanças"}
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
                <h3 style={{margin: 0}}>Resumo da Reserva</h3>
              </div>
              <X onClick={() => setShowViewModal(false)} cursor="pointer"/>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              {/* Dados do Responsável */}
              <div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}>
                <strong>Responsável:</strong> {selectedFesta.morador} <br/>
                <strong>CPF:</strong> {selectedFesta.cpf || "N/D"} <br/>
                <strong>Contato:</strong> {selectedFesta.contato || "N/D"}
              </div>

              {/* Dados do Evento */}
              <div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}>
                <strong>Data/Hora:</strong> {selectedFesta.data_reserva?.replace('T', ' ')} <br/>
                <strong>Valor Taxa:</strong> {formatCurrency(selectedFesta.valor_taxa)} <br/>
                <strong>Convidados:</strong> {selectedFesta.convidados || "Não informado"}
              </div>

              {/* Pagamento e Status */}
              <div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border, display: 'flex', justifyContent: 'space-between'}}>
                <span><strong>Pago:</strong> {selectedFesta.pago}</span>
                <span><strong>Status:</strong> {selectedFesta.status}</span>
              </div>

              {/* SEÇÃO DE ANEXOS / COMPROVANTES */}
              <div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}>
                <p style={{fontSize:'11px', fontWeight:'700', marginBottom:'10px', textTransform: 'uppercase'}}>
                  Anexos / Comprovantes:
                </p>

                {uploads.filter(up => (up.id_festa || up.ID_FESTA)?.toString() === selectedFesta.id?.toString()).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                    {uploads
                      .filter(up => (up.id_festa || up.ID_FESTA)?.toString() === selectedFesta.id?.toString())
                      .map((file, idx) => {
  const urlOriginal = file.url_drive || file.url || "";
  
  // 1. Extrai o ID do Google Drive corretamente (Regex robusta)
  const match = urlOriginal.match(/[-\w]{25,}/);
  const fileId = match ? match[0] : null;

  // 2. MONTAGEM DA URL (O SEGREDO ESTÁ AQUI)
  // Usamos drive.google.com/thumbnail que é o endpoint de miniatura rápida
  // O sz=w400 garante uma boa resolução
  const previewUrl = fileId 
    ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w400` 
    : null;

  return (
    <div key={idx} style={{ textAlign: 'center' }}>
      <div 
        onClick={() => window.open(urlOriginal, '_blank')}
        style={{
          width: '100%', 
          height: '100px', 
          borderRadius: '8px', 
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.bgSecondary || '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* ÍCONE DE FUNDO: Aparece se for PDF ou enquanto a imagem carrega */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          color: theme.textSecondary 
        }}>
          <FileText size={24} />
          <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>
            VER ARQUIVO
          </span>
        </div>

        {/* IMAGEM: Fica por cima do ícone quando carregar */}
        {previewUrl && (
          <img 
            src={previewUrl} 
            alt="Anexo"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }} 
            onError={(e) => {
              // Se o Google não gerar miniatura (ex: PDF pesado), a imagem some e sobra o ícone
              e.target.style.display = 'none';
            }}
          />
        )}
      </div>
    </div>
  );
})
                    }
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px', opacity: 0.6 }}>
                    <Paperclip size={18} style={{marginBottom: '5px'}} />
                    <p style={{fontSize: '11px', margin: 0}}>Nenhum comprovante anexado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}