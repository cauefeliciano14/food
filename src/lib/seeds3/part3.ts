import type { Recipe } from "../types";

type Seed = Omit<Recipe, "id" | "createdAt" | "source">;

const i = (name: string, amount?: string, optional?: boolean) => ({ name, amount, optional });

export const PART_3: Seed[] = [
  {
    title: "Salada de macarrão",
    minutes: 30, servings: 6, tags: ["salada", "massa", "festa"],
    ingredients: [i("macarrão parafuso", "500 g"), i("maionese", "1 xícara"), i("presunto", "150 g"), i("queijo muçarela", "150 g"), i("cenoura", "1"), i("milho verde", "1 lata"), i("ervilha", "1 lata", true), i("cheiro-verde", "a gosto", true), i("sal")],
    steps: [
      "Cozinhe o macarrão em água com sal até ficar al dente. Escorra e passe na água fria.",
      "Rale a cenoura e corte o presunto e a muçarela em cubinhos.",
      "Misture o macarrão com os demais ingredientes e a maionese. Acerte o sal.",
      "Leve à geladeira por pelo menos 30 minutos antes de servir.",
    ],
  },
  {
    title: "Arroz à grega",
    minutes: 35, servings: 6, tags: ["acompanhamento", "festa", "vegetariano"],
    ingredients: [i("arroz", "2 xícaras"), i("cenoura", "1"), i("ervilha", "1/2 xícara"), i("milho verde", "1/2 xícara"), i("uva-passa", "1/3 xícara", true), i("cebola", "1"), i("alho", "2 dentes"), i("óleo", "2 colheres"), i("água", "4 xícaras"), i("sal")],
    steps: [
      "Refogue a cebola e o alho no óleo, junte o arroz e frite por 2 minutos.",
      "Adicione a água quente e o sal. Cozinhe em fogo baixo com a panela tampada até secar.",
      "Enquanto isso, corte a cenoura em cubinhos e cozinhe por 5 minutos.",
      "Misture ao arroz pronto a cenoura, a ervilha, o milho e a uva-passa. Sirva quente.",
    ],
  },
  {
    title: "Couve-flor assada",
    minutes: 35, servings: 4, tags: ["forno", "vegetariano", "acompanhamento", "leve"],
    ingredients: [i("couve-flor", "1 unidade"), i("azeite", "3 colheres"), i("alho", "3 dentes"), i("páprica", "1 colher de chá", true), i("queijo parmesão", "3 colheres", true), i("sal"), i("pimenta", "a gosto", true)],
    steps: [
      "Preaqueça o forno a 220 °C e separe a couve-flor em floretes.",
      "Misture com azeite, alho picado, sal, pimenta e páprica.",
      "Espalhe numa assadeira e asse por 25 minutos, virando na metade.",
      "Polvilhe o parmesão nos últimos 5 minutos, se quiser.",
    ],
  },
  {
    title: "Sunomono",
    minutes: 20, servings: 4, tags: ["salada", "leve", "vegetariano", "rápido"],
    ingredients: [i("pepino japonês", "2"), i("vinagre de arroz", "1/2 xícara"), i("açúcar", "3 colheres"), i("sal", "1 colher de chá"), i("gergelim", "1 colher", true), i("gengibre", "1 pedaço pequeno", true)],
    steps: [
      "Fatie o pepino bem fino, polvilhe sal e deixe descansar por 10 minutos.",
      "Esprema o pepino com as mãos para tirar o excesso de água.",
      "Misture o vinagre com o açúcar até dissolver e junte o gengibre ralado.",
      "Regue o pepino com a mistura, salpique gergelim e sirva gelado.",
    ],
  },
  {
    title: "Tabule",
    minutes: 40, servings: 4, tags: ["salada", "vegetariano", "leve"],
    ingredients: [i("trigo para quibe", "1 xícara"), i("tomate", "3"), i("pepino", "1"), i("cebola", "1"), i("salsinha", "1 maço"), i("hortelã", "1/2 maço"), i("limão", "2"), i("azeite", "4 colheres"), i("sal")],
    steps: [
      "Deixe o trigo de molho em água por 30 minutos e esprema bem.",
      "Pique tomate, pepino, cebola, salsinha e hortelã bem miudinho.",
      "Misture tudo com o trigo e tempere com suco de limão, azeite e sal.",
      "Sirva frio.",
    ],
  },
  {
    title: "Creme de milho",
    minutes: 20, servings: 4, tags: ["acompanhamento", "vegetariano", "rápido"],
    ingredients: [i("milho verde", "2 latas"), i("leite", "1 xícara"), i("creme de leite", "1 caixinha"), i("cebola", "1/2"), i("manteiga", "1 colher"), i("farinha de trigo", "1 colher"), i("queijo parmesão", "2 colheres", true), i("sal")],
    steps: [
      "Bata no liquidificador uma lata de milho escorrido com o leite.",
      "Doure a cebola picada na manteiga e junte a farinha, mexendo por 1 minuto.",
      "Acrescente o milho batido e o restante do milho inteiro. Mexa até engrossar.",
      "Desligue, misture o creme de leite e o parmesão e acerte o sal.",
    ],
  },
  {
    title: "Batata-doce assada na air fryer",
    minutes: 30, servings: 2, tags: ["air fryer", "vegetariano", "acompanhamento", "leve"],
    ingredients: [i("batata-doce", "2 médias"), i("azeite", "1 colher"), i("alecrim", "a gosto", true), i("páprica", "1 colher de chá", true), i("sal")],
    steps: [
      "Lave bem a batata-doce e corte em palitos ou rodelas grossas, com casca.",
      "Tempere com azeite, sal, páprica e alecrim.",
      "Leve à air fryer preaquecida a 200 °C por 20 a 25 minutos, sacudindo o cesto na metade.",
      "No forno, asse a 220 °C por cerca de 35 minutos, virando na metade.",
    ],
  },
  {
    title: "Berinjela à milanesa",
    minutes: 40, servings: 4, tags: ["vegetariano", "acompanhamento", "salgado"],
    ingredients: [i("berinjela", "2"), i("ovo", "2"), i("farinha de trigo", "1 xícara"), i("farinha de rosca", "1 1/2 xícara"), i("alho", "1 dente", true), i("óleo", "para fritar"), i("sal")],
    steps: [
      "Corte a berinjela em rodelas, salpique sal e deixe descansar 15 minutos. Seque com papel.",
      "Passe cada rodela na farinha de trigo, depois no ovo batido com alho e sal e por fim na farinha de rosca.",
      "Frite em óleo quente até dourar dos dois lados.",
      "Escorra em papel-toalha e sirva.",
    ],
  },
  {
    title: "Salada de repolho com abacaxi",
    minutes: 20, servings: 6, tags: ["salada", "vegetariano", "festa", "rápido"],
    ingredients: [i("repolho", "1/2 unidade"), i("abacaxi", "1/2 unidade"), i("maionese", "4 colheres"), i("creme de leite", "1/2 caixinha", true), i("limão", "1/2"), i("uva-passa", "1/4 xícara", true), i("sal")],
    steps: [
      "Fatie o repolho bem fino e corte o abacaxi em cubinhos.",
      "Misture a maionese com o creme de leite, o suco de limão e o sal.",
      "Junte o molho ao repolho e ao abacaxi, acrescente a uva-passa e misture.",
      "Leve à geladeira até a hora de servir.",
    ],
  },
  {
    title: "Salada caesar",
    minutes: 30, servings: 4, tags: ["salada", "proteína"],
    ingredients: [i("alface americana", "1 pé"), i("peito de frango", "2 filés", true), i("pão de forma", "3 fatias"), i("queijo parmesão", "1/2 xícara"), i("maionese", "4 colheres"), i("limão", "1"), i("alho", "1 dente"), i("mostarda", "1 colher de chá"), i("azeite", "2 colheres"), i("sal"), i("pimenta", "a gosto", true)],
    steps: [
      "Corte o pão em cubos, regue com azeite e toste no forno ou na frigideira até ficar crocante.",
      "Tempere o frango com sal e pimenta, grelhe e corte em tiras.",
      "Misture a maionese com limão, alho amassado, mostarda e metade do parmesão para o molho.",
      "Rasgue a alface, junte frango, croutons e molho e finalize com o restante do parmesão.",
    ],
  },
  {
    title: "Arroz amarelo",
    minutes: 25, servings: 4, tags: ["acompanhamento", "básico", "vegetariano"],
    ingredients: [i("arroz", "2 xícaras"), i("açafrão-da-terra", "1 colher de chá"), i("cebola", "1/2"), i("alho", "2 dentes"), i("óleo", "2 colheres"), i("água", "4 xícaras"), i("sal")],
    steps: [
      "Refogue a cebola e o alho no óleo até murcharem.",
      "Junte o arroz e o açafrão e mexa por 2 minutos.",
      "Adicione a água quente e o sal e cozinhe em fogo baixo, tampado, até secar.",
      "Deixe descansar 5 minutos e solte com um garfo.",
    ],
  },
  {
    title: "Mandioca cozida",
    minutes: 30, servings: 4, tags: ["acompanhamento", "básico", "vegetariano", "panela de pressão"],
    ingredients: [i("mandioca", "1 kg"), i("água"), i("sal"), i("manteiga", "2 colheres", true)],
    steps: [
      "Descasque a mandioca, corte em pedaços e retire o fio central.",
      "Coloque na panela de pressão, cubra com água e sal.",
      "Cozinhe por 15 a 20 minutos depois que pegar pressão, até ficar macia.",
      "Escorra e sirva com um pouco de manteiga por cima.",
    ],
  },
  {
    title: "Arroz frito",
    minutes: 20, servings: 3, tags: ["aproveitamento", "rápido", "salgado"],
    ingredients: [i("arroz cozido", "3 xícaras"), i("ovo", "2"), i("cenoura", "1"), i("cebolinha", "a gosto"), i("presunto", "100 g", true), i("ervilha", "1/2 xícara", true), i("molho shoyu", "2 colheres"), i("alho", "2 dentes"), i("óleo", "2 colheres")],
    steps: [
      "Mexa os ovos numa frigideira grande com um fio de óleo e reserve.",
      "Refogue o alho, a cenoura ralada, o presunto e a ervilha no restante do óleo.",
      "Junte o arroz frio, de preferência do dia anterior, e frite em fogo alto mexendo sempre.",
      "Tempere com shoyu, volte os ovos e finalize com cebolinha.",
    ],
  },
  {
    title: "Farofa de cebola caramelizada",
    minutes: 30, servings: 6, tags: ["acompanhamento", "vegetariano", "festa"],
    ingredients: [i("farinha de mandioca", "2 xícaras"), i("cebola", "3"), i("manteiga", "4 colheres"), i("açúcar", "1 colher de chá"), i("cheiro-verde", "a gosto", true), i("sal")],
    steps: [
      "Fatie a cebola em meias-luas finas.",
      "Derreta a manteiga e cozinhe a cebola em fogo baixo com o açúcar, mexendo, por uns 20 minutos até dourar bem.",
      "Junte a farinha aos poucos e toste mexendo sempre.",
      "Acerte o sal e finalize com cheiro-verde.",
    ],
  },
  {
    title: "Berinjela assada com pimentão",
    minutes: 40, servings: 4, tags: ["forno", "vegetariano", "acompanhamento", "leve"],
    ingredients: [i("berinjela", "2"), i("pimentão vermelho", "1"), i("pimentão amarelo", "1", true), i("cebola", "1"), i("alho", "3 dentes"), i("azeite", "4 colheres"), i("orégano", "a gosto"), i("sal")],
    steps: [
      "Preaqueça o forno a 200 °C.",
      "Corte berinjela, pimentões e cebola em cubos grandes.",
      "Tempere com azeite, alho picado, orégano e sal e espalhe numa assadeira.",
      "Asse por 30 minutos, mexendo na metade, até os legumes ficarem macios e dourados.",
    ],
  },
  {
    title: "Salada de legumes cozidos",
    minutes: 30, servings: 4, tags: ["salada", "vegetariano", "leve"],
    ingredients: [i("batata", "2"), i("cenoura", "2"), i("chuchu", "1"), i("vagem", "100 g"), i("azeite", "3 colheres"), i("vinagre", "1 colher"), i("cheiro-verde", "a gosto"), i("sal")],
    steps: [
      "Descasque e corte batata, cenoura e chuchu em cubos; corte a vagem em pedaços.",
      "Cozinhe em água com sal, começando pela cenoura e batata, até ficarem macios mas firmes.",
      "Escorra e deixe esfriar.",
      "Tempere com azeite, vinagre, sal e cheiro-verde.",
    ],
  },
  {
    title: "Chuchu empanado",
    minutes: 35, servings: 4, tags: ["vegetariano", "acompanhamento", "aproveitamento"],
    ingredients: [i("chuchu", "2"), i("ovo", "2"), i("farinha de trigo", "1/2 xícara"), i("farinha de rosca", "1 xícara"), i("queijo parmesão", "2 colheres", true), i("óleo", "para fritar"), i("sal")],
    steps: [
      "Descasque o chuchu, corte em fatias e cozinhe em água com sal por 5 minutos. Escorra e seque.",
      "Passe as fatias na farinha de trigo, no ovo batido com sal e na farinha de rosca misturada ao parmesão.",
      "Frite em óleo quente até dourar.",
      "Escorra em papel-toalha e sirva quente.",
    ],
  },
  {
    title: "Milho refogado",
    minutes: 15, servings: 4, tags: ["acompanhamento", "vegetariano", "rápido"],
    ingredients: [i("milho verde", "2 latas"), i("cebola", "1"), i("alho", "1 dente"), i("manteiga", "2 colheres"), i("cheiro-verde", "a gosto", true), i("sal"), i("pimenta", "a gosto", true)],
    steps: [
      "Escorra o milho.",
      "Doure a cebola e o alho picados na manteiga.",
      "Junte o milho e refogue por 5 minutos, mexendo.",
      "Tempere com sal e pimenta e finalize com cheiro-verde.",
    ],
  },
  {
    title: "Vagem refogada",
    minutes: 20, servings: 4, tags: ["acompanhamento", "vegetariano", "leve", "rápido"],
    ingredients: [i("vagem", "400 g"), i("alho", "3 dentes"), i("cebola", "1/2", true), i("azeite", "2 colheres"), i("sal")],
    steps: [
      "Retire as pontas da vagem e corte em pedaços de uns 4 cm.",
      "Cozinhe em água fervente com sal por 5 minutos e escorra.",
      "Doure o alho e a cebola no azeite, junte a vagem e refogue por 3 minutos.",
      "Acerte o sal e sirva.",
    ],
  },
  {
    title: "Salada de repolho com atum",
    minutes: 15, servings: 4, tags: ["salada", "proteína", "rápido"],
    ingredients: [i("repolho", "1/4 unidade"), i("atum em lata", "1 lata"), i("cenoura", "1"), i("milho verde", "1/2 lata", true), i("maionese", "3 colheres"), i("limão", "1/2"), i("sal")],
    steps: [
      "Fatie o repolho bem fino e rale a cenoura.",
      "Escorra o atum e o milho.",
      "Misture tudo com a maionese, o suco de limão e o sal.",
      "Sirva gelada.",
    ],
  },
  {
    title: "Salada de cenoura cremosa",
    minutes: 15, servings: 4, tags: ["salada", "vegetariano", "rápido"],
    ingredients: [i("cenoura", "3"), i("maionese", "3 colheres"), i("creme de leite", "1/2 caixinha", true), i("uva-passa", "1/4 xícara", true), i("limão", "1/2"), i("sal")],
    steps: [
      "Rale a cenoura no ralo fino.",
      "Misture a maionese com o creme de leite, o suco de limão e uma pitada de sal.",
      "Junte o molho à cenoura e acrescente a uva-passa.",
      "Leve à geladeira por 15 minutos antes de servir.",
    ],
  },
  {
    title: "Salada de ovos",
    minutes: 20, servings: 4, tags: ["salada", "vegetariano", "lanche"],
    ingredients: [i("ovo", "6"), i("maionese", "3 colheres"), i("mostarda", "1 colher de chá", true), i("cebolinha", "a gosto"), i("sal"), i("pimenta", "a gosto", true)],
    steps: [
      "Cozinhe os ovos por 10 minutos, passe para água fria e descasque.",
      "Pique os ovos em pedaços pequenos.",
      "Misture com maionese, mostarda, cebolinha, sal e pimenta.",
      "Sirva como salada ou recheio de sanduíche.",
    ],
  },
  {
    title: "Salada de grão-de-bico",
    minutes: 20, servings: 4, tags: ["salada", "vegetariano", "leve"],
    ingredients: [i("grão-de-bico cozido", "2 xícaras"), i("tomate", "2"), i("pepino", "1"), i("cebola roxa", "1/2"), i("salsinha", "a gosto"), i("limão", "1"), i("azeite", "3 colheres"), i("sal")],
    steps: [
      "Escorra o grão-de-bico já cozido.",
      "Pique tomate, pepino, cebola roxa e salsinha.",
      "Misture tudo e tempere com limão, azeite e sal.",
      "Deixe descansar 10 minutos na geladeira para pegar sabor.",
    ],
  },
  {
    title: "Salada de batata",
    minutes: 35, servings: 6, tags: ["salada", "vegetariano", "festa"],
    ingredients: [i("batata", "1 kg"), i("maionese", "1 xícara"), i("ovo", "2", true), i("cebola", "1/2"), i("cheiro-verde", "a gosto"), i("sal")],
    steps: [
      "Descasque a batata, corte em cubos e cozinhe em água com sal até ficar macia, sem desmanchar.",
      "Cozinhe os ovos por 10 minutos e pique.",
      "Escorra a batata, deixe amornar e misture com maionese, cebola picada, ovos e cheiro-verde.",
      "Acerte o sal e leve à geladeira até servir.",
    ],
  },
  {
    title: "Salada de almeirão com bacon",
    minutes: 15, servings: 4, tags: ["salada", "rápido", "salgado"],
    ingredients: [i("almeirão", "1 maço"), i("bacon", "150 g"), i("cebola", "1/2"), i("vinagre", "1 colher"), i("azeite", "1 colher", true), i("sal")],
    steps: [
      "Lave o almeirão e corte em tiras finas.",
      "Frite o bacon em cubinhos até ficar crocante. Junte a cebola fatiada e deixe murchar.",
      "Despeje o bacon ainda quente, com a gordura, sobre o almeirão.",
      "Tempere com vinagre, azeite e pouco sal, misture e sirva na hora.",
    ],
  },
  {
    title: "Batata assada com bacon",
    minutes: 50, servings: 4, tags: ["forno", "acompanhamento", "salgado"],
    ingredients: [i("batata", "800 g"), i("bacon", "150 g"), i("cebola", "1"), i("alho", "3 dentes"), i("azeite", "2 colheres"), i("alecrim", "a gosto", true), i("queijo muçarela", "100 g", true), i("sal")],
    steps: [
      "Preaqueça o forno a 200 °C. Corte a batata em cubos ou gomos e cozinhe por 5 minutos em água com sal.",
      "Escorra e misture com bacon picado, cebola em pétalas, alho, azeite, alecrim e sal.",
      "Espalhe numa assadeira e asse por 35 minutos, mexendo na metade, até dourar.",
      "Se quiser, cubra com muçarela nos últimos 5 minutos.",
    ],
  },
  {
    title: "Legumes na manteiga",
    minutes: 25, servings: 4, tags: ["acompanhamento", "vegetariano", "leve"],
    ingredients: [i("cenoura", "2"), i("brócolis", "1 maço pequeno"), i("vagem", "150 g"), i("batata", "2", true), i("manteiga", "2 colheres"), i("alho", "1 dente"), i("salsinha", "a gosto", true), i("sal")],
    steps: [
      "Corte os legumes em pedaços parecidos.",
      "Cozinhe no vapor ou em água com sal até ficarem macios mas firmes. Escorra.",
      "Derreta a manteiga com o alho picado, junte os legumes e salteie por 2 minutos.",
      "Acerte o sal e finalize com salsinha.",
    ],
  },
  {
    title: "Jiló frito",
    minutes: 25, servings: 4, tags: ["vegetariano", "acompanhamento", "lanche"],
    ingredients: [i("jiló", "500 g"), i("farinha de trigo", "1/2 xícara"), i("alho", "2 dentes", true), i("óleo", "para fritar"), i("sal")],
    steps: [
      "Corte o jiló em rodelas finas e deixe de molho em água com sal por 10 minutos para tirar o amargor.",
      "Escorra, seque bem e tempere com sal e alho amassado.",
      "Passe as rodelas na farinha de trigo e retire o excesso.",
      "Frite em óleo quente até dourar e escorra em papel-toalha.",
    ],
  },
  {
    title: "Tomates assados com parmesão",
    minutes: 25, servings: 4, tags: ["forno", "vegetariano", "acompanhamento", "leve"],
    ingredients: [i("tomate", "4"), i("queijo parmesão", "1/2 xícara"), i("farinha de rosca", "2 colheres", true), i("alho", "1 dente"), i("orégano", "a gosto"), i("azeite", "2 colheres"), i("sal")],
    steps: [
      "Preaqueça o forno a 200 °C e corte os tomates ao meio.",
      "Coloque numa assadeira com o corte para cima e tempere com sal, alho picado e orégano.",
      "Misture o parmesão com a farinha de rosca e cubra os tomates. Regue com azeite.",
      "Asse por 15 a 20 minutos, até gratinar.",
    ],
  },
  {
    title: "Acelga refogada",
    minutes: 15, servings: 4, tags: ["acompanhamento", "vegetariano", "leve", "rápido"],
    ingredients: [i("acelga", "1/2 unidade"), i("alho", "3 dentes"), i("cebola", "1/2"), i("azeite", "2 colheres"), i("molho shoyu", "1 colher", true), i("sal")],
    steps: [
      "Lave a acelga e corte em tiras, separando os talos das folhas.",
      "Doure o alho e a cebola no azeite.",
      "Junte os talos e refogue 3 minutos; acrescente as folhas e mexa até murcharem.",
      "Tempere com sal ou shoyu e sirva.",
    ],
  },
];
