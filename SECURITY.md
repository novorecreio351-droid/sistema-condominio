# Relatório de Segurança — condominio-system

Revisão realizada em 2026-06-01. Este documento lista as falhas encontradas, o que já
foi corrigido no código (frontend) e o que **exige ação manual** (backend Apps Script,
chaves, infraestrutura), já que o Apps Script não faz parte deste repositório.

---

## 🔴 CRÍTICO — exige ação imediata

### 1. Chaves/segredos embutidos no bundle do navegador
Qualquer variável `VITE_*` usada no código vai para o JavaScript público (basta abrir o
DevTools > Sources, ou baixar o `.js` do site). Hoje estão expostas:

| Variável | Onde | Risco |
|---|---|---|
| `VITE_SHEETS_TOKEN` (`NOV0CR818`) | todas as páginas | acesso total de leitura/escrita ao backend |
| `VITE_API_KEY_IA` (Google AI) | `Comunicado.jsx` | uso indevido / cobrança na sua conta |
| `VITE_API_KEY_GROQ` (Groq) | `Comunicado.jsx` | uso indevido / cobrança na sua conta |

**Ações:**
1. ✅ **FEITO** — As chaves de **Google AI e Groq saíram do frontend**. As chamadas de IA agora
   passam por um **proxy no backend** (`action: "gerarIA"`), e as chaves ficam em Script Properties
   (`API_KEY_IA`, `API_KEY_GROQ`) com fallback transitório. O bundle não contém mais essas chaves.
2. ⛔ **PENDENTE (você)** — **Rotacionar as 3 chaves** (continuam comprometidas pelo histórico) e
   colocar as NOVAS de IA nas Script Properties; depois **remover o fallback hardcoded** em
   `handleGerarIA_`.
3. ⛔ **PENDENTE (você)** — Restringir a chave do **Google AI** por *HTTP referrer*/IP no Cloud Console.
4. O `VITE_SHEETS_TOKEN` **não é um segredo de verdade** num app client-side. Agora pode ser trocado
   só pela Script Property `TOKEN_SISTEMA` (sem editar código). A segurança real vem do backend (item 2).

### 2. Senhas em texto puro e API pública
- O endpoint `GET ?sheet=usuarios` devolve **todas as colunas de todos os usuários,
  incluindo a senha em texto puro**. Como o token é público, qualquer pessoa consegue baixar
  a lista de logins e senhas do condomínio.
- O `login` também retorna o objeto do usuário **com a senha**.
- A senha trafega na **URL** (`GET ...&senha=...`) → fica em histórico, logs de proxy e logs do Google.

**Ações no backend (Apps Script):**
1. ✅ **FEITO** — `login` não retorna mais `senha`/`password` (`delete obj.senha`), e o
   `GET ?sheet=usuarios` filtra `senha`, `password`, `token` e `data_token`. Listagem pré-login
   agora só expõe `id`, `nome`, `email`, `cargo`.
2. ✅ **FEITO** — `doPost` **bloqueia** qualquer create/edit/delete na aba `usuarios`
   (gerenciamento de usuários só direto na planilha).
3. 🟡 **PARCIAL** — Suporte a **hash de senha** (SHA-256 + pepper) já implementado no `login`
   (`hashSenha_`/`handleLogin_`), com **fallback texto-puro** para não quebrar nada. Falta você
   rodar a migração **uma vez** (função `migrarSenhas` no editor) e, após confirmar, limpar a
   coluna `senha`. Ver "Passos manuais" no fim deste doc.
4. ✅ **FEITO** — `login` agora também aceita **POST** (senha no corpo, não na URL). O frontend
   (`SelecaoUsuario.jsx`) já usa POST; o GET continua aceito por compatibilidade.
5. ⛔ **PENDENTE** — Autorização por cargo no backend (um porteiro não deveria editar `COMPRAS`
   etc.). Hoje qualquer um com o token faz qualquer operação nas demais abas. Requer um modelo
   de identidade/sessão real — não dá para fazer com segurança sem mudar a arquitetura de auth.

> Mitigação já aplicada no frontend (defesa em profundidade): a senha é descartada assim que
> chega e **não é mais guardada** em estado/sessionStorage (`SelecaoUsuario.jsx`).

### 3. Dados pessoais (LGPD) abertos
Com o token público, qualquer um baixa CPF, RG, telefone e e-mail de todos os moradores
(`MORADORES`, `PISCINA`, `FESTAS`, etc.). Mesmo problema-raiz do item 2: a API não tem
autenticação real. A correção é a autorização no backend (item 2.4) + considerar minimizar
quais colunas sensíveis são enviadas ao client.

---

## 🟠 MÉDIO

