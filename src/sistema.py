#!/usr/bin/env python3
"""
Citizen Assist AI — Assistente Digital de Orientação Cidadã
Global Solution FIAP 2026.2 — Tema: CitizenTech

Como executar:
    python src/sistema.py
    python src/sistema.py --test            (executa testes automatizados)
    python src/sistema.py --modelo B        (inicia com Modelo B)

Equipe: CitizenTech Team (preencher no README com nomes e RMs dos integrantes)
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

# Garante que os módulos locais em src/ sejam importáveis
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.base_dados import BaseConhecimento, BaseConhecimentoErro  # noqa: E402
from src.buscador import Buscador, ResultadoBusca  # noqa: E402
from src.modelos_resposta import (  # noqa: E402
    descrever_modelo,
    formatar_ambiguidade,
    formatar_aviso_limite,
    formatar_entrada_vazia,
    formatar_opcao_invalida,
    formatar_resposta,
)
from src.navegador import (  # noqa: E402
    NavegadorHierarquico,
    VisualizadorGrafo,
    interpretar_comando_relacionado,
)

CAMINHO_BASE_PADRAO = BASE_DIR / "data" / "base_conhecimento.json"


BANNER = """
======================================================================
  CITIZEN ASSIST AI — Assistente Digital de Orientação Cidadã
  Global Solution FIAP 2026.2 | Desafio: CitizenTech
======================================================================
"""

AVISO_PRIVACIDADE = """
[AVISO ÉTICO E DE PRIVACIDADE]
- Este é um protótipo acadêmico informativo. NÃO é um canal oficial de
  atendimento de nenhum órgão público;
- NÃO solicitamos nem armazenamos dados pessoais (nome, CPF, endereço);
- Todas as orientações foram conferidas em fontes oficiais identificáveis;
- Requisitos, taxas e procedimentos devem ser SEMPRE confirmados diretamente
  nos canais oficiais do órgão responsável.
======================================================================
"""


class SistemaCitizenAssist:
    """Orquestrador da experiência interativa de consulta cidadã."""

    def __init__(
        self,
        caminho_base: Path = CAMINHO_BASE_PADRAO,
        modelo_resposta: str = "A",
    ) -> None:
        self.caminho_base = caminho_base
        self.modelo = modelo_resposta.upper()
        self.base = BaseConhecimento(caminho_base)
        self.buscador = Buscador(self.base)
        self.navegador = NavegadorHierarquico(self.base)
        self.grafo = VisualizadorGrafo(self.base)

    # ------------------------------------------------------------------
    # Telas informativas
    # ------------------------------------------------------------------
    def cabecalho(self) -> None:
        print(BANNER)
        print(f"Base: {self.base.caminho_arquivo.name} | Registros: {self.base.total()} | "
              f"Temas: {len(self.base.listar_temas())} | Termos indexados: {self.buscador.total_termos_indexados()}")
        print(f"Modelo de resposta ativo: {self.modelo} — {descrever_modelo(self.modelo)['nome']}")
        print(AVISO_PRIVACIDADE)

    def menu_principal(self) -> None:
        print("""
MENU PRINCIPAL
  [1] Consultar por Pergunta Livre (busca inteligente)
  [2] Navegar por Temas e Subtemas (menu hierárquico)
  [3] Visualizar Mapa de Tópicos e Relações (grafo do conhecimento)
  [4] Executar Bateria de Testes Automatizados (indicadores)
  [5] Gerenciar Base de Conhecimento (adicionar/validar)
  [6] Alternar Modelo de Resposta (Modelo A vs Modelo B)
  [7] Sobre o Sistema, Privacidade e Limitações
  [0] Sair
