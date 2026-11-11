import type { Recipe } from "../types";

type Seed = Omit<Recipe, "id" | "createdAt" | "source">;

const i = (name: string, amount?: string, optional?: boolean) => ({ name, amount, optional });

export const PART_4: Seed[] = [
  {
    title: "Batata gratinada",
    minutes: 60, servings: 6, tags: ["forno", "acompanhamento", "vegetariano"],
    ingredients: [i("batata", "1 kg"), i("creme de leite", "1 caixa"), i("leite", "1 xícara"), i("queijo muçarela", "200 g"), i("queijo parmesão ralado", "1/2 xícara", true), i("alho", "2 dentes"), i("noz-moscada", "1 pitada", true), i("sal"), i("pimenta", "a gosto", true)],
    steps: [
      "Descasque as batatas, corte em rodelas finas e cozinhe em água com sal por 5 minutos, sem deixar desmanchar. Escorra.",
      "Misture o creme de leite, o leite, o alho amassado, sal, pimenta e noz-moscada.",
      "Em um refratário untado, intercale camadas de batata, molho e muçarela.",
      "Finalize com muçarela e parmesão e leve ao forno a 200 °C por 30 minutos, até gratinar.",
    ],
  },
  {
    title: "Quibe assado de batata",
    minutes: 70, servings: 6, tags: ["forno", "vegetariano", "salgado"],
    ingredients: [i("batata", "1 kg"), i("trigo para quibe", "1 xícara"), i("cebola", "1"), i("hortelã", "1 maço"), i("queijo muçarela", "200 g", true), i("azeite", "4 colheres"), i("sal"), i("pimenta", "a gosto", true)],
    steps: [
      "Deixe o trigo de molho em água quente por 30 minutos e esprema bem.",
      "Cozinhe as batatas, amasse ainda quentes e misture com o trigo, a cebola ralada, a hortelã picada, sal, pimenta e 2 colheres de azeite.",
      "Espalhe metade da massa num refratário untado, cubra com a muçarela e feche com o restante da massa.",
      "Faça cortes em losango, regue com o azeite restante e asse a 200 °C por 35 minutos, até dourar.",
    ],
  },
  {
    title: "Abobrinha recheada",
    minutes: 45, servings: 4, tags: ["forno", "proteína", "salgado"],
    ingredients: [i("abobrinha", "2 grandes"), i("carne moída", "300 g"), i("cebola", "1"), i("alho", "2 dentes"), i("tomate", "1"), i("queijo muçarela", "100 g"), i("cheiro-verde", "a gosto", true), i("óleo", "1 colher"), i("sal")],
    steps: [
      "Corte as abobrinhas ao meio no comprimento e retire o miolo com uma colher, reservando-o picado.",
      "Refogue cebola e alho no óleo, junte a carne moída e frite até perder a cor.",
      "Acrescente o tomate e o miolo da abobrinha picados, tempere com sal e cozinhe por 5 minutos. Finalize com cheiro-verde.",
      "Recheie as abobrinhas, cubra com muçarela e asse a 200 °C por 25 minutos.",
    ],
  },
  {
    title: "Risoto de alho-poró",
    minutes: 40, servings: 4, tags: ["vegetariano", "salgado"],
    ingredients: [i("arroz arbóreo", "2 xícaras"), i("alho-poró", "1 talo"), i("cebola", "1/2"), i("vinho branco", "1/2 xícara", true), i("caldo de legumes", "1,5 litro"), i("manteiga", "2 colheres"), i("queijo parmesão ralado", "1/2 xícara"), i("azeite", "1 colher"), i("sal")],
    steps: [
      "Aqueça o caldo e mantenha em fogo baixo.",
      "Refogue a cebola e o alho-poró fatiado no azeite com 1 colher de manteiga até murchar.",
      "Junte o arroz, mexa por 1 minuto e regue com o vinho, deixando evaporar.",
      "Adicione o caldo aos poucos, uma concha por vez, mexendo sempre, por cerca de 18 minutos.",
      "Desligue, acerte o sal e misture o parmesão e o restante da manteiga. Sirva em seguida.",
    ],
  },
  {
    title: "Nhoque de batata",
    minutes: 70, servings: 4, tags: ["massa", "vegetariano", "salgado"],
    ingredients: [i("batata", "1 kg"), i("farinha de trigo", "2 xícaras"), i("ovo", "1"), i("manteiga", "1 colher"), i("molho de tomate", "2 xícaras"), i("queijo parmesão ralado", "a gosto", true), i("sal")],
    steps: [
      "Cozinhe as batatas com casca até ficarem macias, descasque e passe no espremedor ainda quentes.",
      "Misture a batata com o ovo, a manteiga e o sal, e acrescente a farinha aos poucos até a massa soltar das mãos.",
      "Faça rolinhos, corte em pedaços de 2 cm e polvilhe com farinha.",
      "Cozinhe em água fervente com sal e retire com escumadeira assim que subirem.",
      "Sirva com o molho de tomate quente e parmesão.",
    ],
  },
  {
    title: "Macarrão instantâneo à carbonara",
    minutes: 10, servings: 1, tags: ["massa", "rápido", "lanche"],
    ingredients: [i("macarrão instantâneo", "1 pacote"), i("ovo", "1"), i("bacon", "50 g"), i("queijo parmesão ralado", "2 colheres"), i("pimenta", "a gosto")],
    steps: [
      "Frite o bacon picado numa frigideira até dourar.",
      "Cozinhe o macarrão em água fervente por 3 minutos, sem o tempero, e reserve um pouco da água.",
      "Bata o ovo com o parmesão e a pimenta.",
      "Escorra o macarrão, junte ao bacon com o fogo desligado e misture o ovo rapidamente, usando um pouco da água para formar um creme.",
    ],
  },
  {
    title: "Arroz cremoso na panela de pressão",
    minutes: 25, servings: 4, tags: ["panela de pressão", "acompanhamento", "vegetariano"],
    ingredients: [i("arroz", "1 xícara"), i("cebola", "1/2"), i("alho", "1 dente"), i("caldo de legumes", "3 xícaras"), i("requeijão", "3 colheres"), i("queijo muçarela", "100 g", true), i("óleo", "1 colher"), i("sal")],
    steps: [
      "Na panela de pressão, refogue a cebola e o alho no óleo.",
      "Junte o arroz, mexa por 1 minuto e adicione o caldo quente e o sal.",
      "Tampe e cozinhe por 5 minutos após pegar pressão. Desligue e espere sair a pressão.",
      "Abra, misture o requeijão e a muçarela e mexa até ficar cremoso.",
    ],
  },
  {
    title: "Omelete de forno",
    minutes: 35, servings: 4, tags: ["forno", "vegetariano", "salgado"],
    ingredients: [i("ovo", "6"), i("leite", "1/2 xícara"), i("tomate", "1"), i("cebola", "1/2"), i("queijo muçarela", "100 g"), i("farinha de trigo", "2 colheres"), i("cheiro-verde", "a gosto", true), i("fermento em pó", "1 colher de chá"), i("sal")],
    steps: [
      "Bata os ovos com o leite, a farinha e o sal.",
      "Misture o tomate, a cebola, o queijo e o cheiro-verde picados, e por último o fermento.",
      "Despeje numa forma untada e asse a 180 °C por 25 minutos, até firmar e dourar.",
    ],
  },
  {
    title: "Escondidinho de legumes",
    minutes: 60, servings: 6, tags: ["forno", "vegetariano", "salgado"],
    ingredients: [i("batata", "800 g"), i("leite", "1/2 xícara"), i("manteiga", "2 colheres"), i("cenoura", "1"), i("abobrinha", "1"), i("brócolis", "1 xícara"), i("milho verde", "1/2 xícara", true), i("cebola", "1"), i("alho", "2 dentes"), i("queijo muçarela", "150 g"), i("sal")],
    steps: [
      "Cozinhe as batatas e amasse com o leite, a manteiga e o sal até virar um purê.",
      "Refogue cebola e alho, junte a cenoura, a abobrinha e o brócolis picados e cozinhe até ficarem macios. Acrescente o milho e tempere.",
      "Coloque os legumes num refratário, cubra com o purê e depois com a muçarela.",
      "Asse a 200 °C por 20 minutos, até gratinar.",
    ],
  },
  {
    title: "Lentilha refogada",
    minutes: 35, servings: 4, tags: ["vegetariano", "acompanhamento", "básico"],
    ingredients: [i("lentilha", "2 xícaras"), i("cebola", "1"), i("alho", "3 dentes"), i("folha de louro", "1", true), i("cheiro-verde", "a gosto", true), i("azeite", "2 colheres"), i("água"), i("sal")],
    steps: [
      "Lave a lentilha e cozinhe em água com o louro por cerca de 20 minutos, até ficar macia mas inteira. Escorra.",
      "Refogue a cebola e o alho no azeite até dourar.",
      "Junte a lentilha, tempere com sal e deixe pegar gosto por 5 minutos. Finalize com cheiro-verde.",
    ],
  },
  {
    title: "Guacamole",
    minutes: 10, servings: 4, tags: ["vegetariano", "rápido", "lanche"],
    ingredients: [i("abacate", "1 maduro"), i("tomate", "1"), i("cebola roxa", "1/2"), i("limão", "1"), i("coentro", "a gosto", true), i("pimenta dedo-de-moça", "1/2", true), i("sal")],
    steps: [
      "Amasse a polpa do abacate com um garfo, deixando alguns pedaços.",
      "Misture o tomate sem sementes, a cebola, o coentro e a pimenta, tudo bem picado.",
      "Tempere com o suco do limão e sal. Sirva com torradas ou nachos.",
    ],
  },
  {
    title: "Antepasto de berinjela",
    minutes: 50, servings: 8, tags: ["forno", "vegetariano", "festa"],
    ingredients: [i("berinjela", "2"), i("pimentão vermelho", "1"), i("cebola", "1"), i("alho", "4 dentes"), i("uva-passa", "1/4 xícara", true), i("orégano", "1 colher"), i("vinagre", "2 colheres"), i("azeite", "1/2 xícara"), i("sal")],
    steps: [
      "Corte a berinjela, o pimentão e a cebola em cubos e fatie o alho.",
      "Misture tudo numa assadeira com o azeite, o orégano e o sal.",
      "Asse a 200 °C por 35 minutos, mexendo na metade do tempo.",
      "Tire do forno, junte o vinagre e as uvas-passas e deixe esfriar. Sirva com pão.",
    ],
  },
  {
    title: "Farofa de proteína de soja",
    minutes: 25, servings: 6, tags: ["vegetariano", "acompanhamento", "salgado"],
    ingredients: [i("proteína de soja", "1 xícara"), i("farinha de mandioca", "2 xícaras"), i("cebola", "1"), i("alho", "2 dentes"), i("molho shoyu", "2 colheres"), i("cheiro-verde", "a gosto", true), i("óleo", "4 colheres"), i("água"), i("sal")],
    steps: [
      "Hidrate a proteína de soja em água quente por 10 minutos e esprema bem.",
      "Refogue a cebola e o alho no óleo, junte a soja e frite até dourar. Tempere com shoyu.",
      "Acrescente a farinha aos poucos, mexendo até ficar soltinha e tostada.",
      "Acerte o sal e finalize com cheiro-verde.",
    ],
  },
  {
    title: "Strogonoff de palmito",
    minutes: 25, servings: 4, tags: ["vegetariano", "rápido", "salgado"],
    ingredients: [i("palmito", "1 vidro"), i("cebola", "1"), i("alho", "2 dentes"), i("molho de tomate", "1/2 xícara"), i("creme de leite", "1 caixa"), i("ketchup", "1 colher", true), i("mostarda", "1 colher", true), i("champignon", "1/2 xícara", true), i("manteiga", "1 colher"), i("sal")],
    steps: [
      "Escorra o palmito e corte em rodelas.",
      "Refogue a cebola e o alho na manteiga, junte o palmito e o champignon e cozinhe por 3 minutos.",
      "Acrescente o molho de tomate, o ketchup e a mostarda e deixe ferver.",
      "Desligue o fogo, misture o creme de leite e acerte o sal. Sirva com arroz e batata palha.",
    ],
  },
  {
    title: "Falafel assado",
    minutes: 45, servings: 4, tags: ["forno", "vegetariano", "lanche"],
    ingredients: [i("grão-de-bico cozido", "2 xícaras"), i("cebola", "1/2"), i("alho", "2 dentes"), i("salsinha", "1/2 maço"), i("cominho", "1 colher de chá"), i("farinha de trigo", "2 colheres"), i("azeite", "2 colheres"), i("sal")],
    steps: [
      "Bata no processador o grão-de-bico bem escorrido com a cebola, o alho, a salsinha, o cominho e o sal, até formar uma massa grossa.",
      "Junte a farinha e modele bolinhas levemente achatadas.",
      "Coloque numa assadeira untada e pincele com azeite.",
      "Asse a 200 °C por 25 minutos, virando na metade, até dourar. Sirva com molho de iogurte.",
    ],
  },
  {
    title: "Lasanha de berinjela e abobrinha",
    minutes: 60, servings: 6, tags: ["forno", "vegetariano", "leve"],
    ingredients: [i("berinjela", "1"), i("abobrinha", "2"), i("molho de tomate", "2 xícaras"), i("queijo muçarela", "250 g"), i("ricota", "200 g", true), i("manjericão", "a gosto", true), i("azeite", "2 colheres"), i("sal")],
    steps: [
      "Corte a berinjela e as abobrinhas em fatias finas no comprimento e grelhe numa frigideira com azeite e sal.",
      "Num refratário, faça camadas de molho, legumes, ricota esfarelada e muçarela.",
      "Termine com molho e muçarela e espalhe folhas de manjericão.",
      "Asse a 200 °C por 25 minutos, até borbulhar e dourar.",
    ],
  },
  {
    title: "Quibe de abóbora",
    minutes: 70, servings: 6, tags: ["forno", "vegetariano", "salgado"],
    ingredients: [i("abóbora cabotiá", "800 g"), i("trigo para quibe", "1 xícara"), i("cebola", "1"), i("hortelã", "1/2 maço"), i("ricota", "200 g", true), i("azeite", "4 colheres"), i("sal")],
    steps: [
      "Deixe o trigo de molho em água quente por 30 minutos e esprema bem.",
      "Cozinhe a abóbora no vapor, amasse e misture com o trigo, a cebola ralada, a hortelã, o sal e 2 colheres de azeite.",
      "Espalhe metade num refratário untado, recheie com a ricota temperada e cubra com o restante.",
      "Risque em losangos, regue com azeite e asse a 200 °C por 35 minutos.",
    ],
  },
  {
    title: "Hambúrguer de lentilha",
    minutes: 45, servings: 6, tags: ["vegetariano", "lanche", "salgado"],
    ingredients: [i("lentilha", "1 xícara"), i("cebola", "1/2"), i("alho", "2 dentes"), i("cenoura", "1", true), i("farinha de rosca", "1/2 xícara"), i("cheiro-verde", "a gosto"), i("cominho", "1/2 colher de chá", true), i("óleo", "2 colheres"), i("sal")],
    steps: [
      "Cozinhe a lentilha em água até ficar bem macia e escorra muito bem.",
      "Amasse a lentilha e misture a cebola, o alho, a cenoura ralada, o cheiro-verde, o cominho e o sal.",
      "Junte a farinha de rosca até dar ponto de modelar e forme os hambúrgueres.",
      "Doure numa frigideira com óleo, 4 minutos de cada lado, com cuidado ao virar.",
    ],
  },
  {
    title: "Estrogonofe de cogumelos",
    minutes: 25, servings: 4, tags: ["vegetariano", "rápido", "salgado"],
    ingredients: [i("cogumelo", "400 g"), i("cebola", "1"), i("alho", "2 dentes"), i("molho de tomate", "1/2 xícara"), i("creme de leite", "1 caixa"), i("mostarda", "1 colher", true), i("molho shoyu", "1 colher", true), i("manteiga", "2 colheres"), i("sal")],
    steps: [
      "Fatie os cogumelos e doure na manteiga em fogo alto, sem mexer muito. Reserve.",
      "Na mesma panela, refogue a cebola e o alho.",
      "Volte os cogumelos, junte o molho de tomate, a mostarda e o shoyu e deixe ferver por 3 minutos.",
      "Desligue, misture o creme de leite e acerte o sal. Sirva com arroz.",
    ],
  },
  {
    title: "Sopa de ervilha",
    minutes: 50, servings: 6, tags: ["panela de pressão", "proteína", "salgado"],
    ingredients: [i("ervilha seca", "2 xícaras"), i("bacon", "150 g"), i("linguiça calabresa", "1", true), i("cebola", "1"), i("alho", "3 dentes"), i("cenoura", "1"), i("batata", "1"), i("folha de louro", "1", true), i("água", "2 litros"), i("sal")],
    steps: [
      "Deixe a ervilha de molho por 4 horas e escorra.",
      "Na panela de pressão, frite o bacon e a calabresa, junte a cebola e o alho e refogue.",
      "Acrescente a ervilha, a cenoura, a batata, o louro e a água.",
      "Cozinhe por 25 minutos após pegar pressão. Retire a pressão, bata metade se quiser mais cremosa e acerte o sal.",
    ],
  },
  {
    title: "Sopa de cebola",
    minutes: 60, servings: 4, tags: ["vegetariano", "forno", "salgado"],
    ingredients: [i("cebola", "6"), i("manteiga", "3 colheres"), i("farinha de trigo", "1 colher"), i("caldo de legumes", "1,5 litro"), i("vinho branco", "1/2 xícara", true), i("pão francês", "2"), i("queijo muçarela", "150 g"), i("açúcar", "1 colher de chá"), i("sal")],
    steps: [
      "Fatie as cebolas finas e cozinhe na manteiga com o açúcar em fogo baixo por 30 minutos, mexendo, até caramelizar.",
      "Polvilhe a farinha, mexa e regue com o vinho.",
      "Adicione o caldo e cozinhe por 15 minutos. Acerte o sal.",
      "Sirva em cumbucas que vão ao forno, com fatias de pão por cima cobertas de queijo, e gratine.",
    ],
  },
  {
    title: "Medalhão de banana",
    minutes: 25, servings: 4, tags: ["vegetariano", "acompanhamento", "rápido"],
    ingredients: [i("banana-da-terra", "2 maduras"), i("queijo muçarela", "100 g"), i("canela", "a gosto", true), i("manteiga", "2 colheres"), i("sal", "1 pitada")],
    steps: [
      "Corte as bananas em rodelas grossas, na diagonal.",
      "Doure na manteiga dos dois lados em fogo médio, com uma pitada de sal.",
      "Coloque uma fatia de queijo sobre cada medalhão, tampe a frigideira até derreter e polvilhe canela se quiser.",
    ],
  },
  {
    title: "Mousse de limão",
    minutes: 15, servings: 6, tags: ["doce", "sobremesa", "rápido"],
    ingredients: [i("leite condensado", "1 lata"), i("creme de leite", "1 caixa"), i("limão", "3"), i("raspas de limão", "a gosto", true)],
    steps: [
      "Bata no liquidificador o leite condensado e o creme de leite.",
      "Com o liquidificador ligado, junte o suco dos limões aos poucos até engrossar.",
      "Despeje em taças, decore com raspas e leve à geladeira por pelo menos 2 horas.",
    ],
  },
  {
    title: "Doce de banana",
    minutes: 50, servings: 8, tags: ["doce", "sobremesa", "aproveitamento"],
    ingredients: [i("banana", "8 maduras"), i("açúcar", "1 xícara"), i("água", "1/2 xícara"), i("canela em pau", "1"), i("cravo", "4", true), i("limão", "1/2", true)],
    steps: [
      "Corte as bananas em rodelas.",
      "Numa panela, derreta o açúcar até virar um caramelo dourado e junte a água com cuidado.",
      "Acrescente as bananas, a canela e o cravo e cozinhe em fogo baixo por 30 minutos, mexendo de vez em quando.",
      "Quando escurecer e desgrudar do fundo, pingue o limão, desligue e deixe esfriar.",
    ],
  },
  {
    title: "Sorvete caseiro de chocolate",
    minutes: 20, servings: 8, tags: ["doce", "sobremesa"],
    ingredients: [i("leite condensado", "1 lata"), i("creme de leite fresco", "500 ml"), i("chocolate em pó", "1/2 xícara"), i("chocolate meio amargo", "100 g", true)],
    steps: [
      "Bata o creme de leite fresco bem gelado até virar chantili.",
      "Misture o leite condensado com o chocolate em pó e o chocolate derretido.",
      "Incorpore o chantili delicadamente, com movimentos de baixo para cima.",
      "Coloque num pote com tampa e leve ao freezer por pelo menos 6 horas.",
    ],
  },
  {
    title: "Bombom de morango na travessa",
    minutes: 30, servings: 8, tags: ["doce", "sobremesa", "festa"],
    ingredients: [i("leite condensado", "2 latas"), i("leite", "1 xícara"), i("amido de milho", "2 colheres"), i("gema", "2"), i("morango", "500 g"), i("chocolate meio amargo", "200 g"), i("creme de leite", "1 caixa")],
    steps: [
      "Leve ao fogo o leite condensado, o leite, o amido e as gemas, mexendo até engrossar. Espalhe numa travessa.",
      "Cubra o creme com os morangos lavados e sem folhas.",
      "Derreta o chocolate e misture o creme de leite até formar uma ganache lisa.",
      "Espalhe a ganache por cima dos morangos e leve à geladeira por 3 horas.",
    ],
  },
  {
    title: "Salada de frutas",
    minutes: 20, servings: 6, tags: ["doce", "sobremesa", "leve"],
    ingredients: [i("banana", "2"), i("maçã", "2"), i("mamão", "1/2"), i("laranja", "3"), i("manga", "1"), i("uva", "1 xícara", true), i("morango", "1 xícara", true), i("leite condensado", "a gosto", true)],
    steps: [
      "Lave e corte todas as frutas em cubos pequenos.",
      "Misture numa tigela e regue com o suco de uma das laranjas para não escurecer.",
      "Leve à geladeira e sirva gelada, com leite condensado se quiser.",
    ],
  },
  {
    title: "Bolo gelado de coco",
    minutes: 60, servings: 12, tags: ["doce", "sobremesa", "forno", "festa"],
    ingredients: [i("ovo", "3"), i("açúcar", "2 xícaras"), i("farinha de trigo", "2 xícaras"), i("leite", "1 e 1/2 xícara"), i("óleo", "1/2 xícara"), i("fermento em pó", "1 colher"), i("leite de coco", "200 ml"), i("leite condensado", "1 lata"), i("coco ralado", "100 g")],
    steps: [
      "Bata os ovos, o açúcar, 1 xícara de leite e o óleo, misture a farinha e por último o fermento.",
      "Asse em forma retangular untada a 180 °C por 35 minutos.",
      "Misture o leite de coco, o leite condensado e 1/2 xícara de leite.",
      "Fure o bolo ainda quente com um garfo, regue com a calda e cubra com o coco ralado.",
      "Corte em quadrados, embrulhe em papel-alumínio e leve à geladeira por 3 horas.",
    ],
  },
  {
    title: "Brigadeiro de colher",
    minutes: 20, servings: 4, tags: ["doce", "sobremesa", "rápido"],
    ingredients: [i("leite condensado", "1 lata"), i("chocolate em pó", "3 colheres"), i("manteiga", "1 colher"), i("creme de leite", "1/2 caixa"), i("chocolate granulado", "a gosto", true)],
    steps: [
      "Numa panela, misture o leite condensado, o chocolate em pó e a manteiga.",
      "Cozinhe em fogo baixo, mexendo sempre, por cerca de 8 minutos, até engrossar mas ainda escorrer da colher.",
      "Desligue e misture o creme de leite para ficar cremoso.",
      "Sirva em potinhos, morno ou gelado, com granulado por cima.",
    ],
  },
];
