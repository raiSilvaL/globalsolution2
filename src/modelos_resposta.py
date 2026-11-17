"""
Citizen Assist AI — Modelos de Resposta e Estratégias de Prompt

Documentação dos dois modelos de resposta exigidos pela especificação:

MODELO A — "Objetivo-Institucional"
- Papel: assistente informativo institucional de referência rápida;
- Tom: impessoal, direto, técnico na medida do público leigo;
- Estrutura:
    [TÍTULO + TEMA/SUBTEMA]
    [ORIENTAÇÃO RESUMIDA]
    [PASSO A PASSO ESSENCIAL]
    [FONTE OFICIAL COM DATA DE VERIFICAÇÃO]
    [AVISO DE CONFIRMAÇÃO OBRIGATÓRIO]
    [TÓPICOS RELACIONADOS];
- Obrigação: nunca responder sem citar a fonte; nunca alegar atendimento oficial;
  incluir aviso para confirmação nos canais do órgão responsável.

MODELO B — "Empático-Educativo (Linguagem Cidadã)"
- Papel: orientador comunitário acolhedor focado em inclusão e clareza;
- Tom: acolhedor, didático, em linguagem simples (princípios de Linguagem
  Cidadã / Plain Language), evitando jargões burocráticos;
- Estrutura:
    [SAUDAÇÃO ACOLHEDORA + TÍTULO DIDÁTICO]
    [EXPLICAÇÃO SIMPLES "O QUE VOCÊ PRECISA SABER"]
    [PASSO A PASSO GUIADO E NUMERADO]
    [DICA PRÁTICA DO DIA A DIA]
    [ONDE CONFERIR — FONTE OFICIAL COM DATA]
    [LEMBRETE ACOLHEDOR DE CONFIRMAÇÃO]
    [CONVITE PARA NAVEGAR NOS TÓPICOS RELACIONADOS];
- Obrigação: citar a fonte oficial e sua data; explicitar que o assistente
  é informativo e que requisitos devem ser confirmados com o órgão.

Ambos os modelos mantêm o mesmo conteúdo factual (dados da mesma base),
mas diferem em tom, vocabulário e organização visual — o que permite
comparação objetiva em baterias de teste.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

MODELO_PADRAO = "A"

MODELOS_INFO: Dict[str, Dict[str, str]] = {
    "A": {
        "nome": "Modelo A — Objetivo-Institucional",
        "papel": "Assistente institucional de referência rápida.",
        "tom": "Direto, conciso e formal, priorizando velocidade de leitura.",
        "publico_alvo": "Usuários habituados a documentos e formulários que buscam confirmação rápida.",
        "estrutura": "Cabeçalho temático > Resumo > Passos essenciais > Fonte oficial > Aviso de confirmação > Tópicos relacionados.",
        "obrigacoes": "Citar fonte com data; não alegar canal oficial; exigir confirmação de requisitos.",
    },
    "B": {
        "nome": "Modelo B — Empático-Educativo (Linguagem Cidadã)",
        "papel": "Orientador comunitário acolhedor, didático e inclusivo.",
        "tom": "Acolhedor, didático e em linguagem simples, sem jargões desnecessários.",
        "publico_alvo": "Cidadãos de qualquer perfil, inclusive com menor letramento digital ou burocrático.",
        "estrutura": "Saudação > Explicação simples > Passo a passo guiado > Dica prática > Onde conferir (fonte) > Lembrete acolhedor > Tópicos relacionados.",
        "obrigacoes": "Citar fonte com data; explicitar caráter informativo; incentivar confirmação no órgão oficial.",
    },
}


def descrever_modelo(modelo: str) -> Dict[str, str]:
    chave = (modelo or MODELO_PADRAO).strip().upper()
    return MODELOS_INFO.get(chave, MODELOS_INFO[MODELO_PADRAO])


def _relacionados(registro: Dict[str, Any], base_dados: Any, limite: int = 3) -> List[Dict[str, Any]]:
    if base_dados is not None:
        regs = base_dados.obter_relacionados(registro["identificador"])
        return regs[:limite]
    return []


# ----------------------------------------------------------------------
# FORMATADORES DO MODELO A
# ----------------------------------------------------------------------
def _formata_a(registro: Dict[str, Any], base_dados: Any) -> str:
    titulo = registro.get("titulo", "")
    ident = registro.get("identificador", "")
    tema = registro.get("tema", "")
    subtema = registro.get("subtema", "Geral")
    resumo = registro.get("orientacao_resumida", "")
    passos = registro.get("passos", [])
    aviso = registro.get("aviso", "")
    fonte = registro.get("referencia_consultada", "")
    data = registro.get("data_verificacao", "")
    relacionados = _relacionados(registro, base_dados)

    linhas: List[str] = [
        "=" * 70,
        f"[{ident}] {titulo}",
        f"Tema: {tema}  |  Subtema: {subtema}",
        "-" * 70,
        "",
        "ORIENTAÇÃO:",
        resumo,
        "",
    ]

    if passos:
        linhas.append("PASSO A PASSO RECOMENDADO:")
        for idx, passo in enumerate(passos, start=1):
            linhas.append(f"  {idx}. {passo}")
        linhas.append("")

    linhas.extend([
        "FONTE CONSULTADA (verificada em " + data + "):",
        f"  {fonte}",
        "",
        "AVISO DE CONFIRMAÇÃO:",
        f"  * {aviso}",
        "  * Confirme sempre prazos, taxas e requisitos atualizados junto ao órgão responsável,",
        "    pois regras administrativas podem sofrer alterações após a data de verificação.",
        "",
    ])

    if relacionados:
        linhas.append("TÓPICOS RELACIONADOS PARA CONTINUAR SUA CONSULTA:")
        for idx, rel in enumerate(relacionados, start=1):
            linhas.append(
                f"  [R{idx}] {rel['identificador']} — {rel['titulo']} ({rel['tema']})"
            )
        linhas.append("")

    linhas.append("=" * 70)
    return "\n".join(linhas)


# ----------------------------------------------------------------------
# FORMATADORES DO MODELO B
# ----------------------------------------------------------------------
def _formata_b(registro: Dict[str, Any], base_dados: Any) -> str:
    titulo = registro.get("titulo", "")
    ident = registro.get("identificador", "")
    resumo = registro.get("orientacao_resumida", "")
    detalhe = registro.get("orientacao_detalhada", "")
    passos = registro.get("passos", [])
    aviso = registro.get("aviso", "")
    fonte = registro.get("referencia_consultada", "")
    data = registro.get("data_verificacao", "")
    relacionados = _relacionados(registro, base_dados)

    linhas: List[str] = [
        "*" * 70,
        f"  CITIZEN ASSIST AI  —  {titulo} (Código: {ident})",
        "*" * 70,
        "",
        "Olá! Entendi a sua dúvida. Segue a orientação que encontrei na nossa base:",
        "",
        "O QUE VOCÊ PRECISA SABER:",
        resumo,
    ]

    if detalhe:
        linhas.extend(["", detalhe])

    if passos:
        linhas.extend(["", "COMO FAZER, PASSO A PASSO:"])
        for idx, passo in enumerate(passos, start=1):
            linhas.append(f"  {idx}) {passo}")

    linhas.extend([
        "",
        "DICA PRÁTICA:",
        "  Prefira sempre os canais oficiais pela internet ou aplicativo; eles costumam",
        "  ser mais rápidos e evitam deslocamentos desnecessários.",
        "",
        f"ONDE CONFERIR ESSA INFORMAÇÃO:",
        f"  Fonte oficial: {fonte}",
        f"  Informação verificada pela equipe em: {data}",
        "",
        "LEMBRETE IMPORTANTE:",
        f"  {aviso}",
        "  Este assistente é apenas informativo. Antes de ir até um órgão público,",
        "  confirme os documentos e agendamentos exigidos no próprio canal oficial.",
        "",
    ])

    if relacionados:
        linhas.append("ASSUNTOS PARECIDOS QUE PODEM TE AJUDAR:")
        for idx, rel in enumerate(relacionados, start=1):
            linhas.append(
                f"  Opção [R{idx}] - {rel['identificador']}: {rel['titulo']} — do tema '{rel['tema']}'"
            )
        linhas.append("")

    linhas.append("*" * 70)
    return "\n".join(linhas)


# ----------------------------------------------------------------------
# API pública
# ----------------------------------------------------------------------
def formatar_resposta(
    registro: Dict[str, Any],
    modelo: str = MODELO_PADRAO,
    base_dados: Any = None,
) -> str:
    chave = (modelo or MODELO_PADRAO).strip().upper()
    if chave == "B":
        return _formata_b(registro, base_dados)
    return _formata_a(registro, base_dados)


def formatar_aviso_limite(
    mensagem_buscador: str,
    temas_disponiveis: List[str],
    modelo: str = MODELO_PADRAO,
) -> str:
    chave = (modelo or MODELO_PADRAO).strip().upper()
    temas_formatados = "\n".join(f"  - {t}" for t in temas_disponiveis)

    if chave == "B":
        return "\n".join([
            "-" * 70,
            "AVISO DO ASSISTENTE — LIMITAÇÃO DA BASE DE CONHECIMENTO",
            "-" * 70,
            mensagem_buscador,
            "",
            "Temas que consigo te ajudar no momento:",
            temas_formatados,
            "",
            "Para outras dúvidas oficiais, procure o portal gov.br, a prefeitura da",
            "sua cidade ou a central telefônica 156 (ou o número de serviços do seu município).",
            "Lembrando: este assistente não é canal oficial do governo.",
            "-" * 70,
        ])

    return "\n".join([
        "=" * 70,
        "LIMITAÇÃO DE CONTEÚDO",
        "=" * 70,
        mensagem_buscador,
        "",
        "Temas cadastrados disponíveis:",
        temas_formatados,
        "",
        "Canal oficial recomendado: https://gov.br",
        "Este protótipo tem finalidade exclusivamente informativa.",
        "=" * 70,
    ])


def formatar_ambiguidade(
    candidatos: List[Any],
    modelo: str = MODELO_PADRAO,
) -> str:
    chave = (modelo or MODELO_PADRAO).strip().upper()
    linhas: List[str] = [
        "-" * 70,
        "SUA PERGUNTA PODE SE REFERIR A MAIS DE UM ASSUNTO:",
        "-" * 70,
    ]
    for idx, c in enumerate(candidatos, start=1):
        reg = c.registro
        linhas.append(
            f"  [{idx}] {reg['identificador']} — {reg['titulo']} "
            f"(tema: {reg['tema']}) [relevância: {c.score:.1f}]"
        )
    linhas.extend([
        "",
        "Digite o número da opção desejada para ver a orientação completa,"
        if chave == "A"
        else "Escolha o número que mais tem a ver com o que você procura:",
        "-" * 70,
    ])
    return "\n".join(linhas)


def formatar_entrada_vazia(modelo: str = MODELO_PADRAO) -> str:
    chave = (modelo or MODELO_PADRAO).strip().upper()
    if chave == "B":
        return (
            "\n[Aviso] Você não digitou nada. Experimente escrever uma dúvida, por exemplo:\n"
            "   'Como faço para regularizar o CPF?'\n"
            "   'Onde fica o CRAS da minha cidade?'\n"
            "Ou volte ao menu digitando 'menu'."
        )
    return (
        "\n[Entrada inválida] A pergunta não pode estar vazia. "
        "Formule sua consulta ou digite 'menu' para retornar ao menu principal."
    )


def formatar_opcao_invalida() -> str:
    return "\n[Opção inválida] Por favor, digite um número correspondente a uma das opções do menu.\n"