### 4. Dependência `xlsx@0.18.5` vulnerável — ✅ RESOLVIDO (2026-06-03)
Possuía CVEs conhecidas (prototype pollution — CVE-2023-30533 — e ReDoS). A versão corrigida
não está no npm (a SheetJS distribui pela CDN própria).
- **Feito:** trocado para a distribuição oficial `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`
  (mesmo nome de pacote, imports inalterados). `npm audit` agora reporta 0 vulnerabilidades; build validado.

### 5. Falha de gravação silenciosa (`mode: "no-cors"`)
Várias páginas gravam com `no-cors`, que impede ler a resposta — erros do servidor passam
despercebidos. (No fluxo de Encomendas isso já foi tratado.) Vale padronizar a leitura da
resposta nas demais telas para detectar falhas reais.

---

## 🟡 BAIXO / Higiene

### 6. Logs sensíveis no console
Havia `console.log` imprimindo o payload completo (token + telefone + fotos base64) em
`Encomendas.jsx` — **removido**. Recomenda-se varrer os demais `console.log`/`console.error`
que imprimem registros com PII e removê-los do build de produção.

### 7. `window.open` para WhatsApp
Já usa `noopener,noreferrer` no envio principal — manter esse padrão em qualquer novo `window.open`.

---

## ✅ Já corrigido e publicado

**Frontend (`src/`)**
- `SelecaoUsuario.jsx`: senha descartada na entrada e no login; não persiste mais no navegador.
- `Encomendas.jsx`: removido o log que vazava token/telefone/fotos no console.

**Backend (`appscript/Código.js`) — publicado via `clasp push` + redeploy (deployment @104)**
- `login` não devolve mais `senha`/`password`/`token`/`data_token` (+ comparação à prova de nulo).
- `GET ?sheet=usuarios` filtra `senha`, `password`, `token`, `data_token` da listagem.
- `doPost` bloqueia qualquer escrita na aba `usuarios`.
- Token lido de **Script Properties** (`TOKEN_SISTEMA`) com fallback — rotaciona sem editar código.
- **Proxy de IA** (`action: "gerarIA"`): Gemini + fallback Groq no servidor; chaves fora do frontend.
- **Login via POST** (senha no corpo) + suporte a **hash de senha** (`hashSenha_`) com fallback texto-puro.
- Função **`migrarSenhas`** para gerar os hashes das senhas existentes.

**Frontend (rebuild necessário / deploy na Vercel)**
- `Comunicado.jsx`: IA agora via proxy do backend (sem chaves no bundle — confirmado no `dist/`).
- `SelecaoUsuario.jsx`: login via POST.
- `.env.local`: chaves de IA removidas.

---

## 🛠️ Passos manuais para concluir (na ordem)

1. ✅ **FEITO** — Reautorização do escopo de requisição externa (`script.external_request`) do proxy
   de IA, via função `autorizarIA` (rodada no editor). Proxy validado em produção (@106).
   > Obs.: `migrarSenhas` sozinha NÃO concede esse escopo (não usa `UrlFetchApp`); por isso a
   > `autorizarIA` foi criada. Se um dia o proxy voltar a dar "Não foi possível gerar", rode
   > `autorizarIA` de novo e aceite a permissão.
2. **(Opcional, recomendado) Definir `SENHA_PEPPER`** em Configurações do projeto → Propriedades do
   script (qualquer string aleatória longa). **Defina ANTES** de rodar a migração.
3. **Rodar `migrarSenhas` uma vez** (Executar → `migrarSenhas`). Cria a coluna `senha_hash`.
4. **Testar o login** de um usuário. Funcionando, **apague a coluna `senha`** da planilha
   (o login passa a usar só o hash; o fallback texto-puro deixa de ser necessário).
5. **Rotacionar as chaves** (Google AI, Groq, e o `TOKEN_SISTEMA`/`VITE_SHEETS_TOKEN`):
   - Defina `API_KEY_IA` e `API_KEY_GROQ` (novas) nas Propriedades do script e **remova o fallback
     hardcoded** em `handleGerarIA_`.
   - Defina `TOKEN_SISTEMA` (novo) na Propriedade do script e atualize `VITE_SHEETS_TOKEN` no `.env.local`.
   - Restrinja a chave do Google AI por referrer/IP no Cloud Console.
6. **Rebuild + deploy do frontend** (Vercel) para o login-POST e o proxy de IA entrarem no ar.

## ⛔ Ainda em aberto (decisões suas)
- **Autorização por cargo** no backend (item 2.5) — precisa de modelo de sessão/identidade real.
- **xlsx@0.18.5** (item 4) — decisão de dependência.
- Confirmar a finalidade das colunas `token`/`data_token` da aba usuarios (filtradas por precaução).