""")

    # ------------------------------------------------------------------
    # Fluxo 1: Pergunta Livre
    # ------------------------------------------------------------------
    def fluxo_pergunta_livre(self) -> None:
        print("\n" + "=" * 70)
        print("CONSULTA POR PERGUNTA LIVRE")
        print("Digite sua pergunta em linguagem natural (ex.: 'Como regularizar o CPF?')")
        print("ou informe o código da orientação (ex.: 'DOC-01'). Digite 'menu' para voltar.")
        print("=" * 70)

        while True:
            try:
                pergunta = input("\nSua dúvida: ").strip()
            except (KeyboardInterrupt, EOFError):
                print("\nOperação cancelada.")
                break

            if pergunta.lower() in ("menu", "sair", "voltar"):
                break

            if not pergunta:
                print(formatar_entrada_vazia(self.modelo))
                continue

            t0 = time.perf_counter()
            resultado: ResultadoBusca = self.buscador.buscar(pergunta)
            t_ms = (time.perf_counter() - t0) * 1000

            print(f"\n[Resultado da busca — tempo de consulta: {t_ms:.1f} ms]")

            if resultado.status == "SUCESSO" and resultado.registro:
                print(formatar_resposta(resultado.registro, self.modelo, self.base))
                self._ciclo_relacionados(resultado.registro)
                continue

            if resultado.status == "AMBIGUO":
                print(formatar_ambiguidade(resultado.candidatos, self.modelo))
                escolha = self._ler_opcao_numerica(
                    len(resultado.candidatos), "Escolha uma opção (ou 0 para cancelar): "
                )
                if escolha and 1 <= escolha <= len(resultado.candidatos):
                    reg = resultado.candidatos[escolha - 1].registro
                    print(formatar_resposta(reg, self.modelo, self.base))
                    self._ciclo_relacionados(reg)
                continue

            # SEM_CORRESPONDENCIA ou ENTRADA_VAZIA
            print(
                formatar_aviso_limite(
                    resultado.mensagem, self.base.listar_temas(), self.modelo
                )
            )

    def _ciclo_relacionados(self, registro_atual: Dict[str, Any]) -> None:
        """Permite que o usuário continue navegando por tópicos relacionados."""
        atual = registro_atual
        while True:
            relacionados = self.base.obter_relacionados(atual["identificador"])
            if not relacionados:
                break
            try:
                comando = input(
                    "\nDigite R1/R2/R3 para ir a um tópico relacionado, 'outra' para nova pergunta, ou 'menu' para voltar: "
                ).strip()
            except (KeyboardInterrupt, EOFError):
                break

            if comando.lower() in ("menu", "voltar", "sair"):
                break
            if comando.lower() in ("outra", "nova"):
                break

            proximo = interpretar_comando_relacionado(comando, relacionados)
            if proximo:
                atual = proximo
                print("\n" + formatar_resposta(atual, self.modelo, self.base))
            else:
                print("Comando não reconhecido. Digite R1/R2/R3, 'outra' ou 'menu'.")

    # ------------------------------------------------------------------
    # Fluxo 2: Navegação Hierárquica
    # ------------------------------------------------------------------
    def fluxo_navegacao_hierarquica(self) -> None:
        while True:
            print(self.navegador.menu_temas())
            opcao = self._ler_opcao_numerica(
                len(self.base.listar_temas()), "Escolha um tema (ou 0 para voltar): "
            )
            if opcao is None or opcao == 0:
                break

            tema = self.navegador.obter_tema_por_opcao(opcao)
            if not tema:
                continue

            while True:
                print(self.navegador.menu_subtemas(tema))
                sub_opcao = self._ler_opcao_numerica(
                    len(self.base.listar_subtemas(tema)) + 1, "Escolha uma opção: "
                )
                if sub_opcao is None or sub_opcao == 0:
                    break

                subtema, listar_todas = self.navegador.obter_subtema_por_opcao(
                    tema, sub_opcao
                )
                if listar_todas:
                    orientacoes = self.base.listar_por_tema(tema)
                    titulo = f"ORIENTAÇÕES — TEMA: {tema.upper()}"
                elif subtema:
                    orientacoes = self.base.listar_por_tema_e_subtema(tema, subtema)
                    titulo = f"ORIENTAÇÕES — {subtema.upper()}"
                else:
                    continue

                if not orientacoes:
                    print("\n[Aviso] Nenhuma orientação encontrada neste agrupamento.")
                    continue

                while True:
                    print(self.navegador.menu_orientacoes(orientacoes, titulo))
                    sel = self._ler_opcao_numerica(
                        len(orientacoes), "Escolha uma orientação (ou 0 para voltar): "
                    )
                    if sel is None or sel == 0:
                        break
                    reg = orientacoes[sel - 1]
                    print("\n" + formatar_resposta(reg, self.modelo, self.base))
                    self._ciclo_relacionados(reg)

    # ------------------------------------------------------------------
    # Fluxo 3: Grafo
    # ------------------------------------------------------------------
    def fluxo_grafo(self) -> None:
        print(self.grafo.renderizar())
        self._pausa()

    # ------------------------------------------------------------------
    # Fluxo 4: Testes automatizados
    # ------------------------------------------------------------------
    def fluxo_testes(self) -> None:
        from tests.executar_testes import BateriaDeTestes

        bateria = BateriaDeTestes(self.base, self.buscador, self.modelo)
        bateria.executar_e_imprimir()
        self._pausa()

    # ------------------------------------------------------------------
    # Fluxo 5: Gestão da base
    # ------------------------------------------------------------------
    def fluxo_gestao_base(self) -> None:
        while True:
            print("\n" + "-" * 70)
            print("GERENCIAMENTO DA BASE DE CONHECIMENTO")
            print("-" * 70)
            print("  [1] Validar integridade da base atual")
            print("  [2] Adicionar nova orientação (em memória)")
            print("  [3] Adicionar nova orientação e salvar no arquivo JSON")
            print("  [0] Voltar")
            opcao = self._ler_opcao_numerica(3, "Escolha: ")
            if opcao is None or opcao == 0:
                break
            if opcao == 1:
                rel = self.base.relatorio_integridade()
                print(f"\nArquivo: {rel['arquivo']}")
                print(f"Status: {rel['status']}")
                print(f"Registros: {rel['total_registros']} | Temas: {rel['total_temas']}")
                if rel["erros_validacao"]:
                    print("Inconsistências encontradas:")
                    for e in rel["erros_validacao"]:
                        print(f"  * {e}")
                else:
                    print("Nenhum problema de integridade encontrado. Todos os campos")
                    print("obrigatórios e relações do grafo estão consistentes.")
                self._pausa()
            elif opcao in (2, 3):
                salvar = (opcao == 3)
                self._adicionar_orientacao_wizard(salvar=salvar)

    def _adicionar_orientacao_wizard(self, salvar: bool) -> None:
        print("\n=== Cadastro de Nova Orientação ===")
        try:
            ident = input("Identificador único (ex.: COM-05): ").strip().upper()
            tema = input("Tema (ex.: Orientações Comunitárias e Emergências): ").strip()
            subtema = input("Subtema: ").strip() or "Geral"
            titulo = input("Título: ").strip()
            pergunta = input("Pergunta modelo do usuário: ").strip()
            keywords = [
                k.strip()
                for k in input("Palavras-chave (separadas por vírgula): ").split(",")
                if k.strip()
            ]
            resumo = input("Orientação resumida (resposta principal): ").strip()
            fonte = input("Referência consultada (órgão/lei + link): ").strip()
            data = input("Data de verificação (DD/MM/AAAA): ").strip() or time.strftime("%d/%m/%Y")
            aviso = input("Aviso de confirmação ao cidadão: ").strip()
            rels = [
                r.strip().upper()
                for r in input("Tópicos relacionados (códigos separados por vírgula, ex.: COM-01, DIR-02): ").split(",")
                if r.strip()
            ]
        except (KeyboardInterrupt, EOFError):
            print("\nCadastro cancelado.")
            return

        novo = {
            "identificador": ident,
            "tema": tema,
            "subtema": subtema,
            "titulo": titulo,
            "pergunta_modelo": pergunta,
            "palavras_chave": keywords,
            "orientacao_resumida": resumo,
            "referencia_consultada": fonte,
            "data_verificacao": data,
            "aviso": aviso,
            "topicos_relacionados": rels,
        }
        ok, msg = self.base.adicionar_orientacao(novo)
        print(("\n[OK] " if ok else "\n[ERRO] ") + msg)
        if ok and salvar:
            try:
                self.base.salvar()
                print(f"[OK] Base persistida em: {self.base.caminho_arquivo}")
            except Exception as exc:
                print(f"[ERRO] Falha ao salvar no arquivo: {exc}")
        if ok:
            self.buscador = Buscador(self.base)
        self._pausa()

    # ------------------------------------------------------------------
    # Fluxo 6: Alternar modelo de resposta
    # ------------------------------------------------------------------
    def fluxo_alternar_modelo(self) -> None:
        print("\n" + "-" * 70)
        print("MODELOS DE RESPOSTA (ESTRATÉGIAS DE PROMPT)")
        print("-" * 70)
        for chave, info in descrever_modelo("A") and (  # noqa
            ("A", descrever_modelo("A")),
            ("B", descrever_modelo("B")),
        ):
            marcador = " [ATIVO]" if self.modelo == chave else ""
            print(f"{info['nome']}{marcador}")
            print(f"  Papel: {info['papel']}")
            print(f"  Tom: {info['tom']}")
            print(f"  Público-alvo: {info['publico_alvo']}")
            print(f"  Estrutura: {info['estrutura']}")
            print(f"  Obrigações: {info['obrigacoes']}\n")

        print("Alternar para:")
        print("  [1] Modelo A — Objetivo-Institucional")
        print("  [2] Modelo B — Empático-Educativo (Linguagem Cidadã)")
        print("  [0] Manter modelo atual")
        opcao = self._ler_opcao_numerica(2, "Escolha: ")
        if opcao == 1:
            self.modelo = "A"
            print("[OK] Modelo A ativado.")
        elif opcao == 2:
            self.modelo = "B"
            print("[OK] Modelo B ativado.")
        self._pausa()

    # ------------------------------------------------------------------
    # Fluxo 7: Sobre o sistema
    # ------------------------------------------------------------------
    def fluxo_sobre(self) -> None:
        print("\n" + "=" * 70)
        print("SOBRE O CITIZEN ASSIST AI")
        print("=" * 70)
        print("""
