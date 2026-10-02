"""Real trace against the live DNS network.  Usage: python smoke_step3.py [domain] [type]"""
import sys

from engine.resolver import Resolver

domain = sys.argv[1] if len(sys.argv) > 1 else "google.com"
rtype = (sys.argv[2] if len(sys.argv) > 2 else "A").upper()

res = Resolver().resolve(domain, rtype)
print(f"Trace for {domain} {rtype}\n")
print(f"{'#':>2}  {'TYPE':<13} {'SERVER':<16} {'RESPONSE':<9} {'MS':>8}  {'TTL':>7}  TRANSPORT")
for s in res.steps:
    sub = "  (sub-resolution)" if s.sub_resolution else ""
    print(f"{s.step:>2}  {s.server_type.value:<13} {s.server:<16} {s.response.value:<9} "
          f"{s.response_time_ms:>8.2f}  {str(s.ttl):>7}  {s.transport.value}{sub}")
print("\nFinal answer:")
for r in res.final_records:
    print(f"   {r.name} {r.ttl} {r.type} {r.value}")
if res.error:
    print(f"\nError: {res.error.code.value}: {res.error.message}")
