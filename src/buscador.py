"""
Citizen Assist AI — Módulo de Busca e Correspondência
Implementa a estratégia de busca sobre a base de conhecimento:
1. Normalização de texto (minúsculas, remoção de acentos e pontuação,
   eliminação de stopwords em português);
2. Construção de índice invertido (dicionário termo -> identificadores);
3. Cálculo de pontuação composta por correspondência de tokens, frases
   exatas e similaridade de Jaccard;
4. Ranqueamento das correspondências, detecção de ambiguidade (empates)
   e identificação de perguntas sem correspondência confiável.

Algoritmos e estruturas mobilizados:
- Dicionários e conjuntos (dict/set) para o índice invertido e filtros;
- Listas e tuplas para tokens ordenados e candidatos ranqueados;
- Função de scoring ponderada com thresholds configuráveis.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set

# Stopwords comuns em português que não agregam conteúdo semântico à consulta
STOPWORDS_PT: Set[str] = {
    "a", "o", "as", "os", "um", "uma", "uns", "umas",
    "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
    "por", "para", "com", "sem", "sobre", "entre", "ate", "desde",
    "e", "ou", "mas", "que", "se", "como", "quando", "onde", "porque",
    "meu", "minha", "meus", "minhas", "seu", "sua", "seus", "suas",
    "dele", "dela", "deles", "delas", "este", "esta", "estes", "estas",
    "esse", "essa", "esses", "essas", "isso", "isto", "aquilo",
    "quem", "qual", "quais", "quanto", "quantos", "quanta", "quantas",
    "eu", "tu", "ele", "ela", "nos", "vos", "eles", "elas",
    "ser", "estar", "ter", "haver", "fazer", "ir", "dizer", "dar",
    "é", "sao", "foi", "era", "tem", "ha", "so", "ja", "muito", "mais",
    "menos", "tambem", "assim", "tudo", "nada", "todo", "toda", "todos", "todas",
    "nao", "sim",
}

SCORE_MINIMO_MATCH = 5.0
LIMIAR_AMBIGUIDADE = 2.8


def normalizar(texto: str) -> str:
    """Converte para minúsculas e remove acentuação (NFKD -> ASCII)."""
    if not texto:
        return ""
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    return texto.lower().strip()


def tokenizar(texto: str, remover_stopwords: bool = True) -> List[str]:
    """Segmenta o texto em tokens alfanuméricos normalizados."""
    texto_norm = normalizar(texto)
    tokens = re.findall(r"[a-z0-9]+", texto_norm)
    if remover_stopwords:
        tokens = [t for t in tokens if t not in STOPWORDS_PT and len(t) > 1]
    return tokens


def jaccard(set_a: Set[str], set_b: Set[str]) -> float:
    """Calcula a similaridade de Jaccard entre dois conjuntos de tokens."""
    if not set_a or not set_b:
        return 0.0
    intersecao = len(set_a & set_b)
    uniao = len(set_a | set_b)
    return intersecao / uniao if uniao else 0.0


@dataclass
class Candidato:
    registro: Dict[str, Any]
    score: float
    justificativa: str


@dataclass
class ResultadoBusca:
    status: str  # "SUCESSO", "AMBIGUO", "SEM_CORRESPONDENCIA", "ENTRADA_VAZIA"
    registro: Optional[Dict[str, Any]]
    candidatos: List[Candidato]
    mensagem: str


class Buscador:
    """Indexa e consulta os registros da base de conhecimento."""

    PESO_KEYWORD = 4.0
    PESO_TITULO = 3.5
    PESO_PERGUNTA_MODELO = 2.5
    PESO_TEXTO = 0.6
    BONUS_FRASE_EXATA = 14.0
    BONUS_JACCARD = 8.0

    def __init__(self, base_dados: Any) -> None:
        self.base = base_dados
        self.score_minimo = SCORE_MINIMO_MATCH
        self.limiar_ambiguidade = LIMIAR_AMBIGUIDADE
        self._indice_invertido: Dict[str, Set[str]] = {}
        self._construir_indice()

    # ------------------------------------------------------------------
    # Construção do índice invertido
    # ------------------------------------------------------------------
    def _construir_indice(self) -> None:
        self._indice_invertido.clear()
        for reg in self.base.listar_todos():
            ident = reg["identificador"]
            corpus_partes = [
                reg.get("titulo", ""),
                reg.get("pergunta_modelo", ""),
                reg.get("orientacao_resumida", ""),
            ]
            for kw in reg.get("palavras_chave", []):
                corpus_partes.append(str(kw))

            tokens = set(tokenizar(" ".join(corpus_partes)))
            for tok in tokens:
                self._indice_invertido.setdefault(tok, set()).add(ident)

    def total_termos_indexados(self) -> int:
        return len(self._indice_invertido)

    # ------------------------------------------------------------------
    # Cálculo de pontuação
    # ------------------------------------------------------------------
    def _pontuar_registro(
        self, tokens_consulta: List[str], consulta_norm: str, reg: Dict[str, Any]
    ) -> float:
        score = 0.0

        titulo_norm = normalizar(reg.get("titulo", ""))
        pergunta_norm = normalizar(reg.get("pergunta_modelo", ""))
        keywords_norm = [normalizar(str(k)) for k in reg.get("palavras_chave", [])]
        orientacao_norm = normalizar(reg.get("orientacao_resumida", ""))

        # 1. Bônus por correspondência exata de frase/termo completo
        exact_applied = False
        if consulta_norm:
            if (
                consulta_norm == titulo_norm
                or consulta_norm == pergunta_norm
                or consulta_norm in keywords_norm
            ):
                score += self.BONUS_FRASE_EXATA
                exact_applied = True
            else:
                for kw in keywords_norm:
                    if len(kw.split()) >= 2 and kw in consulta_norm:
                        score += self.BONUS_FRASE_EXATA
                        exact_applied = True
                        break

        # 2. Correspondência token a token ponderada pelo campo
        tokens_titulo = set(tokenizar(titulo_norm, remover_stopwords=False))
        tokens_pergunta = set(tokenizar(pergunta_norm, remover_stopwords=False))
        tokens_orientacao = set(tokenizar(orientacao_norm, remover_stopwords=False))

        tokens_keywords: Set[str] = set()
        for kw in keywords_norm:
            tokens_keywords.update(tokenizar(kw, remover_stopwords=False))

        tokens_unicos_consulta = set(tokens_consulta)
        score += len(tokens_unicos_consulta & tokens_keywords) * self.PESO_KEYWORD
        score += len(tokens_unicos_consulta & tokens_titulo) * self.PESO_TITULO
        score += len(tokens_unicos_consulta & tokens_pergunta) * self.PESO_PERGUNTA_MODELO
        score += len(tokens_unicos_consulta & tokens_orientacao) * self.PESO_TEXTO

        # 3. Similaridade de Jaccard sobre o conjunto de palavras-chave
        score += jaccard(tokens_unicos_consulta, tokens_keywords) * self.BONUS_JACCARD

        # 4. Cobertura da consulta: perguntas longas em que quase nenhum termo
        # relevante bateu no registro têm o score fortemente reduzido (evita
        # falsos positivos em perguntas fora de escopo que contêm uma única
        # palavra comum como "bolsa", "receita", "tirar")
        all_matched = tokens_keywords | tokens_titulo | tokens_pergunta | tokens_orientacao
        cov = (
            len(tokens_unicos_consulta & all_matched) / len(tokens_unicos_consulta)
            if tokens_unicos_consulta
            else 0.0
        )
        if len(tokens_unicos_consulta) >= 3 and cov < 0.35 and not exact_applied:
            score *= 0.15

        return round(score, 2)

    # ------------------------------------------------------------------
    # Consulta pública
    # ------------------------------------------------------------------
    def buscar(self, pergunta: str, limite: int = 3) -> ResultadoBusca:
        if not pergunta or not pergunta.strip():
            return ResultadoBusca(
                status="ENTRADA_VAZIA",
                registro=None,
                candidatos=[],
                mensagem=(
                    "Nenhuma pergunta foi informada. Por favor, digite o que você precisa "
                    "saber (ex.: 'Como regularizar o CPF?' ou 'Preciso de ajuda com a conta de luz')."
                ),
            )

        # Atalho: consulta por identificador exato (DOC-01, SRV-03, etc.)
        id_possivel = pergunta.strip().upper()
        reg_id = self.base.obter_por_id(id_possivel)
        if reg_id:
            candidato = Candidato(
                registro=reg_id,
                score=99.0,
                justificativa="Correspondência exata por código de identificação.",
            )
            return ResultadoBusca(
                status="SUCESSO",
                registro=reg_id,
                candidatos=[candidato],
                mensagem=f"Orientação '{reg_id['titulo']}' localizada pelo código.",
            )

        consulta_norm = normalizar(pergunta)
        tokens_consulta = tokenizar(pergunta, remover_stopwords=True)

        if not tokens_consulta:
            tokens_consulta = tokenizar(pergunta, remover_stopwords=False)

        candidatos: List[Candidato] = []
        for reg in self.base.listar_todos():
            score = self._pontuar_registro(tokens_consulta, consulta_norm, reg)
            if score >= self.score_minimo:
                candidatos.append(
                    Candidato(
                        registro=reg,
                        score=score,
                        justificativa=(
                            f"Score {score:.2f} (correspondência com título, "
                            f"palavras-chave e orientações do tema '{reg['tema']}')."
                        ),
                    )
                )

        candidatos.sort(key=lambda c: c.score, reverse=True)

        if not candidatos:
            return ResultadoBusca(
                status="SEM_CORRESPONDENCIA",
                registro=None,
                candidatos=[],
                mensagem=(
                    "Não encontrei na base de conhecimento uma orientação confiável para essa pergunta. "
                    "Este assistente responde apenas sobre temas previamente verificados "
                    "(documentação básica, serviços públicos e benefícios, direitos e cidadania, "
                    "orientações comunitárias e emergências). Para serviços oficiais, consulte o portal gov.br "
                    "ou a central telefônica do órgão responsável."
                ),
            )

        topo = candidatos[0]
        # Detecção de ambiguidade: múltiplos candidatos com scores muito próximos
        if len(candidatos) > 1:
            segundo = candidatos[1]
            if (topo.score - segundo.score) <= self.limiar_ambiguidade and topo.score < 22.0:
                return ResultadoBusca(
                    status="AMBIGUO",
                    registro=None,
                    candidatos=candidatos[:limite],
                    mensagem=(
                        "Sua pergunta pode se referir a mais de um assunto cadastrado. "
                        "Veja as opções mais prováveis e escolha uma para ver a orientação completa:"
                    ),
                )

        return ResultadoBusca(
            status="SUCESSO",
            registro=topo.registro,
            candidatos=candidatos[:limite],
            mensagem=f"Orientação localizada: '{topo.registro['titulo']}' (tema: {topo.registro['tema']}).",
        )
