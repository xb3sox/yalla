# Security Policy

## Supported versions

Yalla is a single-deployment product; only the latest released version on the
`main` branch receives security fixes.

| Version | Supported |
| --- | --- |
| Latest `main` | Yes |
| Older releases | No |

## Reporting a vulnerability

**Do not open a public issue, pull request, or discussion for a security problem.**

Report privately through
[GitHub Security Advisories](https://github.com/xb3sox/yalla/security/advisories/new).
Include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- Affected endpoints, versions, or configuration.
- Any suggested remediation.

## Our commitment

| Stage | Target |
| --- | --- |
| Acknowledge report | 3 business days |
| Triage and severity assessment | 10 business days |
| Fix or documented mitigation | Based on severity, agreed with the reporter |

We will keep you informed as the report progresses and credit you in the
advisory unless you prefer to stay anonymous. Please allow us time to ship a
fix before any public disclosure.

## Scope

In scope:

- The web application, REST API, and authentication/session handling.
- Payment and webhook processing.
- Access control and cross-tenant data isolation.
- Handling of personal data, including venue and check-in information.

Out of scope:

- Findings from automated scanners without a demonstrated impact.
- Missing hardening headers with no exploit path.
- Social engineering, physical access, or denial-of-service by volume.
- Vulnerabilities in third-party services (report those upstream).

## Safe harbor

Good-faith research that respects this policy, avoids privacy violations and
service disruption, and only touches accounts you own will not be pursued
legally. Contact us before testing anything that could affect real users or data.
