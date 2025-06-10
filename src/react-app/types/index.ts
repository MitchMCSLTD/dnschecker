export interface DNSCheckResult {
  domain: string;
  spf: RecordResult;
  dkim: RecordResult;
  dmarc: RecordResult;
}

export interface RecordResult {
  status: 'pass' | 'fail' | 'warning';
  record?: string;
  recommendation: string;
  details?: string;
} 