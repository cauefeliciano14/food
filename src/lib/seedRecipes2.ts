import type { Recipe } from "./types";

type Seed = Omit<Recipe, "id" | "createdAt" | "source">;

const i = (name: string, amount?: string, optional?: boolean) => ({ name, amount, optional });

/**
 * Second batch of the built-in book (v1.13): the everyday dishes that top the
 * popular Brazilian recipe sites — quick meals, snacks (salgados) and sweets.
 * Text written for the app; quantities are the usual home-cook ones.
 */
export const SEED_RECIPES_2: Seed[] = [
  // ---------- pratos do dia a dia ----------
  {
    title: "Bife acebolado",
    minutes: 20, servings: 2, tags: ["proteína", "rápido", "salgado"],
    ingredients: [i("carne", "4 bifes"), i("cebola", "2"), i("alho", "2 dentes"), i("óleo", "2 colheres"), i("sal"), i("pimenta", "a gosto", true)],
    steps: [
      "Tempere os bifes com alho amassado, sal e pimenta.",
      "Frite em frigideira bem quente com óleo, 2 minutos de cada lado. Reserve.",
      "Na mesma frigideira, doure a cebola em rodelas. Volte os bifes e sirva.",
    ],
  },
  {
    title: "Frango xadrez",
    minutes: 30, servings: 4, tags: ["proteína", "salgado"],
    ingredients: [i("peito de frango", "500 g"), i("pimentão", "2"), i("cebola", "1"), i("shoyu", "4 colheres"), i("amido de milho", "1 colher"), i("amendoim", "1/2 xícara", true), i("alho", "2 dentes"), i("óleo")],
    steps: [
      "Corte o frango, o pimentão e a cebola em cubos.",
      "Doure o frango no óleo com o alho. Junte cebola e pimentão e refogue 3 minutos (devem ficar crocantes).",
      "Dissolva o amido em 1/2 xícara de água com o shoyu, despeje e mexa até engrossar. Finalize com amendoim.",
    ],
  },
  {
    title: "Frango assado com batatas",
    minutes: 70, servings: 4, tags: ["proteína", "forno", "salgado"],
    ingredients: [i("coxa de frango", "1 kg"), i("batata", "4"), i("alho", "4 dentes"), i("limão", "1"), i("cebola", "1", true), i("azeite"), i("sal"), i("páprica", "1 colher", true)],
    steps: [
      "Tempere o frango com alho, limão, sal e páprica (se der, por 30 minutos).",
      "Arrume numa assadeira com as batatas em pedaços e a cebola. Regue com azeite.",
      "Asse coberto com papel-alumínio a 200 °C por 30 minutos; tire o papel e asse mais 30 até dourar.",
    ],
  },
  {
    title: "Frango ensopado",
    minutes: 40, servings: 4, tags: ["proteína", "básico", "salgado"],
    ingredients: [i("frango", "1 kg em pedaços"), i("tomate", "2"), i("cebola", "1"), i("alho", "3 dentes"), i("batata", "2", true), i("cheiro verde", "a gosto", true), i("óleo"), i("sal")],
    steps: [
      "Tempere o frango com alho e sal e doure no óleo.",
      "Junte cebola e tomate picados e refogue até desmanchar.",
      "Cubra com água quente, adicione a batata e cozinhe tampado por 25 minutos. Finalize com cheiro verde.",
    ],
  },
  {
    title: "Carne de panela",
    minutes: 90, servings: 6, tags: ["proteína", "panela de pressão", "salgado"],
    ingredients: [i("carne", "1 kg (acém ou músculo)"), i("cebola", "1"), i("alho", "4 dentes"), i("tomate", "2"), i("batata", "3", true), i("cenoura", "2", true), i("óleo"), i("sal")],
    steps: [
      "Corte a carne em cubos grandes, tempere com sal e alho e doure bem no óleo, aos poucos.",
      "Junte cebola e tomate, refogue e cubra com água quente.",
      "Cozinhe na pressão por 40 minutos. Abra, junte batata e cenoura e cozinhe mais 10 minutos na pressão.",
    ],
  },
  {
    title: "Picadinho de carne",
    minutes: 35, servings: 4, tags: ["proteína", "salgado"],
    ingredients: [i("carne", "500 g em cubinhos"), i("cebola", "1"), i("alho", "2 dentes"), i("tomate", "1"), i("batata", "2", true), i("cheiro verde", "a gosto", true), i("óleo"), i("sal")],
    steps: [
      "Doure a carne no óleo em fogo alto, sem mexer demais.",
      "Junte alho, cebola e tomate e refogue.",
      "Cubra com água, junte a batata em cubos e cozinhe até a carne ficar macia e o caldo encorpar.",
    ],
  },
  {
    title: "Almôndegas ao molho",
    minutes: 45, servings: 4, tags: ["proteína", "salgado"],
    ingredients: [i("carne moída", "500 g"), i("ovo", "1"), i("farinha de rosca", "3 colheres"), i("cebola", "1"), i("alho", "2 dentes"), i("molho de tomate", "1 caixa"), i("cheiro verde", "a gosto", true), i("sal")],
    steps: [
      "Misture a carne com ovo, farinha de rosca, metade da cebola ralada, cheiro verde e sal. Faça bolinhas.",
      "Doure as almôndegas numa frigideira com pouco óleo.",
      "Refogue o resto da cebola e o alho, junte o molho e as almôndegas e cozinhe 15 minutos tampado.",
    ],
  },
  {
    title: "Macarrão alho e óleo",
    minutes: 15, servings: 2, tags: ["massa", "rápido", "salgado"],
    ingredients: [i("macarrão", "250 g"), i("alho", "5 dentes"), i("azeite", "4 colheres"), i("sal"), i("salsinha", "a gosto", true), i("queijo ralado", "a gosto", true)],
    steps: [
      "Cozinhe o macarrão em bastante água com sal.",
      "Doure o alho fatiado no azeite em fogo baixo, sem queimar.",
      "Misture o macarrão escorrido ao alho, com um pouco da água do cozimento. Finalize com salsinha e queijo.",
    ],
  },
  {
    title: "Macarrão à bolonhesa",
    minutes: 35, servings: 4, tags: ["massa", "salgado"],
    ingredients: [i("macarrão", "500 g"), i("carne moída", "400 g"), i("molho de tomate", "2 caixas"), i("cebola", "1"), i("alho", "2 dentes"), i("óleo"), i("sal"), i("queijo ralado", "a gosto", true)],
    steps: [
      "Refogue cebola e alho, junte a carne moída e frite até perder o tom rosado.",
      "Junte o molho, acerte o sal e cozinhe 15 minutos em fogo baixo.",
      "Cozinhe o macarrão, escorra e misture ao molho. Sirva com queijo ralado.",
    ],
  },
  {
    title: "Macarrão com molho branco",
    minutes: 25, servings: 4, tags: ["massa", "salgado"],
    ingredients: [i("macarrão", "500 g"), i("leite", "500 ml"), i("manteiga", "2 colheres"), i("farinha de trigo", "2 colheres"), i("creme de leite", "1 caixa", true), i("presunto", "150 g", true), i("queijo", "100 g", true), i("sal"), i("noz-moscada", "a gosto", true)],
    steps: [
      "Derreta a manteiga, junte a farinha e mexa 1 minuto.",
      "Despeje o leite frio aos poucos, mexendo sempre até engrossar. Tempere com sal e noz-moscada; junte o creme de leite.",
      "Misture o presunto e o queijo, e por fim o macarrão cozido.",
    ],
  },
  {
    title: "Lasanha de presunto e queijo",
    minutes: 60, servings: 6, tags: ["massa", "forno", "salgado"],
    ingredients: [i("massa de lasanha", "500 g"), i("presunto", "300 g"), i("queijo muçarela", "300 g"), i("molho de tomate", "2 caixas"), i("leite", "500 ml"), i("manteiga", "2 colheres"), i("farinha de trigo", "2 colheres"), i("sal")],
    steps: [
      "Faça um molho branco: manteiga + farinha, depois o leite aos poucos até engrossar. Tempere com sal.",
      "Num refratário, alterne molho de tomate, massa, presunto, queijo e molho branco. Termine com molho e queijo.",
      "Cubra com papel-alumínio e asse a 200 °C por 30 minutos; descubra e gratine por mais 10.",
    ],
  },
  {
    title: "Arroz carreteiro",
    minutes: 40, servings: 4, tags: ["aproveitamento", "salgado"],
    ingredients: [i("arroz", "2 xícaras"), i("carne", "400 g (pode ser sobra de churrasco)"), i("linguiça", "1", true), i("cebola", "1"), i("alho", "2 dentes"), i("tomate", "1", true), i("cheiro verde", "a gosto", true), i("óleo"), i("sal")],
    steps: [
      "Frite a carne picada (e a linguiça) até dourar.",
      "Junte cebola, alho e tomate e refogue. Acrescente o arroz e frite 2 minutos.",
      "Cubra com 4 xícaras de água quente, acerte o sal e cozinhe até secar. Finalize com cheiro verde.",
    ],
  },
  {
    title: "Risoto de frango",
    minutes: 40, servings: 4, tags: ["proteína", "salgado"],
    ingredients: [i("arroz", "2 xícaras"), i("frango desfiado", "2 xícaras"), i("cebola", "1"), i("alho", "2 dentes"), i("caldo de galinha", "1 tablete"), i("queijo ralado", "1/2 xícara"), i("manteiga", "2 colheres"), i("ervilha", "1/2 lata", true), i("sal")],
    steps: [
      "Dissolva o caldo em 1,5 L de água quente e mantenha aquecido.",
      "Refogue cebola e alho na manteiga, junte o arroz e frite 2 minutos.",
      "Vá colocando o caldo uma concha de cada vez, mexendo, até o arroz ficar cremoso (uns 18 minutos).",
      "Junte o frango, a ervilha e o queijo ralado. Mexa e sirva.",
    ],
  },
  {
    title: "Feijão tropeiro",
    minutes: 30, servings: 4, tags: ["salgado", "acompanhamento"],
    ingredients: [i("feijão cozido", "2 xícaras, sem caldo"), i("farinha de mandioca", "1 xícara"), i("bacon", "150 g"), i("linguiça", "1"), i("ovo", "3"), i("cebola", "1"), i("alho", "2 dentes"), i("couve", "3 folhas", true), i("sal")],
    steps: [
      "Frite bacon e linguiça picados até dourar. Junte cebola e alho.",
      "Abra um espaço e mexa os ovos até cozinharem.",
      "Junte o feijão escorrido e a couve fatiada; vá adicionando a farinha, mexendo até ficar soltinho.",
    ],
  },
  {
    title: "Ovo frito com arroz e feijão (PF rápido)",
    minutes: 10, servings: 1, tags: ["rápido", "básico", "salgado"],
    ingredients: [i("ovo", "2"), i("arroz cozido", "1 xícara"), i("feijão cozido", "1 concha"), i("óleo"), i("sal"), i("tomate", "1", true)],
    steps: [
      "Aqueça o arroz e o feijão que sobraram.",
      "Frite os ovos em óleo quente, regando a gema com o próprio óleo.",
      "Monte o prato com uma saladinha de tomate, se tiver.",
    ],
  },
  {
    title: "Cuscuz nordestino",
    minutes: 15, servings: 2, tags: ["café da manhã", "rápido", "salgado"],
    ingredients: [i("flocão de milho", "2 xícaras"), i("água", "1 xícara"), i("sal"), i("manteiga", "1 colher", true), i("ovo", "2", true), i("queijo coalho", "100 g", true)],
    steps: [
      "Misture o flocão com sal e a água aos poucos até ficar úmido, e descanse 10 minutos.",
      "Coloque na cuscuzeira sem apertar e cozinhe no vapor por uns 10 minutos.",
      "Sirva com manteiga, ovo ou queijo coalho.",
    ],
  },
  {
    title: "Tapioca recheada",
    minutes: 10, servings: 1, tags: ["café da manhã", "rápido", "lanche"],
    ingredients: [i("goma de tapioca", "4 colheres"), i("queijo", "50 g", true), i("presunto", "2 fatias", true), i("ovo", "1", true), i("coco ralado", "a gosto", true), i("leite condensado", "a gosto", true)],
    steps: [
      "Peneire a goma numa frigideira antiaderente fria, formando um disco. Ligue o fogo médio.",
      "Quando as bolinhas grudarem (1 a 2 minutos), recheie com o que tiver e dobre ao meio.",
    ],
  },
  {
    title: "Ovos mexidos cremosos",
    minutes: 5, servings: 1, tags: ["café da manhã", "rápido"],
    ingredients: [i("ovo", "3"), i("manteiga", "1 colher"), i("sal"), i("leite", "1 colher", true), i("cheiro verde", "a gosto", true)],
    steps: [
      "Bata levemente os ovos com sal (e o leite).",
      "Derreta a manteiga em fogo baixo, despeje os ovos e mexa devagar, tirando do fogo ainda brilhantes.",
    ],
  },
  {
    title: "Sopa de feijão com macarrão",
    minutes: 25, servings: 4, tags: ["aproveitamento", "salgado"],
    ingredients: [i("feijão cozido", "3 conchas com caldo"), i("macarrão", "100 g (argolinha ou letrinha)"), i("cebola", "1/2"), i("alho", "2 dentes"), i("bacon", "50 g", true), i("cheiro verde", "a gosto", true), i("sal")],
    steps: [
      "Bata o feijão com o caldo no liquidificador.",
      "Refogue bacon, cebola e alho; junte o feijão batido e 2 xícaras de água.",
      "Quando ferver, junte o macarrão e cozinhe até ficar macio. Finalize com cheiro verde.",
    ],
  },
  {
    title: "Canja de galinha",
    minutes: 45, servings: 4, tags: ["leve", "salgado"],
    ingredients: [i("peito de frango", "500 g"), i("arroz", "1/2 xícara"), i("cenoura", "1"), i("batata", "1", true), i("cebola", "1/2"), i("alho", "2 dentes"), i("cheiro verde", "a gosto", true), i("sal")],
    steps: [
      "Cozinhe o frango em 2 L de água com cebola, alho e sal por 20 minutos. Retire e desfie.",
      "No caldo, junte o arroz, a cenoura e a batata em cubos e cozinhe até o arroz abrir.",
      "Volte o frango desfiado, acerte o sal e finalize com cheiro verde.",
    ],
  },
  {
    title: "Salada de maionese",
    minutes: 30, servings: 6, tags: ["salada", "acompanhamento"],
    ingredients: [i("batata", "4"), i("cenoura", "2"), i("ovo", "3"), i("maionese", "4 colheres"), i("ervilha", "1/2 lata", true), i("milho", "1/2 lata", true), i("cheiro verde", "a gosto", true), i("sal")],
    steps: [
      "Cozinhe batata e cenoura em cubos até ficarem macias, sem desmanchar. Cozinhe os ovos por 10 minutos.",
      "Misture tudo frio com a maionese, ervilha e milho. Acerte o sal e leve à geladeira.",
    ],
  },
  {
    title: "Abobrinha refogada",
    minutes: 15, servings: 3, tags: ["vegetariano", "acompanhamento", "rápido"],
    ingredients: [i("abobrinha", "2"), i("cebola", "1/2"), i("alho", "2 dentes"), i("tomate", "1", true), i("azeite"), i("sal")],
    steps: ["Refogue cebola e alho no azeite.", "Junte a abobrinha em cubos (e o tomate) e cozinhe tampado 8 minutos, até ficar macia mas firme."],
  },
  {
    title: "Couve refogada",
    minutes: 10, servings: 3, tags: ["vegetariano", "acompanhamento", "rápido"],
    ingredients: [i("couve", "1 maço"), i("alho", "3 dentes"), i("óleo"), i("sal"), i("bacon", "50 g", true)],
    steps: ["Fatie a couve bem fininha.", "Doure o alho (e o bacon) no óleo, junte a couve e mexa só até murchar. Sal na hora."],
  },
  {
    title: "Batata frita",
    minutes: 30, servings: 3, tags: ["acompanhamento", "salgado"],
    ingredients: [i("batata", "4"), i("óleo", "para fritar"), i("sal")],
    steps: [
      "Corte as batatas em palitos, lave e seque bem.",
      "Frite em óleo morno (160 °C) até ficarem macias, sem dourar. Escorra.",
      "Na hora de servir, frite de novo em óleo bem quente até dourar. Salgue.",
    ],
  },

  // ---------- salgados e lanches ----------
  {
    title: "Coxinha de frango",
    minutes: 90, servings: 30, tags: ["lanche", "salgado", "festa"],
    ingredients: [i("peito de frango", "500 g"), i("farinha de trigo", "2 xícaras"), i("caldo de galinha", "1 tablete"), i("cebola", "1"), i("alho", "2 dentes"), i("requeijão", "3 colheres", true), i("ovo", "2"), i("farinha de rosca", "2 xícaras"), i("óleo", "para fritar"), i("sal")],
    steps: [
      "Cozinhe o frango em 2 xícaras de água com o caldo. Desfie e reserve o caldo.",
      "Refogue cebola e alho, junte o frango (e o requeijão) e acerte o sal: é o recheio.",
      "Ferva o caldo, despeje a farinha de uma vez e mexa até desgrudar da panela. Sove morno até ficar liso.",
      "Abra bolinhas de massa, recheie e modele. Passe no ovo batido e na farinha de rosca.",
      "Frite em óleo quente (180 °C) até dourar.",
    ],
  },
  {
    title: "Esfiha de carne",
    minutes: 90, servings: 20, tags: ["lanche", "salgado", "forno"],
    ingredients: [i("farinha de trigo", "500 g"), i("fermento biológico", "10 g"), i("leite", "1 xícara morna"), i("óleo", "1/2 xícara"), i("açúcar", "1 colher"), i("carne moída", "500 g"), i("tomate", "2"), i("cebola", "1"), i("limão", "1"), i("hortelã", "a gosto", true), i("sal")],
    steps: [
      "Misture fermento, açúcar e leite morno; junte óleo, sal e a farinha até a massa soltar das mãos. Descanse 40 minutos.",
      "Recheio: carne crua misturada com tomate e cebola picadinhos (sem o suco), limão, hortelã e sal.",
      "Abra bolinhas de massa, coloque o recheio e feche em triângulo (ou deixe aberta).",
      "Asse a 200 °C por cerca de 20 minutos.",
    ],
  },
  {
    title: "Empadão de frango",
    minutes: 75, servings: 8, tags: ["forno", "salgado"],
    ingredients: [i("farinha de trigo", "3 xícaras"), i("manteiga", "200 g"), i("ovo", "2"), i("frango desfiado", "3 xícaras"), i("milho", "1 lata", true), i("requeijão", "1 copo", true), i("cebola", "1"), i("tomate", "1"), i("sal")],
    steps: [
      "Massa: misture farinha, manteiga, 1 ovo e sal com a ponta dos dedos até dar liga.",
      "Recheio: refogue cebola e tomate, junte o frango, milho e requeijão.",
      "Forre uma forma com 2/3 da massa, recheie e cubra com o resto. Pincele gema.",
      "Asse a 180 °C por 40 minutos.",
    ],
  },
  {
    title: "Pão de queijo mineiro",
    minutes: 50, servings: 30, tags: ["lanche", "café da manhã", "forno"],
    ingredients: [i("polvilho azedo", "500 g"), i("leite", "1 xícara"), i("óleo", "1/2 xícara"), i("ovo", "2"), i("queijo meia cura", "200 g ralado"), i("sal", "1 colher")],
    steps: [
      "Ferva leite, óleo e sal e escalde o polvilho, mexendo. Espere amornar.",
      "Junte os ovos um a um e o queijo, sovando até a massa ficar lisa.",
      "Faça bolinhas com as mãos untadas e asse a 200 °C por 25 a 30 minutos.",
    ],
  },
  {
    title: "Bolinho de chuva salgado de queijo",
    minutes: 25, servings: 4, tags: ["lanche", "salgado", "rápido"],
    ingredients: [i("farinha de trigo", "1 xícara"), i("ovo", "1"), i("leite", "1/2 xícara"), i("queijo", "100 g ralado"), i("fermento", "1 colher"), i("sal"), i("óleo", "para fritar")],
    steps: ["Misture tudo até formar uma massa grossa.", "Frite colheradas em óleo quente até dourar. Escorra em papel."],
  },
  {
    title: "Bolinho de arroz",
    minutes: 25, servings: 4, tags: ["aproveitamento", "lanche", "salgado"],
    ingredients: [i("arroz cozido", "2 xícaras"), i("ovo", "1"), i("farinha de trigo", "3 colheres"), i("queijo", "50 g ralado", true), i("cheiro verde", "a gosto", true), i("sal"), i("óleo", "para fritar")],
    steps: ["Amasse o arroz e misture o resto até dar ponto de modelar.", "Frite colheradas em óleo quente até dourar."],
  },
  {
    title: "Pastel de feira",
    minutes: 30, servings: 10, tags: ["lanche", "salgado"],
    ingredients: [i("massa de pastel", "500 g"), i("queijo muçarela", "200 g", true), i("carne moída refogada", "2 xícaras", true), i("óleo", "para fritar")],
    steps: ["Recheie a massa sem exagero, feche apertando as bordas com um garfo.", "Frite em óleo bem quente até estufar e dourar."],
  },
  {
    title: "Torta salgada de liquidificador de presunto e queijo",
    minutes: 50, servings: 8, tags: ["forno", "lanche", "salgado"],
    ingredients: [i("ovo", "3"), i("leite", "2 xícaras"), i("óleo", "1/2 xícara"), i("farinha de trigo", "2 xícaras"), i("fermento", "1 colher"), i("presunto", "200 g"), i("queijo", "200 g"), i("tomate", "1", true), i("sal")],
    steps: [
      "Bata ovos, leite, óleo, farinha e sal no liquidificador. Junte o fermento.",
      "Despeje metade numa forma untada, espalhe presunto, queijo e tomate e cubra com o resto.",
      "Asse a 180 °C por 35 a 40 minutos.",
    ],
  },
  {
    title: "Pizza de frigideira",
    minutes: 20, servings: 2, tags: ["lanche", "rápido", "salgado"],
    ingredients: [i("farinha de trigo", "1 xícara"), i("leite", "1/2 xícara"), i("ovo", "1"), i("fermento", "1 colher de chá"), i("molho de tomate", "3 colheres"), i("queijo muçarela", "100 g"), i("orégano", "a gosto", true), i("sal")],
    steps: [
      "Misture farinha, leite, ovo, sal e fermento até ficar uma massa mole.",
      "Espalhe numa frigideira untada e doure em fogo baixo, tampado; vire.",
      "Cubra com molho, queijo e orégano e tampe até derreter.",
    ],
  },
  {
    title: "Sanduíche natural de frango",
    minutes: 10, servings: 2, tags: ["lanche", "leve", "rápido"],
    ingredients: [i("pão de forma", "4 fatias"), i("frango desfiado", "1 xícara"), i("cenoura", "1 ralada"), i("requeijão", "2 colheres"), i("alface", "folhas", true), i("milho", "2 colheres", true), i("sal")],
    steps: ["Misture frango, cenoura, requeijão e milho; acerte o sal.", "Recheie o pão com o creme e a alface."],
  },
  {
    title: "Crepioca",
    minutes: 10, servings: 1, tags: ["café da manhã", "rápido", "leve"],
    ingredients: [i("ovo", "1"), i("goma de tapioca", "2 colheres"), i("sal"), i("queijo", "30 g", true), i("tomate", "1/2", true)],
    steps: ["Bata o ovo com a goma e o sal.", "Despeje numa frigideira antiaderente, doure dos dois lados e recheie."],
  },
  {
    title: "Hambúrguer caseiro",
    minutes: 25, servings: 4, tags: ["lanche", "proteína"],
    ingredients: [i("carne moída", "500 g"), i("sal"), i("pimenta", "a gosto", true), i("pão de hambúrguer", "4"), i("queijo", "4 fatias", true), i("alface", "folhas", true), i("tomate", "1", true)],
    steps: [
      "Divida a carne em 4 bolas e achate (um pouco maiores que o pão). Tempere só por fora com sal e pimenta.",
      "Grelhe em frigideira bem quente 3 minutos de cada lado; ponha o queijo no fim e tampe.",
      "Monte no pão com alface e tomate.",
    ],
  },

  // ---------- doces ----------
  {
    title: "Bolo de cenoura com cobertura de chocolate",
    minutes: 60, servings: 10, tags: ["doce", "forno"],
    ingredients: [i("cenoura", "3 médias"), i("ovo", "4"), i("óleo", "1 xícara"), i("açúcar", "2 xícaras"), i("farinha de trigo", "2 xícaras e 1/2"), i("fermento", "1 colher"), i("chocolate em pó", "4 colheres"), i("manteiga", "1 colher"), i("leite", "1/2 xícara")],
    steps: [
      "Bata no liquidificador cenoura, ovos, óleo e 1 1/2 xícara de açúcar.",
      "Misture com a farinha e por último o fermento. Asse a 180 °C por 40 minutos.",
      "Cobertura: ferva chocolate, manteiga, leite e o resto do açúcar até engrossar um pouco. Espalhe no bolo ainda quente.",
    ],
  },
  {
    title: "Bolo de chocolate simples",
    minutes: 50, servings: 10, tags: ["doce", "forno"],
    ingredients: [i("ovo", "3"), i("açúcar", "1 xícara e 1/2"), i("óleo", "1/2 xícara"), i("leite", "1 xícara"), i("chocolate em pó", "1 xícara"), i("farinha de trigo", "2 xícaras"), i("fermento", "1 colher")],
    steps: ["Misture ovos, açúcar, óleo e leite.", "Junte o chocolate e a farinha, e por último o fermento.", "Asse a 180 °C por 35 a 40 minutos."],
  },
  {
    title: "Bolo de fubá",
    minutes: 50, servings: 10, tags: ["doce", "forno", "café da manhã"],
    ingredients: [i("fubá", "1 xícara"), i("farinha de trigo", "1 xícara"), i("açúcar", "1 xícara e 1/2"), i("ovo", "3"), i("leite", "1 xícara"), i("óleo", "1/2 xícara"), i("fermento", "1 colher"), i("erva-doce", "1 colher", true)],
    steps: ["Bata ovos, açúcar, leite e óleo no liquidificador.", "Misture com fubá, farinha (e erva-doce); por último o fermento.", "Asse a 180 °C por cerca de 40 minutos."],
  },
  {
    title: "Bolo de caneca de chocolate",
    minutes: 5, servings: 1, tags: ["doce", "rápido"],
    ingredients: [i("ovo", "1"), i("leite", "3 colheres"), i("óleo", "2 colheres"), i("açúcar", "3 colheres"), i("chocolate em pó", "2 colheres"), i("farinha de trigo", "3 colheres"), i("fermento", "1 pitada")],
    steps: ["Misture tudo numa caneca grande com um garfo.", "Micro-ondas na potência alta por 2 a 3 minutos."],
  },
  {
    title: "Pudim de leite condensado",
    minutes: 80, servings: 8, tags: ["doce", "sobremesa"],
    ingredients: [i("leite condensado", "1 lata"), i("leite", "a mesma medida da lata"), i("ovo", "3"), i("açúcar", "1 xícara (calda)")],
    steps: [
      "Calda: derreta o açúcar na forma de pudim até dourar e espalhe pelas laterais.",
      "Bata leite condensado, leite e ovos e despeje na forma.",
      "Asse em banho-maria a 180 °C por cerca de 1 hora (ou 20 minutos na pressão). Gele antes de desenformar.",
    ],
  },
  {
    title: "Mousse de maracujá",
    minutes: 10, servings: 6, tags: ["doce", "sobremesa", "rápido"],
    ingredients: [i("leite condensado", "1 lata"), i("creme de leite", "1 caixa"), i("suco de maracujá concentrado", "a mesma medida da lata"), i("maracujá", "1 polpa", true)],
    steps: ["Bata tudo no liquidificador por 3 minutos.", "Leve à geladeira por pelo menos 3 horas. Decore com a polpa."],
  },
  {
    title: "Beijinho",
    minutes: 20, servings: 25, tags: ["doce", "festa"],
    ingredients: [i("leite condensado", "1 lata"), i("coco ralado", "100 g"), i("manteiga", "1 colher"), i("cravo", "para decorar", true)],
    steps: ["Cozinhe leite condensado, manteiga e metade do coco mexendo até desgrudar da panela.", "Esfrie, enrole bolinhas e passe no resto do coco."],
  },
  {
    title: "Brownie",
    minutes: 40, servings: 12, tags: ["doce", "forno"],
    ingredients: [i("chocolate meio amargo", "200 g"), i("manteiga", "100 g"), i("açúcar", "1 xícara"), i("ovo", "3"), i("farinha de trigo", "1/2 xícara"), i("chocolate em pó", "2 colheres", true)],
    steps: [
      "Derreta o chocolate com a manteiga.",
      "Bata os ovos com o açúcar, junte o chocolate derretido e depois a farinha (e o chocolate em pó).",
      "Asse em forma forrada a 180 °C por 20 a 25 minutos — o meio deve ficar úmido.",
    ],
  },
  {
    title: "Bolinho de chuva",
    minutes: 25, servings: 6, tags: ["doce", "lanche"],
    ingredients: [i("farinha de trigo", "2 xícaras"), i("ovo", "2"), i("leite", "1 xícara"), i("açúcar", "1/2 xícara"), i("fermento", "1 colher"), i("canela", "a gosto"), i("óleo", "para fritar")],
    steps: ["Misture ovos, açúcar, leite e farinha; por último o fermento.", "Frite colheradas em óleo quente (não muito quente) até dourar.", "Passe no açúcar com canela."],
  },
  {
    title: "Arroz doce",
    minutes: 40, servings: 6, tags: ["doce", "sobremesa"],
    ingredients: [i("arroz", "1 xícara"), i("leite", "1 litro"), i("leite condensado", "1 lata"), i("açúcar", "1/2 xícara", true), i("canela em pau", "1", true), i("cravo", "3", true)],
    steps: [
      "Cozinhe o arroz em 2 xícaras de água com canela e cravo até secar.",
      "Junte o leite e cozinhe em fogo baixo, mexendo, até engrossar. Acrescente o leite condensado.",
      "Sirva morno ou gelado, com canela em pó.",
    ],
  },
  {
    title: "Pavê de bolacha",
    minutes: 30, servings: 8, tags: ["doce", "sobremesa"],
    ingredients: [i("bolacha maisena", "1 pacote"), i("leite condensado", "1 lata"), i("leite", "500 ml"), i("ovo", "2 gemas"), i("amido de milho", "2 colheres"), i("creme de leite", "1 caixa"), i("chocolate em pó", "2 colheres", true)],
    steps: [
      "Creme: leve leite condensado, leite, gemas e amido ao fogo, mexendo até engrossar.",
      "Monte camadas de bolacha molhada no leite e creme num refratário.",
      "Cubra com creme de leite (misturado ao chocolate, se quiser). Gele por 4 horas.",
    ],
  },
  {
    title: "Banana caramelada",
    minutes: 10, servings: 2, tags: ["doce", "aproveitamento", "rápido"],
    ingredients: [i("banana", "3 maduras"), i("açúcar", "3 colheres"), i("manteiga", "1 colher"), i("canela", "a gosto", true)],
    steps: ["Derreta o açúcar com a manteiga até virar caramelo.", "Junte as bananas em rodelas e doure dos dois lados. Polvilhe canela."],
  },
  {
    title: "Pão de mel caseiro",
    minutes: 45, servings: 15, tags: ["doce", "forno"],
    ingredients: [i("farinha de trigo", "2 xícaras"), i("açúcar mascavo", "1 xícara"), i("mel", "1/2 xícara"), i("leite", "1 xícara"), i("chocolate em pó", "3 colheres"), i("canela", "1 colher"), i("bicarbonato", "1 colher de chá"), i("chocolate meio amargo", "300 g para cobrir")],
    steps: [
      "Misture tudo (menos o chocolate de cobertura) até a massa ficar lisa.",
      "Asse em forma untada a 180 °C por 25 minutos. Esfrie e corte em quadrados.",
      "Banhe no chocolate derretido e deixe secar.",
    ],
  },
  {
    title: "Cocada de panela",
    minutes: 30, servings: 15, tags: ["doce"],
    ingredients: [i("coco ralado", "200 g"), i("açúcar", "1 xícara"), i("leite condensado", "1/2 lata"), i("água", "1/2 xícara")],
    steps: ["Leve tudo ao fogo baixo, mexendo, até desgrudar do fundo.", "Despeje colheradas numa superfície untada e deixe firmar."],
  },
  {
    title: "Gelatina colorida com creme",
    minutes: 20, servings: 8, tags: ["doce", "sobremesa"],
    ingredients: [i("gelatina", "3 caixas de sabores diferentes"), i("leite condensado", "1 lata"), i("creme de leite", "1 caixa"), i("gelatina sem sabor", "1 envelope")],
    steps: [
      "Prepare as gelatinas separadas, com metade da água fria indicada; gele e corte em cubos.",
      "Hidrate e dissolva a gelatina sem sabor; bata com leite condensado e creme de leite.",
      "Misture os cubos ao creme numa forma e gele por 4 horas.",
    ],
  },
];
