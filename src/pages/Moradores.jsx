/* eslint-disable no-unused-vars */
import { useTheme } from "../App";
import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Plus, MoreVertical, Edit2, Trash2, X, Loader2, 
  ChevronDown, Download, Phone, ChevronLeft, ChevronRight, RotateCcw, ChevronUp,
  FileText, CheckSquare, Square, Eye, User, Mail, Calendar, Hash, MapPin, Car
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const TOKEN = "NOV0CR818"; 
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";


export default function Moradores() {
  const { theme } = useTheme();
  
  const [currentUser, setCurrentUser] = useState({ nome: "Sistema" });
  const [moradores, setMoradores] = useState([]);
  const [vagas, setVagas] = useState([]); // <-- ADICIONE ESTA LINHA
  const [unidadesExistentes, setUnidadesExistentes] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  
  const [searchNome, setSearchNome] = useState("");
  const [filterVinculo, setFilterVinculo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterBloco, setFilterBloco] = useState("Todos");
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // Modal de Visualização
  const [selectedMorador, setSelectedMorador] = useState(null); // Morador selecionado para ver detalhes
  const [modalType, setModalType] = useState("add");
  const [showMenuId, setShowMenuId] = useState(null);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    { id: 'id_unidade', label: 'Unidade', selected: true },
    { id: 'nome', label: 'Nome', selected: true },
    { id: 'cpf', label: 'CPF', selected: true },
    { id: 'tipo_vinculo', label: 'Vínculo', selected: true },
    { id: 'telefone', label: 'Telefone', selected: true },
    { id: 'email', label: 'E-mail', selected: true },
    { id: 'status', label: 'Status', selected: true }
  ]);
  

  const [formData, setFormData] = useState({ 
    id: "", id_unidade: "", nome: "", cpf: "", tipo_vinculo: "Proprietário", 
    telefone: "", email: "", data_entrada: "", data_saida: "", status: "Ativo" 
  });

  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  const maskCPF = (value) => {
    if (!value) return "";
    const str = String(value);
    return str
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const maskPhone = (value) => {
    if (!value) return "";
    const str = String(value);
    return str
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nome) setCurrentUser(parsed);
      } catch (e) { console.error("Erro user:", e); }
    }
    fetchData();

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenuId(null);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowUnitDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoadingInitial(true);
      const [resMorad, resUnits, resVagas] = await Promise.all([
        fetch(`${SHEETS_URL}?sheet=MORADORES&token=${TOKEN}`),
        fetch(`${SHEETS_URL}?sheet=UNIDADES&token=${TOKEN}`),
        fetch(`${SHEETS_URL}?sheet=VAGAS&token=${TOKEN}`) // <-- BUSCA AS VAGAS
      ]);
      const dataMorad = await resMorad.json();
      const dataUnits = await resUnits.json();
      const dataVagas = await resVagas.json(); // <-- PEGA O JSON

      setMoradores(Array.isArray(dataMorad) ? dataMorad : []);
      setUnidadesExistentes(Array.isArray(dataUnits) ? dataUnits : []);
      setVagas(Array.isArray(dataVagas) ? dataVagas : []); // <-- SALVA NO ESTADO
    } catch (err) { 
      console.error("Erro fetch:", err); 
    } finally { 
      setLoadingInitial(false); 
    }
  };

  const formatarIDExibicao = (id) => {
  const unidade = unidadesExistentes.find(u => String(u.id) === String(id));

  if (!unidade) return id;

  return `B${unidade.bloco}-${unidade.unidade}`;
};


  const getUnitLabel = (id) => {
    const unit = unidadesExistentes.find(u => String(u.id) === String(id));
    return unit ? `BLOCO ${unit.bloco} - UNIDADE ${unit.unidade}` : "Selecione a unidade...";
  };

  // --- FUNÇÃO SALVAR COM VALIDAÇÃO DE CPF ---
  const handleSave = async () => {
    if (!formData.nome || !formData.id_unidade) return alert("Preencha Nome e Unidade");
    
    // Limpar CPF para comparação
    const cpfLimpo = formData.cpf.replace(/\D/g, "");
    
    // Validar se tem 11 dígitos
    if (cpfLimpo.length > 0 && cpfLimpo.length !== 11) {
      return alert("O CPF deve conter 11 dígitos.");
    }

    // Verificar Duplicidade
    if (cpfLimpo.length === 11) {
      const jaExiste = moradores.some(m => 
        String(m.cpf).replace(/\D/g, "") === cpfLimpo && m.id !== formData.id
      );
      if (jaExiste) {
        return alert("Erro: Já existe um morador cadastrado com este CPF!");
      }
    }

    const payload = { ...formData, id: modalType === "add" ? Date.now().toString() : formData.id, token: TOKEN, action: modalType, sheet: "MORADORES", user: currentUser.nome };
    setLoadingGlobal(true);
    try {
      await fetch(SHEETS_URL, { method: "POST", body: JSON.stringify(payload) });
      await fetchData();
      setShowModal(false);
    } catch (err) { alert("Erro ao salvar."); } 
    finally { setLoadingGlobal(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este morador?")) return;
    setLoadingGlobal(true);
    try {
      await fetch(SHEETS_URL, { method: "POST", body: JSON.stringify({ token: TOKEN, action: "delete", sheet: "MORADORES", id, user: currentUser.nome }) });
      await fetchData();
    } catch (err) { alert("Erro ao excluir"); }
    finally { setLoadingGlobal(false); }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(moradores);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Moradores");
    XLSX.writeFile(wb, "Moradores.xlsx");
  };

  const handleToggleColumn = (id) => {
    setSelectedColumns(prev => prev.map(col => col.id === id ? { ...col, selected: !col.selected } : col));
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); 
    const img = new Image(); 
    img.src = "/logo.png"; 

    const colsParaExportar = selectedColumns.filter(c => c.selected);
    const headers = colsParaExportar.map(c => c.label);
    const body = dadosFiltrados.map(m => colsParaExportar.map(c => {
        if(c.id === 'id_unidade') {
            const u = unidadesExistentes.find(unit => String(unit.id) === String(m.id_unidade));
            return u ? `B${u.bloco}-${u.unidade}` : m.id_unidade;
        }
        return m[c.id] || "";
    }));

    const gerarPDF = (incluirLogo = false) => {
      doc.setDrawColor(34, 197, 94); 
      doc.setLineWidth(1.5); 
      doc.rect(5, 5, 287, 200);
      if (incluirLogo) doc.addImage(img, 'PNG', 113, 12, 70, 25);
      doc.setFontSize(18); 
      doc.setTextColor(30, 41, 59);
      doc.text("Relatório de Moradores", 148, incluirLogo ? 45 : 25, { align: "center" });

      autoTable(doc, {
        startY: incluirLogo ? 55 : 35,
        head: [headers],
        body: body,
        headStyles: { fillColor: [34, 197, 94], halign: 'center', textColor: [255, 255, 255] },
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 10, right: 10 }
      });

      doc.save("Relatorio_Moradores.pdf");
      setShowExportModal(false);
    };
    img.onload = () => gerarPDF(true); 
    img.onerror = () => gerarPDF(false);
  };

  const dadosFiltrados = React.useMemo(() => {
  return moradores.filter(m => {
    const termoBusca = searchNome.toLowerCase();
    const termoApenasNumeros = termoBusca.replace(/\D/g, "");

    const matchNome = String(m.nome || "").toLowerCase().includes(termoBusca);
    const matchCPF =
      termoApenasNumeros !== "" &&
      String(m.cpf || "").replace(/\D/g, "").includes(termoApenasNumeros);

    const matchBusca = termoBusca === "" || matchNome || matchCPF;
    const matchVinculo =
      filterVinculo === "Todos" || m.tipo_vinculo === filterVinculo;
    const matchStatus =
      filterStatus === "Todos" || m.status === filterStatus;

    // 🔥 NOVO FILTRO POR BLOCO
    const unidade = unidadesExistentes.find(u => u.id === m.id_unidade);
    const matchBloco =
      filterBloco === "Todos" || String(unidade?.bloco) === filterBloco;

    return matchBusca && matchVinculo && matchStatus && matchBloco;

  }).sort((a, b) => {
    let aVal = a[sortConfig.key] || "";
    let bVal = b[sortConfig.key] || "";

    return sortConfig.direction === 'asc'
      ? aVal.toString().localeCompare(bVal.toString())
      : bVal.toString().localeCompare(aVal.toString());
  });

}, [
  moradores,
  searchNome,
  filterVinculo,
  filterStatus,
  filterBloco,        // 👈 IMPORTANTE
  sortConfig,
  unidadesExistentes  // 👈 IMPORTANTE
]);

