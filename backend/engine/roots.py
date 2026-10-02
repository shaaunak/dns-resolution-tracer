"""Root server bootstrap data (IANA root hints, https://www.iana.org/domains/root/files)."""
import random
from dataclasses import dataclass


@dataclass(frozen=True)
class RootServer:
    name: str
    ipv4: str
    ipv6: str


ROOT_SERVERS: tuple[RootServer, ...] = (
    RootServer("a.root-servers.net", "198.41.0.4",     "2001:503:ba3e::2:30"),
    RootServer("b.root-servers.net", "170.247.170.2",  "2801:1b8:10::b"),
    RootServer("c.root-servers.net", "192.33.4.12",    "2001:500:2::c"),
    RootServer("d.root-servers.net", "199.7.91.13",    "2001:500:2d::d"),
    RootServer("e.root-servers.net", "192.203.230.10", "2001:500:a8::e"),
    RootServer("f.root-servers.net", "192.5.5.241",    "2001:500:2f::f"),
    RootServer("g.root-servers.net", "192.112.36.4",   "2001:500:12::d0d"),
    RootServer("h.root-servers.net", "198.97.190.53",  "2001:500:1::53"),
    RootServer("i.root-servers.net", "192.36.148.17",  "2001:7fe::53"),
    RootServer("j.root-servers.net", "192.58.128.30",  "2001:503:c27::2:30"),
    RootServer("k.root-servers.net", "193.0.14.129",   "2001:7fd::1"),
    RootServer("l.root-servers.net", "199.7.83.42",    "2001:500:9f::42"),
    RootServer("m.root-servers.net", "202.12.27.33",   "2001:dc3::35"),
)


def root_candidates(use_ipv6: bool = False, shuffle: bool = True) -> list[tuple[str, str]]:
    """Return [(name, ip), ...] in the order we should try them.

    Shuffled by default so we spread load and don't depend on one server.
    If a root is unreachable, the resolver simply moves to the next entry.
    IPv4 by default because many home/college networks have no IPv6 route.
    """
    pairs = [(r.name, r.ipv6 if use_ipv6 else r.ipv4) for r in ROOT_SERVERS]
    if shuffle:
        random.shuffle(pairs)
    return pairs
