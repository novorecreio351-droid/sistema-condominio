/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, X,
  Edit2, Trash2, Loader2, Clock, User, Phone,
  ChevronDown, AlertCircle, CheckCircle2
} from "lucide-react";
import { useTheme } from "../App";

const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";
const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;

const HORARIOS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const DURACOES = ["30min", "1h", "1h30", "2h"];
const STATUS_OPTIONS = ["Agendado", "Confirmado", "Realizado", "Cancelado"];
const TIPOS = ["Morador", "Prestador de Serviço", "Administradora", "Funcionário"];

const STATUS_COLORS = {
  Agendado:   { bg: "#3b82f620", border: "#3b82f6", text: "#93c5fd", badge: "#3b82f630" },
  Confirmado: { bg: "#10b98120", border: "#10b981", text: "#6ee7b7", badge: "#10b98130" },
  Realizado:  { bg: "#8b5cf620", border: "#8b5cf6", text: "#c4b5fd", badge: "#8b5cf630" },
  Cancelado:  { bg: "#ef444415", border: "#ef4444", text: "#fca5a5", badge: "#ef444430" },
};

function horaParaMinutos(hora) {
  if (!hora) return 0;
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m || 0);
}

function duracaoParaMinutos(dur) {
  if (!dur) return 60;
  if (dur === "30min") return 30;
  if (dur === "1h")    return 60;
  if (dur === "1h30")  return 90;
  if (dur === "2h")    return 120;
  return 60;
}

function calcHoraFim(inicio, duracao) {
  const total = horaParaMinutos(inicio) + duracaoParaMinutos(duracao);
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDataExtenso(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long"
  });
}

const FORM_INICIAL = {
  tipo: "Morador",
  id_unidade: "",
  id_morador: "",
  nome: "",
  telefone: "",
  data: "",
  hora_inicio: "",
  duracao: "1h",
  assunto: "",
  obs: "",
  status: "Agendado",
};

