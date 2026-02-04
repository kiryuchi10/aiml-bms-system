"""
Application logging. Use env (e.g. LOG_LEVEL=INFO) to configure; do not commit log paths with secrets.
"""
import logging
import sys

from app.core.config import settings


def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
