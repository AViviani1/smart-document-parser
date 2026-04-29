/**
 * Smart Document Parser Core
 * Extract structured data from PDF documents
 */

const pdf = require('pdf-parse');
const fs = require('fs');

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdf(dataBuffer);
  return pdfData.text;
}

/**
 * Parse ISO date from various formats
 * @param {string} dateStr - Date string
 * @returns {string|null} ISO date or null
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const patterns = [
    // ISO format: 2026-04-29
    /(\d{4})-(\d{2})-(\d{2})/,
    // US format: 04/29/2026
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // EU format: 29.04.2026
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    // Written: 29 Apr 2026 or April 29, 2026
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s*(\d{4})/i
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      if (pattern.toString().includes('Jan')) {
        const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
                         jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
        const day = match[1].padStart(2, '0');
        const month = String(months[match[2].toLowerCase()]).padStart(2, '0');
        return `${match[3]}-${month}-${day}`;
      } else if (match[3].length === 4) {
        // YYYY-MM-DD or similar with year last
        if (parseInt(match[3]) > 31) {
          const day = match[2].padStart(2, '0');
          const month = match[1].padStart(2, '0');
          return `${match[3]}-${month}-${day}`;
        }
      }
      return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }
  }
  return null;
}

/**
 * Parse currency amount
 * @param {string} amountStr - Amount string
 * @returns {number|null} Parsed amount
 */
function parseAmount(amountStr) {
  if (!amountStr) return null;
  const cleaned = amountStr.replace(/[$€£¥,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Detect currency from text
 * @param {string} text - Text to analyze
 * @returns {string} Currency code
 */
function detectCurrency(text) {
  if (text.includes('€') || /EUR|Euro/i.test(text)) return 'EUR';
  if (text.includes('£') || /GBP|Pound/i.test(text)) return 'GBP';
  if (text.includes('¥') || /JPY|Yen/i.test(text)) return 'JPY';
  if (text.includes('CHF') || /Swiss/i.test(text)) return 'CHF';
  if (text.includes('$') || /USD|\$|dollar/i.test(text)) return 'USD';
  return 'USD';
}

/**
 * Extract line items from invoice text
 * @param {string} text - Invoice text
 * @returns {Array} Line items
 */
function extractLineItems(text) {
  const items = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 10);
  
  // Pattern for lines with: qty x description @ price = total
  // or: description qty price total
  const itemPatterns = [
    // 2 x Product @ $500.00
    /(\d+)\s*x\s*([^@]+)@\s*[$€£]?\s*([\d,.]+)/i,
    // Product ...... $500.00
    /^([^$\d]{5,40})\s+[\d.,]+\s*$m?\s*[$€£]?\s*([\d,.]+)/,
  ];

  // Simple heuristic: look for rows with pricing
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers and totals
    if (/total|subtotal|tax|balance|amount due/i.test(line)) continue;
    
    // Look for patterns
    const qtyMatch = line.match(/(\d+)\s*x/i);
    const priceMatches = [...line.matchAll(/[$€£]?\s*([\d,]+\.?\d*)\s*(?:[$€£])?/g)];
    
    if (qtyMatch && priceMatches.length >= 1) {
      const qty = parseInt(qtyMatch[1]);
      const prices = priceMatches.map(m => parseAmount(m[1])).filter(p => p !== null);
      
      if (prices.length >= 2) {
        const price = prices[0];
        const total = prices[prices.length - 1];
        
        // Extract description (everything between qty and first price)
        let desc = line
          .replace(/\d+\s*x\s*/i, '')
          .replace(/[$€£]?\s*[\d,]+\.?\d*\s*(?:[$€£])?/g, '')
          .replace(/[@=:,]/g, '')
          .trim()
          .substring(0, 60);
        
        if (desc.length > 3 && qty > 0 && price > 0) {
          items.push({
            qty: qty,
            description: desc.substring(0, 50),
            price: price,
            total: total
          });
        }
      }
    }
  }

  return items.slice(0, 20); // Limit to 20 items max
}

/**
 * Extract vendor name from invoice text
 * @param {string} text - Invoice text
 * @returns {string|null} Vendor name
 */
function extractVendor(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && l.length < 100);
  
  // Look for company indicators
  const companyPatterns = [
    /^(.*?)(?:\s+LTD|LLC|Inc|Corp|GmbH|S\.r\.l|S\.p\.A|Ltd\.)/i,
    /(?:From|Bill From|Vendor|Sold By)[\s:]+([^\n]+)/i,
  ];
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 50);
    }
  }
  
  // Fallback: first non-empty line that looks like a company name
  for (const line of lines) {
    if (line.length > 3 && line.length < 40 && 
        !/invoice|date|total|page|\d{2}[/.-]\d{2}[/.-]\d{2,4}/i.test(line)) {
      return line;
    }
  }
  
  return null;
}

