# Citizen Assist AI — Arquitetura Técnica, Estruturas de Dados e Algoritmos

**Global Solution FIAP 2026.2 — Tema: CitizenTech**
**Versão do sistema:** 1.1.0
**Linguagem:** Python 3.10+ (biblioteca padrão apenas — sem dependências externas)

---

## 1. Visão Geral em Camadas

O sistema foi concebido em **cinco camadas com responsabilidades desacopladas**, de modo que a base de conhecimento e os modelos de resposta possam evoluir sem alteração das regras centrais do programa:

```
┌────────────────────────────────────────────────────────┐
│  Camada 5 — Apresentação / CLI (src/sistema.py)        │  Banner, menus interativos,
│                                                        │  tratamento de entradas e
│                                                        │  redirecionamento de fluxos
├────────────────────────────────────────────────────────┤
│  Camada 4 — Navegação (src/navegador.py)               │  Menu hierárquico Tema->Subtema,
│                                                        │  renderizador do grafo ASCII,
│                                                        │  continuidade por tópicos
├────────────────────────────────────────────────────────┤
│  Camada 3 — Modelos de Resposta (src/modelos_resposta) │  Modelos A e B (prompts),
│                                                        │  citação obrigatória de fontes,
│                                                        │  avisos e limitações
├────────────────────────────────────────────────────────┤
│  Camada 2 — Busca e Ranqueamento (src/buscador.py)     │  Normalização, índice invertido,
│                                                        │  scoring ponderado, Jaccard,
│                                                        │  ambiguidade e fora de escopo
├────────────────────────────────────────────────────────┤
│  Camada 1 — Dados (src/base_dados.py + data/*.json)    │  Leitura, validação defensiva,
│                                                        │  indexação e persistência
└────────────────────────────────────────────────────────┘
```

## 2. Estruturas de Dados e Complexidade Computacional

| Estrutura de dados | Uso no sistema | Implementação Python | Complexidade |
|---|---|---|:---:|
| **Dicionário por identificador** | Acesso direto O(1) a qualquer orientação por código (ex.: `DOC-01`) | `dict[str, dict]` | Busca **O(1)** média |
| **Dicionário por tema** | Agrupamento de orientações por tema para navegação e contagens | `dict[str, list[dict]]` | Construção O(n), consulta **O(1)** |
| **Dicionário por (tema, subtema)** | Hierarquia de dois níveis Tema → Subtema → Orientações | `dict[(tema, subtema), list]` | Consulta **O(1)** por par |
| **Índice invertido** | Mapeamento de cada token normalizado aos IDs de orientação onde ele ocorre | `dict[str, set[str]]` | Construção O(n·t), consulta **O(1)** |
| **Grafo de tópicos (lista de adjacência)** | Relações dirigidas entre orientações para continuidade de leitura | `dict[str, list[str]]` | Consulta de vizinhos **O(1)** |
| **Conjuntos (set)** | Remoção de stopwords, união/interseção de tokens e cálculo de Jaccard | `set[str]` | Operações em **O(k)** |
| **Listas e tuplas** | Sequências ordenadas de tokens, passos numerados e candidatos ranqueados | `list`, `tuple` | Acesso posicional **O(1)** |

> Com *n* = 18 registros e *t* ≈ 500 termos indexados, todas as operações de busca e navegação são resolvidas em **menos de 2 milissegundos** no ambiente de teste, confirmando a adequação das estruturas escolhidas.

## 3. Algoritmo de Busca e Ranqueamento

A busca por pergunta livre segue o seguinte pipeline determinístico:

