import ipaddress

from engine.roots import ROOT_SERVERS, root_candidates


def test_thirteen_roots_a_to_m():
    assert len(ROOT_SERVERS) == 13
    assert [r.name[0] for r in ROOT_SERVERS] == list("abcdefghijklm")


def test_addresses_are_valid_and_unique():
    v4 = [ipaddress.IPv4Address(r.ipv4) for r in ROOT_SERVERS]
    v6 = [ipaddress.IPv6Address(r.ipv6) for r in ROOT_SERVERS]
    assert len(set(v4)) == 13 and len(set(v6)) == 13


def test_candidates_cover_all_roots_and_shuffle_keeps_members():
    ordered = root_candidates(shuffle=False)
    shuffled = root_candidates(shuffle=True)
    assert len(ordered) == 13
    assert set(ordered) == set(shuffled)


def test_ipv6_option():
    assert all(":" in ip for _, ip in root_candidates(use_ipv6=True))
