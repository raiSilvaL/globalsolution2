"""
Citizen Assist AI — Módulo de Base de Conhecimento
Responsável pelo carregamento, validação e organização dos registros de
orientação cidadã a partir de arquivo JSON.

Estruturas utilizadas:
- Dicionários (dict) para indexação O(1) por identificador e agrupamentos
  por tema e por (tema, subtema);
- Listas (list) para coleções ordenadas de orientações e de tópicos;
- Lista de adjacência (grafo em dicionário) para as relações entre tópicos.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

CAMPOS_OBRIGATORIOS = [
    "identificador",
    "tema",
    "palavras_chave",
    "orientacao_resumida",
    "referencia_consultada",
    "data_verificacao",
]


class BaseConhecimentoErro(Exception):
    """Exceção base para erros de carregamento ou integridade da base."""


class BaseConhecimento:
    """Carrega, valida e indexa a base de orientações cidadãs."""

    def __init__(self, caminho_arquivo: Path | str) -> None:
        self.caminho_arquivo = Path(caminho_arquivo)
        self.versao: str = ""
        self.descricao: str = ""
        self.data_geracao: str = ""
        self.temas_meta: List[Dict[str, Any]] = []
        self._por_id: Dict[str, Dict[str, Any]] = {}
        self._por_tema: Dict[str, List[Dict[str, Any]]] = {}
        self._por_tema_subtema: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        self._grafo: Dict[str, List[str]] = {}
        self._erros_validacao: List[str] = []
        self.carregar()

    # ------------------------------------------------------------------
    # Carregamento e validação
    # ------------------------------------------------------------------
    def carregar(self) -> None:
        if not self.caminho_arquivo.exists():
            raise BaseConhecimentoErro(
                f"Arquivo da base de conhecimento não foi encontrado: {self.caminho_arquivo}"
            )

        try:
            conteudo = self.caminho_arquivo.read_text(encoding="utf-8").strip()
        except OSError as exc:
            raise BaseConhecimentoErro(
                f"Não foi possível ler o arquivo da base: {exc}"
            ) from exc

        if not conteudo:
            raise BaseConhecimentoErro(
                "O arquivo da base de conhecimento está vazio. "
                "Forneça um JSON com a estrutura esperada (temas e orientações)."
            )

        try:
            dados = json.loads(conteudo)
        except json.JSONDecodeError as exc:
            raise BaseConhecimentoErro(
                f"O arquivo contém JSON inválido na linha {exc.lineno}, "
                f"coluna {exc.colno}: {exc.msg}"
            ) from exc

        if not isinstance(dados, dict):
            raise BaseConhecimentoErro(
                "A estrutura raiz da base deve ser um objeto JSON."
            )

        self.versao = str(dados.get("versao_base", "desconhecida"))
        self.descricao = str(dados.get("descricao", ""))
        self.data_geracao = str(dados.get("data_geracao", ""))
        self.temas_meta = list(dados.get("temas", []))

        orientacoes = dados.get("orientacoes")
        if not isinstance(orientacoes, list) or len(orientacoes) == 0:
            raise BaseConhecimentoErro(
                "A base de conhecimento não contém registros de orientação. "
                "O campo 'orientacoes' deve ser uma lista com pelo menos um registro."
            )

        self._validar_e_indexar(orientacoes)

    def _validar_e_indexar(self, orientacoes: List[Any]) -> None:
        self._por_id.clear()
        self._por_tema.clear()
        self._por_tema_subtema.clear()
        self._grafo.clear()
        self._erros_validacao.clear()

        for idx, item in enumerate(orientacoes, start=1):
            if not isinstance(item, dict):
                self._erros_validacao.append(
                    f"Registro #{idx} não é um objeto JSON válido."
                )
                continue

            ident = str(item.get("identificador", "")).strip()
            if not ident:
                self._erros_validacao.append(
                    f"Registro #{idx} não possui 'identificador'."
                )
                continue

            faltantes = [
                campo
                for campo in CAMPOS_OBRIGATORIOS
                if campo not in item or self._esta_vazio(item[campo])
            ]
            if faltantes:
                self._erros_validacao.append(
                    f"Registro {ident} está incompleto — campos ausentes/vazios: "
                    + ", ".join(faltantes)
                )
                continue

            if ident in self._por_id:
                self._erros_validacao.append(
                    f"Identificador duplicado: '{ident}'."
                )
                continue

            registro = dict(item)
            tema = str(registro["tema"]).strip()
            subtema = str(registro.get("subtema", "Geral")).strip()

            self._por_id[ident] = registro
            self._por_tema.setdefault(tema, []).append(registro)
            self._por_tema_subtema.setdefault((tema, subtema), []).append(registro)
            self._grafo[ident] = [
                str(t).strip()
                for t in registro.get("topicos_relacionados", [])
                if str(t).strip()
            ]

        # Consistência das relações do grafo (alerta para links órfãos)
        for ident, relacionados in self._grafo.items():
            for rel in relacionados:
                if rel not in self._por_id:
                    self._erros_validacao.append(
                        f"Registro {ident} aponta para tópico relacionado inexistente '{rel}'."
                    )

    @staticmethod
    def _esta_vazio(valor: Any) -> bool:
        if valor is None:
            return True
        if isinstance(valor, str) and not valor.strip():
            return True
        if isinstance(valor, (list, dict)) and len(valor) == 0:
            return True
        return False

    # ------------------------------------------------------------------
    # Consultas
    # ------------------------------------------------------------------
    def total(self) -> int:
        return len(self._por_id)

    def listar_todos(self) -> List[Dict[str, Any]]:
        return list(self._por_id.values())

    def obter_por_id(self, identificador: str) -> Optional[Dict[str, Any]]:
        if not identificador:
            return None
        return self._por_id.get(identificador.strip().upper())

    def listar_temas(self) -> List[str]:
        return sorted(self._por_tema.keys())

    def listar_subtemas(self, tema: str) -> List[str]:
        subtemas = {
            sub
            for (t, sub) in self._por_tema_subtema.keys()
            if t.lower() == tema.strip().lower()
        }
        return sorted(subtemas)

    def listar_por_tema(self, tema: str) -> List[Dict[str, Any]]:
        for t, lista in self._por_tema.items():
            if t.lower() == tema.strip().lower():
                return list(lista)
        return []

    def listar_por_tema_e_subtema(self, tema: str, subtema: str) -> List[Dict[str, Any]]:
        t_alvo = tema.strip().lower()
        s_alvo = subtema.strip().lower()
        for (t, s), lista in self._por_tema_subtema.items():
            if t.lower() == t_alvo and s.lower() == s_alvo:
                return list(lista)
        return []

    def obter_relacionados(self, identificador: str) -> List[Dict[str, Any]]:
        ident = identificador.strip().upper()
        if ident not in self._grafo:
            return []
        resultado: List[Dict[str, Any]] = []
        for rel in self._grafo[ident]:
            reg = self._por_id.get(rel)
            if reg and reg not in resultado:
                resultado.append(reg)
        return resultado

    def mapa_relacoes(self) -> Dict[str, List[Dict[str, str]]]:
        """Retorna o grafo completo de tópicos com título resumido."""
        mapa: Dict[str, List[Dict[str, str]]] = {}
        for ident, reg in self._por_id.items():
            mapa[ident] = [
                {
                    "identificador": rel,
                    "titulo": self._por_id[rel].get("titulo", rel),
                }
                for rel in self._grafo.get(ident, [])
                if rel in self._por_id
            ]
        return mapa

    # ------------------------------------------------------------------
    # Extensão da base (requisito: permitir acrescentar/corrigir registros
    # sem reescrever as regras centrais do programa)
    # ------------------------------------------------------------------
    def adicionar_orientacao(self, novo: Dict[str, Any]) -> Tuple[bool, str]:
        ident = str(novo.get("identificador", "")).strip().upper()
        if not ident:
            return False, "O identificador é obrigatório (ex.: DOC-06)."
        if ident in self._por_id:
            return False, f"Já existe uma orientação com o identificador '{ident}'."

        for campo in CAMPOS_OBRIGATORIOS:
            if campo not in novo or self._esta_vazio(novo[campo]):
                return False, f"Campo obrigatório ausente ou vazio: '{campo}'."

        tema = str(novo["tema"]).strip()
        subtema = str(novo.get("subtema", "Geral")).strip()
        registro = dict(novo)
        registro["identificador"] = ident
        registro["tema"] = tema
        registro["subtema"] = subtema
        self._por_id[ident] = registro
        self._por_tema.setdefault(tema, []).append(registro)
        self._por_tema_subtema.setdefault((tema, subtema), []).append(registro)
        self._grafo[ident] = [
            str(t).strip()
            for t in registro.get("topicos_relacionados", [])
            if str(t).strip() and str(t).strip() in self._por_id
        ]
        return True, f"Orientação '{ident}' cadastrada com sucesso na memória."

    def salvar(self, destino: Optional[Path | str] = None) -> None:
        caminho = Path(destino) if destino else self.caminho_arquivo
        dados = {
            "versao_base": self.versao,
            "data_geracao": self.data_geracao,
            "descricao": self.descricao,
            "temas": self.temas_meta,
            "orientacoes": self.listar_todos(),
        }
        caminho.write_text(
            json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # ------------------------------------------------------------------
    # Diagnóstico
    # ------------------------------------------------------------------
    def relatorio_integridade(self) -> Dict[str, Any]:
        return {
            "arquivo": str(self.caminho_arquivo),
            "versao": self.versao,
            "total_registros": self.total(),
            "total_temas": len(self.listar_temas()),
            "erros_validacao": list(self._erros_validacao),
            "status": "válida" if not self._erros_validacao else "com inconsistências",
        }
