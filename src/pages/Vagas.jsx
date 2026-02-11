/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { 
  Car, Search, Plus, Edit2, Trash2, X, Loader2, 
  ChevronLeft, ChevronRight, Bike, MoreVertical, Eye, Key, Tag,
  FileText, Download, CheckSquare, Square, RotateCcw  // Importados para o estilo Moradores
} from "lucide-react";
import { useTheme } from "../App";

// Bibliotecas para exportação
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";
const TOKEN = "NOV0CR818";

export default function Vagas({ user }) {
  const { theme } = useTheme();
  
  const [vagas, setVagas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false); 
  const [showAddTagModal, setShowAddTagModal] = useState(false);

  // --- ESTADOS PARA EXPORTAÇÃO (ESTILO MORADORES) ---
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCols, setSelectedCols] = useState(["unidade", "veiculos", "placas", "tag"]);
  
  
  const exportOptions = [
    { id: "unidade", label: "Unidade / Bloco" },
    { id: "veiculos", label: "Tipos de Veículo" },
    { id: "placas", label: "Modelos e Placas" },
    { id: "tag", label: "Status da Tag" },
    { id: "obs", label: "Observações" }
  ];

  const [selectedVaga, setSelectedVaga] = useState(null);
  const [modalType, setModalType] = useState("add");
  const [showMenuId, setShowMenuId] = useState(null);
  const [showTagMenuId, setShowTagMenuId] = useState(null);
  const menuRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBloco, setFilterBloco] = useState("Todos");
  const [filterTagStatus, setFilterTagStatus] = useState("Todos");
  const [filterVeiculo, setFilterVeiculo] = useState("Todos"); 
  
  const [searchTermTags, setSearchTermTags] = useState("");
  const [filterStatusTags, setFilterStatusTags] = useState("Todos");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  const [formData, setFormData] = useState({
    id_unidade: "", possui_carro: "Não", placa_carro: "", modelo_carro: "", status_carro: "Ativo",
    possui_moto: "Não", placa_moto: "", modelo_moto: "", status_moto: "Ativo", observacoes: ""
  });

  const [tagFormData, setTagFormData] = useState({
    id: "", id_vagas: "", id_unidade: "", veiculo: "Carro", status: "Solicitado"
  });
  

  useEffect(() => {
    fetchData();
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenuId(null);
        setShowTagMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoadingInitial(true);
      const [resVagas, resUnidades, resTags] = await Promise.all([
        fetch(`${API_URL}?token=${TOKEN}&sheet=VAGAS`).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=UNIDADES`).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=TAGS`).then(r => r.json())
      ]);
      setVagas(Array.isArray(resVagas) ? resVagas : []);
      setUnidades(Array.isArray(resUnidades) ? resUnidades : []);
      setTags(Array.isArray(resTags) ? resTags : []);
    } catch (error) { console.error(error); }
    finally { setLoadingInitial(false); }
  };

  // --- FUNÇÕES DE EXPORTAÇÃO ---

  const exportToExcel = () => {
    const dataToExport = dadosFiltrados.map(v => {
      const unit = unidades.find(u => u.id?.toString() === v.id_unidade?.toString());
      const tag = tags.find(t => t.id_unidade?.toString() === v.id_unidade?.toString());
      return {
        Unidade: unit ? `B${unit.bloco} - ${unit.unidade}` : v.id_unidade,
        Carro: v.possui_carro === "Sim" ? `${v.modelo_carro} (${v.placa_carro})` : "Não possui",
        Moto: v.possui_moto === "Sim" ? `${v.modelo_moto} (${v.placa_moto})` : "Não possui",
        Tag: tag ? tag.status : "Sem Tag",
        Observacoes: v.observacoes || ""
      };
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vagas");
    XLSX.writeFile(wb, `Relatorio_Vagas_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF("l", "mm", "a4"); // "l" para paisagem, igual ao moradores
    const img = new Image();
    img.src = "/logo.png"; 

    // --- Sua lógica de colunas original ---
    const tableHeaders = [];
    const tableRows = [];
    const colMap = { unidade: "Unidade", veiculos: "Tipos", placas: "Veículo / Placas", tag: "Status Tag", obs: "Observações" };
    selectedCols.forEach(col => tableHeaders.push(colMap[col]));

    dadosFiltrados.forEach(v => {
      const row = [];
      const unit = unidades.find(u => u.id?.toString() === v.id_unidade?.toString());
      const tag = tags.find(t => t.id_unidade?.toString() === v.id_unidade?.toString());
      
      if (selectedCols.includes("unidade")) row.push(unit ? `B${unit.bloco} - ${unit.unidade}` : v.id_unidade);
      if (selectedCols.includes("veiculos")) {
        let types = [];
        if (v.possui_carro === "Sim") types.push("Carro");
        if (v.possui_moto === "Sim") types.push("Moto");
        row.push(types.join(" / ") || "Nenhum");
      }
      if (selectedCols.includes("placas")) {
        let details = [];
        if (v.possui_carro === "Sim") details.push(`${v.modelo_carro} (${v.placa_carro})`);
        if (v.possui_moto === "Sim") details.push(`${v.modelo_moto} (${v.placa_moto})`);
        row.push(details.join("\n"));
      }
      if (selectedCols.includes("tag")) row.push(tag ? tag.status : "Sem Tag");
      if (selectedCols.includes("obs")) row.push(v.observacoes || "-");
      tableRows.push(row);
    });

    // --- A lógica visual que você pediu ---
    const gerarPDF = (incluirLogo = false) => {
      // 1. Borda Verde (Visual Moradores)
      doc.setDrawColor(34, 197, 94); 
      doc.setLineWidth(1.5); 
      doc.rect(5, 5, 287, 200);

      // 2. Logo
      if (incluirLogo) doc.addImage(img, 'PNG', 113, 12, 70, 25);

      // 3. Título (Ajustado posição se tem logo ou não)
      doc.setFontSize(18); 
      doc.setTextColor(30, 41, 59);
      doc.text("Relatório de Ocupação de Vagas", 148, incluirLogo ? 45 : 25, { align: "center" });

      // 4. Tabela com cabeçalho Verde (fillColor)
      autoTable(doc, {
        head: [tableHeaders],
        body: tableRows,
        startY: incluirLogo ? 55 : 35,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], halign: 'center', textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 10, right: 10 }
      });

      doc.save(`Relatorio_Vagas_${new Date().toLocaleDateString()}.pdf`);
      setShowExportModal(false);
    };

    img.onload = () => gerarPDF(true); 
    img.onerror = () => gerarPDF(false);
  };

  const resetFilters = () => {
  setSearchTerm("");
  setFilterBloco("Todos");
  setFilterTagStatus("Todos");
  setFilterVeiculo("Todos");
  setCurrentPage(1);
};

const btnWhite = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  borderRadius: "6px",
  border: "1px solid",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500"
};


  // --- LÓGICA CRUD ---

  const handleSave = async () => {
    if (!formData.id_unidade) return alert("Selecione uma unidade");

    // Controle de duplicidade que fizemos antes
    if (modalType === "add") {
      const unidadeJaExiste = vagas.some(v => v.id_unidade?.toString() === formData.id_unidade.toString());
      if (unidadeJaExiste) {
        alert(`A Unidade ${formData.id_unidade} já possui um registro!`);
        return;
      }
    }

    setLoadingGlobal(true);
    const action = modalType === "add" ? "add" : "edit";
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ 
          token: TOKEN, 
          action, 
          sheet: "VAGAS", 
          id: (modalType === "add" ? Date.now().toString() : formData.id.toString()), 
          // AQUI ESTÁ O SEGREDO: Garante que envia o nome do usuário logado
          user: user?.nome || "Usuário Desconhecido", 
          ...formData 
        }),
      });
      setShowModal(false);
      fetchData();
    } catch (error) { 
      alert("Erro ao salvar"); 
    } finally { 
      setLoadingGlobal(false); 
    }
  };

  const handleSaveTag = async () => {
  if (!tagFormData.id_unidade) 
    return alert("Selecione a unidade");

  const isEdit = !!tagFormData.id;

  // 🔥 AQUI ESTÁ A CORREÇÃO
  const vagaRelacionada = vagas.find(v =>
    v.id_unidade?.toString() === tagFormData.id_unidade?.toString()
  );

  if (!vagaRelacionada) {
    alert("Nenhuma vaga encontrada para essa unidade.");
    return;
  }

  setLoadingGlobal(true);

  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        token: TOKEN,
        action: isEdit ? "edit" : "add",
        sheet: "TAGS",
        id: isEdit
          ? tagFormData.id.toString()
          : Date.now().toString(),

        // 🔥 AGORA VAI PREENCHER CERTO
        id_vagas: vagaRelacionada.id,
        id_unidade: tagFormData.id_unidade,
        veiculo: tagFormData.veiculo,
        status: tagFormData.status,

        user: user?.nome || "Usuário Desconhecido"
      })
    });

    setShowAddTagModal(false);
    fetchData();

  } catch (error) {
    alert("Erro ao processar TAG");
  } finally {
    setLoadingGlobal(false);
  }
};

  const executeDelete = async (id, sheetName) => {
    setLoadingGlobal(true);
    try {
      await fetch(API_URL, {
        method: "POST", mode: 'no-cors',
        body: JSON.stringify({ token: TOKEN, action: "delete", sheet: sheetName, id: id.toString() })
      });
      setTimeout(() => {
        fetchData();
        setLoadingGlobal(false);
        setShowMenuId(null);
        setShowTagMenuId(null);
      }, 1500);
    } catch (error) {
      console.error("Erro ao deletar:", error);
      setLoadingGlobal(false);
    }
  };

  const handleDelete = (id) => { if(confirm("Excluir esta vaga permanentemente?")) executeDelete(id, "VAGAS"); };
  const handleDeleteTag = (id) => { if(confirm("Excluir esta solicitação de TAG?")) executeDelete(id, "TAGS"); };

  const getTagStatusBadge = (unidadeNum) => {
    const tag = tags.find(t => t.id_unidade?.toString() === unidadeNum?.toString());
    if (!tag) return <span style={badgeRed}>Sem Tag</span>;
    const colors = {
        "Aplicado": badgeGreen,
        "Solicitado": { ...badgeRed, backgroundColor: '#f1f5f9', color: '#64748b' },
        "Disponivel": { ...badgeGreen, backgroundColor: '#eff6ff', color: '#3b82f6' }
    };
    return <span style={colors[tag.status] || badgeRed}>{tag.status}</span>;
  };

  const unidadesComVeiculo = unidades.filter(u => 
    vagas.some(v => v.id_unidade?.toString() === u.id?.toString()
 && (v.possui_carro === "Sim" || v.possui_moto === "Sim"))
  );

  const dadosFiltrados = vagas.filter(v => {
  const unit = unidades.find(u =>
    u.id?.toString() === v.id_unidade?.toString()
  );

  const tag = tags.find(t =>
    t.id_unidade?.toString() === v.id_unidade?.toString()
  );

  const labelUnidade = unit
    ? `B${unit.bloco} - ${unit.unidade}`
    : String(v.id_unidade || "");

  const matchesSearch =
    labelUnidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.placa_carro || "").toLowerCase().includes(searchTerm.toLowerCase());

  const matchesBloco =
    filterBloco === "Todos" ||
    unit?.bloco?.toString() === filterBloco;

  const currentTagStatus = tag ? tag.status : "Sem Tag";

  const matchesTag =
    filterTagStatus === "Todos" ||
    currentTagStatus === filterTagStatus;

  const matchesVeiculo =
    filterVeiculo === "Todos" ||
    (filterVeiculo === "Carro" && v.possui_carro === "Sim") ||
    (filterVeiculo === "Moto" && v.possui_moto === "Sim");

  return matchesSearch && matchesBloco && matchesTag && matchesVeiculo;
});


  const tagsFiltradas = tags.filter(t => {
      const unit = unidades.find(u => u.id?.toString() === t.id_unidade?.toString());
      const label = unit ? `B${unit.bloco} - ${unit.unidade}` : t.id_unidade;
      const matchesSearch = label.toLowerCase().includes(searchTermTags.toLowerCase());
      const matchesStatus = filterStatusTags === "Todos" || t.status === filterStatusTags;
      return matchesSearch && matchesStatus;
  });

  const totalPages = itemsPerPage === "Todos" ? 1 : Math.ceil(dadosFiltrados.length / itemsPerPage);
  const unidadesExibidas = itemsPerPage === "Todos" ? dadosFiltrados : dadosFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const blocosDisponiveis = ["Todos", ...new Set(unidades.map(u => u.bloco.toString()))].sort();

  return (
    <div style={pageContainer}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; display: inline-block; }
        .filter-pill { padding: 6px 12px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; cursor: pointer; font-size: 12px; font-weight: 500; color: ${theme.textSecondary}; transition: 0.2s; white-space: nowrap; }
        .filter-pill.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .action-menu { position: absolute; right: 30px; top: 10px; background: ${theme.mainBg}; border: 1px solid ${theme.border}; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 2000; width: 140px; padding: 5px; }
        .menu-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; border-radius: 6px; color: ${theme.text}; transition: 0.2s; }
        .menu-item:hover { background: ${theme.bg}; }
        .tag-table th { padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: ${theme.textSecondary}; border-bottom: 1px solid ${theme.border}; }
        .tag-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid ${theme.border}; position: relative; }
        .pagination-btn { background: none; border: 1px solid ${theme.border}; padding: 5px; border-radius: 6px; cursor: pointer; color: ${theme.text}; display: flex; align-items: center; justify-content: center; }
        .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .export-btn { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; color: ${theme.text}; font-size: 12px; cursor: pointer; transition: 0.2s; }
        .export-btn:hover { background: ${theme.bg}; }
      `}</style>

      {(loadingInitial || loadingGlobal) && (
        <div style={{...fullScreenLoaderOverlay, backgroundColor: 'rgba(15, 23, 42, 0.7)'}}>
          <Loader2 className="animate-spin" color="#3b82f6" size={50} />
        </div>
      )}

      <div style={headerStyle}>
        <div>
          <h1 style={{...titleStyle, color: theme.text}}>Gestão de Vagas</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: theme.textSecondary }}>Monitoramento de veículos e acessos.</p>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
            <button className="export-btn" onClick={exportToExcel}><Download size={16} color="#10b981" /> XLSX</button>
            <button className="export-btn" onClick={() => setShowExportModal(true)}><FileText size={16} color="#ef4444" /> PDF</button>
            <button
  style={{
    ...btnWhite,
    backgroundColor: theme.mainBg,
    borderColor: theme.border,
    color: theme.textSecondary
  }}
  onClick={() => {
    setSearchTerm("");
    setFilterBloco("Todos");
    setFilterTagStatus("Todos");
    setFilterVeiculo("Todos");
    setCurrentPage(1);
  }}
>
  <RotateCcw size={18} /> Redefinir
</button>
            <button style={{...btnNew, backgroundColor: '#8b5cf6'}} onClick={() => setShowTagsModal(true)}><Tag size={18} /> TAGs</button>
            

            <button style={btnNew} onClick={() => { setModalType("add"); setFormData({id_unidade: "", possui_carro: "Não", placa_carro: "", modelo_carro: "", status_carro: "Ativo", possui_moto: "Não", placa_moto: "", modelo_moto: "", status_moto: "Ativo", observacoes: ""}); setShowModal(true); }}><Plus size={18} /> Nova Vaga</button>
        </div>
      </div>

      <div style={{...filterCard, backgroundColor: theme.mainBg, borderColor: theme.border}}>
        <div style={{display:'flex', flexDirection:'column', gap: '15px'}}>
            <div style={filterRow}>
                <div style={filterGroup}>
                    <div style={{...searchContainer, backgroundColor: theme.bg, borderColor: theme.border}}>
                        <Search size={16} color={theme.textSecondary} />
                        <input type="text" placeholder="Unidade ou Placa..." style={{...searchInput, color: theme.text, width: '150px'}} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    {blocosDisponiveis.map(b => (<button key={b} className={`filter-pill ${filterBloco === b ? 'active' : ''}`} onClick={() => setFilterBloco(b)}>{b === "Todos" ? "Todos Blocos" : `B${b}`}</button>))}
                </div>
            </div>
            <div style={filterRow}>
                <div style={pillContainer}>
                    <span style={{...filterMiniLabel, color: theme.textSecondary}}>Tag:</span>
                    {["Todos", "Sem Tag", "Solicitado", "Disponivel", "Aplicado"].map(s => (
                        <button key={s} className={`filter-pill ${filterTagStatus === s ? 'active' : ''}`} onClick={() => setFilterTagStatus(s)}>{s}</button>
                    ))}
                </div>
                <div style={pillContainer}>
                    <span style={{...filterMiniLabel, color: theme.textSecondary}}>Veículo:</span>
                    {["Todos", "Carro", "Moto"].map(v => (
                        <button key={v} className={`filter-pill ${filterVeiculo === v ? 'active' : ''}`} onClick={() => setFilterVeiculo(v)}>{v}</button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div style={{...tableCard, backgroundColor: theme.mainBg, borderColor: theme.border}}>
        <table style={tableStyle}>
          <thead>
  <tr style={{...thRow, borderBottomColor: theme.border, backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc'}}>
    <th style={thStyle}>Unidade</th>
    <th style={thStyle}>Veículos</th>
    <th style={thStyle}>Veículo / Placas</th>
    <th style={thStyle}>Observações</th>
    <th style={thStyle}>Tag de Acesso</th>
    <th style={thStyle}>Status</th>
    <th style={{...thStyle, textAlign: 'right'}}>Ações</th>
  </tr>
</thead>
          <tbody>
  {unidadesExibidas.map((v) => {
    const unit = unidades.find(u => u.id?.toString() === v.id_unidade?.toString());
    return (
      <tr key={v.id} style={{ ...trStyle, borderBottom: `1px solid ${theme.border}` }}>
        {/* 1. UNIDADE */}
        <td style={{ ...tdStyle, color: theme.text }}>
          <strong>{unit ? `B${unit.bloco} - ${unit.unidade}` : v.id_unidade}</strong>
        </td>

        {/* 2. ÍCONES VEÍCULOS */}
        <td style={tdStyle}>
          <div style={{ display: "flex", gap: "12px" }}>
            {v.possui_carro === "Sim" && <Car size={20} color="#0ea5e9" />}
            {v.possui_moto === "Sim" && <Bike size={20} color="#f59e0b" />}
          </div>
        </td>

        {/* 3. MODELO / PLACA */}
        <td style={{ ...tdStyle, color: theme.textSecondary, fontSize: '12px' }}>
          {v.possui_carro === "Sim" && <div>{v.modelo_carro} | <strong>{v.placa_carro}</strong></div>}
          {v.possui_moto === "Sim" && <div>{v.modelo_moto} | <strong>{v.placa_moto}</strong></div>}
        </td>

        {/* 4. OBSERVAÇÕES */}
        <td style={{ ...tdStyle, color: theme.textSecondary, fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {v.observacoes || "-"}
        </td>

        {/* 5. COLUNA TAG DE ACESSO */}
        <td style={tdStyle}>{getTagStatusBadge(v.id_unidade)}</td>

        {/* 6. COLUNA STATUS (OS BADGES REDONDOS) */}
        <td style={tdStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {v.possui_carro === "Sim" && (
              <span style={v.status_carro === 'Ativo' ? badgeGreen : badgeRed}>
                Carro: {v.status_carro || 'Ativo'}
              </span>
            )}
            {v.possui_moto === "Sim" && (
              <span style={v.status_moto === 'Ativo' ? badgeGreen : badgeRed}>
                Moto: {v.status_moto || 'Ativo'}
              </span>
            )}
            {v.possui_carro !== "Sim" && v.possui_moto !== "Sim" && <span style={{ color: theme.textSecondary }}>-</span>}
          </div>
        </td>

        {/* 7. COLUNA AÇÕES (NO FINAL) */}
        <td style={{ ...tdStyle, textAlign: 'right', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <Eye size={18} color="#3b82f6" cursor="pointer" onClick={() => { setSelectedVaga(v); setShowViewModal(true); }} />
            <button onClick={() => setShowMenuId(showMenuId === v.id ? null : v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <MoreVertical size={20} color={theme.textSecondary} />
            </button>
          </div>

          {showMenuId === v.id && (
            <div ref={menuRef} className="action-menu">
              <div className="menu-item" onClick={() => { setModalType("edit"); setFormData(v); setShowModal(true); setShowMenuId(null); }}>
                <Edit2 size={14} /> Editar
              </div>
              <div className="menu-item" style={{ color: '#ef4444' }} onClick={() => { handleDelete(v.id); setShowMenuId(null); }}>
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
        <div style={{...paginationFooter, backgroundColor: theme.isDark ? '#1e293b' : '#fcfcfc', borderTopColor: theme.border}}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'13px', color: theme.text}}>
                Exibir: <select style={{...selectPageSize, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={itemsPerPage} onChange={(e) => {setItemsPerPage(e.target.value === "Todos" ? "Todos" : Number(e.target.value)); setCurrentPage(1);}}>
                    {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                    <option value="Todos">Todos</option>
                </select> de {dadosFiltrados.length} registros
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'15px', color: theme.text}}>
                <button className="pagination-btn" disabled={currentPage === 1} onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0,0); }}><ChevronLeft size={18} /></button>
                <span style={{fontSize:'13px', fontWeight:'600'}}>{currentPage} / {totalPages || 1}</span>
                <button className="pagination-btn" disabled={currentPage === totalPages || itemsPerPage === "Todos"} onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}><ChevronRight size={18} /></button>
            </div>
        </div>
      </div>

      {/* --- MODAL DE EXPORTAÇÃO ESTILO MORADORES --- */}
      {showExportModal && (
        <div style={modalOverlay}>
          <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '400px'}}>
            <div style={modalHeader}>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <FileText color="#ef4444" size={24} />
                <h3 style={{margin:0}}>Exportar PDF</h3>
              </div>
              <X size={20} cursor="pointer" onClick={() => setShowExportModal(false)} />
            </div>
            <p style={{fontSize:'13px', color: theme.textSecondary, marginBottom:'20px'}}>
              Selecione as colunas que deseja incluir no relatório PDF:
            </p>
            <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom:'25px'}}>
              {exportOptions.map(opt => (
                <div key={opt.id} onClick={() => toggleColumn(opt.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:'12px', padding:'12px', borderRadius:'10px', cursor:'pointer', border: '1px solid',
                    borderColor: selectedCols.includes(opt.id) ? '#3b82f6' : theme.border,
                    backgroundColor: selectedCols.includes(opt.id) ? (theme.isDark ? '#1e3a8a' : '#eff6ff') : 'transparent'
                  }}>
                  {selectedCols.includes(opt.id) ? <CheckSquare size={20} color="#3b82f6" /> : <Square size={20} color={theme.textSecondary} />}
                  <span style={{fontSize:'14px', fontWeight: selectedCols.includes(opt.id) ? '600' : '400'}}>{opt.label}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex', gap:'10px'}}>
              <button style={{...btnNew, flex:1, backgroundColor:'#ef4444'}} onClick={exportToPDF}>Gerar PDF</button>
              <button style={{...btnNew, flex:1, backgroundColor:'#94a3b8'}} onClick={() => setShowExportModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAGS */}
      {showTagsModal && (
        <div style={modalOverlay}>
            <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '950px', height: '85vh', display: 'flex', flexDirection: 'column'}}>
                <div style={modalHeader}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}><Key size={24} color="#8b5cf6"/> <h3 style={{margin:0}}>Controle de TAGs</h3></div>
                    <X size={20} cursor="pointer" onClick={() => setShowTagsModal(false)} />
                </div>
                <div style={{ marginBottom: '20px', display:'flex', flexDirection:'column', gap:'12px', padding:'15px', borderRadius:'12px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px'}}>
                        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                            <div style={{...searchContainer, backgroundColor: theme.mainBg, borderColor: theme.border, minWidth: '220px'}}>
                                <Search size={16} color={theme.textSecondary} />
                                <input type="text" placeholder="Buscar unidade..." style={{...searchInput, color: theme.text}} value={searchTermTags} onChange={(e) => setSearchTermTags(e.target.value)} />
                            </div>
                            <div style={pillContainer}>
                                <span style={{...filterMiniLabel, color: theme.textSecondary}}>Status:</span>
                                {["Todos", "Solicitado", "Disponivel", "Aplicado"].map(s => (
                                    <button key={s} className={`filter-pill ${filterStatusTags === s ? 'active' : ''}`} onClick={() => setFilterStatusTags(s)}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <button style={{...btnNew, height:'40px'}} onClick={() => { setTagFormData({id:"", id_vagas:"", id_unidade:"", veiculo: "Carro", status: "Solicitado"}); setShowAddTagModal(true); }}><Plus size={16}/> Nova TAG</button>
                    </div>
                </div>
                <div style={{flex: 1, overflowY: 'auto', border: `1px solid ${theme.border}`, borderRadius: '12px'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse'}} className="tag-table">
                        <thead><tr style={{backgroundColor: theme.bg, position:'sticky', top:0}}><th>Unidade</th><th>Veículo</th><th>Status</th><th>Solicitado em</th><th style={{textAlign:'right'}}>Ações</th></tr></thead>
                        <tbody>
                            {tagsFiltradas.length > 0 ? tagsFiltradas.map(t => {
                                const unit = unidades.find(u => u.id?.toString() === t.id_unidade?.toString());
                                return (
                                    <tr key={t.id}>
                                        <td><strong>{unit ? `B${unit.bloco}-${unit.unidade}` : t.id_unidade}</strong></td>
                                        <td>{t.veiculo}</td>
                                        <td>{getTagStatusBadge(t.id_unidade)}</td>
                                        <td>{t.solicitado_timestamp ? t.solicitado_timestamp.split('T')[0] : '-'}</td>
                                        <td style={{textAlign:'right'}}>
                                            <button onClick={() => setShowTagMenuId(showTagMenuId === t.id ? null : t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MoreVertical size={20} color={theme.textSecondary} /></button>
                                            {showTagMenuId === t.id && (
                                              <div ref={menuRef} className="action-menu" style={{right: '40px', top: '10px'}}>
                                                <div className="menu-item" onClick={() => { setTagFormData(t); setShowAddTagModal(true); setShowTagMenuId(null); }}><Edit2 size={14} /> Editar</div>
                                                <div className="menu-item" style={{color:'#ef4444'}} onClick={() => { handleDeleteTag(t.id); setShowTagMenuId(null); }}><Trash2 size={14} /> Excluir</div>
                                              </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            }) : (<tr><td colSpan="5" style={{padding: '40px', textAlign: 'center', color: theme.textSecondary}}>Nenhuma TAG encontrada.</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {showAddTagModal && (
          <div style={{...modalOverlay, zIndex: 3000}}>
              <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '400px'}}>
                <div style={modalHeader}><h3>{tagFormData.id ? "Editar TAG" : "Solicitar TAG"}</h3><X size={20} cursor="pointer" onClick={() => setShowAddTagModal(false)} /></div>
                <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <div>
                        <label style={labelStyle}>Unidade (Apenas com Veículo)</label>
                        <select style={{...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={tagFormData.id_unidade} onChange={e => setTagFormData({...tagFormData, id_unidade: e.target.value})}>
                            <option value="">Selecione...</option>
                            {unidadesComVeiculo.map(u => 
  <option key={u.id} value={u.id}>
    B{u.bloco} - Apto {u.unidade}
  </option>
)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Veículo</label>
                        <select style={{...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={tagFormData.veiculo} onChange={e => setTagFormData({...tagFormData, veiculo: e.target.value})}>
                            <option value="Carro">Carro</option><option value="Moto">Moto</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Status</label>
                        <select style={{...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={tagFormData.status} onChange={e => setTagFormData({...tagFormData, status: e.target.value})}>
                            <option value="Solicitado">Solicitado</option><option value="Disponivel">Disponivel</option><option value="Aplicado">Aplicado</option>
                        </select>
                    </div>
                    <button style={{...btnNew, marginTop: '10px'}} onClick={handleSaveTag}>Confirmar Registro</button>
                </div>
              </div>
          </div>
      )}

      {showModal && (
        <div style={modalOverlay}>
          <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '550px'}}>
            <div style={modalHeader}><h3 style={{margin:0}}>{modalType === "add" ? "Vincular Veículos" : "Editar Vaga"}</h3><X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} /></div>
            <div style={formGrid}>
              <div style={{gridColumn: 'span 2'}}>
                <label style={labelStyle}>Unidade Responsável</label>
                <select style={{...selectStyle, width: '100%', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.id_unidade} onChange={e => setFormData({...formData, id_unidade: e.target.value})}>
                  <option value="">Selecione...</option>
                  {unidades.map(u => 
  <option key={u.id} value={u.id}>
    B{u.bloco} - Apto {u.unidade}
  </option>
)}
                </select>
              </div>
              <div style={{...modalSection, borderColor: theme.border}}>
                <label style={{display:'flex', gap:'8px', fontSize:'13px', fontWeight:'700', marginBottom:'10px'}}><input type="checkbox" checked={formData.possui_carro === "Sim"} onChange={e => setFormData({...formData, possui_carro: e.target.checked ? "Sim" : "Não"})} /> CARRO</label>
                {formData.possui_carro === "Sim" && (
   <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
     <input placeholder="Modelo" style={{...selectStyle, fontSize:'12px'}} value={formData.modelo_carro} onChange={e => setFormData({...formData, modelo_carro: e.target.value})} />
     <input placeholder="Placa" style={{...selectStyle, fontSize:'12px'}} value={formData.placa_carro} onChange={e => setFormData({...formData, placa_carro: e.target.value.toUpperCase()})} />
     {/* CAMPO NOVO ABAIXO */}
     <select style={{...selectStyle, fontSize:'12px', height: '35px'}} value={formData.status_carro} onChange={e => setFormData({...formData, status_carro: e.target.value})}>
        <option value="Ativo">Ativo</option>
        <option value="Inativo">Inativo</option>
     </select>
   </div>
)}
              </div>
              <div style={{...modalSection, borderColor: theme.border}}>
                <label style={{display:'flex', gap:'8px', fontSize:'13px', fontWeight:'700', marginBottom:'10px'}}><input type="checkbox" checked={formData.possui_moto === "Sim"} onChange={e => setFormData({...formData, possui_moto: e.target.checked ? "Sim" : "Não"})} /> MOTO</label>
                {formData.possui_moto === "Sim" && (
   <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
     <input placeholder="Modelo" style={{...selectStyle, fontSize:'12px'}} value={formData.modelo_moto} onChange={e => setFormData({...formData, modelo_moto: e.target.value})} />
     <input placeholder="Placa" style={{...selectStyle, fontSize:'12px'}} value={formData.placa_moto} onChange={e => setFormData({...formData, placa_moto: e.target.value.toUpperCase()})} />
     {/* CAMPO NOVO ABAIXO */}
     <select style={{...selectStyle, fontSize:'12px', height: '35px'}} value={formData.status_moto} onChange={e => setFormData({...formData, status_moto: e.target.value})}>
        <option value="Ativo">Ativa</option>
        <option value="Inativo">Inativa</option>
     </select>
   </div>
)}
              </div>
              <div style={{gridColumn: 'span 2'}}><label style={labelStyle}>Observação</label><textarea style={{...selectStyle, width:'100%', height:'70px', backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>
            </div>
            <div style={modalFooter}><button style={btnNew} onClick={handleSave}>Salvar Registro</button></div>
          </div>
        </div>
      )}

      {showViewModal && selectedVaga && (
        <div style={modalOverlay}>
          <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth:'400px'}}>
            <div style={modalHeader}><h3>Informações do Veículo</h3><X onClick={() => setShowViewModal(false)} cursor="pointer"/></div>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
               <div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}><strong>Carro:</strong> {selectedVaga.modelo_carro || "N/A"} ({selectedVaga.placa_carro || "S/P"})</div>
               <div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}><strong>Moto:</strong> {selectedVaga.modelo_moto || "N/A"} ({selectedVaga.placa_moto || "S/P"})</div>
               <div style={{...viewBox, backgroundColor: theme.bg, borderColor: theme.border}}><strong>Observação:</strong> {selectedVaga.observacoes || "Nenhuma"}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ESTILOS
const pageContainer = { padding: "20px", maxWidth: "1200px", margin: "0 auto" };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const titleStyle = { fontSize: '24px', fontWeight: '700', margin: 0 };
const btnNew = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const filterCard = { padding: '15px 20px', borderRadius: '16px', border: '1px solid', marginBottom: '20px' };
const filterRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' };
const filterGroup = { display: 'flex', alignItems: 'center', gap: '10px' };
const searchContainer = { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '8px', border: '1px solid' };
const searchInput = { border: 'none', background: 'none', padding: '8px 0', outline: 'none', fontSize: '13px' };
const pillContainer = { display: 'flex', gap: '8px', alignItems: 'center' };
const filterMiniLabel = { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' };
const tableCard = { borderRadius: '16px', border: '1px solid', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600' };
const thRow = { borderBottom: '1px solid' };
const tdStyle = { padding: '16px 24px', fontSize: '14px' };
const trStyle = { transition: '0.2s' };
const badgeGreen = { backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', width: 'fit-content' };
const badgeRed = { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', width: 'fit-content' };
const paginationFooter = { padding: '15px 24px', borderTop: '1px solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const selectPageSize = { padding: '4px 8px', borderRadius: '6px', border: '1px solid' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { padding: '24px', borderRadius: '20px', width: '90%' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const formGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const modalSection = { border: '1px solid', padding: '12px', borderRadius: '12px' };
const labelStyle = { fontSize: '12px', fontWeight: '600', marginBottom: '5px', display: 'block', textTransform: 'uppercase' };
const selectStyle = { padding: '10px', borderRadius: '8px', border: '1px solid', outline: 'none', fontSize: '14px' };
const modalFooter = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' };
const viewBox = { padding: '12px', borderRadius: '12px', fontSize: '13px', border: '1px solid' };
const fullScreenLoaderOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };