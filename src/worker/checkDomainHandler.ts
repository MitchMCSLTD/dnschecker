import { Context } from "hono";

interface DNSResponse {
  Answer?: Array<{ data: string }>;
}

async function queryDNS(domain: string, type: string): Promise<string[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/dns-json" }
  });
  if (!response.ok) return [];
  const data: DNSResponse = await response.json();
  return data.Answer?.map((answer: any) => answer.data.replace(/^"|"$/g, '')) || [];
}

function validateSPFMechanisms(record: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const mechanisms = record.split(" ").slice(1); // Skip v=spf1

  // Check for common issues
  if (mechanisms.length === 0) {
    issues.push("No SPF mechanisms defined");
  }

  // Check for all mechanism
  const hasAll = mechanisms.some(m => m === "all" || m === "-all" || m === "~all" || m === "?all");
  if (!hasAll) {
    issues.push("Missing 'all' mechanism");
  }

  // Check for valid mechanisms
  const validMechanisms = ["ip4:", "ip6:", "a:", "mx:", "include:", "exists:", "ptr:", "all"];
  const invalidMechanisms = mechanisms.filter(m => 
    !validMechanisms.some(vm => m.startsWith(vm)) && 
    !m.match(/^[?~-]?[a-z0-9._-]+$/)
  );
  
  if (invalidMechanisms.length > 0) {
    issues.push(`Invalid mechanisms found: ${invalidMechanisms.join(", ")}`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

async function validateSPF(domain: string) {
  const records = await queryDNS(domain, "TXT");
  const spfRecords = records.filter(record => record.startsWith("v=spf1"));
  
  if (spfRecords.length === 0) {
    return { 
      status: "fail", 
      record: null, 
      recommendation: "No SPF record found." 
    };
  }

  if (spfRecords.length > 1) {
    return { 
      status: "warning", 
      record: spfRecords[0], 
      recommendation: "Multiple SPF records found. Only the first one will be used." 
    };
  }

  const record = spfRecords[0];
  const validation = validateSPFMechanisms(record);
  
  if (!validation.valid) {
    return { 
      status: "fail", 
      record, 
      recommendation: `SPF record has issues: ${validation.issues.join(", ")}` 
    };
  }

  return { 
    status: "pass", 
    record, 
    recommendation: "SPF record looks good!" 
  };
}

function validateDKIMRecord(record: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for required DKIM tags
  const requiredTags = ["v", "k", "p"];
  const missingTags = requiredTags.filter(tag => !record.includes(`${tag}=`));
  
  if (missingTags.length > 0) {
    issues.push(`Missing required tags: ${missingTags.join(", ")}`);
  }

  // Validate key type
  if (!record.includes("k=rsa") && !record.includes("k=ed25519")) {
    issues.push("Invalid or missing key type (k=)");
  }

  // Validate public key
  const publicKeyMatch = record.match(/p=([A-Za-z0-9+/=]+)/);
  if (!publicKeyMatch) {
    issues.push("Missing or invalid public key (p=)");
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

async function validateDKIM(domain: string) {
  // Try common DKIM selectors
  const commonSelectors = ['default', 'mail', 'selector1', 'google', 'k1'];
  const allRecords: string[] = [];
  
  for (const selector of commonSelectors) {
    const records = await queryDNS(`${selector}._domainkey.${domain}`, "TXT");
    allRecords.push(...records);
  }

  const dkimRecords = allRecords.filter(record => 
    record.includes("v=DKIM1") || 
    record.includes("k=rsa") || 
    record.includes("k=ed25519")
  );
  
  if (dkimRecords.length === 0) {
    return { 
      status: "fail", 
      record: null, 
      recommendation: "No DKIM records found for common selectors." 
    };
  }

  if (dkimRecords.length > 1) {
    return { 
      status: "warning", 
      record: dkimRecords[0], 
      recommendation: "Multiple DKIM records found. Please verify all selectors are properly configured." 
    };
  }

  const record = dkimRecords[0];
  const validation = validateDKIMRecord(record);
  
  if (!validation.valid) {
    return { 
      status: "fail", 
      record, 
      recommendation: `DKIM record has issues: ${validation.issues.join(", ")}` 
    };
  }

  return { 
    status: "pass", 
    record, 
    recommendation: "DKIM record looks good!" 
  };
}

async function validateDMARC(domain: string) {
  const records = await queryDNS(`_dmarc.${domain}`, "TXT");
  const dmarcRecords = records.filter(record => record.includes("v=DMARC1"));

  if (dmarcRecords.length === 0) {
    return { status: "fail", record: null, recommendation: "No DMARC record found." };
  }

  if (dmarcRecords.length > 1) {
    return { status: "warning", record: dmarcRecords[0], recommendation: "Multiple DMARC records found. Only the first one will be used." };
  }

  const record = dmarcRecords[0];
  const issues: string[] = [];

  // Check for required p= tag and its valid values
  const policyMatch = record.match(/p=(none|quarantine|reject)/i);
  if (!policyMatch) {
    issues.push("Invalid DMARC policy (p=). Must be 'none', 'quarantine', or 'reject'.");
  }

  // Check for optional rua (reporting URI for aggregate reports) and ruf (reporting URI for forensic reports)
  if (!record.includes("rua=") && !record.includes("ruf=")) {
    issues.push("Consider adding 'rua' or 'ruf' tags for DMARC reporting.");
  }

  if (issues.length > 0) {
    return { status: "fail", record, recommendation: `DMARC record has issues: ${issues.join(", ")}` };
  }

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

  // Truncate DKIM record for display if it's too long
  if (dkim.record && dkim.record.length > 100) {
    const truncationLength = 30; // Show first 30 and last 30 characters
    dkim.record = `${dkim.record.substring(0, truncationLength)}...${dkim.record.substring(dkim.record.length - truncationLength)}`;
  }

  // M365 detection logic
  let m365 = false;
  if (
    (spf.record && spf.record.includes('include:spf.protection.outlook.com')) ||
    (dkim.record && dkim.record.includes('domainkey.microsoft.com'))
  ) {
    m365 = true;
  }

  return c.json({ domain, spf, dkim, dmarc, m365 });
} 