const getContagemVeiculos = (idUnidadeMorador) => {
  if (!vagas || !idUnidadeMorador || vagas.length === 0) return 0;

  const idProcurado = String(idUnidadeMorador).trim();
  
  // Busca a vaga
  const vaga = vagas.find(v => String(v.id_unidade).trim() === idProcurado);
  
  // 🔥 ADICIONE ESTA LINHA ABAIXO PARA DEBUG:
  console.log("Buscando ID:", idProcurado, "Vaga encontrada:", vaga, "Lista de Vagas:", vagas);

  if (!vaga) return 0;

  let total = 0;
  if (String(vaga.possui_carro).toUpperCase() === "SIM" && String(vaga.status_carro).toUpperCase() === "ATIVO") total += 1;
  if (String(vaga.possui_moto).toUpperCase() === "SIM" && String(vaga.status_moto).toUpperCase() === "ATIVO") total += 1;
  
  return total;
};

  const totalItems = dadosFiltrados.length;
  const totalPages = itemsPerPage === "Todos" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * (itemsPerPage === "Todos" ? totalItems : itemsPerPage);
  const indexOfFirstItem = itemsPerPage === "Todos" ? 0 : indexOfLastItem - itemsPerPage;
  const moradoresExibidos = itemsPerPage === "Todos" ? dadosFiltrados : dadosFiltrados.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => { setCurrentPage(1); }, [searchNome, filterVinculo, filterStatus, filterBloco, itemsPerPage]);

  const unidadesDropdown = unidadesExistentes.filter(u => `${u.bloco}${u.unidade}`.includes(unitSearch.replace(/\D/g, "")));

  return (
    <div style={pageContainer}>
      <style>{`
        .filter-pill { padding: 6px 12px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; cursor: pointer; font-size: 12px; font-weight: 500; color: ${theme.textSecondary}; transition: 0.2s; }
        .filter-pill.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .spinner-anim { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .action-menu { position: absolute; right: 30px; background: ${theme.mainBg}; border: 1px solid ${theme.border}; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 50; width: 140px; padding: 5px; }
        .menu-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; border-radius: 6px; color: ${theme.text}; transition: 0.2s; }
        .menu-item:hover { background: ${theme.bg}; }
        .column-select-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; border: 1px solid ${theme.border}; cursor: pointer; transition: 0.2s; margin-bottom: 5px; }
        .column-select-item:hover { background: ${theme.bg}; }
        .column-select-item.active { border-color: #3b82f6; background: #3b82f610; }
        .custom-select-box { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.bg}; color: ${theme.text}; cursor: pointer; font-size: 14px; }
        .dropdown-wrapper { position: relative; width: 100%; }
        .dropdown-list-container { position: absolute; top: 100%; left: 0; width: 100%; z-index: 1001; background: ${theme.mainBg}; border: 1px solid ${theme.border}; border-radius: 8px; margin-top: 5px; box-shadow: 0 10px 15px rgba(0,0,0,0.1); overflow: hidden; }
        .dropdown-search-field { width: 100%; padding: 10px; border: none; border-bottom: 1px solid ${theme.border}; background: ${theme.bg}; color: ${theme.text}; outline: none; }
        .dropdown-items-scroll { max-height: 180px; overflow-y: auto; }
        .dropdown-option { padding: 10px; cursor: pointer; color: ${theme.text}; font-size: 13px; border-bottom: 1px solid ${theme.border}; }
        .dropdown-option:hover { background: ${theme.bg}; }
        .pagination-btn { padding: 8px; border-radius: 6px; border: 1px solid ${theme.border}; background: ${theme.mainBg}; color: ${theme.text}; cursor: pointer; display: flex; align-items: center; }
        .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .view-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid ${theme.border}; }
        .view-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: ${theme.textSecondary}; min-width: 100px; }
        .view-value { font-size: 14px; color: ${theme.text}; font-weight: 500; }table { border-collapse: separate; border-spacing: 0; }

thead tr:first-child th:first-child {
  border-top-left-radius: 16px;
}

thead tr:first-child th:last-child {
  border-top-right-radius: 16px;
}

/* Remove a borda inferior da última linha para não chocar com o arredondamento */
tbody tr:last-child td {
  border-bottom: none;
}
      `}</style>

      {(loadingInitial || loadingGlobal) && (
        <div style={{...fullScreenLoaderOverlay, backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255,255,255,0.7)'}}>
          <Loader2 className="spinner-anim" color="#3b82f6" size={50} />
        </div>
      )}

      <div style={headerStyle}>
  <div>
    <h1 style={{...titleStyle, color: theme.text}}>Moradores</h1>
    {/* Descrição da área adicionada aqui */}
    <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: theme.textSecondary }}>
      Gerencie o cadastro e informações dos moradores do condomínio.
    </p>
    {/* Logado como abaixo da descrição */}
    <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: theme.textSecondary }}>
      Logado como: <strong style={{ color: theme.text }}>{currentUser.nome}</strong>
    </p>
  </div>
  
  <div style={{display:'flex', gap:'10px', alignItems: 'flex-start'}}>
    <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary}} onClick={exportToExcel}><Download size={18} color="#166534" /> Excel</button>
    <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary}} onClick={() => setShowExportModal(true)}><FileText size={18} color="#b91c1c" /> PDF</button>
    <button style={{...btnWhite, backgroundColor: theme.mainBg, borderColor: theme.border, color: theme.textSecondary}} onClick={() => { setSearchNome(""); setFilterVinculo("Todos"); setFilterStatus("Todos"); }}><RotateCcw size={18} /> Redefinir</button>
    <button style={btnNew} onClick={() => { setModalType("add"); setUnitSearch(""); setFormData({id:"", id_unidade:"", nome:"", cpf:"", tipo_vinculo:"Proprietário", telefone:"", email:"", data_entrada:"", data_saida:"", status:"Ativo"}); setShowModal(true); }}><Plus size={18} /> Novo Morador</button>
  </div>