Projeto desenvolvido para a Global Solution do 2º semestre de 2026 da FIAP,
sob o tema "CitizenTech: tecnologias orientadas às necessidades reais das pessoas".

OBJETIVO:
Facilitar o acesso a informações confiáveis sobre serviços públicos,
documentação básica, direitos e orientações comunitárias no Brasil,
utilizando estruturas de dados simples (listas, dicionários, índices
invertidos), algoritmos de busca e ranqueamento, e estratégias de
instrução/resposta (modelos de prompt) com fontes verificadas.

PÚBLICO BENEFICIADO:
Cidadãos em geral, com atenção a pessoas de baixa renda, idosos,
trabalhadores demitidos e famílias vulneráveis que buscam orientações
claras sem burocracia desnecessária.

CUIDADOS ÉTICOS:
- Não coleta nem armazena dados pessoais;
- Não se apresenta como canal oficial do poder público;
- Cita a fonte consultada e a data de verificação em TODAS as respostas;
- Exibe avisos explícitos para confirmação de requisitos nos canais oficiais;
- Declara limitações de conteúdo e sugere canais institucionais oficiais
  (gov.br, 135, 156, 199, 193, 100, 180, consumidor.gov.br).

ESTRUTURA TÉCNICA PRINCIPAL:
- base_conhecimento.json -> BaseConhecimento (leitura, validação, dicts e grafo);
- buscador.py -> normalização, índice invertido, scoring ponderado, ambiguidade;
- modelos_resposta.py -> Modelos A e B com citações obrigatórias;
- navegador.py -> hierarquia Tema/Subtema e renderização do grafo;
- executar_testes.py -> bateria com >=15 cenários, métricas de acerto e tempo.
""")
        self._pausa()

    # ------------------------------------------------------------------
    # Loop principal
    # ------------------------------------------------------------------
    def executar(self) -> None:
        self.cabecalho()
        while True:
            self.menu_principal()
            opcao = self._ler_opcao_numerica(7, "Digite a opção desejada: ")
            if opcao is None:
                continue
            if opcao == 0:
                print("\nEncerrando o Citizen Assist AI. Cidadania informada é cidadania forte. Até logo!\n")
                break
            if opcao == 1:
                self.fluxo_pergunta_livre()
            elif opcao == 2:
                self.fluxo_navegacao_hierarquica()
            elif opcao == 3:
                self.fluxo_grafo()
            elif opcao == 4:
                self.fluxo_testes()
            elif opcao == 5:
                self.fluxo_gestao_base()
            elif opcao == 6:
                self.fluxo_alternar_modelo()
            elif opcao == 7:
                self.fluxo_sobre()

    # ------------------------------------------------------------------
    # Utilitários de entrada
    # ------------------------------------------------------------------
    @staticmethod
    def _ler_opcao_numerica(maximo: int, prompt: str) -> Optional[int]:
        try:
            entrada = input(prompt).strip()
        except (KeyboardInterrupt, EOFError):
            print("\nOperação cancelada.")
            return 0
        if not entrada.isdigit():
            print(formatar_opcao_invalida())
            return None
        valor = int(entrada)
        if valor < 0 or valor > maximo:
            print(f"\n[Opção inexistente] Escolha um número entre 0 e {maximo}.\n")
            return None
        return valor

    @staticmethod
    def _pausa() -> None:
        try:
            input("\nPressione ENTER para voltar ao menu...")
        except (KeyboardInterrupt, EOFError):
            pass


# ----------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Citizen Assist AI — Assistente Digital de Orientação Cidadã (FIAP GS 2026.2)"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Executa a bateria de testes automatizados sem iniciar o modo interativo.",
    )
    parser.add_argument(
        "--modelo",
        choices=["A", "B"],
        default="A",
        help="Modelo de resposta inicial (padrão: A).",
    )
    parser.add_argument(
        "--base",
        type=Path,
        default=CAMINHO_BASE_PADRAO,
        help="Caminho alternativo para o arquivo JSON da base de conhecimento.",
    )
    args = parser.parse_args()

    try:
        sistema = SistemaCitizenAssist(caminho_base=args.base, modelo_resposta=args.modelo)
    except BaseConhecimentoErro as exc:
        print(f"\n[ERRO CRÍTICO] Falha ao inicializar a base de conhecimento:\n  {exc}", file=sys.stderr)
        sys.exit(1)

    if args.test:
        from tests.executar_testes import BateriaDeTestes

        bateria = BateriaDeTestes(sistema.base, sistema.buscador, args.modelo)
        ok = bateria.executar_e_imprimir()
        sys.exit(0 if ok else 1)

    sistema.executar()


if __name__ == "__main__":
    main()
