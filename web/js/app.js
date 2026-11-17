/**
 * Citizen Assist AI — Aplicação web de orientação cidadã
 * Paleta: #101010, #ffffff, #c8ff00
 * Foco em acessibilidade para público com idade avançada
 */
(function () {
  "use strict";

  // ==================================================================
  // ESTADO GLOBAL
  // ==================================================================
  let BASE = null;
  let BUSCADOR = null;
  let currentModel = "B"; // Modelo B como padrão acolhedor
  let speechEnabled = true;
  let recognition = null;

  const STOPWORDS = new Set([
    "a","o","as","os","um","uma","uns","umas","de","do","da","dos","das","em","no","na",
    "nos","nas","por","para","com","sem","sobre","entre","ate","desde","e","ou","mas",
    "que","se","como","quando","onde","porque","meu","minha","meus","minhas","seu","sua",
    "seus","suas","dele","dela","deles","delas","este","esta","estes","estas","esse","essa",
    "esses","essas","isso","isto","aquilo","quem","qual","quais","quanto","quantos","quanta",
    "quantas","eu","tu","ele","ela","nos","vos","eles","elas","ser","estar","ter","haver",
    "fazer","ir","dizer","dar","é","sao","foi","era","tem","ha","so","ja","muito","mais",
    "menos","tambem","assim","tudo","nada","todo","toda","todos","todas","nao","sim",
  ]);

  const MODEL_META = {
    A: {
      nome: "Modelo A — Objetivo-Institucional",
      explain: "Respostas diretas, impessoais e rápidas para quem busca confirmação objetiva. Ideal para consultas operacionais.",
    },
    B: {
      nome: "Modelo B — Empático-Educativo (Linguagem Cidadã)",
      explain: "Linguagem simples e acolhedora, passos guiados e dicas práticas. Recomendado para o público geral e pessoas idosas.",
    },
  };

  // ==================================================================
  // BASE DE CONHECIMENTO (FALLBACK OFFLINE EMBUTIDO)
  // ==================================================================
  const BASE_EMBEDDED = {
    "versao_base": "1.0.0",
    "temas": [
      {"id":"T1","nome":"Documentação Básica","descricao":"Identidade Nacional (CIN), CPF, Título de Eleitor, Carteira de Trabalho e certidões civis.","subtemas":["Identificação Civil","Identificação Fiscal","Cidadania Eleitoral","Documentos Trabalhistas","Registro Civil"]},
      {"id":"T2","nome":"Serviços Públicos e Benefícios Sociais","descricao":"Cadastro Único, Bolsa Família, Meu INSS, Seguro-Desemprego e Tarifa Social de Energia.","subtemas":["Assistência Social","Transferência de Renda","Previdência Social","Proteção ao Trabalhador","Utilidades Públicas"]},
      {"id":"T3","nome":"Direitos e Cidadania","descricao":"Direitos do consumidor, acesso ao SUS, Defensoria Pública e direitos da pessoa idosa.","subtemas":["Relações de Consumo","Saúde Pública","Acesso à Justiça","Proteção Social"]},
      {"id":"T4","nome":"Orientações Comunitárias e Emergências","descricao":"CRAS municipal, Defesa Civil, vacinação e canais oficiais de denúncia e acolhimento.","subtemas":["Apoio Comunitário","Proteção Comunitária e Desastres","Saúde Comunitária","Direitos Humanos e Emergências Sociais"]}
    ],
    "orientacoes": [
      {
        "identificador":"DOC-01","tema":"Documentação Básica","subtema":"Identificação Civil",
        "titulo":"Nova Carteira de Identidade Nacional (CIN)",
        "pergunta_modelo":"Como tirar a Nova Carteira de Identidade Nacional (CIN)?",
        "palavras_chave":["cin","carteira de identidade","rg novo","novo rg","segunda via rg","primeira via rg","identidade nacional","documento de identidade","tirar rg"],
        "orientacao_resumida":"A Carteira de Identidade Nacional (CIN) adota o CPF como número único de identificação e substitui o modelo antigo de RG. Para emiti-la, procure o órgão estadual de identificação civil com Certidão de Nascimento ou Casamento e CPF regularizado. A primeira via é gratuita em todo o país.",
        "orientacao_detalhada":"A CIN foi instituída pela Lei nº 14.534/2023 para unificar a identificação civil no Brasil sob o número do CPF, eliminando números de RG diferentes por estado. O documento traz código MRZ internacional e versão digital acessível pelo aplicativo gov.br após a emissão presencial.",
        "passos":["Verifique se o seu CPF está regular junto à Receita Federal.","Separe Certidão de Nascimento (solteiros) ou Casamento (casados/viúvos) original e legível.","Agende o atendimento no órgão do seu estado (ex.: Poupatempo em SP, Detran no RJ, UAI em MG).","Compareça na data com os documentos para coleta de foto e biometria.","Retire o documento impresso no prazo indicado ou acesse a versão digital no app gov.br."],
        "aviso":"Confirme taxas de 2ª via e regras de agendamento diretamente com o órgão do seu estado, pois procedimentos variam por unidade federativa.",
        "referencia_consultada":"Ministério da Gestão e da Inovação em Serviços Públicos (MGI) — gov.br/identidade; Lei Federal nº 14.534/2023.",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/pt-br/servicos/obter-a-carteira-de-identidade-nacional","topicos_relacionados":["DOC-02","DOC-05","DOC-03"]
      },
      {
        "identificador":"DOC-02","tema":"Documentação Básica","subtema":"Identificação Fiscal",
        "titulo":"CPF — Inscrição, Regularização e Comprovante",
        "pergunta_modelo":"Como faço para regularizar ou tirar o CPF?",
        "palavras_chave":["cpf","regularizar cpf","tirar cpf","cpf suspenso","cpf pendente","inscrição cpf","comprovante cpf","receita federal","segunda via cpf"],
        "orientacao_resumida":"A inscrição e a regularização do CPF podem ser feitas gratuitamente pela internet no portal da Receita Federal. O CPF é o número único oficial do cidadão perante os serviços públicos. Atendimento presencial também existe nos Correios, Banco do Brasil ou Caixa, mediante pequena tarifa pública.",
        "orientacao_detalhada":"O CPF pode estar em situação regular, suspensa (dados cadastrais desatualizados), pendente de regularização (declarações pendentes) ou cancelada. Regularizar pela internet é gratuito e imediato na maioria dos casos simples.",
        "passos":["Acesse o site da Receita Federal na área 'Meu CPF'.","Selecione 'Inscrever-se no CPF' ou 'Atualizar Cadastro'.","Preencha os dados e anexe cópia do documento de identificação quando solicitado.","Acompanhe o protocolo online até a confirmação da situação regular."],
        "aviso":"Desconfie de sites ou mensagens que cobrem valores altos para regularização; o canal oficial da Receita é sempre gratuito pela internet.",
        "referencia_consultada":"Receita Federal do Brasil — gov.br/receitafederal (Serviços Meu CPF).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/receitafederal/pt-br/assuntos/meu-cpf","topicos_relacionados":["DOC-01","SRV-01","DIR-03"]
      },
      {
        "identificador":"DOC-03","tema":"Documentação Básica","subtema":"Cidadania Eleitoral",
        "titulo":"Título de Eleitor e e-Título",
        "pergunta_modelo":"Como obter a primeira via ou regularizar o Título de Eleitor?",
        "palavras_chave":["título de eleitor","titulo de eleitor","e-titulo","etitulo","transferir titulo","justificar voto","regularizar titulo","alistamento eleitoral","votar","zona eleitoral"],
        "orientacao_resumida":"O alistamento eleitoral, a transferência de município e a regularização cadastral são feitos pelo sistema Título Net no portal do TSE. O documento em versão digital está disponível gratuitamente pelo aplicativo e-Título, que também informa o local de votação e permite justificar a ausência às urnas.",
        "orientacao_detalhada":"O alistamento eleitoral é obrigatório para brasileiros maiores de 18 anos e facultativo entre 16 e 18 anos e para analfabetos. Multas eleitorais podem ser quitadas pelo próprio portal do TSE por Pix ou boleto.",
        "passos":["Acesse o portal tse.jus.br e escolha 'Autoatendimento do Eleitor / Título Net'.","Preencha os dados e envie fotos dos documentos solicitados e de uma selfie segurando o documento.","Acompanhe o protocolo pelo mesmo sistema.","Baixe o aplicativo e-Título para ter o título digital com foto."],
        "aviso":"O cadastro eleitoral fecha temporariamente nos meses anteriores às eleições conforme o calendário divulgado pelo TSE.",
        "referencia_consultada":"Tribunal Superior Eleitoral (TSE) — tse.jus.br (Autoatendimento do Eleitor e Título Net).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.tse.jus.br/servicos-eleitorais/autoatendimento-eleitoral#/","topicos_relacionados":["DOC-01","DOC-02","DIR-04"]
      },
      {
        "identificador":"DOC-04","tema":"Documentação Básica","subtema":"Documentos Trabalhistas",
        "titulo":"Carteira de Trabalho Digital (CTPS Digital)",
        "pergunta_modelo":"Como funciona a Carteira de Trabalho Digital e onde emiti-la?",
        "palavras_chave":["carteira de trabalho","ctps digital","carteira de trabalho digital","registro profissional","contratação","admissão","assinar carteira","ministério do trabalho"],
        "orientacao_resumida":"A CTPS Digital substitui o modelo impresso para a imensa maioria dos trabalhadores formais. Ela é gerada automaticamente a partir do CPF do cidadão e pode ser consultada pelo aplicativo 'Carteira de Trabalho Digital' ou pelo portal gov.br, sem custo.",
        "orientacao_detalhada":"Para ser contratado, o trabalhador apenas precisa informar o número do CPF ao empregador, que lança as informações via eSocial. Os contratos, salários e vínculos aparecem no aplicativo em poucos dias úteis.",
        "passos":["Instale o aplicativo 'Carteira de Trabalho Digital' ou acesse gov.br com sua conta.","Faça login com CPF e senha do gov.br.","Consulte contratos ativos, anotações de férias e histórico profissional.","Use o mesmo ambiente para acompanhar pedidos de seguro-desemprego."],
        "aviso":"Caso encontre inconsistências de vínculos empregatícios, procure a empresa contratante ou uma agência de atendimento do trabalho para retificação.",
        "referencia_consultada":"Ministério do Trabalho e Emprego — gov.br/trabalho-e-emprego (Carteira de Trabalho Digital).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/trabalho-e-emprego/pt-br/servicos/trabalhador/carteira-de-trabalho-digital","topicos_relacionados":["SRV-04","SRV-03","DIR-01"]
      },
      {
        "identificador":"DOC-05","tema":"Documentação Básica","subtema":"Registro Civil",
        "titulo":"Certidões de Nascimento, Casamento e Óbito — 2ª Via",
        "pergunta_modelo":"Como solicitar a segunda via de uma certidão de nascimento ou casamento?",
        "palavras_chave":["certidão de nascimento","certidão de casamento","certidao de óbito","segunda via certidão","cartório de registro civil","registrocivil.org.br","certidão gratuita","hipossuficiência"],
        "orientacao_resumida":"A segunda via de certidões civis pode ser pedida diretamente no cartório onde o registro foi feito ou pelo portal eletrônico registrocivil.org.br, com opção de entrega física ou formato digital. A primeira via é sempre gratuita, e a 2ª via é gratuita para quem declarar não ter condições de pagar.",
        "orientacao_detalhada":"A Lei Federal nº 9.534/1997 assegura a gratuidade da primeira certidão de nascimento e de óbito para qualquer pessoa e da segunda via para quem declarar hipossuficiência financeira.",
        "passos":["Identifique o cartório, livro, folha e termo onde consta o registro (se souber).","Solicite presencialmente no cartório ou pelo portal registrocivil.org.br.","Caso não possa pagar, preencha a declaração de hipossuficiência informada pelo cartório.","Escolha receber a certidão digital por e-mail ou a versão em papel pelo correio."],
        "aviso":"Os emolumentos cobrados pelos cartórios são tabelados por lei em cada estado; confirme a tabela vigente no site do tribunal de justiça local.",
        "referencia_consultada":"Conselho Nacional de Justiça (CNJ) e Lei Federal nº 9.534/1997 — cnj.jus.br; portal registrocivil.org.br.",
        "data_verificacao":"09/11/2026","link_oficial":"https://registrocivil.org.br","topicos_relacionados":["DOC-01","DIR-03","COM-01"]
      },
      {
        "identificador":"SRV-01","tema":"Serviços Públicos e Benefícios Sociais","subtema":"Assistência Social",
        "titulo":"Cadastro Único (CadÚnico) para Programas Sociais",
        "pergunta_modelo":"O que é o Cadastro Único e como se cadastrar?",
        "palavras_chave":["cadunico","cadastro único","cadastro unico","inscrever no cadunico","atualizar cadunico","cras cadastro","programas sociais","benefício social","família de baixa renda"],
        "orientacao_resumida":"O Cadastro Único reúne informações socioeconômicas das famílias de baixa renda e é pré-requisito para Bolsa Família, BPC, Tarifa Social e dezenas de outros programas. A inscrição é presencial no CRAS do município, e a família deve atualizar os dados a cada dois anos ou sempre que houver mudança.",
        "orientacao_detalhada":"Podem se cadastrar famílias com renda mensal de até meio salário mínimo por pessoa ou renda total de até três salários mínimos. É necessário que o responsável familiar leve os documentos de todos os moradores do domicílio.",
        "passos":["Procure o CRAS ou posto do CadÚnico mais próximo da sua residência.","Leve CPF ou Título de Eleitor do responsável e pelo menos um documento de cada membro da família.","Apresente comprovante de endereço recente.","Responda à entrevista social de maneira completa e verídica.","Guarde o comprovante com o NIS (Número de Identificação Social)."],
        "aviso":"Manter os dados desatualizados por mais de dois anos pode levar ao bloqueio de benefícios sociais já concedidos.",
        "referencia_consultada":"Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome (MDS) — gov.br/mds (Cadastro Único).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico","topicos_relacionados":["SRV-02","SRV-05","COM-01"]
      },
      {
        "identificador":"SRV-02","tema":"Serviços Públicos e Benefícios Sociais","subtema":"Transferência de Renda",
        "titulo":"Programa Bolsa Família",
        "pergunta_modelo":"Quais são os critérios para receber o Bolsa Família?",
        "palavras_chave":["bolsa família","bolsa familia","valor bolsa família","criterios bolsa família","calendário bolsa família","condicionalidades","crianças na escola vacina","pagamento auxilio"],
        "orientacao_resumida":"O Bolsa Família transfere renda a famílias em situação de vulnerabilidade com renda por pessoa de até o limite fixado pelo programa, inscritas no CadÚnico com dados atualizados. O benefício exige acompanhamento de saúde (vacinas e pré-natal) e frequência escolar mínima de crianças e adolescentes.",
        "orientacao_detalhada":"A concessão é automática mensalmente com base nos dados do CadÚnico e na disponibilidade orçamentária; não existe fila pública para compra de vagas. O pagamento é realizado pela Caixa e movimentado pelo app Caixa Tem.",
        "passos":["Garanta que a família está inscrita no CadÚnico e com dados em dia.","Acompanhe a concessão pelo app Caixa Tem, app Bolsa Família ou telefone 111 da Caixa.","Cumpridas as condicionalidades, mantenha crianças matriculadas e vacinação em dia.","Atualize o cadastro no CRAS sempre que mudarem renda, escola ou endereço."],
        "aviso":"A inscrição no CadÚnico não garante inclusão imediata no programa; a seleção é mensal pelo governo federal conforme disponibilidade de recursos.",
        "referencia_consultada":"Caixa Econômica Federal e MDS — caixa.gov.br/beneficios/bolsa-familia; gov.br/mds.",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.caixa.gov.br/beneficios/bolsa-familia/","topicos_relacionados":["SRV-01","SRV-05","COM-01"]
      },
      {
        "identificador":"SRV-03","tema":"Serviços Públicos e Benefícios Sociais","subtema":"Previdência Social",
        "titulo":"Meu INSS — Serviços e Benefícios Previdenciários",
        "pergunta_modelo":"Como acessar serviços do INSS pela internet sem ir à agência?",
        "palavras_chave":["meu inss","inss","aposentadoria","auxílio por incapacidade","auxilio doenca","salário maternidade","extrato cnis","telefone 135","perícia médica","pedir benefício inss"],
        "orientacao_resumida":"A plataforma Meu INSS permite solicitar aposentadorias, auxílio por incapacidade temporária (antigo auxílio-doença), salário-maternidade e pensões, além de emitir extrato CNIS e agendar perícia. O atendimento telefônico oficial e gratuito é o 135, disponível de segunda a sábado.",
        "orientacao_detalhada":"A maioria dos serviços do INSS foi digitalizada. Muitos benefícios são concedidos após análise documental (como perícia com atestado médico), sem necessidade de deslocamento a uma agência.",
        "passos":["Acesse meu.inss.gov.br ou instale o aplicativo Meu INSS.","Faça login com a conta gov.br.","Clique em 'Novo Pedido' e selecione o benefício desejado.","Anexe os documentos e atestados em PDF ou foto nítida e anote o protocolo.","Acompanhe o andamento em 'Consultar Pedidos'."],
        "aviso":"Nunca pague terceiros para 'liberar' benefício do INSS; todo o processo pelos canais oficiais é gratuito e fraudes devem ser denunciadas.",
        "referencia_consultada":"Instituto Nacional do Seguro Social (INSS) — meu.inss.gov.br; gov.br/inss (Central 135).",
        "data_verificacao":"09/11/2026","link_oficial":"https://meu.inss.gov.br","topicos_relacionados":["DOC-04","SRV-04","DIR-03"]
      },
      {
        "identificador":"SRV-04","tema":"Serviços Públicos e Benefícios Sociais","subtema":"Proteção ao Trabalhador",
        "titulo":"Seguro-Desemprego",
        "pergunta_modelo":"Como e quando posso solicitar o seguro-desemprego?",
        "palavras_chave":["seguro-desemprego","seguro desemprego","demissão sem justa causa","parcelas","prazo seguro desemprego","emprega brasil","guias de rescisão","trabalhador demitido"],
        "orientacao_resumida":"O seguro-desemprego é devido ao trabalhador formal dispensado sem justa causa e pago em até cinco parcelas conforme o tempo de trabalho. O pedido deve ser feito entre o 7º e o 120º dia após a demissão pelo portal Emprega Brasil, app Carteira de Trabalho Digital ou nas unidades do SINE.",
        "orientacao_detalhada":"O valor é calculado a partir da média dos três últimos salários informados pelo empregador e não pode ser inferior ao salário mínimo vigente.",
        "passos":["Aguarde o prazo mínimo de 7 dias após a data da dispensa.","Abra o app Carteira de Trabalho Digital ou o portal Emprega Brasil (gov.br).","Informe o número do requerimento entregue pela empresa.","Confira as informações contratuais e confirme a solicitação.","Acompanhe a liberação das parcelas diretamente pelo aplicativo."],
        "aviso":"Perder o prazo de 120 dias extingue o direito ao seguro-desemprego daquela dispensa; guarde bem os comprovantes rescisórios.",
        "referencia_consultada":"Ministério do Trabalho e Emprego — gov.br/trabalho-e-emprego (Benefício Seguro-Desemprego).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/pt-br/servicos/solicitar-o-seguro-desemprego","topicos_relacionados":["DOC-04","SRV-03","SRV-01"]
      },
      {
        "identificador":"SRV-05","tema":"Serviços Públicos e Benefícios Sociais","subtema":"Utilidades Públicas",
        "titulo":"Tarifa Social de Energia Elétrica",
        "pergunta_modelo":"Quem tem direito ao desconto da Tarifa Social de Energia Elétrica?",
        "palavras_chave":["tarifa social de energia","tarifa social","desconto conta de luz","baixa renda energia","desconto luz","aneel","bpc tarifa social","conta de energia mais barata"],
        "orientacao_resumida":"A Tarifa Social concede descontos progressivos na conta de luz para famílias inscritas no CadÚnico com renda de até meio salário mínimo por pessoa, beneficiários do BPC e famílias com membro dependente de aparelhos médicos. O benefício é aplicado automaticamente pelas distribuidoras por meio do cruzamento com o CadÚnico.",
        "orientacao_detalhada":"Os descontos podem chegar a até 65% para consumo residencial nos primeiros 30 kWh, diminuindo conforme a faixa de consumo. As distribuidoras de energia cadastram as famílias elegíveis de forma automática desde a Resolução Normativa ANEEL nº 1.000/2021.",
        "passos":["Verifique se sua família está com o CadÚnico ativo e dados idênticos aos da fatura de energia.","Se o desconto não aparecer, ligue para a distribuidora de energia da sua região informando CPF e NIS.","Apresente laudo médico caso a inclusão seja por uso de aparelhos de sobrevivência.","Monitore o item 'Tarifa Social' na conta mensal de luz."],
        "aviso":"Descontos deixam de ser aplicados se o cadastro estiver desatualizado há mais de dois anos.",
        "referencia_consultada":"Agência Nacional de Energia Elétrica (ANEEL) — aneel.gov.br (Tarifa Social de Energia Elétrica).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.aneel.gov.br/tarifa-social-baixa-renda","topicos_relacionados":["SRV-01","SRV-02","COM-01"]
      },
      {
        "identificador":"DIR-01","tema":"Direitos e Cidadania","subtema":"Relações de Consumo",
        "titulo":"Direitos do Consumidor e Reclamação no Procon",
        "pergunta_modelo":"Como registrar uma reclamação contra uma empresa no Procon ou no consumidor.gov.br?",
        "palavras_chave":["procon","consumidor.gov.br","reclamação","produto defeito","garantia","código de defesa do consumidor","cancelar compra","direito de arrependimento","cdc"],
        "orientacao_resumida":"O Código de Defesa do Consumidor garante prazos para reclamar de vícios em produtos (30 dias para bens não duráveis e 90 dias para duráveis), direito de arrependimento em até 7 dias para compras feitas fora da loja e dever de informação clara. Reclamações podem ser abertas na plataforma federal consumidor.gov.br ou no Procon local.",
        "orientacao_detalhada":"A plataforma consumidor.gov.br permite comunicação direta com centenas de empresas credenciadas que têm até dez dias corridos para responder. Quando o problema não se resolve, o consumidor pode avançar para audiência no Procon estadual ou para o Juizado Especial Cível.",
        "passos":["Reúna nota fiscal, contratos, números de protocolo de atendimento e comprovantes de pagamento.","Tente primeiro a solução direta e documente as tentativas de contato com a empresa.","Abra reclamação no portal consumidor.gov.br com a sua conta gov.br.","Se a empresa não estiver credenciada ou não responder, procure o Procon da sua cidade/estado.","Para danos relevantes, consulte o Juizado Especial Cível ou a Defensoria Pública."],
        "aviso":"Guarde sempre protocolos e cópias de conversas; eles são fundamentais caso seja necessário abrir processo formal.",
        "referencia_consultada":"Secretaria Nacional do Consumidor (Senacon) — consumidor.gov.br; Código de Defesa do Consumidor (Lei Federal nº 8.078/1990).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.consumidor.gov.br","topicos_relacionados":["DIR-03","DIR-04","SRV-05"]
      },
      {
        "identificador":"DIR-02","tema":"Direitos e Cidadania","subtema":"Saúde Pública",
        "titulo":"Acesso ao SUS e Cartão Nacional de Saúde (CNS)",
        "pergunta_modelo":"Como ter atendimento no SUS e obter o Cartão Nacional de Saúde?",
        "palavras_chave":["sus","cartão nacional de saúde","cartao sus","posto de saúde","ubs","upa","atendimento médico gratuito","meu sus digital","consulta pública","exames sus"],
        "orientacao_resumida":"O atendimento no Sistema Único de Saúde é universal e gratuito. Para acessar consultas e exames programados, procure a Unidade Básica de Saúde (UBS) do seu bairro com documento de identificação e comprovante de endereço; lá é emitido o Cartão Nacional de Saúde. A versão digital do cartão está disponível no app Meu SUS Digital.",
        "orientacao_detalhada":"A rede é organizada em níveis: UBS (atenção primária e preventiva), UPAs e SAMU 192 (urgência e emergência) e hospitais/ambulatoriais de especialidades (encaminhados pela UBS). Nenhum serviço do SUS pode cobrar pelo atendimento.",
        "passos":["Localize a UBS que atende o seu endereço pelo portal da secretaria municipal de saúde.","Compareça com documento de identidade e comprovante de residência para cadastro e emissão do CNS.","Em caso de urgência, ligue 192 (SAMU) ou procure a UPA mais próxima sem burocracia.","Acompanhe agendamentos, vacinas e resultados no app Meu SUS Digital."],
        "aviso":"Emergências não dependem de cadastro prévio; em risco iminente à vida o atendimento é obrigatório e imediato em qualquer unidade pública.",
        "referencia_consultada":"Ministério da Saúde — gov.br/saude (Cartão Nacional de Saúde e Meu SUS Digital); Lei Federal nº 8.080/1990.",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/saude/pt-br/assuntos/meu-sus-digital","topicos_relacionados":["COM-03","SRV-03","COM-04"]
      },
      {
        "identificador":"DIR-03","tema":"Direitos e Cidadania","subtema":"Acesso à Justiça",
        "titulo":"Assistência Jurídica Gratuita pela Defensoria Pública",
        "pergunta_modelo":"Não tenho condições de pagar um advogado. Onde posso conseguir assistência jurídica gratuita?",
        "palavras_chave":["defensoria pública","advogado gratuito","assistência jurídica","não tenho dinheiro advogado","dpu","defensoria da união","processo gratuito","pensão alimentícia gratuita","divórcio gratuito"],
        "orientacao_resumida":"A Defensoria Pública presta assistência jurídica integral e gratuita à população sem recursos para pagar advogado. As Defensorias Estaduais atendem causas cíveis, de família e criminais comuns; a Defensoria Pública da União (DPU) atende matérias federais e previdenciárias. O atendimento é presencial ou online conforme o estado.",
        "orientacao_detalhada":"O critério é a vulnerabilidade socioeconômica, normalmente aferida por renda familiar máxima fixada por resolução própria em cada estado. Para além da judicialização, os defensores priorizam acordos e mediações extrajudiciais.",
        "passos":["Identifique se a causa é estadual (família, cível, crime) ou federal (INSS, Caixa, benefícios da União).","Consulte o site da Defensoria Pública do seu estado ou da DPU (dpu.def.br).","Separe documento de identidade, comprovante de residência e comprovante de renda de todos os membros.","Reúna todos os papéis relacionados ao caso e aguarde o agendamento."],
        "aviso":"Algumas causas urgentes (prisão, saúde sem remédio, despejo iminente) contam com canais de plantão com atendimento sem agendamento prévio.",
        "referencia_consultada":"Defensoria Pública da União (DPU) — dpu.def.br; Colégio Nacional de Defensores Públicos-Gerais (Condege) — defensoria pública nos estados.",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.dpu.def.br","topicos_relacionados":["DIR-01","DOC-05","SRV-03"]
      },
      {
        "identificador":"DIR-04","tema":"Direitos e Cidadania","subtema":"Proteção Social",
        "titulo":"Direitos da Pessoa Idosa e Atendimento Prioritário",
        "pergunta_modelo":"Quais são os principais direitos garantidos à pessoa idosa no Brasil?",
        "palavras_chave":["idoso","pessoa idosa","estatuto da pessoa idosa","atendimento prioritário","fila preferencial","transporte gratuito idoso","bpc idoso","vaga estacionamento idoso","80 anos"],
        "orientacao_resumida":"O Estatuto da Pessoa Idosa assegura prioridade absoluta em serviços públicos e privados, atendimento preferencial especial aos maiores de 80 anos, gratuidade ou reserva de vagas em transporte público conforme renda, vagas reservadas de estacionamento e acesso ao BPC para idosos a partir de 65 anos em extrema vulnerabilidade. Denúncias podem ser feitas pelo Disque 100.",
        "orientacao_detalhada":"A Lei Federal nº 10.741/2003 tipifica como crimes o abandono, a negligência e a apropriação indevida de bens de pessoas idosas, com penas aumentadas quando cometidos por familiares ou cuidadores. A credencial de estacionamento deve ser solicitada no órgão de trânsito do município.",
        "passos":["Consulte o Estatuto da Pessoa Idosa pelo portal do Ministério dos Direitos Humanos.","Solicite a credencial de estacionamento reservado no órgão de trânsito local.","Para vagas de transporte interestadual gratuito, requeira o benefício diretamente nos guichês das empresas conforme vagas.","Em caso de violência ou violação, denuncie anonimamente pelo Disque 100 ou procure a Delegacia de Proteção ao Idoso."],
        "aviso":"Benefícios tarifários de transporte dependem de renda familiar comprovada e de reserva prévia; confirme as regras junto às empresas operadoras.",
        "referencia_consultada":"Estatuto da Pessoa Idosa (Lei Federal nº 10.741/2003); Ministério dos Direitos Humanos e da Cidadania — gov.br/mdh.",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/mdh/pt-br/assuntos/pessoa-idosa","topicos_relacionados":["COM-04","DIR-03","SRV-01"]
      },
      {
        "identificador":"COM-01","tema":"Orientações Comunitárias e Emergências","subtema":"Apoio Comunitário",
        "titulo":"Centro de Referência de Assistência Social (CRAS)",
        "pergunta_modelo":"O que é o CRAS e quais atendimentos a comunidade pode buscar nele?",
        "palavras_chave":["cras","cesta básica","auxílio vulnerabilidade","assistência social do município","visita domiciliar","família em risco","benefício eventual","apoio comunitário"],
        "orientacao_resumida":"O CRAS é a unidade municipal da assistência social voltada à prevenção de vulnerabilidades. Nele a família faz e atualiza o CadÚnico, solicita benefícios eventuais municipais (como cesta de alimentos ou auxílio-funeral) e participa de grupos de convivência e oficinas comunitárias.",
        "orientacao_detalhada":"Toda família tem direito a atendimento, independente de receber benefícios federais. As equipes compostas por assistentes sociais e psicólogos realizam acolhimento, visitas domiciliares e encaminhamento para a rede pública de saúde, educação e trabalho.",
        "passos":["Encontre a unidade do CRAS que cobre o seu bairro no site da prefeitura ou pelo telefone 156 do município.","Compareça com documentos pessoais de todos os membros da família e comprovante de endereço.","Explique a situação da família no acolhimento para direcionamento ao serviço adequado.","Participe dos acompanhamentos e oficinas oferecidos pela equipe."],
        "aviso":"Os benefícios eventuais dependem da legislação e do orçamento de cada município; os critérios variam conforme a cidade.",
        "referencia_consultada":"Ministério do Desenvolvimento e Assistência Social — gov.br/mds (Serviço de Proteção e Atendimento Integral à Família - PAIF).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/mds/pt-br/acoes-e-programas/assistencia-social/unidades-de-atendimento/centro-de-referencia-de-assistencia-social-cras","topicos_relacionados":["SRV-01","SRV-02","COM-04"]
      },
      {
        "identificador":"COM-02","tema":"Orientações Comunitárias e Emergências","subtema":"Proteção Comunitária e Desastres",
        "titulo":"Defesa Civil e Alertas de Enchentes e Chuvas Fortes",
        "pergunta_modelo":"Como acionar a Defesa Civil e receber alertas gratuitos de tempestades e enchentes?",
        "palavras_chave":["defesa civil","enchente","alagamento","chuva forte","alerta por sms 40199","199","193","deslizamento","área de risco","temporal","vendaval"],
        "orientacao_resumida":"Em situações de inundação, deslizamento ou estrutura em risco, acione a Defesa Civil pelo telefone 199 ou o Corpo de Bombeiros pelo 193. Para receber alertas meteorológicos oficiais gratuitos por SMS no celular, envie uma mensagem de texto com o seu CEP para o número 40199.",
        "orientacao_detalhada":"Os alertas incluem comunicados sobre chuvas intensas, enchentes, vendavais e granizo emitidos pelo Cemaden junto com a Defesa Civil de cada estado. Em caso de orientação de evacuação, saia imediatamente da residência com documentos e medicamentos de uso contínuo.",
        "passos":["Envie um SMS gratuito com os 8 dígitos do seu CEP para o número 40199.","Aguarde mensagem de confirmação do cadastramento do seu município.","Em emergência com risco à vida, ligue 193 (Bombeiros) ou 199 (Defesa Civil).","Não tente atravessar ruas alagadas nem se abrigue sob árvores durante temporais.","Mantenha um plano familiar simples com ponto de encontro e kit de documentos."],
        "aviso":"O serviço de SMS 40199 é gratuito e não exige internet; cadastre os CEPs dos locais onde mora e trabalha.",
        "referencia_consultada":"Secretaria Nacional de Proteção e Defesa Civil — gov.br/defesa-civil; Centro Nacional de Monitoramento e Alertas de Desastres Naturais (Cemaden).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/defesa-civil/pt-br","topicos_relacionados":["COM-01","DIR-02","COM-04"]
      },
      {
        "identificador":"COM-03","tema":"Orientações Comunitárias e Emergências","subtema":"Saúde Comunitária",
        "titulo":"Vacinação — Calendário Nacional e Onde Vacinar",
        "pergunta_modelo":"Como saber quais vacinas devo tomar e onde me vacinar?",
        "palavras_chave":["vacina","vacinação","calendário de vacinas","onde tomar vacina","posto de saúde vacina","vacina infantil","gripe","covid","febre amarela","sarampo","hpv"],
        "orientacao_resumida":"Todas as vacinas do Calendário Nacional são oferecidas gratuitamente nas salas de vacina das Unidades Básicas de Saúde (UBS). Apresente a caderneta de vacinação e um documento de identidade para que a equipe médica complete as doses pendentes de cada faixa etária.",
        "orientacao_detalhada":"O Programa Nacional de Imunizações cobre imunizantes para crianças, adolescentes, adultos, gestantes e idosos. Doses aplicadas passam a ser registradas e podem ser consultadas no app Meu SUS Digital, inclusive com emissão do Certificado Nacional de Vacinação.",
        "passos":["Reúna a caderneta de vacinação física e um documento com foto de cada membro da família.","Consulte as campanhas vigentes no portal do Ministério da Saúde ou na UBS do bairro.","Compareça à sala de vacina da UBS mais próxima para avaliação e aplicação.","Guarde a comprovação e confirme o registro no aplicativo Meu SUS Digital."],
        "aviso":"Campanhas sazonais (como gripe) têm públicos prioritários divulgados no início de cada campanha; confirme o período junto à secretaria municipal de saúde.",
        "referencia_consultada":"Programa Nacional de Imunizações (PNI) — Ministério da Saúde — gov.br/saude (Calendário Nacional de Vacinação).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/saude/pt-br/assuntos/vacina","topicos_relacionados":["DIR-02","DIR-04","COM-02"]
      },
      {
        "identificador":"COM-04","tema":"Orientações Comunitárias e Emergências","subtema":"Direitos Humanos e Emergências Sociais",
        "titulo":"Canais Oficiais de Denúncia e Apoio Cidadão (Disque 100 e Ligue 180)",
        "pergunta_modelo":"Quais números posso ligar para denunciar violações de direitos humanos ou violência contra a mulher?",
        "palavras_chave":["disque 100","ligue 180","180","100","denúncia anônima","violação de direitos humanos","violência doméstica","violência contra a mulher","abuso de crianças","direitos humanos"],
        "orientacao_resumida":"O Disque 100 recebe denúncias gratuitas e sigilosas de violações de direitos humanos (crianças, pessoas idosas, PCDs, pessoas em situação de rua). O Ligue 180 é a Central de Atendimento à Mulher, com acolhimento, orientação e encaminhamento a serviços da rede. Ambos funcionam 24 horas por dia, todos os dias, gratuitamente de qualquer telefone.",
        "orientacao_detalhada":"As denúncias geram protocolo formal e são encaminhadas a conselhos tutelares, delegacias especializadas, defensorias e órgãos do Ministério Público conforme a gravidade. Em perigo imediato com violência em andamento, a recomendação adicional é ligar 190 (Polícia Militar).",
        "passos":["Ligue gratuitamente para o 100 (direitos humanos) ou 180 (violência contra a mulher) de qualquer telefone.","Descreva os fatos com local, horário e informações identificáveis das partes, se souber.","Anote o número de protocolo informado pelo atendente para acompanhamento posterior.","Em emergência com risco iminente à vida, acione simultaneamente o 190."],
        "aviso":"Os canais asseguram anonimato a pedido do denunciante; nunca invente fatos para prejudicar terceiros, pois a denúncia caluniosa é crime.",
        "referencia_consultada":"Ministério dos Direitos Humanos e da Cidadania — gov.br/mdh (Disque 100); Ministério das Mulheres — gov.br/mulheres (Ligue 180).",
        "data_verificacao":"09/11/2026","link_oficial":"https://www.gov.br/mdh/pt-br/ondh/canais-de-atendimento-2023","topicos_relacionados":["DIR-04","DIR-03","COM-01"]
      }
    ]
  };

  // Cenários oficiais de teste (16 cenários)
  const TEST_SCENARIOS = [
    { id: "T01", categoria: "direta", pergunta: "Como tirar a Nova Carteira de Identidade Nacional (CIN)?", esperado: { status: "SUCESSO", id_orientacao: "DOC-01" }, explicacao: "Pergunta canônica da CIN." },
    { id: "T02", categoria: "direta", pergunta: "Meu CPF está com problemas, como regularizar na Receita Federal?", esperado: { status: "SUCESSO", id_orientacao: "DOC-02" }, explicacao: "CPF + regularizar + Receita." },
    { id: "T03", categoria: "direta", pergunta: "Como solicitar o seguro-desemprego e qual é o prazo?", esperado: { status: "SUCESSO", id_orientacao: "SRV-04" }, explicacao: "Seguro-desemprego." },
    { id: "T04", categoria: "direta", pergunta: "Não tenho dinheiro para pagar advogado, como conseguir a Defensoria Pública?", esperado: { status: "SUCESSO", id_orientacao: "DIR-03" }, explicacao: "Defensoria Pública." },
    { id: "T05", categoria: "direta", pergunta: "Como cadastrar para receber alertas de chuva forte da Defesa Civil por SMS 40199?", esperado: { status: "SUCESSO", id_orientacao: "COM-02" }, explicacao: "Defesa Civil 40199." },
    { id: "T06", categoria: "direta", pergunta: "Quais telefones posso ligar para denunciar violência contra a mulher ou violação de direitos humanos?", esperado: { status: "SUCESSO", id_orientacao: "COM-04" }, explicacao: "Disque 100 / Ligue 180." },
    { id: "T07", categoria: "reformulacao", pergunta: "Quero saber como faço um RG novo no meu estado", esperado: { status: "SUCESSO", id_orientacao: "DOC-01" }, explicacao: "Reformulação com 'RG novo'." },
    { id: "T08", categoria: "reformulacao", pergunta: "Perdi minha certidão de casamento e nascimento, onde tiro outra via?", esperado: { status: "SUCESSO", id_orientacao: "DOC-05" }, explicacao: "2ª via de certidões." },
    { id: "T09", categoria: "reformulacao", pergunta: "Como funciona o desconto da conta de luz para famílias de baixa renda?", esperado: { status: "SUCESSO", id_orientacao: "SRV-05" }, explicacao: "Tarifa Social de Energia." },
    { id: "T10", categoria: "reformulacao", pergunta: "Comprei um celular com defeito e a loja não quer trocar, quais são meus direitos?", esperado: { status: "SUCESSO", id_orientacao: "DIR-01" }, explicacao: "Direitos do consumidor / Procon." },
    { id: "T11", categoria: "fora_escopo", pergunta: "Como tirar o visto de turista para os Estados Unidos?", esperado: { status: "SEM_CORRESPONDENCIA", id_orientacao: null }, explicacao: "Tema internacional fora do escopo." },
    { id: "T12", categoria: "fora_escopo", pergunta: "Qual é a melhor corretora para investir em ações na bolsa?", esperado: { status: "SEM_CORRESPONDENCIA", id_orientacao: null }, explicacao: "Finanças privadas fora do escopo." },
    { id: "T13", categoria: "fora_escopo", pergunta: "Receita de bolo de chocolate fofinho com cobertura", esperado: { status: "SEM_CORRESPONDENCIA", id_orientacao: null }, explicacao: "Não associar a 'Receita Federal'." },
    { id: "T14", categoria: "limitacao", pergunta: "", esperado: { status: "ENTRADA_VAZIA", id_orientacao: null }, explicacao: "Entrada vazia." },
    { id: "T15", categoria: "limitacao", pergunta: "social", esperado: { status: "AMBIGUO", id_orientacao: null }, explicacao: "Termo genérico polissêmico." },
    { id: "T16", categoria: "limitacao", pergunta: "serviço fictício de teletransporte municipal xpto", esperado: { status: "SEM_CORRESPONDENCIA", id_orientacao: null }, explicacao: "Serviço fictício." },
  ];

  // ==================================================================
  // MOTOR DE BUSCA (mesmo algoritmo do backend Python)
  // ==================================================================
  function normalizar(texto) {
    if (!texto) return "";
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function tokenizar(texto, removerSW) {
    if (removerSW === undefined) removerSW = true;
    const norm = normalizar(texto);
    const matches = norm.match(/[a-z0-9]+/g);
    if (!matches) return [];
    if (!removerSW) return matches;
    return matches.filter((t) => !STOPWORDS.has(t) && t.length > 1);
  }

  function jaccard(setA, setB) {
    if (!setA.size || !setB.size) return 0;
    let inter = 0;
    setA.forEach((v) => { if (setB.has(v)) inter++; });
    const union = new Set([...setA, ...setB]).size;
    return inter / union;
  }

  class BuscadorJS {
    constructor(base) {
      this.base = base;
      this.scoreMinimo = 5.0;
      this.limiarAmbiguidade = 2.8;
      this.pesoKeyword = 4.0;
      this.pesoTitulo = 3.5;
      this.pesoPerguntaModelo = 2.5;
      this.pesoTexto = 0.6;
      this.bonusFraseExata = 14.0;
      this.bonusJaccard = 8.0;
      this.byId = new Map();
      this.byTema = new Map();
      this.byTemaSubtema = new Map();
      this.inverted = new Map();
      this._index();
    }

    _index() {
      (this.base.orientacoes || []).forEach((r) => {
        const id = r.identificador.toUpperCase();
        this.byId.set(id, r);
        if (!this.byTema.has(r.tema)) this.byTema.set(r.tema, []);
        this.byTema.get(r.tema).push(r);
        const subKey = r.tema + "::" + (r.subtema || "Geral");
        if (!this.byTemaSubtema.has(subKey)) this.byTemaSubtema.set(subKey, []);
        this.byTemaSubtema.get(subKey).push(r);

        const corpus = [r.titulo || "", r.pergunta_modelo || "", r.orientacao_resumida || ""]
          .concat(r.palavras_chave || [])
          .join(" ");
        const tokens = new Set(tokenizar(corpus, true));
        tokens.forEach((t) => {
          if (!this.inverted.has(t)) this.inverted.set(t, new Set());
          this.inverted.get(t).add(id);
        });
      });
    }

    pontuar(tokensConsulta, consultaNorm, reg) {
      let score = 0;
      const tituloNorm = normalizar(reg.titulo || "");
      const perguntaNorm = normalizar(reg.pergunta_modelo || "");
      const kwNorm = (reg.palavras_chave || []).map(normalizar);
      const orientNorm = normalizar(reg.orientacao_resumida || "");

      let exact = false;
      if (consultaNorm) {
        if (
          consultaNorm === tituloNorm ||
          consultaNorm === perguntaNorm ||
          kwNorm.indexOf(consultaNorm) !== -1
        ) {
          score += this.bonusFraseExata;
          exact = true;
        } else {
          for (let i = 0; i < kwNorm.length; i++) {
            const kw = kwNorm[i];
            if (kw.split(/\s+/).length >= 2 && consultaNorm.indexOf(kw) !== -1) {
              score += this.bonusFraseExata;
              exact = true;
              break;
            }
          }
        }
      }

      const tTitulo = new Set(tokenizar(tituloNorm, false));
      const tPergunta = new Set(tokenizar(perguntaNorm, false));
      const tOrient = new Set(tokenizar(orientNorm, false));
      const tKw = new Set();
      kwNorm.forEach((kw) => tokenizar(kw, false).forEach((t) => tKw.add(t)));

      const tConsultaUniq = new Set(tokensConsulta);
      let ctKw = 0, ctTit = 0, ctPerg = 0, ctOri = 0;
      tConsultaUniq.forEach((t) => {
        if (tKw.has(t)) ctKw++;
        if (tTitulo.has(t)) ctTit++;
        if (tPergunta.has(t)) ctPerg++;
        if (tOrient.has(t)) ctOri++;
      });
      score += ctKw * this.pesoKeyword;
      score += ctTit * this.pesoTitulo;
      score += ctPerg * this.pesoPerguntaModelo;
      score += ctOri * this.pesoTexto;
      score += jaccard(tConsultaUniq, tKw) * this.bonusJaccard;

      const allMatched = new Set([...tKw, ...tTitulo, ...tPergunta, ...tOrient]);
      let matchedCount = 0;
      tConsultaUniq.forEach((t) => { if (allMatched.has(t)) matchedCount++; });
      const cov = tConsultaUniq.size ? matchedCount / tConsultaUniq.size : 0;
      if (tConsultaUniq.size >= 3 && cov < 0.35 && !exact) score *= 0.15;
      return Math.round(score * 100) / 100;
    }

    buscar(pergunta) {
      if (!pergunta || !pergunta.trim()) {
        return {
          status: "ENTRADA_VAZIA",
          registro: null,
          candidatos: [],
          mensagem:
            "Nenhuma pergunta foi informada. Escreva o que você precisa saber — por exemplo: 'Como regularizar o CPF?' ou 'Quais são os critérios do Bolsa Família?'.",
        };
      }

      const idPos = pergunta.trim().toUpperCase();
      if (this.byId.has(idPos)) {
        const reg = this.byId.get(idPos);
        return {
          status: "SUCESSO",
          registro: reg,
          candidatos: [{ registro: reg, score: 99 }],
          mensagem: `Orientação '${reg.titulo}' localizada pelo código.`,
        };
      }

      const consultaNorm = normalizar(pergunta);
      let tokensConsulta = tokenizar(pergunta, true);
      if (!tokensConsulta.length) tokensConsulta = tokenizar(pergunta, false);

      const candidatos = [];
      (this.base.orientacoes || []).forEach((reg) => {
        const score = this.pontuar(tokensConsulta, consultaNorm, reg);
        if (score >= this.scoreMinimo) candidatos.push({ registro: reg, score });
      });
      candidatos.sort((a, b) => b.score - a.score);

      if (!candidatos.length) {
        return {
          status: "SEM_CORRESPONDENCIA",
          registro: null,
          candidatos: [],
          mensagem:
            "Não encontrei na base de conhecimento uma orientação confiável para essa pergunta. Este assistente responde apenas sobre temas previamente verificados (documentação básica, serviços públicos e benefícios, direitos e cidadania, orientações comunitárias e emergências).",
        };
      }

      const topo = candidatos[0];
      if (candidatos.length > 1) {
        const segundo = candidatos[1];
        if (topo.score - segundo.score <= this.limiarAmbiguidade && topo.score < 22) {
          return {
            status: "AMBIGUO",
            registro: null,
            candidatos: candidatos.slice(0, 3),
            mensagem:
              "Sua pergunta pode se referir a mais de um assunto cadastrado. Escolha a opção mais adequada:",
          };
        }
      }

      return {
        status: "SUCESSO",
        registro: topo.registro,
        candidatos: candidatos.slice(0, 3),
        mensagem: `Orientação localizada: '${topo.registro.titulo}'.`,
      };
    }

    obterPorId(id) {
      return this.byId.get(id ? id.toUpperCase() : "");
    }
  }

  // ==================================================================
  // RENDERIZAÇÃO DE RESPOSTAS (MODELOS A e B)
  // ==================================================================
  function relatedButtons(relIds) {
    if (!relIds || !relIds.length) return "";
    const items = relIds
      .map((rid, idx) => {
        const r = BUSCADOR.obterPorId(rid);
        if (!r) return "";
        return `<button class="btn-related" type="button" data-open-id="${rid}" aria-label="Abrir orientação ${r.titulo}">
          <strong>[R${idx + 1}]</strong> ${escapeHtml(r.titulo)} <small class="text-dim">(${r.tema})</small>
        </button>`;
      })
      .join("");
    return `<div class="answer-section">
      <h4>${currentModel === "B" ? "Assuntos parecidos que podem ajudar" : "Tópicos relacionados para continuar sua consulta"}</h4>
      <div class="related-list">${items}</div>
    </div>`;
  }

  function stepsList(passos, ordered) {
    if (!passos || !passos.length) return "";
    const lis = passos.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
    return `<div class="answer-section">
      <h4>${currentModel === "B" ? "Como fazer, passo a passo" : "Passo a passo recomendado"}</h4>
      <ol class="steps-list">${lis}</ol>
    </div>`;
  }

  function officialSourceLink(reg) {
    const org = escapeHtml(reg.referencia_consultada || "");
    const date = escapeHtml(reg.data_verificacao || "");
    const url = reg.link_oficial || "https://www.gov.br";
    return `<div class="answer-section">
      <h4>${currentModel === "B" ? "Onde conferir essa informação" : "Fonte oficial consultada"}</h4>
      <div class="source-box">
        <div><strong>Órgão/legislação:</strong> <span class="src-org">${org}</span></div>
        <div class="source-date">Informação conferida pela equipe em <strong>${date}</strong></div>
        <div style="margin-top:.4rem"><a href="${url}" target="_blank" rel="noopener" aria-label="Abrir página oficial (abre em nova janela)">Página oficial no portal do governo ↗</a></div>
      </div>
    </div>`;
  }

  function warningBox(reg) {
    const aviso = escapeHtml(reg.aviso || "Confirme requisitos atualizados no canal oficial do órgão responsável.");
    return `<div class="answer-section">
      <h4>${currentModel === "B" ? "Lembrete importante" : "Aviso de confirmação"}</h4>
      <div class="warning-box">
        <strong>Atenção:</strong> ${aviso} Prazos, taxas e procedimentos podem sofrer alterações após a data de verificação.
        Confirme sempre no canal oficial antes de se deslocar.
      </div>
    </div>`;
  }

  function answerActions(plainTextForCopy, speechText, recordId) {
    return `<div class="answer-actions">
      <button class="btn-act btn-act-accent" type="button" data-speech aria-label="Ler resposta em voz alta"><i class="fa-solid fa-volume-high" aria-hidden="true"></i> Ler em voz alta</button>
      <button class="btn-act" type="button" data-stop-speech aria-label="Parar leitura em voz alta"><i class="fa-solid fa-stop" aria-hidden="true"></i> Parar voz</button>
      <button class="btn-act" type="button" data-copy aria-label="Copiar texto da resposta"><i class="fa-solid fa-copy" aria-hidden="true"></i> Copiar</button>
      <button class="btn-act" type="button" data-print aria-label="Imprimir"><i class="fa-solid fa-print" aria-hidden="true"></i> Imprimir</button>
      <span class="text-dim" style="font-size:.85rem;margin-left:auto;align-self:center">Código: <strong>${recordId}</strong> · Modelo ${currentModel}</span>
    </div>`;
  }

  function renderAnswerModelA(reg) {
    return `
      <div class="answer-meta">
        <span class="tag tag-accent">${escapeHtml(reg.identificador)}</span>
        <span class="tag">${escapeHtml(reg.tema)}</span>
        <span class="tag">${escapeHtml(reg.subtema || "")}</span>
      </div>
      <h3 class="answer-title">${escapeHtml(reg.titulo)}</h3>
      <div class="answer-section">
        <h4>Orientação</h4>
        <p>${escapeHtml(reg.orientacao_resumida)}</p>
      </div>
      ${stepsList(reg.passos)}
      ${officialSourceLink(reg)}
      ${warningBox(reg)}
      ${relatedButtons(reg.topicos_relacionados)}
    `;
  }

  function renderAnswerModelB(reg) {
    return `
      <div class="answer-meta">
        <span class="tag tag-accent">${escapeHtml(reg.identificador)}</span>
        <span class="tag">${escapeHtml(reg.tema)}</span>
        <span class="tag">${escapeHtml(reg.subtema || "")}</span>
      </div>
      <h3 class="answer-title">${escapeHtml(reg.titulo)}</h3>
      <p class="answer-detail"><strong>Olá! Entendi a sua dúvida.</strong> Segue a orientação que encontramos na nossa base verificada:</p>
      <div class="answer-section">
        <h4>O que você precisa saber</h4>
        <p>${escapeHtml(reg.orientacao_resumida)}</p>
      </div>
      ${reg.orientacao_detalhada ? `<p class="answer-detail">${escapeHtml(reg.orientacao_detalhada)}</p>` : ""}
      ${stepsList(reg.passos)}
      <div class="tip-box">
        <strong>Dica prática:</strong> prefira sempre os canais oficiais pela internet ou aplicativo; eles costumam ser mais rápidos e evitam deslocamentos desnecessários.
      </div>
      ${officialSourceLink(reg)}
      ${warningBox(reg)}
      ${relatedButtons(reg.topicos_relacionados)}
    `;
  }

  function buildPlainAnswerText(reg) {
    const parts = [
      reg.identificador + " — " + reg.titulo,
      reg.tema + " | " + (reg.subtema || ""),
      "",
      reg.orientacao_resumida,
      "",
      reg.passos && reg.passos.length ? "Passo a passo:\n" + reg.passos.map((p, i) => i + 1 + ". " + p).join("\n") : "",
      "",
      "Fonte oficial: " + reg.referencia_consultada + " (verificada em " + reg.data_verificacao + ")",
      "Página oficial: " + (reg.link_oficial || "https://gov.br"),
      "Aviso: " + reg.aviso,
    ];
    return parts.filter(Boolean).join("\n");
  }

  function plainTextToSpeech(reg) {
    const steps = reg.passos ? ". Siga estes passos: " + reg.passos.join(". ") : "";
    return `${reg.titulo}. ${reg.orientacao_resumida} ${steps} Fonte oficial: ${reg.referencia_consultada}, conferida em ${reg.data_verificacao}. Atenção: ${reg.aviso}`;
  }

  function renderLimitationCard(mensagem) {
    const temas = (BASE.temas || []).map((t) => `<li><strong>${escapeHtml(t.nome)}</strong> — ${escapeHtml(t.descricao)}</li>`).join("");
    return `
      <div class="answer-card limit-card">
        <div class="answer-meta">
          <span class="tag limit-badge">Aviso do assistente</span>
          <span class="tag">Limitação da base</span>
        </div>
        <h3 class="answer-title" style="color:#ffffff">Não foi possível orientar com segurança</h3>
        <p style="font-size:1.15rem">${escapeHtml(mensagem)}</p>
        <div class="answer-section">
          <h4>Temas que este assistente consegue orientar no momento</h4>
          <ul class="limit-themes-list">${temas}</ul>
        </div>
        <div class="limit-gov">
          <strong>Canais oficiais recomendados:</strong> consulte o portal
          <a href="https://www.gov.br" target="_blank" rel="noopener">gov.br ↗</a>,
          a prefeitura da sua cidade ou a central telefônica municipal <strong>156</strong>.
          Este assistente é apenas informativo e não é canal oficial do governo.
        </div>
        <div class="answer-actions">
          <button class="btn-act" type="button" data-speech aria-label="Ler aviso em voz alta"><i class="fa-solid fa-volume-high" aria-hidden="true"></i> Ler em voz alta</button>
          <button class="btn-act" type="button" data-stop-speech><i class="fa-solid fa-stop" aria-hidden="true"></i> Parar voz</button>
        </div>
      </div>`;
  }

  function pushAnswerCard(reg, originQuery) {
    const card = document.createElement("article");
    card.className = "answer-card";
    card.id = "ans-" + reg.identificador;
    const body = currentModel === "B" ? renderAnswerModelB(reg) : renderAnswerModelA(reg);
    const plain = buildPlainAnswerText(reg);
    const speech = plainTextToSpeech(reg);
    card.innerHTML = body + answerActions(plain, speech, reg.identificador);
    wireCardActions(card, plain, speech);
    const feed = document.getElementById("resultsFeed");
    feed.prepend(card);
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    if (speechEnabled) speakText(speech);
  }

  function pushLimitationCard(mensagem) {
    const feed = document.getElementById("resultsFeed");
    const wrap = document.createElement("div");
    wrap.innerHTML = renderLimitationCard(mensagem);
    const node = wrap.firstElementChild;
    const plain = mensagem + ". Temas atendidos: " + (BASE.temas || []).map((t) => t.nome).join(", ") + ". Canal oficial recomendado: gov ponto br.";
    wireCardActions(node, plain, plain);
    feed.prepend(node);
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    if (speechEnabled) speakText(plain);
  }

  function wireCardActions(card, plain, speech) {
    card.querySelectorAll("[data-open-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = BUSCADOR.obterPorId(btn.getAttribute("data-open-id"));
        if (r) pushAnswerCard(r);
      });
    });
    card.querySelectorAll("[data-speech]").forEach((btn) => {
      btn.addEventListener("click", () => speakText(speech));
    });
    card.querySelectorAll("[data-stop-speech]").forEach((btn) => {
      btn.addEventListener("click", stopSpeech);
    });
    card.querySelectorAll("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigator.clipboard.writeText(plain).then(() => toast("Resposta copiada para a área de transferência."));
      });
    });
    card.querySelectorAll("[data-print]").forEach((btn) => {
      btn.addEventListener("click", () => window.print());
    });
  }

  // ==================================================================
  // FLUXO DE BUSCA
  // ==================================================================
  function runSearch(query) {
    const res = BUSCADOR.buscar(query);
    if (res.status === "SUCESSO" && res.registro) {
      pushAnswerCard(res.registro, query);
    } else if (res.status === "AMBIGUO") {
      openAmbiguityModal(res.candidatos);
    } else if (res.status === "ENTRADA_VAZIA") {
      toast(res.mensagem);
    } else {
      pushLimitationCard(res.mensagem);
    }
  }

  function openAmbiguityModal(candidatos) {
    const list = document.getElementById("ambiguityOptions");
    list.innerHTML = candidatos
      .map(
        (c, i) => `
        <button class="ambiguity-btn" type="button" data-amb-id="${c.registro.identificador}">
          <span><strong>${i + 1}.</strong> ${escapeHtml(c.registro.titulo)}</span>
          <span class="ambiguity-theme">${escapeHtml(c.registro.tema)}</span>
        </button>`
      )
      .join("");
    list.querySelectorAll("[data-amb-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        closeModal("ambiguityModal");
        const r = BUSCADOR.obterPorId(btn.getAttribute("data-amb-id"));
        if (r) pushAnswerCard(r);
      });
    });
    openModal("ambiguityModal");
  }

  // Sugestões enquanto digita
  function buildSuggestions(query) {
    const list = document.getElementById("suggestionsList");
    if (!query || query.trim().length < 2) {
      list.classList.add("hidden");
      list.innerHTML = "";
      return;
    }
    const norm = normalizar(query);
    const queryTokens = tokenizar(query, true);
    const matches = (BASE.orientacoes || [])
      .map((r) => {
        const searchable = normalizar(`${r.titulo || ""} ${(r.palavras_chave || []).join(" ")} ${r.pergunta_modelo || ""}`);
        const exact = searchable.indexOf(norm) !== -1 ? 20 : 0;
        const tokenHits = queryTokens.filter((token) => searchable.indexOf(token) !== -1).length;
        return { record: r, score: exact + tokenHits };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.record)
      .slice(0, 5);
    if (!matches.length) {
      list.classList.add("hidden");
      return;
    }
    list.innerHTML = matches
      .map(
        (r) => `<li class="suggestion-item" role="option" data-sugg="${escapeHtml(r.pergunta_modelo || r.titulo)}">
          <span>${escapeHtml(r.titulo)}</span>
          <span class="suggestion-theme">${escapeHtml(r.tema)}</span>
        </li>`
      )
      .join("");
    list.classList.remove("hidden");
    list.querySelectorAll(".suggestion-item").forEach((it) => {
      it.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const text = it.getAttribute("data-sugg");
        document.getElementById("queryInput").value = text;
        list.classList.add("hidden");
        runSearch(text);
      });
    });
  }

  // ==================================================================
  // PAINEL DE TEMAS
  // ==================================================================
  function renderThemes() {
    const container = document.getElementById("themesList");
    container.innerHTML = (BASE.temas || [])
      .map((t) => {
        const regs = BUSCADOR.byTema.get(t.nome) || [];
        const subChips = (t.subtemas || []).map((s) => `<span class="subtheme-chip">${escapeHtml(s)}</span>`).join("");
        const oriList = regs
          .map(
            (r) => `<li><a href="#ans-${r.identificador}" data-open-theme-id="${r.identificador}">${escapeHtml(r.titulo)}</a></li>`
          )
          .join("");
        return `
          <div class="theme-card" id="theme-card-${slug(t.nome)}">
            <div>
              <div class="theme-card-head">
                <h3>${escapeHtml(t.nome)}</h3>
                <span class="theme-card-count">${regs.length} orientações</span>
              </div>
              <p>${escapeHtml(t.descricao)}</p>
              <div class="subtheme-chip-list">${subChips}</div>
              <ul class="theme-orientations">${oriList}</ul>
            </div>
            <button class="btn-primary" type="button" data-theme-query="${escapeHtml(t.nome)}" style="border-radius:var(--radius-sm)">
              Ver tudo deste tema
            </button>
          </div>`;
      })
      .join("");
    container.querySelectorAll("[data-open-theme-id]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const r = BUSCADOR.obterPorId(a.getAttribute("data-open-theme-id"));
        if (r) {
          switchTab("tab-answer");
          pushAnswerCard(r);
        }
      });
    });
    container.querySelectorAll("[data-theme-query]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tema = btn.getAttribute("data-theme-query");
        switchTab("tab-answer");
        runSearch(tema);
      });
    });
  }

  // ==================================================================
  // PAINEL DO GRAFO
  // ==================================================================
  function renderGraph(themeFilter) {
    const sel = document.getElementById("graphThemeFilter");
    if (!sel.options.length) {
      sel.innerHTML = `<option value="__all__">Todos os temas (18 orientações · 54 relações)</option>` +
        (BASE.temas || []).map((t) => `<option value="${escapeHtml(t.nome)}">${escapeHtml(t.nome)}</option>`).join("");
    }
    const filter = themeFilter === undefined ? sel.value : themeFilter;
    const container = document.getElementById("graphContainer");
    const regs = (BASE.orientacoes || []).filter((r) => filter === "__all__" || !filter ? true : r.tema === filter);
    container.innerHTML = regs
      .map((r) => {
        const edgeChips = (r.topicos_relacionados || [])
          .map((eid) => {
            const edge = BUSCADOR.obterPorId(eid);
            return `<button class="node-edge-chip" type="button" data-focus-node="node-${eid}">→ ${edge ? escapeHtml(edge.titulo) : eid}</button>`;
          })
          .join("");
        return `
          <div class="graph-node" id="node-${r.identificador}">
            <div class="graph-node-head">
              <h3>${escapeHtml(r.titulo)}</h3>
              <span class="node-id">${escapeHtml(r.identificador)}</span>
            </div>
            <div class="node-theme">${escapeHtml(r.tema)} · ${escapeHtml(r.subtema || "")}</div>
            <p class="node-summary">${escapeHtml(r.orientacao_resumida)}</p>
            <div class="node-edges-title">Relações de continuidade (${(r.topicos_relacionados || []).length})</div>
            <div class="node-edge-chips">${edgeChips}</div>
            <button class="btn-primary node-btn-open" type="button" data-graph-open="${r.identificador}" style="border-radius:var(--radius-sm)">
              Ler orientação completa
            </button>
          </div>`;
      })
      .join("");
    container.querySelectorAll("[data-focus-node]").forEach((b) => {
      b.addEventListener("click", () => {
        const target = document.getElementById(b.getAttribute("data-focus-node"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("is-active");
          setTimeout(() => target.classList.remove("is-active"), 2200);
        }
      });
    });
    container.querySelectorAll("[data-graph-open]").forEach((b) => {
      b.addEventListener("click", () => {
        const r = BUSCADOR.obterPorId(b.getAttribute("data-graph-open"));
        if (r) {
          switchTab("tab-answer");
          pushAnswerCard(r);
        }
      });
    });
    const totalEdges = regs.reduce((acc, r) => acc + (r.topicos_relacionados || []).length, 0);
    document.getElementById("graphStats").textContent = `${regs.length} nós exibidos · ${totalEdges} relações dirigidas`;
  }

  // ==================================================================
  // PAINEL DE TESTES / EXECUTOR AO VIVO
  // ==================================================================
  function renderStaticTestDashboard() {
    renderCategoryTable(officialCategoryMetrics());
    renderSusBars();
  }

  function officialCategoryMetrics() {
    return [
      { cat: "direta", total: 6, acertos: 6, taxa: 100, tempo: 1.41 },
      { cat: "reformulacao", total: 4, acertos: 4, taxa: 100, tempo: 1.29 },
      { cat: "fora_escopo", total: 3, acertos: 3, taxa: 100, tempo: 1.24 },
      { cat: "limitacao", total: 3, acertos: 3, taxa: 100, tempo: 0.89 },
    ];
  }

  function renderCategoryTable(data) {
    const tbody = document.getElementById("categoryTableBody");
    tbody.innerHTML = data
      .map(
        (c) => `<tr>
          <td><strong>${escapeHtml(c.cat)}</strong></td>
          <td>${c.total}</td>
          <td>${c.acertos}</td>
          <td><strong>${c.taxa.toFixed(1)}%</strong></td>
          <td>${c.tempo.toFixed(2)} ms</td>
        </tr>`
      )
      .join("");
  }

  function renderSusBars() {
    const items = [
      { label: "Escore obtido", value: 87.5, max: 100 },
      { label: "Média de mercado", value: 68, max: 100 },
      { label: "Meta excelente", value: 80, max: 100 },
    ];
    document.getElementById("susBars").innerHTML = items
      .map(
        (it) => `
        <div class="sus-bar-row">
          <span>${it.label}</span>
          <div class="sus-bar-track"><div class="sus-bar-fill" style="width:${(it.value / it.max) * 100}%"></div></div>
          <strong>${it.value}</strong>
        </div>`
      )
      .join("");
  }

  async function runLiveTests() {
    const btn = document.getElementById("btnRunTests");
    btn.disabled = true;
    const progress = document.getElementById("testProgress");
    const fill = document.getElementById("progressBarFill");
    const label = document.getElementById("progressLabel");
    const box = document.getElementById("testResultsBox");
    progress.classList.remove("hidden");
    box.classList.remove("hidden");
    box.innerHTML = "";

    const results = [];
    const t0 = performance.now();
    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      const scen = TEST_SCENARIOS[i];
      const start = performance.now();
      const res = BUSCADOR.buscar(scen.pergunta);
      const ms = performance.now() - start;
      const status = res.status;
      const id = res.registro ? res.registro.identificador : null;
      let ok = false;
      if (scen.esperado.status === "SUCESSO") ok = status === "SUCESSO" && id === scen.esperado.id_orientacao;
      else if (scen.esperado.status === "SEM_CORRESPONDENCIA") ok = status === "SEM_CORRESPONDENCIA";
      else if (scen.esperado.status === "AMBIGUO") ok = status === "AMBIGUO";
      else if (scen.esperado.status === "ENTRADA_VAZIA") ok = status === "ENTRADA_VAZIA";
      results.push({ ...scen, status, id, ms, ok });
      fill.style.width = ((i + 1) / TEST_SCENARIOS.length) * 100 + "%";
      label.textContent = `Executando cenário ${i + 1} de ${TEST_SCENARIOS.length}: ${scen.id}…`;
      await sleep(25);
    }
    const elapsedTotal = performance.now() - t0;
    const acertos = results.filter((r) => r.ok).length;
    const taxa = ((acertos / results.length) * 100).toFixed(1);
    const avg = (results.reduce((a, r) => a + r.ms, 0) / results.length).toFixed(2);
    document.getElementById("kpiAccuracy").textContent = taxa + "%";
    document.getElementById("kpiLatency").textContent = avg + " ms";
    label.textContent = `Concluído: ${acertos}/${results.length} acertos (${taxa}%) · tempo médio por consulta: ${avg} ms.`;

    const cats = {};
    results.forEach((r) => {
      if (!cats[r.categoria]) cats[r.categoria] = { total: 0, acertos: 0, ms: 0 };
      cats[r.categoria].total++;
      if (r.ok) cats[r.categoria].acertos++;
      cats[r.categoria].ms += r.ms;
    });
    renderCategoryTable(
      Object.keys(cats).map((k) => ({
        cat: k,
        total: cats[k].total,
        acertos: cats[k].acertos,
        taxa: (cats[k].acertos / cats[k].total) * 100,
        tempo: cats[k].ms / cats[k].total,
      }))
    );

    box.innerHTML = `
      <div class="live-summary">
        <div>Total: <strong>${results.length}</strong></div>
        <div>Acertos: <strong>${acertos}</strong></div>
        <div>Taxa: <strong>${taxa}%</strong></div>
        <div>Tempo médio: <strong>${avg} ms</strong></div>
      </div>
      <ul class="live-rows">
        ${results
          .map(
            (r) => `
          <li class="live-row">
            <span><strong>${r.id}</strong></span>
            <span class="badge-cat">${r.categoria}</span>
            <span>${escapeHtml(r.pergunta || "[entrada vazia]")}</span>
            <span class="${r.ok ? "badge-ok" : "badge-fail"}">${r.ok ? "ACERTO" : "ERRO"}</span>
            <span style="font-size:.85rem;color:var(--text-dim)">${r.ms.toFixed(1)} ms</span>
          </li>`
          )
          .join("")}
      </ul>`;
    btn.disabled = false;
  }

  // ==================================================================
  // VOZ: SÍNTESE E RECONHECIMENTO
  // ==================================================================
  function speakText(text) {
    if (!speechEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "pt-BR";
    utt.rate = 1.0;
    utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
  }

  function stopSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function initSpeechRecognition() {
    const btn = document.getElementById("btnMic");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      btn.setAttribute("aria-disabled", "true");
      btn.title = "Seu navegador não oferece entrada por voz. Você pode escrever sua pergunta.";
      btn.addEventListener("click", () => toast("A entrada por voz não está disponível neste navegador. Escreva sua dúvida na caixa ao lado."));
      return;
    }
    const setMicIdle = () => {
      btn.innerHTML = '<i class="fa-solid fa-microphone" aria-hidden="true"></i> Falar';
    };
    recognition = new SR();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;
    let listening = false;
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      document.getElementById("queryInput").value = text;
      runSearch(text);
    };
    recognition.onend = () => {
      listening = false;
      btn.classList.remove("listening");
      setMicIdle();
    };
    recognition.onerror = () => {
      listening = false;
      btn.classList.remove("listening");
      setMicIdle();
      toast("Não foi possível captar a voz. Tente escrever sua dúvida.");
    };
    btn.addEventListener("click", () => {
      if (listening) {
        recognition.stop();
        return;
      }
      stopSpeech();
      listening = true;
      btn.classList.add("listening");
      btn.innerHTML = '<i class="fa-solid fa-stop" aria-hidden="true"></i> Ouvindo…';
      recognition.start();
    });
  }

  // ==================================================================
  // UI: ABAS, MODAIS, TOAST, TEXT SIZE
  // ==================================================================
  function switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach((b) => {
      const active = b.id === tabId;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".tab-panel").forEach((p) => {
      const active = p.getAttribute("aria-labelledby") === tabId;
      p.classList.toggle("active", active);
      p.hidden = !active;
    });
    if (tabId === "tab-graph") renderGraph();
  }

  function openModal(id) {
    const m = document.getElementById(id);
    m.classList.remove("hidden");
    m.setAttribute("aria-hidden", "false");
    const firstBtn = m.querySelector("button");
    if (firstBtn) firstBtn.focus();
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    m.classList.add("hidden");
    m.setAttribute("aria-hidden", "true");
  }

  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), 5200);
  }

  function applyTextSize(size) {
    document.body.setAttribute("data-text-size", size);
    const rootSizes = { sm: "16px", md: "19px", lg: "22px" };
    document.documentElement.style.fontSize = rootSizes[size] || rootSizes.md;
    localStorage.setItem("ca_text_size", size);
    document.querySelectorAll(".a11y-toolbar .btn-a11y").forEach((b) => b.classList.remove("active"));
    const map = { sm: "btnFontSmaller", md: "btnFontNormal", lg: "btnFontBigger" };
    const btn = document.getElementById(map[size]);
    if (btn) btn.classList.add("active");
  }

  function setModel(model) {
    currentModel = model;
    document.getElementById("modelExplain").textContent = MODEL_META[model].explain;
    localStorage.setItem("ca_model", model);
    refreshAnswerCards();
  }

  function refreshAnswerCards() {
    document.querySelectorAll(".answer-card[id^='ans-']").forEach((card) => {
      const reg = BUSCADOR && BUSCADOR.obterPorId(card.id.slice(4));
      if (!reg) return;
      const plain = buildPlainAnswerText(reg);
      const speech = plainTextToSpeech(reg);
      card.innerHTML = (currentModel === "B" ? renderAnswerModelB(reg) : renderAnswerModelA(reg)) + answerActions(plain, speech, reg.identificador);
      wireCardActions(card, plain, speech);
    });
  }

  // ==================================================================
  // INICIALIZAÇÃO
  // ==================================================================
  async function loadBase() {
    const paths = ["../data/base_conhecimento.json", "data/base_conhecimento.json"];
    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && data.orientacoes) return data;
      } catch (_) {
        // Tenta o próximo caminho; a interface ainda possui fallback offline embutido.
      }
    }
    return BASE_EMBEDDED;
  }

  async function init() {
    BASE = await loadBase();
    BUSCADOR = new BuscadorJS(BASE);

    // Carrega tamanho de texto e alto contraste salvos
    applyTextSize(localStorage.getItem("ca_text_size") || "md");
    if (localStorage.getItem("ca_contrast") === "high") {
      document.body.classList.add("high-contrast");
      document.getElementById("btnHighContrast").setAttribute("aria-pressed", "true");
    }

    // Modelo de resposta inicial
    const savedModel = localStorage.getItem("ca_model") || "B";
    const radio = document.querySelector(`input[name="responseModel"][value="${savedModel}"]`);
    if (radio) radio.checked = true;
    setModel(savedModel);

    // Render dos painéis
    renderThemes();
    renderStaticTestDashboard();
    initSpeechRecognition();

    // Eventos: busca
    const form = document.getElementById("searchForm");
    const input = document.getElementById("queryInput");
    const clear = document.getElementById("btnClear");
    input.addEventListener("input", () => {
      clear.classList.toggle("hidden", !input.value);
      buildSuggestions(input.value);
    });
    clear.addEventListener("click", () => {
      input.value = "";
      clear.classList.add("hidden");
      document.getElementById("suggestionsList").classList.add("hidden");
      input.focus();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      document.getElementById("suggestionsList").classList.add("hidden");
      switchTab("tab-answer");
      runSearch(input.value);
    });

    // Chips
    document.querySelectorAll(".chip").forEach((c) => {
      c.addEventListener("click", () => {
        input.value = c.textContent.trim();
        clear.classList.remove("hidden");
        switchTab("tab-answer");
        runSearch(input.value);
      });
    });

    // Abas
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.addEventListener("click", () => switchTab(b.id));
    });

    // Modelo
    document.querySelectorAll('input[name="responseModel"]').forEach((r) => {
      r.addEventListener("change", () => setModel(r.value));
    });

    // Acessibilidade: tamanho
    document.getElementById("btnFontSmaller").addEventListener("click", () => applyTextSize("sm"));
    document.getElementById("btnFontNormal").addEventListener("click", () => applyTextSize("md"));
    document.getElementById("btnFontBigger").addEventListener("click", () => applyTextSize("lg"));

    // Alto contraste
    const hc = document.getElementById("btnHighContrast");
    hc.addEventListener("click", () => {
      const on = document.body.classList.toggle("high-contrast");
      hc.setAttribute("aria-pressed", on ? "true" : "false");
      localStorage.setItem("ca_contrast", on ? "high" : "normal");
    });

    // Voz toggle
    const st = document.getElementById("btnSpeechToggle");
    st.addEventListener("click", () => {
      speechEnabled = !speechEnabled;
      st.setAttribute("aria-pressed", speechEnabled ? "true" : "false");
      document.getElementById("speechStateLabel").textContent = speechEnabled ? "ligada" : "desligada";
      if (!speechEnabled) stopSpeech();
    });

    // Ajuda
    const btnHelp = document.getElementById("btnHelp");
    btnHelp.addEventListener("click", () => {
      btnHelp.setAttribute("aria-expanded", "true");
      openModal("helpModal");
    });
    document.getElementById("btnCloseHelp").addEventListener("click", () => {
      btnHelp.setAttribute("aria-expanded", "false");
      closeModal("helpModal");
    });
    document.getElementById("btnHelpGotIt").addEventListener("click", () => {
      btnHelp.setAttribute("aria-expanded", "false");
      closeModal("helpModal");
    });
    document.getElementById("btnFooterHelp").addEventListener("click", () => {
      btnHelp.setAttribute("aria-expanded", "true");
      openModal("helpModal");
    });

    // Ambiguidade fechar
    document.getElementById("btnCloseAmbiguity").addEventListener("click", () => closeModal("ambiguityModal"));

    // ESC fecha modais
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal("helpModal");
        closeModal("ambiguityModal");
        document.getElementById("suggestionsList").classList.add("hidden");
      }
    });

    // Filtro do grafo
    document.getElementById("graphThemeFilter").addEventListener("change", (e) => renderGraph(e.target.value));

    // Botão de testes
    document.getElementById("btnRunTests").addEventListener("click", runLiveTests);

    // Limpar feed
    document.getElementById("btnClearFeed").addEventListener("click", () => {
      document.getElementById("resultsFeed").innerHTML = "";
      stopSpeech();
    });

    // Mensagem inicial de boas-vindas
    const welcome = document.createElement("div");
    welcome.className = "info-card";
    welcome.innerHTML = `<strong>Pronto para ajudar!</strong> Escreva sua dúvida na caixa acima ou toque em uma das
      perguntas prontas. Suas respostas aparecerão aqui, sempre com o passo a passo e a <em>fonte oficial com data</em>.`;
    document.getElementById("resultsFeed").appendChild(welcome);
  }

  // ==================================================================
  // UTILITÁRIOS
  // ==================================================================
  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slug(s) {
    return normalizar(s).replace(/[^a-z0-9]+/g, "-");
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
