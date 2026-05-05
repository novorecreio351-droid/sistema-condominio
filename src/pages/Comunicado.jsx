import React, { useState } from "react";
import { useTheme } from "../App";
import { 
  Bot, Sparkles, Lightbulb, MoreHorizontal, 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, List, ListOrdered, Quote, Undo, Redo, Eraser, Highlighter,FileText, Image, Printer
} from "lucide-react";

// --- NOVOS IMPORTS TIPTAP ---
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';

import { Extension } from '@tiptap/core';

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";

export default function Comunicado() {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [tom, setTom] = useState("Formal");
  const [isGerando, setIsGerando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [, forceUpdate] = useState(0);

  const COR_TURQUESA = "#014731";

  const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});


  // --- CONFIGURAÇÃO DO EDITOR TIPTAP ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize, // 🔥 ADICIONADO AQUI
    ],
    content: "", 
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 200px; padding: 5px; width: 100%;',
      },
    },
  });

  // Data Automática Brasil
  const [dataAtual] = useState(() => {
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  });

const [menuAberto, setMenuAberto] = useState(false);
const a4Ref = useRef();

  const gerarComIA = async () => {
    if (!prompt) return alert("Descreva o assunto.");
    setIsGerando(true);

    try {
      const API_KEY = import.meta.env.VITE_API_KEY_IA;
      let textoBruto = "";

      try {
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-goog-api-key": API_KEY,
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Atue como um síndico profissional. Condomínio: Novo Recreio. Assunto: ${prompt}. Tom: ${tom}. Regras estritas: 1. Retorne o conteúdo dividido em duas partes exatamente assim: [TITULO] Aqui o título curto em letras maiúsculas [CORPO] Aqui o conteúdo do comunicado em HTML. 2. No [CORPO], use apenas as tags: <p>, <strong>, <br>. 3. Não use markdown, não use crases. 4. Não inclua "Atenciosamente". 5. Não inclua saudações finais. 6. O título sem ter escrito COMUNICADO já vem no meu código.`,
                }],
              }],
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message || "Erro Gemini");
        textoBruto = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (err) {
        console.warn("Gemini falhou, tentando Groq...", err);
        const GROQ_KEY = import.meta.env.VITE_API_KEY_GROQ;
        const responseGroq = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${GROQ_KEY}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-20b",
              messages: [{
                role: "user",
                content: `Atue como um síndico profissional. Condomínio: Novo Recreio. Assunto: ${prompt}. Tom: ${tom}. Regras estritas: 1. Retorne o conteúdo dividido em duas partes exatamente assim: [TITULO] Aqui o título curto em letras maiúsculas [CORPO] Aqui o conteúdo do comunicado em HTML. 2. No [CORPO], use apenas as tags: <p>, <strong>, <br>. 3. Não use markdown, não use crases. 4. Não inclua "Atenciosamente". 5. Não inclua saudações finais. 6. O título sem "COMUNICADO"`,
              }],
            }),
          }
        );
        const dataGroq = await responseGroq.json();
        if (!responseGroq.ok) throw new Error(dataGroq?.error?.message || "Erro Groq");
        textoBruto = dataGroq.choices?.[0]?.message?.content || "";
      }

      textoBruto = textoBruto.replace(/```html|```/gi, "").trim();

      if (textoBruto.includes("[TITULO]") && textoBruto.includes("[CORPO]")) {
        const partes = textoBruto.split("[CORPO]");
        const tituloExtraido = partes[0].replace("[TITULO]", "").replace("[CORPO]", "").trim();
        const corpoExtraido = partes[1].trim();

        setTitulo(tituloExtraido);
        // ATUALIZAÇÃO DO TIPTAP
        if (editor) {
          editor.commands.setContent(corpoExtraido);
          editor.commands.setTextAlign('justify');
        }
      } else {
        const tituloFallback = prompt.toUpperCase() || "COMUNICADO IMPORTANTE";
        setTitulo(tituloFallback);
        if (editor) editor.commands.setContent(textoBruto);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar conteúdo.");
    } finally {
      setIsGerando(false);
    }
  };

  if (!editor) return null;

  const getFontSize = () => {
  const attrs = editor.getAttributes('textStyle');
  return attrs.fontSize ? parseInt(attrs.fontSize) : 16; // padrão 16px
};

  const baixarPDF = async () => {
  const canvas = await html2canvas(a4Ref.current, {
    scale: 3, // 🔥 AQUI A QUALIDADE (2 = HD | 3 = Full HD | 4 = 4K)
    useCORS: true
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = 210;
  const pdfHeight = 297;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("comunicado.pdf");
};

const baixarImagem = async () => {
  const element = a4Ref.current;

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    width: element.offsetWidth,   // 🔥 força largura atual
    height: element.offsetHeight, // 🔥 força altura atual
  });

  const link = document.createElement("a");
  link.download = "comunicado.jpeg";
  link.href = canvas.toDataURL("image/jpeg", 1.0);
  link.click();
};

const imprimir = () => {
  const conteudo = a4Ref.current.innerHTML;

  const janela = window.open('', '', 'height=800,width=600');

  janela.document.write(`
    <html>
      <head>
        <title>Imprimir Comunicado</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        ${conteudo}
      </body>
    </html>
  `);

  janela.document.close();
  janela.focus();
  janela.print();
  janela.close();
};

const compartilharImagemWhatsApp = async () => {
  const element = a4Ref.current;

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    width: element.offsetWidth,
    height: element.offsetHeight,
  });

  const image = canvas.toDataURL("image/png");

  const blob = await (await fetch(image)).blob();
  const file = new File([blob], "comunicado.png", { type: "image/png" });

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Comunicado",
        text: "📢 Comunicado do condomínio",
        files: [file],
      });
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      console.log("Share cancelado");
    }
  } else {
    const link = document.createElement("a");
    link.href = image;
    link.download = "comunicado.png";
    link.click();
  }
};

  return (
    <div style={{ padding: "10px" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: theme.text, marginBottom: "5px" }}>
            Novo Comunicado com IA
          </h1>
          <p style={{ color: theme.textSecondary }}>
            Gere rascunhos profissionais e edite-os diretamente na folha.
          </p>
        </div>
        <button style={{...btnAjudar, backgroundColor: "#065f46"}}>
          <Sparkles size={16} /> Como funciona?
        </button>
      </div>

      <div style={contentGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ ...sectionCard, backgroundColor: theme.mainBg, borderColor: theme.border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Bot size={22} color={COR_TURQUESA} />
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: theme.text }}>Assistente de IA</h3>
            </div>

            <label style={labelStyle}>O que você quer comunicar?</label>
            <textarea 
              style={{ ...textAreaStyle, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }}
              placeholder="Ex: Manutenção da piscina..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <label style={labelStyle}>Tom de Voz</label>
            <select 
              style={{ ...selectStyle, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }}
              value={tom}
              onChange={(e) => setTom(e.target.value)}
            >
              <option value="Formal">Formal</option>
              <option value="Amigável">Amigável</option>
              <option value="Urgente">Urgente</option>
            </select>

            <button 
              onClick={gerarComIA}
              disabled={isGerando}
              style={{...btnGerar, backgroundColor: isGerando ? "#94a3b8" : COR_TURQUESA}}
            >
              <Sparkles size={18} />
              {isGerando ? "Processando..." : "Gerar Comunicado"}
            </button>
          </div>

          <div style={{ ...dicaCard, backgroundColor: "#f0fdfa", borderColor: "#ccfbf1" }}>
            <Lightbulb size={20} color={COR_TURQUESA} />
            <p style={{ color: COR_TURQUESA, fontSize: '13px', margin: 0 }}>
              O texto da IA aparecerá dentro da folha. Você pode clicar e editar qualquer parte.
            </p>
          </div>
        </div>

        <div style={{ ...sectionCard, backgroundColor: theme.mainBg, borderColor: theme.border, padding: 0 }}>
          <div style={previewHeader}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
              
              {/* HISTÓRICO */}
              <button onClick={() => editor.chain().focus().undo().run()} style={btnToolbar}><Undo size={16}/></button>
              <button onClick={() => editor.chain().focus().redo().run()} style={btnToolbar}><Redo size={16}/></button>
              <div style={divisor} />

              {/* FORMATAÇÃO */}
              <button 
                onClick={() => editor.chain().focus().toggleBold().run()} 
                style={{...btnToolbar, backgroundColor: editor.isActive('bold') ? '#cbd5e1' : '#f8fafc'}}
              >
                <Bold size={16}/>
              </button>
              <button 
                onClick={() => editor.chain().focus().toggleItalic().run()} 
                style={{...btnToolbar, backgroundColor: editor.isActive('italic') ? '#cbd5e1' : '#f8fafc'}}
              >
                <Italic size={16}/>
              </button>
              <button onClick={() => editor.chain().focus().toggleHighlight().run()} style={btnToolbar}><Highlighter size={16}/></button>
              
              <input 
                type="color" 
                onInput={e => editor.chain().focus().setColor(e.target.value).run()}
                style={{ width: '25px', height: '25px', border: 'none', background: 'none', cursor: 'pointer' }}
              />

              <button
  onClick={() => editor.chain().focus().setColor(COR_TURQUESA).run()}
  style={{
    width: '25px',
    height: '25px',
    borderRadius: '6px',
    background: COR_TURQUESA,
    border: '1px solid #e2e8f0',
    cursor: 'pointer'
  }}
  title="Cor padrão do sistema"
/>

              <div style={divisor} />

              {/* ALINHAMENTO */}
              <button onClick={() => editor.chain().focus().setTextAlign('left').run()} style={btnToolbar}><AlignLeft size={16}/></button>
              <button onClick={() => editor.chain().focus().setTextAlign('center').run()} style={btnToolbar}><AlignCenter size={16}/></button>
              <button onClick={() => editor.chain().focus().setTextAlign('right').run()} style={btnToolbar}><AlignRight size={16}/></button>
              <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} style={btnToolbar}><AlignJustify size={16}/></button>

              <div style={divisor} />

              {/* EXTRAS */}
              <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnToolbar}><List size={16}/></button>
              <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnToolbar}><ListOrdered size={16}/></button>
              <button onClick={() => editor.chain().focus().unsetAllMarks().run()} style={btnToolbar} title="Limpar"><Eraser size={16}/></button>
              <select
  onChange={(e) => {
    editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
  }}
  style={{
    padding: '5px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '12px'
  }}
>
  <option value="">Tamanho</option>
  <option value="12px">12</option>
  <option value="14px">14</option>
  <option value="16px">16</option>
  <option value="18px">18</option>
  <option value="20px">20</option>
  <option value="24px">24</option>
  <option value="28px">28</option>
</select>
{/* DIMINUIR */}
  <button
    onClick={() => {
  const current = getFontSize();
  const newSize = Math.max(10, current - 1);

  editor.chain().focus().setMark('textStyle', {
    fontSize: `${newSize}px`
  }).run();

  forceUpdate(v => v + 1);
}}
    style={btnToolbar}
    title="Diminuir fonte"
  >
    ➖
  </button>

  {/* MOSTRAR TAMANHO */}
  <span style={{ fontSize: '12px', minWidth: '30px', textAlign: 'center', color: '#333' }}>
    {getFontSize()}px
  </span>

  {/* AUMENTAR */}
  <button
    onClick={() => {
  const current = getFontSize();
  const newSize = current + 1;

  editor.chain().focus().setMark('textStyle', {
    fontSize: `${newSize}px`
  }).run();

  forceUpdate(v => v + 1);
}}
    style={btnToolbar}
    title="Aumentar fonte"
  >
    ➕
  </button>
            </div>
            <div style={{ position: 'relative' }}>
  <button 
    onClick={() => setMenuAberto(!menuAberto)}
    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
  >
    <MoreHorizontal size={20} color={theme.textSecondary} />
  </button>

  {menuAberto && (
  <div style={{
    position: 'absolute',
    right: 0,
    top: '30px',
    background: theme.mainBg, // ✅ CORRIGIDO
    border: `1px solid ${theme.border}`, // ✅ CORRIGIDO
    borderRadius: '10px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    zIndex: 10
  }}>
    
    <div 
      onClick={() => { baixarPDF(); setMenuAberto(false); }}
      style={{...itemMenu, color: theme.text}} // ✅ CORRIGIDO
    >
      📄 Baixar como PDF
    </div>

    <div 
      onClick={() => { baixarImagem(); setMenuAberto(false); }}
      style={{...itemMenu, color: theme.text}} // ✅ CORRIGIDO
    >
      🖼️ Baixar como JPEG
    </div>

    <div 
      onClick={() => { imprimir(); setMenuAberto(false); }}
      style={{...itemMenu, color: theme.text}} // ✅ CORRIGIDO
    >
      🖨️ Imprimir
    </div>

    <div 
  onClick={() => { compartilharImagemWhatsApp(); setMenuAberto(false); }}
  style={{...itemMenu, color: theme.text}}
>
  📲 Compartilhar no WhatsApp (Imagem)
</div>
  </div>
)}
</div>
          </div>

          <div style={previewContent}>
            <div style={a4Paper} ref={a4Ref}>
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ ...logoWrapper, marginTop: '-30px' }}>
                  <img src="/favicon.png" alt="Logo" style={{ width: '90px', height: '90px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: COR_TURQUESA, letterSpacing: '2px' }}>
                    NOVO RECREIO
                </span>
                <div style={{ height: '2px', background: COR_TURQUESA, marginTop: '15px', opacity: 0.2 }} />
              </div>

              <h2 
                contentEditable={true}
                suppressContentEditableWarning={true}
                onBlur={(e) => setTitulo(e.currentTarget.innerText.replace("COMUNICADO: ", ""))}
                style={{...tituloComunicado, color: COR_TURQUESA, outline: 'none'}}
              >
                {titulo ? `COMUNICADO: ${titulo}` : "AGUARDANDO TÍTULO..."}
              </h2>
              
              <p style={metaData}>Data: {dataAtual}</p>

              <div style={textoCorpo}>
                {/* O TIPTAP ENTRA AQUI */}
                <EditorContent editor={editor} />

                <div style={assinaturaContainer}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Atenciosamente,</p>
                    <div style={{ width: '200px', height: '1px', backgroundColor: COR_TURQUESA, margin: '40px auto 10px auto', opacity: 0.3 }} />
                    <strong style={{ display: 'block', fontSize: '16px', color: COR_TURQUESA, textTransform: 'uppercase' }}>
                      O Síndico
                    </strong>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Condomínio Novo Recreio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Estilos
const a4Paper = { width: '170mm', minHeight: '270mm', padding: '20mm', backgroundColor: '#fff', boxShadow: "0 0 20px rgba(0,0,0,0.1)", color: '#333', margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' };
const contentGrid = { display: "grid", gridTemplateColumns: "400px 1fr", gap: "25px", alignItems: "start" };
const sectionCard = { padding: "24px", borderRadius: "20px", border: "1px solid", overflow: "hidden" };
const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', marginTop: '20px' };
const textAreaStyle = { width: '100%', minHeight: '120px', borderRadius: '12px', padding: '12px', fontSize: '14px', border: '1px solid', resize: 'none', outline: 'none' };
const selectStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid', outline: 'none' };
const btnGerar = { width: '100%', marginTop: '25px', padding: '14px', borderRadius: '12px', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const btnAjudar = { color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const dicaCard = { padding: '15px', borderRadius: '15px', border: '1px solid', display: 'flex', gap: '12px', alignItems: 'center' };
const previewHeader = { padding: '15px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' };
const previewContent = { padding: '20px', display: 'flex', justifyContent: 'center', overflowY: 'auto', maxHeight: '800px', backgroundColor: '#e2e8f0' };
const logoWrapper = { marginBottom: '10px', display: 'flex', justifyContent: 'center' };
const tituloComunicado = { fontSize: '20px', textAlign: 'center', fontWeight: '800', marginBottom: '10px' };
const metaData = { fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '40px' };
const textoCorpo = { fontSize: '16px', lineHeight: '1.8', color: '#1e293b', flex: 1, display: 'flex', flexDirection: 'column','& strong': {
    color: '#014731'} };
const assinaturaContainer = { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'auto' };
const divisor = { width: '1px', height: '20px', background: '#e2e8f0', margin: '0 5px' };
const btnToolbar = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: '0.2s'
};
const itemMenu = {
  padding: '10px 15px',
  cursor: 'pointer',
  fontSize: '14px',
  whiteSpace: 'nowrap',
  color: '#1e293b',
  transition: '0.2s'
};