import ipaddress


def enrich_ip(ip: str, country: str, city: str) -> dict:
    try:
        ip_obj = ipaddress.ip_address(ip)
    except ValueError:
        return {
            "ip": ip,
            "geo": {
                "country": country,
                "city": city
            },
            "asn": "Invalid IP",
            "reputation": "Unknown",
            "network_type": "unknown",
            "note": "The supplied IP address is not valid."
        }

    if ip_obj.is_private:
        return {
            "ip": ip,
            "geo": {
                "country": country,
                "city": city
            },
            "asn": "Internal Network",
            "reputation": "Internal",
            "network_type": "private",
            "note": "The IP address is part of a private/internal address space."
        }

    if ip.startswith("203.0.113."):
        return {
            "ip": ip,
            "geo": {
                "country": country,
                "city": city
            },
            "asn": "Example Hosting Provider",
            "reputation": "Suspicious",
            "network_type": "hosting",
            "note": "The IP appears to belong to hosting/VPN-style infrastructure often treated as higher risk."
        }

    if ip.startswith("8.8.8.") or ip.startswith("1.1.1."):
        return {
            "ip": ip,
            "geo": {
                "country": country,
                "city": city
            },
            "asn": "Public Resolver Provider",
            "reputation": "Neutral",
            "network_type": "public_infrastructure",
            "note": "The IP appears to belong to widely known public internet infrastructure."
        }

    return {
        "ip": ip,
        "geo": {
            "country": country,
            "city": city
        },
        "asn": "Generic ISP",
        "reputation": "Neutral",
        "network_type": "residential_or_unknown",
        "note": "No strong enrichment signals were identified from the local mock enrichment logic."
    }


def enrich_domain(domain: str, newly_registered_domain: bool) -> dict:
    if newly_registered_domain:
        return {
            "domain": domain,
            "reputation": "Suspicious",
            "category": "new_domain",
            "note": "The sender domain appears newly registered, which is a common phishing risk signal."
        }

    if domain.endswith(".ru") or domain.endswith(".zip"):
        return {
            "domain": domain,
            "reputation": "Suspicious",
            "category": "high_risk_tld",
            "note": "The sender domain uses a TLD that may warrant additional scrutiny in phishing workflows."
        }

    return {
        "domain": domain,
        "reputation": "Neutral",
        "category": "standard_domain",
        "note": "No strong domain-based risk indicators were identified from the local mock enrichment logic."
    }