export default function Agendamento({ user }) {
  const { theme } = useTheme();
  const dropdownRef = useRef(null);

  const [agendamentos, setAgendamentos] = useState([]);
  const [unidades, setUnidades]         = useState([]);
  const [moradores, setMoradores]       = useState([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingGlobal,  setLoadingGlobal]  = useState(false);
  const [isMobile, setIsMobile]             = useState(window.innerWidth < 768);

  const hoje = formatDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(hoje);
  const [viewMonth, setViewMonth]       = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [showModal,    setShowModal]    = useState(false);
  const [modalType,    setModalType]    = useState("add");
  const [formData,     setFormData]     = useState(FORM_INICIAL);
  const [conflitError, setConflitError] = useState("");
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [unitSearch,       setUnitSearch]       = useState("");

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowUnitDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchData = async () => {
    try {
      setLoadingInitial(true);
      const [resAg, resUn, resMo] = await Promise.all([
        fetch(`${API_URL}?token=${TOKEN}&sheet=AGENDAMENTOS`, { redirect: "follow" }).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=UNIDADES`,     { redirect: "follow" }).then(r => r.json()),
        fetch(`${API_URL}?token=${TOKEN}&sheet=MORADORES`,    { redirect: "follow" }).then(r => r.json()),
      ]);

      const lista = (Array.isArray(resAg) ? resAg : []).map(item => ({
        ...item,
        id:          item.id          || item.ID          || "",
        tipo:        item.tipo        || item.TIPO        || "Morador",
        id_unidade:  item.id_unidade  || item.ID_UNIDADE  || "",
        nome:        item.nome        || item.NOME        || "",
        telefone:    item.telefone    || item.TELEFONE    || "",
        data:        (item.data       || item.DATA        || "").split(" ")[0].split("T")[0],
        hora_inicio: item.hora_inicio || item.HORA_INICIO || "",
        duracao:     item.duracao     || item.DURACAO     || "1h",
        assunto:     item.assunto     || item.ASSUNTO     || "",
        obs:         item.obs         || item.OBS         || "",
        status:      item.status      || item.STATUS      || "Agendado",
        criado_por:  item.criado_por  || item.CRIADO_POR  || "",
      }));

      setAgendamentos(lista);
      setUnidades(Array.isArray(resUn) ? resUn : []);
      setMoradores(Array.isArray(resMo) ? resMo : []);

      autoAtualizarRealizados(lista);
    } catch (err) {
      console.error("Erro fetchData Agendamento:", err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const autoAtualizarRealizados = async (lista) => {
    const agora = new Date();
    const paraAtualizar = lista.filter(ag => {
      if (ag.status !== "Confirmado") return false;
      const [y, m, d] = ag.data.split("-").map(Number);
      const fimStr = calcHoraFim(ag.hora_inicio, ag.duracao);
      const [fh, fm] = fimStr.split(":").map(Number);
      const horaFim = new Date(y, m - 1, d, fh, fm);
      return agora > horaFim;
    });

    await Promise.all(
      paraAtualizar.map(ag =>
        fetch(API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            token: TOKEN,
            action: "edit",
            sheet: "AGENDAMENTOS",
            id: ag.id.toString(),
            data: { ...ag, status: "Realizado" },
          }),
        })
      )
    );

    if (paraAtualizar.length > 0) {
      setTimeout(fetchData, 1500);
    }
  };

  const agendamentosDoDia = useMemo(
    () => agendamentos.filter(ag => ag.data === selectedDate),
    [agendamentos, selectedDate]
  );

  const diasComAgendamento = useMemo(() => {
    const set = new Set();
    agendamentos
      .filter(ag => ag.status !== "Cancelado")
      .forEach(ag => set.add(ag.data));
    return set;
  }, [agendamentos]);

  const proximosAgendamentos = useMemo(() => {
    const agora = new Date();
    return agendamentos
      .filter(ag => {
        if (ag.status === "Cancelado" || ag.status === "Realizado") return false;
        const [y, m, d] = ag.data.split("-").map(Number);
        const [h, min] = (ag.hora_inicio || "00:00").split(":").map(Number);
        return new Date(y, m - 1, d, h, min) >= agora;
      })
      .sort((a, b) => {
        const da = a.data + a.hora_inicio;
        const db = b.data + b.hora_inicio;
        return da.localeCompare(db);
      })
      .slice(0, 3);
  }, [agendamentos]);

  const verificarConflito = (data, hora_inicio, duracao, excludeId = null) => {
    const inicioMin = horaParaMinutos(hora_inicio);
    const fimMin    = inicioMin + duracaoParaMinutos(duracao);

    return agendamentos.some(ag => {
      if (ag.status === "Cancelado") return false;
      if (ag.data !== data) return false;
      if (excludeId && ag.id.toString() === excludeId.toString()) return false;

      const agInicio = horaParaMinutos(ag.hora_inicio);
      const agFim    = agInicio + duracaoParaMinutos(ag.duracao);

      return inicioMin < agFim && fimMin > agInicio;
    });
  };

  const getUnitLabel = (id) => {
    const u = unidades.find(u => u.id?.toString() === id?.toString());
    return u ? `BLOCO ${u.bloco} - UNIDADE ${u.unidade}` : "Selecione a unidade...";
  };

  const unidadesFiltradas = useMemo(() =>
    unidades
      .filter(u =>
        u.bloco?.toString().toLowerCase().includes(unitSearch.toLowerCase()) ||
        u.unidade?.toString().toLowerCase().includes(unitSearch.toLowerCase())
      )
      .sort((a, b) => {
        const cb = a.bloco?.toString().localeCompare(b.bloco?.toString(), undefined, { numeric: true });
        if (cb !== 0) return cb;
        return a.unidade?.toString().localeCompare(b.unidade?.toString(), undefined, { numeric: true });
      }),
  [unidades, unitSearch]);

  const moradoresDaUnidade = useMemo(() =>
    moradores.filter(m => m.id_unidade?.toString() === formData.id_unidade?.toString()),
  [moradores, formData.id_unidade]);

  const handleUnidadeSelect = (unidadeId) => {
    const moradoresDaUnidadeFiltrados = moradores.filter(
      m => m.id_unidade?.toString() === unidadeId?.toString()
    );
    if (moradoresDaUnidadeFiltrados.length === 1) {
      const m = moradoresDaUnidadeFiltrados[0];
      setFormData(prev => ({
        ...prev,
        id_unidade: unidadeId,
        id_morador: m.id,
        nome: m.nome || "",
        telefone: m.telefone || m.celular || "",
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        id_unidade: unidadeId,
        id_morador: "",
        nome: "",
        telefone: "",
      }));
    }
    setShowUnitDropdown(false);
    setUnitSearch("");
  };

  const handleMoradorSelect = (id) => {
    if (!id) {
      setFormData(prev => ({ ...prev, id_morador: "", nome: "", telefone: "" }));
      return;
    }
    const m = moradores.find(m => m.id?.toString() === id.toString());
    if (m) {
      setFormData(prev => ({
        ...prev,
        id_morador: id,
        nome: m.nome || "",
        telefone: m.telefone || m.celular || "",
      }));
    }
  };

  const abrirModalNovo = (hora = "") => {
    setModalType("add");
    setFormData({ ...FORM_INICIAL, data: selectedDate, hora_inicio: hora });
    setConflitError("");
    setShowModal(true);
  };

  const abrirModalEditar = (ag) => {
    setModalType("edit");
    setFormData({ ...ag });
    setConflitError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.hora_inicio || !formData.data) {
      alert("Preencha Nome, Data e Hora de Início.");
      return;
    }
    if (formData.tipo === "Morador" && !formData.id_unidade) {
      alert("Selecione a Unidade.");
      return;
    }

    const conflito = verificarConflito(
      formData.data,
      formData.hora_inicio,
      formData.duracao,
      modalType === "edit" ? formData.id : null
    );

    if (conflito) {
      setConflitError("Conflito: já existe um agendamento neste horário.");
      return;
    }

    setLoadingGlobal(true);
    const payload = {
      token: TOKEN,
      action: modalType === "add" ? "add" : "edit",
      sheet: "AGENDAMENTOS",
      id: modalType === "add" ? "SEQUENTIAL" : formData.id.toString(),
      data: {
        tipo:        formData.tipo,
        id_unidade:  formData.tipo === "Morador" ? formData.id_unidade : "",
        id_morador:  formData.tipo === "Morador" ? (formData.id_morador || "") : "",
        nome:        formData.nome,
        telefone:    formData.telefone,
        data:        formData.data,
        hora_inicio: formData.hora_inicio,
        duracao:     formData.duracao,
        assunto:     formData.assunto,
        obs:         formData.obs,
        status:      formData.status,
        criado_por:  user?.nome || "Sistema",
        data_criacao: modalType === "add" ? new Date().toISOString() : formData.data_criacao,
      },
    };

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
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este agendamento?")) return;
    setLoadingGlobal(true);
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ token: TOKEN, action: "delete", sheet: "AGENDAMENTOS", id: id.toString() }),
    });
    setTimeout(async () => {
      setShowModal(false);
      await fetchData();
      setLoadingGlobal(false);
    }, 1500);
  };

  return (
    <div style={{ padding: 20, color: theme.text }}>
      {loadingInitial
        ? <p>Carregando...</p>
        : <p>Agendamento — {agendamentos.length} registros carregados.</p>
      }
    </div>
  );
}
