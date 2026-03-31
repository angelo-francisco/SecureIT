import subprocess
from platform import system as HOST_SYSTEM_NAME

from django.core.cache import cache


def get_binary_location(name: str) -> str:
    command = f"where {name}" if HOST_SYSTEM_NAME == "Windows" else f"which {name}"
    result = subprocess.run(
        command.split(" "),
        capture_output=True,
    )
    return result.stdout.decode()


def invalidate_cache(key):
    return cache.delete(key)