---

# Auditoria 2026-06-02 — Novos achados (sistema inteiro)

Auditoria completa de backend (Apps Script), autenticação/sessão/segredos e renderização de
dados (XSS/injeção). Abaixo apenas os achados **novos** que não estavam no relatório de 2026-06-01.

## 🔴 CRÍTICO

### N1. Chaves de IA hardcoded ainda presentes no fonte commitado — ✅ RESOLVIDO (2026-06-02, deploy @115)
`appscript/Código.js` — `GEMINI_KEY`/`GROQ_KEY` tinham fallback literal.
- **Impacto:** quem tinha acesso ao repo extraía as chaves → uso indevido/cobrança.
- **Feito:** chaves rotacionadas pelo usuário e definidas em Script Properties (`API_KEY_IA`, `API_KEY_GROQ`);
  fallback hardcoded **removido** de `handleGerarIA_` (lê só das Properties; falha fechado se ausentes).
- **Obs:** as chaves ANTIGAS ainda existem no histórico do git, mas já foram revogadas/rotacionadas → inúteis.
  Optou-se por NÃO reescrever o histórico (decisão do usuário).

## 🟠 HIGH

### N2. `getFoto` é IDOR — leitura de QUALQUER arquivo do Drive do dono
`appscript/Código.js:33-53` — qualquer portador do token passa um `fileId` arbitrário e o backend
devolve os bytes (base64). O script roda como o dono → lê **qualquer arquivo do Drive do dono**, não só fotos do condomínio.
- **Impacto:** leitura arbitrária de arquivos do Drive (IDOR).
- **Fix:** antes de devolver, validar que `file.getParents()` está numa allow-list (`ID_PASTA_*`); não ecoar `err.toString()` ao cliente.

### N3. Injeção pelo parâmetro `sheet` — ler/escrever qualquer aba
`appscript/Código.js:55-57, 101-110` — `doGet`/`doPost` usam `e.parameter.sheet` sem allow-list. A única
proteção é o caso especial `usuarios`. Abas como `AUDITORIA`, `ASSINATURA` (guarda assinaturas base64) e `log`
são totalmente dumpáveis/graváveis.
- **Fix:** allow-list explícita de abas legíveis/graváveis por cargo.

### N4. XSS na impressão do Comunicado (`document.write` + título não escapado)
`src/pages/Comunicado.jsx:216-289` — `imprimir()` injeta `innerHTML` e `${tituloDocumento}` crus em
`janela.document.write(...)`, inclusive dentro de um `<script>`. O título vem da IA/edição manual.
Um título como `</title><img src=x onerror=...>` executa JS na origem da app (mesma origem → acesso ao `sessionStorage`/TOKEN).
- **Impacto:** XSS armazenado → roubo de sessão/token.
- **Fix:** não usar `document.write`; construir via DOM com `textContent` no título; passar o corpo por DOMPurify; remover o `<script>` inline (usar `janela.onload`).

### N5. Sessão forjável — escalonamento de privilégio via `sessionStorage`
`src/App.jsx:34-81` + `src/auth/permissions.js` — o objeto do usuário (com `cargo`) fica em `sessionStorage`
sem assinatura. Editar `cargo` para `Desenvolvedor` no DevTools libera todos os menus/rotas; como o backend
não revalida o cargo, o privilégio escalado vale também nas chamadas reais.
- **Fix (raiz):** cargo derivado de token de sessão assinado pelo servidor + autorização server-side (mesmo problema do item 2.5).

## 🟡 MEDIUM

### N6. Formula/CSV injection (escrita no Sheets e exportações)
Backend grava campos verbatim (`appendRow`/`setValues`); frontend exporta XLSX com campos crus
(`Piscina.jsx:535`, `Moradores.jsx:217`, `Festas.jsx:694`, `Churrasqueira.jsx:759`, `Mudancas.jsx:325`,
`Vagas.jsx:140`, `Unidades.jsx:225`). Valor iniciando com `= + - @` vira fórmula no Excel/Sheets.
- **Fix:** prefixar `'` (aspa simples) em strings que começam com `= + - @`, no backend (centralizado) e antes de exportar.

### N7. Arquivos do Drive como `ANYONE_WITH_LINK`
`appscript/Código.js:428, 668, 1473, 1737, 1772, 1793` — fotos, atestados médicos (piscina) e assinaturas
ficam acessíveis por link a qualquer um que o obtenha.
- **Fix:** manter privados e servir só via backend autenticado (padrão `getFoto` corrigido).

