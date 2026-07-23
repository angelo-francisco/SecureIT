"""
Cross-platform hardware fingerprint generation for SecureIT.

Uses OS-assigned machine ID as primary signal, supplemented by
CPU model for robustness. Works on Windows, macOS, and Linux
(including Docker with privileged mode).

Zero external dependencies — uses only Python stdlib.
"""

import hashlib
import platform
import subprocess
import sys
from pathlib import Path
from typing import Optional


def _get_os_machine_id() -> Optional[str]:
    """
    Get the OS-native machine identifier.
    - Linux:  /etc/machine-id or /var/lib/dbus/machine-id
    - macOS:  IOPlatformUUID via ioreg
    - Windows: MachineGuid from HKLM\SOFTWARE\Microsoft\Cryptography
    """
    if sys.platform == "linux":
        for path in [
            "/etc/machine-id",
            "/var/lib/dbus/machine-id",
        ]:
            try:
                content = Path(path).read_text().strip()
                if content and content != "uninitialized":
                    return content
            except (FileNotFoundError, PermissionError):
                continue
        # Fallback: DMI product_uuid (available with privileged Docker)
        try:
            content = Path("/sys/class/dmi/id/product_uuid").read_text().strip()
            if content:
                return content
        except (FileNotFoundError, PermissionError):
            pass

    elif sys.platform == "darwin":
        try:
            output = subprocess.check_output(
                ["ioreg", "-d2", "-c", "IOPlatformExpertDevice"],
                text=True,
                timeout=5,
            )
            for line in output.split("\n"):
                if "IOPlatformUUID" in line:
                    return line.split('"')[-2]
        except Exception:
            pass

    elif sys.platform == "win32":
        try:
            import winreg

            key = winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                r"SOFTWARE\Microsoft\Cryptography",
            )
            value, _ = winreg.QueryValueEx(key, "MachineGuid")
            winreg.CloseKey(key)
            return value
        except Exception:
            pass

    return None


def _get_cpu_model() -> Optional[str]:
    """Get CPU model name (cross-platform)."""
    if sys.platform == "linux":
        try:
            for line in Path("/proc/cpuinfo").read_text().split("\n"):
                if "model name" in line:
                    return line.split(":", 1)[1].strip()
        except FileNotFoundError:
            pass
    elif sys.platform == "win32":
        try:
            output = subprocess.check_output(
                ["wmic", "cpu", "get", "Name"],
                text=True,
                timeout=5,
            )
            for line in output.split("\n"):
                stripped = line.strip()
                if stripped and stripped != "Name":
                    return stripped
        except Exception:
            pass
    elif sys.platform == "darwin":
        try:
            return subprocess.check_output(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                text=True,
                timeout=5,
            ).strip()
        except Exception:
            pass
    return None


def get_hardware_fingerprint(app_id: str = "secureit") -> str:
    """Generate a deterministic hardware fingerprint.

    Combines OS machine ID (primary, globally unique) with CPU model
    (secondary, adds robustness). The fingerprint is:
    - Stable across reboots and OS updates
    - Changes on OS reinstall or major hardware swap
    - Unique per machine (virtually zero collisions)

    Args:
        app_id: Application identifier to namespace the fingerprint.

    Returns:
        SHA-256 hex digest of the composite hardware signals.

    Raises:
        RuntimeError: If no stable OS identifier can be determined.
    """
    signals = []

    os_id = _get_os_machine_id()
    if os_id:
        signals.append(f"os_id:{os_id}")

    cpu = _get_cpu_model()
    if cpu:
        signals.append(f"cpu:{cpu}")

    signals.append(f"arch:{platform.machine()}")
    signals.append(f"app:{app_id}")

    if not any("os_id:" in s for s in signals):
        raise RuntimeError(
            "Cannot generate hardware fingerprint: "
            "no stable OS identifier found on this machine."
        )

    raw = "|".join(sorted(signals))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def get_hardware_info() -> dict:
    """
    Get detailed hardware information for debugging/display.
    Returns a dict with all collected signals.
    """
    return {
        "os_machine_id": _get_os_machine_id(),
        "cpu_model": _get_cpu_model(),
        "architecture": platform.machine(),
        "platform": platform.system(),
        "platform_release": platform.release(),
        "fingerprint": get_hardware_fingerprint(),
    }
