# Citizen Assist AI — Registro de Uso de Inteligência Artificial e Validação Crítica

**Global Solution FIAP 2026.2 — Tema: CitizenTech**
**Arquivo obrigatório do edital:** `docs/uso_ia.md`
**Data:** 09/11/2026

---

## 1. Declaração Transparente de Uso de IA

Em conformidade com as orientações do edital (*"Ferramentas de IA podem apoiar a elaboração e a comparação de prompts, a revisão de textos e o planejamento de testes... registrar no arquivo docs/uso_ia.md o uso de IA e a validação crítica realizada"*), declaramos que **ferramentas de inteligência artificial baseadas em grandes modelos de linguagem (LLMs) foram utilizadas como instrumentos de apoio** nas seguintes atividades do projeto:

| Atividade com apoio de IA | Descrição |
|---|---|
| **Apoio 1 — Elaboração de modelos de prompt** | Formulação e refinamento das instruções estruturadas dos **Modelos A e B** em `src/modelos_resposta.py`, definindo papel/persona, restrições obrigatórias (citação de fonte e avisos) e templates de saída. |
| **Apoio 2 — Revisão de linguagem cidadã** | Revisão dos textos das orientações e do Modelo B contra princípios de **Linguagem Cidadã** (frases curtas, vocabulário simples, eliminação de jargões burocráticos). |
| **Apoio 3 — Planejamento de cenários de teste** | Apoio na concepção de **reformulação de perguntas** e **casos de limitação** (ambiguidade, fora de escopo) incorporados a `tests/cenarios_teste.json`. |
| **Apoio 4 — Apoio à escrita da documentação** | Revisão gramatical e padronização editorial dos relatórios em `docs/` e do `README.md`. |

**O protótipo em si NÃO utiliza modelos de IA externos em tempo de execução.** A decisão é pedagógica e cumpre o edital (*"Não é obrigatório utilizar APIs pagas, serviços externos, LangChain, n8n ou treinar um modelo de inteligência artificial"*): o assistente foi construído com estruturas de dados e algoritmos de busca clássicos (índice invertido, scoring ponderado, Jaccard, grafo de tópicos) e **modelos de instrução/resposta estruturados ("modelos de prompt")**, permitindo que a equipe compreenda, controle e justifique cada linha do comportamento da solução.

## 2. Processo de Validação Crítica Humana

Todas as informações geradas ou sugeridas com apoio de IA foram **confrontadas contra fontes oficiais antes da incorporação definitiva à base de conhecimento**, seguindo o protocolo:

1. **Checagem de fonte:** toda afirmação sobre serviço ou direito foi verificada diretamente no portal oficial do órgão (gov.br, tse.jus.br, meu.inss.gov.br, consumidor.gov.br, aneel.gov.br, dpu.def.br, cnj.jus.br) ou no texto legal publicado no Diário Oficial/Portal da Legislação;
2. **Checagem de datas e prazos:** prazos e regras administrativas (ex.: 120 dias do seguro-desemprego, atualização bienal do CadÚnico) foram conferidos nas páginas oficiais em **09/11/2026**;
3. **Checagem de avisos obrigatórios:** toda orientação foi acompanhada de aviso explícito de que requisitos e taxas devem ser confirmados com o órgão responsável;
4. **Checagem dos modelos de resposta:** os dois modelos foram inspecionados para garantir 100% de conformidade com a estrutura declarada (título, resumo, passos, fonte+data, aviso e tópicos relacionados);
5. **Checagem dos testes:** os resultados dos testes automatizados foram inspecionados linha a linha em `reports/resultados_testes.json`.

## 3. Correções Relevantes Realizadas após Validação Crítica

A validação crítica identificou e corrigiu imprecisões nas versões preliminares dos textos:

1. **Atualização terminológica do INSS:** a redação inicial usava "auxílio-doença"; o texto final adotou a denominação oficial atual, **"auxílio por incapacidade temporária"**, mantendo a expressão antiga apenas como palavra-chave para que os cidadãos continuem encontrando a orientação;
2. **Gratuidade da CIN:** confirmada a redação do art. 2º da Lei Federal nº 14.534/2023, que assegura a gratuidade da primeira via da Carteira de Identidade Nacional em todo o território nacional;
3. **Número oficial da Defesa Civil por SMS:** conferido o número correto **40199** e a gratuitade do serviço junto à Secretaria Nacional de Proteção e Defesa Civil;
4. **Detecção de falso positivo no algoritmo de busca:** a pergunta *"Receita de bolo de chocolate..."* chegava inicialmente ao registro do CPF (DOC-02) por conter a palavra "receita"; a equipe ajustou o algoritmo implementando a checagem de **cobertura da consulta** (percentual de termos da pergunta encontrados no registro), eliminando o falso positivo sem degradar nenhuma pergunta legítima;
5. **Detecção de ambiguidade:** o termo genérico *"social"* passava direto para a Tarifa Social (SRV-05); após calibração do limiar de ambiguidade e do bônus de frase exata, passou a ser corretamente classificado como AMBÍGUO, listando os três registros candidatos para escolha do usuário.

## 4. Modelos de Prompt Construídos e Documentados

### 4.1 Modelo A — Objetivo-Institucional

```
INSTRUÇÃO DO MODELO A (src/modelos_resposta.py):
Você é um assistente institucional de referência rápida.
Dado um registro da base verificado:
1. Exiba título com identificador, tema e subtema;
2. Apresente orientação resumida, direta e impessoal;
3. Apresente passos recomendados numerados (1..n);
4. Cite OBRIGATORIAMENTE a fonte consultada com data de verificação;
5. Inclua aviso OBRIGATÓRIO para que o cidadão confirme prazos e taxas
   atualizados no canal oficial do órgão responsável;
6. Indique até três tópicos relacionados com rótulos [R1]..[R3].
Regra inegociável: nunca invente orientações fora da base e nunca alegue
ser canal oficial do governo.
```

### 4.2 Modelo B — Empático-Educativo (Linguagem Cidadã)

```
INSTRUÇÃO DO MODELO B (src/modelos_resposta.py):
Você é um orientador comunitário acolhedor focado em inclusão e clareza.
Dado um registro da base verificado:
1. Abra com saudação acolhedora e título didático;
2. "O que você precisa saber": explicação simples em linguagem cidadã
   (frases curtas, sem jargões);
3. "Como fazer, passo a passo": lista guiada e numerada;
4. "Dica prática": recomendação cotidiana de economia de tempo/custo;
5. "Onde conferir": fonte oficial completa + data de verificação;
6. "Lembrete importante": aviso acolhedor para confirmação de requisitos;
7. "Assuntos parecidos": até três tópicos relacionados com rótulos [R1]..[R3].
Regra inegociável: nunca invente orientações fora da base e nunca alegue
ser canal oficial do governo.
```

A comparação formal desses dois modelos, com pontuação critério a critério e justificativa de escolha, está disponível em `docs/comparativo_modelos.md`.

## 5. Limites Éticos Adotados pela Equipe

- Nenhuma decisão final sobre direitos de cidadãos é tomada pelo protótipo; todas as orientações apontam para **canais oficiais de decisão** (INSS, CadÚnico/CRAS, Procon, Defensoria Pública, Defesa Civil, Disque 100/180);
- A equipe é responsável pela integridade dos dados e pela checagem de fontes; ferramentas de IA não são tratadas como fontes de verdade factual;
- Em perguntas fora do escopo coberto pela base, o assistente **declara o limite** em vez de produzir respostas especulativas.
