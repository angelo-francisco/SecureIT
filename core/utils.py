import subprocess
from platform import system as HOST_SYSTEM_NAME


def get_binary_location(name: str) -> str:
    command = f"where {name}" if HOST_SYSTEM_NAME == "Windows" else f"which {name}"
    locations = subprocess.run(command.split(" "))
    return str(locations).split("\n")[0]
