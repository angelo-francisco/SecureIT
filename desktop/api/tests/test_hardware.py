import re

from core.hardware import get_hardware_fingerprint


async def test_fingerprint_returns_string():
    fp = get_hardware_fingerprint()
    assert isinstance(fp, str)
    assert len(fp) > 0


async def test_fingerprint_consistent():
    fp1 = get_hardware_fingerprint()
    fp2 = get_hardware_fingerprint()
    assert fp1 == fp2


async def test_fingerprint_format():
    fp = get_hardware_fingerprint()
    assert len(fp) == 64
    assert re.fullmatch(r"[0-9a-f]{64}", fp) is not None


async def test_fingerprint_no_exception():
    get_hardware_fingerprint()
