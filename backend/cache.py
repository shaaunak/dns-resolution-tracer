"""Our OWN application-level DNS cache (never a view into any remote server's cache).

Keyed on (domain, record_type). An entry lives for the MINIMUM TTL of the final
answer records (CNAME records included), the same rule real resolvers use.
The clock is injectable so expiry can be tested without sleeping.
"""
import math
import threading
import time
from dataclasses import dataclass
from typing import Callable

from models import DnsRecord


@dataclass(frozen=True)
class CacheHit:
    final_answer: list[DnsRecord]   # record TTLs already decremented by the entry's age
    remaining_ttl: int              # seconds left before this entry expires
    original_ttl: int
    age_s: float


@dataclass
class _Entry:
    records: list[DnsRecord]
    ttl: int
    stored_at: float
    expires_at: float


class DnsCache:
    def __init__(self, clock: Callable[[], float] = time.monotonic, max_entries: int = 1000):
        self._clock = clock
        self._max = max_entries
        self._data: dict[tuple[str, str], _Entry] = {}
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    @staticmethod
    def _key(domain: str, record_type: str) -> tuple[str, str]:
        return domain.strip().lower().rstrip("."), record_type.strip().upper()

    def get(self, domain: str, record_type: str) -> CacheHit | None:
        key, now = self._key(domain, record_type), self._clock()
        with self._lock:
            entry = self._data.get(key)
            if entry is not None and now >= entry.expires_at:  # TTL elapsed: evict, report a miss
                del self._data[key]
                entry = None
            if entry is None:
                self.misses += 1
                return None
            self.hits += 1
            age = now - entry.stored_at
            aged = int(age)
            records = [r.model_copy(update={"ttl": max(0, r.ttl - aged)}) for r in entry.records]
            return CacheHit(records, max(1, math.ceil(entry.expires_at - now)), entry.ttl, round(age, 3))

    def set(self, domain: str, record_type: str, records: list[DnsRecord], ttl: int | None) -> bool:
        """Store a successful answer. Returns False (stores nothing) if there is nothing cacheable."""
        if not records or ttl is None or ttl <= 0:
            return False
        now = self._clock()
        with self._lock:
            if len(self._data) >= self._max:
                self._data = {k: e for k, e in self._data.items() if e.expires_at > now}
                if len(self._data) >= self._max:  # still full: drop the oldest entry
                    oldest = min(self._data, key=lambda k: self._data[k].stored_at)
                    del self._data[oldest]
            self._data[self._key(domain, record_type)] = _Entry(list(records), ttl, now, now + ttl)
            return True

    def clear(self) -> int:
        with self._lock:
            n = len(self._data)
            self._data.clear()
            self.hits = self.misses = 0
            return n

    def __len__(self) -> int:
        with self._lock:
            return len(self._data)
