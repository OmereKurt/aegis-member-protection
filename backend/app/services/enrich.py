def enrich_ip(ip: str, country: str, city: str) -> dict:
    return {
        "ip": ip,
        "geo": {
            "country": country,
            "city": city
        },
        "asn": "Unknown",
        "reputation": "Not yet implemented"
    }
