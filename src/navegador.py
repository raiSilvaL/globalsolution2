"""
Citizen Assist AI — Módulo de Navegação e Visualização do Grafo de Tópicos

Implementa:
- Navegação hierárquica Tema -> Subtema -> Orientação (baseada em dicionários
  agrupados e listas);
- Visualização em texto do grafo de relações entre tópicos (nós = orientações,
  arestas = topicos_relacionados);
- Navegação lateral por tópicos relacionados com comandos do tipo R1/R2/R3.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


class NavegadorHierarquico:
    """Permite ao usuário explorar a base por temas e subtemas."""

    def __init__(self, base_dados: Any) -> None:
        self.base = base_dados

    def menu_temas(self) -> str:
        temas = self.base.listar_temas()
        linhas = [
            "",
            "-" * 70,
            "NAVEGAÇÃO POR TEMAS",
            "-" * 70,
        ]
        for idx, tema in enumerate(temas, start=1):
            total = len(self.base.listar_por_tema(tema))
            linhas.append(f"  [{idx}] {tema} ({total} orientação(ões))")
        linhas.extend([
            "",
            "  [0] Voltar ao menu principal",
            "-" * 70,
        ])
        return "\n".join(linhas)

    def obter_tema_por_opcao(self, opcao: int) -> Optional[str]:
        temas = self.base.listar_temas()
        if 1 <= opcao <= len(temas):
            return temas[opcao - 1]
        return None

    def menu_subtemas(self, tema: str) -> str:
        subtemas = self.base.listar_subtemas(tema)
        linhas = [
            "",
            "-" * 70,
            f"SUBTEMAS — {tema.upper()}",
            "-" * 70,
        ]
        for idx, sub in enumerate(subtemas, start=1):
            total = len(self.base.listar_por_tema_e_subtema(tema, sub))
            linhas.append(f"  [{idx}] {sub} ({total} orientação(ões))")
        linhas.extend([
            f"  [{len(subtemas) + 1}] Listar TODAS as orientações deste tema",
            "  [0] Voltar",
            "-" * 70,
        ])
        return "\n".join(linhas)

    def obter_subtema_por_opcao(self, tema: str, opcao: int) -> Tuple[Optional[str], bool]:
        """Retorna (subtema, listar_todas)."""
        subtemas = self.base.listar_subtemas(tema)
        if 1 <= opcao <= len(subtemas):
            return subtemas[opcao - 1], False
        if opcao == len(subtemas) + 1:
            return None, True
        return None, False

    def menu_orientacoes(self, orientacoes: List[Dict[str, Any]], titulo: str) -> str:
        linhas = [
            "",
            "-" * 70,
            titulo,
            "-" * 70,
        ]
        for idx, reg in enumerate(orientacoes, start=1):
            linhas.append(
                f"  [{idx}] {reg['identificador']} — {reg['titulo']} "
                f"[{reg.get('subtema', 'Geral')}]"
            )
        linhas.extend([
            "  [0] Voltar",
            "-" * 70,
        ])
        return "\n".join(linhas)


class VisualizadorGrafo:
    """Renderiza em texto a organização em grafo das relações entre tópicos."""

    def __init__(self, base_dados: Any) -> None:
        self.base = base_dados

    def renderizar(self) -> str:
        linhas: List[str] = [
            "",
            "=" * 70,
            "MAPA DE TÓPICOS E RELAÇÕES (GRAFO DE CONHECIMENTO)",
            "=" * 70,
            "Cada nó representa uma orientação cadastrada. As setas (-->) indicam",
            "recomendações de continuidade ('tópicos relacionados') definidas pela",
            "curadoria pedagógica da base.",
            "",
        ]

        temas = self.base.listar_temas()
        for tema in temas:
            linhas.append(f"+- [TEMA] {tema}")
            for reg in self.base.listar_por_tema(tema):
                ident = reg["identificador"]
                linhas.append(f"|    +-- [{ident}] {reg['titulo']}")
                relacionados = self.base.obter_relacionados(ident)
                if relacionados:
                    destinos = ", ".join(r["identificador"] for r in relacionados)
                    linhas.append(f"|         \\--> relaciona-se com: {destinos}")
                else:
                    linhas.append("|         \\--> (sem conexões diretas)")
            linhas.append("|")

        linhas.extend([
            "",
            "Estatísticas do grafo:",
            f"  - Total de nós (orientações): {self.base.total()}",
            f"  - Total de temas (clusters): {len(temas)}",
            f"  - Total de arestas dirigidas: {self._contar_arestas()}",
            "",
            "Como navegar: no menu de resposta você pode digitar [R1], [R2] ou [R3]",
            "para saltar diretamente para os tópicos recomendados no fim de cada orientação.",
            "=" * 70,
        ])
        return "\n".join(linhas)

    def _contar_arestas(self) -> int:
        mapa = self.base.mapa_relacoes()
        return sum(len(destinos) for destinos in mapa.values())


def interpretar_comando_relacionado(
    entrada: str, relacionados: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """Aceita entradas como 'R1', 'r2', '1', '2' para pular para tópico relacionado."""
    entrada = entrada.strip().upper()
    if entrada.startswith("R") and entrada[1:].isdigit():
        idx = int(entrada[1:]) - 1
        if 0 <= idx < len(relacionados):
            return relacionados[idx]
    if entrada.isdigit():
        idx = int(entrada) - 1
        if 0 <= idx < len(relacionados):
            return relacionados[idx]
    return None
