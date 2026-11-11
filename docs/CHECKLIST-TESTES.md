# Checklist de testes — Despensa 1.16

Marque `[x]` no que funcionou. Se algo falhar, mande um print da tela e diga o que esperava.

## 1. Instalação
- [ ] Instalei por cima da versão anterior e **meus itens continuam lá**
- [ ] Em Ajustes, no fim da tela, aparece **Despensa 1.16**

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
- [ ] O livro tem **192 receitas** (filtro "Todas") e nenhuma aparece repetida
- [ ] Filtro por **tipo** (Salgados, Doces, Até 20 min, Massas, Vegetarianas, Air fryer…) mostra só o que combina
- [ ] **Ordenar** (A–Z, Mais rápidas, Favoritas primeiro, Mais recentes) muda a ordem; o contador mostra quantas receitas aparecem
- [ ] Fechei e abri o app: o filtro, o tipo e a ordem que escolhi **continuam iguais**
- [ ] A **⭐ no cartão** favorita/desfavorita sem abrir a receita
- [ ] **Foto do prato** (câmera e galeria) aparece no topo da receita e no cartão; **Remover** apaga a foto
- [ ] **Cozinhei esta receita → Concluir** pergunta "Como ficou?" (Gostei / Não gostei / Pular)
- [ ] Receita com **Gostei** sobe nas sugestões; com **Não gostei** vai para o fim e some do Início
- [ ] **Minhas receitas** aparecem antes das do app
- [ ] **Nova → Link de um site**: link do TudoGostoso ou Panelinha vira receita (sem gastar IA)
- [ ] Um site sem formato padrão usa a IA (se ligada) ou explica por que não leu

## 8. Mover itens de lugar
- [ ] No detalhe do item, **"Onde está"**: um toque muda Geladeira/Freezer/Despensa/Armário
- [ ] Carne ou fruta **para o Freezer**: a validade aumenta (aviso mostra a nova data) e **Desfazer** volta como estava
- [ ] Arroz, enlatado etc. mudando de lugar: a **data não muda**
- [ ] **Arrastar com o dedo para a esquerda** na lista: aparecem **Freezer** (azul) e **Jogar fora** (vermelho)
- [ ] Item que já está no freezer: o botão azul vira **Descongelar**
- [ ] Tocar fora dos botões fecha sem abrir o item
- [ ] Arrastar para a **direita** continua sendo **Usei**
- [ ] Ao descongelar: aviso "use até…", **gotinha** no item da lista, aviso nos detalhes e validade curta (carne/peixe: 2 dias)

## 9. Organizar com IA (Despensa → botão IA)
- [ ] Só roda quando toco no botão; adicionar itens **não** chama a IA
- [ ] Mostra quantos itens novos vai analisar e o gasto do mês
- [ ] As sugestões aparecem para aprovar: nome prático, categoria, local e validade com o motivo
- [ ] Desmarquei uma sugestão e ela **não** foi aplicada
- [ ] Depois de aplicar, o detalhe do item mostra **"Nome original"** e a **dica de conservação**
- [ ] **Desfazer** no aviso volta tudo como estava
- [ ] Tocar de novo diz "Nenhum item novo para organizar" (não gasta à toa)
- [ ] As validades sugeridas fazem sentido para o que está na geladeira/freezer (me conte os casos estranhos)

## 10. Internet (Ajustes → Internet)
- [ ] Com **Base de produtos** desligada, o código de barras não busca na internet (só os já conhecidos)
- [ ] Com **Nota fiscal (SEFAZ)** desligada, o QR code avisa que está desligado
- [ ] Com **Sites de receita** desligado, o link avisa que está desligado

## 11. Tela
- [ ] O botão **+ Adicionar** aparece inteiro (redondo, acima da barra)
- [ ] Nenhum texto da lista aparece **por trás** da barra de baixo
- [ ] "Dá pra fazer agora" no Início começa alinhado com a margem
- [ ] As fileiras que rolam para o lado (filtros) esmaecem na borda direita

## 12. Acessibilidade
- [ ] Aumentei a **fonte do Android** (Configurações → Tela → Tamanho da fonte) e o app continua legível, sem textos cortados
- [ ] Com fonte grande, o selo "vence em…" desce para baixo do nome em vez de espremer
- [ ] Botões pequenos (ex.: "Ler validade pela foto") ficam fáceis de tocar
- [ ] Com o **TalkBack** ligado, os botões de ícone dizem o que fazem (ex.: "Ler validade de Leite pela foto")
- [ ] Modo escuro: textos e selos continuam legíveis

## Já validado
- [x] Código de barras com a câmera (versões anteriores)
- [x] Leitura da nota pelo QR code
- [x] Nota fiscal cadastra vários itens de uma vez