### N8. URLs da planilha abertas sem validar o scheme — ✅ RESOLVIDO (2026-06-03)
`Churrasqueira.jsx:2196`, `Festas.jsx:2057`, `Piscina.jsx:1947`, `Compras.jsx:1459` — `window.open(url)`/`<a href>`
usavam URLs vindas do Sheets/Drive. Um `javascript:`/`data:text/html,` executaria script na origem.
- **Feito (quick-wins):** `abrirUrlSegura()` (valida `https?://` + `noopener,noreferrer`) em Festas/Churrasqueira.
- **Feito (2026-06-03):** os dois `<a href>` residuais validados — `Compras.jsx` (anexos) e `Piscina.jsx`
  (atestado) só renderizam href `https?://`; caso contrário caem no link do Drive construído/`undefined`.

### N9. `window.open` sem `noopener` (tabnabbing)
`Churrasqueira.jsx:2196`, `Festas.jsx:2057` (e `Piscina.jsx:1949` só com `noreferrer`).
- **Fix:** `window.open(url, '_blank', 'noopener,noreferrer')` / `rel="noopener noreferrer"`.

### N10. Upload base64 sem validação de tipo/tamanho real
Handlers em Encomendas/Festas/Churrasqueira/Piscina/Compras/Mudancas confiam só no `accept` do input.
- **Fix:** validar `file.type` e `file.size`; ao abrir, garantir `image/*` (nunca `text/html`).

## 🟢 LOW / Higiene

- **N11.** `vercel.json` sem cabeçalhos de segurança (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy). Sem CSP, um XSS tem mais alcance + risco de clickjacking.
- **N12.** `.gitignore` cobre só `*.local`; não cobre `.env`/`.env.*`. Hoje o segredo está em `.env.local` (ignorado, OK), mas um `.env` futuro seria commitado. Adicionar `.env`, `.env.*`, `!.env.example`.
- **N13.** `console.log` com PII em `Moradores.jsx:323` (lista de vagas/moradores) e outros — remover do build de produção.
- **N14.** Vazamento de detalhe de erro ao cliente: `getFoto` (`err.toString()`, linha 51) e `errRow.toString()` (504/549). Retornar mensagem genérica; logar detalhe só no servidor.
- **N15.** Login GET ainda aceito (`Código.js:28-31`) coloca senha na URL/logs. Remover o ramo GET (POST já existe).
- **N16.** ✅ RESOLVIDO (deploy @117) — migração de hash concluída pelo usuário, coluna `senha` apagada, e o fallback de texto puro removido do `handleLogin_`. Login agora exige `senha_hash`.

## ✅ Pontos positivos confirmados nesta auditoria
- Nenhum `dangerouslySetInnerHTML`, `eval` ou `new Function` em `src/pages`.
- Editor de Comunicado usa **TipTap** (sanitiza o HTML da IA ao montar) — o XSS só existe no caminho de impressão (N4).
- `getWhatsappUrl` escapa a mensagem (`encodeURIComponent`) e reduz o telefone a dígitos.
- `Encomendas.jsx`/`Compras.jsx` já usam `noopener,noreferrer`.
- Backend: aba `usuarios` protegida, credenciais removidas das respostas, hash de senha implementado, proxy de IA server-side.
- `.env.local` corretamente ignorado e não rastreado.

## Prioridade de correção
1. ✅ **Rotacionar chaves de IA + remover fallback** (N1) — FEITO (deploy @115).
2. ✅ **Autorização server-side por cargo + sessão assinada** (N5) — ATIVO em produção (Fase 2, deploy @116,
   `ENFORCE_SESSION=true`). Validado: leitura/escrita exigem sessão; cargo vem da planilha (sem escalonamento);
   sessão ausente/adulterada é recusada.
3. ✅ **`getFoto` IDOR + allow-list de abas** (N2, N3) — FEITO (deploy @113).
4. ✅ **XSS de impressão do Comunicado** (N4) — FEITO.
5. ✅ **Quick-wins frontend** (N8, N9, N11, N12, N13, N6-export) — FEITO.

## Fase 2 — sessão + autorização por cargo (rollout pendente do usuário)
Código pronto e deployado (backend @116, gated por `ENFORCE_SESSION`). Para ativar:
1. Apps Script → Propriedades do script → `SESSION_SECRET` = string aleatória longa; `ENFORCE_SESSION` = `false`.
2. Rebuild + deploy do frontend na Vercel (todas as páginas já enviam a sessão).
3. Testar: login retorna sessão (DevTools → sessionStorage.sessionToken preenchido); app funciona.
4. Flipar `ENFORCE_SESSION` = `true`. Rollback = `false` (sem deploy).
5. Aceite: Porteiro grava só Encomendas; editar `cargo` no sessionStorage não escala (cargo vem da planilha); sessão adulterada/expirada é recusada.
