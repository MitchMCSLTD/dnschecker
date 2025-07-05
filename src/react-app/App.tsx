// src/App.tsx

import { useState } from "react";
import "./App.css";
import { DNSCheckResult, RecordResult } from "./types";
import mcsltdLogo from './assets/mcsltd-logo.png';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

function App() {
  const [domain, setDomain] = useState("");
  const [results, setResults] = useState<DNSCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const responsePromise = fetch("/api/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const [response] = await Promise.all([responsePromise, minDelay]);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check domain");
      }
      const data: DNSCheckResult = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: RecordResult['status']) => {
    switch (status) {
      case "pass":
        return { backgroundColor: "#10B981", color: "white", padding: "4px 8px", borderRadius: "4px" }; // Green
      case "fail":
        return { backgroundColor: "#EF4444", color: "white", padding: "4px 8px", borderRadius: "4px" }; // Red
      case "warning":
        return { backgroundColor: "#F59E0B", color: "white", padding: "4px 8px", borderRadius: "4px" }; // Yellow/Orange
      default:
        return {};
    }
  };

  return (
    <div className="App">
      <img src={mcsltdLogo} alt="MCSLTD Logo" style={{ width: '50%' }} />
      <h1>Email DNS Checker</h1>
      <p>Email authentication technologies like SPF, DKIM, and DMARC are crucial for protecting your domain from email spoofing, phishing, and spam. They help ensure that emails sent from your domain are legitimate and that receiving mail servers can verify their authenticity. Implementing these records enhances your email deliverability and builds trust with recipients.</p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 400 }}>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain (e.g., example.com)"
            style={{ flex: 1, fontSize: '1.25rem', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
            aria-label="Domain name"
          />
          <span title="A domain is the address of a website, like example.com" style={{ marginLeft: 8, color: '#4299e1', cursor: 'pointer' }}>
            <FaInfoCircle aria-label="What is a domain?" />
          </span>
        </div>
        <button
          onClick={handleCheck}
          disabled={loading}
          style={{ marginTop: 16, width: '100%', maxWidth: 400, fontSize: '1.25rem', padding: '0.75rem', borderRadius: 8 }}
        >
          {loading ? "Checking..." : "Check DNS"}
        </button>
        <div style={{ color: '#888', fontSize: '0.95rem', marginTop: 8, maxWidth: 400, textAlign: 'left' }}>
          Enter the domain you want to check (e.g., yourcompany.com).
        </div>
      </div>
      {loading && (
        <div className="spinner" style={{ margin: '1rem auto' }} aria-label="Loading">
          <div className="lds-dual-ring"></div>
        </div>
      )}
      {error && (
        <div className="feedback-message error">
          <FaTimesCircle aria-label="Error" style={{ color: '#e53e3e', marginRight: 8, verticalAlign: 'middle' }} />
          <span>{error}</span>
        </div>
      )}
      {results && (
        <div className="results fade-in">
          <h2>Results for {results.domain}</h2>
          <div className="result-card" style={{ marginBottom: '2rem' }}>
            <h3>SPF</h3>
            <p>Status: <span style={getStatusStyle(results.spf.status)}>
              {results.spf.status === 'pass' && <FaCheckCircle aria-label="Pass" style={{ color: '#10B981', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.spf.status === 'fail' && <FaTimesCircle aria-label="Fail" style={{ color: '#EF4444', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.spf.status === 'warning' && <FaExclamationTriangle aria-label="Warning" style={{ color: '#F59E0B', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.spf.status}
            </span></p>
            <p>Record: {results.spf.record || "N/A"}</p>
            <p>Recommendation: {results.spf.recommendation}</p>
            {results.m365 && (results.spf.status === 'fail' || results.spf.status === 'warning') && (
              <div className="m365-guidance-card" style={{
                background: '#e6f0fa',
                border: '1px solid #4299e1',
                borderRadius: 12,
                padding: '1rem',
                marginTop: 12,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <FaInfoCircle style={{ color: '#4299e1', fontSize: 24 }} />
                <div>
                  <strong>Need help fixing SPF for Microsoft 365?</strong>
                  <div style={{ marginTop: 4 }}>
                    <a href="https://your-m365-help-page.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline', marginRight: 12 }}>Read our M365 setup guide</a>
                    <a href="https://youtube.com/your-m365-video" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>Watch the video</a>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="divider"></div>
          <div className="result-card" style={{ marginBottom: '2rem' }}>
            <h3>DKIM</h3>
            <p>Status: <span style={getStatusStyle(results.dkim.status)}>
              {results.dkim.status === 'pass' && <FaCheckCircle aria-label="Pass" style={{ color: '#10B981', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.dkim.status === 'fail' && <FaTimesCircle aria-label="Fail" style={{ color: '#EF4444', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.dkim.status === 'warning' && <FaExclamationTriangle aria-label="Warning" style={{ color: '#F59E0B', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.dkim.status}
            </span></p>
            <p>Record: {results.dkim.record || "N/A"}</p>
            <p>Recommendation: {results.dkim.recommendation}</p>
            {results.m365 && (results.dkim.status === 'fail' || results.dkim.status === 'warning') && (
              <div className="m365-guidance-card" style={{
                background: '#e6f0fa',
                border: '1px solid #4299e1',
                borderRadius: 12,
                padding: '1rem',
                marginTop: 12,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <FaInfoCircle style={{ color: '#4299e1', fontSize: 24 }} />
                <div>
                  <strong>Need help fixing DKIM for Microsoft 365?</strong>
                  <div style={{ marginTop: 4 }}>
                    <a href="https://your-m365-help-page.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline', marginRight: 12 }}>Read our M365 setup guide</a>
                    <a href="https://youtube.com/your-m365-video" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>Watch the video</a>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="divider"></div>
          <div className="result-card">
            <h3>DMARC</h3>
            <p>Status: <span style={getStatusStyle(results.dmarc.status)}>
              {results.dmarc.status === 'pass' && <FaCheckCircle aria-label="Pass" style={{ color: '#10B981', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.dmarc.status === 'fail' && <FaTimesCircle aria-label="Fail" style={{ color: '#EF4444', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.dmarc.status === 'warning' && <FaExclamationTriangle aria-label="Warning" style={{ color: '#F59E0B', marginRight: 4, verticalAlign: 'middle' }} />}
              {results.dmarc.status}
            </span></p>
            <p>Record: {results.dmarc.record || "N/A"}</p>
            <p>Recommendation: {results.dmarc.recommendation}</p>
            {results.m365 && (results.dmarc.status === 'fail' || results.dmarc.status === 'warning') && (
              <div className="m365-guidance-card" style={{
                background: '#e6f0fa',
                border: '1px solid #4299e1',
                borderRadius: 12,
                padding: '1rem',
                marginTop: 12,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <FaInfoCircle style={{ color: '#4299e1', fontSize: 24 }} />
                <div>
                  <strong>Need help fixing DMARC for Microsoft 365?</strong>
                  <div style={{ marginTop: 4 }}>
                    <a href="https://your-m365-help-page.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline', marginRight: 12 }}>Read our M365 setup guide</a>
                    <a href="https://youtube.com/your-m365-video" target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>Watch the video</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
