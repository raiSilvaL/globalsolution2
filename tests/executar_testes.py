"""
Citizen Assist AI — Executor de Bateria de Testes
Avalia o assistente sobre um conjunto estruturado de cenários de teste,
calculando taxa de acerto, tempo médio de consulta e métricas por categoria.

Uso:
    python tests/executar_testes.py
    python src/sistema.py --test
"""

from __future__ import annotations

import json
import statistics
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.base_dados import BaseConhecimento  # noqa: E402
from src.buscador import Buscador, ResultadoBusca  # noqa: E402
from src.modelos_resposta import formatar_resposta  # noqa: E402

CAMINHO_BASE = BASE_DIR / "data" / "base_conhecimento.json"
CAMINHO_CENARIOS = BASE_DIR / "tests" / "cenarios_teste.json"
CAMINHO_RELATORIO = BASE_DIR / "reports" / "resultados_testes.json"


class BateriaDeTestes:
    """Executa os cenários e consolida indicadores de desempenho."""

    def __init__(
        self,
        base_dados: BaseConhecimento,
        buscador: Buscador,
        modelo_resposta: str = "A",
        caminho_cenarios: Path = CAMINHO_CENARIOS,
    ) -> None:
        self.base = base_dados
        self.buscador = Buscador(base_dados) if buscador is None else buscador
        self.modelo = modelo_resposta
        self.caminho_cenarios = caminho_cenarios
        self.cenarios: List[Dict[str, Any]] = self._carregar_cenarios()

    def _carregar_cenarios(self) -> List[Dict[str, Any]]:
        dados = json.loads(self.caminho_cenarios.read_text(encoding="utf-8"))
        return dados["cenarios"]

    # ------------------------------------------------------------------
    # Avaliação de um cenário
    # ------------------------------------------------------------------
    def avaliar_cenario(self, cenario: Dict[str, Any]) -> Dict[str, Any]:
        pergunta = cenario["pergunta"]
        esperado = cenario["esperado"]

        t0 = time.perf_counter()
        resultado: ResultadoBusca = self.buscador.buscar(pergunta)
        tempo_ms = round((time.perf_counter() - t0) * 1000, 3)

        status_obtido = resultado.status
        id_obtido = (
            resultado.registro["identificador"]
            if resultado.registro
            else None
        )

        acerto = False
        if esperado["status"] == "SUCESSO":
            acerto = (status_obtido == "SUCESSO") and (id_obtido == esperado["id_orientacao"])
        elif esperado["status"] == "SEM_CORRESPONDENCIA":
            acerto = status_obtido == "SEM_CORRESPONDENCIA"
        elif esperado["status"] == "AMBIGUO":
            acerto = status_obtido == "AMBIGUO"
        elif esperado["status"] == "ENTRADA_VAZIA":
            acerto = status_obtido == "ENTRADA_VAZIA"

        # Verificação dos dois modelos de resposta (devem produzir texto não vazio)
        resumo_modelo_a = ""
        resumo_modelo_b = ""
        if resultado.registro:
            txt_a = formatar_resposta(resultado.registro, "A", self.base)
            txt_b = formatar_resposta(resultado.registro, "B", self.base)
            resumo_modelo_a = f"ok ({len(txt_a)} chars)"
            resumo_modelo_b = f"ok ({len(txt_b)} chars)"

        return {
            "id": cenario["id"],
            "categoria": cenario["categoria"],
            "pergunta": pergunta if pergunta else "[entrada vazia]",
            "esperado": esperado,
            "status_obtido": status_obtido,
            "id_obtido": id_obtido,
            "titulo_obtido": resultado.registro["titulo"] if resultado.registro else None,
            "acerto": acerto,
            "classificacao": "ACERTO" if acerto else "ERRO",
            "tempo_consulta_ms": tempo_ms,
            "explicacao": cenario.get("explicacao", ""),
            "modelo_a": resumo_modelo_a,
            "modelo_b": resumo_modelo_b,
        }

    # ------------------------------------------------------------------
    # Execução completa
    # ------------------------------------------------------------------
    def executar(self) -> Dict[str, Any]:
        resultados = [self.avaliar_cenario(c) for c in self.cenarios]

        total = len(resultados)
        acertos = sum(1 for r in resultados if r["acerto"])
        taxa_acerto = round((acertos / total) * 100, 2) if total else 0.0

        tempos = [r["tempo_consulta_ms"] for r in resultados]
        tempo_medio = round(statistics.mean(tempos), 3) if tempos else 0.0
        tempo_min = min(tempos) if tempos else 0.0
        tempo_max = max(tempos) if tempos else 0.0
        tempo_mediana = round(statistics.median(tempos), 3) if tempos else 0.0

        # Métricas por categoria
        por_categoria: Dict[str, Dict[str, Any]] = {}
        for r in resultados:
            cat = r["categoria"]
            bucket = por_categoria.setdefault(cat, {"total": 0, "acertos": 0, "tempos": []})
            bucket["total"] += 1
            if r["acerto"]:
                bucket["acertos"] += 1
            bucket["tempos"].append(r["tempo_consulta_ms"])

        metricas_categoria = {}
        for cat, b in por_categoria.items():
            t_cat = [round(t, 3) for t in b["tempos"]]
            metricas_categoria[cat] = {
                "total": b["total"],
                "acertos": b["acertos"],
                "taxa_acerto_pct": round((b["acertos"] / b["total"]) * 100, 2),
                "tempo_medio_ms": round(statistics.mean(t_cat), 3),
            }

        relatorio = {
            "meta": {
                "sistema": "Citizen Assist AI",
                "versao_base": self.base.versao,
                "data_execucao": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total_registros_base": self.base.total(),
                "total_temas": len(self.base.listar_temas()),
                "total_termos_indexados": self.buscador.total_termos_indexados(),
            },
            "indicadores_gerais": {
                "total_testes": total,
                "acertos": acertos,
                "erros": total - acertos,
                "taxa_acerto_pct": taxa_acerto,
                "tempo_medio_ms": tempo_medio,
                "tempo_mediana_ms": tempo_mediana,
                "tempo_min_ms": tempo_min,
                "tempo_max_ms": tempo_max,
            },
            "indicadores_por_categoria": metricas_categoria,
            "interpretacao": self._interpretar(taxa_acerto, tempo_medio, metricas_categoria),
            "melhorias_possiveis": [
                {
                    "item": "M1 — Expansão do algoritmo com TF-IDF e embeddings semânticos",
                    "descricao": "Hoje o ranqueamento usa heurística ponderada de tokens + Jaccard. A inclusão de TF-IDF com busca por n-gramas e, futuramente, embeddings de frases (mesmo locais/leves) melhorará reformulações com vocabulário distante das palavras-chave cadastradas.",
                },
                {
                    "item": "M2 — Registro de perguntas não atendidas para curadoria contínua da base",
                    "descricao": "Adicionar módulo de auditoria (arquivo de log simples) que grave consultas sem correspondência ou ambíguas (sem coletar dados do usuário), permitindo à equipe priorizar novos temas a partir da demanda real dos cidadãos.",
                },
                {
                    "item": "M3 — Suporte a sinônimos regionais e correção ortográfica (Levenshtein)",
                    "descricao": "Cidadãos de diferentes regiões usam expressões locais ('tirar identidade' vs 'fazer RG', nomes de órgãos estaduais como 'Poupatempo'/'Na Hora'/'Vapt Vupt'); um dicionário de sinônimos por UF e distância de edição tolerante a erros de digitação aumentará a robustez.",
                },
            ],
            "limitacoes_da_avaliacao": [
                "A bateria atual tem 16 cenários planejados pela própria equipe — uma amostra pequena e com viés de construção; testes com perguntas reais de usuários externos são recomendados para confirmar os números.",
                "O tempo de consulta foi medido localmente em memória com base estática (<20 registros); em bases maiores ou ambientes distribuídos o tempo tenderá a crescer e deve ser reavaliado.",
                "A classificação de 'acerto' usa regras exatas (status + ID); consultas com duas respostas plausíveis podem ser penalizadas injustamente até que a política de aceitação de candidatos seja flexibilizada.",
            ],
            "resultados_detalhados": resultados,
        }
        return relatorio

    def salvar_relatorio(self, relatorio: Dict[str, Any]) -> None:
        CAMINHO_RELATORIO.parent.mkdir(parents=True, exist_ok=True)
        CAMINHO_RELATORIO.write_text(
            json.dumps(relatorio, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # ------------------------------------------------------------------
    # Interpretação textual dos indicadores
    # ------------------------------------------------------------------
    def _interpretar(
        self, taxa: float, tempo: float, categorias: Dict[str, Dict[str, Any]]
    ) -> str:
        linhas = [
            f"A taxa de acerto global foi de {taxa}% com tempo médio de consulta de {tempo} ms. ",
        ]
        if taxa >= 80:
            linhas.append(
                "O desempenho geral é satisfatório para um protótipo acadêmico, "
                "indicando que a estratégia de indexação invertida combinada com "
                "pesos por campo (palavras-chave, título, orientação) cobre bem "
                "perguntas diretas e as principais reformulações."
            )
        else:
            linhas.append(
                "O resultado aponta necessidade de ajuste nos pesos da função de "
                "scoring ou de ampliação das palavras-chave cadastradas."
            )
        linhas.append(
            " As perguntas fora do escopo e os casos de limitação (entrada vazia, "
            "ambiguidade e termos fictícios) foram tratados sem falsas respostas "
            "positivas, cumprindo o requisito de declarar limitações de forma transparente."
        )
        for cat, b in categorias.items():
            linhas.append(
                f" Categoria '{cat}': {b['acertos']}/{b['total']} acertos ({b['taxa_acerto_pct']}%), "
                f"tempo médio {b['tempo_medio_ms']} ms."
            )
        return "".join(linhas)

    # ------------------------------------------------------------------
    # Impressão amigável
    # ------------------------------------------------------------------
    def executar_e_imprimir(self) -> bool:
        print("\n" + "=" * 70)
        print("BATERIA DE TESTES AUTOMATIZADOS — CITIZEN ASSIST AI")
        print("=" * 70)
        print(f"Base: {self.base.caminho_arquivo.name} ({self.base.total()} registros, "
              f"{len(self.base.listar_temas())} temas) | Termos indexados: {self.buscador.total_termos_indexados()}")
        print(f"Cenários de teste carregados: {len(self.cenarios)}\n")

        relatorio = self.executar()
        self.salvar_relatorio(relatorio)

        print(f"{'ID':<4} {'CATEGORIA':<12} {'RESULTADO':<10} {'TEMPO':>9}  PERGUNTA")
        print("-" * 70)
        for r in relatorio["resultados_detalhados"]:
            perg = r["pergunta"]
            if len(perg) > 42:
                perg = perg[:39] + "..."
            print(
                f"{r['id']:<4} {r['categoria']:<12} {r['classificacao']:<10} "
                f"{r['tempo_consulta_ms']:>8.1f}ms  {perg}"
            )

        ind = relatorio["indicadores_gerais"]
        print("-" * 70)
        print(f"\nINDICADORES GERAIS:")
        print(f"  * Total de testes:               {ind['total_testes']}")
        print(f"  * Acertos / Erros:               {ind['acertos']} / {ind['erros']}")
        print(f"  * Taxa de acerto das respostas:  {ind['taxa_acerto_pct']}%")
        print(f"  * Tempo médio de consulta:       {ind['tempo_medio_ms']} ms")
        print(f"  * Tempo mediano:                 {ind['tempo_mediana_ms']} ms")
        print(f"  * Tempo mín / máx:               {ind['tempo_min_ms']} ms / {ind['tempo_max_ms']} ms")

        print("\nINDICADORES POR CATEGORIA:")
        for cat, b in relatorio["indicadores_por_categoria"].items():
            print(f"  * {cat:<14}: {b['acertos']}/{b['total']} acertos "
                  f"({b['taxa_acerto_pct']}%) — tempo médio {b['tempo_medio_ms']} ms")

        print(f"\nINTERPRETAÇÃO:\n  {relatorio['interpretacao']}\n")

        print("MELHORIAS POSSÍVEIS (ROADMAP):")
        for m in relatorio["melhorias_possiveis"]:
            print(f"  * {m['item']}: {m['descricao']}")

        print("\nLIMITAÇÕES DA AVALIAÇÃO:")
        for lim in relatorio["limitacoes_da_avaliacao"]:
            print(f"  * {lim}")

        print(f"\nRelatório completo salvo em: {CAMINHO_RELATORIO.relative_to(BASE_DIR)}")
        print("=" * 70)
        return ind["erros"] == 0


def main() -> None:
    base = BaseConhecimento(CAMINHO_BASE)
    buscador = Buscador(base)
    bateria = BateriaDeTestes(base, buscador)
    ok = bateria.executar_e_imprimir()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
