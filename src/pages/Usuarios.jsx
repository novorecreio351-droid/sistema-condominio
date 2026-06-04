import React, { useState, useEffect } from "react";
import { Users, Plus, Edit2, Trash2, KeyRound, X, Loader2, LogOut, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../App";
import { sessionParam, getSessionToken, clearSessionToken } from "../auth/session";

const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";
const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;

const CARGOS = ["Porteiro", "Sindico", "Auxiliar Administrativo", "Desenvolvedor", "Conselheiro"];
const FORM_INICIAL = { id: "", nome: "", email: "", cargo: "Porteiro", senha: "" };

export default function Usuarios({ user, onLogout }) {
  const { theme } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // add | edit
  const [form, setForm] = useState(FORM_INICIAL);
  const [showSenha, setShowSenha] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?token=${TOKEN}&sheet=usuarios${sessionParam()}`).then(r => r.json());
      setUsuarios(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const postAcao = async (action, body) => {
    setSaving(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ token: TOKEN, action, session: getSessionToken(), ...body }),
      }).then(r => r.json()).catch(() => ({ success: false, message: "Falha de conexão" }));
      if (!res.success) { alert(res.message || "Operação não permitida."); return false; }
      return res;
    } finally {
      setSaving(false);
    }
  };

  const abrirNovo = () => { setModalType("add"); setForm(FORM_INICIAL); setShowSenha(false); setShowModal(true); };
  const abrirEditar = (u) => {
    setModalType("edit");
    setForm({ id: u.id, nome: u.nome || "", email: u.email || "", cargo: u.cargo || "Porteiro", senha: "" });
    setShowSenha(false);
    setShowModal(true);
  };

  const salvar = async () => {
    if (modalType === "add") {
      if (!form.nome.trim() || !form.email.trim() || !form.cargo || !form.senha) {
        alert("Preencha nome, email, cargo e senha."); return;
      }
      const ok = await postAcao("criarUsuario", { data: { nome: form.nome, email: form.email, cargo: form.cargo, senha: form.senha } });
      if (ok) { setShowModal(false); await fetchUsuarios(); }
    } else {
      if (!form.nome.trim() || !form.cargo) { alert("Preencha nome e cargo."); return; }
      const ok = await postAcao("editarUsuario", { id: form.id, data: { nome: form.nome, cargo: form.cargo } });
      if (!ok) return;
      if (form.senha.trim()) {
        const okSenha = await postAcao("resetarSenha", { id: form.id, data: { senha: form.senha.trim() } });
        if (!okSenha) return;
      }
      setShowModal(false);
      await fetchUsuarios();
    }
  };

  const resetarSenha = async (u) => {
    if (!confirm(`Gerar uma nova senha temporária para ${u.nome}?`)) return;
    const res = await postAcao("resetarSenha", { id: u.id });
    if (res) alert(`Senha temporária de ${u.nome}:\n\n${res.senhaTemporaria}\n\nAnote e repasse agora — ela não será exibida novamente.`);
  };

  const excluir = async (u) => {
    if (!confirm(`Excluir o usuário ${u.nome}?`)) return;
    const ok = await postAcao("excluirUsuario", { id: u.id });
    if (ok) await fetchUsuarios();
  };

  const card = { background: theme.mainBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg, color: theme.text, fontSize: 14, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 5 };
  const btnIcon = { background: "none", border: `1px solid ${theme.border}`, borderRadius: 8, padding: 8, cursor: "pointer", color: theme.text, display: "inline-flex" };

  return (
    <div style={{ padding: isMobile ? "20px 14px" : 20, paddingTop: isMobile ? 60 : 20, maxWidth: 1000, margin: "0 auto" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .animate-spin{animation:spin 1s linear infinite}`}</style>

      {(loading || saving) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <Loader2 className="animate-spin" color="#3b82f6" size={46} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: theme.text, margin: 0 }}>Usuários</h1>
          <p style={{ fontSize: 14, color: theme.textSecondary, margin: "4px 0 0" }}>Gerencie os acessos do sistema.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
          <button onClick={abrirNovo} style={{ flex: isMobile ? 1 : "none", justifyContent: "center", background: "#3b82f6", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> Novo Usuário
          </button>
          <button onClick={() => { clearSessionToken(); if (onLogout) onLogout(); }} style={{ flex: isMobile ? 1 : "none", justifyContent: "center", background: "#ef444420", color: "#ef4444", border: "1px solid #ef4444", padding: "10px 16px", borderRadius: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <LogOut size={16} /> Sair do sistema
          </button>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {usuarios.length === 0 && !loading && (
            <div style={{ color: theme.textSecondary, textAlign: "center", padding: 20 }}>Nenhum usuário.</div>
          )}
          {usuarios.map(u => (
            <div key={u.id || u.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 10, background: theme.bg, border: `1px solid ${theme.border}`, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: "1 1 160px" }}>
                <div style={{ fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nome || "—"}</div>
                <div style={{ fontSize: 13, color: theme.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email} · <span style={{ fontWeight: 600 }}>{u.cargo}</span></div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button title="Editar" style={btnIcon} onClick={() => abrirEditar(u)}><Edit2 size={16} /></button>
                <button title="Gerar senha temporária" style={btnIcon} onClick={() => resetarSenha(u)}><KeyRound size={16} /></button>
                <button title="Excluir" style={{ ...btnIcon, color: "#ef4444", borderColor: "#ef4444" }} onClick={() => excluir(u)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: theme.mainBg, borderRadius: 16, padding: isMobile ? 18 : 24, width: "100%", maxWidth: 440, border: `1px solid ${theme.border}`, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, color: theme.text, fontSize: 17, fontWeight: 700 }}>{modalType === "add" ? "Novo Usuário" : "Editar Usuário"}</h3>
              <X size={20} color={theme.textSecondary} style={{ cursor: "pointer" }} onClick={() => setShowModal(false)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Nome</label>
                <input style={inputStyle} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  style={{ ...inputStyle, opacity: modalType === "edit" ? 0.6 : 1 }}
                  value={form.email}
                  readOnly={modalType === "edit"}
                  placeholder="email@exemplo.com"
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
                {modalType === "edit" && <span style={{ fontSize: 11, color: theme.textSecondary }}>O email não pode ser alterado.</span>}
              </div>
              <div>
                <label style={labelStyle}>Cargo</label>
                <select style={inputStyle} value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })}>
                  {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{modalType === "add" ? "Senha inicial" : "Nova senha"}</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 42 }}
                    type={showSenha ? "text" : "password"}
                    value={form.senha}
                    onChange={e => setForm({ ...form, senha: e.target.value })}
                    placeholder={modalType === "add" ? "Senha do novo usuário" : "Deixe em branco para não alterar"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(s => !s)}
                    title={showSenha ? "Ocultar senha" : "Mostrar senha"}
                    style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: theme.textSecondary, display: "inline-flex", padding: 6 }}
                  >
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {modalType === "edit" && <span style={{ fontSize: 11, color: theme.textSecondary }}>Para gerar uma senha temporária aleatória, use o botão de chave na lista.</span>}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowModal(false)} style={{ background: theme.bg, color: theme.textSecondary, border: `1px solid ${theme.border}`, padding: "10px 16px", borderRadius: 10, cursor: "pointer" }}>Cancelar</button>
                <button onClick={salvar} style={{ flex: 1, background: "#3b82f6", color: "white", border: "none", padding: 10, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
                  {modalType === "add" ? "Criar Usuário" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
