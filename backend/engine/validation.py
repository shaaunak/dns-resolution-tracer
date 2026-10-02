"""Validate and normalise user input (domain name + record type)."""
import re

from models import ErrorCode

SUPPORTED_RECORD_TYPES: tuple[str, ...] = ("A", "AAAA", "CNAME", "NS", "MX", "TXT")

MAX_RAW_INPUT_LENGTH = 300     # reject absurd input before doing any work
MAX_DOMAIN_LENGTH = 253        # RFC 1035: 255 octets on the wire = 253 printable chars
MAX_LABEL_LENGTH = 63          # RFC 1035: one label (part between dots) is max 63 chars

# letters, digits, hyphen; underscore allowed because real DNS names such as
# _dmarc.example.com (TXT records) use it. Hyphen cannot start or end a label.
_LABEL_RE = re.compile(r"^(?!-)[a-z0-9_-]{1,63}(?<!-)$")


class InputValidationError(Exception):
    """Raised for malformed user input. Carries a machine-readable code."""

    def __init__(self, code: ErrorCode, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def normalize_domain(raw: object) -> str:
    """Return a clean lowercase ASCII domain, or raise InputValidationError.

    - strips surrounding whitespace and one trailing dot ("example.com." -> "example.com")
    - lowercases (DNS names are case-insensitive)
    - converts internationalised names to punycode ("bücher.de" -> "xn--bcher-kva.de")
    - rejects URLs, IP addresses, empty labels, bad characters, over-long names
    """
    if not isinstance(raw, str):
        raise InputValidationError(ErrorCode.INVALID_DOMAIN, "Domain must be a string.")
    if len(raw) > MAX_RAW_INPUT_LENGTH:
        raise InputValidationError(ErrorCode.INVALID_DOMAIN,
                                   f"Input too long (max {MAX_RAW_INPUT_LENGTH} characters).")

    name = raw.strip().lower()
    if name.endswith("."):
        name = name[:-1]
    if not name:
        raise InputValidationError(ErrorCode.INVALID_DOMAIN, "Domain must not be empty.")

    if any(ch.isspace() for ch in name):
        raise InputValidationError(ErrorCode.INVALID_DOMAIN, "Domain must not contain spaces.")
    if "://" in name or "/" in name or "?" in name or "#" in name or "@" in name:
        raise InputValidationError(
            ErrorCode.INVALID_DOMAIN,
            "Enter a bare domain such as 'example.com', not a URL or email address.")
    if ":" in name:
        raise InputValidationError(
            ErrorCode.INVALID_DOMAIN,
            "Domain must not contain ':' (ports and IPv6 addresses are not domain names).")

    # Internationalised domain names -> punycode
    if not name.isascii():
        try:
            name = name.encode("idna").decode("ascii")
        except UnicodeError as exc:
            raise InputValidationError(ErrorCode.INVALID_DOMAIN,
                                       f"Invalid internationalised domain name: {exc}")

    if len(name) > MAX_DOMAIN_LENGTH:
        raise InputValidationError(ErrorCode.INVALID_DOMAIN,
                                   f"Domain too long ({len(name)} > {MAX_DOMAIN_LENGTH} characters).")

    labels = name.split(".")
    for label in labels:
        if label == "":
            raise InputValidationError(ErrorCode.INVALID_DOMAIN,
                                       "Domain contains an empty label (check for '..' or a leading '.').")
        if len(label) > MAX_LABEL_LENGTH:
            raise InputValidationError(
                ErrorCode.INVALID_DOMAIN,
                f"Label '{label[:20]}...' is longer than {MAX_LABEL_LENGTH} characters.")
        if not _LABEL_RE.match(label):
            raise InputValidationError(
                ErrorCode.INVALID_DOMAIN,
                f"Invalid label '{label}': use only letters, digits and hyphens, "
                "and do not start or end a label with a hyphen.")

    # An all-numeric last label means this is an IPv4 address (or junk), never a real TLD.
    if labels[-1].isdigit():
        raise InputValidationError(
            ErrorCode.INVALID_DOMAIN,
            "That looks like an IP address. Enter a domain name instead.")

    return name


def validate_record_type(raw: object) -> str:
    """Return the upper-case record type, or raise InputValidationError."""
    if not isinstance(raw, str):
        raise InputValidationError(ErrorCode.INVALID_RECORD_TYPE, "Record type must be a string.")
    rtype = raw.strip().upper()
    if rtype not in SUPPORTED_RECORD_TYPES:
        raise InputValidationError(
            ErrorCode.INVALID_RECORD_TYPE,
            f"Unsupported record type '{raw.strip()[:20]}'. "
            f"Supported: {', '.join(SUPPORTED_RECORD_TYPES)}.")
    return rtype
