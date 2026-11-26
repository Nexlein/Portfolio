# Security

Please report a vulnerability privately through GitHub: [Report a vulnerability](https://github.com/Nexlein/Portfolio/security/advisories/new) (Security tab → Advisories). Do not open a public issue.

The site is static: no accounts, no forms that store data, no server code. The production headers, including the Content-Security-Policy, are in `vercel.json` ([docs/architecture.md](docs/architecture.md#security-headers-and-csp)).