/**
 * Extract invoice number
 * @param {string} text - Invoice text
 * @returns {string|null} Invoice number
 */
function extractInvoiceNumber(text) {
  const patterns = [
    /(?:Invoice|Inv)[\s#]*([\w-]+)/i,
    /(?:Invoice|INVOICE)[\s.#\-:]+([A-Z0-9-]{3,20})/i,
    /#?INV[-\s]?([\dA-Z-]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Parse invoice data from PDF
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} Structured invoice data
 */
async function parseInvoice(filePath) {
  const text = await extractTextFromPDF(filePath);
  const currency = detectCurrency(text);
  const lines = text.split('\n');
  
  // Extract dates from text
  const dateMatches = [...text.matchAll(/\d{2}[/.-]\d{2}[/.-]\d{2,4}|\d{4}[/.-]\d{2}[/.-]\d{2}/g)];
  const dates = dateMatches.map(m => parseDate(m[0])).filter(d => d);
  
  // Extract totals / amounts
  const totalPatterns = [
    /(?:Total|Grand Total|Balance|Due)[\s$€£]+([\d,.]+)/i,
    /(?:Total|Amount)[^\n]*[$€£]?\s*([\d,.]{3,})/i,
  ];
  
  let total = null;
  let subtotal = null;
  let tax = null;
  
  for (const pattern of totalPatterns) {
    const matches = [...text.matchAll(pattern)];
    const amounts = matches.map(m => parseAmount(m[1])).filter(a => a !== null);
    if (amounts.length >= 1) {
      total = amounts[amounts.length - 1];
      if (amounts.length >= 2) {
        subtotal = amounts[amounts.length - 2];
      }
    }
  }
  
  // Look for subtotal and tax separately
  const subMatch = text.match(/(?:Subtotal|Sub-total)[\s$€£]+([\d,.]+)/i);
  const taxMatch = text.match(/(?:Tax|VAT|Sales Tax)[\s$€£]+([\d,.]+)/i);
  
  if (subMatch) subtotal = parseAmount(subMatch[1]);
  if (taxMatch) tax = parseAmount(taxMatch[1]);
  
  // Extract line items
  const lineItems = extractLineItems(text);
  
  return {
    type: 'invoice',
    vendor: extractVendor(text),
    invoiceNumber: extractInvoiceNumber(text),
    date: dates[0] || null,
    dueDate: dates[1] || null,
    lineItems: lineItems.length > 0 ? lineItems : [],
    subtotal: subtotal || (lineItems.length > 0 ? lineItems.reduce((sum, i) => sum + (i.total || 0), 0) : null),
    tax: tax,

    total: total || (subtotal ? subtotal + (tax || 0) : null),
    currency: currency,
    raw: {
      text: text.substring(0, 5000)
    }
  };
}

module.exports = {
  parseInvoice,
  extractTextFromPDF,
  parseDate,
  parseAmount,
  detectCurrency
};
