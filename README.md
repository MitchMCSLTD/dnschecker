# Email DNS Checker

A powerful web application that helps you verify and validate email-related DNS records for any domain. This tool checks SPF, DKIM, and DMARC records to ensure your email configuration is secure and properly set up.

![Email DNS Checker](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fc7b4b62-442b-4769-641b-ad4422d74300/public)

## 🌟 Features

- **SPF Record Validation**: Checks if your Sender Policy Framework (SPF) record is properly configured
- **DKIM Record Verification**: Validates DomainKeys Identified Mail (DKIM) record setup
- **DMARC Record Analysis**: Ensures Domain-based Message Authentication, Reporting, and Conformance (DMARC) is correctly implemented
- **Real-time Results**: Instant feedback on your domain's email security configuration
- **Detailed Recommendations**: Provides actionable suggestions for improving your email security setup

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MitchMCSLTD/dnschecker.git
cd dnschecker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173)

## 💻 Usage

1. Enter a domain name in the input field (e.g., example.com)
2. Click "Check DNS" to analyze the domain's email-related DNS records
3. Review the results for SPF, DKIM, and DMARC configurations
4. Follow the recommendations to improve your email security setup

## 🛠️ Development

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy to Cloudflare Workers

```bash
npm run build && npm run deploy
```

## 🔧 Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Cloudflare Workers + Hono
- **Styling**: CSS Modules
- **Deployment**: Cloudflare Workers

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [SPF Record Documentation](https://www.cloudflare.com/learning/dns/dns-records/dns-spf-record/)
- [DKIM Documentation](https://www.cloudflare.com/learning/dns/dns-records/dns-dkim-record/)
- [DMARC Documentation](https://www.cloudflare.com/learning/dns/dns-records/dns-dmarc-record/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