```
          Pergunta do cidadão
                   │
                   ▼
       [1] Validação de entrada vazia
                   │
                   ▼
     [2] Atalho por código exato (DOC-01)?  ───►  SUCESSO imediato
                   │
                   ▼
  [3] Normalização de texto PT:
      minúsculas, remoção de acentos (NFKD->ASCII),
      remoção de pontuação e stopwords
                   │
                   ▼
  [4] Cálculo de score por registro:
      • correspondência exata de frase/termo: +14,0
      • tokens em comum com palavras-chave: +4,0 cada
      • tokens em comum com título: +3,5 cada
      • tokens em comum com pergunta canônica: +2,5 cada
      • tokens em comum com orientação resumida: +0,6 cada
      • similaridade de Jaccard sobre palavras-chave: +8,0 × J
                   │
                   ▼
  [5] Gate de cobertura:
      perguntas com >= 3 tokens e cobertura < 35%
      (sem frase exata) têm score × 0,15 (evita falsos
      positivos como "Receita de bolo -> DOC-02")
                   │
                   ▼
  [6] Filtragem pelo score mínimo (5,0) e ordenação decrescente
                   │
                   ▼
          Candidatos existem?
            ├── NÃO  ──► SEM_CORRESPONDENCIA (+ aviso de limites)
            └── SIM
                 │
                 ▼
          Detecção de ambiguidade:
          |score1 - score2| <= 2,8 E score1 < 22,0 ?
            ├── SIM  ──► AMBIGUO (lista candidatos para escolha)
            └── NÃO  ──► SUCESSO (melhor candidato)
```

## 4. Representação do Grafo de Conhecimento

- **Nós:** 18 orientações verificadas;
- **Arestas dirigidas:** 54 relações de *continuidade recomendada* (`topicos_relacionados`), 3 por nó;
- **Clusters:** 4 temas (Documentação Básica, Serviços Públicos e Benefícios Sociais, Direitos e Cidadania, Orientações Comunitárias e Emergências);
- As arestas foram definidas por **curadoria pedagógica** (ex.: após *CIN*, os próximos passos lógicos são *CPF*, *Certidão 2ª via* e *Título de Eleitor*), permitindo que o cidadão navegue até tópicos relevantes sem formular nova pergunta;
- O sistema valida a **consistência referencial** do grafo a cada carga (arestas apontando para nós inexistentes são reportadas no relatório de integridade).

## 5. Modelos de Resposta e Estratégias de Prompt

- Os modelos **A** e **B** (documentados em `docs/comparativo_modelos.md`) implementam *estratégias de instrução estruturada*: especificam papel/persona, tom, público, formato estrito e **obrigações não negociáveis** (citar fonte verificada com data e incluir aviso de confirmação);
- A seleção do modelo é feita em tempo de execução via menu interativo ou argumento de linha de comando (`--modelo {A|B}`), sem reiniciar o sistema;
- Ambos os modelos cumprem 100% dos requisitos de citação e aviso em todos os testes executados.

## 6. Mecanismos de Extensão e Manutenção

- **Adição sem reescrever regras centrais:** novas orientações podem ser acrescentadas diretamente no JSON ou pelo wizard do menu 5 (em memória ou persistindo no arquivo); a validação de campos obrigatórios e a consistência do grafo são executadas automaticamente;
- **Validação defensiva:** arquivo ausente, vazio, JSON malformatado, campos essenciais faltando, identificadores duplicados e arestas órfãs são tratados com mensagens compreensíveis (nenhum `traceback` chega ao usuário final);
- **Evolução documentada:** o roteiro de melhorias em `docs/relatorio_testes.md` (TF-IDF, embeddings, logs de perguntas não atendidas, sinônimos regionais) é compatível com a arquitetura atual sem necessidade de refatoração estrutural.

## 7. Interface Web e Persistência Local

A interface web em `web/` é uma camada de apresentação complementar, construída sem framework e sem dependências de runtime:

- `web/index.html` organiza o cabeçalho, faixa de emergência, aviso ético, busca guiada, abas e diálogos acessíveis;
- `web/css/style.css` concentra o design system baseado em `#101010`, `#ffffff` e `#c8ff00`, incluindo layout responsivo, alto contraste e a logo comunitária com contorno branco;
- `web/js/app.js` implementa a busca local em paridade com o backend, sugestões de linguagem natural, troca de Modelo A/B, temas, grafo, testes ao vivo e ações de voz/cópia/impressão;
- a base é carregada preferencialmente de `data/base_conhecimento.json` e possui fallback embutido (`BASE_EMBEDDED`) para permitir abrir `web/index.html` diretamente;
- preferências de tamanho da fonte, alto contraste, leitura automática e modelo ficam no `localStorage` do navegador; nenhuma consulta ou dado pessoal é enviado a servidor externo;
- `web/assets/logo_citizen_assist.png` é a versão otimizada da logo original escolhida, usada no cabeçalho e no favicon.
