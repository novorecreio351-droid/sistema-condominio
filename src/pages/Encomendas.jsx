 
 
import React, { useState, useEffect, useRef } from "react";
import { 
  Package, Search, Plus, Edit2, Trash2, X, Loader2, 
  MoreVertical, Eye, Box, CheckCircle2, AlertCircle, 
  User, Paperclip, Truck, History, Calendar, LayoutDashboard,
  ChevronDown, UploadCloud, Camera, MapPin
} from "lucide-react";
import { useTheme } from "../App";

const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";
const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;

// --- ESTILOS ---
const pageContainer = { padding: "20px", maxWidth: "1200px", margin: "0 auto" };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const cardStatus = { padding: '20px', borderRadius: '16px', border: '1px solid', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' };
const tableCard = { borderRadius: '16px', border: '1px solid', overflow: 'hidden', marginTop: '20px' };
const tableWrapper = { width: '100%', overflowX: 'auto' };
const tableStyle = { width: '100%', minWidth: '900px', borderCollapse: 'collapse', tableLayout: 'auto' };
const thStyle = { textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdStyle = { padding: '16px 24px', fontSize: '14px' };
const badgeStyle = { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' };
const viewBox = { padding: '14px', borderRadius: '12px', fontSize: '13px', border: '1px solid', lineHeight: '1.6' };
const modalOverlay = { 
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
  backgroundColor: 'rgba(0, 0, 0, 0.7)', // Mais escuro para destacar no Dark Mode
  display: 'flex', justifyContent: 'center', alignItems: 'center', 
  zIndex: 1000,
  backdropFilter: 'blur(4px)' // Efeito de desfoque igual ao da Piscina
};
const modalContent = { padding: '24px', borderRadius: '20px', width: '90%', position: 'relative' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const labelStyle = { fontSize: '11px', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase', color: '#64748b' };
const selectStyle = { 
  padding: '12px 15px', // Mais espaçoso igual Piscina
  borderRadius: '12px', 
  border: '1px solid', 
  outline: 'none', 
  fontSize: '14px',
  transition: 'all 0.2s'
};

const spinnerKeyframeName = 'encomendas-spin';
const spinnerAnimation = { animation: `${spinnerKeyframeName} 0.85s linear infinite` };
const buttonSpinnerStyle = { ...spinnerAnimation, marginRight: '8px', display: 'inline-block' };

export default function Encomendas({ user }) {
  const { theme } = useTheme();
  
  // Estados de Dados
  const [encomendas, setEncomendas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [moradores, setMoradores] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  
  // Interface Modal e Busca
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [entregaFotos, setEntregaFotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pendente");
  const [showWhatsappPrompt, setShowWhatsappPrompt] = useState(false);
  const [pendingWhatsapp, setPendingWhatsapp] = useState(null);
  const [whatsappCodLoading, setWhatsappCodLoading] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const dropdownRef = useRef(null);
  const photoInputRef = useRef(null);

  // Form Data
  const [formData, setFormData] = useState({
    id_unidade: "", 
    id_morador: "",
    nome: "", 
    telefone: "", 
    transportadora: "", 
    numero_fiscal: "",
    ident_interna: "",
    data_recebimento: new Date().toISOString().split('T')[0],
    status: "Pendente", 
    fotosBase64: []
  });

  const resetForm = () => {
    setFormData({
      id_unidade: "",
      id_morador: "",
      nome: "",
      telefone: "",
      transportadora: "",
      numero_fiscal: "",
      ident_interna: "",
      data_recebimento: new Date().toISOString().split('T')[0],
      status: "Pendente",
      fotosBase64: []
    });
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    console.log("fetchData: carregando dados de ENCOMENDAS, UNIDADES, MORADORES e ENTREGAS_FOTO");
    try {
      setLoadingInitial(true);
      const [resEnc, resUni, resMor, resFotos] = await Promise.all([
        fetch(`${API_URL}?token=${TOKEN}&sheet=ENTREGAS`).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=UNIDADES`).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=MORADORES`).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=ENTREGAS_FOTO`).then(r => r.json())
      ]);
      const encomendasLoaded = Array.isArray(resEnc) ? resEnc : [];
      setEncomendas(encomendasLoaded);
      setUnidades(Array.isArray(resUni) ? resUni : []);
      setMoradores(Array.isArray(resMor) ? resMor : []);
      setEntregaFotos(Array.isArray(resFotos) ? resFotos : []);
      return encomendasLoaded;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setLoadingInitial(false);
    }
  };

  // --- LÓGICA DE ASSOCIAÇÃO ---

  const getUnitLabel = (id) => {
    const u = unidades.find(unit => unit.id.toString() === id.toString());
    return u ? `BLOCO ${u.bloco} - UNIDADE ${u.unidade}` : "Selecione a unidade...";
  };

  const getCell = (item, key) => {
    if (!item) return "";
    const normalizedKey = key.toString().toLowerCase();
    const foundKey = Object.keys(item).find((k) => k.toLowerCase() === normalizedKey);
    return foundKey ? item[foundKey] : "";
  };

  const formatBlockUnit = (value) => {
    const raw = `${value || ""}`.trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 4) {
      const bloco = digits.slice(0, -3);
      const unidade = digits.slice(-3);
      return `BLOCO ${bloco} - UNIDADE ${unidade}`;
    }
    return raw;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp;
    return `${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const converterLinkDrive = (url) => {
    if (!url) return null;
    const match = url.match(/[-\w]{25,}/);
    const fileId = match ? match[0] : null;
    if (fileId) {
      const timestamp = new Date().getTime();
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400&t=${timestamp}`;
    }
    return url;
  };

  const normalizeWhatsappPhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("55")) return digits;
    return digits.length >= 10 ? `55${digits}` : digits;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getWhatsappUrl = ({ phone, referencia, cod }) => {
    const number = normalizeWhatsappPhone(phone);
    if (!number) return null;
    const message = encodeURIComponent(
      `Olá! Sua encomenda chegou ao condomínio. Referência: ${referencia || 'sem referência'}. Por favor, apresente o código ${cod} para efetuar a retirada.`
    );
    return `https://api.whatsapp.com/send?phone=${number}&text=${message}`;
  };

  const waitForRealCod = async (createDateToken) => {
    let savedEncomendas = [];

    const getEntryMatchKey = (entry) => {
      return getCell(entry, "CREATE_DATE") || getCell(entry, "create_date") || getCell(entry, "created_at") || getCell(entry, "ID") || getCell(entry, "id");
    };

    const getEntryCode = (entry) => {
      return getCell(entry, "COD") || getCell(entry, "cod") || getCell(entry, "ID") || getCell(entry, "id");
    };

    const normalizeSortableValue = (value) => {
      if (!value) return 0;
      const dateValue = Date.parse(value);
      if (!Number.isNaN(dateValue)) return dateValue;
      const numericValue = parseInt(value.toString().replace(/\D/g, ""), 10);
      return Number.isNaN(numericValue) ? 0 : numericValue;
    };

    const findNewestEntry = (entries) => {
      if (!entries.length) return null;
      return entries.reduce((current, next) => {
        return normalizeSortableValue(getEntryMatchKey(next)) > normalizeSortableValue(getEntryMatchKey(current)) ? next : current;
      }, entries[0]);
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      console.log(`waitForRealCod: tentativa ${attempt + 1} de buscar o registro recém-criado com CREATE_DATE=${createDateToken}`);
      await sleep(1800);
      savedEncomendas = await fetchData();
      let novoRegistro = savedEncomendas.find((entry) => {
        return getEntryMatchKey(entry)?.toString() === createDateToken.toString();
      });

      if (!novoRegistro) {
        console.log("waitForRealCod: registro não encontrado pelo CREATE_DATE, tentando o último registro inserido...");
        novoRegistro = findNewestEntry(savedEncomendas);
      }

      if (novoRegistro) {
        const codEncontrado = getEntryCode(novoRegistro);
        console.log("waitForRealCod: registro considerado", novoRegistro, "codEncontrado=", codEncontrado);
        if (codEncontrado) {
          return { savedEncomendas, codReal: codEncontrado };
        }
      }
    }

    return { savedEncomendas, codReal: null };
  };

  const getEntregaPhotoUrls = (item) => {
    const itemCod = getCell(item, "COD_ENTREGA") || getCell(item, "cod_entrega") || getCell(item, "ID_ENTREGA") || getCell(item, "id") || "";
    return entregaFotos
      .filter((row) => {
        const rowId = getCell(row, "ID_ENTREGA") || getCell(row, "id_entrega") || getCell(row, "cod_entrega") || getCell(row, "id");
        return rowId?.toString() === itemCod?.toString();
      })
      .map((row) => getCell(row, "URL_DRIVE") || getCell(row, "url_drive"))
      .filter(Boolean);
  };

  const unidadesFiltradas = unidades.filter(u => 
    u.bloco?.toString().toLowerCase().includes(unitSearch.toLowerCase()) || 
    u.unidade?.toString().toLowerCase().includes(unitSearch.toLowerCase())
  );

  const moradoresDaUnidade = moradores.filter(m => m.id_unidade?.toString() === formData.id_unidade?.toString());

  const handleUnitSelect = (uId) => {
    const mFiltrados = moradores.filter(m => m.id_unidade?.toString() === uId.toString());
    
    let novoNome = "";
    let novoTelefone = "";
    let novoMoradorId = "";

    // Se tiver exatamente 1 morador, preenche automático
    if (mFiltrados.length === 1) {
      novoNome = mFiltrados[0].nome;
      novoTelefone = mFiltrados[0].telefone;
      novoMoradorId = mFiltrados[0].id;
    }

    setFormData({
      ...formData,
      id_unidade: uId,
      id_morador: novoMoradorId,
      nome: novoNome,
      telefone: novoTelefone
    });
    setShowUnitDropdown(false);
    setUnitSearch("");
  };

  const handleMoradorSelect = (mId) => {
    const m = moradores.find(mor => mor.id.toString() === mId.toString());
    if (m) {
      setFormData({ ...formData, id_morador: m.id, nome: m.nome, telefone: m.telefone });
    }
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      fotosBase64: prev.fotosBase64.filter((_, i) => i !== index)
    }));
  };

  const handleClearPhotos = () => {
    setFormData((prev) => ({ ...prev, fotosBase64: [] }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    Promise.all(files.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ src: reader.result, name: file.name });
      reader.readAsDataURL(file);
    }))).then((images) => {
      setFormData((prev) => ({
        ...prev,
        fotosBase64: [...prev.fotosBase64, ...images]
      }));
      e.target.value = "";
    });
  };

  const handleSave = async () => {
    setLoadingGlobal(true);

    // 🔥 Mapeia a lista completa de imagens convertendo para a estrutura correta
    const listaImagens = formData.fotosBase64.map((foto) => {
      return {
        base64: foto.src,
        contentType: foto.src.split(";")[0].split(":")[1]
      };
    });

    const createDateToken = new Date().toISOString();
    const payload = {
      token: TOKEN,
      action: "add",
      sheet: "ENTREGAS",
      id: "SEQUENTIAL",
      user: user?.nome || "Sistema",
      data: {
        id_unidade: formData.id_unidade,
        id_morador: formData.id_morador || "",
        nome: formData.nome,
        telefone: formData.telefone,
        transportadora: formData.transportadora,
        numero_fiscal: formData.numero_fiscal || "",
        ident_interna: formData.ident_interna || "",
        create_date: createDateToken,
        data_recebimento: formData.data_recebimento,
        status: formData.status,
        // 📸 Aqui vai o array completo com todas as fotos anexadas
        imagens: listaImagens
      }
    };

    console.log("Enviando para Google Sheets (Múltiplas Fotos):", payload);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // 🔥 Mantido o modo original que você usa
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify(payload)
      });

      console.log("Google Sheets request enviada. Response:", response);
      if (response && response.type === "opaque") {
        console.log("Modo no-cors retornou response opaca. Não há corpo acessível.");
      }

      setShowModal(false);
      resetForm();
      setLoadingGlobal(false);

      if (formData.telefone && formData.telefone.toString().trim()) {
        setPendingWhatsapp({
          phone: formData.telefone,
          referencia: formData.numero_fiscal || "sem referência",
          cod: "..."
        });
        setWhatsappCodLoading(true);
        setShowWhatsappPrompt(true);

        waitForRealCod(createDateToken).then((result) => {
          setWhatsappCodLoading(false);
          if (result.codReal) {
            setPendingWhatsapp((prev) => prev ? { ...prev, cod: result.codReal } : prev);
          } else {
            setPendingWhatsapp((prev) => prev ? { ...prev, cod: null } : prev);
          }
        }).catch(() => {
          setWhatsappCodLoading(false);
          setPendingWhatsapp((prev) => prev ? { ...prev, cod: null } : prev);
        });
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error("Erro ao enviar para Google Sheets:", error);
      alert("Erro ao salvar.");
      setLoadingGlobal(false);
    }
  };

  const handleView = (item) => {
    console.log("Visualizar encomenda:", item);
    setSelectedDetails(item);
    setSelectedPhotoIndex(0);
    setShowViewDetails(true);
  };

  const handleBaixa = (item) => {
    const itemCod = getCell(item, "COD_ENTREGA") || getCell(item, "cod_entrega") || getCell(item, "id");
    const updated = encomendas.map((entry) => {
      const entryCod = getCell(entry, "COD_ENTREGA") || getCell(entry, "cod_entrega") || getCell(entry, "id");
      if (entryCod === itemCod) {
        return { ...entry, STATUS: "Retirado", status: "Retirado" };
      }
      return entry;
    });
    setEncomendas(updated);
    if (selectedDetails) {
      const selectedCod = getCell(selectedDetails, "COD_ENTREGA") || getCell(selectedDetails, "cod_entrega") || getCell(selectedDetails, "id");
      if (selectedCod === itemCod) {
        setSelectedDetails({ ...selectedDetails, STATUS: "Retirado", status: "Retirado" });
      }
    }
  };

  const handleSendWhatsapp = () => {
    if (!pendingWhatsapp) return;
    const url = getWhatsappUrl(pendingWhatsapp);
    if (url) {
      window.open(url, "_blank");
    }
    setShowWhatsappPrompt(false);
    setPendingWhatsapp(null);
  };

  const handleCancelWhatsapp = () => {
    setShowWhatsappPrompt(false);
    setPendingWhatsapp(null);
  };

  // Dashboard Stats
  const stats = {
    pendentes: encomendas.filter(e => getCell(e, "STATUS") === "Pendente").length,
    entreguesHoje: encomendas.filter(e => getCell(e, "STATUS") === "Retirado").length,
    volumes: encomendas.length
  };

  const filteredData = encomendas.filter(e => {
    const nome = getCell(e, "NOME");
    const idUnidade = getCell(e, "ID_UNIDADE");
    const status = getCell(e, "STATUS");
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      nome.toLowerCase().includes(searchLower) ||
      idUnidade.toString().toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === "Todos" || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ ...pageContainer, backgroundColor: theme.bgBody, color: theme.text }}>
      <style>{`@keyframes ${spinnerKeyframeName} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Gestão de Encomendas</h1>
          <p style={{ color: theme.textSecondary, fontSize: '14px' }}>Controle de recebimento e entrega de volumes</p>
        </div>
        <button onClick={() => { resetForm(); setModalType("add"); setShowModal(true); }} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Novo Recebimento
        </button>
      </header>

      {/* DASHBOARD */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
        <div style={{ ...cardStatus, backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: theme.textSecondary }}>Aguardando Retirada</span><Box size={20} color="#f59e0b" /></div>
          <h2 style={{ margin: 0 }}>{stats.pendentes}</h2>
        </div>
        <div style={{ ...cardStatus, backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: theme.textSecondary }}>Entregues Hoje</span><CheckCircle2 size={20} color="#22c55e" /></div>
          <h2 style={{ margin: 0 }}>{stats.entreguesHoje}</h2>
        </div>
        <div style={{ ...cardStatus, backgroundColor: theme.bgCard, borderColor: theme.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: theme.textSecondary }}>Total de Volumes</span><Truck size={20} color="#3b82f6" /></div>
          <h2 style={{ margin: 0 }}>{stats.volumes}</h2>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '8px', border: '1px solid', borderColor: theme.border, backgroundColor: theme.bgCard }}>
          <Search size={18} color={theme.textSecondary} />
          <input placeholder="Buscar por unidade ou morador..." style={{ border: 'none', background: 'none', padding: '10px 0', outline: 'none', color: theme.text, width: '100%' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: theme.border, backgroundColor: theme.bgCard, color: theme.text }}>
          <option value="Todos">Todos Status</option>
          <option value="Pendente">Aguardando Retirada</option>
          <option value="Retirado">Entregue</option>
          <option value="Armazenado">Armazenado</option>
        </select>
      </div>

      {/* TABELA */}
      <div style={{ ...tableCard, backgroundColor: theme.bgCard, borderColor: theme.border, boxShadow: `0 24px 48px rgba(15,23,42,0.08)` }}>
        <div style={tableWrapper}>
          <table style={tableStyle}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bgBody }}>
              <th style={{ ...thStyle, width: '50px', textAlign: 'center' }}><Package size={16} /></th>
              <th style={thStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><MapPin size={14} /> BLOCO - UNIDADE</span></th>
              <th style={thStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><User size={14} /> NOME</span></th>
              <th style={thStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> DATA DE ENTRADA</span></th>
              <th style={thStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Paperclip size={14} /> NÚMERO FISCAL</span></th>
              <th style={thStyle}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><LayoutDashboard size={14} /> COD. INTERNO</span></th>
              <th style={thStyle}>STATUS</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '120px' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}><MoreVertical size={14} /> AÇÕES</span></th>
            </tr>
          </thead>
          <tbody>
            {loadingInitial ? (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: '40px 0' }}>
                  <Loader2 style={spinnerAnimation} /> Carregando encomendas...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...tdStyle, textAlign: 'center', padding: '32px 0', color: theme.textSecondary }}>
                  Nenhuma encomenda encontrada.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => {
                const unidade = formatBlockUnit(getCell(item, "ID_UNIDADE") || getCell(item, "id_unidade"));
                const nome = getCell(item, "NOME") || getCell(item, "nome");
                const dataEntrada = formatDateTime(getCell(item, "DATA_ENTRADA") || getCell(item, "data_entrada") || getCell(item, "DATA_RECEBIMENTO") || getCell(item, "data_recebimento"));
                const recebidoPor = getCell(item, "CREATE_USER") || getCell(item, "create_user") || "—";
                const numeroFiscal = getCell(item, "NUMERO_FISCAL") || getCell(item, "numero_fiscal") || "—";
                const identInterna = getCell(item, "IDENT_INTERNA") || getCell(item, "ident_interna") || "—";
                const status = (getCell(item, "STATUS") || getCell(item, "status") || "").toString().trim();
                const statusLabel = status ? status.toUpperCase() : "—";
                const statusColor = statusLabel === 'PENDENTE' ? '#92400e' : statusLabel === 'ENTREGUE' || statusLabel === 'RETIRADO' ? '#15803d' : statusLabel === 'ARMAZENADO' ? '#2563eb' : theme.text;
                const statusBg = statusLabel === 'PENDENTE' ? '#fef3c7' : statusLabel === 'ENTREGUE' || statusLabel === 'RETIRADO' ? '#dcfce7' : statusLabel === 'ARMAZENADO' ? '#dbeafe' : '#f3f4f6';
                const itemId = getCell(item, "COD_ENTREGA") || getCell(item, "cod_entrega") || getCell(item, "id") || `${item.unidade_id}-${item.nome}`;

                return (
                  <tr key={itemId} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}><Package size={16} color={theme.textSecondary} /></td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}><strong>{unidade || "—"}</strong></td>
                    <td style={tdStyle}>{nome || "—"}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{dataEntrada || "—"}</div>
                      <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '6px' }}>Recebido por {recebidoPor}</div>
                    </td>
                    <td style={tdStyle}>{numeroFiscal}</td>
                    <td style={tdStyle}>{identInterna}</td>
                    <td style={tdStyle}>
                      <span style={{ ...badgeStyle, backgroundColor: statusBg, color: statusColor }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleView(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, padding: '8px', borderRadius: '10px', transition: 'background 0.2s' }}
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO ESTILO PISCINA */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, backgroundColor: theme.bgCard, color: theme.text, maxWidth: '500px' }}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>{modalType === "add" ? "📦 Novo Recebimento" : "Editar Encomenda"}</h3>
              <X size={20} cursor="pointer" onClick={() => setShowModal(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '75vh', overflowY: 'auto', padding: '5px' }}>
              
              {/* CAMPO UNIDADE COM BUSCA FLUTUANTE */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <label style={labelStyle}>Unidade Destinatária</label>
                <div
                  style={{ ...selectStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: theme.bgBody, color: theme.text, borderColor: theme.border }}
                  onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                >
                  <span>{formData.id_unidade ? getUnitLabel(formData.id_unidade) : "Selecione a unidade..."}</span>
                  <ChevronDown size={16} />
                </div>

                {showUnitDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '8px', zIndex: 1200, boxShadow: '0 8px 16px rgba(0,0,0,0.2)', marginTop: '4px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px' }}>
                      <input
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${theme.border}`, backgroundColor: theme.bgBody, color: theme.text, boxSizing: 'border-box', outline: 'none' }}
                        placeholder="Digite o bloco ou apto..." autoFocus value={unitSearch} onChange={(e) => setUnitSearch(e.target.value)}
                      />
                    </div>
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {unidadesFiltradas.length > 0 ? (
                        unidadesFiltradas.map(u => (
                          <div key={u.id} style={{ padding: '10px 15px', cursor: 'pointer', fontSize: '14px', borderBottom: `1px solid ${theme.border}` }} onClick={() => handleUnitSelect(u.id)}>
                            BLOCO {u.bloco} - UNIDADE {u.unidade}
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '15px', textAlign: 'center', fontSize: '12px', opacity: 0.7 }}>Nenhuma unidade encontrada</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SELEÇÃO DE MORADOR (SE TIVER MAIS DE 1) */}
              {formData.id_unidade && moradoresDaUnidade.length > 1 && (
                <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#3b82f615', border: '1px solid #3b82f630' }}>
                  <label style={{ ...labelStyle, color: '#3b82f6' }}>Múltiplos moradores. Selecione o destinatário:</label>
                  <select 
                    style={{ ...selectStyle, width: '100%', backgroundColor: theme.bgBody, color: theme.text, borderColor: '#3b82f6' }}
                    value={formData.id_morador}
                    onChange={e => handleMoradorSelect(e.target.value)}
                  >
                    <option value="">Escolha o morador...</option>
                    {moradoresDaUnidade.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
              )}

              {/* NOME E TELEFONE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input 
                    style={{ ...selectStyle, width: '100%', backgroundColor: theme.bgBody, color: theme.text, borderColor: theme.border }} 
                    value={formData.nome} 
                    onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                  />
                </div>
                <div>
                  <label style={labelStyle}>Telefone</label>
                  <input 
                    style={{ 
                      ...selectStyle, width: '100%', 
                      backgroundColor: moradoresDaUnidade.length === 0 ? theme.bgCard : theme.bgBody, 
                      color: theme.text, borderColor: theme.border, 
                      opacity: moradoresDaUnidade.length === 0 ? 0.6 : 1 
                    }} 
                    value={formData.telefone} 
                    readOnly={moradoresDaUnidade.length === 0}
                    placeholder="(00) 00000-0000"
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })} 
                  />
                </div>
              </div>

              {/* REFERÊNCIAS DA ENCOMENDA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Referência Encomenda</label>
                  <input 
                    style={{ ...selectStyle, width: '100%', backgroundColor: theme.bgBody, color: theme.text, borderColor: theme.border }} 
                    value={formData.numero_fiscal}
                    placeholder="Número Fiscal"
                    onChange={e => setFormData({...formData, numero_fiscal: e.target.value})}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Identificação Interna</label>
                  <input 
                    style={{ ...selectStyle, width: '100%', backgroundColor: theme.bgBody, color: theme.text, borderColor: theme.border }} 
                    value={formData.ident_interna}
                    placeholder="ID interna"
                    onChange={e => setFormData({...formData, ident_interna: e.target.value})}
                  />
                </div>
              </div>

              {/* TRANSPORTADORA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Transportadora</label>
                  <div style={{ position: 'relative' }}>
                    <Truck size={14} style={{ position: 'absolute', left: '10px', top: '12px', opacity: 0.5 }} />
                    <input 
                      style={{ ...selectStyle, width: '100%', paddingLeft: '32px', backgroundColor: theme.bgBody, color: theme.text, borderColor: theme.border }} 
                      placeholder="Ex: Amazon, ML..."
                      value={formData.transportadora}
                      onChange={e => setFormData({...formData, transportadora: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE FOTO DA ENCOMENDA */}
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <label style={labelStyle}>Foto da Encomenda/Etiqueta</label>


                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                  <div style={{
                    width: '120px', height: '120px', borderRadius: '12px', border: `2px dashed ${theme.border}`,
                    backgroundColor: theme.bgBody, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {formData.fotosBase64.length > 0 ? (
                      <img src={formData.fotosBase64[0].src} alt="Encomenda" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={40} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                    )}
                  </div>

                  <input ref={photoInputRef} type="file" id="up-encomenda" accept="image/*" style={{ display: 'none' }} multiple onChange={handleFileChange} />
                  <label htmlFor="up-encomenda" style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: '#3b82f6', color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                    <Camera size={18} />
                  </label>

                  {formData.fotosBase64.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearPhotos}
                      style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {formData.fotosBase64.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {formData.fotosBase64.map((photo, index) => (
                        <div key={index} style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                          <img src={photo.src} alt={`Foto ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <button 
                style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                onClick={handleSave}
                disabled={loadingGlobal}
              >
                {loadingGlobal ? <Loader2 style={buttonSpinnerStyle} size={20}/> : <><CheckCircle2 size={20}/> Registrar Entrada</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewDetails && selectedDetails && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, backgroundColor: theme.bgCard, color: theme.text, maxWidth: '840px', width: '95%', maxHeight: '90vh', overflow: 'hidden' }}>
            <div style={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar color="#3b82f6" />
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Detalhes da Encomenda</div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '3px' }}>Visualize a etiqueta e os dados da entrega</div>
                </div>
              </div>
              <X size={20} cursor="pointer" onClick={() => { setShowViewDetails(false); setSelectedDetails(null); }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', padding: '10px 0', maxHeight: 'calc(90vh - 72px)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: theme.textSecondary, letterSpacing: '0.06em' }}>FOTO DA ETIQUETA ORIGINAL</div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary }}>
                    {getEntregaPhotoUrls(selectedDetails).length || 0} imagem{getEntregaPhotoUrls(selectedDetails).length === 1 ? '' : 'ens'}
                  </div>
                </div>
                <div style={{ position: 'relative', flex: 1, minHeight: '320px', borderRadius: '20px', overflow: 'hidden', border: `1px solid ${theme.border}`, backgroundColor: theme.bgBody, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getEntregaPhotoUrls(selectedDetails).length > 0 ? (
                    <>
                      <img
                        src={converterLinkDrive(getEntregaPhotoUrls(selectedDetails)[selectedPhotoIndex])}
                        alt="Encomenda"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {getEntregaPhotoUrls(selectedDetails).length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoIndex((prev) => (prev === 0 ? getEntregaPhotoUrls(selectedDetails).length - 1 : prev - 1))}
                            style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(15, 23, 42, 0.75)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >‹</button>
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoIndex((prev) => (prev === getEntregaPhotoUrls(selectedDetails).length - 1 ? 0 : prev + 1))}
                            style={{ position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(15, 23, 42, 0.75)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >›</button>
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <Package size={56} color={theme.textSecondary} />
                    </div>
                  )}
                </div>
                {getEntregaPhotoUrls(selectedDetails).length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
                    {getEntregaPhotoUrls(selectedDetails).map((_, idx) => (
                      <span key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === selectedPhotoIndex ? theme.text : theme.textSecondary, opacity: idx === selectedPhotoIndex ? 1 : 0.4 }} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', minHeight: 0 }}>
                <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border, display: 'grid', gap: '12px' }}>
                  <div><strong style={{ display: 'block', color: theme.textSecondary }}>Destinatário</strong></div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text }}>{getCell(selectedDetails, 'NOME') || '-'}</div>
                  <div style={{ fontSize: '13px', color: theme.textSecondary }}>{formatBlockUnit(getCell(selectedDetails, 'ID_UNIDADE') || getCell(selectedDetails, 'id_unidade')) || '-'}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div><strong style={{ color: theme.textSecondary }}>Telefone</strong><div style={{ marginTop: '4px', color: theme.textSecondary }}>{getCell(selectedDetails, 'TELEFONE') || getCell(selectedDetails, 'telefone') || '-'}</div></div>
                    <div><strong style={{ color: theme.textSecondary }}>Transportadora</strong><div style={{ marginTop: '4px', color: theme.textSecondary }}>{getCell(selectedDetails, 'TRANSPORTADORA') || getCell(selectedDetails, 'transportadora') || '-'}</div></div>
                  </div>
                </div>

                <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border, display: 'grid', gap: '12px' }}>
                  <div><strong style={{ display: 'block', color: theme.textSecondary }}>Dados de Entrada</strong></div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div><strong>Status:</strong> <span style={{ textTransform: 'uppercase', color: theme.textSecondary }}>{(getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '-').toString().toUpperCase()}</span></div>
                    <div><strong>Data:</strong> <span style={{ color: theme.textSecondary }}>{formatDateTime(getCell(selectedDetails, 'DATA_ENTRADA') || getCell(selectedDetails, 'data_entrada') || getCell(selectedDetails, 'DATA_RECEBIMENTO') || getCell(selectedDetails, 'data_recebimento')) || '-'}</span></div>
                    <div><strong>Cód. Interno:</strong> <span style={{ color: theme.textSecondary }}>{getCell(selectedDetails, 'IDENT_INTERNA') || getCell(selectedDetails, 'ident_interna') || '-'}</span></div>
                    <div><strong>Fiscal:</strong> <span style={{ color: theme.textSecondary }}>{getCell(selectedDetails, 'NUMERO_FISCAL') || getCell(selectedDetails, 'numero_fiscal') || '-'}</span></div>
                  </div>
                </div>

                <div style={{ ...viewBox, backgroundColor: theme.bg, borderColor: theme.border }}>
                  <strong style={{ color: theme.textSecondary }}>Observações</strong>
                  <div style={{ marginTop: 8, color: theme.textSecondary, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', fontSize: '0.93rem', lineHeight: 1.5 }}>
                    {getCell(selectedDetails, 'OBS') || getCell(selectedDetails, 'observacoes') || getCell(selectedDetails, 'obs') || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleBaixa(selectedDetails)}
                    disabled={(getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase() === 'RETIRADO'}
                    style={{
                      width: '100%', maxWidth: '320px', padding: '14px 18px', borderRadius: '14px', border: 'none',
                      backgroundColor: (getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase() === 'RETIRADO' ? '#f3f4f6' : '#22c55e',
                      color: (getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase() === 'RETIRADO' ? theme.textSecondary : 'white',
                      fontWeight: 700,
                      cursor: (getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase() === 'RETIRADO' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {(getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase() === 'RETIRADO' ? 'Já Retirado' : 'Confirmar Retirada'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWhatsappPrompt && pendingWhatsapp && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, backgroundColor: theme.bgCard, color: theme.text, maxWidth: '520px', width: '95%' }}>
            <div style={modalHeader}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>Enviar código por WhatsApp?</div>
                <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '4px' }}>Notifique o morador com a referência e o código de retirada.</div>
              </div>
              <X size={20} cursor="pointer" onClick={handleCancelWhatsapp} />
            </div>
            <div style={{ padding: '10px 0' }}>
              <p style={{ margin: 0, color: theme.textSecondary, lineHeight: 1.6 }}>
                Deseja enviar uma mensagem para <strong>{pendingWhatsapp.phone}</strong> informando que a encomenda chegou e que ele deve usar o código <strong>{pendingWhatsapp.cod || '...'}</strong> para retirá-la?
              </p>
              {whatsappCodLoading && (
                <p style={{ margin: '10px 0 0', color: theme.textSecondary, fontSize: '13px' }}>Aguardando o código gerado na planilha...</p>
              )}
              {pendingWhatsapp.cod === null && !whatsappCodLoading && (
                <p style={{ margin: '10px 0 0', color: '#f97316', fontSize: '13px' }}>Não foi possível recuperar o código ainda. Aguarde alguns segundos e tente novamente.</p>
              )}
              <div style={{ marginTop: '18px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancelWhatsapp}
                  style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, padding: '12px 18px', borderRadius: '12px', cursor: 'pointer' }}
                >Não</button>
                <button
                  type="button"
                  onClick={handleSendWhatsapp}
                  disabled={whatsappCodLoading || pendingWhatsapp?.cod === null || !pendingWhatsapp?.cod}
                  style={{ backgroundColor: whatsappCodLoading || pendingWhatsapp?.cod === null || !pendingWhatsapp?.cod ? '#94a3b8' : '#25d366', color: 'white', border: 'none', padding: '12px 18px', borderRadius: '12px', cursor: whatsappCodLoading || pendingWhatsapp?.cod === null || !pendingWhatsapp?.cod ? 'not-allowed' : 'pointer' }}
                >{whatsappCodLoading ? 'Aguardando código...' : 'Sim, enviar WhatsApp'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}