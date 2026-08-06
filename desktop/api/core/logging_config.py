import logging
import sys

from core.config import settings

LOG_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configure_logging() -> None:
    """Attach a stdout handler to the root logger.

    The desktop shell redirects the API's stdout/stderr into the per-run log
    file, so every record (DEBUG in dev, INFO+ in release) written by the app
    modules lands there too. Without a root handler Python's last-resort
    handler only emits WARNING+ to stderr and all logger.info()/debug() calls
    are silently dropped.
    """
    level = logging.DEBUG if settings.DEBUG else logging.INFO
    logging.basicConfig(
        level=level,
        format=LOG_FORMAT,
        datefmt=LOG_DATE_FORMAT,
        stream=sys.stdout,
        force=True,
    )
    logging.getLogger("tortoise").setLevel(logging.ERROR)
