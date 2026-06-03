import React, { useState, useEffect } from "react";
import { sessionParam } from "../auth/session";

// ============================================================
// Exibição segura de arquivos do Google Drive (N7/LGPD).
// Busca os bytes pelo backend autenticado (action=getFoto) em vez de depender
// de URLs públicas/thumbnail do Drive — funciona com os arquivos PRIVADOS.
// Extraído de Piscina.jsx para uso em todas as telas.
// ============================================================

const API_URL = "https://script.google.com/macros/s/AKfycbxtxUEIoaSNfqKTmton8epZMJIhCmapSOxyTegLMSEGZ2jBMGIxQ4cJb4a23oveAAaW/exec";
const TOKEN = import.meta.env.VITE_SHEETS_TOKEN;

export const PIXEL_TRANSPARENTE = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export function extrairFileIdDrive(source) {
  if (!source) return "";
  const s = source.toString();
  if (s.startsWith("data:")) return "";
  if (s.includes("id=")) return s.split("id=")[1].split("&")[0];
  const m = s.match(/\/d\/([\w-]+)/);
  if (m) return m[1];
  if (s.includes("http")) { const m2 = s.match(/[-\w]{25,}/); return m2 ? m2[0] : ""; }
  return s; // já é um id simples
}

// Cache em nível de módulo (compartilhado por todas as telas):
// uma vez baixada, a foto fica em memória — reabrir modal/re-render é instantâneo.
// Guarda Promises para deduplicar buscas simultâneas do mesmo arquivo.
const fotoCache = new Map();
export function fetchFotoCached(fileId) {
  if (!fileId) return Promise.resolve("");
  if (fotoCache.has(fileId)) return fotoCache.get(fileId);
  const p = fetch(`${API_URL}?token=${TOKEN}&action=getFoto&fileId=${encodeURIComponent(fileId)}${sessionParam()}`)
    .then((r) => r.json())
    .then((d) => (d && d.success && d.base64 ? `data:${d.contentType || "image/jpeg"};base64,${d.base64}` : ""))
    .catch(() => "");
  // Se falhar/voltar vazio, descarta do cache para permitir nova tentativa depois.
  p.then((src) => { if (!src) fotoCache.delete(fileId); });
  fotoCache.set(fileId, p);
  return p;
}

// Inicia o download de uma foto antecipadamente (ao passar o mouse / tocar no item),
// para que já esteja em cache quando o modal abrir.
export function prefetchFoto(source) {
  const fileId = source && source.toString().startsWith("data:") ? "" : extrairFileIdDrive(source);
  if (fileId) fetchFotoCached(fileId);
}

// Abre um arquivo do Drive (foto, PDF, atestado...) buscando os bytes pelo backend
// autenticado e exibindo via blob URL — funciona mesmo com o arquivo PRIVADO no Drive.
// Abre a aba ANTES do fetch para não cair no bloqueador de popup.
export async function abrirArquivoDrive(source) {
  const fileId = extrairFileIdDrive(source);
  if (!fileId) { alert("Arquivo indisponível."); return; }
  const janela = window.open("about:blank", "_blank");
  const dataUrl = await fetchFotoCached(fileId);
  if (!dataUrl) {
    if (janela) janela.close();
    alert("Não foi possível carregar o arquivo.");
    return;
  }
  const blob = await (await fetch(dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  if (janela) janela.location = url;
}

export function DriveImage({ source, localSrc, alt = "", style }) {
  // src imediato (sem estado): preview local em base64 ou um data: URL já pronto.
  const directSrc = localSrc || (source && source.toString().startsWith("data:") ? source.toString() : "");
  const fileId = directSrc ? "" : extrairFileIdDrive(source);
  // Se a foto já está em cache resolvido, mostra na hora (sem flash de placeholder).
  const cached = fileId && fotoCache.has(fileId) ? fotoCache.get(fileId) : null;
  const [fetchedSrc, setFetchedSrc] = useState(typeof cached === "string" ? cached : "");
  useEffect(() => {
    if (!fileId) return; // nada a buscar; o directSrc/placeholder cuida da exibição
    let cancelled = false;
    // Só usa como <img> se for imagem — PDF e afins ficam no placeholder
    // (o elemento de fundo da tela, ex.: ícone "VER ARQUIVO", continua visível).
    fetchFotoCached(fileId).then((src) => {
      if (!cancelled && src && src.startsWith("data:image")) setFetchedSrc(src);
    });
    return () => { cancelled = true; };
  }, [fileId]);
  return <img src={directSrc || fetchedSrc || PIXEL_TRANSPARENTE} alt={alt} style={style} />;
}
