# Smart Document Parser

A fast, zero-config skill for extracting structured data from PDF documents using pattern matching.

## Description

Extract invoice data from PDFs into JSON format. Supports vendor detection, line items, totals, and dates with automatic currency detection.

## Requirements

- Node.js 18+
- Dependencies installed: `pdf-parse`

## Installation

```bash
npm install
```

## Usage

### CLI

```bash
# Basic usage
./cli.js --file invoice.pdf

# With pretty output
./cli.js --file invoice.pdf --pretty

# Save to file
./cli.js --file invoice.pdf --output result.json

# Full options
./cli.js --file ./docs/invoice.pdf --template invoice --pretty --output data.json
```

### Programmatic

```javascript
const { parseInvoice } = require('./parser');

const data = await parseInvoice('./path/to/invoice.pdf');
console.log(data);
```

## Output Format

```json
{
  "type": "invoice",
  "vendor": "Acme Corp",
  "invoiceNumber": "INV-2026-0429",
  "date": "2026-04-29",
  "dueDate": "2026-05-29",
  "lineItems": [
    {
      "qty": 2,
      "description": "Consulting Services",
      "price": 500.00,
      "total": 1000.00
    }
  ],
  "subtotal": 1000.00,
  "tax": 100.00,
  "total": 1100.00,
  "currency": "USD",
  "raw": {
    "text": "...first 5000 chars..."
  }
}
```

## Supported Templates

| Template | Description | Status |
|----------|-------------|--------|
| `invoice` | Standard invoices | ✅ MVP Ready |
| `receipt` | Purchase receipts | 🔜 Planned |
| `contract` | Simple contracts | 🔜 Planned |

## How It Works

1. Extracts raw text from PDF using `pdf-parse`
2. Applies regex patterns to identify: vendor, dates, line items, totals
3. Returns structured JSON with confidence values

## Limitations (MVP)

- Supports only standard invoice layouts
- May struggle with image-heavy PDFs
- Requires clear text (not scanned images without OCR)

## License

MIT
