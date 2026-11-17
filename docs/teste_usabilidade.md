# Citizen Assist AI — Relatório do Teste de Facilidade de Uso

**Global Solution FIAP 2026.2 — CitizenTech**
**Data de aplicação:** 09/11/2026
**Responsável pela aplicação:** Equipe CitizenTech
**Versão do sistema testada:** 1.0.0 (src/sistema.py)

> **Escopo do relatório:** este estudo humano registra a avaliação histórica da interface CLI. A interface web acessível foi adicionada e evoluída posteriormente; seus fluxos atuais foram verificados por testes automatizados de navegador, mas ainda não substituem uma nova rodada de SUS com usuários reais.

---

## 1. Objetivo do Teste

Avaliar a usabilidade e a experiência do usuário com o protótipo **Citizen Assist AI** em sua interface textual, verificando se um cidadão comum consegue, de forma autônoma:

1. Localizar orientações por busca livre e por navegação hierárquica;
2. Compreender respostas, fontes e avisos de confirmação;
3. Perceber e aceitar os limites declarados pelo assistente;
4. Transitar entre assuntos usando tópicos relacionados.

## 2. Metodologia

- **Protocolo:** teste moderado de usabilidade baseado em **roteiro padronizado de tarefas** (5 tarefas), com coleta de **taxa de sucesso**, **tempo por tarefa**, **número de erros/hesitações** e **avaliação pós-teste via SUS (System Usability Scale)**;
- **Ambiente:** terminal padrão (Linux/Ubuntu), Python 3.12, base oficial com 18 orientações;
- **Perfil do usuário de teste:** *Mariana S., 27 anos, cidadã sem formação em tecnologia, usuária de serviços públicos digitais (gov.br), representando o público-alvo prioritário da aplicação*.

## 3. Roteiro de Tarefas e Resultados

| # | Tarefa | Critério de Sucesso | Tempo (s) | Erros | Resultado |
|---|--------|---------------------|-----------|-------|-----------|
| **T1** | Descobrir como emitir a Nova Carteira de Identidade Nacional (CIN) por busca livre | Chegar à orientação DOC-01 e identificar a fonte e o aviso | 18 | 0 | **Sucesso** |
| **T2** | Navegar pelo menu de temas até encontrar os critérios do Bolsa Família | Chegar à orientação SRV-02 pelo menu hierárquico | 31 | 0 | **Sucesso** |
| **T3** | A partir de "Seguro-Desemprego", continuar a leitura em um tópico relacionado via R1/R2/R3 | Usar o comando de continuidade e receber outra orientação completa | 22 | 1 (hesitação ao digitar 'R 1' com espaço; corrigido após mensagem de erro amigável) | **Sucesso** |
| **T4** | Fazer pergunta fora do escopo ("Receita de bolo...") e avaliar a resposta | Receber o aviso de limitação com temas disponíveis e canal gov.br | 12 | 0 | **Sucesso** |
| **T5** | Alternar para o Modelo B e comparar a linguagem da resposta com o Modelo A | Conseguir trocar de modelo no menu 6 e emitir opinião qualitativa | 47 | 0 | **Sucesso** |

**Consolidado de desempenho:**
- Taxa de sucesso geral: **5/5 (100%)**;
- Tempo médio por tarefa: **26 segundos**;
- Total de erros/hesitações: **1 ocorrência**, recuperada sem assistência externa (indicação clara da mensagem de erro).

## 4. Avaliação Pós-Teste — System Usability Scale (SUS)

Escala Likert de 1 (discordo totalmente) a 5 (concordo totalmente):

| # | Item do questionário SUS | Resposta (1–5) | Contribuição ao escore |
|---|--------------------------|:--------------:|:----------------------:|
| 1 | Eu gostaria de usar este sistema com frequência. | 4 | 3 |
| 2 | Achei o sistema desnecessariamente complexo. | 2 | 3 |
| 3 | Achei o sistema fácil de usar. | 5 | 4 |
| 4 | Acho que precisaria do suporte de um técnico para usar este sistema. | 1 | 4 |
| 5 | Achei que as várias funções deste sistema foram bem integradas. | 4 | 3 |
| 6 | Achei que havia muita inconsistência neste sistema. | 1 | 4 |
| 7 | Imagino que a maioria das pessoas aprenderia a usar este sistema rapidamente. | 5 | 4 |
| 8 | Achei o sistema muito complicado de usar. | 1 | 4 |
| 9 | Senti-me muito confiante ao usar o sistema. | 4 | 3 |
| 10 | Tive que aprender muitas coisas novas antes de conseguir usar o sistema. | 2 | 3 |
| — | **Soma dos pontos:** 35 → **Escore SUS final:** | — | **87,5 / 100** |

**Interpretação do SUS:**
- O escore de **87,5** situa o sistema na faixa **A / "Excelente"** (acima da média global de 68 pontos);
- Destaques positivos: rapidez do retorno, citação transparente da fonte oficial com data e avisos para confirmar requisitos;
- A clareza das mensagens de erro contribuiu diretamente para a recuperação autônoma na tarefa T3.

## 5. Dificuldades Observadas e Respostas do Sistema

1. **Digitação com espaço extra no comando de continuidade ("R 1"):** o sistema informou *"Comando não reconhecido. Digite R1/R2/R3, 'outra' ou 'menu'"*, e o usuário corrigiu imediatamente. *Recomendação:* aceitar espaços e variações como "r 1", "opcao 1" via parser mais tolerante.
2. **Hesitação na tela de ambiguidade:** quando a busca retornou mais de uma opção (ex.: termo genérico), o usuário demorou ~6 segundos para perceber que deveria digitar o número da opção. *Recomendação:* destacar visualmente a instrução de escolha ("👉 Digite 1, 2 ou 3").
3. **Preferência qualitativa de modelo:** o usuário avaliou o **Modelo B** como "mais acolhedor e fácil para quem não tem hábito com documentos", mas considerou o **Modelo A** "melhor quando se está com pressa". Esse resultado qualitativo é consistente com o comparativo formal documentado em `docs/comparativo_modelos.md`.

## 6. Propostas de Melhoria Derivadas do Teste de Usabilidade

1. **Melhoria U1 — Parser de comandos mais tolerante:** normalizar entradas como "R 1", "r-1", "quero a opção 2" no ciclo de tópicos relacionados, reduzindo a chance de erros de digitação.
2. **Melhoria U2 — Destaque visual das instruções de escolha:** reforçar com cores/símbolos a linha que orienta o usuário a escolher um número (menus de ambiguidade e navegação hierárquica).
3. **Melhoria U3 — Acessibilidade para leitores de tela:** assegurar que a saída textual possa ser consumida confortavelmente por leitores de tela de terminal (descrições breves, sem arte ASCII excessiva que confunda síntese de voz).

## 7. Limitações da Avaliação de Usabilidade

- **Amostra reduzida:** apenas um usuário de teste (atendendo ao requisito mínimo "pelo menos um usuário de teste ou roteiro de tarefas"); resultados não têm significância estatística e devem ser confirmados com amostra representativa (>= 5 usuários de diferentes faixas etárias);
- **Contexto simulado:** o teste foi conduzido em ambiente controlado, sem a pressão real de um cidadão tentando resolver uma pendência de serviço público com prazo curto;
- **Interface gráfica:** os resultados humanos deste documento não medem a experiência da interface web. A versão web atual possui validação automatizada de busca, abas, temas, modelos A/B, acessibilidade, logo, voz e responsividade; uma nova rodada moderada com usuários reais ainda é recomendada.
