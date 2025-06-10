import { Context } from "hono";

async function queryDNS(domain: string, type: string): Promise<string | null> {
  const url = `https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/dns-json" }
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.Answer?.[0]?.data || null;
}

async function validateSPF(domain: string) {
  const record = await queryDNS(domain, "TXT");
  if (!record) return { status: "fail", record: null, recommendation: "No SPF record found." };
  if (!record.startsWith("v=spf1")) return { status: "fail", record, recommendation: "Invalid SPF record format." };
  return { status: "pass", record, recommendation: "SPF record looks good!" };
}

async function validateDKIM(domain: string) {
  const record = await queryDNS(domain, "TXT");
  if (!record) return { status: "fail", record: null, recommendation: "No DKIM record found." };
  if (!record.includes("k=rsa") && !record.includes("k=ed25519")) return { status: "warning", record, recommendation: "Check DKIM key format." };
  return { status: "pass", record, recommendation: "DKIM record looks good!" };
}

async function validateDMARC(domain: string) {
  const record = await queryDNS(`_dmarc.${domain}`, "TXT");
  if (!record) return { status: "fail", record: null, recommendation: "No DMARC record found." };
  if (!record.includes("p=")) return { status: "fail", record, recommendation: "Invalid DMARC record format." };
  return { status: "pass", record, recommendation: "DMARC record looks good!" };
}

export async function checkDomainHandler(c: Context) {
  const { domain } = await c.req.json();
  if (!domain || typeof domain !== "string") {
    return c.json({ error: "Invalid domain" }, 400);
  }

  const [spf, dkim, dmarc] = await Promise.all([
    validateSPF(domain),
    validateDKIM(domain),
    validateDMARC(domain)
  ]);

  return c.json({ domain, spf, dkim, dmarc });
} 