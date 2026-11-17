# Citizen Assist AI — Relatório de Testes e Indicadores de Desempenho

**Global Solution FIAP 2026.2 — Tema: CitizenTech**
**Data de execução:** 09/11/2026
**Responsável:** Equipe CitizenTech
**Arquivo de dados brutos:** `reports/resultados_testes.json`

---

## 1. Contexto e Objetivos da Avaliação

O assistente foi avaliado a partir de uma **bateria automatizada de 16 cenários de teste**, cobrindo o mínimo exigido pelo edital (12 perguntas de teste com dúvidas diretas, reformulações e fora do escopo, mais 3 situações de limitação). O objetivo foi mensurar objetivamente:

1. **Taxa de acerto das respostas** (precisão da recuperação por identificador esperado);
2. **Tempo médio de consulta** (latência do algoritmo de busca);
3. **Comportamento frente a limitações** (entradas vazias, termos ambíguos e ausência de informação confiável);
4. **Conformidade dos dois modelos de resposta** (citação de fonte, avisos e completude).

## 2. Indicadores Gerais

| Indicador | Valor Obtido | Meta Mínima do Edital | Situação |
|---|:---:|:---:|:---:|
| Total de cenários executados | **16** | >= 15 (12 perguntas + 3 limitações) | **Atendido** |
| Acertos / Erros | **16 / 0** | — | — |
| **Taxa de acerto global** | **100,0%** | >= 80% (exemplo do edital: 83,3%) | **Superado** |
| **Tempo médio de consulta** | **1,25 ms** | Mensuração documentada | **Atendido** |
| Tempo mediano | **1,28 ms** | — | — |
| Tempo mínimo / máximo | **0,001 ms / 1,68 ms** | — | — |

> **Nota:** o cenário de entrada vazia responde em 0,001 ms pois é interceptado antes da etapa de busca; o desvio não contamina a mediana (1,28 ms), que representa fielmente consultas textuais.

## 3. Indicadores por Categoria

| Categoria | Cenários | Acertos | Taxa de Acerto | Tempo Médio |
|---|:---:|:---:|:---:|:---:|
| **direta** (perguntas canônicas alinhadas às palavras-chave) | 6 | 6 | **100,0%** | 1,41 ms |
| **reformulacao** (perguntas em linguagem coloquial/sinônimos) | 4 | 4 | **100,0%** | 1,29 ms |
| **fora_escopo** (consultas sem relação com os temas cadastrados) | 3 | 3 | **100,0%** | 1,24 ms |
| **limitacao** (entrada vazia, termo ambíguo, serviço fictício) | 3 | 3 | **100,0%** | 0,89 ms |

## 4. Tabela Detalhada de Resultados

| ID | Categoria | Pergunta de Teste | Status Esperado | Status Obtido | ID Esperado | ID Obtido | Resultado | Tempo (ms) |
|:---:|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| T01 | direta | *Como tirar a Nova Carteira de Identidade Nacional (CIN)?* | SUCESSO | SUCESSO | DOC-01 | DOC-01 | **ACERTO** | 1,4 |
| T02 | direta | *Meu CPF está com problemas, como regularizar na Receita Federal?* | SUCESSO | SUCESSO | DOC-02 | DOC-02 | **ACERTO** | 1,3 |
| T03 | direta | *Como solicitar o seguro-desemprego e qual é o prazo?* | SUCESSO | SUCESSO | SRV-04 | SRV-04 | **ACERTO** | 1,4 |
| T04 | direta | *Não tenho dinheiro para pagar advogado, como conseguir a Defensoria Pública?* | SUCESSO | SUCESSO | DIR-03 | DIR-03 | **ACERTO** | 1,3 |
| T05 | direta | *Como cadastrar para receber alertas de chuva forte da Defesa Civil por SMS 40199?* | SUCESSO | SUCESSO | COM-02 | COM-02 | **ACERTO** | 1,3 |
| T06 | direta | *Quais telefones posso ligar para denunciar violência contra a mulher ou violação de direitos humanos?* | SUCESSO | SUCESSO | COM-04 | COM-04 | **ACERTO** | 1,3 |
| T07 | reformulacao | *Quero saber como faço um RG novo no meu estado* | SUCESSO | SUCESSO | DOC-01 | DOC-01 | **ACERTO** | 1,3 |
| T08 | reformulacao | *Perdi minha certidão de casamento e nascimento, onde tiro outra via?* | SUCESSO | SUCESSO | DOC-05 | DOC-05 | **ACERTO** | 1,3 |
| T09 | reformulacao | *Como funciona o desconto da conta de luz para famílias de baixa renda?* | SUCESSO | SUCESSO | SRV-05 | SRV-05 | **ACERTO** | 1,3 |
| T10 | reformulacao | *Comprei um celular com defeito e a loja não quer trocar, quais são meus direitos?* | SUCESSO | SUCESSO | DIR-01 | DIR-01 | **ACERTO** | 1,3 |
| T11 | fora_escopo | *Como tirar o visto de turista para os Estados Unidos?* | SEM_CORRESPONDENCIA | SEM_CORRESPONDENCIA | — | — | **ACERTO** | 1,3 |
| T12 | fora_escopo | *Qual é a melhor corretora para investir em ações na bolsa?* | SEM_CORRESPONDENCIA | SEM_CORRESPONDENCIA | — | — | **ACERTO** | 1,2 |
| T13 | fora_escopo | *Receita de bolo de chocolate fofinho com cobertura* | SEM_CORRESPONDENCIA | SEM_CORRESPONDENCIA | — | — | **ACERTO** | 1,3 |
| T14 | limitacao | *(entrada vazia)* | ENTRADA_VAZIA | ENTRADA_VAZIA | — | — | **ACERTO** | 0,001 |
| T15 | limitacao | *social* (termo genérico polissêmico) | AMBIGUO | AMBIGUO | — | — | **ACERTO** | 1,2 |
| T16 | limitacao | *serviço fictício de teletransporte municipal xpto* | SEM_CORRESPONDENCIA | SEM_CORRESPONDENCIA | — | — | **ACERTO** | 1,3 |

