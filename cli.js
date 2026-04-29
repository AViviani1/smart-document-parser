#!/usr/bin/env node
/**
 * Smart Document Parser CLI
 * Extract structured data from PDF documents
 */

const { parseInvoice } = require('./parser');
const fs = require('fs');
const path = require('path');

// Parse CLI arguments
function parseArgs(args) {
  const options = {
    file: null,
    template: 'invoice',
    output: null,
    pretty: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--template' || arg === '-t') {
      options.template = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--pretty' || arg === '-p') {
      options.pretty = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (!options.file && !arg.startsWith('-') && fs.existsSync(arg)) {
      options.file = arg;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
Smart Document Parser v1.0.0
Extract structured data from PDF documents

Usage:
  smart-document-parser --file <path> [--template <type>] [--output <path>]

Options:
  -f, --file <path>       Input PDF file (required)
  -t, --template <type>   Document type: invoice (default)
  -o, --output <path>     Output JSON file (default: stdout)
  -p, --pretty            Pretty print JSON output
  -h, --help              Show this help message

Examples:
  smart-document-parser -f invoice.pdf
  smart-document-parser --file invoice.pdf --template invoice --pretty
  smart-document-parser -f ./docs/invoice.pdf -o result.json
`);
}

function validateOptions(options) {
  if (!options.file) {
    console.error('Error: --file is required');
    showHelp();
    process.exit(1);
  }

  if (!fs.existsSync(options.file)) {
    console.error(`Error: File not found: ${options.file}`);
    process.exit(1);
  }

  if (!options.file.toLowerCase().endsWith('.pdf')) {
    console.error('Error: Only PDF files are supported');
    process.exit(1);
  }

  const validTemplates = ['invoice'];
  if (!validTemplates.includes(options.template)) {
    console.error(`Error: Unsupported template "${options.template}". Use: ${validTemplates.join(', ')}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  // Handle global error
  process.on('unhandledRejection', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const options = parseArgs(args);
  validateOptions(options);

  try {
    console.error(`Parsing ${options.file} with template: ${options.template}...`);
    
    let result;
    if (options.template === 'invoice') {
      result = await parseInvoice(options.file);
    }

    const jsonOutput = options.pretty 
      ? JSON.stringify(result, null, 2) 
      : JSON.stringify(result);

    if (options.output) {
      fs.writeFileSync(options.output, jsonOutput);
      console.error(`Output saved to: ${options.output}`);
    } else {
      console.log(jsonOutput);
    }

  } catch (err) {
    console.error('Error parsing document:', err.message);
    process.exit(1);
  }
}

main();
