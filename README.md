# Smart Document Parser

Extract structured data from PDF invoices. MVP ready for ClawHub.

## Quick Start

```bash
npm install
node cli.js --file invoice.pdf --pretty
```

## Output

```json
{
  "type": "invoice",
  "vendor": "Tech Solutions Inc.",
  "invoiceNumber": "INV-2026-0429",
  "date": "2026-04-29",
  "total": 2856.70,
  "currency": "USD",
  "lineItems": [...]
}
```

## Features

- PDF text extraction
- Regex-based field detection
- JSON output
- Zero config

## Install

```bash
git clone <repo>
cd smart-document-parser
npm install
```

## Usage

```bash
./cli.js --file invoice.pdf --template invoice --pretty --output result.json
```

## License

MIT
