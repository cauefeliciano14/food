# 🥕 Despensa

App pessoal para controlar a comida de casa e parar de desperdiçar:

- **Despensa** — tudo o que tem em casa, onde está (geladeira, freezer, despensa), quando comprou e quando vence. Ordena por validade e destaca o que está vencendo ou já venceu.
- **Foto da nota fiscal** — tire foto do cupom do mercado e a IA (Claude) lê os produtos, traduz as abreviações ("PTO FGO SADIA KG" → "Peito de frango"), sugere onde guardar e estima a validade. Você confere, ajusta e adiciona tudo de uma vez.
- **Livro de receitas** — vem com 23 receitas caseiras e você pode cadastrar as suas. O app cruza os ingredientes com sua despensa e mostra o que **dá pra fazer agora**, o que **falta pouco**, e prioriza receitas que **aproveitam itens perto de vencer**.
- **Sugestão com IA** — pede uma receita nova baseada no que você tem, e salva no livro se gostar.
- **"Cozinhei"** — ao fazer uma receita, marca o que acabou e o app tira da despensa.
- **Avisos** — notificação diária (ao abrir o app) do que vence nos próximos dias, e um placar de quanto foi aproveitado × jogado fora.

Os dados ficam **só no seu aparelho** (IndexedDB do navegador). Use Ajustes → Backup para exportar/importar.

## Usar no celular

É um PWA: abra o site no celular e use **"Adicionar à tela inicial"** (Safari: compartilhar → Adicionar à Tela de Início; Chrome: menu ⋮ → Instalar app). Ele abre como um app e funciona offline (a leitura de nota precisa de internet).

### Publicar no GitHub Pages
1. No GitHub: **Settings → Pages → Source: GitHub Actions**.
2. Faça merge para `main` (ou rode o workflow *Deploy* manualmente). O endereço será `https://<seu-usuario>.github.io/food/`.

### Chave da IA
A leitura da nota e as sugestões usam a API da Anthropic. Crie uma chave em <https://console.anthropic.com/settings/keys> e cole em **Ajustes**. A chave fica salva só no aparelho e o app chama a API direto do navegador. Cada foto de nota custa poucos centavos.

> Como o app é só para você, a chave fica no navegador. Não publique uma versão com a chave embutida.

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes da lógica (validade, matching de ingredientes)
npm run build
```

Stack: React + TypeScript + Vite, Dexie (IndexedDB), SDK da Anthropic (`claude-opus-5-5`, saída estruturada com Zod).

Estrutura:
- `src/lib/` — dados (`db.ts`), datas/validade, normalização e matching de ingredientes, receitas iniciais, IA.
- `src/screens/` — Início, Despensa, Receitas, Ajustes, leitura de nota.
- `src/components/` — formulários e detalhes.
