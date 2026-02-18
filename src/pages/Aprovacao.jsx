import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, XCircle, Package, ShieldCheck, 
  Eraser, Info, Calendar, User, MapPin, AlertCircle, Hash
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export default function Aprovacao() {
  const sigCanvas = useRef(null);
  const [idSolicitacao, setIdSolicitacao] = useState("C17007");

  // --- ESTILOS (CSS EM JAVASCRIPT) ---
  const s = {
    container: {
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      padding: '20px'
    },
    card: {
      backgroundColor: '#1e293b',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      border: '1px solid #334155',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      borderBottom: '1px solid #334155',
      paddingBottom: '15px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    },
    label: {
      fontSize: '11px',
      color: '#94a3b8',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      letterSpacing: '0.05em',
      display: 'block',
      marginBottom: '4px'
    },
    value: {
      fontSize: '15px',
      color: '#ffffff',
      fontWeight: '600'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '10px'
    },
    th: {
      textAlign: 'left',
      fontSize: '12px',
      color: '#64748b',
      padding: '12px',
      borderBottom: '1px solid #334155'
    },
    td: {
      padding: '12px',
      fontSize: '14px',
      borderBottom: '1px solid #334155'
    },
    btnApprove: {
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      padding: '16px 24px',
      borderRadius: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%'
    },
    btnReject: {
      backgroundColor: 'transparent',
      color: '#ef4444',
      border: '1px solid #ef4444',
      padding: '16px 24px',
      borderRadius: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: '100%'
    },
    signatureArea: {
      backgroundColor: 'white',
      borderRadius: '12px',
      height: '180px',
      marginTop: '10px',
      overflow: 'hidden'
    }
  };

  return (
    <div style={s.container}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Cabeçalho */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', cursor: 'pointer' }}>
            <ArrowLeft size={18} /> <span>Voltar</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '12px', fontWeight: 'bold' }}>
            <ShieldCheck size={16} /> PORTAL DE AUDITORIA
          </div>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
          Aprovação <span style={{ color: '#3b82f6' }}>#{idSolicitacao}</span>
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Validação de documento oficial de compras e suprimentos.</p>

        {/* Informações Principais */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Info size={18} color="#3b82f6" />
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>INFORMAÇÕES DA SOLICITAÇÃO</h2>
          </div>
          <div style={s.grid}>
            <div>
              <span style={s.label}>Solicitante</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="#64748b" />
                <span style={s.value}>LUCAS SAMPAIO</span>
              </div>
            </div>
            <div>
              <span style={s.label}>Departamento</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#64748b" />
                <span style={s.value}>PORTARIA</span>
              </div>
            </div>
            <div>
              <span style={s.label}>Prioridade</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                <AlertCircle size={16} />
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>MÉDIA URGÊNCIA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Itens */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Package size={18} color="#3b82f6" />
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>ITENS DA REQUISIÇÃO</h2>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>PRODUTO</th>
                <th style={s.th}>CÓDIGO</th>
                <th style={s.th}>QTD</th>
                <th style={{ ...s.th, textAlign: 'right' }}>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={s.td}>
                  <div style={s.value}>Pilhas AA p/ Controles</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Unidade padrão</div>
                </td>
                <td style={{ ...s.td, color: '#94a3b8', fontFamily: 'monospace' }}>99283</td>
                <td style={{ ...s.td, fontWeight: 'bold', textAlign: 'center' }}>02</td>
                <td style={{ ...s.td, textAlign: 'right', fontWeight: '900' }}>R$ 25,00</td>
              </tr>
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <span style={s.label}>Valor Total</span>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#3b82f6' }}>R$ 25,00</span>
          </div>
        </div>

        {/* Zona de Assinatura e Ações */}
        <div style={s.grid}>
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0 }}>ASSINATURA DIGITAL</h3>
              <button onClick={() => sigCanvas.current.clear()} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eraser size={14} /> <span style={{ fontSize: '11px' }}>Limpar</span>
              </button>
            </div>
            <div style={s.signatureArea}>
              <SignatureCanvas 
                ref={sigCanvas} 
                penColor="black" 
                canvasProps={{ style: { width: '100%', height: '100%' } }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center' }}>
            <button style={s.btnApprove}>
              <CheckCircle size={20} /> CONFIRMAR E ASSINAR
            </button>
            <button style={s.btnReject}>
              <XCircle size={20} /> RECUSAR SOLICITAÇÃO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}