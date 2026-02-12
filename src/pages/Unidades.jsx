/* eslint-disable no-unused-vars */
import { useTheme } from "../App";
import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Plus, MoreVertical, Edit2, Trash2, X, Loader2, RotateCcw, 
  ChevronUp, ChevronDown, FileText, Download, ChevronLeft, ChevronRight,
  CheckSquare, Square
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const TOKEN = "NOV0CR818"; 
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";

export default function Unidades() {
  const { theme } = useTheme();
  
  // Estados de Usuário e Dados
  const [currentUser, setCurrentUser] = useState({ nome: "Sistema" });
  const [unidades, setUnidades] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  
  // Estados de Modais
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [showMenuId, setShowMenuId] = useState(null);

  // Estados de Filtro e Paginação
  const [searchUnidade, setSearchUnidade] = useState("");
  const [filterBloco, setFilterBloco] = useState("Todos");
  const [filterOcupado, setFilterOcupado] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [sortConfig, setSortConfig] = useState({ key: 'bloco', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  // Configuração de Colunas para Exportação (Estilo Moradores)
  const [exportColumns, setExportColumns] = useState([
    { id: 'bloco', label: 'Bloco', selected: true },
    { id: 'unidade', label: 'Unidade', selected: true },
    { id: 'ocupado', label: 'Ocupado', selected: true },
    { id: 'status', label: 'Status', selected: true },
    { id: 'valor', label: 'Dívida', selected: true }
  ]);

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

React.useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  const [formData, setFormData] = useState({ id: "", bloco: "", unidade: "", ocupado: "Não", status: "Adimplente", valor: "" });
  
  const menuRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        if (parsedUser && parsedUser.nome) setCurrentUser(parsedUser);
      } catch (e) { console.error("Erro ao processar usuário", e); }
    }
    fetchUnidades();
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnidades = async () => {
    try {
      setLoadingInitial(true);
      const res = await fetch(`${SHEETS_URL}?sheet=UNIDADES&token=${TOKEN}`);
      const data = await res.json();
      setUnidades(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Erro ao buscar unidades:", err); } 
    finally { setLoadingInitial(false); }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const handleToggleColumn = (id) => {
    setExportColumns(prev => prev.map(col => col.id === id ? { ...col, selected: !col.selected } : col));
  };

  const dadosFiltradosEOrdenados = React.useMemo(() => {
    let filtered = unidades.filter(u => {
      const matchUnidade = u.unidade.toString().includes(searchUnidade);
      const matchBloco = filterBloco === "Todos" || u.bloco.toString() === filterBloco;
      const matchOcupado = filterOcupado === "Todos" || u.ocupado === filterOcupado;
      const matchStatus = filterStatus === "Todos" || u.status === filterStatus;
      return matchUnidade && matchBloco && matchOcupado && matchStatus;
    });
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (!isNaN(aVal) && !isNaN(bVal)) { aVal = Number(aVal); bVal = Number(bVal); }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [unidades, searchUnidade, filterBloco, filterOcupado, filterStatus, sortConfig]);

  const totalItems = dadosFiltradosEOrdenados.length;
  const totalPages = itemsPerPage === "Todos" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * (itemsPerPage === "Todos" ? totalItems : itemsPerPage);
  const indexOfFirstItem = itemsPerPage === "Todos" ? 0 : indexOfLastItem - itemsPerPage;
  const unidadesExibidas = itemsPerPage === "Todos" ? dadosFiltradosEOrdenados : dadosFiltradosEOrdenados.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => { setCurrentPage(1); }, [searchUnidade, filterBloco, filterOcupado, filterStatus, itemsPerPage]);

  const handleSave = async () => {
    if (!formData.bloco || !formData.unidade) return alert("Preencha Bloco e Unidade");
    const valorLimpo = String(formData.valor).replace(/\./g, '').replace(',', '.');
    const payload = { 
      token: TOKEN, action: modalType, user: currentUser.nome,
      id: modalType === "add" ? `${formData.bloco}${formData.unidade}` : formData.id, 
      bloco: formData.bloco, unidade: formData.unidade, ocupado: formData.ocupado,
      status: formData.status, valor: formData.status === "Inadimplente" ? (parseFloat(valorLimpo) || 0) : 0 
    };

    setLoadingGlobal(true);
    try {
      await fetch(SHEETS_URL, { method: "POST", body: JSON.stringify(payload), redirect: "follow" });
      await fetchUnidades();
      setShowModal(false);
    } catch (err) { alert("Erro ao salvar dados."); } finally { setLoadingGlobal(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta unidade?")) return;
    setLoadingGlobal(true);
    try {
      await fetch(SHEETS_URL, { 
        method: "POST", 
        body: JSON.stringify({ token: TOKEN, action: "delete", id: id, user: currentUser.nome }),
        redirect: "follow"
      });
      await fetchUnidades();
    } catch (err) { alert("Erro ao excluir"); } finally { setLoadingGlobal(false); }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const img = new Image(); 
    img.src = "/logo.png";

    const gerarPDF = (incluirLogo = false) => {
      const colunasAtivas = exportColumns.filter(col => col.selected);
      const headers = [colunasAtivas.map(col => col.label)];
      const body = dadosFiltradosEOrdenados.map(u => 
        colunasAtivas.map(col => col.id === 'valor' ? formatarMoeda(u.valor) : u[col.id])
      );

      doc.setDrawColor(34, 197, 94); doc.setLineWidth(2); doc.rect(5, 5, 200, 287);
      if (incluirLogo) doc.addImage(img, 'PNG', 70, 12, 70, 35);
      doc.setFontSize(22); doc.text("Relatório de Unidades", 105, incluirLogo ? 58 : 30, { align: "center" });
      
      autoTable(doc, {
        startY: incluirLogo ? 68 : 40,
        head: headers,
        body: body,
        headStyles: { fillColor: [34, 197, 94], halign: 'center' },
        theme: 'grid'
      });
      doc.save("Relatorio_Unidades.pdf");
      setShowExportModal(false);
    };
    img.onload = () => gerarPDF(true); img.onerror = () => gerarPDF(false);
  };

  const exportToExcel = () => {
    const wsData = [['Bloco', 'Unidade', 'Ocupado', 'Status', 'Dívida'], ...dadosFiltradosEOrdenados.map(u => [u.bloco, u.unidade, u.ocupado, u.status, u.valor])];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Unidades");
    XLSX.writeFile(wb, "Relatorio_Unidades.xlsx");
  };

  const blocosDisponiveis = ["Todos", ...new Set(unidades.map(u => u.bloco.toString()))].sort();

  return (
    <div style={pageContainer}>
      <style>{`
        .filter-pill { padding: 6px 12px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; cursor: pointer; font-size: 12px; font-weight: 500; color: ${theme.textSecondary}; transition: 0.2s; }
        .filter-pill.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .spinner-anim { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .action-menu { position: absolute; right: 30px; top: 10px; background: ${theme.mainBg}; border: 1px solid ${theme.border}; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 50; width: 140px; padding: 5px; }
        .menu-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; border-radius: 6px; color: ${theme.text}; transition: 0.2s; }
        .menu-item:hover { background: ${theme.bg}; }
        .pagination-btn { padding: 8px; border-radius: 6px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; color: ${theme.text}; cursor: pointer; display: flex; align-items: center; }
        .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        
        /* ESTILO DO MODAL DE SELEÇÃO (IGUAL MORADORES) */
        .column-select-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; border: 1px solid ${theme.border}; cursor: pointer; transition: 0.2s; margin-bottom: 5px; }
        .column-select-item:hover { background: ${theme.bg}; }
        .column-select-item.active { border-color: #3b82f6; background: #3b82f610; }
      `}</style>

      {(loadingInitial || loadingGlobal) && (
        <div style={{...fullScreenLoaderOverlay, backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255,255,255,0.7)'}}>
          <Loader2 className="spinner-anim" color="#3b82f6" size={50} />
        </div>
      )}

      {/* HEADER */}
      <div style={{
        ...headerStyle, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', // Muda conforme a tela
        alignItems: isMobile ? 'flex-start' : 'center', 
        justifyContent: 'space-between',
        gap: isMobile ? '20px' : '10px'
      }}>
        <div>
          <h1 style={{...titleStyle, color: theme.text}}>Unidades</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: theme.textSecondary }}>
            Gerencie os blocos, apartamentos e o status de ocupação do condomínio.
          </p>
          <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: theme.textSecondary }}>
            Logado como: <strong style={{ color: theme.text }}>{currentUser.nome}</strong>
          </p>
        </div>
        
        <div style={{
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center', 
          flexWrap: 'wrap', // Permite quebra de linha apenas se faltar espaço
          width: isMobile ? '100%' : 'auto'
        }}>
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={exportToExcel}>
            <Download size={18} color="#166534" /> Excel
          </button>
          
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => setShowExportModal(true)}>
            <FileText size={18} color="#b91c1c" /> PDF
          </button>
          
          <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary, flex: isMobile ? '1 1 auto' : 'none'}} onClick={() => { setSearchUnidade(""); setFilterBloco("Todos"); setFilterOcupado("Todos"); setFilterStatus("Todos"); }}>
            <RotateCcw size={18} /> Redefinir
          </button>
          
          <button style={{...btnNew, flex: isMobile ? '1 1 100%' : 'none'}} onClick={() => { setModalType("add"); setFormData({id:"", bloco:"", unidade:"", ocupado:"Não", status:"Adimplente", valor: ""}); setShowModal(true); }}>
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
                {blocosDisponiveis.map(b => (<button key={b} className={`filter-pill ${filterBloco === b ? 'active' : ''}`} onClick={() => setFilterBloco(b)}>{b === "Todos" ? "Todos" : `B${b}`}</button>))}
            </div>
            <div style={{display:'flex', gap:'20px'}}>
                <div style={pillContainer}>
                    <span style={{...filterMiniLabel, color: theme.textSecondary}}>Ocupação:</span>
                    {["Todos", "Sim", "Não"].map(o => <button key={o} className={`filter-pill ${filterOcupado === o ? 'active' : ''}`} onClick={() => setFilterOcupado(o)}>{o}</button>)}
                </div>
                <div style={pillContainer}>
                    <span style={{...filterMiniLabel, color: theme.textSecondary}}>Status:</span>
                    {["Todos", "Adimplente", "Inadimplente"].map(s => <button key={s} className={`filter-pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s}</button>)}
                </div>
            </div>
        </div>
      </div>

      {/* TABELA */}
      <div style={{...tableCard, backgroundColor: theme.mainBg, borderColor: theme.border}}>
        <table style={tableStyle}>
          <thead>
            <tr style={{...thRow, borderBottomColor: theme.border}}>
              {['bloco', 'unidade', 'ocupado', 'status', 'valor'].map(key => (
                <th key={key} style={{...thStyle, backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc', color: theme.textSecondary}} onClick={() => setSortConfig({key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>
                  <div style={thFlex}>{key === 'valor' ? 'Dívida' : key.charAt(0).toUpperCase() + key.slice(1)} {sortConfig.key === key && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                </th>
              ))}
              <th style={{ ...thStyle, backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc', color: theme.textSecondary, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {unidadesExibidas.map((u) => (
              <tr key={u.id} style={{...trStyle, borderBottom: `1px solid ${theme.border}`}}>
                <td style={{...tdStyle, color: theme.text}}><strong>{u.bloco}</strong></td>
                <td style={{...tdStyle, color: theme.text}}>{u.unidade}</td>
                <td style={{...tdStyle, color: theme.text}}>{u.ocupado}</td>
                <td style={tdStyle}><span style={u.status === "Adimplente" ? badgeGreen : badgeRed}>{u.status}</span></td>
                <td style={{...tdStyle, fontWeight: '600', color: u.status === 'Inadimplente' ? '#ef4444' : theme.text}}>{formatarMoeda(u.valor)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', position: 'relative' }}>
                   <button onClick={() => setShowMenuId(showMenuId === u.id ? null : u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MoreVertical size={20} color={theme.textSecondary} /></button>
                   {showMenuId === u.id && (
                     <div ref={menuRef} className="action-menu">
                        <div className="menu-item" onClick={() => { setModalType("edit"); setFormData({ ...u, valor: u.valor ? u.valor.toString().replace('.', ',') : "" }); setShowModal(true); setShowMenuId(null); }}><Edit2 size={14} /> Editar</div>
                        <div className="menu-item" style={{color:'#ef4444'}} onClick={() => { handleDelete(u.id); setShowMenuId(null); }}><Trash2 size={14} /> Excluir</div>
                     </div>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{...paginationFooter, backgroundColor: theme.isDark ? '#1e293b' : '#fcfcfc', borderTopColor: theme.border}}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'13px', color: theme.text}}>
                Exibir: <select style={{...selectPageSize, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={itemsPerPage} onChange={(e) => setItemsPerPage(e.target.value === "Todos" ? "Todos" : Number(e.target.value))}>
                    {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                    <option value="Todos">Todos</option>
                </select> de {totalItems} registros
            </div>
            {itemsPerPage !== "Todos" && (
                <div style={{display:'flex', alignItems:'center', gap:'15px', color: theme.text}}>
                    <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}><ChevronLeft size={18} /></button>
                    <span style={{fontSize:'13px', fontWeight:'600'}}>{currentPage} / {totalPages}</span>
                    <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}><ChevronRight size={18} /></button>
                </div>
            )}
        </div>
      </div>

      {/* MODAL DE CADASTRO */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text}}>
            <div style={modalHeader}>
              <h3 style={{margin:0}}>{modalType === "add" ? "Nova Unidade" : "Editar Unidade"}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <div style={formGrid}>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Bloco</label>
                <select style={{...selectStyle, backgroundColor: modalType === "edit" ? theme.bg : theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.bloco} disabled={modalType === "edit"} onChange={(e) => setFormData({...formData, bloco: e.target.value})}>
                  <option value="">Selecionar</option>
                  {[1, 2, 3, 4, 5, 8].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Unidade</label>
                <select style={{...selectStyle, backgroundColor: modalType === "edit" ? theme.bg : theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.unidade} disabled={modalType === "edit"} onChange={(e) => setFormData({...formData, unidade: e.target.value})}>
                  <option value="">Selecionar</option>
                  {[100, 200, 300, 400, 500].map(f => [1,2,3,4,5,6,7,8,9].map(n => (<option key={f+n} value={f+n}>{f+n}</option>)))}
                </select>
              </div>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Ocupado</label>
                <select style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.ocupado} onChange={(e) => setFormData({...formData, ocupado: e.target.value})}>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Status</label>
                <select style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="Adimplente">Adimplente</option>
                  <option value="Inadimplente">Inadimplente</option>
                </select>
              </div>
              {formData.status === "Inadimplente" && (
                <div style={{ ...inputGroup, gridColumn: 'span 2' }}>
                  <label style={{...labelStyle, color: theme.textSecondary}}>Valor da Dívida (R$)</label>
                  <input type="text" placeholder="Ex: 5.200,30" style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value.replace(/[^\d.,]/g, '')})} />
                </div>
              )}
            </div>
            <div style={modalFooter}>
              <button style={{...btnCancel, color: theme.text, borderColor: theme.border}} onClick={() => setShowModal(false)}>Cancelar</button>
              <button style={btnNew} onClick={handleSave}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPORTAÇÃO PDF (MESMO ESTILO MORADORES) */}
      {showExportModal && (
        <div style={modalOverlay}>
          <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '400px'}}>
            <div style={modalHeader}>
              <h3 style={{margin:0}}>Configurar Relatório PDF</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowExportModal(false)} />
            </div>
            <p style={{fontSize: '13px', color: theme.textSecondary, marginBottom: '15px'}}>Selecione as colunas que deseja exibir:</p>
            <div style={{marginBottom: '20px'}}>
              {exportColumns.map(col => (
                <div key={col.id} className={`column-select-item ${col.selected ? 'active' : ''}`} onClick={() => handleToggleColumn(col.id)}>
                  {col.selected ? <CheckSquare size={18} color="#3b82f6" /> : <Square size={18} color={theme.textSecondary} />}
                  <span style={{fontSize: '14px'}}>{col.label}</span>
                </div>
              ))}
            </div>
            <div style={modalFooter}>
              <button style={{...btnCancel, color: theme.text, borderColor: theme.border}} onClick={() => setShowExportModal(false)}>Cancelar</button>
              <button style={{...btnNew, backgroundColor: '#b91c1c'}} onClick={handleExportPDF}>Gerar Agora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ESTILOS
const pageContainer = { 
  padding: "20px", 
  maxWidth: "1200px", 
  width: "100%", 
  margin: "0 auto" 
};

const headerStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start', 
  flexWrap: 'wrap',       // permite quebrar no mobile
  gap: '15px',            // espaço entre itens quando quebram
  marginBottom: '24px' 
};
const titleStyle = { fontSize: '24px', fontWeight: '700', margin: 0 };
const btnNew = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const btnWhite = { border: '1px solid', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const filterCard = { padding: '15px 20px', borderRadius: '16px', border: '1px solid', marginBottom: '20px' };

const filterRow = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  flexWrap: 'wrap',       // permite quebrar no mobile
  gap: '10px' 
};
const filterGroup = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  flexWrap: 'wrap',       // quebra os botões no mobile
};
const searchContainer = { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '8px', border: '1px solid' };
const searchInput = { 
  border: 'none', 
  background: 'none', 
  padding: '8px 0', 
  outline: 'none', 
  fontSize: '13px', 
  width: '100%'   // ocupa toda a largura
};
const pillContainer = { 
  display: 'flex', 
  gap: '8px', 
  flexWrap: 'wrap' 
};
const filterMiniLabel = { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' };
const tableCard = { 
  borderRadius: '16px', 
  border: '1px solid', 
  overflowX: 'auto',   // permite scroll horizontal no mobile
  width: '100%'        // ocupa toda a largura
};
const tableStyle = { 
  width: '100%', 
  minWidth: '600px',   // evita quebrar colunas muito pequenas
  borderCollapse: 'collapse' 
};
const thStyle = { textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const thRow = { borderBottom: '1px solid' };
const tdStyle = { padding: '16px 24px', fontSize: '14px' };
const trStyle = { transition: '0.2s' };
const thFlex = { display: 'flex', alignItems: 'center', gap: '5px' };
const badgeGreen = { backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
const badgeRed = { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
const paginationFooter = { padding: '15px 24px', borderTop: '1px solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const selectPageSize = { padding: '4px 8px', borderRadius: '6px', border: '1px solid' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { 
  padding: '24px', 
  borderRadius: '20px', 
  width: '90%',         // ajusta ao mobile
  maxWidth: '450px',    // mantém limite no desktop
};
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const formGrid = { 
  display: 'grid', 
  gridTemplateColumns: '1fr 1fr', 
  gap: '15px',
  width: '100%', 
  '@media(max-width: 600px)': { // pseudo-código, você pode usar styled-components ou tailwind
    gridTemplateColumns: '1fr'   // no mobile, 1 coluna
  }
};
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '12px', fontWeight: '600' };
const selectStyle = { 
  padding: '10px', 
  borderRadius: '8px', 
  border: '1px solid', 
  outline: 'none', 
  fontSize: '14px', 
  width: '100%'   // ocupa toda a largura
};
const modalFooter = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' };
const btnCancel = { padding: '10px 16px', borderRadius: '8px', border: '1px solid', background: 'none', cursor: 'pointer' };
const fullScreenLoaderOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };