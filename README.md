# 🥕 Despensa

App pessoal para controlar a comida de casa e parar de desperdiçar:

- **Adicionar rápido** — no botão +: escreva ou dite "6 ovos, 1kg arroz e 2 litros de leite" e o app separa os itens, entende quantidades e sugere local e validade; "Comprar de novo" adiciona com um toque o que você mais usa; no código de barras, produto conhecido entra com um toque.
- **Despensa** — tudo o que tem em casa, onde está (geladeira, freezer, despensa), quando comprou e quando vence. Ordena por validade e destaca o que está vencendo ou já venceu.
- **Foto da nota fiscal** — tire foto do cupom do mercado e a IA (Claude) lê os produtos, traduz as abreviações ("PTO FGO SADIA KG" → "Peito de frango"), sugere onde guardar e estima a validade. Você confere, ajusta e adiciona tudo de uma vez.
- **Livro de receitas** — vem com 23 receitas caseiras e você pode cadastrar as suas. O app cruza os ingredientes com sua despensa e mostra o que **dá pra fazer agora**, o que **falta pouco**, e prioriza receitas que **aproveitam itens perto de vencer**.
- **Sugestão com IA** — pede uma receita nova baseada no que você tem, e salva no livro se gostar.
- **Lista de compras** — numa receita, "Adicionar o que falta à lista" põe os ingredientes que faltam (sem duplicar). Sugere de novo o que acabou recentemente, avisa se você já tem o item em casa, envia a lista pelo WhatsApp e, depois da compra, guarda o que foi marcado direto na despensa com validade sugerida.
- **Código de barras** — aponte a câmera para a embalagem; o app busca o produto no Open Food Facts (base gratuita) e preenche nome e categoria. Da segunda vez, ele lembra sozinho (funciona offline). "Adicionar e ler outro" agiliza guardar as compras.
- **Cardápio da semana** — em Receitas → Semana, escolha almoço/jantar de cada dia ou toque em "Preencher vazios" (prioriza o que você já tem e o que vence antes). "Lista da semana" põe na lista de compras o que falta — conferindo a validade no dia de cada refeição.
- **Desperdício** — na tela inicial, "ver desperdício": aproveitado × jogado fora nos últimos 6 meses, quanto custou (quando o item tem preço — vem da foto da nota) e o que mais estraga, com dicas.
- **Validade inteligente** — o app sabe que arroz, açúcar, sal e enlatados fechados costumam durar além da data impressa ("passou da data — confira") e que carne, leite e iogurte não; e que depois de aberto cada coisa dura um prazo diferente (leite 3 dias, arroz meses).
- **Aberto e pote** — "Abri a embalagem" passa a contar a validade de aberto e sugere a geladeira quando precisa; "Separei uma parte em outro pote" divide o item (ex.: 1 kg num pote no armário, 4 kg no saco na despensa).
- **Foto do produto** — se o código de barras não for encontrado (ou o produto não tiver código), tire foto da embalagem: o app lê o nome (o texto maior), o peso líquido e a validade, e lembra do código para a próxima vez.
- **Foto da validade** — no app Android, "Ler validade pela foto" lê a data impressa na embalagem (VAL/VENC, dd/mm/aa, "12 MAR 2027", "03/2027"…), sem internet e sem custo.
- **Receita por foto** — fotografe uma ou mais páginas do livro e o app separa título, ingredientes e modo de preparo (no aparelho, grátis). Ou envie as fotos para o seu app do Claude com as instruções prontas e cole a resposta de volta — usa a sua assinatura, sem chave de API.
- **Gestos** — na despensa, deslize um item para a direita quando usar (tira 1 unidade, ou tudo se for por peso) e para a esquerda se jogou fora; dá para desfazer.
- **Modo escuro** — Ajustes → Aparência: Automático (segue o celular), Claro ou Escuro.
- **"Cozinhei"** — ao fazer uma receita, marca o que acabou e o app tira da despensa.
- **Avisos** — notificação diária (ao abrir o app) do que vence nos próximos dias, e um placar de quanto foi aproveitado × jogado fora.

Os dados ficam **só no seu aparelho** (IndexedDB do navegador). Use Ajustes → Backup para exportar/importar.

## Instalar no Android (APK)

O APK só é gerado quando alguém pede: aba **Actions** → **APK Android** → **Run workflow** (branch `main`). O resultado é publicado em **Releases**.

- Link fixo do APK mais recente: <https://github.com/cauefeliciano14/food/releases/latest/download/despensa.apk>
- No celular: abra o link, baixe e toque no arquivo. Na primeira vez o Android pede para **permitir instalar apps desta fonte** (Chrome) — permita.
- Atualizar: baixe o APK novo e instale por cima. Os dados continuam (o APK é sempre assinado com a mesma chave).

> A chave que assina o APK fica nos segredos do repositório (**Settings → Secrets and variables → Actions**: `ANDROID_KEYSTORE_BASE64` e `ANDROID_KEYSTORE_PASSWORD`), nunca no código. Sem esses segredos o workflow ainda compila um APK de teste (artefato), mas não publica a release. Guarde uma cópia da chave: sem ela, atualizações exigem desinstalar o app.

### Nota fiscal grátis (QR code)
No app Android, **Nota fiscal → Ler QR code da nota** lê o QR do fim do cupom (NFC-e), busca a página da SEFAZ e importa todos os itens com quantidade e preço — sem IA e sem custo. Funciona com o layout nacional de consulta usado pela maioria dos estados. No navegador, a SEFAZ bloqueia a leitura (CORS), por isso só no app.

## Usar no navegador (opcional)

É um PWA: abra o site no celular e use **"Adicionar à tela inicial"** (Safari: compartilhar → Adicionar à Tela de Início; Chrome: menu ⋮ → Instalar app). Ele abre como um app e funciona offline (a leitura de nota precisa de internet).

### Publicar no GitHub Pages
1. No GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Rode o workflow **Deploy (GitHub Pages)** na aba Actions. O endereço será `https://<seu-usuario>.github.io/food/`.

### IA e internet (Ajustes)
- **IA (Claude, opcional e paga por uso):** ligue em **Ajustes → IA**, cole uma chave de <https://console.anthropic.com/settings/keys> e escolha um **limite de gasto por mês** (US$ 1 a 20). O app conta o gasto de cada uso (com folga) e para de chamar a IA ao chegar no limite. Cada função tem seu interruptor: foto do produto, foto da validade (só quando a leitura grátis falha), receita por foto, receita por link (só quando o site não tem formato padrão), nota sem QR code e sugestões de receita.
- **Internet:** em **Ajustes → Internet** você liga/desliga a base de produtos (Open Food Facts), a consulta da nota na SEFAZ e os sites de receita. Tudo desligado, o app funciona offline.
- **Receita por link:** cole o link (TudoGostoso, Panelinha, Nestlé…). A maioria dos sites publica a receita em formato padrão (schema.org) e o app lê de graça; os outros usam a IA, se ligada.

> Como o app é só para você, a chave fica no navegador. Não publique uma versão com a chave embutida.

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes da lógica (validade, matching de ingredientes)
npm run build
npx cap sync android   # copia o build para o projeto Android (android/)
```

Stack: React + TypeScript + Vite, Dexie (IndexedDB), SDK da Anthropic (`claude-opus-5-5`, saída estruturada com Zod).

Estrutura:
- `src/lib/` — dados (`db.ts`), datas/validade, normalização e matching de ingredientes, receitas iniciais, IA.
- `src/screens/` — Início, Despensa, Receitas, Ajustes, leitura de nota.
- `src/components/` — formulários e detalhes.
