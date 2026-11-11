# Checklist de testes — Despensa 1.14

Marque `[x]` no que funcionou. Se algo falhar, mande um print da tela e diga o que esperava.

## 1. Instalação
- [ ] Instalei por cima da versão anterior e **meus itens continuam lá**
- [ ] Em Ajustes, no fim da tela, aparece **Despensa 1.14**

## 2. IA (Ajustes → IA)
- [ ] Liguei **Usar IA**, colei a chave e o limite está em **US$ 3**
- [ ] Preenchi **"A chave vence em"** com a data que aparece em "Expira" no Console
- [ ] Se faltam 3 dias ou menos, aparece o **aviso amarelo** no Início, e tocar nele abre os Ajustes
- [ ] Depois de usar a IA uma vez, o **gasto do mês** sobe alguns centavos e o número de usos aumenta
- [ ] Com **Usar IA desligada**, as fotos continuam funcionando com a leitura grátis do celular

## 3. Fotos (antes dava "image could not be loaded")
- [ ] **Foto da validade** no formulário de item: a data é preenchida
- [ ] **Foto da validade** numa data difícil (relevo, jato de tinta apagado): com IA ligada, aparece "Validade lida pela IA"
- [ ] **Foto da embalagem** (código não encontrado → Foto da embalagem): nome simples, categoria e tamanho certos
- [ ] **Sem código de barras? Foto do produto** (ex.: pão, granel)
- [ ] **Receita por foto → Com IA**: monta a receita certa
- [ ] **Receita por foto → Grátis**: lê uma página impressa
- [ ] **Receita por foto → Meu Claude**: as fotos vão para o app do Claude e a resposta colada vira receita

## 4. Nota fiscal
- [ ] **QR code** da nota importa todos os itens
- [ ] Na revisão, cada item mostra **"Validade estimada"** ou **"Validade conferida"**
- [ ] **Ler validade pela foto** em um item da lista
- [ ] **Conferir validades um a um, com foto**: um item por tela, Anterior / Próximo / Pular e o progresso "Item X de Y"
- [ ] Voltar (gesto) dentro do "um a um" retorna para a lista
- [ ] **Nota sem QR code (foto com IA)** lê o cupom

## 5. Código de barras
- [ ] Produto encontrado → cartão rápido → **Ler outro código** reabre o leitor
- [ ] **Mais detalhes** → **Voltar** retorna ao cartão rápido
- [ ] Código não encontrado → **Ler de novo** e **Foto da embalagem** aparecem
- [ ] O leitor não fica mais "travado" sem botão para tentar de novo

## 6. Navegação (voltar do Android)
- [ ] Item → Editar → **voltar** = volta para o item (não fecha o app)
- [ ] Adicionar → Código de barras → **voltar** = volta para Adicionar
- [ ] Numa aba que não é o Início → **voltar** = vai para o Início
- [ ] No Início → **voltar** = o app vai para segundo plano (só aqui)
- [ ] **Arrastar a barrinha** do topo de qualquer janela para baixo fecha a janela; um puxão curto faz ela voltar

## 7. Receitas
- [ ] O livro tem **74 receitas** (filtro "Todas")
- [ ] **Minhas receitas** aparecem antes das do app
- [ ] **Nova → Link de um site**: link do TudoGostoso ou Panelinha vira receita (sem gastar IA)
- [ ] Um site sem formato padrão usa a IA (se ligada) ou explica por que não leu

## 8. Internet (Ajustes → Internet)
- [ ] Com **Base de produtos** desligada, o código de barras não busca na internet (só os já conhecidos)
- [ ] Com **Nota fiscal (SEFAZ)** desligada, o QR code avisa que está desligado
- [ ] Com **Sites de receita** desligado, o link avisa que está desligado

## 9. Acessibilidade
- [ ] Aumentei a **fonte do Android** (Configurações → Tela → Tamanho da fonte) e o app continua legível, sem textos cortados
- [ ] Com fonte grande, o selo "vence em…" desce para baixo do nome em vez de espremer
- [ ] Botões pequenos (ex.: "Ler validade pela foto") ficam fáceis de tocar
- [ ] Com o **TalkBack** ligado, os botões de ícone dizem o que fazem (ex.: "Ler validade de Leite pela foto")
- [ ] Modo escuro: textos e selos continuam legíveis

## Já validado
- [x] Código de barras com a câmera (versões anteriores)
- [x] Leitura da nota pelo QR code
