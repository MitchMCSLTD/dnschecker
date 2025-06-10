// src/App.tsx

import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
import honoLogo from "./assets/hono.svg";
import "./App.css";
import { DNSCheckResult, RecordResult } from "./types";

function App() {
  const [domain, setDomain] = useState("");
  const [results, setResults] = useState<DNSCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      if (!response.ok) {
        throw new Error("Failed to check domain");
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
      <h1>Email DNS Checker</h1>
      <div>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="Enter domain (e.g., example.com)"
        />
        <button onClick={handleCheck} disabled={loading}>
          {loading ? "Checking..." : "Check DNS"}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {results && (
        <div className="results">
          <h2>Results for {results.domain}</h2>
          <h3>SPF</h3>
          <p>Status: <span style={getStatusStyle(results.spf.status)}>{results.spf.status}</span></p>
          <p>Record: {results.spf.record || "N/A"}</p>
          <p>Recommendation: {results.spf.recommendation}</p>
          <h3>DKIM</h3>
          <p>Status: <span style={getStatusStyle(results.dkim.status)}>{results.dkim.status}</span></p>
          <p>Record: {results.dkim.record || "N/A"}</p>
          <p>Recommendation: {results.dkim.recommendation}</p>
          <h3>DMARC</h3>
          <p>Status: <span style={getStatusStyle(results.dmarc.status)}>{results.dmarc.status}</span></p>
          <p>Record: {results.dmarc.record || "N/A"}</p>
          <p>Recommendation: {results.dmarc.recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default App;
