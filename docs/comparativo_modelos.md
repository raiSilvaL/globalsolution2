# Citizen Assist AI — Comparativo de Modelos de Resposta (Estratégias de Prompt)

**Global Solution FIAP 2026.2 — Tema: CitizenTech**
**Referência de código:** `src/modelos_resposta.py`

---

## 1. Justificativa da Comparação

O edital exige *elaborar e documentar pelo menos dois modelos de prompt ou de instrução de resposta (papel do assistente, formato da resposta e obrigação de citar a fonte) e compará-los em perguntas de teste, justificando qual oferece respostas mais claras e consistentes*.

Os dois modelos compartilham a **mesma base factual** (conteúdo idêntico), diferindo em **papel/persona**, **tom**, **organização visual** e **nível de detalhamento textual**, o que permite isolar o efeito da estratégia de instrução sobre a clareza percebida.

## 2. Especificação Formal dos Modelos

| Dimensão | **Modelo A — Objetivo-Institucional** | **Modelo B — Empático-Educativo (Linguagem Cidadã)** |
|---|---|---|
| **Papel (persona)** | Assistente institucional de referência rápida | Orientador comunitário acolhedor e didático |
| **Tom** | Impessoal, direto, formal e conciso | Acolhedor, didático, em linguagem simples (Plain Language) |
| **Público-alvo** | Cidadãos habituados a documentos que buscam confirmação objetiva | Qualquer cidadão, inclusive pessoas com menor letramento digital |
| **Estrutura de saída** | [1] Cabeçalho com código, título, tema e subtema<br>[2] Orientação resumida<br>[3] Passo a passo essencial (1..n)<br>[4] Fonte oficial + data de verificação<br>[5] Aviso de confirmação de requisitos<br>[6] Três tópicos relacionados (R1–R3) | [1] Saudação acolhedora + título didático<br>[2] "O que você precisa saber" (resumo + detalhe)<br>[3] Passo a passo guiado (1..n)<br>[4] Dica prática cotidiana<br>[5] "Onde conferir" (fonte oficial + data)<br>[6] Lembrete acolhedor de confirmação<br>[7] Três assuntos parecidos (R1–R3) |
| **Obrigações não negociáveis** | Citar fonte com data; nunca alegar canal oficial; alertar para confirmação | Citar fonte com data; explicitar caráter informativo; incentivar confirmação no órgão |
| **Extensão média (chars)** | ~1.400–1.700 caracteres | ~1.900–2.400 caracteres |

## 3. Avaliação Comparativa em Perguntas de Teste

Ambos os modelos foram aplicados aos registros retornados nas seguintes perguntas da bateria oficial, pontuando critérios de 1 (insatisfatório) a 5 (excelente):

| Pergunta de Teste (registro) | Critério | Modelo A | Modelo B | Análise |
|---|---|:---:|:---:|---|
| **P1** — *"Como tirar a Nova Carteira de Identidade Nacional?"* (DOC-01) | Clareza do resumo | 5 | 5 | Ambos expõem com precisão a gratuidade da 1ª via e o CPF como número único. |
| | Acessibilidade da linguagem | 4 | 5 | B evita termos burocráticos; A usa "unidade federativa", menos acessível. |
| | Citação da fonte | 5 | 5 | Ambos citam o MGI, o link gov.br/identidade e a data 09/11/2026. |
| | Orientação prática (passos) | 5 | 5 | Mesmos 5 passos bem estruturados. |
| | Aviso de confirmação | 5 | 5 | Ambos destacam variação estadual e necessidade de confirmar. |
| | **Média P1** | **4,8** | **5,0** |  |
| **P2** — *"Não tenho dinheiro para advogado, como conseguir a Defensoria Pública?"* (DIR-03) | Clareza do resumo | 5 | 5 | Ambos explicam estadual vs União. |
| | Acessibilidade da linguagem | 4 | 5 | B usa tom acolhedor importante para temas sensíveis de vulnerabilidade. |
| | Citação da fonte | 5 | 5 | Ambos citam DPU e Condege com data. |
| | Orientação prática (passos) | 5 | 5 | Quatro passos objetivos em ambos. |
| | Aviso de confirmação | 5 | 5 | Ambos alertam sobre critérios de renda e plantão. |
| | **Média P2** | **4,8** | **5,0** |  |
| **P3** — *"Como funciona o desconto da conta de luz para baixa renda?"* (SRV-05) | Clareza do resumo | 5 | 5 | Explicação clara do CadÚnico e percentuais. |
| | Acessibilidade da linguagem | 4 | 5 | B didatiza melhor o papel da distribuidora de energia. |
| | Citação da fonte | 5 | 5 | Ambos citam ANEEL com data. |
| | Orientação prática (passos) | 5 | 5 | Quatro passos práticos. |
| | Aviso de confirmação | 5 | 5 | Ambos alertam sobre a atualização bienal do CadÚnico. |
| | **Média P3** | **4,8** | **5,0** |  |
| **P4** — *"Receita de bolo de chocolate..."* (fora do escopo) | Transparência da limitação | 5 | 5 | Ambos recusam educadamente e listam temas disponíveis. |
| | Direcionamento institucional | 5 | 5 | Ambos indicam o portal gov.br como canal oficial. |
| | Acolhimento | 4 | 5 | B adiciona tom compreensivo ("não consigo te ajudar dessa vez"). |
| | **Média P4** | **4,7** | **5,0** |  |

**Consolidado:** Modelo A obteve média **4,78** e Modelo B **5,00** nos critérios avaliados.

## 4. Comparação Estrutural e de Consistência

| Dimensão | Modelo A | Modelo B | Veredito |
|---|:---:|:---:|---|
| **Conformidade à estrutura declarada** | 100% dos testes | 100% dos testes | Empate — ambos seguem template rígido |
| **Presença obrigatória de fonte + data** | 100% | 100% | Empate — requisito do edital plenamente atendido em ambos |
| **Presença do aviso de confirmação** | 100% | 100% | Empate |
| **Velocidade de leitura (extensão)** | Menor (~1.500 chars) | Maior (~2.100 chars) | **Modelo A é mais rápido para consulta operacional** |
| **Inclusão linguística** | Média-alta | Excelente | **Modelo B é mais acessível ao público geral** |
| **Tom acolhedor para temas sensíveis** | Neutro | Alto | **Modelo B é mais adequado a direitos/benefícios** |

## 5. Conclusão e Recomendação Justificada

**Qual modelo oferece respostas mais claras e consistentes?**

> **O Modelo B (Empático-Educativo) oferece respostas mais *claras* para o cidadão comum**, pois aplica os princípios da **Linguagem Cidadã** (frases curtas, vocabulário simples, saudação que reduz atrito emocional), enquanto **ambos os modelos empatam em *consistência***, porque seguem templates determinísticos que garantem 100% de presença de fonte verificada, data de checagem e aviso de confirmação.

**Decisão de projeto recomendada:**
1. Manter o **Modelo A como padrão técnico** (garante resposta concisa em 1.500 caracteres para consultas operacionais rápidas);
2. Permitir que o usuário **alterne livremente para o Modelo B pelo menu 6**, atendendo tanto cidadãos que buscam leitura rápida quanto aqueles que se beneficiam de explicação detalhada e acolhedora;
3. Em versões futuras, adotar o **Modelo B como padrão quando o público predominante for de famílias em situação de vulnerabilidade**, pois o tom acolhedor demonstrou, no teste de usabilidade (`docs/teste_usabilidade.md`), reduzir a hesitação do usuário.
