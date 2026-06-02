 
 
import React, { useState, useEffect, useRef } from "react";
import { 
  Package, Search, Plus, Edit2, Trash2, X, Loader2, 
  MoreVertical, Eye, Box, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, 
  User, Paperclip, Truck, History, Calendar, LayoutDashboard,
  ChevronDown, UploadCloud, Camera, MapPin, Archive
} from "lucide-react";
import { useTheme } from "../App";

const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";
const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;

// --- ESTILOS ---
const pageContainer = { padding: "20px", maxWidth: "1200px", margin: "0 auto" };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' };
const tableCard = { borderRadius: '16px', border: '1px solid', overflow: 'hidden', marginTop: '20px' };
const tableWrapper = { width: '100%', overflowX: 'auto' };
const tableStyle = { width: '100%', minWidth: '1100px', borderCollapse: 'collapse', tableLayout: 'auto' };
const thStyle = { textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdStyle = { padding: '16px 24px', fontSize: '14px', wordBreak: 'break-word', verticalAlign: 'middle' };
const badgeStyle = { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' };
const paginationFooter = { padding: '15px 24px', borderTop: '1px solid', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }; 

const modalOverlay = { 
  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
  backgroundColor: 'rgba(0, 0, 0, 0.7)', // Mais escuro para destacar no Dark Mode
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000,
  padding: '16px', boxSizing: 'border-box',
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
  const [photoSrc, setPhotoSrc] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] = useState(false);
  const [confirmDeliveryCode, setConfirmDeliveryCode] = useState("");
  const [deliveryItem, setDeliveryItem] = useState(null);
  const [entregaFotos, setEntregaFotos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pendente");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showWhatsappPrompt, setShowWhatsappPrompt] = useState(false);
  const [pendingWhatsapp, setPendingWhatsapp] = useState(null);
  const [whatsappCodLoading, setWhatsappCodLoading] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const dropdownRef = useRef(null);
  const photoInputRef = useRef(null);
  const deliveryPhotoInputRef = useRef(null);
  const photoCacheRef = useRef(new Map()); // cache fileId -> dataURL (evita re-baixar)

  // Estados para confirmação de entrega com foto
  const [deliveryPhotoBase64, setDeliveryPhotoBase64] = useState(null);
  const [deliveryNomeMorador, setDeliveryNomeMorador] = useState("");
  const [deliveryLoadingUpload, setDeliveryLoadingUpload] = useState(false);

  const [formErrors, setFormErrors] = useState({});

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
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.id_unidade) errors.id_unidade = "Selecione a unidade destinária.";
    if (!formData.nome.trim()) errors.nome = "Nome do destinatário é obrigatório.";
    if (!formData.numero_fiscal.trim()) errors.numero_fiscal = "Número fiscal é obrigatório.";
    if (formData.fotosBase64.length === 0) errors.foto = "Pelo menos uma foto é obrigatória.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => { fetchData(); }, []);

  // Carrega a foto selecionada via backend (getFoto -> base64), sem depender de
  // compartilhamento/links públicos do Drive (que falham ao exibir em <img>).
  useEffect(() => {
    if (!showViewDetails || !selectedDetails) {
      setPhotoSrc(null);
      setPhotoLoading(false);
      return;
    }
    const fileIds = getEntregaPhotoFileIds(selectedDetails);
    const fileId = fileIds[selectedPhotoIndex];
    if (!fileId) {
      setPhotoSrc(null);
      setPhotoLoading(false);
      return;
    }
    // Adianta o carregamento das demais fotos da encomenda (navegação instantânea).
    fileIds.forEach((fid) => { if (fid !== fileId) fetchFotoCached(fid); });

    // Acerto de cache → mostra na hora, sem spinner.
    const cached = photoCacheRef.current.get(fileId);
    if (cached) {
      setPhotoSrc(cached);
      setPhotoLoading(false);
      return;
    }
    let cancelled = false;
    setPhotoLoading(true);
    setPhotoSrc(null);
    fetchFotoCached(fileId).then((src) => {
      if (cancelled) return;
      setPhotoSrc(src);
      setPhotoLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showViewDetails, selectedDetails, selectedPhotoIndex, entregaFotos]);

  const fetchData = async () => {
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

  const normalizeWhatsappPhone = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.startsWith("55")) return digits;
    return digits.length >= 10 ? `55${digits}` : digits;
  };

  const formatPhoneBR = (value) => {
    if (!value) return "";
    const digits = value.toString().replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    const ddd = digits.slice(0,2);
    const rest = digits.slice(2);
    if (rest.length <= 5) return `(${ddd})${rest}`;
    return `(${ddd})${rest.slice(0,5)}-${rest.slice(5,9)}`;
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

  // Busca leve: somente a aba ENTREGAS (usada no fallback de polling do código)
  const fetchEntregasOnly = async () => {
    try {
      const res = await fetch(`${API_URL}?token=${TOKEN}&sheet=ENTREGAS`).then(r => r.json());
      return Array.isArray(res) ? res : [];
    } catch (e) {
      console.warn("fetchEntregasOnly: erro ao buscar ENTREGAS", e);
      return [];
    }
  };

  const waitForRealCod = async (createDateToken) => {
    let savedEncomendas = [];
    const maxAttempts = 25;
    const delayBetweenAttempts = 2000; // 2 segundos
    const maxTotalTime = 60000; // 1 minuto
    const startTime = Date.now();

    const getEntryMatchKey = (entry) => {
      return getCell(entry, "CREATE_DATE") || getCell(entry, "create_date") || getCell(entry, "created_at") || getCell(entry, "ID") || getCell(entry, "id");
    };

    const getEntryCode = (entry) => {
      return getCell(entry, "COD") || getCell(entry, "cod") || getCell(entry, "COD_ENTREGA") || getCell(entry, "cod_entrega") || getCell(entry, "ID") || getCell(entry, "id");
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

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (Date.now() - startTime > maxTotalTime) {
        console.log(`waitForRealCod: tempo máximo atingido após ${attempt} tentativas.`);
        break;
      }

      // Checa imediatamente (sem esperar antes) e baixa só a aba ENTREGAS
      savedEncomendas = await fetchEntregasOnly();
      let novoRegistro = savedEncomendas.find((entry) => {
        return getEntryMatchKey(entry)?.toString() === createDateToken.toString();
      });

      if (!novoRegistro) {
        novoRegistro = findNewestEntry(savedEncomendas);
      }

      if (novoRegistro) {
        const codEncontrado = getEntryCode(novoRegistro);
        if (codEncontrado) {
          return { savedEncomendas, codReal: codEncontrado };
        }
      }

      await sleep(delayBetweenAttempts);
    }

    return { savedEncomendas, codReal: null };
  };

  function getEntregaPhotoRows(item) {
    // As fotos (etiqueta do cadastro E comprovação da baixa) são gravadas na ENTREGAS_FOTO
    // com ID_ENTREGA = id numérico da entrega. Casamos por esse id; mantemos o cod_entrega
    // como fallback apenas para registros antigos que possam ter sido salvos pelo código.
    const itemId = (getCell(item, "id") || getCell(item, "ID") || "").toString();
    const itemCodEntrega = (getCell(item, "COD_ENTREGA") || getCell(item, "cod_entrega") || "").toString();
    const chaves = [itemId, itemCodEntrega].filter(Boolean);
    const rows = entregaFotos.filter((row) => {
      const rowId = (getCell(row, "ID_ENTREGA") || getCell(row, "id_entrega") || getCell(row, "id") || "").toString();
      return chaves.indexOf(rowId) !== -1;
    });
    return rows;
  }

  function getEntregaPhotoUrls(item) {
    return getEntregaPhotoRows(item).map((row) => {
      const driveUrl = getCell(row, "URL_DRIVE") || getCell(row, "url_drive");
      const fileId = getCell(row, "FILE_ID") || getCell(row, "file_id");
      if (driveUrl) return driveUrl;
      if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId}`;
      return null;
    }).filter(Boolean);
  }

  // Pega os FILE_ID das fotos (na mesma ordem das URLs), p/ buscar a imagem via backend.
  function getEntregaPhotoFileIds(item) {
    return getEntregaPhotoRows(item).map((row) => {
      const fileId = getCell(row, "FILE_ID") || getCell(row, "file_id");
      if (fileId) return fileId.toString();
      const driveUrl = getCell(row, "URL_DRIVE") || getCell(row, "url_drive");
      const m = driveUrl ? driveUrl.toString().match(/[-\w]{25,}/) : null;
      return m ? m[0] : null;
    }).filter(Boolean);
  }

  // Busca a foto pelo backend com cache (re-aberturas ficam instantâneas).
  const fetchFotoCached = async (fileId) => {
    if (!fileId) return null;
    const cache = photoCacheRef.current;
    if (cache.has(fileId)) return cache.get(fileId);
    try {
      const d = await fetch(`${API_URL}?token=${TOKEN}&action=getFoto&fileId=${encodeURIComponent(fileId)}`).then((r) => r.json());
      const src = d && d.success && d.base64 ? `data:${d.contentType || "image/jpeg"};base64,${d.base64}` : null;
      if (src) cache.set(fileId, src);
      return src;
    } catch {
      return null;
    }
  };

  // Pré-carrega todas as fotos de uma encomenda (chamado ao passar o mouse/tocar em "Ver detalhes").
  const prefetchItemPhotos = (item) => {
    if (!item) return;
    getEntregaPhotoFileIds(item).forEach((fileId) => { fetchFotoCached(fileId); });
  };

  const selectedPhotoUrls = selectedDetails ? getEntregaPhotoUrls(selectedDetails) : [];

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
    if (!validateForm()) {
      setLoadingGlobal(false);
      return;
    }

    setLoadingGlobal(true);

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
        nome: formData.nome.trim(),
        telefone: formData.telefone.trim(),
        transportadora: formData.transportadora.trim(),
        numero_fiscal: formData.numero_fiscal || "",
        ident_interna: formData.ident_interna || "",
        create_date: createDateToken,
        data_recebimento: formData.data_recebimento,
        status: formData.status,
        imagens: listaImagens
      }
    };

    // CAMINHO RÁPIDO: o Apps Script já devolve o código gerado na resposta do "add".
    // Sem "no-cors" conseguimos ler essa resposta (o /exec redireciona para
    // googleusercontent, que libera CORS) e pegar o código na hora.
    let codFromResponse = null;
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      });
      try {
        const json = await response.json();
        if (json?.cod) codFromResponse = json.cod;
      } catch (readErr) {
        console.warn("Não foi possível ler o código direto da resposta, usando fallback:", readErr);
      }
    } catch (networkErr) {
      // Falha ao ler (CORS/rede): a gravação provavelmente ocorreu (igual ao antigo no-cors).
      // Seguimos em modo otimista e buscamos o código via polling.
      console.warn("Falha ao ler resposta do cadastro (modo otimista):", networkErr);
    }

    // Fechar modal de cadastro e abrir prompt do WhatsApp imediatamente
    setShowModal(false);

    const phoneExists = formData.telefone && formData.telefone.toString().trim();
    if (phoneExists) {
      setPendingWhatsapp({
        phone: formData.telefone,
        referencia: formData.numero_fiscal || "sem referência",
        cod: codFromResponse || "..."
      });
      setWhatsappCodLoading(!codFromResponse);
      setShowWhatsappPrompt(true);
    }

    resetForm();
    await fetchData();
    setLoadingGlobal(false);

    // Só faz polling se NÃO conseguimos o código direto da resposta
    if (phoneExists && !codFromResponse) {
      waitForRealCod(createDateToken).then((result) => {
        setWhatsappCodLoading(false);
        setPendingWhatsapp((prev) => prev ? { ...prev, cod: result.codReal || null } : prev);
      }).catch(() => {
        setWhatsappCodLoading(false);
        setPendingWhatsapp((prev) => prev ? { ...prev, cod: null } : prev);
      });
    }
  };

  const handleResendWhatsapp = async (item) => {
    const phone = getCell(item, 'TELEFONE') || getCell(item, 'telefone');
    if (!phone) {
      alert('Não há telefone cadastrado para este destinatário.');
      return;
    }

    const referencia = getCell(item, 'NUMERO_FISCAL') || getCell(item, 'numero_fiscal') || 'sem referência';
    const existingCod = getCell(item, 'COD') || getCell(item, 'cod') || getCell(item, 'COD_ENTREGA') || getCell(item, 'cod_entrega');

    if (existingCod) {
      setPendingWhatsapp({ phone, referencia, cod: existingCod });
      setWhatsappCodLoading(false);
      setShowWhatsappPrompt(true);
      return;
    }

    const createDateToken = getCell(item, 'CREATE_DATE') || getCell(item, 'create_date') || getCell(item, 'created_at');
    setPendingWhatsapp({ phone, referencia, cod: '...' });
    setWhatsappCodLoading(true);
    setShowWhatsappPrompt(true);

    try {
      const result = await waitForRealCod(createDateToken);
      setWhatsappCodLoading(false);
      if (result.codReal) {
        setPendingWhatsapp((prev) => prev ? { ...prev, cod: result.codReal } : prev);
      } else {
        setPendingWhatsapp((prev) => prev ? { ...prev, cod: null } : prev);
      }
    } catch {
      setWhatsappCodLoading(false);
      setPendingWhatsapp((prev) => prev ? { ...prev, cod: null } : prev);
    }
  };

  const handleView = (item) => {
    setSelectedDetails(item);
    setSelectedPhotoIndex(0);
    setShowViewDetails(true);
  };

  const handleDeliveryPhotoCapture = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setDeliveryPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleClearDeliveryPhoto = () => {
    setDeliveryPhotoBase64(null);
  };

  const handleBaixa = (item) => {
    setDeliveryItem(item);
    setConfirmDeliveryCode("");
    setShowConfirmDeliveryModal(true);
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryItem) return;
    const codigoInserido = confirmDeliveryCode.toString().trim().toUpperCase();
    const nomeMorador = deliveryNomeMorador.toString().trim();
    
    if (!codigoInserido || !nomeMorador) return;

    // Autorização da baixa: o código digitado deve ser igual ao COD gerado no cadastro.
    const codGerado = (getCell(deliveryItem, "COD") || getCell(deliveryItem, "cod") || "").toString().trim().toUpperCase();
    if (codGerado && codigoInserido !== codGerado) {
      alert("O código informado não confere com o código de retirada da encomenda.");
      return;
    }

    setDeliveryLoadingUpload(true);
    
    const itemCod = getCell(deliveryItem, "COD_ENTREGA") || getCell(deliveryItem, "cod_entrega") || getCell(deliveryItem, "id");
    const novoStatus = "Entregue";
    const horarioSaida = new Date().toISOString();
    
    // 1. Atualizar state local
    const updated = encomendas.map((entry) => {
      const entryCod = getCell(entry, "COD_ENTREGA") || getCell(entry, "cod_entrega") || getCell(entry, "id");
      if (entryCod === itemCod) {
        return {
          ...entry,
          STATUS: novoStatus,
          status: novoStatus,
          COD_ENTREGA: codigoInserido,
          cod_entrega: codigoInserido,
          ENTREGUE_POR: user?.nome || "Sistema",
          entregue_por: user?.nome || "Sistema",
          NOME_MORADOR: nomeMorador,
          nome_morador: nomeMorador,
          DATA_SAIDA: horarioSaida,
          data_saida: horarioSaida
        };
      }
      return entry;
    });
    
    setEncomendas(updated);
    
    if (selectedDetails) {
      const selectedCod = getCell(selectedDetails, "COD_ENTREGA") || getCell(selectedDetails, "cod_entrega") || getCell(selectedDetails, "id");
      if (selectedCod === itemCod) {
        setSelectedDetails((prev) => ({
          ...prev,
          STATUS: novoStatus,
          status: novoStatus,
          COD_ENTREGA: codigoInserido,
          cod_entrega: codigoInserido,
          ENTREGUE_POR: user?.nome || "Sistema",
          entregue_por: user?.nome || "Sistema",
          NOME_MORADOR: nomeMorador,
          nome_morador: nomeMorador,
          DATA_SAIDA: horarioSaida,
          data_saida: horarioSaida
        }));
      }
    }

    try {
      // 2. Atualizar ENTREGAS no Google Sheets
      // ATENÇÃO: o backend casa pela coluna A (id sequencial) e reescreve a linha INTEIRA
      // usando chaves em minúsculo. Por isso enviamos o id numérico correto e reenviamos
      // os dados originais da encomenda — caso contrário eles seriam apagados na planilha.
      const serverId = getCell(deliveryItem, "id") || itemCod;

      // Foto de comprovação (opcional): vai no próprio "edit". O backend salva na pasta
      // PASTA_FOTOS_ENTREGA_MORADOR e preenche NOME_ARQUIVO/URL_DRIVE/FILE_ID (colunas O/P/Q).
      const imagensBaixa = deliveryPhotoBase64
        ? [{
            base64: deliveryPhotoBase64,
            contentType: (deliveryPhotoBase64.split(";")[0].split(":")[1]) || "image/jpeg"
          }]
        : [];

      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          token: TOKEN,
          action: "edit",
          sheet: "ENTREGAS",
          id: serverId,
          user: user?.nome || "Sistema",
          data: {
            // Preserva os dados originais (o backend sobrescreve a linha toda)
            id_unidade: getCell(deliveryItem, "id_unidade") || "",
            id_morador: getCell(deliveryItem, "id_morador") || "",
            nome: getCell(deliveryItem, "nome") || "",
            telefone: getCell(deliveryItem, "telefone") || "",
            numero_fiscal: getCell(deliveryItem, "numero_fiscal") || "",
            transportadora: getCell(deliveryItem, "transportadora") || "",
            ident_interna: getCell(deliveryItem, "ident_interna") || "",
            // Dados da baixa/entrega
            status: novoStatus,
            data_saida: horarioSaida,
            entregue_por: user?.nome || "Sistema",
            nome_morador: nomeMorador,
            cod_entrega: codigoInserido,   // COD_ENTREGA (coluna M)
            imagens: imagensBaixa          // foto -> pasta + NOME_ARQUIVO/URL_DRIVE/FILE_ID
          }
        })
      });

      console.log("Entrega confirmada com sucesso");
      setShowConfirmDeliveryModal(false);
      setDeliveryItem(null);
      setConfirmDeliveryCode("");
      setDeliveryPhotoBase64(null);
      setDeliveryNomeMorador("");
      
      // Recarregar dados
      await fetchData();
      
    } catch (error) {
      console.error("Erro ao confirmar entrega:", error);
      alert("Erro ao confirmar entrega. Tente novamente.");
    } finally {
      setDeliveryLoadingUpload(false);
    }
  };

  const handleSendWhatsapp = () => {
    if (!pendingWhatsapp) return;
    const url = getWhatsappUrl(pendingWhatsapp);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setShowWhatsappPrompt(false);
    setPendingWhatsapp(null);
  };

  const handleCancelWhatsapp = () => {
    setShowWhatsappPrompt(false);
    setPendingWhatsapp(null);
  };

  // Verdadeiro se a encomenda está Pendente há mais de 7 dias corridos (deve ir ao Armazém).
  const isAtrasadoArmazenar = (item) => {
    const status = (getCell(item, "STATUS") || getCell(item, "status") || "").toString();
    if (status !== "Pendente") return false;
    const dataRaw = getCell(item, "DATA_ENTRADA") || getCell(item, "data_entrada")
      || getCell(item, "DATA_RECEBIMENTO") || getCell(item, "data_recebimento");
    if (!dataRaw) return false;
    const dataEntrada = new Date(dataRaw);
    if (Number.isNaN(dataEntrada.getTime())) return false;
    const diffDias = (Date.now() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24);
    return diffDias > 7;
  };

  const isMesmoDiaQueHoje = (raw) => {
    if (!raw) return false;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return false;
    const hoje = new Date();
    return d.getFullYear() === hoje.getFullYear()
      && d.getMonth() === hoje.getMonth()
      && d.getDate() === hoje.getDate();
  };

  const isEntregue = (item) => {
    const s = (getCell(item, "STATUS") || getCell(item, "status") || "").toString().toUpperCase();
    return s === "ENTREGUE" || s === "RETIRADO";
  };

  // Dashboard Stats
  const stats = {
    pendentes: encomendas.filter(e => getCell(e, "STATUS") === "Pendente").length,
    entreguesHoje: encomendas.filter(e =>
      isEntregue(e) && isMesmoDiaQueHoje(getCell(e, "DATA_SAIDA") || getCell(e, "data_saida"))
    ).length,
    armazenados: encomendas.filter(e => getCell(e, "STATUS") === "Armazenado").length,
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

  const totalPages = itemsPerPage === "Todos" ? 1 : Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentPageSafe = Math.min(Math.max(currentPage, 1), totalPages);
  const pageData = itemsPerPage === "Todos"
    ? filteredData
    : filteredData.slice((currentPageSafe - 1) * itemsPerPage, currentPageSafe * itemsPerPage);

  const getItemDisplay = (item) => {
    const unidade = formatBlockUnit(getCell(item, "ID_UNIDADE") || getCell(item, "id_unidade"));
    const nome = getCell(item, "NOME") || getCell(item, "nome");
    const dataEntrada = formatDateTime(getCell(item, "DATA_ENTRADA") || getCell(item, "data_entrada") || getCell(item, "DATA_RECEBIMENTO") || getCell(item, "data_recebimento"));
    const recebidoPor = getCell(item, "CREATE_USER") || getCell(item, "create_user") || "—";
    const numeroFiscal = getCell(item, "NUMERO_FISCAL") || getCell(item, "numero_fiscal") || "—";
    const identInterna = getCell(item, "IDENT_INTERNA") || getCell(item, "ident_interna") || "—";
    const status = (getCell(item, "STATUS") || getCell(item, "status") || "").toString().trim();
    const statusLabel = status ? status.toUpperCase() : "—";
    const statusColor = statusLabel === 'PENDENTE' ? '#92400e' : (statusLabel === 'ENTREGUE' || statusLabel === 'RETIRADO') ? '#15803d' : statusLabel === 'ARMAZENADO' ? '#2563eb' : theme.text;
    const statusBg = statusLabel === 'PENDENTE' ? '#fef3c7' : (statusLabel === 'ENTREGUE' || statusLabel === 'RETIRADO') ? '#dcfce7' : statusLabel === 'ARMAZENADO' ? '#dbeafe' : '#f3f4f6';
    const itemId = getCell(item, "COD_ENTREGA") || getCell(item, "cod_entrega") || getCell(item, "id") || `${item.unidade_id}-${item.nome}`;
    return { unidade, nome, dataEntrada, recebidoPor, numeroFiscal, identInterna, statusLabel, statusColor, statusBg, itemId };
  };

  return (
    <div style={{ ...pageContainer, backgroundColor: theme.bgBody, color: theme.text }}>
      <style>{`
        @keyframes ${spinnerKeyframeName} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes encomendas-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .encomendas-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; }
        .enc-new-btn { transition: transform .15s ease, box-shadow .2s ease, filter .2s ease; }
        .enc-new-btn:hover { filter: brightness(1.05); transform: translateY(-1px); box-shadow: 0 8px 18px rgba(59,130,246,0.35); }
        .encomendas-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .enc-stat-card { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .enc-stat-card:hover { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(15,23,42,0.10); }
        .encomendas-filters { display: flex; gap: 15px; margin-bottom: 20px; }
        .encomendas-modal-content { width: min(100%, 520px); }
        .encomendas-form-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 10px; }
        .encomendas-photo-actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
        .encomendas-table-card { border-radius: 16px; border: 1px solid; overflow: hidden; margin-top: 20px; }
        .encomendas-table-wrapper { width: 100%; overflow-x: auto; }
        .encomendas-table { width: 100%; min-width: 900px; border-collapse: collapse; table-layout: auto; }
        .encomendas-table tbody tr { transition: background .15s ease; }
        .encomendas-table tbody tr:hover { background: ${theme.isDark ? 'rgba(148,163,184,0.07)' : 'rgba(59,130,246,0.04)'}; }
        .enc-details-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 22px; padding: 22px 24px; overflow-y: auto; flex: 1; min-height: 0; }
        .enc-mobile-list { display: none; }
        @keyframes enc-modal-in { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .enc-modal { display: flex; flex-direction: column; max-height: 92vh; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.35); animation: enc-modal-in .22s cubic-bezier(.16,1,.3,1); }
        .enc-modal-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 22px; border-bottom: 1px solid; flex-shrink: 0; }
        .enc-modal-body { padding: 20px 22px; overflow-y: auto; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 16px; }
        .enc-modal-footer { padding: 14px 22px; border-top: 1px solid; flex-shrink: 0; }
        .enc-close-btn { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid; background: none; transition: background .2s ease, color .2s ease; flex-shrink: 0; }
        .enc-close-btn:hover { background: rgba(239,68,68,0.12); color: #ef4444 !important; }
        .enc-section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 8px; }
        .enc-modal-body input:focus, .enc-modal-body select:focus, .enc-details-grid input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important; }
        .enc-field-card { border-radius: 14px; border: 1px solid; padding: 16px; }
        .enc-card { animation: encomendas-fade .25s ease; transition: transform .15s ease, box-shadow .2s ease; }
        .enc-card:active { transform: scale(0.99); }
        .enc-ver-btn { transition: background .2s ease, border-color .2s ease, color .2s ease; }
        .enc-ver-btn:hover { background: ${theme.isDark ? 'rgba(148,163,184,0.10)' : 'rgba(59,130,246,0.06)'} !important; border-color: #3b82f6 !important; color: #3b82f6 !important; }
        .encomendas-error { color: #dc2626; font-size: 12px; margin-top: 4px; }
        .pagination-btn { background: none; border: 1px solid ${theme.border}; color: ${theme.text}; padding: 6px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        @media (max-width: 768px) {
          .encomendas-header { flex-direction: column; align-items: stretch; }
          .enc-new-btn { width: 100%; justify-content: center; }
          .encomendas-stats { grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px; }
          .encomendas-filters { flex-direction: column; align-items: stretch; gap: 10px; }
          .encomendas-form-grid { grid-template-columns: 1fr; }
          .encomendas-modal-content { width: 100%; }
          .enc-modal { width: 100%; max-width: 100% !important; max-height: 94vh; border-radius: 18px; }
          .enc-modal-header { padding: 16px 18px; }
          .enc-modal-body { padding: 16px 18px; }
          .enc-modal-footer { padding: 14px 18px; }
          .enc-desktop-table { display: none; }
          .enc-mobile-list { display: flex; flex-direction: column; gap: 12px; padding: 14px; }
          .enc-details-grid { grid-template-columns: 1fr; gap: 16px; padding: 16px 18px; }
          .encomendas-photo-actions { flex-direction: column; }
          .encomendas-footer-buttons { flex-direction: column; }
        }
      `}</style>
      <header className="encomendas-header" style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Gestão de Encomendas</h1>
          <p style={{ color: theme.textSecondary, fontSize: '14px' }}>Controle de recebimento e entrega de volumes</p>
        </div>
        <button className="enc-new-btn" onClick={() => { resetForm(); setModalType("add"); setShowModal(true); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59,130,246,0.30)' }}>
          <Plus size={18} /> Novo Recebimento
        </button>
      </header>

      {/* DASHBOARD */}
      <div className="encomendas-stats">
        {[
          { label: 'Aguardando Retirada', value: stats.pendentes, Icon: Box, color: '#f59e0b' },
          { label: 'Entregues Hoje', value: stats.entreguesHoje, Icon: CheckCircle2, color: '#22c55e' },
          { label: 'Armazenados', value: stats.armazenados, Icon: Archive, color: '#2563eb' },
          { label: 'Total de Volumes', value: stats.volumes, Icon: Truck, color: '#3b82f6' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="enc-stat-card"
            style={{
              backgroundColor: theme.bgCard,
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: stat.color }} />
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${stat.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.Icon size={24} color={stat.color} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: theme.textSecondary, fontSize: '13px', fontWeight: '600' }}>{stat.label}</span>
              <span style={{ fontSize: '28px', fontWeight: '800', color: theme.text, lineHeight: 1.1 }}>{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="encomendas-filters" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', borderRadius: '8px', border: '1px solid', borderColor: theme.border, backgroundColor: theme.bgCard }}>
          <Search size={18} color={theme.textSecondary} />
          <input placeholder="Buscar por unidade ou morador..." style={{ border: 'none', background: 'none', padding: '10px 0', outline: 'none', color: theme.text, width: '100%' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: theme.border, backgroundColor: theme.bgCard, color: theme.text }}>
          <option value="Todos">Todos Status</option>
          <option value="Pendente">Aguardando Retirada</option>
          <option value="Entregue">Entregue</option>
          <option value="Armazenado">Armazenado</option>
        </select>
      </div>

      {/* TABELA */}
      <div className="encomendas-table-card" style={{ ...tableCard, backgroundColor: theme.mainBg, borderColor: theme.border, boxShadow: `0 24px 48px rgba(15,23,42,0.08)` }}>
        <div className="encomendas-table-wrapper enc-desktop-table" style={tableWrapper}>
          <table className="encomendas-table" style={tableStyle}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.isDark ? '#1e293b' : '#f8fafc' }}>
              <th style={{ ...thStyle, width: '48px', textAlign: 'center', color: theme.textSecondary }}><Package size={16} /></th>
              <th style={{ ...thStyle, width: '170px', color: theme.textSecondary }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}><MapPin size={14} /> BLOCO - UNIDADE</span></th>
              <th style={{ ...thStyle, width: '170px', color: theme.textSecondary }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><User size={14} /> NOME</span></th>
              <th style={{ ...thStyle, width: '170px', color: theme.textSecondary }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> DATA DE ENTRADA</span></th>
              <th style={{ ...thStyle, width: '150px', color: theme.textSecondary }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Paperclip size={14} /> NÚMERO FISCAL</span></th>
              <th style={{ ...thStyle, width: '130px', color: theme.textSecondary }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><LayoutDashboard size={14} /> COD. INTERNO</span></th>
              <th style={{ ...thStyle, width: '110px', color: theme.textSecondary, textAlign: 'center' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><CheckCircle2 size={14} /> STATUS</span></th>
              <th style={{ ...thStyle, textAlign: 'center', width: '120px', color: theme.textSecondary }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><MoreVertical size={14} /> AÇÕES</span></th>
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
              pageData.map((item) => {
                const { unidade, nome, dataEntrada, recebidoPor, numeroFiscal, identInterna, statusLabel, statusColor, statusBg, itemId } = getItemDisplay(item);

                return (
                  <tr key={itemId} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {(() => {
                        const alerta = isAtrasadoArmazenar(item);
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={alerta ? "Há mais de 7 dias — armazenar no Armazém" : ""}>
                            <Package size={16} color={alerta ? '#ef4444' : theme.textSecondary} />
                            {alerta && <AlertCircle size={14} color="#ef4444" />}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: theme.text }}>{unidade || "—"}</td>
                    <td style={{ ...tdStyle, color: theme.text }}>{nome || "—"}</td>
                    <td style={{ ...tdStyle, color: theme.text }}>
                      <div style={{ fontWeight: 700 }}>{dataEntrada || "—"}</div>
                      <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '6px' }}>Recebido por {recebidoPor}</div>
                    </td>
                    <td style={{ ...tdStyle, color: theme.text }}>{numeroFiscal}</td>
                    <td style={{ ...tdStyle, color: theme.text }}>{identInterna}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <span style={{ ...badgeStyle, backgroundColor: statusBg, color: statusColor, fontSize: '11px', padding: '6px 8px' }}>
                        {statusLabel}
                      </span>
                    </td>
                    
                    <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'middle', minWidth: '140px' }}>
                      <button
                          type="button"
                          onClick={() => handleView(item)}
                          onMouseEnter={() => prefetchItemPhotos(item)}
                          onTouchStart={() => prefetchItemPhotos(item)}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '120px', height: '38px', background: 'none', border: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.textSecondary, padding: '8px 12px', borderRadius: '10px', transition: 'background 0.2s', fontWeight: 700, textAlign: 'center' }}
                        >
                          Ver detalhes
                        </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        {/* LISTA EM CARDS (MOBILE) */}
        <div className="enc-mobile-list">
          {loadingInitial ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: theme.textSecondary }}>
              <Loader2 style={spinnerAnimation} /> Carregando encomendas...
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: theme.textSecondary }}>
              Nenhuma encomenda encontrada.
            </div>
          ) : (
            pageData.map((item) => {
              const { unidade, nome, dataEntrada, recebidoPor, numeroFiscal, identInterna, statusLabel, statusColor, statusBg, itemId } = getItemDisplay(item);
              return (
                <div
                  key={itemId}
                  className="enc-card"
                  style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: isAtrasadoArmazenar(item) ? '#ef444420' : '#3b82f61a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={18} color={isAtrasadoArmazenar(item) ? '#ef4444' : '#3b82f6'} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {nome || "—"}
                          {isAtrasadoArmazenar(item) && <AlertCircle size={14} color="#ef4444" />}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} /> {unidade || "—"}
                        </div>
                      </div>
                    </div>
                    <span style={{ ...badgeStyle, backgroundColor: statusBg, color: statusColor, flexShrink: 0 }}>{statusLabel}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', paddingTop: '4px', borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ paddingTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Entrada</div>
                      <div style={{ color: theme.text, fontWeight: 600 }}>{dataEntrada || "—"}</div>
                      <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>por {recebidoPor}</div>
                    </div>
                    <div style={{ paddingTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: theme.textSecondary, textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Nº Fiscal</div>
                      <div style={{ color: theme.text, fontWeight: 600, wordBreak: 'break-word' }}>{numeroFiscal}</div>
                      <div style={{ fontSize: '11px', color: theme.textSecondary, marginTop: '2px' }}>Cód.: {identInterna}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleView(item)}
                    onMouseEnter={() => prefetchItemPhotos(item)}
                    onTouchStart={() => prefetchItemPhotos(item)}
                    className="enc-ver-btn"
                    style={{ width: '100%', height: '42px', background: 'none', border: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.textSecondary, borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Eye size={16} /> Ver detalhes
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div style={{
          ...paginationFooter,
          borderTopColor: theme.border,
          backgroundColor: theme.mainBg,
          color: theme.textSecondary,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: theme.textSecondary }}>Exibir:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                const value = e.target.value === 'Todos' ? 'Todos' : Number(e.target.value);
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.bgCard,
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
            <span style={{ fontSize: '13px', color: theme.textSecondary }}>
              Exibindo <strong style={{ color: theme.text }}>{pageData.length}</strong> de <strong style={{ color: theme.text }}>{filteredData.length}</strong> registros
            </span>
          </div>

          {itemsPerPage !== 'Todos' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPageSafe === 1}
                className="pagination-btn"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: '13px', color: theme.text }}>
                {currentPageSafe} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPageSafe === totalPages}
                className="pagination-btn"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CADASTRO ESTILO PISCINA */}
      {showModal && (
        <div style={modalOverlay}>
          <div className="encomendas-modal-content enc-modal" style={{ backgroundColor: theme.bgCard, color: theme.text, maxWidth: '540px', width: '95%' }}>
            <div className="enc-modal-header" style={{ borderColor: theme.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                  <Package size={22} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 700 }}>{modalType === "add" ? "Novo Recebimento" : "Editar Encomenda"}</div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px' }}>Registre a entrada de um volume</div>
                </div>
              </div>
              <button type="button" className="enc-close-btn" style={{ borderColor: theme.border, color: theme.textSecondary }} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="enc-modal-body">

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
                {formErrors.id_unidade && <div className="encomendas-error">{formErrors.id_unidade}</div>}

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
              <div className="encomendas-form-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input 
                    style={{ ...selectStyle, width: '100%', backgroundColor: formData.id_morador ? theme.bgCard : theme.bgBody, color: theme.text, borderColor: theme.border, opacity: formData.id_morador ? 0.6 : 1 }} 
                    value={formData.nome} 
                    disabled={!!formData.id_morador}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })} 
                  />
                  {formErrors.nome && <div className="encomendas-error">{formErrors.nome}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Telefone</label>
                  <input 
                    style={{ 
                      ...selectStyle, width: '100%', 
                      backgroundColor: formData.id_morador ? theme.bgCard : theme.bgBody, 
                      color: theme.text, borderColor: theme.border, 
                      opacity: formData.id_morador ? 0.6 : 1 
                    }} 
                    value={formData.telefone} 
                    disabled={!!formData.id_morador}
                    placeholder="(DD)nnnnn-nnnn"
                    onChange={e => setFormData({ ...formData, telefone: formatPhoneBR(e.target.value) })} 
                  />
                  {formErrors.telefone && <div className="encomendas-error">{formErrors.telefone}</div>}
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
                  {formErrors.numero_fiscal && <div className="encomendas-error">{formErrors.numero_fiscal}</div>}
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
                {formErrors.foto && <div className="encomendas-error" style={{ textAlign: 'center' }}>{formErrors.foto}</div>}


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

                  <input ref={photoInputRef} type="file" id="up-encomenda" accept="image/*" capture="environment" style={{ display: 'none' }} multiple onChange={handleFileChange} />
                  <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                      title="Tirar foto ou escolher da galeria"
                    >
                      <Camera size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                      title="Adicionar mais imagens"
                    >
                      <UploadCloud size={18} />
                    </button>
                  </div>

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

            </div>

            <div className="enc-modal-footer" style={{ borderColor: theme.border, backgroundColor: theme.bgCard }}>
              <button
                className="enc-new-btn"
                style={{ width: '100%', background: loadingGlobal ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: loadingGlobal ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
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
          <div className="enc-modal" style={{ backgroundColor: theme.bgCard, color: theme.text, maxWidth: '920px', width: '95%' }}>
            <div className="enc-modal-header" style={{ borderColor: theme.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', flexShrink: 0 }}>
                  <Package size={22} color="white" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Detalhes da Encomenda</div>
                  <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getCell(selectedDetails, 'NOME') || 'Informações completas da entrega'}</div>
                </div>
              </div>
              <button type="button" className="enc-close-btn" style={{ borderColor: theme.border, color: theme.textSecondary }} onClick={() => { setShowViewDetails(false); setSelectedDetails(null); }}>
                <X size={18} />
              </button>
            </div>

            <div className="enc-details-grid">
              {/* COLUNA ESQUERDA: FOTO */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📸 Foto da Etiqueta
                </div>
                <div style={{ position: 'relative', flex: 1, minHeight: '380px', borderRadius: '16px', overflow: 'hidden', border: `2px solid ${theme.border}`, backgroundColor: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedPhotoUrls.length > 0 ? (
                    <>
                      {photoLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: theme.textSecondary }}>
                          <Loader2 style={spinnerAnimation} size={28} />
                          <span style={{ fontSize: '13px' }}>Carregando foto...</span>
                        </div>
                      ) : photoSrc ? (
                        <img
                          src={photoSrc}
                          alt="Encomenda"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: theme.textSecondary }}>
                          <Package size={48} style={{ opacity: 0.25 }} />
                          <span style={{ fontSize: '13px' }}>Não foi possível carregar a foto</span>
                        </div>
                      )}
                      {selectedPhotoUrls.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoIndex((prev) => (prev === 0 ? selectedPhotoUrls.length - 1 : prev - 1))}
                            style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(15, 23, 42, 0.8)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(15, 23, 42, 0.95)'; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'; }}
                          >‹</button>
                          <button
                            type="button"
                            onClick={() => setSelectedPhotoIndex((prev) => (prev === selectedPhotoUrls.length - 1 ? 0 : prev + 1))}
                            style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'rgba(15, 23, 42, 0.8)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(15, 23, 42, 0.95)'; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'; }}
                          >›</button>
                        </>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <Package size={64} color={theme.textSecondary} style={{ opacity: 0.2 }} />
                      <span style={{ color: theme.textSecondary, fontSize: '14px' }}>Sem foto disponível</span>
                    </div>
                  )}
                </div>
                {selectedPhotoUrls.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {selectedPhotoUrls.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: idx === selectedPhotoIndex ? '#3b82f6' : theme.border, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* COLUNA DIREITA: DETALHES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>
                {/* Card Destinatário */}
                <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: theme.bg, border: `1px solid ${theme.border}`, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <User size={18} color="#3b82f6" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>Destinatário</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: theme.text, marginBottom: '8px' }}>{getCell(selectedDetails, 'NOME') || '—'}</div>
                  <div style={{ fontSize: '13px', color: theme.textSecondary, marginBottom: '12px' }}>{formatBlockUnit(getCell(selectedDetails, 'ID_UNIDADE') || getCell(selectedDetails, 'id_unidade')) || '—'}</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.textSecondary }}>
                      <span style={{ fontWeight: '600' }}>📞</span>
                      {getCell(selectedDetails, 'TELEFONE') || getCell(selectedDetails, 'telefone') || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.textSecondary }}>
                      <Truck size={14} color={theme.textSecondary} />
                      <span>{getCell(selectedDetails, 'TRANSPORTADORA') || getCell(selectedDetails, 'transportadora') || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Entrada */}
                <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <Calendar size={18} color="#f59e0b" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>Dados de Entrada</span>
                  </div>
                  <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Status:</span>
                      {(() => {
                        const s = (getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '—').toString().toUpperCase();
                        const isEntregue = s === 'ENTREGUE' || s === 'RETIRADO';
                        const sColor = s === 'PENDENTE' ? '#92400e' : isEntregue ? '#15803d' : s === 'ARMAZENADO' ? '#2563eb' : theme.text;
                        const sBg = s === 'PENDENTE' ? '#fef3c7' : isEntregue ? '#dcfce7' : s === 'ARMAZENADO' ? '#dbeafe' : '#f3f4f6';
                        return <span style={{ ...badgeStyle, backgroundColor: sBg, color: sColor }}>{s}</span>;
                      })()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Data de Entrada:</span>
                      <span style={{ color: theme.text }}>{formatDateTime(getCell(selectedDetails, 'DATA_ENTRADA') || getCell(selectedDetails, 'data_entrada') || getCell(selectedDetails, 'DATA_RECEBIMENTO') || getCell(selectedDetails, 'data_recebimento')) || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Cód. Interno:</span>
                      <span style={{ color: theme.text }}>{getCell(selectedDetails, 'IDENT_INTERNA') || getCell(selectedDetails, 'ident_interna') || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.textSecondary, fontWeight: '600' }}>Referência Fiscal:</span>
                      <span style={{ color: theme.text, fontWeight: '600' }}>{getCell(selectedDetails, 'NUMERO_FISCAL') || getCell(selectedDetails, 'numero_fiscal') || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Saída */}
                <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <CheckCircle2 size={18} color="#10b981" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase' }}>Dados de Saída</span>
                  </div>
                  <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                    <div><span style={{ color: theme.textSecondary, fontWeight: '600' }}>Cód. Entrega:</span> <span style={{ color: theme.text, fontWeight: '700' }}>{getCell(selectedDetails, 'COD_ENTREGA') || getCell(selectedDetails, 'cod_entrega') || '—'}</span></div>
                    <div><span style={{ color: theme.textSecondary, fontWeight: '600' }}>Entregue por:</span> <span style={{ color: theme.text, fontWeight: '700' }}>{getCell(selectedDetails, 'ENTREGUE_POR') || getCell(selectedDetails, 'entregue_por') || '—'}</span></div>
                    <div><span style={{ color: theme.textSecondary, fontWeight: '600' }}>Retirado por:</span> <span style={{ color: theme.text, fontWeight: '700' }}>{getCell(selectedDetails, 'NOME_MORADOR') || getCell(selectedDetails, 'nome_morador') || '—'}</span></div>
                    <div><span style={{ color: theme.textSecondary, fontWeight: '600' }}>Data de Saída:</span> <span style={{ color: theme.text }}>{formatDateTime(getCell(selectedDetails, 'DATA_SAIDA') || getCell(selectedDetails, 'data_saida')) || '—'}</span></div>
                    <div><span style={{ color: theme.textSecondary, fontWeight: '600' }}>Notificado:</span> <span style={{ color: theme.text, fontWeight: '700' }}>{(getCell(selectedDetails, 'NOTIFICADO') || getCell(selectedDetails, 'notificado') || '—').toString().toUpperCase()}</span></div>
                  </div>
                </div>

                {/* Card Observações */}
                {(getCell(selectedDetails, 'OBS') || getCell(selectedDetails, 'observacoes') || getCell(selectedDetails, 'obs')) && (
                  <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>📝 Observações</div>
                    <div style={{ fontSize: '13px', color: theme.textSecondary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {getCell(selectedDetails, 'OBS') || getCell(selectedDetails, 'observacoes') || getCell(selectedDetails, 'obs')}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                  {(getCell(selectedDetails, 'TELEFONE') || getCell(selectedDetails, 'telefone')) && (
                    <button
                      type="button"
                      onClick={() => handleResendWhatsapp(selectedDetails)}
                      style={{ width: '100%', padding: '12px 18px', borderRadius: '12px', border: '1px solid #3b82f6', backgroundColor: 'transparent', color: '#3b82f6', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.target.style.backgroundColor = '#3b82f615'; }}
                      onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                    >
                      📱 Reenviar Notificação
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleBaixa(selectedDetails);
                    }}
                    disabled={['RETIRADO', 'ENTREGUE'].includes((getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: ['RETIRADO', 'ENTREGUE'].includes((getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase()) ? theme.border : '#10b981',
                      color: ['RETIRADO', 'ENTREGUE'].includes((getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase()) ? theme.textSecondary : 'white',
                      fontWeight: '700',
                      cursor: ['RETIRADO', 'ENTREGUE'].includes((getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase()) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {['RETIRADO', 'ENTREGUE'].includes((getCell(selectedDetails, 'STATUS') || getCell(selectedDetails, 'status') || '').toString().toUpperCase()) ? '✓ Já Entregue' : '✓ Confirmar Entrega'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmDeliveryModal && deliveryItem && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, backgroundColor: theme.bgCard, color: theme.text, maxWidth: '520px', width: '95%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={modalHeader}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  ✓ Confirmar Entrega
                </div>
                <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '4px' }}>Preencha os dados abaixo para registrar a entrega</div>
              </div>
              <X size={24} cursor="pointer" onClick={() => {
                setShowConfirmDeliveryModal(false);
                setDeliveryItem(null);
                setConfirmDeliveryCode("");
                setDeliveryPhotoBase64(null);
                setDeliveryNomeMorador("");
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '8px 0' }}>
              
              {/* Campo: Código de Entrega */}
              <div>
                <label style={labelStyle}>Código de Entrega (enviado ao morador)</label>
                <input
                  type="text"
                  value={confirmDeliveryCode}
                  onChange={(e) => setConfirmDeliveryCode(e.target.value.toUpperCase())}
                  style={{ ...selectStyle, width: '100%', textTransform: 'uppercase', backgroundColor: theme.bgBody, color: theme.text, borderColor: theme.border }}
                  placeholder="EXEMPLO1234"
                />
              </div>

              {/* Campo: Nome do Morador */}
              <div>
                <label style={labelStyle}>Nome de Quem Retirou</label>
                <input
                  type="text"
                  value={deliveryNomeMorador}
                  onChange={(e) => setDeliveryNomeMorador(e.target.value)}
                  style={{ ...selectStyle, width: '100%', backgroundColor: theme.bgBody, color: theme.text, borderColor: theme.border }}
                  placeholder="Digite o nome completo"
                />
              </div>

              {/* Seção Foto de Comprovação */}
              <div>
                <label style={labelStyle}>Foto de Comprovação (opcional)</label>
                <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', border: `2px dashed ${theme.border}`, backgroundColor: theme.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {deliveryPhotoBase64 ? (
                    <>
                      <img src={deliveryPhotoBase64} alt="Comprovação" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={handleClearDeliveryPhoto}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <Camera size={32} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                      <span style={{ fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>Tirar foto ou escolher da galeria</span>
                    </div>
                  )}
                  <input
                    ref={deliveryPhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDeliveryPhotoCapture}
                    onClick={(e) => { e.currentTarget.value = ''; }}
                    style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmDeliveryModal(false);
                    setDeliveryItem(null);
                    setConfirmDeliveryCode("");
                    setDeliveryPhotoBase64(null);
                    setDeliveryNomeMorador("");
                  }}
                  style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = theme.border; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = theme.bg; }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelivery}
                  disabled={!confirmDeliveryCode.trim() || !deliveryNomeMorador.trim() || deliveryLoadingUpload}
                  style={{
                    backgroundColor: !confirmDeliveryCode.trim() || !deliveryNomeMorador.trim() || deliveryLoadingUpload ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    cursor: !confirmDeliveryCode.trim() || !deliveryNomeMorador.trim() || deliveryLoadingUpload ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {deliveryLoadingUpload ? <Loader2 style={spinnerAnimation} size={18} /> : '✓ Confirmar'}
                </button>
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