## 5. Interpretação dos Indicadores

1. **Alta precisão em consultas diretas (100%):** o índice invertido ponderado (palavras-chave 4,0; título 3,5; pergunta canônica 2,5; orientação 0,6) somado ao bônus de correspondência exata de frase assegurou identificação sem desvio para as perguntas canônicas;
2. **Robustez a reformulações cotidianas (100%):** expressões como *"RG novo"* e *"desconto da conta de luz"* foram resolvidas graças à cobertura das listas de palavras-chave construídas a partir de expressões reais usadas pelos cidadãos;
3. **Ausência de falsas respostas positivas (precisão de limitação 100%):** o mecanismo de **cobertura da consulta** (perguntas longas em que menos de 35% dos termos coincidem têm o score reduzido drasticamente) impediu que perguntas como *"Receita de bolo..."* fossem falsamente associadas à Receita Federal (DOC-02) — um erro real observado e corrigido durante a calibração do algoritmo;
4. **Detecção correta de ambiguidade:** o termo hiper-genérico *"social"* acionou a lista de candidatos (Tarifa Social, CRAS, CadÚnico) para escolha do usuário, sem impor uma resposta chutada;
5. **Latência negligenciável:** ~1,25 ms de média, plenamente compatível com uma experiência interativa fluida no terminal (o tempo de resposta percebido pelo usuário é dominado pela velocidade de leitura, não pelo processamento).

## 6. Melhorias Possíveis (Roadmap Técnico)

| # | Melhoria | Descrição | Esforço | Impacto |
|---|---|---|:---:|:---:|
| **M1** | TF-IDF e embeddings semânticos | Evoluir do scoring heurístico atual para pesos TF-IDF com n-gramas e, em etapa seguinte, embeddings de frases (mesmo modelos locais e leves), melhorando reformulações com vocabulário distante das palavras-chave cadastradas | Médio | Alto |
| **M2** | Registro de perguntas não atendidas para curadoria | Adicionar módulo de auditoria (arquivo de log simples em JSON) que grave consultas sem correspondência ou ambíguas — **sem** coletar dados pessoais do usuário —, permitindo priorizar novos temas a partir da demanda real | Baixo | Alto |
| **M3** | Sinônimos regionais e tolerância a erros (Levenshtein) | Criar dicionário de sinônimos por região (ex.: nomes de órgãos estaduais: Poupatempo/Na Hora/Vapt Vupt; 'fazer RG'/'tirar identidade') e distância de edição para erros de digitação | Médio | Médio |
| **M4** | Exportação de relatórios em CSV/MD via menu | Permitir que o avaliador exporte os indicadores também em formatos abertos adicionais diretamente pela interface | Baixo | Médio |

## 7. Limitações da Avaliação

1. **Amostra própria e sintetizada:** os 16 cenários foram concebidos pela própria equipe desenvolvedora; embora sigam o edital fielmente, carregam viés de construção — validação com usuários reais independentes é o próximo passo recomendado;
2. **Métricas determinísticas:** com base estática e em memória, os tempos medidos são muito estáveis; em bases com centenas de registros ou armazenadas em disco/rede, o tempo tenderá a crescer e a avaliação precisará ser refeita sob carga;
3. **Classificação binária de acerto:** a métrica atual exige igualdade exata de status e de identificador; consultas com mais de uma resposta legítima exigirão futuramente métricas mais flexíveis (ex.: Top-3 recall, MRR).
