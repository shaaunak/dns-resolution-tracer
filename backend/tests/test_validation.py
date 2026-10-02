import pytest

from engine.validation import (MAX_DOMAIN_LENGTH, SUPPORTED_RECORD_TYPES,
                               InputValidationError, normalize_domain,
                               validate_record_type)
from models import ErrorCode


# ---------- valid domains ----------
@pytest.mark.parametrize("raw, expected", [
    ("google.com", "google.com"),
    ("GOOGLE.COM", "google.com"),
    ("  google.com  ", "google.com"),
    ("google.com.", "google.com"),                  # trailing dot (FQDN form)
    ("www.example.co.uk", "www.example.co.uk"),
    ("my-site.example.org", "my-site.example.org"),
    ("_dmarc.example.com", "_dmarc.example.com"),   # underscore labels exist in TXT use
    ("a1.b2.c3.example.net", "a1.b2.c3.example.net"),
    ("bücher.de", "xn--bcher-kva.de"),              # IDN -> punycode
    ("com", "com"),                                 # single label: legal to query
])
def test_valid_domains(raw, expected):
    assert normalize_domain(raw) == expected


# ---------- invalid domains ----------
@pytest.mark.parametrize("raw", [
    "",
    "   ",
    ".",
    "google..com",
    ".google.com",
    "-bad.com",
    "bad-.com",
    "exa mple.com",
    "http://google.com",
    "google.com/path",
    "user@google.com",
    "google.com:8080",
    "2001:db8::1",
    "8.8.8.8",
    "exa$mple.com",
    "a" * 64 + ".com",                              # label too long
    ".".join(["abcdefghij"] * 26) + ".com",         # whole name too long
    "x" * 301,                                      # raw input too long
])
def test_invalid_domains(raw):
    with pytest.raises(InputValidationError) as err:
        normalize_domain(raw)
    assert err.value.code == ErrorCode.INVALID_DOMAIN
    assert err.value.message


@pytest.mark.parametrize("raw", [None, 123, ["google.com"], {"a": 1}])
def test_non_string_domain_rejected(raw):
    with pytest.raises(InputValidationError):
        normalize_domain(raw)


def test_max_length_domain_accepted():
    # 3 labels of 63 + 1 label of 61 + 3 dots = 253 chars
    name = ".".join(["a" * 63, "b" * 63, "c" * 63, "d" * 61])
    assert len(name) == MAX_DOMAIN_LENGTH
    assert normalize_domain(name) == name


# ---------- record types ----------
@pytest.mark.parametrize("rtype", SUPPORTED_RECORD_TYPES)
def test_supported_record_types(rtype):
    assert validate_record_type(rtype) == rtype


def test_record_type_is_case_insensitive_and_trimmed():
    assert validate_record_type(" aaaa ") == "AAAA"
    assert validate_record_type("mx") == "MX"


@pytest.mark.parametrize("raw", ["", "SOA", "PTR", "ANY", "FOO", "A; DROP TABLE", "x" * 500])
def test_invalid_record_types(raw):
    with pytest.raises(InputValidationError) as err:
        validate_record_type(raw)
    assert err.value.code == ErrorCode.INVALID_RECORD_TYPE


def test_non_string_record_type_rejected():
    with pytest.raises(InputValidationError):
        validate_record_type(None)
