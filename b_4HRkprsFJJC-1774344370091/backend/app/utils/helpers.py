"""General utility functions used across the backend."""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any


def utcnow() -> datetime:
    """Return a timezone-aware UTC datetime."""
    return datetime.now(tz=timezone.utc)


def sha256_hex(value: str) -> str:
    """Return the SHA-256 hex digest of a string — useful for hashing keys."""
    return hashlib.sha256(value.encode()).hexdigest()


def safe_divide(numerator: float, denominator: float, *, default: float = 0.0) -> float:
    """Return numerator/denominator or *default* if denominator is zero."""
    return (numerator / denominator) if denominator else default


def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    """Clamp *value* between *lo* and *hi*."""
    return max(lo, min(hi, value))


def round2(value: float) -> float:
    """Round to 2 decimal places."""
    # Multiply by 100, add 0.5 to round, and floor
    return int(float(value) * 100 + 0.5) / 100.0


def flatten_metadata(meta: dict[str, Any] | None) -> str:
    """Stringify metadata for logging — never raises."""
    if not meta:
        return "{}"
    try:
        import json
        return json.dumps(meta, default=str)
    except Exception:
        return str(meta)
