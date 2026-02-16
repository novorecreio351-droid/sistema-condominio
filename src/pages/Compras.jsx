/* eslint-disable react-hooks/exhaustive-deps */
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

export default function Compras({ user }) {
  const { theme } = useTheme();
  };