# DNS for Zion Network subdomains

The sites are live now on GitHub Pages:

- Zion Network: https://ziontechgroup.com/zion-network/
- Zion Agents: https://ziontechgroup.com/zion-agents/
- Zion Discovery: https://ziontechgroup.com/zion-discovery/
- Zion Plans: https://ziontechgroup.com/zion-plans/
- Zion Field: https://ziontechgroup.com/zion-field/
- Zion Status: https://ziontechgroup.com/zion-status/
- Zion Tools: https://ziontechgroup.com/zion-tools/
- Zion Portal: https://ziontechgroup.com/zion-portal/

`ziontechgroup.com` is already hosted on GitHub Pages. Nameservers are Cloudflare (`ingrid.ns.cloudflare.com`, `simon.ns.cloudflare.com`).

## Cloudflare records to add

Create **CNAME** records, **DNS only** (grey cloud, not proxied), each pointing at `zion-support.github.io`:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `network` | `zion-support.github.io` | DNS only |
| CNAME | `agents` | `zion-support.github.io` | DNS only |
| CNAME | `discovery` | `zion-support.github.io` | DNS only |
| CNAME | `plans` | `zion-support.github.io` | DNS only |
| CNAME | `field` | `zion-support.github.io` | DNS only |
| CNAME | `status` | `zion-support.github.io` | DNS only |
| CNAME | `tools` | `zion-support.github.io` | DNS only |
| CNAME | `portal` | `zion-support.github.io` | DNS only |

After DNS propagates, drop a `CNAME` file containing `tools.ziontechgroup.com` in each repo (or ask to flip custom domains). GitHub will then issue HTTPS certificates for the subdomains.

Do not orange-cloud these records until GitHub has issued the certificate — GitHub Pages custom domains expect a CNAME to `*.github.io`.