</div>

      <div style={{...filterCard, backgroundColor: theme.mainBg, borderColor: theme.border}}>
  <div style={{...filterRow, flexWrap: 'wrap'}}>
    
    <div style={{...searchContainer, backgroundColor: theme.bg, borderColor: theme.border, minWidth: '300px'}}>
      <Search size={16} color={theme.textSecondary} />
      <input
        type="text"
        placeholder="Buscar por nome ou CPF..."
        style={{...searchInput, color: theme.text}}
        value={searchNome}
        onChange={(e) => setSearchNome(e.target.value)}
      />
    </div>

    <div style={{display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap'}}>
      
      {/* VÍNCULO */}
      <div style={pillContainer}>
        <span style={{...filterMiniLabel, color: theme.textSecondary}}>Vínculo:</span>
        {["Todos", "Proprietário", "Locatário", "Temporada"].map(v => (
          <button
            key={v}
            className={`filter-pill ${filterVinculo === v ? 'active' : ''}`}
            onClick={() => setFilterVinculo(v)}
          >
            {v}
          </button>
        ))}
      </div>

      {/* STATUS */}
      <div style={pillContainer}>
        <span style={{...filterMiniLabel, color: theme.textSecondary}}>Status:</span>
        {["Todos", "Ativo", "Inativo"].map(s => (
          <button
            key={s}
            className={`filter-pill ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 🔥 BLOCO (NOVO) */}
      <div style={pillContainer}>
        <span style={{...filterMiniLabel, color: theme.textSecondary}}>Bloco:</span>
        {["Todos", ...[...new Set(unidadesExistentes.map(u => String(u.bloco)))].sort((a,b) => a - b)]
          .map(b => (
            <button
              key={b}
              className={`filter-pill ${filterBloco === b ? 'active' : ''}`}
              onClick={() => setFilterBloco(b)}
            >
              {b === "Todos" ? "Todos" : `BL ${b}`}
            </button>
          ))}
      </div>

    </div>
  </div>
</div>


      <div style={{...tableCard, backgroundColor: theme.mainBg, borderColor: theme.border, overflow: 'visible'}}>
        <table style={tableStyle}>
          <thead>
            <tr style={{...thRow, borderBottomColor: theme.border}}>
              {['id_unidade', 'nome', 'tipo_vinculo', 'contato', 'status'].map(key => (
                 <th key={key} style={{...thStyle, backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc', color: theme.textSecondary}} onClick={() => setSortConfig({key: key === 'contato' ? 'telefone' : key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'})}>
                    <div style={thFlex}>
                      {key === 'id_unidade' ? 'Unidade' : key === 'tipo_vinculo' ? 'Vínculo' : key.charAt(0).toUpperCase() + key.slice(1)}
                      {sortConfig.key === (key === 'contato' ? 'telefone' : key) && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                    </div>
                 </th>
              ))}
              <th style={{ ...thStyle, backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc', color: theme.textSecondary, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {moradoresExibidos.map((m, idx) => (
              <tr key={m.id} style={{...trStyle, borderBottom: `1px solid ${theme.border}`}}>
                <td style={{...tdStyle, color: theme.text}}><strong>{formatarIDExibicao(m.id_unidade)}</strong></td>
                <td style={{...tdStyle, color: theme.text}}>
                  <div style={{fontWeight:'600'}}>{m.nome}</div>
                  <div style={{fontSize:'11px', color: theme.textSecondary}}>{maskCPF(m.cpf)}</div>
                </td>
                <td style={tdStyle}>
                  <span style={m.tipo_vinculo === "Proprietário" ? badgeBlue : m.tipo_vinculo === "Locatário" ? badgeGreen : badgeOrange}>
                    {m.tipo_vinculo}
                  </span>
                </td>
                <td style={{...tdStyle, color: theme.text}}>
                  <div style={{display:'flex', alignItems:'center', gap: '5px'}}><Phone size={12}/> {maskPhone(m.telefone)}</div>
                  <div style={{fontSize:'12px', color: theme.textSecondary}}>{m.email}</div>
                </td>
                <td style={tdStyle}><span style={m.status === "Ativo" ? badgeGreen : badgeRed}>{m.status}</span></td>
                <td style={{ ...tdStyle, textAlign: 'right', position: 'relative' }}>
                    <div style={{display:'flex', justifyContent:'flex-end', gap:'10px'}}>
                        <button 
                            onClick={() => { setSelectedMorador(m); setShowViewModal(true); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                            title="Ver Detalhes"
                        >
                            <Eye size={20} />
                        </button>
                        <button onClick={() => setShowMenuId(showMenuId === m.id ? null : m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <MoreVertical size={20} color={theme.textSecondary} />
                        </button>
                    </div>
                    {showMenuId === m.id && (
                      <div ref={menuRef} className="action-menu" style={{ 
                        top: idx > moradoresExibidos.length - 3 && moradoresExibidos.length > 3 ? 'auto' : '10px', 
                        bottom: idx > moradoresExibidos.length - 3 && moradoresExibidos.length > 3 ? '10px' : 'auto' 
                      }}>
                          <div className="menu-item" onClick={() => { setModalType("edit"); setFormData(m); setUnitSearch(""); setShowModal(true); setShowMenuId(null); }}><Edit2 size={14} /> Editar</div>
                          <div className="menu-item" style={{color:'#ef4444'}} onClick={() => { handleDelete(m.id); setShowMenuId(null); }}><Trash2 size={14} /> Excluir</div>
                      </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{...paginationFooter, backgroundColor: theme.isDark ? '#1e293b' : '#fcfcfc', borderTopColor: theme.border}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'13px', color: theme.text}}>
            Exibir: 
            <select style={{...selectPageSize, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}} value={itemsPerPage} onChange={(e) => setItemsPerPage(e.target.value === "Todos" ? "Todos" : Number(e.target.value))}>
              {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
              <option value="Todos">Todos</option>
            </select> de {totalItems} registros
          </div>
          {itemsPerPage !== "Todos" && (
            <div style={{display:'flex', alignItems:'center', gap:'15px', color: theme.text}}>
              <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}><ChevronLeft size={18} /></button>
              <span style={{fontSize:'13px', fontWeight:'600'}}>{currentPage} / {totalPages}</span>
              <button className="pagination-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}><ChevronRight size={18} /></button>
            </div>
          )}
        </div>
      </div>

     {/* MODAL DE VISUALIZAÇÃO (VER MAIS) */}
{showViewModal && selectedMorador && (
  <div style={modalOverlay}>
    <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '550px'}}>
      <div style={modalHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{padding:'10px', borderRadius:'12px', background:'#3b82f620', color:'#3b82f6'}}><User size={24}/></div>
          <h3 style={{margin:0}}>Detalhes do Morador</h3>
        </div>
        <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowViewModal(false)} />
      </div>

      <div style={{marginTop:'10px'}}>
        <div className="view-row"><span className="view-label"><MapPin size={14}/> Unidade</span> <span className="view-value">{getUnitLabel(selectedMorador.id_unidade)}</span></div>
        <div className="view-row"><span className="view-label"><User size={14}/> Nome</span> <span className="view-value">{selectedMorador.nome}</span></div>
        <div className="view-row"><span className="view-label"><Hash size={14}/> CPF</span> <span className="view-value">{maskCPF(selectedMorador.cpf)}</span></div>
        <div className="view-row"><span className="view-label"><FileText size={14}/> Vínculo</span> <span className="view-value">{selectedMorador.tipo_vinculo}</span></div>
        <div className="view-row"><span className="view-label"><Phone size={14}/> Telefone</span> <span className="view-value">{maskPhone(selectedMorador.telefone)}</span></div>
        <div className="view-row"><span className="view-label"><Mail size={14}/> E-mail</span> <span className="view-value">{selectedMorador.email || "Não informado"}</span></div>
        <div className="view-row"><span className="view-label"><Calendar size={14}/> Entrada</span> <span className="view-value">{selectedMorador.data_entrada ? new Date(selectedMorador.data_entrada).toLocaleDateString('pt-BR') : "-"}</span></div>
        
        {selectedMorador.data_saida && (
          <div className="view-row">
            <span className="view-label"><Calendar size={14}/> Saída</span> 
            <span className="view-value">
              {!isNaN(Date.parse(selectedMorador.data_saida)) 
                ? new Date(selectedMorador.data_saida).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) 
                : "Não definida"}
            </span>
          </div>
        )}

        {/* Linha dos Veículos */}
        <div className="view-row">
          <span className="view-label"><Car size={14}/> Veículos Ativos</span> 
          <span className="view-value" style={{fontWeight:'800', color:'#3b82f6'}}>
            {getContagemVeiculos(selectedMorador.id_unidade)}
          </span>
        </div>

        {/* A última linha deve ter borderBottom:'none' */}
        <div className="view-row" style={{borderBottom:'none'}}>
          <span className="view-label">Status</span> 
          <span style={selectedMorador.status === "Ativo" ? badgeGreen : badgeRed}>{selectedMorador.status}</span>
        </div>
      </div>

      <div style={{...modalFooter, marginTop:'20px'}}>
        <button style={{...btnNew, width:'100%', justifyContent:'center'}} onClick={() => setShowViewModal(false)}>
          Fechar Visualização
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL DE SELEÇÃO DE COLUNAS PDF */}
      {showExportModal && (
        <div style={modalOverlay}>
          <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text, maxWidth: '400px'}}>
            <div style={modalHeader}>
              <h3 style={{margin:0}}>Configurar Relatório PDF</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowExportModal(false)} />
            </div>
            <p style={{fontSize: '13px', color: theme.textSecondary, marginBottom: '15px'}}>Selecione as colunas que deseja exibir:</p>
            <div style={{marginBottom: '20px'}}>
              {selectedColumns.map(col => (
                <div key={col.id} className={`column-select-item ${col.selected ? 'active' : ''}`} onClick={() => handleToggleColumn(col.id)}>
                  {col.selected ? <CheckSquare size={18} color="#3b82f6" /> : <Square size={18} color={theme.textSecondary} />}
                  <span style={{fontSize: '14px'}}>{col.label}</span>
                </div>
              ))}
            </div>
            <div style={modalFooter}>
              <button style={{...btnCancel, color: theme.text, borderColor: theme.border}} onClick={() => setShowExportModal(false)}>Cancelar</button>
              <button style={{...btnNew, backgroundColor: '#b91c1c'}} onClick={exportToPDF}>Gerar Agora</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={modalOverlay}>
          <div style={{...modalContent, backgroundColor: theme.mainBg, color: theme.text}}>
            <div style={modalHeader}>
              <h3 style={{margin:0}}>{modalType === "add" ? "Novo Morador" : "Editar Morador"}</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <div style={formGrid}>
              <div style={{...inputGroup, gridColumn: 'span 2'}}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Unidade</label>
                <div className="dropdown-wrapper" ref={dropdownRef}>
                  <div className="custom-select-box" style={{backgroundColor: theme.bg, borderColor: theme.border}} onClick={() => setShowUnitDropdown(!showUnitDropdown)}>
                    <span>{formData.id_unidade ? getUnitLabel(formData.id_unidade) : "Selecione..."}</span>
                    <ChevronDown size={16} />
                  </div>
                  {showUnitDropdown && (
                    <div className="dropdown-list-container">
                      <input className="dropdown-search-field" placeholder="Buscar unidade..." autoFocus value={unitSearch} onChange={(e) => setUnitSearch(e.target.value)} />
                      <div className="dropdown-items-scroll">
                        {unidadesDropdown.map(u => (
                          <div key={u.id} className="dropdown-option" onClick={() => { setFormData({...formData, id_unidade: u.id}); setShowUnitDropdown(false); }}>
                            BLOCO {u.bloco} - UNIDADE {u.unidade}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Vínculo</label>
                <select style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.tipo_vinculo} onChange={(e) => setFormData({...formData, tipo_vinculo: e.target.value})}>
                  <option value="Proprietário">Proprietário</option>
                  <option value="Locatário">Locatário</option>
                  <option value="Temporada">Temporada</option>
                </select>
              </div>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Status</label>
                <select style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <div style={{...inputGroup, gridColumn: 'span 2'}}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Nome Completo</label>
                <input type="text" style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>CPF</label>
                <input type="text" placeholder="000.000.000-00" style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} />
              </div>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Telefone</label>
                <input type="text" placeholder="(00) 00000-0000" style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: maskPhone(e.target.value)})} />
              </div>
              <div style={{...inputGroup, gridColumn: 'span 2'}}>
                <label style={{...labelStyle, color: theme.textSecondary}}>E-mail</label>
                <input type="email" placeholder="exemplo@email.com" style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div style={inputGroup}>
                <label style={{...labelStyle, color: theme.textSecondary}}>Data Entrada</label>
                <input type="date" style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.data_entrada} onChange={(e) => setFormData({...formData, data_entrada: e.target.value})} />
              </div>
              {formData.tipo_vinculo !== "Proprietário" && (
                <div style={inputGroup}>
                  <label style={{...labelStyle, color: theme.textSecondary}}>Data Saída</label>
                  <input type="date" style={{...selectStyle, backgroundColor: theme.mainBg, color: theme.text, borderColor: theme.border}} value={formData.data_saida} onChange={(e) => setFormData({...formData, data_saida: e.target.value})} />
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
    </div>
  );
}

// ESTILOS SINCRONIZADOS
const pageContainer = { padding: "20px", maxWidth: "1200px", margin: "0 auto" };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const titleStyle = { fontSize: '24px', fontWeight: '700', margin: 0 };
const subtitleStyle = { margin: 0 };
const btnNew = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const btnWhite = { border: '1px solid', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' };
const filterCard = { padding: '15px 20px', borderRadius: '16px', border: '1px solid', marginBottom: '20px' };
const filterRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' };
const searchContainer = { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '8px', border: '1px solid' };
const searchInput = { border: 'none', background: 'none', padding: '8px 0', outline: 'none', fontSize: '13px', width: '100%' };
const pillContainer = { display: 'flex', gap: '8px', alignItems: 'center' };
const filterMiniLabel = { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' };
const tableCard = { borderRadius: '16px', border: '1px solid', overflow: 'hidden' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };
const thRow = { borderBottom: '1px solid' };
const tdStyle = { padding: '16px 24px', fontSize: '14px' };
const trStyle = { transition: '0.2s' };
const thFlex = { display: 'flex', alignItems: 'center', gap: '5px' };
const paginationFooter = { padding: '15px 24px', borderTop: '1px solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center',borderBottomLeftRadius: '16px', 
  borderBottomRightRadius: '16px' };
const selectPageSize = { padding: '4px 8px', borderRadius: '6px', border: '1px solid', outline: 'none' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { padding: '24px', borderRadius: '20px', width: '95%', maxWidth: '500px' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const formGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '12px', fontWeight: '600' };
const selectStyle = { padding: '10px', borderRadius: '8px', border: '1px solid', outline: 'none', fontSize: '14px', width: '100%' };
const modalFooter = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' };
const btnCancel = { padding: '10px 16px', borderRadius: '8px', border: '1px solid', background: 'none', cursor: 'pointer' };
const fullScreenLoaderOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 };

// BADGES
const badgeBlue = { backgroundColor: '#eff6ff', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
const badgeOrange = { backgroundColor: '#fff7ed', color: '#ea580c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
const badgeGreen = { backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };
const badgeRed = { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' };