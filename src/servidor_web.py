#!/usr/bin/env python3
"""
Citizen Assist AI — Servidor Web Local (biblioteca padrão)
Serve a interface acessível do assistente e a base de conhecimento.

Uso:
    python src/servidor_web.py
    python src/servidor_web.py --porta 8080
"""

from __future__ import annotations

import argparse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class CitizenAssistHandler(SimpleHTTPRequestHandler):
    """Serve /web por padrão e expõe /data e /reports sob o mesmo host."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_GET(self) -> None:
        if self.path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/web/")
            self.end_headers()
            return
        if self.path == "/web":
            self.send_response(301)
            self.send_header("Location", "/web/")
            self.end_headers()
            return
        return super().do_GET()

    def log_message(self, fmt: str, *args) -> None:
        # Silencia a maioria dos logs para deixar a saída limpa
        if "404" in fmt % args:
            super().log_message(fmt, *args)


def main() -> None:
    parser = argparse.ArgumentParser(description="Servidor web do Citizen Assist AI")
    parser.add_argument("--porta", "-p", type=int, default=8000, help="Porta TCP (padrão 8000)")
    parser.add_argument("--bind", "-b", default="0.0.0.0", help="Endereço de bind (padrão 0.0.0.0)")
    args = parser.parse_args()

    server = HTTPServer((args.bind, args.porta), CitizenAssistHandler)
    print("=" * 66)
    print("  CITIZEN ASSIST AI — SERVIDOR WEB LOCAL")
    print("=" * 66)
    print(f"  Interface pronta em:   http://localhost:{args.porta}/web/")
    print(f"  Base de conhecimento: http://localhost:{args.porta}/data/base_conhecimento.json")
    print("  Pressione CTRL+C para encerrar.")
    print("=" * 66)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor finalizado.")


if __name__ == "__main__":
    main()
